# OCI research notes — 2026-10-17

- OCI Speech has a realtime API: Python SDK exposes `oci.ai_speech.models.RealtimeMessageResult` — https://docs.oracle.com/en-us/iaas/tools/python/latest/api/ai_speech/models/oci.ai_speech.models.RealtimeMessageResult.html
- A browser realtime client package exists on npm (`oci-aispeech-realtime-web`, seen vendored inside `sofya.transcription`) — https://app.unpkg.com/sofya.transcription@0.0.16/files/dist/libs/oci-aispeech-realtime-web/ai-speech-api-client.d.ts
- OCI Speech supports custom vocabulary and TTS; Apr 2024 post said TTS was English-only, limited voices, Phoenix region on request (likely expanded since — unverified) — https://blogs.oracle.com/ai-and-datascience/oci-speech-texttospeech-realtime-transcription-custom-vocab ; newer voices: https://blogs.oracle.com/ai-and-datascience/oci-speechs-tts-now-supports-additional-voices
- OCI Generative AI hosts OpenAI gpt-oss and Google Gemini 2.5 (plus Cohere/Meta families) — https://docs.oracle.com/iaas/releasenotes/generative-ai/openai-gpt-oss.htm , https://docs.oracle.com/iaas/releasenotes/generative-ai/gemini-2-5-GA.htm

## To verify on site
- Word-level timestamps + confidence from OCI realtime STT (critical for word-by-word grading)
- Which GenAI region your tenancy/credits can use; on-demand model list in that region
- Realtime STT latency from a laptop browser
