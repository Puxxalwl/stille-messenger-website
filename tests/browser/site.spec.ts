import { test, expect } from '@playwright/test';
for (const width of [320,360,390,430,768,1440]) for(const colorScheme of ['light','dark'] as const) {
 test(`home ${width}px ${colorScheme}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme,reducedMotion:'reduce'});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByRole('heading',{level:1})).toHaveText('Stille');
  await expect(page.locator('.hero-tagline')).toHaveText('Разговоры между вами');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for (const image of await page.locator('img').all()) { await image.scrollIntoViewIfNeeded(); await expect(image).toHaveJSProperty('complete',true); expect(await image.evaluate(i=>(i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0); }
  await page.screenshot({path:`test-results/home-${width}-${colorScheme}.png`,fullPage:true});
  expect(errors).toEqual([]);
 });
}
test('theme saves and restores, keyboard skip link works',async({page})=>{
 await page.emulateMedia({colorScheme:'light'});await page.goto('/');await page.keyboard.press('Tab');await expect(page.getByText('К содержанию')).toBeFocused();
 await page.getByRole('button',{name:'Включить тёмную тему'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('invitation preserves app URI, canonical copy link and local QR',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4322'))external.push(r.url());});
 const response=await page.goto('/invite/AbC%2Bdef%3D');expect(response?.status()).toBe(404);
 await expect(page.getByRole('heading',{level:1})).toHaveText('Вас пригласили в Stille');await expect(page.locator('#qr-canvas')).toBeVisible();
 await expect(page.locator('#open-invite')).toHaveAttribute('href','stille://i/AbC+def=');
 await expect(page.locator('#manual-copy')).toHaveValue('https://stille.im/invite/i/AbC%2Bdef%3D');
 const qr=await page.locator('#qr-canvas').evaluate(c=>{const canvas=c as HTMLCanvasElement;return {width:canvas.width,height:canvas.height,pixels:Array.from(canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data)};});
 const {default:jsQR}=await import('jsqr');expect(jsQR(new Uint8ClampedArray(qr.pixels),qr.width,qr.height)?.data).toBe('https://stille.im/invite/i/AbC%2Bdef%3D');
 await page.locator('#copy-invite').click();await expect(page.getByRole('status')).toContainText('скопирована');expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('https://stille.im/invite/i/AbC%2Bdef%3D');
 expect(external).toEqual([]);await page.screenshot({path:'test-results/invite.png',fullPage:true});
});
test('permanent profile invites retain their i3 app route',async({page})=>{
 await page.goto('/invite/i3/ProfileCode');await expect(page.locator('#open-invite')).toHaveAttribute('href','stille://i3/ProfileCode');
 await expect(page.locator('#manual-copy')).toHaveValue('https://stille.im/invite/i3/ProfileCode');
});
test('English invite route localizes copy and switches language',async({page})=>{
 await page.goto('/en/invite/AbC123');await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.getByRole('heading',{level:1})).toHaveText('You’re invited to Stille');await expect(page.locator('#copy-invite')).toHaveText('Copy link');
 await expect(page.locator('#invite-qr')).toContainText('Scan with Stille');await expect(page.locator('.language-switch')).toHaveAttribute('href','/invite/AbC123');
});
test('invalid and missing URLs show localized recovery without invite actions',async({page})=>{
 for(const path of ['/invite/%3Cscript%3E','/invite/a/b','/invite/%FF']){await page.goto(path);await expect(page.getByRole('heading',{level:1})).toHaveText('Ссылка-приглашение выглядит неверно');await expect(page.locator('#open-invite')).toBeHidden();}
 await page.goto('/not-a-page');await expect(page.getByRole('heading',{level:1})).toHaveText('Страница не найдена');
 await page.goto('/invite/');await expect(page.getByRole('heading',{level:1})).toHaveText('Пригласите знакомого в Stille');
});
test('long invitation remains copyable without QR',async({page})=>{
 await page.goto('/invite/'+'a'.repeat(901));await expect(page.getByRole('status')).toContainText('слишком длинное');await expect(page.locator('#invite-qr')).toBeHidden();await expect(page.locator('#open-invite')).toBeVisible();await expect(page.locator('#manual-copy')).toBeVisible();
});
test('no JavaScript keeps readable invite instructions',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('/');await expect(page.getByRole('heading',{level:1})).toHaveText('Stille');await expect(page.locator('.hero-tagline')).toHaveText('Разговоры между вами');await expect(page.getByRole('button')).toHaveCount(0);
 await page.goto('/invite/AbC123');await expect(page.getByRole('heading',{level:1})).toHaveText('Приглашение в Stille');await expect(page.locator('#manual-copy')).toBeHidden();await context.close();
});
