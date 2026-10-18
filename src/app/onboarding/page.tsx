// First sign-in (#99): the Reader picks Reading Goals and Favourite Genres, then the screen saves and returns to the Library.
import { connection } from "next/server";
import { getReaderPreferences } from "@/db";
import { requireReader } from "@/platform/auth";
import { OnboardingScreen } from "@/reading/OnboardingScreen";

export default async function OnboardingPage() {
  await connection(); // per request, so `next build` never prerenders it (no database at build)
  const reader = await requireReader("/welcome");
  return <OnboardingScreen readerId={reader.id} initialPreferences={await getReaderPreferences(reader.id)} />;
}
