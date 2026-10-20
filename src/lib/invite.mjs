export const MAX_INVITE_BYTES = 8192;
export const MAX_QR_BYTES = 900;
const byteLength = (text) => new TextEncoder().encode(text).length;

/** Codes are opaque URI suffixes, not destinations. Never decode twice. */
export function parseInvitePath(pathname) {
  if (typeof pathname !== 'string') return { kind: 'missing' };
  if (pathname === '/invite' || pathname === '/invite/') return { kind: 'help' };
  if (!pathname.startsWith('/invite/')) return { kind: 'missing' };
  const suffix = pathname.slice('/invite/'.length);
  if (!suffix || suffix.includes('/') || suffix.length > MAX_INVITE_BYTES * 3) return { kind: 'invalid' };
  let code;
  try { code = decodeURIComponent(suffix); } catch { return { kind: 'invalid' }; }
  // Match URI-safe invite material without assuming a particular core payload format.
  // Reject URL separators, whitespace, controls, markup, nested percent encoding.
  if (!code || /[\s\u0000-\u001f\u007f-\u009f/%\\?#<>"'`:]/u.test(code)) return { kind: 'invalid' };
  const uri = `stille://i/${code}`;
  if (byteLength(uri) > MAX_INVITE_BYTES) return { kind: 'invalid' };
  return { kind: 'valid', code, uri, qrAllowed: byteLength(uri) <= MAX_QR_BYTES };
}

export function inviteWebUrl(code) {
  const path = `/invite/${encodeURIComponent(code)}`;
  if (parseInvitePath(path).kind !== 'valid') throw new TypeError('Invalid invitation suffix');
  return `https://stille.im${path}`;
}
