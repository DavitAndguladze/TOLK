# Glasses: read a paper book (option B, P2 experiment)

Team owns Ray-Ban Meta Gen 3 (D22). Goal: read a physical book; glasses see the page; app listens and asks Comprehension Checks.

## Blocker found
Meta's Wearables Device Access Toolkit (native iOS/Android only) listed supported devices as Gen 1, Gen 2, Ray-Ban Display, and Oakley Meta models. **Gen 3 was not on the list** as of the Sept 23, 2026 coverage. — https://vr.org/articles/meta-glasses-three-tiers-wearables-toolkit-publishing-connect-2026

## Plan
1. **20-min check (R5, Sat ~7pm)**: install Meta's sample app (DAT) on a phone; does it see the Gen 3?
2. **If yes — native path**: tiny native app: capture still photo → POST to our `/api/paper-page` → OCI Vision text detection (`AnalyzeImage`, ≤5 MB) → a Paper Page appears in the PWA. — https://docs.oracle.com/en-us/iaas/Content/vision/using/pretrained_model_calling_single_text.htm
3. **If no — zero-native path**: "Hey Meta, take a photo" → photo syncs to the phone via the Meta AI app → PWA "Add paper page" upload → same OCI Vision route. Slower, still demoable.

## What a Paper Page supports
- Listening + highlighting against the OCR'd text (same alignment)
- Comprehension Checks generated on the fly from the OCR text (no pre-generated Key Points)
- No re-leveling (the paper text is fixed); optionally show a Leveled version of a hard sentence on the phone

## Pitch value
"Read any book on your shelf, hands-free" — roadmap slide even if the live demo is cut.
