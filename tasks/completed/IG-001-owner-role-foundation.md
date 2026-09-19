# IG-001 — Owner Role Foundation

## Status
Complete on `codex/ig-001-owner-role-foundation` (2026-09-19); ready for review in PR #5.
Verified with native PostgreSQL/PostgREST, real concurrent connections and real
role-query handler/route tests. See [final verification report](IG-001-verification.md)
for exact results and the accepted baseline lint/Windows build limitations.
Not merged or deployed. Next task: IG-002 Profile Data Ownership Cleanup.

## Goal
Make the existing owner system technically reliable before further product development.

## Problem
Owner routes/functions exist, but repository evidence shows the latest owner bootstrap migration references a role helper moved to the private schema by an earlier migration. Generated Supabase types also lag owner role/RPC support.

## Scope
Verify and correct owner role enum support, initial owner claim/bootstrap, role helper usage, owner authorization, generated Supabase types, and admin compatibility. Do not redesign the owner dashboard.

## Required implementation
1. Inspect current owner migrations and role helpers.
2. Add a new corrective migration; do not edit applied migrations.
3. Make bootstrap use the correct authorization helper.
4. Ensure only the intended initial owner can claim owner access.
5. Ensure normal users, venues, and admins cannot incorrectly gain owner access.
6. Reconcile generated Supabase types for owner and owner RPCs.
7. Verify existing owner routes remain functional.

## Acceptance criteria
- Owner role is recognized correctly.
- Bootstrap no longer depends on a missing helper.
- Unauthorized users cannot claim owner.
- Existing admin behavior still works.
- TypeScript owner/RPC usage is properly typed where practical.
- Owner dashboard UI remains unchanged except where correctness requires it.

## Out of scope
Owner dashboard redesign, new owner features, new staff roles, permission-system redesign.
