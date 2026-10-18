// First open for a signed-out visitor (#98): R1's Welcome leads into the real sign-in / create-account form.
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { WelcomeScreen } from "@/listening/onboarding/WelcomeScreen";
import { getReader } from "@/platform/auth";

export default async function WelcomePage() {
  await connection(); // per request, so `next build` never prerenders it (no database at build)
  if (await getReader()) redirect("/");
  return <WelcomeScreen signUpHref="/sign-in?mode=create" signInHref="/sign-in" />;
}
