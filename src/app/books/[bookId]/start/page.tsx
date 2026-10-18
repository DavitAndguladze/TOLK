// Opening a Book from the Library (#100): a Reader's very first Chapter starts with the intro; everyone else goes straight in.
import { redirect } from "next/navigation";
import { getFirstChapterIntro } from "@/db";
import { FirstChapterIntro } from "@/listening/onboarding/FirstChapterIntro";
import { requireReader } from "@/platform/auth";

export default async function StartBook({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const reader = await requireReader();
  const openHref = `/api/books/${encodeURIComponent(bookId)}/open`; // the existing open flow: records progress, lands on /read
  const intro = await getFirstChapterIntro(reader.id, bookId);
  if (!intro) redirect(openHref);
  return <FirstChapterIntro bookTitle={intro.bookTitle} chapterTitle={intro.chapterTitle} questionCount={intro.questionCount} startHref={openHref} />;
}
