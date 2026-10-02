import { beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({
  userId: 'same-account', beta: false, onboarded: false, status: 'registered',
  roles: [] as string[], businesses: [] as { status: string }[],
  inviteValid: true, redeemed: [] as string[],
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: fixture.userId } }, error: null }) },
  from: (table: string) => {
    let data: unknown = table === 'profiles'
      ? { access_status: fixture.status, onboarded_at: fixture.onboarded ? '2026-10-02' : null }
      : table === 'user_roles' ? fixture.roles.map(role => ({ role })) : fixture.businesses;
    const query = {
      select: () => query,
      eq: (_key: string, id: string) => { if (id !== fixture.userId) data = null; return query; },
      limit: () => query, maybeSingle: () => query,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error: null }).then(resolve),
    };
    return query;
  },
  rpc: async (name: string) => {
    if (name === 'is_beta_launched') return { data: fixture.beta, error: null };
    if (name === 'redeem_invitation' && fixture.inviteValid) fixture.redeemed.push(fixture.userId);
    return { data: fixture.inviteValid, error: null };
  },
} }));
vi.mock('@tanstack/react-router', () => ({ redirect: (options: unknown) => options }));
import { fetchAccessState, redeemInvitation } from '@/lib/access';
import { homePathForUser } from '@/lib/roles';
import { requireProductAccess, requireVenueAccess, requireVenueRegistrationAccess } from '@/lib/beta-gate';
import { authReturnUrl } from '@/lib/auth-return';

beforeEach(() => Object.assign(fixture, {
  beta: false, onboarded: false, status: 'registered', roles: [], businesses: [],
  inviteValid: true, redeemed: [],
}));
describe('Havato same-account beta journeys with isolated backend responses', () => {
  it('sends a new account to waiting and denies product routes while closed', async () => {
    expect(await homePathForUser(fixture.userId)).toBe('/pending');
    await expect(requireProductAccess({ pathname: '/explore', href: '/explore' }))
      .rejects.toMatchObject({ to: '/pending' });
    expect((await fetchAccessState(fixture.userId)).hasProductAccess).toBe(false);
  });
  it('redeems an invitation for the same identity without bypassing launch', async () => {
    expect(await redeemInvitation(' test-invite ')).toBe(true);
    expect(fixture.redeemed).toEqual([fixture.userId]);
    expect(await homePathForUser(fixture.userId)).toBe('/pending');
    fixture.beta = true;
    expect(await homePathForUser(fixture.userId)).toBe('/onboarding');
    fixture.onboarded = true; fixture.status = 'active';
    expect(await homePathForUser(fixture.userId)).toBe('/dashboard');
    expect(await requireProductAccess({ pathname: '/explore', href: '/explore' }))
      .toEqual({ user: { id: fixture.userId } });
  });
  it('does not claim successful redemption for invalid/revoked invitations', async () => {
    fixture.inviteValid = false;
    expect(await redeemInvitation('revoked')).toBe(false);
    expect(fixture.redeemed).toEqual([]);
    expect(await homePathForUser(fixture.userId)).toBe('/pending');
  });
  it('keeps venue submission accessible, pending inaccessible, and approved access gated by launch', async () => {
    fixture.roles = ['venue'];
    expect(await requireVenueRegistrationAccess()).toEqual({ user: { id: fixture.userId } });
    fixture.businesses = [{ status: 'pending' }];
    await expect(requireVenueRegistrationAccess()).rejects.toMatchObject({ to: '/pending' });
    await expect(requireVenueAccess()).rejects.toMatchObject({ to: '/pending' });
    fixture.businesses = [{ status: 'approved' }];
    await expect(requireVenueAccess()).rejects.toMatchObject({ to: '/pending' });
    fixture.beta = true;
    expect(await requireVenueAccess()).toEqual({ user: { id: fixture.userId } });
    expect(fixture.userId).toBe('same-account');
  });
  it('does not unlock rejected venues or unready members after launch', async () => {
    fixture.beta = true;
    expect((await fetchAccessState(fixture.userId)).hasProductAccess).toBe(false);
    fixture.roles = ['venue']; fixture.businesses = [{ status: 'rejected' }];
    await expect(requireVenueAccess()).rejects.toMatchObject({ to: '/pending' });
  });
  it('retains privileged home routing', async () => {
    fixture.roles = ['owner', 'admin'];
    expect(await homePathForUser(fixture.userId)).toBe('/owner');
    fixture.roles = ['admin'];
    expect(await homePathForUser(fixture.userId)).toBe('/admin');
  });
});
describe('OAuth and email return to existing auth completion', () => {
  it('preserves an internal destination for same-account invite redemption', () => {
    const url = new URL(authReturnUrl('https://havato-test.darkube.ir', '/settings?tab=account'));
    expect(url.pathname).toBe('/auth');
    expect(url.searchParams.get('mode')).toBe('signin');
    expect(url.searchParams.get('redirect')).toBe('/settings?tab=account');
  });
  it.each(['https://outside.example', '//outside.example', '/\\outside.example'])('discards external target %s', target => {
    expect(new URL(authReturnUrl('https://havato-test.darkube.ir', target)).searchParams.has('redirect')).toBe(false);
  });
});
