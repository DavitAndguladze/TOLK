# R3 OCI text generation transport

Official sources checked 2026-10-17. No credentials or live inference were available in this worktree. The team reports Maverick working in Chicago; this note does not independently verify that report.

## API and signing

Oracle's [TypeScript inference client source](https://github.com/oracle/oci-typescript-sdk/blob/master/lib/generativeaiinference/lib/client.ts) sends `POST /20231130/actions/chat`. Its commercial-realm endpoint is `https://inference.generativeai.<region>.oci.oraclecloud.com`. The raw JSON response is a `ChatResult`; the SDK adds its own `chatResult` wrapper, which is not part of the HTTP body.

OCI [request signing](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/signingrequests.htm) uses RSA-SHA256 with a version-1 `Authorization: Signature` header. POST signs `(request-target)`, `host`, `date`, `x-content-sha256`, `content-type`, and `content-length`, in the order named in `headers`. Hash the exact UTF-8 body and use its byte length. The key identifier is `tenancy OCID/user OCID/fingerprint`. Clock skew over five minutes can fail authentication.

Oracle requires an uploaded public key paired with a [PEM RSA private key of at least 2048 bits](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm). This transport reads an unencrypted key once, from an explicitly supplied absolute file path. It does not discover profiles, read a default key, or accept a private key in environment text. Encrypted keys and non-commercial realms are outside this slice.

## Generic text schema

The [ChatDetails](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_generativeaiinference_lib_model_chat_details_.chatdetails.html) request contains `compartmentId`, `servingMode`, and `chatRequest`. [OnDemandServingMode](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_generativeaiinference_lib_model_on_demand_serving_mode_.ondemandservingmode.html) carries `servingType: "ON_DEMAND"` and `modelId`.

The [generic request](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_generativeaiinference_lib_model_generic_chat_request_.genericchatrequest.html) used here is:

```json
{
  "compartmentId": "<configured compartment OCID>",
  "servingMode": { "servingType": "ON_DEMAND", "modelId": "<configured model>" },
  "chatRequest": {
    "apiFormat": "GENERIC",
    "messages": [{ "role": "USER", "content": [{ "type": "TEXT", "text": "<prompt>" }] }],
    "isStream": false,
    "numGenerations": 1,
    "maxTokens": 4000,
    "temperature": 0
  }
}
```

[ChatResult](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_generativeaiinference_lib_model_chat_result_.chatresult.html) contains `chatResponse`; the [generic response](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_generativeaiinference_lib_model_generic_chat_response_.genericchatresponse.html) has `apiFormat: "GENERIC"` and `choices`. Each [choice](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_generativeaiinference_lib_model_chat_choice_.chatchoice.html) has a `message` and `finishReason`; reaching the token limit returns a length finish. [Assistant messages](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_generativeaiinference_lib_model_assistant_message_.assistantmessage.html) use role `ASSISTANT`, and [text content](https://docs.oracle.com/en-us/iaas/tools/typescript/latest/modules/_generativeaiinference_lib_model_text_content_.textcontent.html) uses `{ "type": "TEXT", "text": "..." }`.

The transport accepts exactly one choice with a case-insensitive `stop` finish and nonblank text-only content, concatenating parts without added separators. Length finishes fail as `truncated`; missing, filtered, nontext, or otherwise malformed responses fail as `response`. Chapter JSON parsing and content validation remain the caller's responsibility.

## Token limits and integration

Oracle's [Maverick model page](https://docs.oracle.com/en-us/iaas/Content/generative-ai/meta-llama-4-maverick.htm) identifies `meta.llama-4-maverick-17b-128e-instruct-fp8`, on-demand availability in Chicago, a 512,000-token context, and an explicit **4,000-token on-demand output cap**. A full Chapter plus sentence mappings can exceed this: a successful HTTP response is not evidence of a complete Chapter. Assembly of bounded passages or validated fallback belongs above this transport.

The [gpt-oss-120b model page](https://docs.oracle.com/en-us/iaas/Content/generative-ai/openai-gpt-oss-120b.htm) states a 128,000-token combined context and a **16,000-token playground output cap**. It does not state a separate API output cap. The generic request reference still says on-demand output is capped at 4,000, so these sources do not establish an unambiguous gpt-oss API output allowance. A configured model and larger `maxTokens` require live verification; this transport permits an explicit positive integer budget without promising support. No model default is selected here.

`createOciTextGenerator(config)` returns `(prompt, { signal }?) => Promise<string>`. The integration maps the existing `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_FINGERPRINT`, `OCI_PRIVATE_KEY_PATH`, `OCI_COMPARTMENT_OCID`, `OCI_GENAI_REGION`, and `OCI_GENAI_MODEL_ID` variables to the corresponding config fields. Optional `maxTokens` defaults to 4000 and `timeoutMs` to 20,000. A caller signal can enforce a shorter overall generation budget. No retries occur here; retry/fallback policy belongs to Chapter generation.

Requests stay on the fixed Oracle HTTPS endpoint with redirects disabled. `OciGenerationError.code` is one of `configuration`, `request`, `http`, `network`, `response`, `truncated`, `aborted`, or `timeout`; only `http` includes a numeric `status`. Errors never include provider bodies, prompts, key paths, or underlying error causes, and the transport does not log them.

Local tests verify signatures with temporary generated RSA keys, exact request data, unsafe configuration, response validation, error redaction, and cancellation through body consumption. They cannot verify IAM permissions, model availability, latency, prose quality, or deployed behavior.
