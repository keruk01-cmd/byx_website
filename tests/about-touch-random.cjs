const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const sanitize=s=>s.replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const current=sanitize(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));
const previous=sanitize(cp.execFileSync('git',['show','b1884d7:index.html'],{encoding:'utf8',maxBuffer:4e6}));
const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html;charset=utf-8');r.end(q.url.startsWith('/baseline')?previous:current);}),out=path.join(__dirname,'artifacts');
async function input(page,type){return page.locator('#x-cloud').evaluate((c,type)=>{
 const b=c.getBoundingClientRect(),x=b.left+b.width*.62,y=b.top+b.height*.52;
 const send=(name,extra={})=>c.dispatchEvent(new PointerEvent(name,{pointerType:type==='mouse'?'mouse':'touch',pointerId:7,button:0,isPrimary:true,clientX:x,clientY:y,bubbles:true,...extra}));
 send('pointerdown');const down=+c.dataset.dispersal;
 if(type==='swipe')send('pointermove',{clientY:y+40});if(type==='cancel')send('pointercancel');else send('pointerup');
 const up=+c.dataset.dispersal;return{down,up};
 },type);}
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],results=[];
 try{
  for(const width of [1440,390,320]){
   const sample=async(baseline,type)=>{
    const p=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:width<500});p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+(baseline?'/baseline':'/')+'#/about');await p.waitForSelector('#x-cloud');await p.locator('#x-cloud').scrollIntoViewIfNeeded();const result=await input(p,type);await p.close();return result;
   };
   const desktop=await sample(false,'mouse'),original=await sample(true,'mouse');assert.deepEqual(desktop,original,'Mouse response must stay identical to b1884d7');assert(desktop.up>10);
   const tap=await sample(false,'touch'),swipe=await sample(false,'swipe'),cancel=await sample(false,'cancel');assert.equal(tap.down,0,'Touch down must leave scrolling undecided');assert(tap.up>0&&tap.up<desktop.up*.45,'A tap must be substantially gentler than mouse input');assert.equal(swipe.up,0,'Swiping must not scatter the cloud');assert.equal(cancel.up,0,'Canceled scroll gestures must not scatter the cloud');
   results.push({width,desktopUnchanged:true,desktop,tap,swipe,cancel,touchToMouseRatio:tap.up/desktop.up});
  }
  const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/#/about');await p.waitForSelector('#x-cloud');await p.locator('.cloud-scroll-runway').evaluate(el=>{const b=el.getBoundingClientRect(),h=document.querySelector('#top').offsetHeight;scrollTo(0,b.top+scrollY-h+(b.height-innerHeight+h)*.98);});await p.waitForFunction(()=>+document.querySelector('#x-cloud').dataset.formation>.99);await p.waitForTimeout(180);
  await input(p,'touch');let peak=0;for(let n=0;n<18;n++){await p.waitForTimeout(45);peak=Math.max(peak,+await p.locator('#x-cloud').getAttribute('data-dispersal'));}const size=await p.locator('#x-cloud').boundingBox();assert(peak>1&&peak<=Math.hypot(size.width*.1,size.height*.1)+1,'Animated touch remains inside the reduced displacement limit');await p.screenshot({path:path.join(out,'gentle-touch-cloud-390.png')});
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.querySelector('.x-field').dataset.motion==='static');await p.evaluate(()=>location.hash='#/contact');await p.waitForSelector('.contact-cta');await p.close();assert.deepEqual(errors,[]);
  const report={testedAt:new Date().toISOString(),results,animatedTap:{peak,limit:Math.hypot(size.width*.1,size.height*.1)},errors,limitations:'Isolated Chrome, synthetic pointer gestures and emulated mobile viewport. Physical iPhone Safari/Chrome was not tested. No production writes.'};fs.writeFileSync(path.join(out,'about-touch-random-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
