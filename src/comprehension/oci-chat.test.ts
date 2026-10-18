import { describe, expect, test } from "vitest";
import { replyText } from "./oci-chat";

/** An OCI GENERIC chat response, shaped like the SDK's (finishReason values seen live: "stop", "length"). */
const response = ({ finishReason = "stop", content = [{ type: "TEXT", text: '{"grade": 2}' }] as object[] } = {}) => ({
  chatResult: { chatResponse: { apiFormat: "GENERIC", choices: [{ index: 0, finishReason, message: { role: "ASSISTANT", content } }] } },
});

describe("replyText", () => {
  test("is the reply's text when OCI finished it normally", () => {
    const text = replyText(response({ content: [{ type: "TEXT", text: '{"grade": ' }, { type: "TEXT", text: "2}" }] }));

    expect(text).toBe('{"grade": 2}');
  });

  test.each<[string, unknown, RegExp]>([
    ["was cut off at maxTokens", response({ finishReason: "length" }), /cut off/],
    ["was stopped for another reason (e.g. a content filter)", response({ finishReason: "content_filter" }), /content_filter/],
    ["has a part that isn't text", response({ content: [{ type: "IMAGE", imageUrl: {} }] }), /not text/],
    ["is empty", response({ content: [{ type: "TEXT", text: "  " }] }), /empty/],
    ["has no choices", { chatResult: { chatResponse: { apiFormat: "GENERIC", choices: [] } } }, /no reply/],
    ["is a stream or nothing", null, /no reply/],
  ])("throws when the reply %s", (_, reply, message) => {
    expect(() => replyText(reply)).toThrow(message);
  });
});
