# Shared Reading UI (#95)

R2 owns these files. Use direct imports from `@/reading/ui/Button` (and the equivalent component paths). No runtime/UI library is added.

R6 app integration (comms0050): merge the values in `tokens.css` into the existing `src/app/globals.css` `@theme`, retaining the font declarations and page-in animation. Avoid duplicate later definitions of the same brand tokens. Wrap root layout children in `PhoneFrame`. Existing safe-area utilities remain active; desktop gets a 390px shell up to844px tall, mobile fills the viewport. The shell establishes the containing block for fixed controls; scroll belongs to its inner viewport. Check long Chapters, small landscape screens and dialogs on the integrated app before accepting the mount.

- `Button`: native button props plus `variant="primary" | "secondary"`, `loading`, and `fullWidth`. Defaults to `type="button"`; explicitly set `type="submit"` in forms. Loading disables interaction and announces busy; callers retain an informative visible label and announce async success/failure. Navigation stays a real Link, not a button with a placeholder handler.
- `Card`: a presentational div accepting native div props. Supply semantic headings/sections at the call site.
- `SelectCard`: native `type="radio" | "checkbox"`, `title`, optional `description`/`feedback`, and native input props. Group radios with a common name in a fieldset with a legend. Selection uses real checked/onChange state. Correct/incorrect feedback has visible text ("Correct" / "Not quite") as well as color; never derive it from ungraded answers. Incorrect feedback does not promise another try.
- `ProgressBar`: `value`, `max`, accessible `label`. Value is the amount advanced, such as answered questions out of the total. Reading position uses Chunk boundaries already passed out of the total boundaries; it does not claim the current Chunk has been completed. Pass real data; motion is disabled with reduced-motion preferences.
- `Dialog`: controlled `open`, `onClose`, `title`, children, optional `actions`. Uses native modal dialog for focus containment, Escape dismissal and background inertness. Keep its trigger mounted so focus returns to it. Without `actions`, the built-in Close button dismisses the modal. Supplied `actions` replace that button, allowing "Keep going" and "Leave" with real caller-owned handlers; closing through either action must update the controlled `open` state. Pass `actions={null}` to omit footer controls.

For a question counter, use `ProgressBar` with `showPercent={false}` to hide the visible percentage while retaining the labelled progressbar and numeric accessibility values. The default remains `true`.

Design direction: white/pale-blue paper, navy text, blue actions, green success, amber warning and red error; existing Atkinson/Newsreader fonts; 44px minimum targets, generous reading line height and restrained motion. No scores, sample history or authentication are invented by this kit.
