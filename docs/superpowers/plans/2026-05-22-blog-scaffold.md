# Blog Base Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 빈 디렉토리에서 Next.js + Tailwind + shadcn + 다크모드 + 폰트가 설정되고 `/`, `/posts`, `/posts/[slug]` placeholder 라우트가 동작하는 베이스를 만든다.

**Architecture:** Next.js App Router를 src-dir 구조로 초기화하고, shadcn/ui와 `next-themes`로 디자인 시스템과 다크모드를 얹는다. 글 데이터는 `lib/posts.ts`의 mock 모듈로 두며, 함수 시그니처는 미래의 Prisma 호출과 호환되도록 비동기로 둔다. 모든 페이지는 서버 컴포넌트 기본, 클라이언트 컴포넌트는 ThemeProvider/ThemeToggle에만 한정.

**Tech Stack:** Next.js (App Router), TypeScript strict, Tailwind CSS, shadcn/ui (base color: zinc), `next-themes`, Geist Sans/Mono, lucide-react, pnpm.

**Reference spec:** `docs/superpowers/specs/2026-05-22-blog-scaffold-design.md`

---

## Pre-flight

- 작업 디렉토리: `/Users/jiseong-in/Documents/GitHub/blog`
- 시작 시 존재하는 파일: `.gitignore`, `CLAUDE.md`, `skills-lock.json`, `.agents/`, `docs/`
- 이 중 `.gitignore`는 create-next-app이 새로 만들려 할 수 있으니 Task 1에서 명시적으로 처리한다.

---

### Task 1: 기존 `.gitignore` 임시 백업 후 Next.js 스캐폴딩

**Files:**
- Modify (rename temporarily): `.gitignore` → `.gitignore.pre-scaffold`
- Create: 다수 (create-next-app 생성)

- [ ] **Step 1: `.gitignore`가 충돌하지 않도록 임시 이름으로 옮긴다**

Run:
```bash
mv .gitignore .gitignore.pre-scaffold
```

Expected: 별도 출력 없음. `ls -la`로 `.gitignore.pre-scaffold` 존재 확인.

- [ ] **Step 2: create-next-app 실행**

Run:
```bash
pnpm create next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack --use-pnpm --yes
```

Expected:
- 의존성 설치 후 `package.json`, `tsconfig.json`, `next.config.*`, `tailwind.config.*`, `postcss.config.*`, `src/app/`, `public/`, `.gitignore`(새로 생성) 등이 생긴다.
- 기존 `CLAUDE.md`, `docs/`, `.agents/`, `skills-lock.json`은 그대로 남아있다.

만약 도구가 "directory not empty"로 거부하면, 기존 비충돌 파일은 그대로 두고 진행되는 게 정상이다. 거부될 경우 다음 워크어라운드: 빈 임시 디렉토리에서 스캐폴딩 후 결과물을 `.`로 이동 (`mv ../tmp-scaffold/{.,}* .`).

- [ ] **Step 3: 두 `.gitignore` 병합**

Read both files first to see what's unique. Then create a merged `.gitignore` that contains:
- Next.js가 생성한 모든 라인
- 기존 `.gitignore.pre-scaffold`에 있었으나 새 파일에 없는 라인

Run:
```bash
cat .gitignore.pre-scaffold >> .gitignore
sort -u .gitignore -o .gitignore
rm .gitignore.pre-scaffold
```

(주의: `sort`로 인해 라인 순서가 바뀌지만 `.gitignore` 동작에는 영향 없다.)

- [ ] **Step 4: 빌드와 dev 서버 동작 검증**

Run:
```bash
pnpm install
pnpm build
```

Expected: 빌드가 에러 없이 끝난다. `Compiled successfully` 메시지.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: bootstrap Next.js App Router with TS + Tailwind + ESLint"
```

---

### Task 2: 보일러플레이트 페이지 콘텐츠 제거

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css` (기본 Tailwind 지시문 외 제거)

- [ ] **Step 1: `src/app/page.tsx`를 빈 placeholder로 교체**

Replace entire file with:
```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold">blog scaffold</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        placeholder home page — wiring in progress
      </p>
    </main>
  );
}
```

