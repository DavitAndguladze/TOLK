# Gatsby source

`pg64317.txt` is the complete Project Gutenberg edition of *The Great Gatsby* by F. Scott Fitzgerald, downloaded from https://www.gutenberg.org/cache/epub/64317/pg64317.txt on 2026-10-17. The catalog is https://www.gutenberg.org/ebooks/64317 and identifies the work as public domain in the USA. The source retains its attribution and Project Gutenberg license.

Source SHA-256: `ce760ec377accd352b41bb8f64504a72d7aa18ab3afb42ded2b56cecacf29e35`.

Ingestion normalizes line endings and extracts complete Chapters. The initial content pipeline processes Chapters 1–4; retaining the complete source does not imply all nine Chapters have generated versions or Checks.

`content.json` contains those four complete original Chapters, five source-cited Key Points per Chapter, contextual Complex Words, and explicit name/vocabulary policies. It derives from the 2026-10-17 OCI metadata extraction, followed by agent source review: citations were re-indexed after removing Gutenberg section dividers from sentence mappings; Key Points were corrected to concrete events across each Chapter; missing proper names and four contextual meanings were corrected. A second agent reviewed the Key Points and meanings. This is **agent-reviewed source metadata, still requiring human review**, not a fresh successful model extraction or a ready Chapter seed.

Every metadata quote was checked against its exact indexed original sentence, and every required name against the original Chapter. Original sentence counts are 362, 308, 388, and 373. No ready Chapter Version, matching Chapter Check, or fidelity approval is implied by this file. Generated prose and its Check must independently pass all generator gates before serving, and this content must never replace Reader progress.

The offline editorial policy retains `green` as Chapter 1's fifth explicit teaching word, with the distant-light source citation. Goddard and *The Rise of the Coloured Empires* were also restored to the proper-name policy from their exact source text. These are documented agent editorial additions, not fresh OCI extraction. Numeric literals represent dates and quantities outside the English vocabulary-frequency lookup; they still count toward sentence length, must preserve source quantities, and remain subject to fidelity review. Spelled-out numbers and unknown alphabetic words retain the same rank checks.
