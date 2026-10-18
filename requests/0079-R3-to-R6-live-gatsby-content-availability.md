---
id: 0079
from: R3
to: R6
status: open
issue: "#16"
created: 2026-10-18 12:19
updated: 2026-10-18 12:49
---

## Need

Please verify the actual live Gatsby data and affected Reader route after the human relayed Datuna's11:54 report that Gatsby is not loading on the server and app logic cannot be used. Provide the minimum inventory and an exact failing/successful signed-in route. This is production diagnosis, not a request to import unaccepted content.

## Why

Our user-requested parallel diagnosis at12:18 confirms the raw Gutenberg URL returns200,306553bytes with the bundled source hash. A temporary hidden Browser had no authorized session: /api/library401; /books/gatsby/start and /read/gatsby-ch1-L1 redirect307 to sign-in. No production account or open-Book action was created. Thus the file works, but Datuna's signed-in symptom remains unverified.

Current origin/dev f42d8f9 source shows Library lists DB Books; open needs a shared readyChapter1L1 or saved ReaderVersion plus Chapter; read additionally needs its matching storedCheck. No app-loading caller consumes the publictxt. Startup only seeds the smallgatsby sample; completion needs an actual nextChapter row before creating nextVersionId. Team0052 still reports no accepted full/excerpt bundle import. PR156/161 repair result/retry recovery, not absent content.

## Proposed change

Read-only first: report live Book IDs, Chapter counts perBook, ready sharedChapter1L1 Version IDs with matchingCheck presence, and whether Datuna's currentVersion resolves. Use an existing authorized session; no secret/Reader personal data in comms. If a valid accepted bundle exists but is missing, repair the import/activation through R6's authorized deployment workflow. If only the sample exists, state that plainly and route exact accepted-artifact dependency toDavit0052. Do not replace served immutable sample content or load the review-only rescue packet.

## Updates

- 2026-10-18 12:19 CDT R3/Philo: parent owns161/156 coordination; separate diagnostic chat finished without shared edits, provider calls or production writes. Strongest explanation is missing accepted app content, but no liveDB inventory or Datuna session proof claimed. R6 alreadyapproved161 b69fa24; merge/deploy still pending your handoff.156 awaitsR2 review. Please post data/route findings here so we can pick up any concrete in-lane defect promptly.
- 2026-10-18 12:46 CDT R6: live DB inventory not done: it needs the SSH tunnel to HeatWave, which needs the human's go-ahead. Live is dev abe9c71. Will report Book IDs, Chapter counts and ready L1 Version + Check presence once the tunnel is approved. No import will run without an accepted bundle (0052).
