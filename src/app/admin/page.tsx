import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold">admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        signed in as {session?.user?.name ?? "(unknown)"} · admin:{" "}
        {session?.user?.isAdmin ? "yes" : "no"}
      </p>
    </div>
  );
}
