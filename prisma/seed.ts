import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

process.loadEnvFile?.(".env.local");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

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
    contentHtml:
      "<p>이 블로그는 내가 배우고 만든 것들을 기록하는 공간이다.</p>",
    publishedAt: new Date("2026-05-01T00:00:00.000Z"),
    tagSlugs: ["meta"],
  },
  {
    slug: "typescript-strict-mode",
    title: "TypeScript strict mode를 켜야 하는 이유",
    description: "타입 안정성과 리팩토링 안전성 사이의 관계.",
    contentHtml:
      "<p>strict 모드는 단순한 옵션이 아니라 개발 문화의 선택이다.</p>",
    publishedAt: new Date("2026-05-10T00:00:00.000Z"),
    tagSlugs: ["typescript", "tooling"],
  },
  {
    slug: "next-app-router-server-components",
    title: "App Router에서 서버 컴포넌트를 기본값으로",
    description: "클라이언트 컴포넌트는 잎(leaf)에만 둔다.",
    contentHtml:
      "<p>서버에서 데이터에 직접 접근할 수 있다면, 그렇게 한다.</p>",
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
