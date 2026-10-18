# R6 setup needed for the R1 listening spike

Verified 2026-10-17 against Oracle documentation and the checked-out spike. This is setup guidance, not evidence of a successful OCI session. No resources or policies were changed.

## Minimum practical handoff for local issue #5

R6 supplies the target **compartment OCID**, **commercial region identifier**, and a server identity authorized for Speech in that compartment. Oracle's browser example uses these three inputs: its server retrieves a realtime JWT and passes it to the browser, which connects directly to Speech. It does not provision an Object Storage bucket or submit a batch transcription job. Therefore neither is a dependency of this spike. [Oracle browser example](https://raw.githubusercontent.com/oracle/oci-ai-speech-realtime-web-sdk/main/example-client/README.md)

On this machine, use one of the two authentication paths already implemented in `src/listening/spike/vite.config.ts`:

- Preferred existing-profile path: an API-key `[DEFAULT]` profile in `~/.oci/config`, containing `user`, `tenancy`, `fingerprint`, `key_file`, and `region`. The no-argument `ConfigFileAuthenticationDetailsProvider` selects the default profile; the spike does not select a named profile or implement interactive session authentication.
- Explicit path: server-only `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_FINGERPRINT`, and `OCI_PRIVATE_KEY_PATH` in repo-root `.env.local`. Relative key paths resolve from the repo root. This path supplies no key passphrase, so it needs an unencrypted PEM readable by the server account.

Both paths additionally need `OCI_COMPARTMENT_OCID` and `OCI_SPEECH_REGION` (or `OCI_REGION`) in repo-root `.env.local`. No private key, JWT, or credential contents belong in chat, Git, or browser environment variables. Oracle documents API-key configuration and public-key registration in its [SDK authentication guide](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdk_authentication_methods.htm). Local provider behavior is verified in `src/listening/spike/node_modules/oci-common/lib/auth/config-file-auth.js`.

Restart the spike server after configuring it. Start with the existing README commands and `http://127.0.0.1:5175`; keep its unauthenticated token route on loopback.

## IAM: documented policy versus unverified least privilege

Oracle documents `ai-service-speech-family` as an aggregate resource type. It provides a compartment-scoped group policy of the following form, which R6's IAM administrator can assess:

```text
Allow group <group-name> to manage ai-service-speech-family in compartment <compartment-name>
```

Here `manage` is the verb, `ai-service-speech-family` the resource type, and the group contains the API-key user. An instance principal instead uses a `dynamic-group` subject. This grants broad Speech access, **not verified least privilege**. Avoid the tenancy-wide `any-user` example. [Oracle Speech policy reference](https://docs.oracle.com/en-us/iaas/Content/speech/using/policies.htm)

The reference omits `CreateRealtimeSessionToken` from its permission table and lists no individual realtime resource. `AI_SERVICE_SPEECH_TRANSCRIPTION_JOB_CREATE` explicitly maps to **CreateTranscriptionJob**; it is not proven authorization for token creation. Neither the `use` verb nor a realtime resource name is established here. R6 should validate the intended identity and narrow permissions using confirmed IAM behavior or Oracle guidance. [Oracle Speech policy reference](https://docs.oracle.com/en-us/iaas/Content/speech/using/policies.htm)

## Region and activation

Oracle states that Speech is available in all OCI commercial regions and lists a default limit of ten concurrent Live Transcribe sessions per tenancy. This is general service availability; R6 must confirm the chosen region is enabled for the tenancy and accepts the actual realtime token/session call. The reviewed realtime example documents no separate service activation or allowlist step. That absence does not establish this tenancy's entitlement or quota. [Oracle Speech overview](https://docs.oracle.com/en-us/iaas/Content/speech/using/speech.htm)

The browser WebSocket uses `wss://realtime.aiservice.<region>.oci.oraclecloud.com`, while token creation uses the regional Speech HTTPS API. Permit outbound HTTPS/WSS. Oracle explicitly distinguishes these endpoints. [Oracle Web SDK README](https://github.com/oracle/oci-ai-speech-realtime-web-sdk)

## Deployed validation and the R6 contract

After the local microphone experiment works, R6 supplies the deployed HTTPS URL and an authenticated server `POST /api/speech/token`. The exact existing `src/types/index.ts` contract is:

```ts
{ req: void; res: {
  token: string;
  region: string;
  compartmentId: string;
  expiresAt: string;
} }
```

`token` is the OCI-issued realtime JWT; `region` is the region identifier; `compartmentId` is its compartment; `expiresAt` is an ISO timestamp. The local route derives expiry from the JWT's `exp` claim. Oracle's own token response includes the token and compartment, and describes expiry as part of the JWT. [Oracle RealtimeSessionToken model](https://docs.oracle.com/en-us/iaas/tools/python/latest/api/ai_speech/models/oci.ai_speech.models.RealtimeSessionToken.html)

Production instance-principal authentication is a separate server implementation choice: the current Vite route does not use it. Oracle recommends a server on OCI with instance-principal authentication for its browser Speech integration; that requires a dynamic group/policy and an instance-principal SDK provider, removing local user credentials from the instance. The static spike build has no token server and must not be published as if it supplied this route. [Oracle Speech integration](https://docs.oracle.com/en/cloud/paas/digital-assistant/use-chatbot/features-oracle-web.html), [Oracle SDK authentication methods](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdk_authentication_methods.htm)

Successful token issuance alone is insufficient acceptance evidence: R1 still needs actual microphone transcription, word timestamps/confidence, latency observations, failure handling, and the target browser/device check described in the spike README.
