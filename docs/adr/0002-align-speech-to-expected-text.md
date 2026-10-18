# Score reading by aligning speech to the expected Page, not by trusting the transcript

Status: accepted (2026-10-17)

We use OCI Speech realtime, but speech-to-text auto-corrects misreadings toward real words, which hides the errors we need to score. Because the expected Page text is known, we pass it as custom vocabulary and align the recognized words against it client-side to mark each word correct / substituted / skipped / hesitated. Browser Web Speech API stays behind a flag as a fallback if OCI latency or word timestamps fail the first-hour spike.
