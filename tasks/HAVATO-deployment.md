# Havato isolated deployment

Status: Implementation and verification in progress; hosted deployment blocked by paid-resource approval and isolated backend access.
Approval: User explicitly requested full IG001–IG009 on havato, 2026-09-28.
Branch: havato. Baseline: 33e3176da097d972551a9b56260d946d53f7f5f4.

## Scope
Fast-forward havato from 9e69980 to the complete IG009 stack. Keep all original IG branches and production untouched. Add a stateless Node 24 Docker image on port 3000, temporary Havato branding, and Darkube deployment instructions. No production database migrations, DNS edits, custom domain connection, or paid provisioning without approval.

## Reconciliation
Every IG001–IG008 branch tip is an ancestor of IG009. No Git merge conflict exists. The prior uncommitted main-based draft remains separately preserved; its container files and temporary SVG are reapplied only where compatible. IG009 owns OAuth, environment validation, assets, profile/venue/owner functionality, and manifest implementation.

## Acceptance
Verify unit/component, local database/API tests, typecheck, lint, production build, standalone startup, and Docker CI. Hosted Auth and journeys require isolated Supabase credentials and paid hosting approval. Do not substitute local synthetic tests for hosted verification.
