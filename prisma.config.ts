import { defineConfig } from "@prisma/config";

process.loadEnvFile?.(".env.local");

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
