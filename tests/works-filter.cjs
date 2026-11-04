const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(source);});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[],errors=[];
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('.card');await page.evaluate(()=>document.fonts.ready);
   const toggle=await page.locator('.toggle').boundingBox(),filter=await page.locator('[data-open-filter]').boundingBox();assert(toggle.x<width*.2&&filter.x>width*.7);
   assert.match(await page.locator('footer').innerText(),/2026 ARCHITECTS BYX/);assert.equal(await page.locator('.business-info').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');assert((await page.locator('footer').boundingBox()).height<100);
   assert.equal(await page.locator('#mobnav .foot').count(),0);
   await page.locator('[data-open-filter]').click();await page.waitForSelector('#works-filter-dialog[open]');assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
   await page.locator('#works-filter-dialog [name="type"]').selectOption({index:1});await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.style.overflow==='');assert.equal(await page.evaluate(()=>PV.type),'');
   await page.locator('[data-open-filter]').click();await page.locator('#works-filter-dialog [name="type"]').selectOption({index:1});const selected=await page.locator('#works-filter-dialog [name="type"]').inputValue();await page.locator('#works-filter-dialog [type="submit"]').click();
   await page.waitForFunction(()=>document.querySelector('[data-open-filter]').dataset.active==='true');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');assert(await page.evaluate(type=>filtered().every(p=>p.type===type),selected));
   await page.locator('[data-view="index"]').click();await page.waitForSelector('table.idx');const count=await page.evaluate(()=>filtered().length);assert.equal(await page.locator('table.idx tbody tr').count(),count);
   await page.locator('th[data-sort="year"]').click();assert.equal(await page.evaluate(()=>PV.type),selected);
   await page.locator('[data-open-filter]').click();assert.equal(await page.locator('#works-filter-dialog [name="type"]').inputValue(),selected);
   await page.locator('[data-reset-filter]').click();await page.locator('#works-filter-dialog [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('[data-open-filter]').dataset.active==='false');assert.equal(await page.evaluate(()=>filtered().length),await page.evaluate(()=>DB.projects.length));
   await page.locator('[data-open-filter]').click();await page.locator('#works-filter-dialog').screenshot({path:path.join(__dirname,'artifacts/works-filter-'+width+'.png')});
   await page.evaluate(()=>location.hash='#/about');await page.waitForSelector('.story-hero');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
   await page.evaluate(()=>{DB.projects=[{code:'ONE',name:'One',type:'<script>type',year:2026,status:'Ready'},{code:'TWO',name:'Two',type:'Other',year:2025,status:'Done'}];PV={...PV,type:'',status:'',year:'',view:'grid',shown:6};location.hash='#/';});await page.waitForSelector('.grid');
   await page.locator('[data-open-filter]').click();assert.equal(await page.locator('#works-filter-dialog script').count(),0);await page.locator('[name="type"]').selectOption('<script>type');await page.locator('[name="year"]').selectOption('2025');await page.locator('#works-filter-dialog [type="submit"]').click();await page.waitForSelector('.pane');assert.match(await page.locator('.pane').innerText(),/조건에 맞는/);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));results.push({width,filterAndSort:true,reset:true,emptyState:true,escapedOptions:true,modalCleanup:true,compactFooter:true});await page.close();
  }
  assert.deepEqual(errors,[]);const result={testedAt:new Date().toISOString(),results,errors};fs.writeFileSync(path.join(__dirname,'artifacts/works-filter-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
