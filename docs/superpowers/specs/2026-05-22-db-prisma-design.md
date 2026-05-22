# DB/Prisma Setup — Design Spec

Date: 2026-05-22
Status: Approved (pending user review of this document)

## 1. Goal

mock `src/lib/posts.ts`를 Supabase Postgres + Prisma 기반 실제 DB 쿼리로 교체한다. 읽기 경로(`/`, `/posts`, `/posts/[slug]`)가 DB의 글을 가져와 렌더링하는 상태가 종착점.

## 2. Scope

### In scope

- Supabase 단일 프로젝트 연결 (Pooler URL + Direct URL)
- Prisma schema 작성: `Post`, `Tag` 모델, 다대다 관계
- 첫 마이그레이션 (`init`) 생성/적용
- `prisma/seed.ts`로 mock 데이터 3개 글 + 5개 태그 시드
- Prisma Client 싱글톤 (`src/lib/db.ts`, Next.js dev HMR 안전)
- `src/lib/posts.ts` 재작성 — Prisma 호출 사용, **공개 함수 시그니처 동일 유지**
- `.env.example`의 `DATABASE_URL` / `DIRECT_URL` 항목 활용 (이미 존재)
- `package.json` 스크립트 정비 (`postinstall: prisma generate`, `build: prisma migrate deploy && next build`, `prisma.seed: tsx prisma/seed.ts`)

### Out of scope (next specs)

- `content` (TipTap JSON) 컬럼 — 에디터 스펙에서 ALTER로 추가
- `User`, `Account`, `Session`, `VerificationToken` — NextAuth 스펙
- 별도 dev Supabase 프로젝트 분리 — NextAuth 스펙 또는 이후
- draft 글 어드민 미리보기 — 에디터/admin 스펙
- 캐시 전략(`unstable_cache`, ISR 등) — 성능 튜닝 시점에

## 3. ⚠️ Intended Risk: Single Shared Supabase Project

dev 환경과 prod 환경이 동일한 Supabase Postgres를 공유한다. 1인 블로그라 수용 가능하지만:

- 로컬에서 `prisma migrate dev` 또는 `db seed`를 잘못 실행하면 prod 데이터에도 즉시 영향
- 초기에는 prod에 데이터가 없어 위험 낮음
- **NextAuth 스펙에 들어가기 전에 dev 전용 Supabase 프로젝트로 분리하는 것을 권장**

이 스펙 §13에 follow-up 항목으로 명시한다.

## 4. Prisma Schema

`prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Post {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String
  contentHtml String
  published   Boolean  @default(true)
  publishedAt DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tags        Tag[]    @relation("PostTags")

  @@index([published, publishedAt(sort: Desc)])
}

model Tag {
  id    String @id @default(cuid())
  name  String
  slug  String @unique
  posts Post[] @relation("PostTags")
}
```

### Field rationale

- `id`: cuid 사용. UUIDv4 대비 짧고 시계열성 있음.
- `slug @unique`: URL 키.
- `contentHtml`: 이번 스펙의 본문 저장 형식. TipTap JSON은 에디터 스펙에서 추가.
- `published`: 기본값 `true`. 에디터 스펙 도입 시 기본값을 `false`로 바꾸는 것을 고려.
- `publishedAt`: 명시적으로 입력. seed에서 mock 데이터 날짜로 채움.
- `createdAt` / `updatedAt`: 자동 관리.
- 복합 인덱스 `(published, publishedAt desc)`: 목록 쿼리 (`WHERE published = true ORDER BY publishedAt DESC`)에 최적.

### Tag

- `name`: 표시용 (예: "TypeScript")
- `slug`: URL용 (예: "typescript")
- `posts`: M:N 관계, 명시적 join 테이블 없이 Prisma가 `_PostTags`를 자동 생성

## 5. Directory Structure (changes)

