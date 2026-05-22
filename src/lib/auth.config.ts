import type { NextAuthConfig } from "next-auth";

const ADMIN_GITHUB_ID = process.env.ADMIN_GITHUB_ID;
if (!ADMIN_GITHUB_ID) {
  throw new Error("ADMIN_GITHUB_ID environment variable is not set");
}

export const authConfig = {
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "github") return false;
      return account.providerAccountId === ADMIN_GITHUB_ID;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
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
  providers: [],
} satisfies NextAuthConfig;
