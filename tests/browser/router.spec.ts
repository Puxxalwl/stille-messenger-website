import {test,expect} from '@playwright/test';

test('ClientRouter changes pages without document reload; theme and history survive',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({colorScheme:'light'});await page.goto('/');
 await page.evaluate(()=>{(window as unknown as Record<string,unknown>).__navigationMarker='same-document';});
 await page.getByRole('button',{name:'Включить тёмную тему'}).click();
 await page.locator('.desktop-nav').getByRole('link',{name:'Как начать'}).click();
 await expect(page).toHaveURL(/\/guide\/$/);await expect(page.locator('h1')).toHaveText('Первая переписка');
 expect(await page.evaluate(()=>(window as unknown as Record<string,unknown>).__navigationMarker)).toBe('same-document');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.locator('.desktop-nav a[aria-current="page"]')).toHaveText('Как начать');
 await page.getByText('Ссылка сама откроет приложение?',{exact:true}).click();await expect(page.locator('details[open]')).toContainText('ещё не подключены');
 await page.locator('.desktop-nav').getByRole('link',{name:'О проекте'}).click();await expect(page).toHaveURL(/\/about\/$/);
 await page.locator('.desktop-nav').getByRole('link',{name:'Скачать',exact:true}).click();await expect(page).toHaveURL(/\/download\/$/);
 await page.getByRole('button',{name:'Включить светлую тему'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.goBack();await expect(page.locator('h1')).toHaveText('Stille — «тишина»');
 await page.goForward();await expect(page.locator('h1')).toHaveText('Stille для Android');
 await page.reload();await expect(page.locator('h1')).toHaveText('Stille для Android');expect(errors).toEqual([]);
});

test('mobile menu supports routes, current page, Escape and repeated visits',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const summary=page.locator('.mobile-menu summary');await summary.click();await expect(page.locator('.mobile-menu nav')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open','');await expect(summary).toBeFocused();
 for(const [name,path,title] of [['Как начать','guide','Первая переписка'],['О проекте','about','Stille — «тишина»'],['Скачать','download','Stille для Android']]){
  await page.locator('.mobile-menu summary').click();await page.locator('.mobile-menu nav').getByRole('link',{name,exact:true}).click();
  await expect(page).toHaveURL(new RegExp('/'+path+'/$'));await expect(page.locator('h1')).toHaveText(title);
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('router reinitializes different invitations without leaking previous state',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('/invite/FirstCode');
 await expect(page.locator('#qr-canvas')).toBeVisible();await page.locator('#copy-invite').click();
 await page.locator('.brand').click();await expect(page.locator('h1')).toContainText('Мессенджер');
 await page.goBack();await expect(page.locator('#copy-invite')).toBeVisible();await page.locator('#copy-invite').click();
 expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('stille://i/FirstCode');
 await page.goto('/invite/SecondCode');await page.locator('#copy-invite').click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('stille://i/SecondCode');
});

test('all known routes return HTML 200 and navigation avoids hash routes',async({request,page})=>{
 for(const path of ['/','/guide/','/about/','/download/'])expect((await request.get(path)).status()).toBe(200);
 await page.goto('/');expect(await page.locator('header a, footer a').evaluateAll(links=>links.some(a=>a.getAttribute('href')?.includes('#')))).toBe(false);
});

test('menu works without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();
 await page.goto('/');await page.locator('.mobile-menu summary').click();await page.locator('.mobile-menu nav').getByRole('link',{name:'Как начать'}).click();
 await expect(page.locator('h1')).toHaveText('Первая переписка');await context.close();
});
