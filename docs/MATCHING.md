# Matching — current Cell and future Brain

## Product principle
Optimize **group quality**, not simple similarity. A viable small gathering needs compatible intentions, social comfort, logistics, capacity and safety. Shared interests can help; a set of highly similar individuals is not automatically a good group.

## CURRENT Cell
“Cell” is the product name used here for the existing beta matching layer. The inspected repository implements it through ordinary TypeScript modules, not a standalone Cell service or database table.
Baseline: `a37898970d63c9358c0592a7c81f07c7cbf2b828`.

| Source | Actual responsibility |
| --- | --- |
| `src/lib/matching.ts` | 12-question quiz, four traits (spark, curiosity, warmth, depth), scoring and pairwise fit |
| `src/lib/table-fit.ts` | Whole-table score using host/attendees plus viewer, blocks, traits, age span, interests, energy and history |
| `src/lib/matching.functions.ts` | Authenticated server aggregation; returns scores/counts/flags, not others' raw DOB, ratings or preferences |
| `src/lib/recommend.ts` | Gathering preference ranking, explicit/inferred gathering types and text/interest signals |
| `src/lib/vibe.ts`, `age.ts`, `match-history.ts` | Group factors used by table scoring |
| `tests/unit/matching.test.ts`, `table-fit.test.ts`, `recommend.test.ts`, `vibe.test.ts`, `match-history.test.ts` | Existing rule coverage |

Quiz traits are lifted into a friendly 42–100 display band. They are not validated psychological measurements.
Pairwise fit is 100 minus mean absolute trait distance, clamped to 0–100. Whole-table chemistry averages every unique pair, including host and viewer when signals exist, rather than comparing only against the host.
Table scoring multiplies chemistry (or a 70 fallback when another usable signal exists) by age, energy cohesion, person-history and learned-energy factors. Shared interests blend at 22% when the age factor exceeds 0.1. Missing all usable signals returns null, not a fabricated perfect match.
A block in either direction returns no score and a blocked flag. The history layer uses the viewer's ratings and structured reasons; the server keeps the harshest rating when the same person was rated repeatedly. Free-text comments are not read by this handler for matching.
The handler accepts at most 60 gathering IDs. Privileged data access makes authorization/visibility tests important; authentication alone does not prove the requested IDs should be visible.

## Limits and interpretation
Current chemistry includes a similarity measure; additional factors and all-pair aggregation move beyond host-only similarity but do not prove optimal group composition. Sparse signals, age rules, preference conflicts and feedback bias need explicit evaluation.
Do not describe the friendly percentages as scientific certainty, publicly rank people, expose private feedback, or let ranking override capacity/access/block rules.
Existing ratings and deterministic history adjustments are current Cell behavior, not evidence of an advanced learning system.

## PROPOSED beta improvement
An approved spec should define group-level scenarios: compatible expectations, mixed energy, isolated outlier, missing quiz, repeated poor experience, blocked member, host inclusion, full/cancelled gathering and privacy-sensitive response. Measure whether the group works for everyone, not only average score. Define success before adjusting weights.

## FUTURE Brain research
Brain is later-phase research, not a shipped service or approved architecture. Potential work includes richer group-composition hypotheses, transparent explanations and responsible evaluation of outcomes. No new embeddings, AI inference, psychological profiling, sensitive data collection or research database is authorized here.
Preserve current functions and add narrowly scoped changes only through an approved IG-XXX specification.
