/** Finish OAuth/email verification on the existing auth page so invites are redeemed. */
export function authReturnUrl(origin: string, redirect?: string): string {
  const url = new URL('/auth', origin);
  url.searchParams.set('mode', 'signin');
  if (redirect?.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('\\')) {
    url.searchParams.set('redirect', redirect);
  }
  return url.toString();
}
