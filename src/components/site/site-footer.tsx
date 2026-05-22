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
