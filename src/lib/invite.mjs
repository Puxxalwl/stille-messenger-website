export const MAX_INVITE_BYTES = 8192;
export const MAX_QR_BYTES = 900;
const byteLength = (text) => new TextEncoder().encode(text).length;

/** Codes are opaque URI suffixes, not destinations. Never decode twice. */
export function parseInvitePath(pathname) {
  if (typeof pathname !== 'string') return { kind: 'missing' };
  const invitePath = pathname.startsWith('/en/invite/') ? pathname.slice(3) : pathname;
  if (invitePath === '/invite' || invitePath === '/invite/') return { kind: 'help' };
  if (!invitePath.startsWith('/invite/')) return { kind: 'missing' };
  let suffix = invitePath.slice('/invite/'.length);
  let namespace = 'i';
  // Persistent profile links carry the Android namespace in the web path.
  // Legacy /invite/{code} remains the one-time invite format.
  if (suffix.startsWith('i3/')) { namespace = 'i3'; suffix = suffix.slice(3); }
  else if (suffix.startsWith('i/')) suffix = suffix.slice(2);
  if (!suffix || suffix.includes('/') || suffix.length > MAX_INVITE_BYTES * 3) return { kind: 'invalid' };
  let code;
  try { code = decodeURIComponent(suffix); } catch { return { kind: 'invalid' }; }
  // Match URI-safe invite material without assuming a particular core payload format.
  // Reject URL separators, whitespace, controls, markup, nested percent encoding.
  if (!code || /[\s\u0000-\u001f\u007f-\u009f/%\\?#<>"'`:]/u.test(code)) return { kind: 'invalid' };
  const uri = `stille://${namespace}/${code}`;
  const webUrl = `https://stille.im/invite/${namespace}/${encodeURIComponent(code)}`;
  if (byteLength(uri) > MAX_INVITE_BYTES) return { kind: 'invalid' };
  return { kind: 'valid', code, namespace, uri, webUrl, qrAllowed: byteLength(webUrl) <= MAX_QR_BYTES };
}

export function inviteWebUrl(code) {
  const path = `/invite/${encodeURIComponent(code)}`;
  if (parseInvitePath(path).kind !== 'valid') throw new TypeError('Invalid invitation suffix');
  return `https://stille.im${path}`;
}
