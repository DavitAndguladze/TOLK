import { notFound } from "next/navigation";
import { getProgressView } from "@/comprehension/progress";
import { getBook } from "@/db";
import { requireReader } from "@/platform/auth";
import { ProgressScreen } from "@/reading/ProgressScreen";

export default async function ProgressPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const reader = await requireReader();
  const [book, progress] = await Promise.all([getBook(bookId), getProgressView(reader.id, bookId)]);
  if (!book || !progress) notFound();

  return <ProgressScreen book={book} progress={progress} />;
}
