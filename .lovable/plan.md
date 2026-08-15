# Real matching quiz on the landing page

Today the matching section on "/" is a static mockup: one fake question with a pre-selected answer and three hard-coded match bars. This turns it into a real, optional quiz a visitor can actually take, with computed trait scores and a personalised preview result — still entirely on the landing page, no account required.

## The quiz

Four traits make up the model:

- Spark — how much you drive the energy of a table
- Curiosity — how much you like new subjects and new people
- Warmth — how much you tend to the group's comfort
- Depth — one long conversation vs. many light ones

12 questions, each a short playful scenario with 3 emoji/icon answers. Every answer adds weight to one or two traits. Questions are shown one at a time inside the existing quiz card, with a "question N of 12" label and a thin progress bar. The current static question stays as question 4 so nothing about the section's look changes at rest.

Rules:
- Optional. The card opens in its current preview state with a "Take the quiz" button; nothing runs until the visitor clicks.
- Back button on every question after the first; "Skip" is allowed and simply doesn't score that question.
- Answers persist in the browser only, so a refresh or a scroll away doesn't lose progress.
- "Start over" resets it.

## The result

When the last question is answered, the right-hand card animates from the mockup to the visitor's own result:

- A one-line table persona derived from the top two traits (e.g. "Warm connector", "Curious listener") plus a short warm sentence.
- The four trait bars, each filled to the visitor's score with a high/good/steady label, animating from their previous values.
- The avatar row reframed as "the kind of table we'd seat you at": three illustrative members whose initials/trait blend complement the visitor's profile, plus the dashed open seat.
- A CTA under the result: "Claim your seat" → signup, and a quiet "retake" link.

Scores are normalised to 0–100 per trait. Skipped questions reduce that trait's confidence, and a "based on N of 12 answers" note appears when the quiz is partly skipped.

## Carrying the result into signup

The finished result is stored in the browser and picked up on the signup page as a small "your quiz result is saved" note, so the visitor doesn't feel the work was thrown away. No database writes, no schema change, no server functions in this pass — persisting traits to the user's profile after signup would be a separate task.

## Copy and languages

All new strings go through `t()` under `landing.v3.matching.*` (question set, options, persona names, trait labels, result copy, buttons) with natural EN / TR / FA translations in the existing playful tone. The section keeps RTL correctness for Farsi.

## Design

No new visual language: the existing cosmic glass panels, purple/amber gradients, `Reveal` scroll animation and chip row all stay. Transitions between questions are short cross-fades, bars animate width, and everything respects `prefers-reduced-motion` (instant state changes, no animation) and the mobile performance opt-outs already in place.

## Technical notes

- New `src/components/landing/matching-quiz.tsx` holds the quiz state machine and result card; `MatchingSection` in `src/components/landing/sections.tsx` renders it in place of the static mockups. No change to `src/routes/index.tsx` composition order.
- New `src/lib/matching.ts`: trait keys, the 12-question definition with per-answer trait weights, scoring/normalisation, and persona selection. Pure functions, unit-testable, no i18n inside — questions reference translation keys only.
- Persistence via `localStorage` under one key, read inside `useEffect` so SSR/hydration stays clean.
- Landing page remains a static public route: no loader change, no server function, no Supabase call.
