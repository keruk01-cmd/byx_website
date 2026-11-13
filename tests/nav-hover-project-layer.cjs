const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const out=path.join(__dirname,'artifacts');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});r.end(source);});
async function main(){
  await new Promise(r=>server.listen(4188,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],results=[];
  try{
    const origin='http://127.0.0.1:'+server.address().port,p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));
    const rest=async()=>{await p.waitForFunction(()=>document.querySelector('#nav').dataset.pillMotion==='settled');await p.waitForTimeout(40);};
    const box=()=>p.locator('#nav-pill').boundingBox();
    const words=()=>p.locator('#nav-ink-words .nav-ink-word').evaluateAll(nodes=>nodes.map(e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height};}));
    await p.goto(origin);await p.evaluate(()=>document.fonts.ready);await p.mouse.move(1,1);await rest();
    const base=await box(),labels=await words(),hash=await p.evaluate(()=>location.hash);
    await p.locator('#nav a[data-p="contact"]').hover();await rest();const right=await box();
    assert(right.width>base.width+3&&right.width<=base.width+11);assert(Math.abs(right.x-base.x)<.5,'Far edge stays anchored');assert(Math.abs(right.height-base.height)<.5);
    assert.equal(await p.evaluate(()=>location.hash),hash);assert.equal(await p.locator('#nav a[aria-current="page"]').getAttribute('data-p'),'project');
    for(const [i,w]of (await words()).entries())for(const key of ['x','y','width','height'])assert(Math.abs(w[key]-labels[i][key])<.5,'Inverted labels stay fixed');
    await p.screenshot({path:path.join(out,'nav-hover-right-1440.png')});
    await p.mouse.move(1,1);await rest();assert(Math.abs((await box()).width-base.width)<.5);
    await p.locator('#nav a[data-p="contact"]').click();await rest();await p.mouse.move(1,1);await rest();const contact=await box();
    await p.locator('#nav a[data-p="project"]').hover();await rest();const left=await box();
    assert(left.x<contact.x-3&&Math.abs(left.x+left.width-contact.x-contact.width)<.5,'Right edge stays anchored for a left hover');
    await p.screenshot({path:path.join(out,'nav-hover-left-1440.png')});
    await p.keyboard.press('Escape');await rest();assert(Math.abs((await box()).x-contact.x)<.5);
    for(const key of ['feed','about','project']){await p.locator(`#nav a[data-p="${key}"]`).hover();await p.waitForTimeout(35);}
    await p.locator('#nav a[data-p="about"]').click();await p.waitForTimeout(55);await p.locator('#nav a[data-p="feed"]').hover();await rest();
    assert.equal(await p.locator('#nav a[aria-current="page"]').getAttribute('data-p'),'about');
    await p.mouse.move(1,1);await rest();const selected=await p.locator('#nav a.on').boundingBox();assert(Math.abs((await box()).x-selected.x)<.5);assert.equal(await p.locator('#nav-pill').count(),1);
    await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#nav a[data-p="contact"]').hover();await rest();assert(Math.abs((await box()).x-selected.x)<.5);assert(Math.abs((await box()).width-selected.width)<.5);
    assert.equal(await p.locator('#nav-pill').evaluate(e=>e.getAnimations().length),0);
    await p.emulateMedia({reducedMotion:'no-preference'});await p.mouse.move(1,1);await rest();await p.locator('#nav a[data-p="feed"]').focus();await p.keyboard.press('Enter');await p.waitForSelector('.feed-card');await rest();
    results.push({navigation:true,rightExtension:right.width-base.width,leftExtension:left.width-contact.width,anchoredEdges:true,fixedLabels:true,selectionUnchangedOnHover:true,rapidHoverAndClick:true,keyboard:true,reducedMotion:true});await p.close();
    for(const [width,height] of [[1440,1000],[390,844],[320,640],[844,390]]){
      const page=await browser.newPage({viewport:{width,height},hasTouch:width<=880});page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/#/project/2604');await page.waitForSelector('.project-scene');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
      await page.evaluate(()=>{const row=DB.projects.find(p=>p.code==='2604');row.shots=Array.from({length:7},(_,i)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 750"><rect width="1000" height="750" fill="#d7dad7"/><path d="M170 240L640 130L850 280V620L410 700L170 550Z" fill="#eeeae1"/><path d="M640 130L850 280V620L640 490Z" fill="#505a61"/>${Array.from({length:8},(_,j)=>`<path d="M${220+j*48} ${270-j*10}v280" stroke="#737c80" stroke-width="12"/>`).join('')}<text x="50" y="100" font-family="sans-serif" font-size="60">${i+1}</text></svg>`));render();});
      const geometry=await page.evaluate(()=>{const g=document.querySelector('.project-gallery'),b=document.querySelector('.pd-body'),s=getComputedStyle(b);return{gallery:getComputedStyle(g).position,background:s.backgroundColor,bodyBorder:s.borderTopWidth,rows:[...document.querySelectorAll('.specs dt,.specs dd')].map(e=>getComputedStyle(e).borderBottomWidth),text:b.textContent,initialTop:g.getBoundingClientRect().top};});
      assert.equal(geometry.gallery,'sticky');assert.equal(geometry.background,'rgba(0, 0, 0, 0)');assert.equal(geometry.bodyBorder,'0px');assert(geometry.rows.every(x=>x==='0px'));
      await page.evaluate(()=>{const b=document.querySelector('.pd-body').getBoundingClientRect(),head=document.querySelector('.header-row').offsetHeight;scrollTo(0,scrollY+b.top-head-innerHeight*.3);});await page.waitForTimeout(150);
      const overlay=await page.evaluate(()=>{const g=document.querySelector('.project-gallery'),b=document.querySelector('.pd-body'),gb=g.getBoundingClientRect(),bb=b.getBoundingClientRect();return{gallery:{top:gb.top,bottom:gb.bottom},body:{top:bb.top,bottom:bb.bottom},progress:+document.querySelector('.project-scene').style.getPropertyValue('--project-reading'),opacity:+getComputedStyle(g).opacity,text:b.textContent,overflow:document.documentElement.scrollWidth>innerWidth};});
      assert(overlay.gallery.bottom>overlay.body.top+50,'Copy should pass in front of the gallery');assert(overlay.progress>0&&overlay.opacity<1&&overlay.opacity>=.15);assert.equal(overlay.text,geometry.text);assert(!overlay.overflow);
      await page.screenshot({path:path.join(out,`project-layer-reading-${width}.png`)});
      await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(120);assert.equal(await page.locator('.project-gallery').evaluate(e=>getComputedStyle(e).opacity),'1');
      await page.locator('.gal-track').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(750);assert.equal(await page.locator('.project-gallery').getAttribute('data-index'),'1');
      if(width<=880){const current=await page.locator('#nav a.on').getAttribute('data-p');await page.locator('#burger').click();await page.locator('#mobnav a[data-p="feed"]').click();await page.waitForSelector('.feed-card');assert.equal(await page.locator('#nav a.on').getAttribute('data-p'),'feed');assert.equal(current,'project');await page.evaluate(()=>location.hash='#/project/2604');await page.waitForSelector('.project-scene');}
      await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.project-gallery').evaluate(e=>getComputedStyle(e).position),'relative');assert.equal(await page.locator('.project-gallery').evaluate(e=>getComputedStyle(e).opacity),'1');
      await page.evaluate(()=>location.hash='#/news');await page.waitForSelector('.rows');assert.equal(await page.locator('.project-scene').count(),0);await page.mouse.wheel(0,100);await page.waitForTimeout(60);
      results.push({width,height,geometry:{...geometry,text:undefined},overlay:{...overlay,text:undefined},transparentForeground:true,readabilityFade:true,contentPreserved:true,galleryKeys:true,mobileMenu:width<=880,reducedMotion:true,cleanup:true});await page.close();
    }
    assert.deepEqual(errors,[]);const result={testedAt:new Date().toISOString(),results,errors,limitations:'Isolated Chrome demo; mouse and mobile viewport emulation. No production writes, real-device/Safari/Firefox or screen-reader verification.'};fs.writeFileSync(path.join(out,'nav-hover-project-layer-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
