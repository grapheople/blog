import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export async function AuthStatus() {
  const session = await auth();
  if (!session) {
    return (
      <Link
        href="/signin"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{session.user?.name}</span>
      <SignOutButton />
    </div>
  );
}
