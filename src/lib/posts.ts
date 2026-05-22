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