- [ ] **Step 2: `src/app/globals.css`를 shadcn 호환 베이스로 정리**

Replace entire file with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

(shadcn 토큰은 Task 4에서 추가한다.)

- [ ] **Step 3: dev 서버 동작 확인**

Run:
```bash
pnpm dev &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
kill %1 2>/dev/null || true
```

Expected: `200`.

- [ ] **Step 4: 커밋**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "chore: strip create-next-app boilerplate"
```

---

### Task 3: 의존성 추가 및 shadcn/ui 초기화

**Files:**
- Create: `components.json` (shadcn init이 생성)
- Modify: `tailwind.config.ts` (shadcn init이 토큰 추가)
- Modify: `src/app/globals.css` (shadcn init이 CSS 변수 추가)
- Create: `src/lib/utils.ts` (shadcn init이 생성)
- Create: `src/components/ui/button.tsx`

- [ ] **Step 1: 필수 런타임 의존성 설치**

Run:
```bash
pnpm add next-themes geist lucide-react clsx tailwind-merge
```

Expected: 정상 설치, `package.json`에 추가됨.

- [ ] **Step 2: shadcn 초기화**

Run:
```bash
pnpm dlx shadcn@latest init --base-color zinc --yes
```

대화형 프롬프트가 뜨면: TypeScript=yes, style=default, base color=zinc, global css path=`src/app/globals.css`, css variables=yes, tailwind config=`tailwind.config.ts`, components alias=`@/components`, utils alias=`@/lib/utils`, RSC=yes.

Expected: `components.json` 생성, `globals.css`에 `:root` / `.dark` CSS 변수 추가, `tailwind.config.ts`에 theme 확장 추가, `src/lib/utils.ts`에 `cn()` 생성.

- [ ] **Step 3: button 컴포넌트 추가**

Run:
```bash
pnpm dlx shadcn@latest add button --yes
```

Expected: `src/components/ui/button.tsx` 생성.

- [ ] **Step 4: 빌드 확인**

Run:
```bash
pnpm build
```

Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: init shadcn/ui with zinc base color and add button"
```

---

### Task 4: Geist 폰트를 루트 레이아웃과 Tailwind에 연결

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: 현재 `src/app/layout.tsx`와 `tailwind.config.ts` 읽기**

Read both files to understand the current state (font imports, theme config) before modifying.

- [ ] **Step 2: 루트 레이아웃에서 Geist 폰트 적용**

Replace `src/app/layout.tsx` with:
```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "blog",
  description: "personal tech blog",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

(`ThemeProvider`는 Task 5에서 추가한다.)

- [ ] **Step 3: `tailwind.config.ts`의 fontFamily에 변수 매핑 추가**

In `tailwind.config.ts`, locate the `theme.extend` block (added by shadcn init) and ensure `fontFamily` looks like:
```ts
fontFamily: {
  sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
  mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
},
```

If `fontFamily` already exists, replace it. If not, add it inside `theme.extend`.

- [ ] **Step 4: 빌드 + dev 검증**

Run:
```bash
pnpm build
```

Expected: 에러 없음.

Run:
```bash
pnpm dev &
sleep 4
curl -s http://localhost:3000 | grep -o "font-geist-sans" | head -1
kill %1 2>/dev/null || true
```

Expected: `font-geist-sans` 문자열 발견 (CSS 변수가 HTML에 직렬화됨).

- [ ] **Step 5: 커밋**

```bash
git add src/app/layout.tsx tailwind.config.ts
git commit -m "feat: wire Geist Sans/Mono fonts into root layout"
```

---

### Task 5: ThemeProvider와 ThemeToggle 추가

**Files:**
- Create: `src/components/theme/theme-provider.tsx`
- Create: `src/components/theme/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: ThemeProvider 작성**

Create `src/components/theme/theme-provider.tsx`:
```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 2: ThemeToggle 작성**

Create `src/components/theme/theme-toggle.tsx`:
```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
```

- [ ] **Step 3: 루트 레이아웃에서 ThemeProvider로 children 감싸기**

Modify `src/app/layout.tsx` — import the provider and wrap `{children}`:

Add to imports:
```tsx
import { ThemeProvider } from "@/components/theme/theme-provider";
```

Change the body to:
```tsx
<body className="min-h-dvh bg-background font-sans text-foreground antialiased">
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
  >
    {children}
  </ThemeProvider>
