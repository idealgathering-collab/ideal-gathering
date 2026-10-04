# IG-011 — Havato public-site polish, Phase 1

Status: Implemented; review pending. Not merged or deployed.
Approval: Direct user request, 2026-10-04, seven explicit frontend requirements.
Branch: codex/havato-public-polish-phase1
Evidence baseline: d69e6954104b3c39dad393fe5c278a2960934ad7, remote havato.

## Objective and current evidence
Polish the Havato public home and restore its existing story, for review only.
Live havato-test.darkube.ir inspected read-only at 1440: page width 1280,
About us targets #about, nine decorative cards link to #waitlist, venue login
is an ungrouped footer entry, consumer sign-in already hidden. Source matches.
Existing /our-story uses the legacy cosmic shell and domain-name narrative.

## Approved requirements
Desktop-only composition improvements above 1000px; preserve mobile sizing.
Confident Early Access / Request Access copy without valuation or rollout claims.
Our Story / داستان ما links to /our-story, retaining the actual eight-chapter
origin, founder, mission and historical setbacks while updating stale branding.
Shared public navigation/footer, approved logo, existing orange/cream tokens.
Member login hidden by a small presentation flag; venue access grouped separately.
Noninteractive cards/illustrations/activity tiles; intentional controls retain
semantic links/buttons, keyboard focus, labels, FAQ disclosure and mobile menu.
Farsi default RTL and persisted English. No Terms/Privacy content rewrite.

## Data and deployment boundaries
Keep joinHavatoWaitlist and exact Supabase waitlist insertion unchanged.
Keep schema, migrations, accounts, auth/venue routes, backend and PWA/install
implementation unchanged. No real hosted writes for verification.
Dedicated branch/PR targets havato only. No main/idealgathering.com edits,
merge, deployment, hosting configuration or secrets changes.

## Verification and handoff
Inspect source and live baseline before edits; check home/story at 1366, 1440,
1920 and existing mobile/tablet widths in FA and EN. Exercise synthetic form
validation/busy/success/duplicate/error/retry; inspect actual auth and venue
routes separately from the preview fixture. Run focused units/PWA, typecheck,
focused/full lint and build; distinguish fixture checks and environment limits.
Save screenshots, exact results and review PR. Review is the next checkpoint.
