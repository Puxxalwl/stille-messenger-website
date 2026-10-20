import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
const dir = new URL('../public/assets/', import.meta.url);
// Original includes a white wordmark below the symbol. Keep the original intact;
// use only the symbol for tiny header/tab contexts (bounds measured on supplied PNG).
const source = await sharp(new URL('stille_logo.png', dir).pathname).trim().toBuffer();
const logo = await sharp(source).extract({left: 0, top: 0, width: 451, height: 650}).trim().toBuffer();
await sharp(logo).resize({ height: 180 }).webp({ quality: 95 }).toFile(new URL('logo.webp', dir).pathname);
await sharp(logo).resize({ width: 32, height: 32, fit: 'contain', background: '#00000000' }).png().toFile(new URL('favicon.png', dir).pathname);
await sharp(logo).resize({ width: 180, height: 180, fit: 'contain', background: '#00000000' }).png().toFile(new URL('apple-touch-icon.png', dir).pathname);
const owl = (await readFile(new URL('owl.svg', dir))).toString('base64');
const inviteOwl = (await readFile(new URL('owl-invite.svg', dir))).toString('base64');
for (const invite of process.argv.includes('--logo-only') ? [] : [false, true]) {
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#F7F7F9"/><circle cx="1000" cy="320" r="310" fill="#EAF0F7"/><path d="M65 112h1070M65 564h1070" stroke="#D7D9DF"/><text x="65" y="78" fill="#0067DB" font-family="DejaVu Sans,sans-serif" font-size="32" font-weight="bold">Stille</text><text x="65" y="190" fill="#626874" font-family="DejaVu Sans,sans-serif" font-size="14" letter-spacing="3">${invite ? 'ОДИН ЧЕЛОВЕК. ОДНО ПРИГЛАШЕНИЕ.' : 'P2P-МЕССЕНДЖЕР ДЛЯ ANDROID'}</text><text x="60" y="295" fill="#17181C" font-family="DejaVu Sans,sans-serif" font-size="72" font-weight="bold" letter-spacing="-4">${invite ? 'Вас пригласили' : 'Разговоры'}</text><text x="60" y="382" fill="#0067DB" font-family="DejaVu Sans,sans-serif" font-size="72" font-weight="bold" letter-spacing="-4">${invite ? 'в Stille.' : 'между вами.'}</text><text x="65" y="459" fill="#626874" font-family="DejaVu Sans,sans-serif" font-size="22">${invite ? 'Хороший разговор начинается с «привет».' : 'Без номера телефона. С открытым кодом.'}</text><text x="65" y="603" fill="#626874" font-family="DejaVu Sans,sans-serif" font-size="18">stille.im</text><image x="805" y="190" width="300" height="325" xlink:href="data:image/svg+xml;base64,${invite ? inviteOwl : owl}"/></svg>`;
 await writeFile(new URL(invite ? 'og-invite.svg' : 'og-home.svg', dir), svg);
 await sharp(Buffer.from(svg)).png().toFile(new URL(invite ? 'og-invite.png' : 'og-home.png', dir).pathname);
}
console.log('Optimized logo, favicons and social previews generated.');