</body>
```

- [ ] **Step 4: 빌드 + 토글 검증**

Run:
```bash
pnpm build
```

Expected: 에러 없음.

(런타임 토글 검증은 Task 14의 수동 스모크 테스트에서 한다 — 이 단계에서는 컴파일 통과만 확인.)

- [ ] **Step 5: 커밋**

```bash
git add src/components/theme src/app/layout.tsx
git commit -m "feat: add ThemeProvider and ThemeToggle with next-themes"
```

---

### Task 6: 사이트 헤더와 푸터 컴포넌트

**Files:**
- Create: `src/components/site/site-header.tsx`
- Create: `src/components/site/site-footer.tsx`

- [ ] **Step 1: SiteHeader 작성**

Create `src/components/site/site-header.tsx`:
```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-mono text-sm font-medium tracking-tight"
        >
          blog
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/posts"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            posts
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: SiteFooter 작성**

Create `src/components/site/site-footer.tsx`:
```tsx
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-3xl px-4 py-8 text-xs text-muted-foreground sm:px-6">
        © {year} · built with Next.js
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run:
```bash
pnpm build
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/components/site
git commit -m "feat: add SiteHeader and SiteFooter"
```

---

### Task 7: mock posts 데이터 모듈

**Files:**
- Create: `src/lib/posts.ts`

- [ ] **Step 1: `src/lib/posts.ts` 작성**

Create the file with:
```ts
export type Post = {
  slug: string;
  title: string;
  description: string;
  contentHtml: string;
  publishedAt: string;
  tags: string[];
};

const POSTS: Post[] = [
  {
    slug: "hello-world",
    title: "Hello, world",
    description: "첫 번째 글 — 블로그를 만든 이유에 관해.",
    contentHtml:
      "<p>이 블로그는 내가 배우고 만든 것들을 기록하는 공간이다.</p>",
    publishedAt: "2026-05-01T00:00:00.000Z",
    tags: ["meta"],
  },
  {
    slug: "typescript-strict-mode",
    title: "TypeScript strict mode를 켜야 하는 이유",
    description: "타입 안정성과 리팩토링 안전성 사이의 관계.",
    contentHtml:
      "<p>strict 모드는 단순한 옵션이 아니라 개발 문화의 선택이다.</p>",
    publishedAt: "2026-05-10T00:00:00.000Z",
    tags: ["typescript", "tooling"],
  },
  {
    slug: "next-app-router-server-components",
    title: "App Router에서 서버 컴포넌트를 기본값으로",
    description: "클라이언트 컴포넌트는 잎(leaf)에만 둔다.",
    contentHtml:
      "<p>서버에서 데이터에 직접 접근할 수 있다면, 그렇게 한다.</p>",
    publishedAt: "2026-05-18T00:00:00.000Z",
    tags: ["next", "architecture"],
  },
];

