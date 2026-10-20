import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { parseInvitePath, inviteWebUrl, MAX_QR_BYTES, MAX_INVITE_BYTES } from '../src/lib/invite.mjs';
test('opaque suffix preserves case and URI-safe material', () => {
 const r = parseInvitePath('/invite/AbC123_-~.+=');
 assert.equal(r.kind, 'valid'); assert.equal(r.uri, 'stille://i/AbC123_-~.+=');
 assert.equal(parseInvitePath('/invite/ABC%2Bdef%3D').uri, 'stille://i/ABC+def=');
 assert.equal(parseInvitePath('/invite/i/ABC%2Bdef%3D').uri, 'stille://i/ABC+def=');
 assert.equal(inviteWebUrl('AbC+def='), 'https://stille.im/invite/AbC%2Bdef%3D');
});
test('help and missing routes remain distinct', () => {
 for (const p of ['/invite','/invite/']) assert.equal(parseInvitePath(p).kind,'help');
 for (const p of ['/abc','/inviteish/abc','/','/INVITE/a']) assert.equal(parseInvitePath(p).kind,'missing');
});
test('reject invalid percent, separators, controls, markup and URL injections', () => {
 for (const s of ['%','%FF','a/b','a/','%2F','%252F','a%00','%0A','a%20b','%7F','%C2%85','%3Cscript%3E','https%3A%2F%2Fevil.test','abc%3Furl=evil','a%23b','a%5Cb','%22','%27','%60']) assert.equal(parseInvitePath('/invite/'+s).kind,'invalid',s);
 assert.throws(()=>inviteWebUrl('bad/code'));
});
test('byte limits protect page and QR without truncation', () => {
 const prefix = 'stille://i/'.length;
 assert.equal(parseInvitePath('/invite/'+'a'.repeat(MAX_QR_BYTES-prefix)).qrAllowed,true);
 assert.equal(parseInvitePath('/invite/'+'a'.repeat(MAX_QR_BYTES-prefix+1)).qrAllowed,false);
 assert.equal(parseInvitePath('/invite/'+'a'.repeat(MAX_INVITE_BYTES-prefix)).kind,'valid');
 assert.equal(parseInvitePath('/invite/'+'a'.repeat(MAX_INVITE_BYTES-prefix+1)).kind,'invalid');
});
test('QR roundtrip retains original app URI with H correction', async () => {
 const uri='stille://i/AbC123_-~.+=sample';
 const q=QRCode.create(uri,{errorCorrectionLevel:'H'}); const scale=6, margin=4, size=(q.modules.size+margin*2)*scale;
 const pixels=new Uint8ClampedArray(size*size*4).fill(255);
 for(let y=0;y<q.modules.size;y++)for(let x=0;x<q.modules.size;x++)if(q.modules.get(y,x))for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){const i=(((y+margin)*scale+dy)*size+(x+margin)*scale+dx)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;}
 assert.equal(jsQR(pixels,size,size)?.data,uri);
});
