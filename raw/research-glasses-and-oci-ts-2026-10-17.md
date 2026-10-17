# Research — Meta glasses + OCI TypeScript SDK (2026-10-17)

## Meta glasses
- Meta Wearables Device Access Toolkit (DAT): iOS + Android native only (Swift/Kotlin; community Flutter wrapper). Camera, mic, audio, IMU, video, photo. v1.0 stable, rollout from 2026-09-30; store publishing "soon". — https://developers.meta.com/wearables/faq
- Display glasses (Ray-Ban Display): native DAT renders FlexBox/Text/Image/Button/Video components over Bluetooth; each send replaces the whole view; 600×600 display. — https://wearables.developer.meta.com/docs/develop/dat/display-overview/
- **Web Apps** route: runs directly on Ray-Ban Display glasses in HTML/CSS/JS, no SDK; can access device position, location, Neural Band wrist motion. Mic not listed. — https://developers.meta.com/wearables/faq
- Glasses pair to the phone as a Bluetooth audio device, so a phone browser mic capture may pick up the glasses' mic (unverified — test on the actual phone).

## OCI from Node/Next.js
- `oci-aispeech` 2.143.0 on npm (published 2026-10-13); client exposes `createRealtimeSessionToken` → a Next.js route handler can mint realtime tokens.
- `oci-generativeaiinference` 2.143.0 on npm.
- `oracledb` 26.0.0 on npm (node-oracledb; Thin mode needs no Instant Client) for Autonomous DB.
- Realtime browser streaming client: not found on npm under obvious names; a vendored copy exists (`oci-aispeech-realtime-web` inside `sofya.transcription`). Spike task: locate Oracle's official realtime web client on GitHub. — https://app.unpkg.com/sofya.transcription@0.0.16/files/dist/libs/oci-aispeech-realtime-web/ai-speech-api-client.d.ts
- Python SDK also has `RealtimeSessionToken`. — https://docs.oracle.com/en-us/iaas/tools/python/latest/api/ai_speech/models/oci.ai_speech.models.RealtimeSessionToken.html

## Deploy gotcha
- Browser mic (`getUserMedia`) requires HTTPS. Whatever OCI host runs Next.js needs a TLS endpoint.

## Ray-Ban Meta Gen 3 (team's hardware)
- Launched ~2026-09-24, $449; 12MP 3K camera, 6-mic array (>90% background noise reduction), 9h battery. No heads-up display mentioned. — https://arynews.tv/meta-launches-third-generation-ray-ban-smart-glasses-with-longer-battery
