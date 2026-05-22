import Link from "next/link";
import type { Session } from "next-auth";
import { SignOutButton } from "./sign-out-button";

export function AuthStatus({ session }: { session: Session | null }) {
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
      <SignOutButton />
    </div>
  );
}
