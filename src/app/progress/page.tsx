import { redirect } from "next/navigation";
import { listLibrary } from "@/db";
import { requireReader } from "@/platform/auth";

// The Reader's current Book: the first one they have opened. Back to the Library if they have none yet.
export default async function CurrentProgressPage() {
  const reader = await requireReader();
  const current = (await listLibrary(reader.id)).find((book) => book.progress);
  redirect(current ? `/progress/${current.id}` : "/");
}
