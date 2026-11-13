const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const out=path.join(__dirname,'artifacts'),source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});r.end(source);});
async function main(){
  await new Promise(r=>server.listen(4189,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],results=[];
  try{
    for(const width of [1440,1024]){
      const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port);await p.evaluate(()=>document.fonts.ready);
      const rest=()=>p.waitForFunction(()=>{const n=document.querySelector('#nav');return n.dataset.pillMotion==='settled'&&n.dataset.hoverMotion!=='moving';});
      const box=()=>p.locator('#nav-pill').boundingBox();await p.mouse.move(1,1);await rest();const base=await box(),feed=await p.locator('#nav a[data-p="feed"]').boundingBox(),about=await p.locator('#nav a[data-p="about"]').boundingBox();
      await p.evaluate(()=>{window.hoverWords=document.querySelector('#nav-ink-words').firstElementChild;window.hoverLens=document.querySelector('#nav-lens-map').getAttribute('href');});
      const points=[feed.x+5,feed.x+feed.width*.5,feed.x+feed.width-5,(feed.x+feed.width+about.x)/2,about.x+5],samples=[];
      for(const x of points){await p.mouse.move(x,feed.y+feed.height/2);await rest();samples.push({pointerX:x,...await box()});}
      for(let i=1;i<samples.length;i++)assert(samples[i].width>samples[i-1].width+.03,'The same menu and the gap must respond continuously to pointer position');
      assert(samples[2].width-samples[0].width>1,'Moving inside one menu changes the extension');for(const b of samples)assert(Math.abs(b.x-base.x)<.5&&Math.abs(b.height-base.height)<.5);
      assert(await p.evaluate(()=>hoverWords===document.querySelector('#nav-ink-words').firstElementChild&&hoverLens===document.querySelector('#nav-lens-map').getAttribute('href')),'Mouse movement does not rebuild labels or regenerate the lens map');
      assert.equal(await p.locator('#nav-pill').evaluate(e=>e.getAnimations().length),0,'Hover follows a persistent spring, not restarted Web Animations');
      await p.screenshot({path:path.join(out,`nav-pointer-spring-${width}.png`)});
      await p.mouse.move(1,1);await rest();assert(Math.abs((await box()).width-base.width)<.05);
      // Measure the actual rendered geometry at every animation frame, including a reversal.
      await p.evaluate(()=>{window.motionSamples=[];window.collectHover=true;const sample=()=>{const b=document.querySelector('#nav-pill').getBoundingClientRect();motionSamples.push({time:performance.now(),x:b.x,width:b.width});if(collectHover)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
      await p.locator('#nav a[data-p="contact"]').hover();await p.waitForTimeout(120);await p.mouse.move(feed.x+5,feed.y+feed.height/2);await p.waitForTimeout(100);await p.mouse.move(1,1);await rest();
      const motion=await p.evaluate(()=>{collectHover=false;return motionSamples;});assert(new Set(motion.map(b=>b.width.toFixed(2))).size>15);assert(motion.every((b,i)=>i===0||Math.abs(b.width-motion[i-1].width)<3),'No jump on reversal or mouse leave');assert(Math.abs((await box()).width-base.width)<.05);
      await p.locator('#nav a[data-p="contact"]').hover();await rest();await p.locator('#nav a[data-p="about"]').click();await p.waitForTimeout(50);await p.locator('#nav a[data-p="feed"]').hover();await rest();assert.equal(await p.locator('#nav [aria-current="page"]').getAttribute('data-p'),'about');
      const left=await box(),selected=await p.locator('#nav a.on').boundingBox();assert(left.x<selected.x);assert(Math.abs(left.x+left.width-selected.x-selected.width)<.5);
      await p.keyboard.press('Escape');await rest();assert(Math.abs((await box()).width-selected.width)<.05);
      await p.locator('#nav a[data-p="contact"]').hover();await p.waitForTimeout(80);await p.emulateMedia({reducedMotion:'reduce'});await rest();assert(Math.abs((await box()).width-selected.width)<.05);assert.equal(await p.locator('#nav-pill').evaluate(e=>e.getAnimations().length),0);
      await p.emulateMedia({reducedMotion:'no-preference'});await p.mouse.move(1,1);await rest();await p.setViewportSize({width:390,height:844});assert.equal(await p.locator('#nav').isVisible(),false);await p.locator('#burger').click();await p.locator('#mobnav a[data-p="project"]').click();await p.waitForSelector('.grid');await p.setViewportSize({width,height:900});await rest();const resized=await p.locator('#nav a.on').boundingBox();assert(Math.abs((await box()).width-resized.width)<.05);
      results.push({width,withinMenuExtension:samples[2].width-samples[0].width,samples,continuousAcrossGap:true,anchoredFarEdge:true,noLabelOrLensRebuild:true,smoothReversal:true,smoothLeave:true,motionFrames:motion.length,clickTravel:true,keyboard:true,reducedMotion:true,mobileResize:true});await p.close();
    }
    assert.deepEqual(errors,[]);const result={testedAt:new Date().toISOString(),results,errors,limitations:'Isolated Chrome mouse and responsive viewport checks. No production writes or physical-device/Safari/Firefox verification.'};fs.writeFileSync(path.join(out,'nav-pointer-spring-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
