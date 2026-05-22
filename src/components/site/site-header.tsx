import Link from "next/link";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthStatus } from "./auth-status";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-mono text-sm font-medium tracking-tight"
        >
          Pax.log
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/posts"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            posts
          </Link>
          {session?.user?.isAdmin && (
            <>
              <NavSeparator />
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                admin
              </Link>
            </>
          )}
          <NavSeparator />
          <AuthStatus session={session} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function NavSeparator() {
  return (
    <span aria-hidden className="text-sm text-muted-foreground/40">
      |
    </span>
  );
}
