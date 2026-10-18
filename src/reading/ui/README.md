# Shared Reading UI (#95)

R2 owns these files. Use direct imports from `@/reading/ui/Button` (and the equivalent component paths). No runtime/UI library is added.

R6 app integration (comms0050): merge the values in `tokens.css` into the existing `src/app/globals.css` `@theme`, retaining the font declarations and page-in animation. Avoid duplicate later definitions of the same brand tokens. Wrap root layout children in `PhoneFrame`. Existing safe-area utilities remain active; desktop gets a 390px shell up to844px tall, mobile fills the viewport. The shell establishes the containing block for fixed controls; scroll belongs to its inner viewport. Check long Chapters, small landscape screens and dialogs on the integrated app before accepting the mount.

- `Button`: native button props plus `variant="primary" | "secondary"`, `loading`, and `fullWidth`. Defaults to `type="button"`; explicitly set `type="submit"` in forms. Loading disables interaction and announces busy; callers retain an informative visible label and announce async success/failure. Navigation stays a real Link, not a button with a placeholder handler.
- `Card`: a presentational div accepting native div props. Supply semantic headings/sections at the call site.
- `SelectCard`: native `type="radio" | "checkbox"`, `title`, optional `description`/`feedback`, and native input props. Group radios with a common name in a fieldset with a legend. Selection uses real checked/onChange state. Correct/incorrect feedback has visible text as well as color; never derive it from ungraded answers.
- `ProgressBar`: `value`, `max`, accessible `label`. Value is a completed count, not a zero-based index. Pass real data; motion is disabled with reduced-motion preferences.
- `Dialog`: controlled `open`, `onClose`, `title`, children. Uses native modal dialog for focus containment, Escape dismissal and background inertness. Keep its trigger mounted so focus returns to it. The built-in Close button only dismisses; pass real actions in children.

Design direction: white/pale-blue paper, navy text, blue actions, green success, amber warning and red error; existing Atkinson/Newsreader fonts; 44px minimum targets, generous reading line height and restrained motion. No scores, sample history or authentication are invented by this kit.
