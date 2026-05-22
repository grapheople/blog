import { signIn } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { error, callbackUrl } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-24 sm:px-6">
      <h1 className="text-xl font-semibold">sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        only the blog admin can sign in.
      </p>
      {error && (
        <p className="mt-4 text-sm text-destructive">
          {error === "AccessDenied"
            ? "이 계정은 관리자가 아닙니다."
            : "로그인에 실패했습니다."}
        </p>
      )}
      <form
        action={async () => {
          "use server";
          const safeCallback =
            callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/admin";
          await signIn("github", { redirectTo: safeCallback });
        }}
        className="mt-6"
      >
        <button
          type="submit"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          GitHub으로 로그인
        </button>
      </form>
    </div>
  );
}
