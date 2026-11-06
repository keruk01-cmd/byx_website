const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'artifacts');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(source);});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const origin='http://127.0.0.1:'+server.address().port,errors=[],results=[];
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/#/feed');await page.waitForFunction(()=>DB.ready);
   await page.evaluate(async()=>{await DB.login('demo@byx.kr','');render();});
   assert.equal(await page.locator('[data-ed="new:news"]').count(),0);
   await page.locator('[data-ed="new:posts"]').click();await page.waitForSelector('#wbody');
   assert(await page.locator('#dl-postk option[value="NEWS"]').count());
   await page.locator('[data-k="t"]').fill('새 소식 통합 테스트');await page.locator('[data-k="k"]').fill('NEWS');await page.locator('#wbody').fill('새글에서 작성한 소식 본문입니다.');
   await page.locator('[data-pub="1"]').click();await page.locator('[data-act="save"]').click();await page.waitForSelector('.feed-card');
   assert.match(await page.locator('.page').innerText(),/새 소식 통합 테스트/);
   const counts=await page.evaluate(()=>({posts:DB.posts.length,news:DB.news.length}));
   await page.locator('[data-ed="list:posts"]').click();await page.waitForSelector('.arow');assert.equal(await page.locator('.arow').count(),counts.posts+counts.news);
   const legacy=page.locator('[data-edit][data-table="news"]').first();await legacy.click();await page.waitForSelector('[data-k="url"]');
   assert.equal(await page.evaluate(()=>AD.tab),'news');await page.locator('[data-act="cancel"]').click();await page.waitForSelector('.feed-card');
   await page.evaluate(()=>{DB.settings.about.story_headline='OLD OVERRIDE';DB.settings.about.studio='preserve studio';gotoAdmin('set:about');});await page.waitForSelector('[data-person-add]');
   assert.equal(await page.locator('[data-k^="story_"],[data-k="people"],[data-k="studio"]').count(),0);
   const initial=await page.locator('[data-person-card]').count();await page.locator('[data-person-add]').click();assert.equal(await page.locator('[data-person-card]').count(),initial+1);
   await page.locator('#person-name-'+initial).fill('새 직원 <script>');await page.locator('#person-role-'+initial).fill('Designer');await page.locator('#person-career-'+initial).fill('학력 A\n이력 B');await page.locator('[data-pintro="'+initial+'"]').fill('소개 첫 줄\n소개 둘째 줄');
   assert(await page.locator('[data-pintro="'+initial+'"]').evaluate(el=>el===document.activeElement));
   const photo=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=80;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,80,100);return c.toDataURL('image/png').split(',')[1];});
   const chooser=page.waitForEvent('filechooser');await page.locator('[data-pimg="'+initial+'"]').click();await (await chooser).setFiles({name:'member.png',mimeType:'image/png',buffer:Buffer.from(photo,'base64')});
   await page.waitForFunction(i=>cells(AD.draft.people)[i][3]?.startsWith('data:image/'),initial);
   await page.waitForFunction(()=>!document.querySelector('.pshot [data-pimg]')?.disabled);
   await page.locator('[data-person-drag="'+initial+'"]').focus();await page.keyboard.press('ArrowUp');
   let member=await page.evaluate(i=>cells(AD.draft.people)[i],initial-1);assert.equal(member[0],'새 직원 <script>');assert.equal(member[2],'학력 A / 이력 B');assert(member[3].startsWith('data:image/'));assert.equal(member[4],'소개 첫 줄\\n소개 둘째 줄');
   if(width===1440){
    await page.locator('[data-person-drag="'+(initial-1)+'"]').dragTo(page.locator('[data-person-card="0"]'));
    assert.equal(await page.evaluate(()=>cells(AD.draft.people)[0][0]),'새 직원 <script>');
   }else{
    // Real touch input, including viewport scrolling while a pointer is captured.
    const handle=page.locator('[data-person-drag="'+(initial-1)+'"]');await handle.scrollIntoViewIfNeeded();const start=await handle.boundingBox();
    const cdp=await page.context().newCDPSession(page),x=start.x+20,y=start.y+15;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await page.locator('[data-person-card="'+(initial-2)+'"]').evaluate(el=>el.scrollIntoView({block:'start'}));
    const target=await page.locator('[data-person-card="'+(initial-2)+'"]').boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:target.x+20,y:target.y+150}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    assert.equal(await page.evaluate(i=>cells(AD.draft.people)[i][0],initial-2),'새 직원 <script>');
   }
   // Remove a different card and verify the complete member stays intact.
   const remove=await page.evaluate(()=>cells(AD.draft.people).findIndex(row=>row[0]==='PARK'));await page.locator('[data-person-remove="'+remove+'"]').click();
   assert.equal(await page.locator('[data-person-card]').count(),initial);
   await page.screenshot({path:path.join(out,'people-editor-'+width+'.png'),fullPage:true});
   await page.locator('[data-act="savesettings"]').click();await page.waitForSelector('.feed-card');
   assert.equal(await page.evaluate(()=>DB.settings.about.studio),'preserve studio');assert.equal(await page.evaluate(()=>DB.settings.about.story_headline),'OLD OVERRIDE');
   await page.evaluate(()=>location.hash='#/about');await page.waitForSelector('.people');
   assert(!/OLD OVERRIDE/.test(await page.locator('.about-story').innerText()));assert.equal(await page.locator('.story-hero-top').count(),0);
   assert.equal(await page.locator('#about-title').getAttribute('aria-label'),'POSSIBILITIES BY X');
   const memberIndex=await page.evaluate(()=>cells(DB.settings.about.people).findIndex(row=>row[0]==='새 직원 <script>'));
   await page.locator('.people-group:not([data-copy]) > [data-person="'+memberIndex+'"]:not([data-fill])').click();await page.waitForSelector('#people-dialog[open]');
   assert.equal(await page.locator('#profile-name').innerText(),'새 직원 <script>');assert.match(await page.locator('.profile-career').innerText(),/학력 A/);assert.equal(await page.locator('.profile-intro').innerText(),'소개 첫 줄\n소개 둘째 줄');assert.equal(await page.locator('#people-dialog script').count(),0);await page.keyboard.press('Escape');
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.evaluate(()=>location.hash='#/feed');await page.waitForSelector('.feed-card');await page.evaluate(()=>location.hash='#/about');await page.waitForSelector('#byx-journey');
   for(const [section,canvas] of [['#about-experience','#byx-journey'],['#about-technology','#byx-function']]){
    const geometry=await page.locator(section).evaluate(el=>{const b=el.querySelector('.journey-scroll,.function-layout').getBoundingClientRect(),head=document.querySelector('#top').offsetHeight;return{top:b.top+scrollY,travel:b.height-(innerHeight-head)-(el.querySelector('#byx-function')?Math.max(0,el.querySelector('#byx-function').getBoundingClientRect().height-(innerHeight-head))*.5:0),head};});
    const samples=[];
    for(const p of [.05,.5,.97]){
     await page.evaluate(({g,p})=>scrollTo(0,g.top-g.head+g.travel*p),{g:geometry,p});await page.waitForTimeout(160);
     const value=+(await page.locator(canvas).getAttribute('data-progress'));assert(Math.abs(value-p)<.025,`progress ${value} vs ${p}`);
     samples.push(await page.locator(canvas).evaluate(c=>c.toDataURL()));
     await page.screenshot({path:path.join(out,canvas.slice(1)+'-'+width+'-'+p+'.png')});
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    assert.notEqual(samples[0],samples[2]);
    await page.evaluate(g=>scrollTo(0,g.top-g.head+g.travel*.2),geometry);await page.waitForTimeout(100);assert(+(await page.locator(canvas).getAttribute('data-progress'))>.95,'Reverse scroll must preserve assembled state');
    assert.equal(await page.locator(section).evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
   }
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#byx-function').dataset.progress==='1');
   await page.evaluate(()=>location.hash='#/feed');await page.waitForSelector('.feed-card');
   if(width===1440){
    await page.evaluate(()=>{gotoAdmin('set:about');AD.draft.people='';refreshAdmin();});await page.locator('[data-person-add]').click();await page.locator('[data-person-add]').click();assert.equal(await page.locator('[data-person-card]').count(),2);
    await page.locator('[data-person-remove="0"]').click();assert.equal(await page.locator('[data-person-card]').count(),1);await page.locator('#person-name-0').fill('첫 구성원');
    await page.evaluate(()=>setPersonPhoto(0,''));assert.equal(await page.evaluate(()=>cells(AD.draft.people).length),1);
   }
   results.push({width,unifiedFeed:true,memberCards:true,photoUpload:true,completeReorder:true,settingsPreserved:true,scrollScenes:true,noOverflow:true});await page.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'feed-people-scenes-results.json'),JSON.stringify({testedAt:new Date().toISOString(),results,errors,limitations:'Isolated demo. No production writes or physical-device testing.'},null,2)+'\n');console.log(JSON.stringify(results));
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
