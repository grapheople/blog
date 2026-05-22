# Blog Base Scaffold — Design Spec

Date: 2026-05-22
Status: Approved (pending user review of this document)

## 1. Goal

빈 디렉토리에서 시작해 `pnpm dev`로 동작하는 Next.js 블로그의 **베이스 스캐폴딩**을 만든다. 다크모드, 타이포그래피, 사이트 레이아웃, 공개 라우트 placeholder가 동작하는 상태가 종착점이다.

DB·인증·에디터 등 동적인 기능은 이번 스펙에서 다루지 않는다. 각각 별도의 후속 스펙으로 분리한다.

## 2. Scope

### In scope

- Next.js 프로젝트 초기화 (App Router, TypeScript strict, Tailwind, ESLint, `src/`)
- shadcn/ui 초기화 (base color = zinc, CSS variables)
- 다크모드 (`next-themes`, system 기본 + 헤더 토글)
- 폰트: Geist Sans / Geist Mono (Vercel `geist` 패키지)
- 사이트 레이아웃: 헤더 + 메인 + 푸터
- 공개 라우트 placeholder 3개: `/`, `/posts`, `/posts/[slug]`
- mock 데이터 모듈 (`lib/posts.ts`)
- `.env.example` (키만, 값은 비움)
- 동작하는 `dev`, `build`, `lint`, `typecheck` 스크립트

### Out of scope (next specs)

- Prisma 스키마, DB 연결, 마이그레이션
- NextAuth GitHub OAuth, `isAdmin`, 미들웨어 가드
- `/admin` 라우트, TipTap 에디터, 글 CRUD API
- 코드 하이라이팅 (shiki/lowlight)
- RSS, sitemap
- 이미지 업로드 (Vercel Blob 등)

## 3. Initialization Steps

```sh
pnpm create next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack
```

생성 후:

1. 보일러플레이트 정리: `src/app/page.tsx`, `src/app/globals.css`의 기본 컨텐츠 제거
2. shadcn 초기화: `pnpm dlx shadcn@latest init` — base color **zinc**, CSS variables = yes
3. 추가 의존성: `pnpm add next-themes geist lucide-react clsx tailwind-merge`
4. shadcn 컴포넌트: `pnpm dlx shadcn@latest add button`
5. `package.json` scripts에 `typecheck`: `tsc --noEmit` 추가

## 4. Directory Structure (this spec only)

```
src/
  app/
    (public)/
      layout.tsx          # 헤더 + 메인 + 푸터
      page.tsx            # /  — 최근 글 리스트
      posts/
        page.tsx          # /posts — 전체 글 목록
        [slug]/page.tsx   # /posts/[slug] — 글 상세
    layout.tsx            # 루트: html/body, ThemeProvider, 폰트 변수
    globals.css           # Tailwind + shadcn 토큰
  components/
    ui/                   # shadcn 컴포넌트 (button 등)
    theme/
      theme-provider.tsx
      theme-toggle.tsx
    site/
      site-header.tsx
      site-footer.tsx
  lib/
    utils.ts              # cn()
    posts.ts              # mock 데이터 + getPosts/getPost
.env.example
```

CLAUDE.md의 계획 구조와 정합. 이번 스펙에서 만들지 않는 디렉토리(`admin/`, `api/`, `components/editor/`, `components/post/`, `lib/auth.ts`, `lib/db.ts`, `prisma/`)는 후속 스펙에서 추가한다.

## 5. Data Model (mock)

`src/lib/posts.ts`에 향후 Prisma 모델과 호환되는 타입을 미리 정의한다.

```ts
export type Post = {
  slug: string;
  title: string;
  description: string;
  contentHtml: string;   // 지금은 미리 렌더된 HTML 문자열
  publishedAt: string;   // ISO 8601
  tags: string[];
};

export async function getPosts(): Promise<Post[]>;
export async function getPost(slug: string): Promise<Post | null>;
```

내부는 동기적인 하드코딩 배열이지만 시그니처는 비동기로 둔다 — 다음 스펙에서 Prisma 콜로 교체할 때 호출부를 손대지 않기 위함이다.

더미 글은 3~4개. 각각 다른 publishedAt과 tags를 갖도록 한다.

## 6. Dark Mode & Theme

