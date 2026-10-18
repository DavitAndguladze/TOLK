// Placeholder home page. The Library (#7) replaces it.
import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="font-book text-3xl">TOLK</h1>
      <Link href="/read" className="mt-2 inline-block text-light underline underline-offset-4">
        Open the mock Chapter
      </Link>
    </main>
  );
}
