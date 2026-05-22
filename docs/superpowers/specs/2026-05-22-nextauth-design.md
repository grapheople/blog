# NextAuth + Admin Guard — Design Spec

Date: 2026-05-22
Status: Approved (pending user review of this document)

## 1. Goal

GitHub OAuth로 로그인 가능하게 하고, `ADMIN_GITHUB_ID` 환경변수에 매칭되는 한 사람만 세션에 `isAdmin: true`를 부여한다. `/admin/**` 경로는 미들웨어로 가드하며, `/admin`에 placeholder 페이지와 헤더 sign-in/out UI를 만든다.

이 스펙이 끝나면 admin이 자기 자신을 로그인하고 `/admin`에 진입할 수 있고, 비-admin은 어떤 수단으로도 들어갈 수 없다.

## 2. Scope

### In scope

- NextAuth v5 (Auth.js) 셋업
- `@auth/prisma-adapter` 통합, 세션 strategy = `database`
- Prisma schema에 NextAuth 표준 4개 모델(User, Account, Session, VerificationToken) 추가
- Prisma 마이그레이션 `add_auth_tables`
- `/api/auth/[...nextauth]/route.ts` 핸들러
- `src/middleware.ts`로 `/admin/**` 가드
- `/signin` 커스텀 페이지 (GitHub 로그인 버튼 + error UI)
- `/admin/page.tsx` placeholder (세션 정보 표시용)
- 헤더에 sign-in 링크 / 로그인 상태에서 sign-out 버튼
- `signIn` 콜백에서 admin 외 계정 거부 (`return false`)
- TypeScript module augmentation으로 `Session.user.isAdmin` 타입 추가
- `.env.example`의 5개 키 활용 (이미 있음): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_ID`

### Out of scope (next specs)

- `/admin` 진짜 대시보드(글 목록, 통계, 검색 등)
- TipTap 에디터 + 글 CRUD API + 이미지 업로드
- 만료된 Account/Session row GC
- 비-admin OAuth 시도가 남긴 stale User/Account 정리
- 별도 dev Supabase 프로젝트 분리 (이전 DB 스펙과 동일한 follow-up)

## 3. Sign-in Flow

```
[비로그인]                       [로그인 상태]
   ↓                                ↓
 헤더 "sign in" 링크              헤더 "<name>" + "sign out"
   ↓                                ↓
 /signin (server component)       sign out form (server action)
   ↓                                ↓
 [GitHub으로 로그인] 버튼          signOut() → /
   ↓
 server action: signIn("github", { redirectTo: callbackUrl ?? "/admin" })
   ↓
 GitHub OAuth → /api/auth/callback/github
   ↓
 PrismaAdapter가 User/Account 생성/연결
   ↓
 NextAuth signIn 콜백 평가: account.providerAccountId === ADMIN_GITHUB_ID?
   ├── true  → /admin (또는 callbackUrl) 진입
   └── false → /signin?error=AccessDenied
