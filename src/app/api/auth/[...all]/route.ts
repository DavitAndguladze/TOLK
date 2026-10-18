import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/platform/auth";

export const GET = (req: Request) => toNextJsHandler(auth()).GET(req);
export const POST = (req: Request) => toNextJsHandler(auth()).POST(req);
