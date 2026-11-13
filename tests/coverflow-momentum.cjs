const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'artifacts');
// Sanitize in memory. These interactions must never reach production services.
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});r.end(source);});
async function main(){
  await new Promise(r=>server.listen(4187,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],results=[];
  try{
    for(const [width,height] of [[1440,1000],[390,844],[320,640],[844,390]]){
      const page=await browser.newPage({viewport:{width,height},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/#/project/2604');await page.waitForSelector('.project-gallery');
      await page.evaluate(()=>{
        window.coverFixtures=Array.from({length:9},(_,i)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${i===7?700:1000} 750"><rect width="100%" height="100%" fill="${['#d6d4cd','#dce1df','#c4d2dc'][i%3]}"/><path d="M0 650L1000 530V750H0Z" fill="#a6aaa5"/><path d="M180 260L590 160L830 290V610L420 690L180 560Z" fill="#edece6"/><path d="M590 160L830 290V610L590 500Z" fill="#555d61"/><path d="M180 260L590 160V500L180 560Z" fill="#c1bfb3"/>${Array.from({length:9},(_,n)=>`<path d="M${210+n*40} ${270-n*10}v250" stroke="#747a7a" stroke-width="12"/>`).join('')}<text x="70" y="110" font-family="sans-serif" font-size="70" fill="#333">${String(i+1).padStart(2,'0')}</text></svg>`));
        DB.projects.find(p=>p.code==='2604').shots=coverFixtures.slice();render();
      });
      await page.evaluate(()=>document.fonts.ready);
      const gallery=page.locator('.project-gallery'),track=page.locator('.project-gallery .gal-track');
      const index=async()=>+(await gallery.getAttribute('data-index'));
      const rest=async()=>{await page.waitForTimeout(500);await page.waitForFunction(()=>{const g=document.querySelector('.project-gallery'),card=g.querySelector(`[data-cover="${g.dataset.index}"]`);return Math.abs(+card.style.getPropertyValue('--cover-shift'))<.1;});await page.waitForTimeout(100);};
      const select=async i=>{await page.locator('.gal-dot').nth(i).click();await rest();assert.equal(await index(),i);};
      // Return to the image before dragging, including after a long text scroll.
      const center=async()=>{await page.evaluate(()=>{scrollTo(0,0);return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await track.evaluate(el=>{const b=el.getBoundingClientRect();scrollBy(0,b.top+b.height/2-innerHeight*.52);});const b=await track.boundingBox();return{x:width/2,y:Math.max(100,Math.min(height-35,b.y+b.height/2))};};
      await select(3);await center();
      const initial=await gallery.evaluate(g=>({
        index:+g.dataset.index,slides:g.querySelectorAll('[data-cover]').length,
        visible:[...g.querySelectorAll('[data-cover]')].filter(e=>getComputedStyle(e).visibility==='visible').length,
        exposed:[...g.querySelectorAll('[data-cover]')].filter(e=>e.getAttribute('aria-hidden')!=='true').length,
        tabs:[...g.querySelectorAll('.gal-dot')].map(e=>e.tabIndex),
        touch:getComputedStyle(g.querySelector('.gal-track')).touchAction,
        fit:[...g.querySelectorAll('.cover-surface img')].every(e=>getComputedStyle(e).objectFit==='contain'),
        reflection:getComputedStyle(g.querySelector('.cover-reflection')).maskImage,
        extra:g.querySelectorAll('figcaption,.gal-n,.gal-nav,[download]').length,
        front:g.querySelector('[data-cover="3"] .cover-surface').getBoundingClientRect().toJSON(),
      }));
      assert.equal(initial.slides,9);assert.equal(initial.exposed,1);assert(initial.tabs.every(t=>t===-1));assert(initial.touch.includes('pan-y'));assert(initial.fit);assert(initial.reflection.includes('linear-gradient'));assert.equal(initial.extra,0);assert(initial.front.x>=0&&initial.front.right<=width);
      await page.screenshot({path:path.join(out,`momentum-coverflow-${width}.png`)});
      // Find a genuinely visible neighbour hit area, rather than clicking an occluded bounding box.
      const point=await track.evaluate(el=>{const b=el.getBoundingClientRect(),y=Math.max(100,Math.min(innerHeight-35,b.y+b.height/2));for(let x=innerWidth/2;x<innerWidth-3;x+=2){if(document.elementFromPoint(x,y)?.closest('[data-cover]')?.dataset.cover==='4')return{x,y};}});
      assert(point,'Neighbour must remain visible');await page.mouse.click(point.x,point.y);await rest();assert.equal(await index(),4);
      await track.focus();await page.keyboard.press('Home');await rest();await page.keyboard.press('ArrowLeft');await rest();assert.equal(await index(),0);
      await page.keyboard.press('End');await rest();await page.keyboard.press('ArrowRight');await rest();assert.equal(await index(),8);
      await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await rest();assert.equal(await index(),2,'Rapid keys must accumulate');
      // A short quick flick travels farther than the same deliberately slow drag.
      async function mouseDrag(fast){
        await select(3);const c=await center();await page.mouse.move(c.x,c.y);await page.mouse.down();
        const distance=Math.min(65,width*.2);for(let i=1;i<=5;i++){await page.mouse.move(c.x-distance*i/5,c.y);await page.waitForTimeout(fast?10:80);}
        if(!fast)await page.waitForTimeout(130);await page.mouse.up();await rest();return index();
      }
      const slow=await mouseDrag(false),fast=await mouseDrag(true);assert(fast>slow,JSON.stringify({width,slow,fast}));
      await select(0);const c=await center();await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.move(c.x+80,c.y,{steps:5});
      const stretch=await page.locator('[data-cover="0"]').evaluate(e=>+e.style.getPropertyValue('--cover-shift'));assert(stretch>0&&stretch<80,'Finite end should resist dragging');await page.mouse.up();await rest();assert.equal(await index(),0);
      await select(3);await center();await page.mouse.move(width/2,c.y);await page.mouse.wheel(150,0);await page.waitForTimeout(180);await rest();assert((await index())>3,'Horizontal trackpad gesture should advance');
      const beforeVertical=await index(),scrollBefore=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,150);await page.waitForTimeout(180);assert.equal(await index(),beforeVertical);assert((await page.evaluate(()=>scrollY))>scrollBefore,'Vertical wheel should scroll the document');
      // Native touch input verifies horizontal capture and vertical page scrolling.
      await select(3);const touchCenter=await center(),cdp=await page.context().newCDPSession(page);
      await track.evaluate(el=>{window.touchTrace=[];for(const name of ['pointerdown','pointermove','pointerup','pointercancel'])el.addEventListener(name,e=>touchTrace.push({name,x:e.clientX,y:e.clientY,index:el.parentElement.dataset.index,type:e.pointerType,time:performance.now(),shift:el.querySelector('[data-cover="3"]').style.getPropertyValue('--cover-shift')}));});
      async function touch(dx,dy,cancel=false){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchCenter]});
        for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchCenter.x+dx*i/8,y:touchCenter.y+dy*i/8}]});await page.waitForTimeout(18);}
        await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await rest();
      }
      await touch(-Math.min(110,width*.3),0);assert((await index())>3,JSON.stringify({width,touchCenter,trace:await page.evaluate(()=>touchTrace)}));
      await select(3);await center();const y0=await page.evaluate(()=>scrollY);await touch(0,-100);assert.equal(await index(),3);assert((await page.evaluate(()=>scrollY))>y0,'Vertical touch should scroll the page');
      await select(3);await center();await touch(-50,0,true);const cancelled=await index();assert(Number.isInteger(cancelled));await cdp.detach();
      await page.emulateMedia({reducedMotion:'reduce'});await select(3);
      const reduced=await gallery.evaluate(g=>[...g.querySelectorAll('[data-cover]')].filter(e=>getComputedStyle(e).visibility==='visible').every(e=>+e.style.getPropertyValue('--cover-turn')===0&&+e.style.getPropertyValue('--cover-drift')===0));assert(reduced);
      await center();await page.mouse.move(width/2,c.y);for(let i=0;i<6;i++)await page.mouse.wheel(90,0);await page.waitForTimeout(180);assert.equal(await index(),4,'Reduced motion permits one step per wheel gesture');
      const previous=await index();await page.setViewportSize({width:width+16,height});await page.waitForTimeout(100);assert.equal(await index(),previous);await page.setViewportSize({width,height});
      for(const count of [3,2,1]){
        await page.evaluate(count=>{DB.projects.find(p=>p.code==='2604').shots=coverFixtures.slice(0,count);render();},count);await page.waitForTimeout(80);
        await track.focus();await page.keyboard.press('End');assert.equal(await index(),count-1);await page.keyboard.press('ArrowRight');assert.equal(await index(),count-1);assert.equal(await page.locator('[data-cover]').count(),count);
      }
      // Leave with a wheel timer pending; revisit and ensure a clean initial state.
      await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{DB.projects.find(p=>p.code==='2604').shots=coverFixtures.slice();render();});await center();await page.mouse.wheel(120,0);
      await page.evaluate(()=>location.hash='#/news');await page.waitForSelector('.rows');await page.waitForTimeout(200);await page.evaluate(()=>location.hash='#/project/2604');await page.waitForSelector('.project-gallery');assert.equal(await index(),0);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));results.push({width,height,initial,slow,fast,clickNeighbour:true,keyboard:true,rubberBand:true,trackpad:true,touch:true,reducedMotion:true,resize:true,finiteCounts:true,cleanup:true});await page.close();
    }
    assert.deepEqual(errors,[]);const result={testedAt:new Date().toISOString(),results,errors,limitations:'Isolated Chrome demo and emulated touch/trackpad. No production writes or real-device/Safari/Firefox/screen-reader checks.'};fs.writeFileSync(path.join(out,'coverflow-momentum-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
