import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:gap-10 sm:px-6 sm:py-12">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
      <div className="border-t pt-4 sm:hidden">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 블로그로
        </Link>
      </div>
    </div>
  );
}
