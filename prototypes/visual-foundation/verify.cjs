const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createPreviewServer } = require('./preview.cjs');
const { chromium } = require(process.env.BYX_PLAYWRIGHT_MODULE || 'playwright');
const out = path.join(__dirname,'qa/revision-2');
fs.mkdirSync(out,{recursive:true});
const server=createPreviewServer();
const errors=[],externalRequests=[],results=[];

async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    for(const variant of ['original','a','b'])for(const width of variant==='original'?[1440,390,320]:[1920,1440,390,320]){
      const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
      page.on('pageerror',e=>errors.push(variant+'/'+width+': '+e.message));
      page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))externalRequests.push(r.url());});
      await page.goto(origin+'/'+variant+'.html');
      await page.waitForFunction(()=>DB.ready&&document.querySelector('.grid'));
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForTimeout(850);
      const menus=await page.locator('#nav a').allTextContents();
      assert.deepEqual(menus,['Works','News','Blog','About','Contact']);
      assert.equal(await page.evaluate(()=>DB.demo),true);
      assert.equal(await page.evaluate(()=>CFG.url), '');
      assert.equal(await page.evaluate(()=>CFG.key), '');
      const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.grid')).gridTemplateColumns.split(' ').length,cardWidth:document.querySelector('.card').getBoundingClientRect().width,titleSize:getComputedStyle(document.querySelector('.card .nm')).fontSize,font:getComputedStyle(document.querySelector('.card .nm')).fontFamily,hasHero:!!document.querySelector('.intro,.b-opening,.x-panel')}));
      assert(metrics.scrollWidth<=width,'Overflow: '+JSON.stringify(metrics));
      assert(metrics.font.includes('Anton'));assert.equal(metrics.hasHero,false);
      if(variant!=='original'&&width>=1440)assert.equal(metrics.columns,width===1440?4:5);
      if(width<=390)assert.equal(metrics.columns,1);
      await page.locator('img').evaluateAll(imgs=>imgs.forEach(img=>img.loading='eager'));
      await page.evaluate(()=>Promise.all([...document.images].filter(img=>img.src).map(img=>img.decode())));
      await page.screenshot({path:path.join(out,variant+'-'+width+'.png'),fullPage:true});
      if(variant==='b'){
        assert.equal(await page.evaluate(()=>previewXArt('2604',1200,900)===previewXArt('2604',1200,900)),true);
        assert.equal(await page.evaluate(()=>artOf({code:'test',img:'data:image/png;base64,AAAA'})),'data:image/png;base64,AAAA');
      }
      for(const [route,selector] of [['#/project','.grid'],['#/project/2604','.pd-head'],['#/news','.rows'],['#/blog','.feature'],['#/blog/why-black-and-white','.post-cover'],['#/about','.brandline'],['#/contact','.contact'],['#/admin','#lform']]){
        await page.evaluate(h=>{location.hash=h;},route);
        await page.waitForFunction(h=>location.hash===h&&document.querySelector('#app').textContent.trim().length>30,route);
        await page.waitForSelector(selector);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),variant+'/'+width+' overflow '+route);
      }
      if(width===1440&&variant!=='original'){
        await page.locator('#lform button[type="submit"]').click();
        await page.waitForFunction(()=>!!document.querySelector('[data-edit]'));
        await page.locator('[data-edit]').first().click();
        await page.locator('[data-k="name"]').fill('LOCAL PREVIEW TEST');
        assert.equal(await page.locator('[data-k="name"]').evaluate(el=>el===document.activeElement),true);
        await page.locator('[data-act="save"]').click();
        assert(await page.evaluate(()=>DB.projects.some(p=>p.name==='LOCAL PREVIEW TEST')));
        // Reload restores demo memory; no remote CMS is present.
        await page.reload();await page.waitForFunction(()=>DB.ready);
        assert(!(await page.evaluate(()=>DB.projects.some(p=>p.name==='LOCAL PREVIEW TEST'))));
        await page.evaluate(()=>{location.hash='#/';});await page.waitForSelector('.grid');
        await page.locator('[data-view="index"]').click();
        await page.locator('th[data-sort="year"]').click();
        const dates=await page.locator('table.idx tbody tr td:nth-child(7)').allTextContents();
        assert.deepEqual(dates,[...dates].sort());
        await page.locator('[data-view="grid"]').click();
        await page.emulateMedia({reducedMotion:'no-preference'});
        await page.locator('#brand').click();await page.waitForTimeout(80);
        const before=await page.locator('#reel .it').count(),rule=await page.locator('#rule').boundingBox();
        await page.locator('#brand').click();assert((await page.locator('#reel .it').count())>before);
        assert.equal((await page.locator('#rule').boundingBox()).y,rule.y);
        await page.waitForFunction(()=>!spinning);assert.equal(await page.locator('#reel .it').count(),1);
        await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#brand').click();assert.equal(await page.locator('#reel .it').count(),1);
      }
      if(width===320){
        await page.evaluate(()=>{location.hash='#/';});await page.waitForSelector('.grid');
        await page.locator('#burger').click();assert(await page.locator('#mobnav').isVisible());
        assert.equal(await page.locator('#mobnav .links a').count(),5);
        await page.locator('#mobnav .links a').nth(1).click();await page.waitForFunction(()=>location.hash==='#/news');
        assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('menu')),false);
      }
      results.push({variant,...metrics,routes:9});await page.close();
    }
    for(const variant of ['a','b']){
      const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
      await page.goto('file:///'+path.join(__dirname,variant+'.html').replaceAll('\\','/'));
      await page.waitForSelector('.card');assert.equal(await page.locator('#nav a').count(),5);await page.close();
    }
    assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({testedAt:new Date().toISOString(),results,errors,externalRequests,scope:'Isolated original-based demo only. Production CMS not tested.'},null,2)+'\n');
    console.log(JSON.stringify({passed:results.length,errors,externalRequests,results}));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
