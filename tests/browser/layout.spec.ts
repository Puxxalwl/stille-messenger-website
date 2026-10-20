import {test,expect} from '@playwright/test';
test('narrow viewport and 200% desktop zoom reflow',async({page})=>{
 // 1440px desktop at 200% zoom has a 720px CSS viewport.
 for(const width of [320,720,1024]){
  await page.setViewportSize({width,height:844});await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
 }
});
test('all pages reflow at intermediate widths and capture page previews',async({page})=>{
 for(const route of ['/','/download/','/guide/','/about/']) for(const width of [320,390,610,720,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto(route);await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} at ${width}px`).toBe(true);
  if(width===390||width===1440) await page.screenshot({path:`test-results/page-${route.replaceAll('/','')||'home'}-${width}.png`,fullPage:true});
 }
});
test('indexable pages have canonicals and JSON-LD; invite routes stay noindex',async({request})=>{
  for(const [route,canonical] of [['/','https://stille.im/'],['/download/','https://stille.im/download/'],['/guide/','https://stille.im/guide/'],['/about/','https://stille.im/about/']]){
   const response=await request.get(route);expect(response.status()).toBe(200);const html=await response.text();
   expect(html).toContain('name="robots" content="index, follow');expect(html).toContain(`rel="canonical" href="${canonical}"`);expect(html).toContain('type="application/ld+json"');
  }
  for(const route of ['/invite/','/invite/i/ProfileCode']){const response=await request.get(route);const html=await response.text();expect(html).toContain('name="robots" content="noindex, nofollow"');expect(html).not.toContain('application/ld+json');}
  const robots=await (await request.get('/robots.txt')).text();expect(robots).toContain('Sitemap: https://stille.im/sitemap-index.xml');
  const index=await (await request.get('/sitemap-index.xml')).text();expect(index).toContain('<sitemapindex');expect(index).toContain('https://stille.im/sitemap.xml');
  const map=await (await request.get('/sitemap.xml')).text();expect(map).not.toContain('/invite/');
 });
test('social cards and metadata are static and sensitive codes absent',async({request})=>{
 for(const route of ['/','/invite/']){
  const response=await request.get(route);expect(response.status()).toBe(200);const html=await response.text();expect(html).toContain('property="og:image"');expect(html).toContain('https://stille.im/assets/og-');expect(html).toContain('name="referrer" content="no-referrer"');
 }
 const response=await request.get('/invite/SecretDoNotEmbed');expect(response.status()).toBe(404);expect(await response.text()).not.toContain('SecretDoNotEmbed');
 for(const path of ['/assets/og-home.png','/assets/og-invite.png','/assets/logo.webp'])expect((await request.get(path)).status()).toBe(200);
});
test('save desktop and mobile first-screen previews',async({page})=>{
 await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:width===390?1000:900});await page.goto('/');
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`test-results/preview-${width}.png`});
 }
});