export async function getPosts(): Promise<Post[]> {
  return [...POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export async function getPost(slug: string): Promise<Post | null> {
  return POSTS.find((p) => p.slug === slug) ?? null;
}
```

- [ ] **Step 2: typecheck**

Run:
```bash
pnpm exec tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/posts.ts
git commit -m "feat: add mock posts module with async-compatible signatures"
```

---

### Task 8: `(public)` 라우트 그룹과 공개 레이아웃

**Files:**
- Create: `src/app/(public)/layout.tsx`

- [ ] **Step 1: `(public)/layout.tsx` 작성**

Create `src/app/(public)/layout.tsx`:
```tsx
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run:
```bash
pnpm build
```

Expected: 에러 없음. (이 시점에는 `(public)` 그룹 안에 라우트가 없어도 빌드는 통과한다.)

- [ ] **Step 3: 커밋**

```bash
git add src/app/\(public\)/layout.tsx
git commit -m "feat: add (public) route group with site chrome"
```

---

### Task 9: 홈 페이지를 `(public)` 그룹으로 이동

**Files:**
- Delete: `src/app/page.tsx`
- Create: `src/app/(public)/page.tsx`

홈 페이지는 `(public)` 레이아웃을 사용해야 하므로 루트의 `page.tsx`를 그룹 안으로 옮기고 내용도 새로 작성한다.

- [ ] **Step 1: 기존 `src/app/page.tsx` 삭제**

Run:
```bash
rm src/app/page.tsx
```

- [ ] **Step 2: `src/app/(public)/page.tsx` 작성**

Create the file with:
```tsx
import Link from "next/link";
import { getPosts } from "@/lib/posts";

export default async function HomePage() {
  const posts = (await getPosts()).slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <section className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight">blog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          기록하고, 다시 읽고, 고친다.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          recent
        </h2>
        <ul className="divide-y border-y">
          {posts.map((p) => (
            <li key={p.slug} className="py-4">
              <Link
                href={`/posts/${p.slug}`}
                className="group flex items-baseline justify-between gap-4"
              >
                <span className="font-medium group-hover:underline">
                  {p.title}
                </span>
                <time className="font-mono text-xs text-muted-foreground">
                  {p.publishedAt.slice(0, 10)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: 빌드와 라우트 응답 확인**

Run:
```bash
pnpm build
pnpm dev &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
kill %1 2>/dev/null || true
```

Expected: 빌드 통과, `/`가 `200`.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add home page with recent posts list"
```

---

### Task 10: `/posts` 목록 페이지

**Files:**
- Create: `src/app/(public)/posts/page.tsx`

- [ ] **Step 1: `posts/page.tsx` 작성**

Create `src/app/(public)/posts/page.tsx`:
```tsx
import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const metadata = {
  title: "posts",
};

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">posts</h1>
      <ul className="space-y-6">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/posts/${p.slug}`}
              className="group block"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-medium group-hover:underline">
                  {p.title}
                </h2>
                <time className="font-mono text-xs text-muted-foreground">
                  {p.publishedAt.slice(0, 10)}
                </time>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.description}
              </p>
              {p.tags.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: 라우트 응답 확인**

Run:
```bash
pnpm build
pnpm dev &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/posts
kill %1 2>/dev/null || true
```

Expected: 빌드 통과, `/posts`가 `200`.

- [ ] **Step 3: 커밋**

```bash
git add src/app/\(public\)/posts/page.tsx
git commit -m "feat: add /posts listing page"
```

---

### Task 11: `/posts/[slug]` 상세 페이지

**Files:**
- Create: `src/app/(public)/posts/[slug]/page.tsx`

- [ ] **Step 1: 상세 페이지 작성**

Create `src/app/(public)/posts/[slug]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-prose px-4 py-16 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {post.title}
        </h1>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <time className="font-mono">{post.publishedAt.slice(0, 10)}</time>
          {post.tags.length > 0 && (
            <div className="flex gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border px-1.5 py-0.5 font-mono"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      <div
        className="leading-relaxed [&_p]:my-4"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  );
}
```

(Note: `dangerouslySetInnerHTML`은 mock 데이터에 한정. 다음 스펙에서 서버측 sanitization 또는 TipTap 렌더러로 교체된다.)

- [ ] **Step 2: 라우트 응답 확인 (200과 404 모두)**

Run:
```bash
pnpm build
pnpm dev &
sleep 4
echo "existing slug:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/posts/hello-world
echo "non-existent slug:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/posts/does-not-exist
kill %1 2>/dev/null || true
```

Expected: 빌드 통과, 존재하는 slug `200`, 미존재 slug `404`.

- [ ] **Step 3: 커밋**

```bash
git add src/app/\(public\)/posts/\[slug\]/page.tsx
git commit -m "feat: add /posts/[slug] detail page with notFound handling"
```

---

### Task 12: `.env.example`과 `typecheck` 스크립트

**Files:**
- Create: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: `.env.example` 작성**

Create `.env.example`:
```
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ADMIN_GITHUB_ID=
```

- [ ] **Step 2: `package.json`에 `typecheck` 스크립트 추가**

Read `package.json` first to see current scripts. Then add `"typecheck": "tsc --noEmit"` to the `scripts` object. The resulting scripts block should contain at minimum:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

(다른 스크립트가 이미 있다면 보존한다.)

- [ ] **Step 3: 모든 스크립트 실행 확인**

Run:
```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: 셋 다 에러 없이 종료.

- [ ] **Step 4: 커밋**

```bash
git add .env.example package.json
git commit -m "chore: add .env.example and typecheck script"
```

---

### Task 13: 최종 스모크 테스트와 인수 기준 검증

**Files:** (변경 없음 — 검증만 수행)

이 태스크는 스펙의 §10 인수 기준 8개를 하나씩 확인한다. 실패가 발견되면 그 자리에서 fix 커밋을 추가한다.

- [ ] **Step 1: dev 서버에서 모든 라우트가 200**

Run:
```bash
pnpm dev &
sleep 5
for path in / /posts /posts/hello-world; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${path}")
  echo "${path}: ${code}"
done
echo "non-existent:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/posts/does-not-exist
kill %1 2>/dev/null || true
```

Expected:
```
/: 200
/posts: 200
/posts/hello-world: 200
non-existent:
404
```

- [ ] **Step 2: 다크 모드 토글 수동 확인**

Run `pnpm dev`를 백그라운드로 실행하고 브라우저(또는 Playwright MCP)로 `http://localhost:3000`에 접속해:
1. 헤더 우측의 토글 버튼이 보이는지 확인
2. 클릭 시 `<html>`에 `class="dark"` 또는 `class="light"`가 토글되는지 devtools에서 확인
3. 새로고침 후에도 마지막 선택이 유지되는지 확인
4. 시스템 다크모드 설정으로 변경 후 로컬스토리지를 비우고 재진입 시 시스템 설정을 따르는지 확인

Expected: 위 4개 모두 OK.

확인 끝나면 dev 서버 종료: `kill %1 2>/dev/null || true`.

- [ ] **Step 3: build / lint / typecheck**

Run:
```bash
pnpm build && pnpm lint && pnpm typecheck
```

Expected: 셋 다 통과, 경고 없음.

- [ ] **Step 4: 모바일 뷰포트 검증 (수동 또는 Playwright)**

브라우저 devtools에서 viewport를 375×667로 설정한 뒤 `/`, `/posts`, `/posts/hello-world` 세 페이지에서 가로 스크롤바가 나타나지 않는지 확인.

Expected: 세 페이지 모두 가로 스크롤 없음.

- [ ] **Step 5: `.env.example` 키 검증**

Run:
```bash
grep -E "^(DATABASE_URL|DIRECT_URL|NEXTAUTH_SECRET|NEXTAUTH_URL|GITHUB_CLIENT_ID|GITHUB_CLIENT_SECRET|ADMIN_GITHUB_ID)=" .env.example | wc -l
```

Expected: `7`.

- [ ] **Step 6: 인수 기준이 모두 통과했음을 기록하는 커밋 (선택)**

위 단계들에서 추가 수정이 없었다면 별도 커밋은 필요 없다. 수정이 있었다면:
```bash
git add -A
git commit -m "fix: address scaffold smoke test findings"
```

---

## Self-Review Notes

**Spec coverage:**
- §2 In scope: 모든 항목이 Task 1~12에 매핑됨 (Next 초기화 T1, shadcn T3, 다크모드 T5, Geist T4, 사이트 레이아웃 T6+T8, 라우트 placeholder T9-T11, mock 데이터 T7, .env.example T12, typecheck T12)
- §10 Acceptance criteria 1~8: 모두 Task 13에서 검증됨
- §12 Risks: Tailwind v3/v4 — shadcn init이 자동 호환 처리하므로 별도 분기 불필요. 문제 발생 시 Task 3 Step 2에서 발견.

**Placeholder scan:** "TBD", "implement later" 등 없음. 모든 코드 블록은 완전한 형태.

**Type consistency:** `Post` 타입은 Task 7에서 한 번 정의되고 Task 9~11에서 동일하게 사용됨. `getPosts`/`getPost` 시그니처도 일관됨.

---

## Execution Handoff

플랜 저장 후 사용자에게 실행 방식을 묻는다:
1. Subagent-Driven (권장) — 태스크당 신선한 subagent 디스패치, 사이에 리뷰
2. Inline Execution — 현재 세션에서 일괄 실행, 체크포인트마다 리뷰
