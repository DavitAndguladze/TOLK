# Welcome (#98)

`WelcomeScreen` accepts required `signUpHref` and `signInHref`, both real routes supplied by R6. It uses native Next links and the shared #95 control styles. It contains no authentication, fake account flow, placement test or score.

R6 integration is requested on comms0053: mount `/welcome` behind a server-side `getReader` check, redirect signed-in Readers to Library, and supply actual Better Auth entry routes. The existing form currently controls create mode internally, so a query string is not assumed to work until R6 adds/reviews that support. Existing auth error handling remains in the platform form. Root signed-out first entry may route to Welcome; direct sign-in remains available.

The original SVG book is authored in this component. On first mount the splash offers Skip and completes after1200ms. A non-secret device flag (`tolk-welcome-seen-v1`) prevents replay on later visits. Reduced-motion preference skips directly to Welcome; CSS animation also runs only when no motion reduction is requested. Unavailable storage skips the splash instead of blocking entry. Browser storage clearance can reset first-visit presentation; no Reader progress is stored here. The heading receives focus when Welcome appears so the disappearing Skip control does not strand keyboard focus. Unmount cancels the timer.

#100's per-Reader first-Chapter eligibility, actual Check question count and reading-time estimate need the existing auth/progress/content data from the page owner. They are not inferred from this per-device splash flag.