```
prisma/
  schema.prisma           # 신규
  seed.ts                 # 신규
  migrations/             # prisma migrate dev가 생성
    YYYYMMDDHHMMSS_init/
      migration.sql
src/
  lib/
    db.ts                 # 신규: PrismaClient 싱글톤
    posts.ts              # 수정: Prisma 호출로 재작성
.env.local                # 사용자가 채움 (커밋 금지)
package.json              # 수정: scripts + prisma.seed 설정
```

## 6. `src/lib/db.ts` — Prisma Client Singleton

Next.js dev 모드에서 HMR이 `PrismaClient`를 매번 새로 만들면 connection 누수가 발생한다. globalThis 캐싱으로 방지.

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

## 7. `src/lib/posts.ts` — Rewrite Using Prisma

공개 export는 변경 없음 (`Post` 타입, `getPosts`, `getPost`). 호출부(`(public)/page.tsx`, `(public)/posts/page.tsx`, `(public)/posts/[slug]/page.tsx`)는 손대지 않는다.

```ts
import { db } from "./db";

export type Post = {
  slug: string;
  title: string;
  description: string;
  contentHtml: string;
  publishedAt: string;
  tags: string[];
};

type PostRow = {
  slug: string;
  title: string;
  description: string;
  contentHtml: string;
  publishedAt: Date;
  tags: { name: string }[];
};

function toPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    contentHtml: row.contentHtml,
    publishedAt: row.publishedAt.toISOString(),
    tags: row.tags.map((t) => t.name),
  };
}

export async function getPosts(): Promise<Post[]> {
  const rows = await db.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      description: true,
      contentHtml: true,
      publishedAt: true,
      tags: { select: { name: true } },
    },
  });
  return rows.map(toPost);
}

export async function getPost(slug: string): Promise<Post | null> {
  const row = await db.post.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      description: true,
      contentHtml: true,
      published: true,
      publishedAt: true,
      tags: { select: { name: true } },
    },
  });
  if (!row || !row.published) return null;
  return toPost(row);
}
```

Note: `getPost`는 unpublished 글을 404 처리(`return null`) — admin 미리보기는 별도 스펙.

## 8. Seed Script

`prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TAGS = [
  { slug: "meta", name: "meta" },
  { slug: "typescript", name: "typescript" },
  { slug: "tooling", name: "tooling" },
  { slug: "next", name: "next" },
  { slug: "architecture", name: "architecture" },
];

const POSTS = [
  {
    slug: "hello-world",
    title: "Hello, world",
    description: "첫 번째 글 — 블로그를 만든 이유에 관해.",
    contentHtml: "<p>이 블로그는 내가 배우고 만든 것들을 기록하는 공간이다.</p>",
    publishedAt: new Date("2026-05-01T00:00:00.000Z"),
    tagSlugs: ["meta"],
  },
  {
    slug: "typescript-strict-mode",
    title: "TypeScript strict mode를 켜야 하는 이유",
    description: "타입 안정성과 리팩토링 안전성 사이의 관계.",
    contentHtml: "<p>strict 모드는 단순한 옵션이 아니라 개발 문화의 선택이다.</p>",
    publishedAt: new Date("2026-05-10T00:00:00.000Z"),
    tagSlugs: ["typescript", "tooling"],
  },
  {
    slug: "next-app-router-server-components",
    title: "App Router에서 서버 컴포넌트를 기본값으로",
    description: "클라이언트 컴포넌트는 잎(leaf)에만 둔다.",
    contentHtml: "<p>서버에서 데이터에 직접 접근할 수 있다면, 그렇게 한다.</p>",
    publishedAt: new Date("2026-05-18T00:00:00.000Z"),
    tagSlugs: ["next", "architecture"],
  },
];

async function main() {
  for (const t of TAGS) {
    await db.tag.upsert({
      where: { slug: t.slug },
      update: { name: t.name },
      create: t,
    });
  }
  for (const p of POSTS) {
    const { tagSlugs, ...rest } = p;
    await db.post.upsert({
      where: { slug: p.slug },
      update: {
        ...rest,
        tags: { set: tagSlugs.map((slug) => ({ slug })) },
      },
      create: {
        ...rest,
        tags: { connect: tagSlugs.map((slug) => ({ slug })) },
      },
    });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
```

