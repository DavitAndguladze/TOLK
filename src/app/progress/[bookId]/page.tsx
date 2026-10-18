import { notFound } from "next/navigation";
import { mockBook, mockProgress } from "@/mocks";
import { ProgressScreen } from "@/reading/ProgressScreen";

// Mock data until the progress API lands (#12, #13).
export default async function ProgressPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  if (bookId !== mockProgress.bookId) notFound();

  return <ProgressScreen book={mockBook} progress={mockProgress} />;
}
