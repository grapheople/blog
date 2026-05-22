"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof FileText;
  match: (pathname: string) => boolean;
};

const MENU: MenuItem[] = [
  {
    href: "/admin",
    label: "글쓰기",
    icon: FileText,
    match: (p) => p === "/admin" || (p.startsWith("/admin/") && !p.startsWith("/admin/tags")),
  },
  {
    href: "/admin/tags",
    label: "태그관리",
    icon: Tags,
    match: (p) => p.startsWith("/admin/tags"),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 sm:w-48">
      <div className="mb-4 px-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        admin
      </div>
      <nav className="flex flex-row gap-1 sm:flex-col">
        {MENU.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 hidden border-t pt-4 sm:block">
        <Link
          href="/"
          className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          ← 블로그로
        </Link>
      </div>
    </aside>
  );
}
