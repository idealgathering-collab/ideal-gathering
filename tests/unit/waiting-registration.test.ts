import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ insert: vi.fn(), signUp: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { signUp: mocks.signUp }, from: mocks.from,
} }));
import { registerWaitingUser } from '@/lib/waiting-registration';
const input = { name: ' Test Member ', email: 'Member@example.invalid', password: 'test-only', returnUrl: 'https://havato.example/auth?mode=signin' };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockResolvedValue({ error: null });
});
describe('public waiting registration uses the existing backend', () => {
  it('creates one Supabase identity and leaves profile creation to the existing trigger', async () => {
    const data = { user: { id: 'same-account' }, session: { user: { id: 'same-account' } } };
    mocks.signUp.mockResolvedValue({ data, error: null });
    expect(await registerWaitingUser(input)).toEqual(data);
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith('waitlist');
    expect(mocks.insert).toHaveBeenCalledWith({ name: 'Test Member', email: 'member@example.invalid', city: null, interests: null });
    expect(mocks.signUp).toHaveBeenCalledExactlyOnceWith({
      email: 'member@example.invalid', password: 'test-only',
      options: { emailRedirectTo: input.returnUrl, data: { display_name: 'Test Member', account_type: 'user' } },
    });
  });
  it('reuses an existing waitlist email and preserves the confirmation-required state', async () => {
    mocks.insert.mockResolvedValue({ error: { code: '23505' } });
    mocks.signUp.mockResolvedValue({ data: { user: { id: 'same-account' }, session: null }, error: null });
    expect((await registerWaitingUser(input)).session).toBeNull();
    expect(mocks.signUp).toHaveBeenCalledTimes(1);
  });
  it('does not create an account when waitlist storage fails', async () => {
    mocks.insert.mockResolvedValue({ error: { code: '42501' } });
    await expect(registerWaitingUser(input)).rejects.toMatchObject({ code: '42501' });
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it('surfaces signup failure without claiming a session', async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: new Error('signup denied') });
    await expect(registerWaitingUser(input)).rejects.toThrow('signup denied');
  });
});
