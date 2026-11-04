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
      await page.locator('[data-about-jump="about-experience"]').click();
      assert.equal(await page.evaluate(()=>document.activeElement.id),'experience-title');
      assert.equal(await page.locator('[data-about-jump="about-experience"]').getAttribute('aria-current'),'step');
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
      const motion=await page.locator('#x-cloud').getAttribute('data-frame');
      await page.evaluate(()=>location.hash='#/');await page.waitForSelector('.grid');
      assert.equal(await page.locator('.story-nav').count(),0);assert.equal(await page.locator('#x-cloud').count(),0);
      assert.equal(await page.locator('.business-info').count(),1);
      results.push({width,chapters:3,conditions:true,journey:true,dataSources:true,keyboard:true,cmsPreserved:true,escaped:true,footer:true,noOverflow:true,routeCleanup:true,reducedMotion:true});
      await page.close();
    }
    assert.deepEqual(errors,[]);
    const result={testedAt:new Date().toISOString(),results,errors,limitations:'Isolated demo only. No operational settings writes, database changes or real-device Safari/Firefox test.'};
    fs.writeFileSync(path.join(out,'about-story-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
