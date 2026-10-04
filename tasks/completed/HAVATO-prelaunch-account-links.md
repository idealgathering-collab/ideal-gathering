# Havato prelaunch account links — completed

User-authorized October 4, 2026. Baseline eb101fbb5d9639a992a79d68d5ffd70bb0115d2b.
Implementation ff53f83693ccabd74d5e9083c46cbd1350987686 is published to havato and live.

Removed eight JSX lines in src/components/landing/havato-waitlist.tsx: the shared consumer signup/sign-in links below the FAQ. This removes both Farsi and English labels from the homepage until launch. Existing translations can be reused when launch restores the links. No automatic launch date is configured.
No backend/auth route, waitlist submission, venue access, install behavior, styling, dependency, database, migration, runtime configuration or idealgathering.com changes.

Verification:
- Exact replacement source reviewed: only the auth-link block removed.
- Existing ESLint on the modified UTF-8 source via --stdin --stdin-filename src/components/landing/havato-waitlist.tsx: exit 0. An earlier PowerShell pipe added an extra newline, producing a formatting error; raw-byte input resolved this tooling artifact without changing the source.
- Exact-commit Linux CI run 37188413319 passed focused checks, production Docker build and stateless startup. https://github.com/idealgathering-collab/ideal-gathering/actions/runs/37188413319
- Darkube automatically built e766c874-dbb4-45df-9111-508b5a73b355 for ff53f836. Image ff53f836-b15448 pushed, deploy OK, build completed successfully; app healthy.
- Live https://havato-test.darkube.ir/ serves updated page. Actual DOM checks at widths 1280 and 390 in FA and EN found zero links whose pathname is /auth. Footer/FAQ screenshot visually checked. Waitlist remains present; no form submitted.
- Full unrelated test/lint suite and database checks not repeated for the eight-line UI removal. No new implementation-mirroring tests added.

No remaining blocker. Restore the consumer account links during a separately authorized launch release.
