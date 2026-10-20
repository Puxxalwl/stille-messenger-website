import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { writeFile } from 'node:fs/promises';
// Run node scripts/serve.mjs first; keep other browser tests stopped for a clean sample.
const chrome=await launch({chromePath:chromium.executablePath(),chromeFlags:['--headless','--no-sandbox']});
try {
 const result=await lighthouse('http://127.0.0.1:4322',{port:chrome.port,output:'json',onlyCategories:['performance','accessibility','best-practices','seo']});
 if(!result) throw new Error('Lighthouse produced no report');
 await writeFile('lighthouse-report.json',result.report);
 console.log(Object.fromEntries(Object.entries(result.lhr.categories).map(([name,c])=>[name,Math.round((c.score??0)*100)])));
} finally {await chrome.kill();}
