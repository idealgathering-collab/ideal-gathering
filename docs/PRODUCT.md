# Product

## Accepted direction
**No one should be alone.** Ideal Gathering helps people find the right people, for the right gathering, at the right moment through small, real-world gatherings, typically 2–5 people.

It is not a dating app, Meetup clone, swipe app, follower/like social network, Instagram clone or event-ticket marketplace. Likes, followers and popularity rankings must not become core mechanics. Existing private feedback is for trust and better gatherings, not public popularity.

## Beta scope
Onboarding; useful profiles; interests, intentions and social/personality signals; gathering preferences; creation, discovery and joining; matching and group composition; venue support; trust and privacy foundations.

The desired outcome is a comfortable, viable gathering with compatible expectations and enough room for everyone. A high similarity score or more screen time is not itself success. Proposed evaluation: successful participation, comfort, repeat willingness and safety issues, with minimal private feedback. No new analytics collection is authorized here.

## CURRENT — repository evidence
At inspection commit `a37898970d63c9358c0592a7c81f07c7cbf2b828`, routes include invite/waitlist/pending, auth, onboarding, profile, dashboard/explore, create-gathering, gathering detail, member rooms, admin/owner and venue surfaces. Private-beta configuration and access states exist in Supabase migrations.
Profile and preference fields, deterministic matching, blocking/reporting, attendance and gathering feedback already exist. Presence in code does not certify production behavior.

## Boundaries and unresolved decisions
- The creation schema currently permits 2–30 seats; the original SQL check permits up to 50. The 2–5 direction does not authorize changing existing gatherings or limits.
- Existing room chat/checklists/check-in must be preserved. They do not establish completion or approval of the future Live Gathering concept.
- Live Gathering, Emergency Button, Community Aid and advanced Brain research are later-phase. Do not build speculative infrastructure for them during beta work.
- Major product changes require an approved IG-XXX spec; [current task](../tasks/current.md) is the handoff point.

See [UX](UX.md), [matching](MATCHING.md), [roadmap](ROADMAP.md), and [decisions](DECISIONS.md).
