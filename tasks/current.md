# Current task

No implementation task is active.

Completed: [IG-001 Owner Control Center foundation](completed/IG-001-owner-control-center.md) on branch `codex/ig-001-owner-control-center`, based on `4cee6c5`.

Outcome: distinct Owner control routes and server boundary; Owner-managed revocable Admin platform access; direct role/grant escalation and legacy Owner self-bootstrap blocked. Migration is committed and locally validated but unapplied. No merge or deployment has occurred.

Checks: 169 unit tests passed; TypeScript passed; targeted new-file lint passed; 41 disposable PostgreSQL authorization checks passed. Full lint remains blocked by pre-existing repository-wide formatting errors. Normal Windows build remains blocked by the existing Lovable MCP path-separator bug; application build succeeds when that plugin alone is disabled locally.

Recommended next discussion: IG-002 Admin dashboard UI cleanup. Preserve the IG-001 permission boundary. Any split into finer Admin permissions should be a separate access-control task after mapping affected server handlers, RLS policies and triggers.
