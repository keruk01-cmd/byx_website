const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});
const out=path.join(__dirname,'artifacts');
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const results=[],errors=[];
  try{
    for(const width of [1440,390,320]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      page.on('pageerror',e=>errors.push(width+': '+e.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/#/about');
      await page.waitForSelector('.about-story');await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.locator('.story-chapter').count(),3);
      assert.equal(await page.locator('#x-cloud').count(),1);
      assert.equal(await page.locator('.story-nav,[data-about-jump]').count(),0);
      assert.equal(await page.locator('.x-label-right').innerText(),'eXperience');
      const visibleCopy=await page.locator('.about-story').innerText();
      for(const phrase of ['MEETS EXPERIENCE','DIFFERENT QUESTIONS','NEW POSSIBILITIES','ALSO DEVELOPERS','OUR WAY OF THINKING'])assert(!visibleCopy.includes(phrase));
      const header=await page.locator('#top').boundingBox();assert.equal(header.height,width===1440?81:55.5);
      if(width===1440){
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('#nav a.on')).color==='rgb(255, 255, 255)');
        const selected=await page.locator('#nav a.on').evaluate(el=>({text:getComputedStyle(el).color,fill:getComputedStyle(el,'::before').backgroundColor,opacity:getComputedStyle(el,'::before').opacity,radius:getComputedStyle(el).borderRadius}));
        assert.equal(selected.text,'rgb(255, 255, 255)');assert.equal(selected.fill,'rgb(0, 0, 0)');assert.equal(selected.opacity,'1');assert.equal(selected.radius,'999px');
        await page.locator('#nav a[data-p="feed"]').hover();
        await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#nav a[data-p="feed"]'),'::before').opacity)>.1);
        await page.mouse.move(0,header.height+20);
      }
      const overflowing=await page.evaluate(()=>[...document.querySelectorAll('.about-story *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1);}).map(e=>({tag:e.tagName,class:e.className?.baseVal??e.className,right:e.getBoundingClientRect().right})));
      assert.deepEqual(overflowing,[],'Horizontal overflow at '+width);
      await page.screenshot({path:path.join(out,'about-story-hero-'+width+'.png')});
      await page.screenshot({path:path.join(out,'about-story-full-'+width+'.png'),fullPage:true});
      await page.locator('[data-about-condition="1"]').click();
      assert.equal(await page.locator('[data-about-condition="1"]').getAttribute('aria-pressed'),'true');
      assert.match(await page.locator('#system-result h3').innerText(),/살아갈 사람/);
      assert.equal(await page.locator('#x-cloud').getAttribute('data-shape'),'1');
      await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-about-condition="2"]').getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('#x-cloud').getAttribute('data-shape'),'2');
      await page.locator('[data-about-condition="0"]').click();
      await page.locator('#about-system').screenshot({path:path.join(out,'about-story-system-'+width+'.png'),style:'#top,#top *,.story-nav,.story-nav *{visibility:hidden!important}'});
      await page.evaluate(()=>scrollTo(0,document.querySelector('.x-field').getBoundingClientRect().top+scrollY+120));
      await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='dark');
      if(width===1440){
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('#nav a.on')).color==='rgb(0, 0, 0)');
        const pill=await page.locator('#nav a.on').evaluate(el=>({text:getComputedStyle(el).color,fill:getComputedStyle(el,'::before').backgroundColor}));
        assert.equal(pill.text,'rgb(0, 0, 0)');assert.equal(pill.fill,'rgb(255, 255, 255)');
      }
      await page.locator('#about-experience').scrollIntoViewIfNeeded();
      for(let index=0;index<4;index++){
        await page.locator('[data-about-journey="'+index+'"]').click();
        assert.equal(await page.locator('#journey-number').innerText(),String(index+1).padStart(2,'0'));
        assert.equal(await page.locator('[data-journey-node][data-active="true"]').count(),index+1);
        assert.equal(await page.locator('[data-about-journey][aria-pressed="true"]').count(),1);
      }
      assert.match(await page.locator('#journey-title').innerText(),/실제의 경험/);
      await page.locator('#about-experience').screenshot({path:path.join(out,'about-story-experience-'+width+'.png'),style:'#top,#top *,.story-nav,.story-nav *{visibility:hidden!important}'});
      for(let index=0;index<4;index++){
        await page.locator('[data-about-data="'+index+'"]').click();
        assert.equal(await page.locator('[data-about-data][aria-pressed="true"]').count(),1);
        assert.equal(await page.locator('#tech-title').innerText(),await page.evaluate(i=>ABOUT_DATA[i].title,index));
      }
      await page.locator('#about-technology').screenshot({path:path.join(out,'about-story-technology-'+width+'.png'),style:'#top,#top *,.story-nav,.story-nav *{visibility:hidden!important}'});
      assert.equal(await page.locator('.story-studio details').getAttribute('open'),null);
      await page.locator('.story-studio summary').click();assert(await page.locator('.story-studio .about-grid').isVisible());
      assert(await page.locator('.people').isVisible());
      const footer=await page.locator('.business-info').innerText();
      for(const text of ['바이엑스건축사사무소','대표자 강전성','653-07-02704'])assert(footer.includes(text));
      await page.locator('body>footer').screenshot({path:path.join(out,'business-footer-'+width+'.png')});
      const cms=await page.evaluate(async()=>{
        await DB.login('demo@byx.kr','demo');gotoAdmin('set:about');
        return {before:{...DB.settings.about}};
      });
      await page.waitForSelector('[data-k="story_headline"]');
      const input=page.locator('[data-k="story_headline"]');
      await input.fill('우리의 질문 <script>\n함께 만드는 경험');
      assert.equal(await input.evaluate(el=>document.activeElement===el),true);
      await page.locator('[data-act="savesettings"]').click();
      await page.waitForSelector('.about-story');
      assert.equal(await page.locator('.story-hero-copy h2').innerText(),'우리의 질문 <script>\n함께 만드는 경험');
      assert.equal(await page.locator('.story-hero-copy script').count(),0);
      const saved=await page.evaluate(()=>DB.settings.about);
      for(const key of ['lede','studio','facts','records','people'])assert.equal(saved[key],cms.before[key]);
      await page.evaluate(()=>{DB.settings.about.story_headline='';render();});
      assert.match(await page.locator('.story-hero-copy h2').innerText(),/미지수는 가능성으로/);
      let settle=null,pillAnimation=null;
      if(width===1440){
        await page.emulateMedia({reducedMotion:'no-preference'});
        await page.locator('#x-cloud').scrollIntoViewIfNeeded();
        await page.waitForFunction(()=>document.querySelector('.x-field').dataset.motion==='running');
        const canvas=page.locator('#x-cloud'),box=await canvas.boundingBox();
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(700);
        await canvas.click({position:{x:box.width/2,y:box.height/2}});await page.waitForTimeout(300);
        const peak=+(await canvas.getAttribute('data-dispersal'));
        await page.mouse.move(0,0);await page.waitForTimeout(1000);const after1s=+(await canvas.getAttribute('data-dispersal'));
        await page.waitForTimeout(5000);const after6s=+(await canvas.getAttribute('data-dispersal'));
        assert(after1s>peak*.2,'Pointer influence must linger');assert(after6s<peak*.25,'Pointer influence must eventually settle');
        settle={peak,after1s,after6s};
        await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>!spinning);
        const fit=await page.evaluate(()=>{setStatic('ARCHITECTURE');fitItems();const word=document.querySelector('#reel .w').getBoundingClientRect(),slot=document.querySelector('#slotwrap').getBoundingClientRect();return word.width<=slot.width+1;});assert(fit,'Long slot word no longer fits');
        await page.locator('#nav a[data-p="feed"]').hover();
        await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#nav a[data-p="feed"]'),'::before').opacity)>.1);
        await page.locator('#top').screenshot({path:path.join(out,'pill-menu-hover-1440.png')});
        await page.locator('#nav a[data-p="feed"]').click();await page.waitForSelector('.feed');
        await page.mouse.move(0,header.height+20);
        await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#nav a.on'),'::before').opacity)>.99);
        pillAnimation=await page.locator('#nav a.on').evaluate(el=>({page:el.dataset.p,name:getComputedStyle(el,'::before').animationName,duration:getComputedStyle(el,'::before').animationDuration}));
        assert.equal(pillAnimation.page,'feed');assert.equal(pillAnimation.name,'nav-pill-in');assert.equal(pillAnimation.duration,'0.32s');
        await page.locator('#top').screenshot({path:path.join(out,'pill-menu-selected-1440.png')});
      }
      await page.evaluate(()=>location.hash='#/');await page.waitForSelector('.grid');
      assert.equal(await page.locator('.story-nav').count(),0);assert.equal(await page.locator('#x-cloud').count(),0);
      assert.equal(await page.locator('.business-info').count(),1);
      results.push({width,headerHeight:header.height,pillMenu:width===1440,pillAnimation,settle,chapterNavigationRemoved:true,decorativeCopyRemoved:true,chapters:3,conditions:true,journey:true,dataSources:true,keyboard:true,cmsPreserved:true,escaped:true,footer:true,noOverflow:true,routeCleanup:true,reducedMotion:true});
      await page.close();
    }
    assert.deepEqual(errors,[]);
    const result={testedAt:new Date().toISOString(),results,errors,limitations:'Isolated demo only. No operational settings writes, database changes or real-device Safari/Firefox test.'};
    fs.writeFileSync(path.join(out,'about-story-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
