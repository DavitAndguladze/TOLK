// Sign in / create account (#7). A Reader who is already signed in goes straight to the Library.
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getReader } from "@/platform/auth";
import { SignInForm } from "./SignInForm";

export default async function SignInPage() {
  await connection(); // per request, so `next build` never prerenders it (no database at build)
  if (await getReader()) redirect("/");

  return (
    <main className="min-h-full px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-12">
      <div className="mx-auto max-w-sm">
        <h1 className="font-book text-[2.25rem] leading-tight font-medium">TOLK</h1>
        <p className="mt-1 font-book text-[1.0625rem] text-fog italic">Read aloud, one Level closer to the original.</p>
        <SignInForm />
      </div>
    </main>
  );
}