```

비로그인 상태에서 `/admin/**` 직접 접근:
- 미들웨어가 `authorized` 콜백을 평가 → false
- 자동으로 `/signin?callbackUrl=/admin/...`으로 리다이렉트

## 4. Data Model (additions)

기존 Post/Tag는 변경 없음. 다음 4개 모델을 `prisma/schema.prisma`에 추가. Auth.js v5 PrismaAdapter가 요구하는 정확한 shape.

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

`Post`와 `User` 사이의 관계는 추가하지 않는다 (single-author 모델).

## 5. File Layout (additions)

```
src/
  lib/
    auth.ts                     # 신규: NextAuth() factory, Node-only (adapter + GitHub provider)
    auth.config.ts              # 신규: edge-safe config (callbacks, pages만), 미들웨어 공유
  types/
    next-auth.d.ts              # 신규: Session.user.isAdmin 타입 확장
  middleware.ts                 # 신규: NextAuth(authConfig).auth를 export, matcher: /admin/:path*
  app/
    api/auth/[...nextauth]/
      route.ts                  # 신규: handlers re-export
    signin/
      page.tsx                  # 신규: 로그인 페이지
    admin/
      page.tsx                  # 신규: placeholder
  components/
    site/
      site-header.tsx           # 수정: 우측에 sign-in/out UI 추가
      auth-status.tsx           # 신규: server component, 세션 fetch + 분기
      sign-out-button.tsx       # 신규: server action으로 signOut() 호출
prisma/
  migrations/
    <ts>_add_auth_tables/migration.sql   # 신규
```

## 6. NextAuth Configuration

**왜 `auth.ts`와 `auth.config.ts` 분리?**

Next.js 미들웨어는 Edge runtime에서 실행된다. `@auth/prisma-adapter`와 `@prisma/client`는 Node-only라 edge에서 import할 수 없다. NextAuth v5 권장 패턴: `auth.config.ts`에 edge-safe 옵션(callbacks, pages)만 두고, `auth.ts`에서 그걸 spread + Node-only(adapter, providers) 추가. 미들웨어는 `auth.config.ts`만 import.

### `src/lib/auth.config.ts`

```ts
import type { NextAuthConfig } from "next-auth";

const ADMIN_GITHUB_ID = process.env.ADMIN_GITHUB_ID;

export const authConfig = {
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "github") return false;
      return account.providerAccountId === ADMIN_GITHUB_ID;
    },
    async session({ session, user }) {
      // DB strategy: `user`는 DB row. 이 시점에 도달했다면 signIn 콜백을 통과한 admin이므로 isAdmin=true.
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = true;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isAdmin = !!auth?.user?.isAdmin;
      const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
      if (isAdminPath) return isAdmin;
      return true;
    },
  },
  providers: [], // populated in auth.ts
} satisfies NextAuthConfig;
```

### `src/lib/auth.ts`

```ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers: [GitHub],
});
```

### `src/middleware.ts`

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*"],
};
```

### `src/app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

Auth.js v5 exports `handlers` as the object `{ GET, POST }`, so re-export via destructure.

## 7. TypeScript Module Augmentation

### `src/types/next-auth.d.ts`

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    isAdmin?: boolean;
  }
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}
```

`tsconfig.json`에 `include` 항목이 `src/**/*.ts`를 이미 포함하므로 별도 설정 불필요.

## 8. UI

### `/signin/page.tsx`

```tsx
import { signIn } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { error, callbackUrl } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-24 sm:px-6">
      <h1 className="text-xl font-semibold">sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        only the blog admin can sign in.
      </p>
      {error && (
        <p className="mt-4 text-sm text-destructive">
          {error === "AccessDenied"
            ? "이 계정은 관리자가 아닙니다."
            : "로그인에 실패했습니다."}
        </p>
      )}
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: callbackUrl ?? "/admin" });
        }}
        className="mt-6"
      >
        <button
          type="submit"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          GitHub으로 로그인
        </button>
      </form>
    </div>
  );
}
```

### `/admin/page.tsx` (placeholder)

```tsx
import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold">admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        signed in as {session?.user?.name ?? "(unknown)"} · admin:{" "}
        {session?.user?.isAdmin ? "yes" : "no"}
      </p>
    </div>
  );
}
```

### `src/components/site/auth-status.tsx` (server component)

```tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export async function AuthStatus() {
  const session = await auth();
  if (!session) {
    return (
      <Link
        href="/signin"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{session.user?.name}</span>
      <SignOutButton />
    </div>
  );
}
```

### `src/components/site/sign-out-button.tsx`

```tsx
import { signOut } from "@/lib/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="text-muted-foreground hover:text-foreground"
      >
        sign out
      </button>
    </form>
  );
}
```

### `src/components/site/site-header.tsx` (수정)

기존 nav에 `<AuthStatus />`를 `ThemeToggle` 좌측에 끼워넣는다. server component라 `await` import는 불필요(JSX 안에서 server component로 렌더링).

## 9. User Action — GitHub OAuth App + 환경변수 셋업

이 스펙 구현 중 사용자가 직접 해야 할 단계 (DB 스펙의 T3과 유사한 USER ACTION):

1. **GitHub OAuth App 생성**: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - Application name: 자유 (예: "blog (local)")
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - 생성 후 Client ID 복사, "Generate a new client secret" 클릭해 secret 복사

2. **NEXTAUTH_SECRET 생성**: 터미널에서
   ```bash
   openssl rand -base64 32
   ```
   결과 문자열 복사

3. **본인 GitHub user numeric ID 확인**:
   ```bash
   curl -s https://api.github.com/users/<your-username> | grep '"id"'
   ```
   숫자 값 복사

4. **`.env.local`에 5개 키 입력**:
   ```
   NEXTAUTH_SECRET=<위 1번 결과>
   NEXTAUTH_URL=http://localhost:3000
   GITHUB_CLIENT_ID=<위 1번에서 복사한 Client ID>
   GITHUB_CLIENT_SECRET=<위 1번에서 복사한 Secret>
   ADMIN_GITHUB_ID=<위 3번 숫자 ID>
   ```

운영 배포(Vercel) 시:
- 별도 GitHub OAuth App을 생성하거나 같은 OAuth App에 운영 도메인의 callback URL 추가
- Vercel 환경변수에 5개 키 등록, `NEXTAUTH_URL`은 운영 도메인으로

## 10. Acceptance Criteria

이 스펙이 "완료"되었다고 부를 조건:

1. `pnpm prisma migrate dev --name add_auth_tables` 성공, 4개 테이블 추가됨
2. `pnpm dev` 후 `/signin` → 200, "GitHub으로 로그인" 버튼 표시
3. 비로그인 상태로 `/admin` 접근 시 자동으로 `/signin?callbackUrl=/admin`으로 리다이렉트
4. admin이 **아닌** GitHub 계정으로 로그인 시도 → `/signin?error=AccessDenied`로 회귀, "관리자가 아닙니다" 메시지 표시
5. admin GitHub 계정 (ADMIN_GITHUB_ID 매치) 로그인 → `/admin` 진입, 페이지에 본인 이름 + "admin: yes" 표시
6. 헤더가 비로그인일 땐 "sign in" 링크를, 로그인일 땐 이름 + "sign out" 버튼을 보여줌
7. "sign out" 클릭 → 세션 종료, `/`로 리다이렉트, 다시 헤더가 "sign in"
8. 로그아웃 후 `/admin` 접근 → 다시 차단
9. 공개 라우트(`/`, `/posts`, `/posts/[slug]`)는 로그인 여부와 무관하게 200
10. `pnpm build`, `pnpm typecheck`, `pnpm lint` 모두 통과

## 11. Risks & Open Questions

- **Edge runtime + database session 호환성**: 미들웨어는 edge runtime. `authConfig`가 Node-only adapter를 import하지 않기 때문에 edge에서 동작하지만, `authorized` 콜백이 `auth.user.isAdmin`을 보려면 세션을 어떻게든 읽어야 한다. NextAuth v5는 edge에서 cookie 기반으로 가벼운 세션 정보를 읽고 `session` 콜백은 호출하지 않으므로, edge에서 `auth.user.isAdmin`이 undefined일 수 있음. **검증 필요**. 만약 undefined로 나오면 미들웨어의 `authorized`에서 `isAdmin` 대신 `!!auth`로 단순 체크하고, page 내부에서 `auth()` 호출 + 별도 admin 체크를 한 번 더 한다.
- **세션 strategy = "database"인데 edge 미들웨어**: 위와 같은 문제의 근본. 만약 edge에서 세션 읽기가 안 되면 미들웨어에서 단순히 "쿠키 존재 여부"로 1차 필터링하고 page-level 가드를 신뢰. 또는 strategy를 "jwt"로 바꾸면 edge에서 토큰 디코드 가능하지만 revoke 즉시성이 떨어짐. **1순위는 database, 안 되면 jwt 폴백** — 구현 도중 선택.
- **signIn 콜백 거부 시 stale 데이터**: PrismaAdapter는 OAuth 콜백 처리 중 user/account를 먼저 만들고 signIn 콜백을 평가. 거부되면 stale row가 DB에 남을 수 있음. 1인 블로그 영향 미미하지만 follow-up.
- **`.env.local`의 NEXTAUTH_URL이 비어있던 상태**: 베이스 스캐폴딩의 `.env.example`에는 `NEXTAUTH_URL=http://localhost:3000`이 이미 있지만, `.env.local`에는 사용자가 직접 채워넣지 않으면 빈 값. NextAuth v5는 NEXTAUTH_URL이 누락되어도 헤더에서 추론하지만 명시 권장.
- **TypeScript declaration의 위치**: `src/types/next-auth.d.ts`가 typecheck에 잡히려면 `tsconfig.json`의 `include`가 `src/**/*`를 커버해야 함. 기본 Next.js 셋업이 그러하므로 별도 변경 없음. 만약 typecheck가 새 타입을 안 잡으면 `tsconfig`에 명시적으로 추가.