- 루트 `layout.tsx`의 `<html>`에 `suppressHydrationWarning` 부착
- `ThemeProvider`(`next-themes`)를 클라이언트 컴포넌트로 래핑, props: `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- 헤더 우측에 `ThemeToggle` — `lucide-react`의 Sun/Moon 아이콘, shadcn `Button` variant `ghost` size `icon`
- shadcn CSS 변수를 그대로 사용. 다크 모드 배경은 zinc-950 톤 (shadcn 기본 토큰이 이를 만족)

## 7. Typography & Layout

- `geist` 패키지의 `GeistSans`, `GeistMono`를 루트 레이아웃에서 import해 CSS 변수로 노출
- `tailwind.config.ts`의 `theme.fontFamily.sans/mono`를 해당 변수에 매핑
- 사이트 최대 폭 `max-w-3xl`, 좌우 패딩 `px-4 sm:px-6`
- 글 상세에서 본문은 `max-w-prose` + `leading-relaxed`
- 헤더 높이 `h-14`, sticky `top-0`, 하단 1px border

## 8. Routing & Data Flow

- 모든 페이지는 서버 컴포넌트 기본
- `'use client'`는 `ThemeProvider`, `ThemeToggle`에만 한정
- 라우트 핸들러는 이번 스펙에 없음
- 글 상세 `/posts/[slug]`에서 `getPost(slug)` 결과가 `null`이면 `notFound()` 호출

## 9. Files Created (concrete list)

생성/수정되는 파일을 명시한다 (create-next-app이 자동 생성하는 파일 제외).

- `src/app/layout.tsx` (수정: 폰트 변수, ThemeProvider 추가)
- `src/app/globals.css` (수정: shadcn 토큰 + 폰트 변수)
- `src/app/(public)/layout.tsx` (신규)
- `src/app/(public)/page.tsx` (신규)
- `src/app/(public)/posts/page.tsx` (신규)
- `src/app/(public)/posts/[slug]/page.tsx` (신규)
- `src/components/ui/button.tsx` (shadcn add)
- `src/components/theme/theme-provider.tsx` (신규)
- `src/components/theme/theme-toggle.tsx` (신규)
- `src/components/site/site-header.tsx` (신규)
- `src/components/site/site-footer.tsx` (신규)
- `src/lib/utils.ts` (shadcn init이 생성)
- `src/lib/posts.ts` (신규)
- `.env.example` (신규)
- `tailwind.config.ts` (수정: 폰트 패밀리 매핑)
- `package.json` (수정: `typecheck` 스크립트 추가)
- `tsconfig.json` (확인: strict 활성화 — create-next-app 기본값)

## 10. Acceptance Criteria

이 스펙은 다음을 모두 만족해야 "완료"다.

1. `pnpm dev` 후 `http://localhost:3000/`, `/posts`, `/posts/<existing-slug>` 셋 다 200으로 렌더된다.
2. `/posts/non-existent-slug`은 Next.js 404 페이지로 응답한다.
3. 헤더 토글 버튼으로 라이트↔다크 전환되고, 페이지 새로고침 시 선택이 유지되며, 초기 진입 시 시스템 설정을 따른다.
4. `pnpm build`가 에러/경고 없이 성공한다.
5. `pnpm lint`가 에러 없이 통과한다.
6. `pnpm typecheck`가 에러 없이 통과한다.
7. Chrome devtools에서 모바일 뷰포트(375px)로 봤을 때 가로 스크롤이 발생하지 않는다.
8. `.env.example`이 존재하고 CLAUDE.md에 명시된 키를 모두 포함한다 (값은 비어 있음).

## 11. Environment Variables (`.env.example`)

값 없이 키만 포함한다. 실제 값 설정은 후속 스펙에서.

```
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ADMIN_GITHUB_ID=
```

## 12. Risks & Open Questions

- **Tailwind v3 vs v4**: create-next-app 최신 버전이 어느 쪽을 만들어 내는지 시점 의존. shadcn 초기화 호환성을 위해 v3로 고정할 필요가 있을 수 있다. 셋업 도중 확인하고, 필요하면 v3로 다운그레이드 명령을 플랜에 추가한다.
- **shadcn CLI 이름**: 현재 패키지는 `shadcn` (예전 `shadcn-ui`에서 변경됨). 위 명령은 새 이름 기준.
- **`geist` 패키지 호환성**: Next.js 버전과의 호환을 셋업 도중 확인. 문제 시 `next/font/google`의 `Inter` + `JetBrains_Mono`로 폴백.

이 셋 모두 셋업 진행 중에만 영향을 주고, 본 스펙의 범위 자체는 변경하지 않는다.
