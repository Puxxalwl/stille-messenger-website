import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const scheme of ['light','dark'] as const) {
 test(`WCAG AA ${scheme}: all pages`,async({page})=>{
   test.setTimeout(90000);
  await page.emulateMedia({colorScheme:scheme});
  for(const route of ['/','/guide/','/about/','/download/','/invite/AbC123','/not-a-page']) {
   await page.goto(route);await page.locator('#main').waitFor();
   // Audit below-fold content too, regardless of rendering optimization.
   await page.addStyleTag({content:'section{content-visibility:visible!important}'});
   if(route.startsWith('/invite/') || route === '/not-a-page')await expect(page.locator('#invite-view')).toBeVisible();
   const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
 });
}
