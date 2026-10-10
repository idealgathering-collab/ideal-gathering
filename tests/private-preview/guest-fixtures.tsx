const guestId = "62000000-0000-4000-8000-000000000001";
export const createGuestInvitation = async () => ({ id: guestId, token: "A".repeat(43), expires_at: "2027-01-01T12:00:00Z" });
export const manageGuestInvitations = async () => [{ id: guestId, label: "مریم / Maryam", guest_name: "مریم", response: "going" as const, expires_at: "2027-01-01T12:00:00Z", revoked_at: null, created_at: "2026-10-10T12:00:00Z" }];
