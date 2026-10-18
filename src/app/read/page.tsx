import { redirect } from "next/navigation";
import { mockChapterVersion } from "@/mocks";

// Until the Library (#7) opens a Reader's own Chapter Version, start at Chapter 1, L1.
export default function ReadPage() {
  redirect(`/read/${mockChapterVersion(1).id}`);
}