재실행 안전(upsert).

## 9. Environment Variables

`.env.example`은 이미 다음 두 키를 포함(이번 스펙에서 추가 변경 없음):

```
DATABASE_URL=
DIRECT_URL=
```

`.env.local` (커밋 금지)에 사용자가 채울 값 형식:

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

- `DATABASE_URL`: Supabase Pooler (Transaction mode), 포트 6543, `pgbouncer=true` 필수
- `DIRECT_URL`: Pooler Session mode 또는 Direct connection, 포트 5432 — `prisma migrate`에서 prepared statement 사용 위해 필요

Vercel 배포 시 같은 두 키를 프로젝트 환경변수에 등록.

## 10. Migration Workflow

### Local first-time setup

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### Subsequent schema changes

```bash
pnpm prisma migrate dev --name <descriptive_name>
```

### Production (Vercel build step)

`package.json` `scripts.build`에 `prisma migrate deploy && next build`를 명시 → Vercel 빌드 시 자동 적용.

### Caveat (§3 위험 재강조)

단일 프로젝트 공유라 `migrate dev` 시점에 prod에도 적용됨. 첫 마이그레이션은 prod에 데이터가 없어 안전하지만, 이후 schema 변경은 dev/prod 분리 후에 진행하는 것을 강력 권장.

## 11. `package.json` Changes

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma migrate deploy && next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

추가 의존성:
- `prisma` (devDependencies)
- `@prisma/client` (dependencies)
- `tsx` (devDependencies, seed 스크립트 실행용)

## 12. Acceptance Criteria

이 스펙이 "완료"되었다고 부를 조건:

1. `prisma/schema.prisma`가 §4 형태로 존재하고 유효
2. `pnpm prisma migrate dev --name init`이 성공, `migrations/` 디렉토리 생성
3. `pnpm prisma db seed`가 3개 Post와 5개 Tag를 입력, 재실행 시에도 idempotent
4. `pnpm dev` 후 `/` → 시드된 글 3개 목록, `/posts` → 동일, `/posts/hello-world` → 시드된 본문 렌더
5. `/posts/does-not-exist` → 404
6. `pnpm build` 성공 (`postinstall`로 `prisma generate`, `build` 중 `migrate deploy` 호출)
7. `pnpm typecheck`, `pnpm lint` 통과
8. `src/lib/posts.ts`의 공개 export 시그니처가 베이스 스캐폴딩과 동일 (호출부 무수정)
9. Prisma Studio (`pnpm prisma studio`)로 데이터 확인 가능

## 13. Follow-up (다음 스펙에서 정의)

- `content` (TipTap JSON) 컬럼 ALTER 마이그레이션 + 에디터/admin UI
- `User`, `Account`, `Session`, `VerificationToken` 모델 + NextAuth 통합
- **dev 전용 Supabase 프로젝트 분리** (§3 위험 해소) — NextAuth 스펙 이전에 진행 권장
- 캐시 전략(ISR, `unstable_cache`)

## 14. Risks & Open Questions

- **Prisma client edge runtime 호환성**: Vercel Edge runtime은 Prisma Postgres Driver Adapter가 필요. 이번 스펙은 모두 Node runtime에서 동작하므로 무관. Edge에서 DB 호출하려면 추후 별도 스펙.
- **Connection pool 누수**: `db.ts` 싱글톤이 dev HMR에서 동작하지만, `tsx prisma/seed.ts`는 별도 프로세스라 명시적으로 `$disconnect()`. 누수 위험 없음.
- **Supabase Pooler URL의 `pgbouncer=true`**: prepared statement 사용 시 충돌. Prisma 6+는 Pooler 호환 모드 자동 감지하지만 `DIRECT_URL`을 migrate에 사용해 회피.
- **Seed의 `tagSlugs.map(({slug}))`**: tags가 사전 존재해야 connect 가능 → 코드 순서상 Tags 먼저 upsert.
