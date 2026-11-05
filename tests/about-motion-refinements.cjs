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
   assert(await page.locator('.story-hero-copy,.story-chapter,.reading-step,.people-section,.contact-invitation').evaluateAll(els=>els.every(el=>{const s=getComputedStyle(el);return ['borderTopWidth','borderBottomWidth','borderLeftWidth','borderRightWidth'].every(key=>parseFloat(s[key])===0);})), 'About chapters and reading steps must have no divider rules');
   const textSelector='#about-system .story-chapter-head h2',textGeometry=await page.locator(textSelector).evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top+scrollY,travel:innerHeight*.43+Math.min(r.height*.2,100)};});
   const alphas=[];
   for(const p of [.18,.5,1]){
    await page.evaluate(({g,p})=>scrollTo(0,g.top-innerHeight*.93+g.travel*p),{g:textGeometry,p});await page.waitForTimeout(190);
    const values=await page.locator(textSelector+' .story-word').evaluateAll(els=>els.map(el=>+getComputedStyle(el).opacity));alphas.push(values);
    if(p===.5)assert(Math.max(...values)-Math.min(...values)>.4,'Words should emerge in a gradual sequence');
    await page.screenshot({path:path.join(out,'text-opacity-'+width+'-'+p+'.png')});
   }
   assert(alphas[0].every((a,i)=>a<=alphas[1][i]+.01));assert(alphas[1].every((a,i)=>a<=alphas[2][i]+.01));assert(alphas[2].every(a=>a>.99));
   await page.evaluate(g=>scrollTo(0,g.top-innerHeight*.93+g.travel*.18),textGeometry);await page.waitForTimeout(190);assert((await page.locator(textSelector+' .story-word').evaluateAll(els=>els.map(el=>+getComputedStyle(el).opacity))).every(a=>a>.99),'Revealed text must stay visible on reverse scroll');
   const paths=await page.evaluate(()=>{
    const origins=[0,Math.PI,Math.PI*2].flatMap(a=>[0,1].flatMap(f=>[0,12,25].map(l=>journeyPoint(a,l,f,3000,1))));
    const tips=[0,1].map(f=>journeyPoint(Math.PI/2,12,f,3000,1));return{origins,tips};
   });assert(paths.origins.every(p=>Math.hypot(p.x-300,p.y-230)<.001));assert(paths.tips.every(p=>Math.abs(Math.abs(p.x-300)-Math.abs(p.y-230))<.001));
   for(const [id,selector] of [['#about-experience','#byx-journey'],['#about-technology','#byx-function']]){
    const geometry=await page.locator(id+' .'+(id.includes('experience')?'journey-scroll':'function-layout')).evaluate(el=>{const b=el.getBoundingClientRect(),head=document.querySelector('#top').offsetHeight;return{top:b.top+scrollY,head,travel:b.height-(innerHeight-head)};});
    for(const progress of [.02,.18,.35,.7,.98]){
     await page.evaluate(({g,p})=>scrollTo(0,g.top-g.head+g.travel*p),{g:geometry,p:progress});await page.waitForTimeout(160);
     const observed=+(await page.locator(selector).getAttribute('data-progress'));assert(Math.abs(observed-progress)<.02);
     if(progress===.02&&selector==='#byx-function')assert(await page.locator(selector).evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return !data.some((v,i)=>i%4===3&&v>0);}),'Technology must begin on black');
     if(progress>=.18){
      await page.locator(selector).evaluate(c=>{const w=Math.floor(c.width*.7),h=Math.floor(c.height*.5),x=Math.floor((c.width-w)/2),y=Math.floor((c.height-h)/2);window.motionSample={w,h,x,y,data:c.getContext('2d').getImageData(x,y,w,h).data};});
      const y=await page.evaluate(()=>scrollY);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>scrollY),y);
      const changed=await page.locator(selector).evaluate(c=>{const s=window.motionSample,data=c.getContext('2d').getImageData(s.x,s.y,s.w,s.h).data;let count=0;for(let i=3;i<data.length;i+=4)if(Math.abs(data[i]-s.data[i])>8)count++;return count;});assert(changed>60,'Central geometry must visibly move without scrolling, including after assembly: '+changed);
     }
     await page.screenshot({path:path.join(out,'refined-'+selector.slice(1)+'-'+width+'-'+progress+'.png')});
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    await page.evaluate(g=>scrollTo(0,g.top-g.head+g.travel*.2),geometry);await page.waitForTimeout(120);assert(+(await page.locator(selector).getAttribute('data-progress'))>.96,'Assembled geometry must not reverse');
    await page.evaluate(g=>scrollTo(0,g.top-g.head+g.travel*.98),geometry);await page.waitForTimeout(120);
    // Stop/resume when a modal is open, without resetting the scene clock.
    if(selector==='#byx-function'){
     await page.mouse.move(width*.15,350);await page.waitForFunction(()=>+document.querySelector('#byx-function').dataset.pointerX<-.5);
     await page.screenshot({path:path.join(out,'galaxy-pointer-left-'+width+'.png')});
     await page.mouse.move(width*.85,650);await page.waitForFunction(()=>+document.querySelector('#byx-function').dataset.pointerX>.5&&+document.querySelector('#byx-function').dataset.pointerY>.15);
     await page.screenshot({path:path.join(out,'galaxy-pointer-right-'+width+'.png')});
     await page.mouse.move(10,20);await page.waitForFunction(()=>Math.abs(+document.querySelector('#byx-function').dataset.pointerX)<.08);
    }
    await page.evaluate(()=>{document.querySelector('#contact-dialog').showModal();document.dispatchEvent(new Event('byx:modal'));});
    await page.waitForTimeout(100);const stopped=await page.locator(selector).getAttribute('data-frame');await page.waitForTimeout(160);assert.equal(await page.locator(selector).getAttribute('data-frame'),stopped);
    await page.evaluate(()=>{document.querySelector('#contact-dialog').close();document.dispatchEvent(new Event('byx:modal'));});await page.waitForFunction(sel=>document.querySelector(sel).parentElement.dataset.motion==='running',selector);
   }
   for(const [section,layout,previous] of [['#about-experience','.journey-scroll','#about-system .x-field'],['#about-technology','.function-layout','#about-experience .journey-visual']]){
    const gap=await page.locator(section).evaluate((el,layout)=>{const r=el.getBoundingClientRect(),head=document.querySelector('#top').offsetHeight;return{top:r.top+scrollY,height:el.querySelector(layout).getBoundingClientRect().top-r.top,head};},layout);assert(gap.height>=890);
    await page.evaluate(g=>scrollTo(0,g.top-g.head+(g.height-(innerHeight-g.head))/2),gap);await page.waitForTimeout(100);
    assert((await page.locator(previous).boundingBox()).y+(await page.locator(previous).boundingBox()).height<=gap.head+3,'Previous scene must leave a fully black interval');assert((await page.locator(section+' '+layout).boundingBox()).y>=899,'Next scene must enter after the black interval');
    await page.screenshot({path:path.join(out,'black-gap-'+section.slice(1)+'-'+width+'.png')});
   }
   assert(!/fillText\(['"]BYX/.test(await page.evaluate(()=>paintFunction.toString())));
   assert.match(await page.locator('#byx-function').getAttribute('aria-label'),/도시.*은하/);
   const surfaces=await page.evaluate(()=>{const c=document.createElement('canvas'),ctx=c.getContext('2d');let fills=0,strokes=0;const fill=ctx.fill.bind(ctx),stroke=ctx.stroke.bind(ctx);ctx.fill=()=>{fills++;fill();};ctx.stroke=()=>{strokes++;stroke();};paintFunction(ctx,3000,.18);return{fills,strokes};});assert(surfaces.fills>400&&surfaces.strokes===0,'Technology should use filled surfaces, not a wireframe');
   const dense=await page.evaluate(()=>{const ctx=document.createElement('canvas').getContext('2d'),counts={fill:0,stroke:0,arc:0,quadraticCurveTo:0};for(const key of Object.keys(counts)){const original=ctx[key].bind(ctx);ctx[key]=(...args)=>{counts[key]++;return original(...args);};}paintFunction(ctx,3000,1);return{...counts,zoom:galaxyPose(0,1,{}).zoom};});assert(dense.fill>=324*4&&dense.quadraticCurveTo>=324*8&&dense.arc===0&&dense.stroke===0,'Final galaxy must contain at least four times as many curved surfaces and no dots/wires');assert.equal(dense.zoom,1.5);
   const wakes=await page.evaluate(()=>{const ctx=document.createElement('canvas').getContext('2d');let strokes=0,arcs=0;const stroke=ctx.stroke.bind(ctx),arc=ctx.arc.bind(ctx);ctx.stroke=(...a)=>{strokes++;stroke(...a);};ctx.arc=(...a)=>{arcs++;arc(...a);};paintJourney(ctx,3000,1,{left:0,right:600,top:-200,bottom:660});return{strokes,arcs};});assert(wakes.strokes>=400&&wakes.arcs<=110,'Experience motion must use continuous wakes rather than particle heads');
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#byx-function').dataset.progress==='1');const still=await page.locator('#byx-function').evaluate(c=>c.toDataURL());await page.waitForTimeout(150);assert.equal(await page.locator('#byx-function').evaluate(c=>c.toDataURL()),still);
   assert.equal(await page.locator('#byx-function').getAttribute('data-pointer-x'),'0.000');
   await page.evaluate(()=>location.hash='#/feed');await page.waitForSelector('.feed-card');results.push({width,naturalTitle:true,textRevealOnce:true,oneWayAnimations:true,variedAlignment:true,originCrossingX:true,continuousMotion:true,cityToGalaxy:true,pointsLinesSurfaces:true,curvedSurfaces:dense.fill,pointerRotation:true,longWakes:true,largerObjects:true,noDividers:true,fullScreenBlackGaps:true,reducedMotion:true});await page.close();
  }
  assert.deepEqual(errors,[]);const result={testedAt:new Date().toISOString(),results,errors,limitations:'Isolated Chrome demo, no production writes. No physical-device or Safari/Firefox verification.'};fs.writeFileSync(path.join(out,'about-motion-refinements-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
