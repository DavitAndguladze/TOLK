// Open a Book at the Reader's current Chapter Version (#7). POST is the Api contract; GET serves a plain Library link.
import { redirect } from "next/navigation";
import type { Api } from "@/types";
import { openBook } from "@/db";
import { getReader } from "@/platform/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ bookId: string }> }) {
  const reader = await getReader();
  if (!reader) return Response.json({ error: "Sign in first" }, { status: 401 });
  const opened = await openBook(reader.id, (await ctx.params).bookId);
  if (!opened) return Response.json({ error: "Book not found" }, { status: 404 });
  return Response.json(opened satisfies Api["POST /api/books/[bookId]/open"]["res"]);
}

export async function GET(_req: Request, ctx: { params: Promise<{ bookId: string }> }) {
  const reader = await getReader();
  if (!reader) redirect("/sign-in");
  const opened = await openBook(reader.id, (await ctx.params).bookId);
  if (!opened) return new Response("Book not found", { status: 404 });
  redirect(`/read/${opened.version.id}`);
}
