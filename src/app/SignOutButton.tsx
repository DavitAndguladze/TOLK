"use client";
import { useRouter } from "next/navigation";
import { authClient } from "@/platform/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
      className="-my-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-light underline-offset-4 outline-light hover:underline focus-visible:outline-2"
    >
      Sign out
    </button>
  );
}
