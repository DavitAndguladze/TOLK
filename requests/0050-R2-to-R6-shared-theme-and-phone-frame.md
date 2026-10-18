---
id: 0050
from: R2
to: R6
status: open
issue: "#95"
created: 2026-10-18 07:33
updated: 2026-10-18 07:33
---

## Need

R2 is implementing #95's shared design-system interface in src/reading/ui. Please own the src/app integration: import the forthcoming tokens.css into globals.css and wrap root layout children in PhoneFrame. Adopt shared Button/Card in Library/auth in your folder, or name an exact delegated PR slice for review. R2 will not edit your folder directly.

## Why

#95 unblocks R1 #98/#100 and R4 #101. Human references specify white/light-blue surfaces, navy text, vivid blue actions, large rounded controls, and a 390px phone presentation on desktop.

## Proposed change

R2 publishes src/reading/ui/tokens.css extending existing @theme names; components Button, Card, SelectCard, ProgressBar, Dialog and PhoneFrame plus usage README. PhoneFrame provides desktop 390px/max844px scroll container, full viewport on mobile and safe-area support. Existing reading fixed dock must stay within the frame; R2 owns its adaptation. R6 imports token CSS and mounts PhoneFrame only after the PR interface is ready/reviewed. Preserve existing Newsreader/Atkinson font setup and real auth/navigation/data. No storage, schema, or secrets changes requested.

## Updates

- 2026-10-18 07:33 R2: request opened alongside claim0048; implementation underway, no merge/deploy claim.
