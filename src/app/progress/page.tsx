import { redirect } from "next/navigation";
import { mockBook } from "@/mocks";

// The Reader's current Book. Mock data until sign in and the Library (#7) know which Book that is.
export default function CurrentProgressPage() {
  redirect(`/progress/${mockBook.id}`);
}
