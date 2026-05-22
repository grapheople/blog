# CLAUDE.md

이 파일은 Claude Code가 본 저장소에서 작업할 때 참고하는 프로젝트 가이드입니다.

## 프로젝트 개요

개인 기술 블로그. 글 작성은 관리자(본인)만 가능하며, 일반 사용자는 글을 읽기만 한다. 전문 개발자 톤의 미니멀하고 정돈된 디자인을 지향한다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript (strict) |
| 스타일링 | Tailwind CSS + shadcn/ui |
| DB | PostgreSQL (Supabase 또는 Neon 무료 티어) |
| ORM | Prisma |
| 인증 | NextAuth.js (Auth.js v5) + GitHub OAuth Provider |
| 에디터 | TipTap (StarterKit + CodeBlockLowlight + Image + Link) |
| 코드 하이라이팅 | lowlight / shiki (렌더 시) |
| 폼/검증 | react-hook-form + zod |
| 배포 | Vercel |

## 핵심 요구사항

- **다크모드**: `next-themes`로 시스템/수동 토글. 기본은 시스템 설정 따름. shadcn 토큰(`background`, `foreground` 등)으로 일관성 유지.
- **반응형**: 모바일 퍼스트. Tailwind 브레이크포인트 사용. 본문은 `max-w-prose` 기준으로 가독성 우선.
- **관리자 전용 글 작성**: `ADMIN_GITHUB_ID` 환경변수에 본인 GitHub user ID(숫자)를 저장. NextAuth `session` 콜백에서 해당 ID만 `isAdmin: true`로 부여. 미들웨어로 `/admin/**` 및 변경 계열 라우트 핸들러를 가드.
- **Vercel 배포 호환**: serverless/edge 런타임 제약 준수. Prisma는 connection pooling 사용(Supabase Pooler 또는 Neon serverless driver). 이미지 호스팅은 Vercel Blob 또는 외부 S3 호환 스토리지.

## 디렉토리 구조 (계획)

```
src/
  app/
    (public)/              # 공개 라우트: 글 목록, 상세, 태그
    admin/                 # 관리자 전용 (글 작성/수정/삭제)
    api/
      auth/[...nextauth]/  # NextAuth 핸들러
      posts/               # 글 CRUD API (admin 가드)
    layout.tsx
  components/
    ui/                    # shadcn 컴포넌트
    editor/                # TipTap 래퍼, 툴바, 확장
    post/                  # 글 렌더링, 카드, 목차
    theme/                 # ThemeProvider, ThemeToggle
  lib/
    auth.ts                # NextAuth 설정
    db.ts                  # Prisma 클라이언트 싱글톤
    utils.ts
  styles/
    globals.css
prisma/
  schema.prisma
```

## 데이터 모델 (초안)

- `User` — NextAuth 표준 + `isAdmin` 가상 필드(세션 시점 계산)
- `Post` — `id`, `slug`(unique), `title`, `description`, `content`(TipTap JSON), `contentHtml`(렌더 캐시), `published`, `publishedAt`, `createdAt`, `updatedAt`, `tags Tag[]`
- `Tag` — `id`, `name`(unique), `slug`

본문은 TipTap JSON으로 저장하고, 저장 시 서버에서 HTML로 직렬화해 함께 보관해 읽기 성능을 확보한다.

## 환경 변수

`.env.local` (커밋 금지):

```
DATABASE_URL=...                 # pooled connection
DIRECT_URL=...                   # prisma migrate용 direct connection
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
ADMIN_GITHUB_ID=...              # 본인 GitHub user ID (숫자)
SUPABASE_URL=...                 # https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...    # Project Settings → API → service_role (서버 전용)
SUPABASE_STORAGE_BUCKET=blog-images   # 선택 (기본값: blog-images)
```

Vercel 배포 시 동일 키를 프로젝트 환경변수에 등록.

## 디자인 원칙

전문 개발자 느낌을 위한 가이드라인:

- **타이포그래피**: 본문은 Inter/Geist Sans, 코드/숫자는 Geist Mono 또는 JetBrains Mono. 본문 행간 1.7 이상.
- **컬러**: 채도 낮은 중성 톤(zinc/neutral 베이스). 액센트는 한 가지만 사용. 다크모드에서 순흑(#000) 대신 zinc-950 톤 사용.
- **여백**: 충분한 화이트 스페이스. 글 본문은 `max-w-prose` 또는 약 65ch.
- **모션**: 과한 애니메이션 지양. 호버/포커스 트랜지션만 미세하게.
- **세부**: 정확한 정렬, 일관된 라운드(`rounded-md`), 1px 보더 활용.

## 개발 명령 (프로젝트 셋업 후 갱신 예정)

```
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm prisma migrate dev
pnpm prisma studio
```

## 규칙

- TypeScript strict 유지. `any` 사용 금지(불가피하면 주석으로 사유 명시).
- 서버 컴포넌트 우선. 클라이언트 컴포넌트는 상호작용이 필요한 잎(leaf)에만 한정.
- 데이터 fetch는 가능한 한 서버 컴포넌트/Route Handler에서 직접 수행. SWR/React Query는 관리자 에디터처럼 정말 필요한 곳만.
- 변경 계열 API는 NextAuth 세션의 `isAdmin` 체크를 **반드시** 거친다. 클라이언트 검증에만 의존하지 않는다.
- 비밀값을 로그/오류 메시지에 노출하지 않는다.

## 이미지 업로드

- Supabase Storage (public bucket) 사용. 서버 라우트 `POST /api/uploads/image`에서 multipart/form-data로 받아 service role 키로 업로드.
- 허용 MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. 최대 8MB.
- 경로 패턴: `posts/YYYY/MM/<uuid>.<ext>`. 반환되는 public URL을 TipTap Image 노드에 삽입.
- **사전 설정**: Supabase 대시보드 → Storage에서 `blog-images` 이름의 **public** 버킷 생성 필요.

## 미정 사항

- 댓글 기능 — 1차 릴리스 범위 외 (giscus 검토)
- RSS / 사이트맵 — 1차 릴리스 포함 권장
