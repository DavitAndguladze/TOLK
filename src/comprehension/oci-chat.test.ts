import { describe, expect, test } from "vitest";
import { chatRequest, replyText } from "./oci-chat";

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

describe("chatRequest", () => {
  test("asks for plain text with 200 tokens at temperature 0 by default", () => {
    expect(chatRequest("Grade this.")).toEqual({
      apiFormat: "GENERIC",
      messages: [{ role: "USER", content: [{ type: "TEXT", text: "Grade this." }] }],
      maxTokens: 200,
      temperature: 0,
    });
  });

  test("asks OCI for a JSON object when the caller wants JSON (comms 0016)", () => {
    const request = chatRequest("Grade this.", { json: true, maxTokens: 4000 });

    expect(request.responseFormat).toEqual({ type: "JSON_OBJECT" });
    expect(request.maxTokens).toBe(4000);
  });
});
