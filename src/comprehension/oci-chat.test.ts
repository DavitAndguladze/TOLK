import { describe, expect, test } from "vitest";
import type { responses } from "oci-generativeaiinference";
import { replyFrom } from "./oci-chat";

/** A minimal GENERIC chat response with one choice, shaped like the real SDK response. */
function response(choice: { finishReason: string; content: { type: string; text?: string }[] | undefined }): responses.ChatResponse {
  return {
    chatResult: {
      chatResponse: {
        apiFormat: "GENERIC",
        choices: [{ index: 0, finishReason: choice.finishReason, message: { role: "ASSISTANT", content: choice.content } }],
      },
    },
  } as unknown as responses.ChatResponse;
}

describe("replyFrom", () => {
  test("returns the joined text of a cleanly finished reply", () => {
    const reply = replyFrom(response({ finishReason: "stop", content: [{ type: "TEXT", text: "Yes, " }, { type: "TEXT", text: "that's it." }] }));
    expect(reply).toBe("Yes, that's it.");
  });

  test("rejects a reply cut off by the token limit", () => {
    expect(() => replyFrom(response({ finishReason: "length", content: [{ type: "TEXT", text: "Yes, that's" }] }))).toThrow(/finishReason/);
  });

  test("rejects a content-filtered reply", () => {
    expect(() => replyFrom(response({ finishReason: "content_filter", content: [{ type: "TEXT", text: "" }] }))).toThrow(/finishReason/);
  });

  test("rejects non-text content", () => {
    expect(() => replyFrom(response({ finishReason: "stop", content: [{ type: "IMAGE" }] }))).toThrow(/non-text/);
  });

  test("rejects an empty content list", () => {
    expect(() => replyFrom(response({ finishReason: "stop", content: [] }))).toThrow(/non-text/);
  });

  test("rejects a blank reply", () => {
    expect(() => replyFrom(response({ finishReason: "stop", content: [{ type: "TEXT", text: "   " }] }))).toThrow(/empty reply/);
  });

  test("rejects a response with no choices", () => {
    const empty = { chatResult: { chatResponse: { apiFormat: "GENERIC", choices: [] } } } as unknown as responses.ChatResponse;
    expect(() => replyFrom(empty)).toThrow(/no choice/);
  });

  test("rejects a null response", () => {
    expect(() => replyFrom(null)).toThrow(/no chat result/);
  });

  test("rejects a response with no chatResult (e.g. a streamed response)", () => {
    expect(() => replyFrom(new ReadableStream())).toThrow(/no chat result/);
  });
});
