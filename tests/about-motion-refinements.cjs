const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'artifacts');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(source);});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[],errors=[];
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/#/about');await page.waitForFunction(()=>document.querySelector('#about-title')?.dataset.motion==='scrambling');
   const narrowReplacements=new Set();
   for(let i=0;i<13;i++){
    const check=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,letters:[...document.querySelectorAll('.scramble-letter')].map(el=>({final:el.dataset.final,char:el.textContent,transform:getComputedStyle(el.firstElementChild).transform,width:el.style.width})),fonts:[...document.querySelectorAll('#about-title>span')].map(line=>new Set([...line.querySelectorAll('.scramble-glyph')].map(el=>getComputedStyle(el).fontSize)).size)}));
    assert(!check.overflow);assert(check.letters.every(el=>el.transform==='none'&&!el.width));assert(check.fonts.every(n=>n===1));check.letters.filter(el=>el.final==='I'&&el.char!=='I').forEach(el=>narrowReplacements.add(el.char));await page.waitForTimeout(100);
   }
   assert(narrowReplacements.size>5);await page.screenshot({path:path.join(out,'natural-title-'+width+'.png')});await page.waitForFunction(()=>document.querySelector('#about-title').dataset.motion==='settled');
   assert.equal(await page.locator('#about-system .story-chapter-head').evaluate(el=>getComputedStyle(el).textAlign),'center');
   assert.equal(await page.locator('[data-journey-step="1"]').evaluate(el=>getComputedStyle(el).textAlign),'right');
   assert.equal(await page.locator('#about-technology .story-chapter-head').evaluate(el=>getComputedStyle(el).textAlign),'right');
   assert.equal(await page.locator('[data-source-step="0"]').evaluate(el=>getComputedStyle(el).textAlign),'center');
   assert.equal(await page.locator('.people-intro').evaluate(el=>getComputedStyle(el).textAlign),'center');
   assert.equal(await page.locator('#about-technology').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
   const gap=await page.locator('#about-technology').evaluate(el=>el.querySelector('.function-layout').getBoundingClientRect().top-el.getBoundingClientRect().top);assert(gap>240);
   const paths=await page.evaluate(()=>{
    const origins=[0,Math.PI,Math.PI*2].flatMap(a=>[0,1].flatMap(f=>[0,12,25].map(l=>journeyPoint(a,l,f,3000,1))));
    const tips=[0,1].map(f=>journeyPoint(Math.PI/2,12,f,3000,1));return{origins,tips};
   });assert(paths.origins.every(p=>Math.hypot(p.x-300,p.y-230)<.001));assert(paths.tips.every(p=>Math.abs(Math.abs(p.x-300)-Math.abs(p.y-230))<.001));
   for(const [id,selector] of [['#about-experience','#byx-journey'],['#about-technology','#byx-function']]){
    const geometry=await page.locator(id+' .'+(id.includes('experience')?'journey-scroll':'function-layout')).evaluate(el=>{const b=el.getBoundingClientRect(),head=document.querySelector('#top').offsetHeight;return{top:b.top+scrollY,head,travel:b.height-(innerHeight-head)};});
    for(const progress of [.02,.35,.7,.98]){
     await page.evaluate(({g,p})=>scrollTo(0,g.top-g.head+g.travel*p),{g:geometry,p:progress});await page.waitForTimeout(160);
     const observed=+(await page.locator(selector).getAttribute('data-progress'));assert(Math.abs(observed-progress)<.02);
     if(progress===.02&&selector==='#byx-function')assert(await page.locator(selector).evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return !data.some((v,i)=>i%4===3&&v>0);}),'Technology must begin on black');
     if(progress>=.35){
      await page.locator(selector).evaluate(c=>{const w=Math.floor(c.width*.7),h=Math.floor(c.height*.5),x=Math.floor((c.width-w)/2),y=Math.floor((c.height-h)/2);window.motionSample={w,h,x,y,data:c.getContext('2d').getImageData(x,y,w,h).data};});
      const y=await page.evaluate(()=>scrollY);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>scrollY),y);
      const changed=await page.locator(selector).evaluate(c=>{const s=window.motionSample,data=c.getContext('2d').getImageData(s.x,s.y,s.w,s.h).data;let count=0;for(let i=3;i<data.length;i+=4)if(Math.abs(data[i]-s.data[i])>8)count++;return count;});assert(changed>60,'Central geometry must visibly move without scrolling, including after assembly: '+changed);
     }
     await page.screenshot({path:path.join(out,'refined-'+selector.slice(1)+'-'+width+'-'+progress+'.png')});
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    // Stop/resume when a modal is open, without resetting the scene clock.
    await page.evaluate(()=>{document.querySelector('#contact-dialog').showModal();document.dispatchEvent(new Event('byx:modal'));});
    await page.waitForTimeout(100);const stopped=await page.locator(selector).getAttribute('data-frame');await page.waitForTimeout(160);assert.equal(await page.locator(selector).getAttribute('data-frame'),stopped);
    await page.evaluate(()=>{document.querySelector('#contact-dialog').close();document.dispatchEvent(new Event('byx:modal'));});await page.waitForFunction(sel=>document.querySelector(sel).parentElement.dataset.motion==='running',selector);
   }
   assert(!/fillText\(['"]BYX/.test(await page.evaluate(()=>paintFunction.toString())));
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#byx-function').dataset.progress==='1');const still=await page.locator('#byx-function').evaluate(c=>c.toDataURL());await page.waitForTimeout(150);assert.equal(await page.locator('#byx-function').evaluate(c=>c.toDataURL()),still);
   await page.evaluate(()=>location.hash='#/feed');await page.waitForSelector('.feed-card');results.push({width,naturalTitle:true,variedAlignment:true,originCrossingX:true,continuousMotion:true,abstractCore:true,blackGap:true,reducedMotion:true});await page.close();
  }
  assert.deepEqual(errors,[]);const result={testedAt:new Date().toISOString(),results,errors,limitations:'Isolated Chrome demo, no production writes. No physical-device or Safari/Firefox verification.'};fs.writeFileSync(path.join(out,'about-motion-refinements-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
