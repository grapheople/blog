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
