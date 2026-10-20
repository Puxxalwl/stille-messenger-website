import { test, expect } from '@playwright/test';
for (const width of [360,390,768,1440]) for(const colorScheme of ['light','dark'] as const) {
 test(`home ${width}px ${colorScheme}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme,reducedMotion:'reduce'});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Мессенджер');
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
test('invitation direct load is a real 404, no third-party requests, QR works',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4322'))external.push(r.url());});
 const response=await page.goto('/invite/AbC%2Bdef%3D');expect(response?.status()).toBe(404);
 await expect(page.getByRole('heading',{level:1})).toHaveText('Вас пригласили в Stille');await expect(page.locator('#qr-canvas')).toBeVisible();
 const qr = await page.locator('#qr-canvas').evaluate(c=>{const canvas=c as HTMLCanvasElement;return {width:canvas.width,height:canvas.height,pixels:Array.from(canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data)};});
 const {default:jsQR}=await import('jsqr');expect(jsQR(new Uint8ClampedArray(qr.pixels),qr.width,qr.height)?.data).toBe('stille://i/AbC+def=');
 await expect(page.locator('#open-invite')).toBeHidden();await page.getByRole('button',{name:'Скопировать приглашение'}).click();await expect(page.getByRole('status')).toContainText('Скопировано');expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('stille://i/AbC+def=');expect(external).toEqual([]);
 await page.screenshot({path:'test-results/invite.png',fullPage:true});
});
test('clipboard refusal exposes manual field',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))}}));await page.goto('/invite/AbC123');await page.locator('#copy-invite').click();await expect(page.locator('#manual-copy')).toHaveValue('stille://i/AbC123');await expect(page.locator('#manual-copy')).toBeFocused();
});
test('invalid and missing URLs never expose actions',async({page})=>{
 for(const path of ['/invite/%3Cscript%3E','/invite/a/b','/invite/%FF']){await page.goto(path);await expect(page.getByRole('heading',{level:1})).toHaveText('В ссылке что-то не так');await expect(page.locator('#invite-actions')).toBeHidden();}
 await page.goto('/not-a-page');await expect(page.getByRole('heading',{level:1})).toHaveText('Здесь пока тихо');
 await page.goto('/invite/');await expect(page.getByRole('heading',{level:1})).toHaveText('Позовите своего человека');
});
test('long invitation retains copy without QR',async({page})=>{
 await page.goto('/invite/'+'a'.repeat(901));await expect(page.getByRole('status')).toContainText('слишком длинное');await expect(page.locator('#invite-qr')).toBeHidden();await expect(page.locator('#copy-invite')).toBeVisible();
});
test('no JavaScript: content and manual instructions remain available',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Мессенджер');await expect(page.getByRole('button')).toHaveCount(0);
 await page.goto('/invite/AbC123');await expect(page.getByRole('heading',{level:1})).toHaveText('Приглашения в Stille');await expect(page.getByText('stille://i/',{exact:true})).toBeVisible();await context.close();
});
