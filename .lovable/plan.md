Update the landing page (`src/routes/index.tsx`) to remove the waitlist concept and replace the current calls-to-action with the new three-part layout:

1. Primary CTA: "Join a Gathering" purple gradient button → links to `/auth` (for user signup/signin).
2. Secondary CTA: "Partner With Us" outlined button → links to `/venue/auth` (for venue/business partners).
3. Tertiary text link: "Log In" small text link below the buttons → links to `/auth`.

Remove all existing `/waitlist` links, the "Sign Up" secondary button, the "Join the Table" primary button, and the hardcoded "2,000+ connections made" stat line. Keep the visual effects (nebula blobs, particles, constellation), logo, headline, subtext, language switcher, and bottom footer links intact.

No backend or route changes are required; this is purely a homepage UI copy/link update.