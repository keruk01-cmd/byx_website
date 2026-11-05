const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(source);});
const out=path.join(__dirname,'artifacts');
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],results=[];
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(width+': '+e.message));
   await page.goto(origin+'/#/about');await page.waitForSelector('.people');await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='dark');
   assert.equal(await page.locator('.story-studio,.about-grid,[data-about-condition],[data-about-journey],[data-about-data]').count(),0);
   assert.equal(await page.locator('.story-chapter').count(),3);assert.equal(await page.locator('[data-journey-step]').count(),2);assert.equal(await page.locator('[data-source-step]').count(),2);
   assert.equal(await page.locator('#about-title').getAttribute('aria-label'),'POSSIBILITIES BY X');
   assert.equal(await page.locator('#about-title').getAttribute('data-motion'),'settled');
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarWidth),'none');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(out,'cinematic-hero-'+width+'.png')});
   await page.locator('[data-journey-step="1"]').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('[data-journey-step="1"]').classList.contains('is-current'));
   assert.equal(await page.locator('.system-equation,.people-pause').count(),0);
   if(width<=390){
    assert.equal(await page.locator('.journey-visual').evaluate(el=>getComputedStyle(el).position),'relative');assert.equal(await page.locator('.function-visual').evaluate(el=>getComputedStyle(el).position),'relative');
    const label=await page.locator('.x-label-left').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.parentElement.getBoundingClientRect();return Math.abs(a.y+a.height/2-b.y-b.height/2);});assert(label<2,'Mobile X label must be vertically centered');
   }
   const copy=await page.locator('.story-chapter').allInnerTexts();assert(!/건축|대지|법령|도면|인테리어/.test(copy.join('')),'About copy must span services');
   assert.equal(await page.locator('.people-section').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');assert.equal(await page.locator('footer').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');
   await page.locator('#byx-journey').scrollIntoViewIfNeeded();await page.locator('.experience-drawing').screenshot({path:path.join(out,'byx-journey-'+width+'.png')});
   await page.locator('#byx-function').scrollIntoViewIfNeeded();assert.equal(await page.locator('.function-stage').getAttribute('data-motion'),'static');
   await page.locator('.function-stage').screenshot({path:path.join(out,'byx-function-'+width+'.png')});
   await page.locator('.people').scrollIntoViewIfNeeded();assert.equal(await page.locator('.people').getAttribute('data-motion'),'static');
   const trigger=page.locator('.people-group:not([data-copy]) [data-person="0"]').first();await trigger.click();
   await page.waitForSelector('#people-dialog[open]');assert.equal(await page.locator('#profile-name').innerText(),'PARK');
   assert.match(await page.locator('.profile-career').innerText(),/서울대/);assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'profile-close');
   await page.locator('#people-dialog').screenshot({path:path.join(out,'people-profile-'+width+'.png')});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#people-dialog').open&&document.body.style.overflow==='');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
   await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('.people').scrollIntoViewIfNeeded();await page.evaluate(()=>document.activeElement.blur());await page.mouse.move(0,0);
   await page.waitForFunction(()=>document.querySelector('.people').dataset.motion==='running');const before=+(await page.locator('.people').getAttribute('data-offset'));
   await page.waitForTimeout(450);const after=+(await page.locator('.people').getAttribute('data-offset'));assert(after<before,'People must move right to left');
   const first=page.locator('.people-group:not([data-copy]) > [data-person="1"]:not([data-fill])');
   const clickMoving=async()=>{const box=await first.boundingBox();await page.mouse.click(Math.min(width-12,Math.max(12,box.x+box.width/2)),box.y+box.height/2);};
   await clickMoving();await page.waitForSelector('#people-dialog[open]');
   assert.match(await page.locator('#people-dialog').evaluate(el=>getComputedStyle(el).animationName),/profile-in/);
   await page.locator('#people-dialog .profile-close').click();await page.waitForFunction(()=>document.querySelector('.people').dataset.motion==='running');
   const resumed=+(await page.locator('.people').getAttribute('data-offset'));await page.waitForTimeout(250);assert(+(await page.locator('.people').getAttribute('data-offset'))<resumed,'Closing profile must resume without clicking elsewhere');
   await clickMoving();await page.waitForSelector('#people-dialog[open]');
   await page.evaluate(()=>location.hash='#/');await page.waitForSelector('.grid');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
   await page.evaluate(()=>location.hash='#/about');await page.waitForSelector('.people');
   const formation=await page.evaluate(()=>{const el=document.querySelector('.cloud-scroll-runway'),r=el.getBoundingClientRect(),head=document.querySelector('#top').offsetHeight;return{top:r.top+scrollY,travel:r.height-(innerHeight-head),head};});
   await page.evaluate(g=>scrollTo(0,g.top-g.head+g.travel*.12),formation);await page.waitForTimeout(100);
   const stars=+(await page.locator('#x-cloud').getAttribute('data-formation'));assert(stars<.3);
   await page.locator('.x-field').screenshot({path:path.join(out,'x-flight-'+width+'.png')});
   const y1=(await page.locator('.x-field').boundingBox()).y;
   await page.evaluate(g=>scrollTo(0,g.top-g.head+g.travel*.8),formation);await page.waitForTimeout(100);
   assert(+(await page.locator('#x-cloud').getAttribute('data-formation'))>.99);assert(Math.abs((await page.locator('.x-field').boundingBox()).y-y1)<2,'Cloud stage must stay pinned');
   await page.locator('.x-field').screenshot({path:path.join(out,'x-formed-'+width+'.png')});
   await page.locator('#byx-function').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.function-stage').dataset.motion==='running');
   const frame=+(await page.locator('#byx-function').getAttribute('data-frame'));await page.waitForTimeout(200);assert(+(await page.locator('#byx-function').getAttribute('data-frame'))>frame);
   await page.locator('[data-contact-launch]').click();await page.waitForSelector('#contact-dialog[open]');
   assert(await page.locator('#contact-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));assert((await page.locator('.contact-consent').boundingBox()).height<110,'Consent must wrap normally');
   await page.locator('#contact-form [name="subject"]').fill('<script>프로젝트 문의');await page.locator('#contact-form [name="email"]').fill('visitor@example.invalid');await page.locator('#contact-form [name="phone"]').fill('010-1234-5678');await page.locator('#contact-form [name="body"]').fill('새로운 공간을 함께 만들고 싶습니다.');await page.locator('#contact-form [name="consent"]').check();
   await page.locator('#contact-form [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#contact-feedback').textContent.includes('데모'));
   await page.locator('#contact-dialog').screenshot({path:path.join(out,'contact-modal-'+width+'.png')});await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.style.overflow==='');
   assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
   await page.evaluate(async()=>{await DB.login('demo@byx.kr','');location.hash='#/admin';});await page.waitForSelector('[data-tab="inquiries"]');await page.locator('[data-tab="inquiries"]').click();
   await page.waitForSelector('.inquiry-item');assert.match(await page.locator('.inquiry-item summary').innerText(),/<script>프로젝트 문의/);assert.equal(await page.locator('.inquiry-item script').count(),0);
   await page.locator('.inquiry-item summary').click();await page.locator('[data-inquiry-status]').selectOption('reviewed');await page.waitForFunction(()=>DB.inquiries[0].status==='reviewed');
   await page.evaluate(()=>location.hash='#/about');await page.waitForSelector('.people');
   if(width===1440){
    let fail=true,requests=0;await page.route('**/functions/v1/contact-inquiry',async route=>{requests++;await new Promise(resolve=>setTimeout(resolve,150));await route.fulfill({status:fail?503:201,contentType:'application/json',body:JSON.stringify(fail?{error:'접수하지 못했습니다. 다시 시도해주세요.'}:{accepted:true,id:'test-contact'})});});
    await page.evaluate(()=>sb={});await page.locator('[data-contact-launch]').click();await page.locator('#contact-form [name="subject"]').fill('실제 전송 경로 모의 검증');await page.locator('#contact-form [name="email"]').fill('visitor@example.invalid');await page.locator('#contact-form [name="body"]').fill('서버 응답에 따른 성공과 실패 안내를 확인합니다.');await page.locator('#contact-form [name="consent"]').check();
    await page.locator('#contact-form [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#contact-feedback').textContent.includes('접수하지 못했습니다'));assert.equal(await page.locator('#contact-form [name="subject"]').inputValue(),'실제 전송 경로 모의 검증');
    fail=false;await page.locator('#contact-form [type="submit"]').click();await page.evaluate(()=>document.querySelector('#contact-form').dispatchEvent(new Event('submit',{cancelable:true})));await page.waitForFunction(()=>document.querySelector('#contact-feedback').textContent==='문의가 접수되었습니다.');assert.equal(requests,2);
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.style.overflow==='');await page.evaluate(()=>sb=null);
    await page.evaluate(()=>gotoAdmin('set:about'));await page.waitForSelector('[data-pintro="0"]');
    const intro=page.locator('[data-pintro="0"]');await intro.fill('첫 번째 소개\n두 번째 <script>문장');assert(await intro.evaluate(el=>el===document.activeElement));
    const preserved=await page.evaluate(()=>{setPersonPhoto(0,'https://example.invalid/test.webp');setPersonPhoto(0,'');return cells(AD.draft.people)[0][4];});assert.match(preserved,/<script>/);
    await page.locator('[data-act="savesettings"]').click();await page.waitForSelector('.people');await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('.people-group:not([data-copy]) > [data-person="0"]').first().click();assert.equal(await page.locator('.profile-intro').innerText(),'첫 번째 소개\n두 번째 <script>문장');assert.equal(await page.locator('.profile-intro script').count(),0);await page.keyboard.press('Escape');
   }
   await page.evaluate(()=>{DB.settings.about.people='ONE | Architect | Career | | A personal introduction';render();});
   await page.locator('.people').scrollIntoViewIfNeeded();assert.equal(await page.locator('.people-group').count(),1);assert.equal(await page.locator('.people-pause').count(),0);
   await page.locator('[data-person="0"]').click();assert.equal(await page.locator('.profile-intro').innerText(),'A personal introduction');await page.keyboard.press('Escape');
   await page.evaluate(()=>{DB.settings.about.people='';render();});assert.equal(await page.locator('.people-section').count(),0);
   results.push({width,blackHero:true,nativeScroll:true,pinnedAssembly:true,scrollNarrative:true,functionAnimation:true,peopleLoop:true,profileModal:true,modalCleanup:true,contactForm:true,privateInboxDemo:true,profileCms:width===1440,reducedMotion:true,noOverflow:true});await page.close();
  }
  const titlePage=await browser.newPage({viewport:{width:1440,height:900}});titlePage.on('pageerror',e=>errors.push(e.message));await titlePage.goto(origin+'/#/about');
  await titlePage.waitForFunction(()=>document.querySelector('#about-title')?.dataset.motion==='scrambling');const scrambled=await titlePage.locator('#about-title').innerText();
  for(let sample=0;sample<6;sample++){assert(await titlePage.locator('.scramble-letter').evaluateAll(els=>els.every(el=>{const a=el.getBoundingClientRect(),b=el.firstElementChild.getBoundingClientRect();return b.left>=a.left-1&&b.right<=a.right+1;})),'Scrambled glyph must stay in its own cell');await titlePage.waitForTimeout(70);}
  await titlePage.screenshot({path:path.join(out,'title-scrambling.png')});
  await titlePage.waitForFunction(()=>document.querySelector('#about-title').dataset.motion==='settled');assert.notEqual(scrambled,await titlePage.locator('#about-title').innerText());
  await titlePage.evaluate(()=>location.hash='#/feed');await titlePage.waitForSelector('a.feed-card');const card=titlePage.locator('a.feed-card').first();await card.hover();await titlePage.waitForTimeout(800);
  const hover=await card.locator('img').evaluate(el=>({transform:getComputedStyle(el).transform,filter:getComputedStyle(el).filter,transition:getComputedStyle(el).transition}));assert.match(hover.transform,/1\.035/);assert.match(hover.filter,/grayscale\(0\)/);assert.match(hover.transition,/0\.7s/);
  await card.screenshot({path:path.join(out,'feed-hover.png')});await titlePage.close();assert.deepEqual(errors,[]);
  const result={testedAt:new Date().toISOString(),results,titleScramble:true,feedHover:hover,errors,limitations:'Isolated demo; no production content writes; no real-device Safari/Firefox test.'};fs.writeFileSync(path.join(out,'cinematic-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
