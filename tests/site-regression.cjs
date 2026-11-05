const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tests/artifacts');
fs.mkdirSync(out,{recursive:true});
// Never connect to production: sanitize in memory, not in the original file.
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/[^\"]+"><\/script>/,'');
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(source);});
const errors=[],results=[];
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    for(const width of [2560,1920,1440,390,320]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      page.on('pageerror',e=>errors.push(width+': '+e.message));
      await page.route('https://tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><path d="M0 128H256M128 0V256" stroke="black"/></svg>'}));
      await page.route('https://www.google.com/maps**',r=>r.fulfill({contentType:'text/html',body:'<p>Map fixture</p>'}));
      await page.goto(origin);await page.waitForFunction(()=>DB.ready&&document.querySelector('.card'));
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.evaluate(()=>DB.demo),true);
      const glass=await page.locator('#top').evaluate(el=>{const s=getComputedStyle(el);return {blur:s.backdropFilter||s.webkitBackdropFilter,background:s.backgroundColor};});
      assert(glass.blur.includes('22px'),'Frosted header blur missing');assert(!['rgb(255, 255, 255)','rgba(255, 255, 255, 1)'].includes(glass.background),'Header is opaque');
      const density=await page.evaluate(()=>({columns:getComputedStyle(document.querySelector('.grid')).gridTemplateColumns.split(' ').length,cardWidth:document.querySelector('.card').getBoundingClientRect().width,cardTitle:getComputedStyle(document.querySelector('.card .nm')).fontSize}));
      if(width>=1440)assert.equal(density.columns,width===2560?7:width===1920?5:4);
      await page.screenshot({path:path.join(out,'grid-'+width+'.png'),fullPage:true});
      await page.locator('[data-view="index"]').click();await page.waitForSelector('table.idx');
      const indexUI=await page.evaluate(()=>({title:getComputedStyle(document.querySelector('.c-name')).fontSize,meta:getComputedStyle(document.querySelector('table.idx td')).fontSize,overflow:getComputedStyle(document.querySelector('.tablewrap')).overflowY,cells:[...document.querySelector('table.idx tbody tr').children].filter(el=>getComputedStyle(el).display!=='none').length}));
      assert.equal(indexUI.title,density.cardTitle);assert.equal(indexUI.cells,8);
      if(width<=390){assert.equal(indexUI.overflow,'visible');const y=await page.evaluate(()=>scrollY);await page.mouse.move(180,450);await page.mouse.wheel(0,400);await page.waitForTimeout(150);assert((await page.evaluate(()=>scrollY))>y);assert.equal(await page.locator('.tablewrap').evaluate(el=>el.scrollTop),0);}
      await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
      await page.screenshot({path:path.join(out,'index-'+width+'.png'),fullPage:true});
      await page.locator('[data-view="grid"]').click();
      for(const [hash,selector] of [['#/','.grid'],['#/project','.grid'],['#/project/2604','.pd-head'],['#/feed','.rows'],['#/news','.rows'],['#/blog','.feature'],['#/blog/why-black-and-white','.post-cover'],['#/about','.people'],['#/contact','.contact'],['#/admin','#lform']]){
        await page.evaluate(h=>location.hash=h,hash);await page.waitForSelector(selector);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width+' '+hash);
      }
      const dates=await page.evaluate(()=>['920128','19920128','199201','1992','2024.02.29','260112','200101'].map(s=>parseProjectDate(s).text));
      assert.deepEqual(dates,['1992.01.28','1992.01.28','1992.01','1992','2024.02.29','2026.01.12','2020.01.01']);
      assert(await page.evaluate(()=>{try{parseProjectDate('20230229');return false;}catch(e){return true;}}));
      const daySort=await page.evaluate(()=>{const old=DB.projects,oldPV={...PV};DB.projects=[{year:2026,month:1,date_start:'2026.01.28'},{year:2026,month:1,date_start:'2026.01.02'}];PV.sort='year';PV.dir=1;const result=filtered().map(p=>p.date_start);DB.projects=old;PV=oldPV;return result;});
      assert.deepEqual(daySort,['2026.01.02','2026.01.28']);
      for(const value of ['20260001','20260100','20261301','hello'])assert(await page.evaluate(s=>{try{parseProjectDate(s);return false;}catch(e){return true;}},value));
      const footer=await page.evaluate(()=>{DB.projects=[];PV.shown=BATCH;location.hash='#/';return true;});
      await page.waitForSelector('.pbar');await page.evaluate(()=>render());
      for(const count of [0,1]){
        await page.evaluate(n=>{DB.projects=SEED_PROJECTS.slice(0,n);render();},count);
        const box=await page.locator('footer').boundingBox();assert(box.y+box.height>=899,'Footer floated above viewport');
        assert(box.y>=0);
      }
      assert.equal(await page.locator('footer .ig').getAttribute('href'),'https://www.instagram.com/abyx.official/');
      await page.screenshot({path:path.join(out,'short-'+width+'.png'),fullPage:true});
      await page.evaluate(()=>{DB.projects=Array.from({length:72},(_,i)=>({...SEED_PROJECTS[i%SEED_PROJECTS.length],id:'test-'+i,code:'T'+i}));PV.shown=BATCH;PV.view='grid';window.scrollTo(0,0);render();});
      await page.waitForTimeout(150);
      const first=await page.locator('.card').count();assert(first<72);
      for(let i=0;i<2;i++){
        const before=await page.locator('.card').count();await page.locator('#more').scrollIntoViewIfNeeded();
        await page.waitForFunction(n=>document.querySelectorAll('.card').length>n,before);
      }
      assert((await page.locator('.card').count())<72,'All cards eagerly rendered');
      await page.waitForFunction(()=>!document.querySelector('#works-top').hidden);
      assert.equal(await page.locator('#works-top').evaluate(el=>el.parentElement.tagName),'BODY');
      const fixedBox=await page.locator('#works-top').boundingBox();
      for(const position of [0,450,900]){
        await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),position);
        await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
        const currentBox=await page.locator('#works-top').boundingBox();
        const footerBox=await page.locator('footer').boundingBox();
        assert(Math.abs(currentBox.x-fixedBox.x)<1,'Back-to-top should keep its right alignment');
        const expectedBottom=Math.min(880,footerBox.y-12);assert(Math.abs(currentBox.y+currentBox.height-expectedBottom)<2,'Back-to-top should stay fixed or clear the visible footer');
      }
      await page.locator('#works-top').click();await page.waitForFunction(()=>window.scrollY===0);
      assert(await page.locator('#works-top').isVisible());
      await page.evaluate(()=>{DB.projects=SEED_PROJECTS.map(p=>({...p}));location.hash='#/about';});
      await page.waitForSelector('.x-cloud-section');
      assert(!(await page.locator('#works-top').isVisible()));
      assert((await page.locator('.person').first().boundingBox()).width<=320);
      assert.equal(await page.locator('.x-cloud').count(),1);
      assert.equal(await page.locator('.x-cloud-section svg,.x-cloud-section img,.x-cloud-section image').count(),0);
      assert.equal(await page.locator('[data-x-pause]').count(),0);
      const geometry=await page.evaluate(()=>{
        const points=makeXCloudPoints(128),again=makeXCloudPoints(128);
        return {same:JSON.stringify(points)===JSON.stringify(again),valid:points.every(p=>p.forms.every(v=>[v.x,v.y,v.z].every(Number.isFinite)&&Math.hypot(v.x,v.y,v.z)<=1.351)),sizes:new Set(points.map(p=>p.size.toFixed(2))).size,phases:[0,4800,9600,14400,19200].map(t=>xCloudPhase(t).from)};
      });
      assert(geometry.same&&geometry.valid&&geometry.sizes>30);assert.deepEqual(geometry.phases,[0,1,2,3,0]);
      await page.locator('#x-cloud').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>document.querySelector('.x-field').dataset.motion==='static'&&+document.querySelector('#x-cloud').dataset.frame>0);
      const fieldBox=await page.locator('.x-field').boundingBox();assert(Math.abs(fieldBox.x+fieldBox.width/2-width/2)<1,'Cloud is not centered');
      assert(Math.abs(fieldBox.x)<1&&Math.abs(fieldBox.width-width)<1,'Black cloud area is not edge to edge');
      assert(fieldBox.height>=420,'Cloud area did not grow');
      assert.equal(await page.locator('.x-cloud-state').count(),0,'Shape captions must be absent');
      for(const side of ['left','right']){
        const label=await page.locator('.x-label-'+side).boundingBox();
        assert(label.x>=fieldBox.x&&label.x+label.width<=fieldBox.x+fieldBox.width&&label.y>=fieldBox.y&&label.y+label.height<=fieldBox.y+fieldBox.height,'White label is outside black area');
        assert.equal(await page.locator('.x-label-'+side).evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
      }
      assert.equal(await page.locator('.x-field').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');
      const canvas=page.locator('#x-cloud'),box=await canvas.boundingBox();
      await page.waitForTimeout(100);const still=await canvas.getAttribute('data-frame');await page.waitForTimeout(100);assert.equal(await canvas.getAttribute('data-frame'),still);
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);assert(+(await canvas.getAttribute('data-dispersal'))>0);
      await page.mouse.move(0,0);assert.equal(+(await canvas.getAttribute('data-dispersal')),0);
      if(width<=390){await canvas.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:1,clientX:box.x+box.width/2,clientY:box.y+box.height/2});assert(+(await canvas.getAttribute('data-dispersal'))>0);await canvas.dispatchEvent('pointerup',{pointerType:'touch',pointerId:1});assert.equal(+(await canvas.getAttribute('data-dispersal')),0);}
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.evaluate(()=>{const run=document.querySelector('.cloud-scroll-runway'),r=run.getBoundingClientRect(),head=document.querySelector('#top').offsetHeight;scrollTo(0,r.top+scrollY-head+(r.height-(innerHeight-head))*.8);});
      await page.waitForFunction(()=>document.querySelector('.x-field').dataset.motion==='running');
      const moving=await canvas.getAttribute('data-frame');await page.waitForTimeout(200);assert(+(await canvas.getAttribute('data-frame'))>+moving);
      if(width===2560)await page.locator('.x-field').screenshot({path:path.join(out,'cloud-sphere.png')});
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(700);
      const scattered=+(await canvas.getAttribute('data-dispersal'));assert(scattered>(width>390?65:30),'Hover scatter is too small');
      await canvas.click({position:{x:box.width/2,y:box.height/2}});await page.waitForTimeout(300);
      const clicked=+(await canvas.getAttribute('data-dispersal'));assert(clicked>scattered*1.15,'Click should scatter farther than hover');
      if(width===2560)await page.locator('.x-field').screenshot({path:path.join(out,'cloud-pointer.png')});
      if(width===1440)await page.locator('#top').screenshot({path:path.join(out,'glass-header-1440.png')});
      await page.mouse.move(0,0);await page.waitForTimeout(1000);
      const lingering=+(await canvas.getAttribute('data-dispersal'));assert(lingering>clicked*.2,'Pointer influence settled too quickly');
      await page.waitForTimeout(5000);const recovered=+(await canvas.getAttribute('data-dispersal'));assert(recovered<clicked*.25,'Cloud did not reassemble after the longer settle');
      if(width===2560)for(const [shape,name] of [[1,'tetrahedron'],[2,'cube'],[3,'octahedron']]){await page.waitForFunction(n=>document.querySelector('#x-cloud').dataset.shape===String(n),shape,{timeout:16000});await page.locator('.x-field').screenshot({path:path.join(out,'cloud-'+name+'.png')});}
      await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
      await page.waitForFunction(()=>document.querySelector('.x-field').dataset.motion==='idle');
      await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
      await page.screenshot({path:path.join(out,'about-'+width+'.png'),fullPage:true});
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.evaluate(()=>{location.hash='#/admin';});await page.waitForSelector('#lform');await page.locator('#lform button').click();
      await page.waitForSelector('[data-edit]');await page.locator('[data-edit]').first().click();
      await page.locator('[data-k="status"]').fill('CUSTOM REVIEW');
      assert((await page.locator('#dl-status option').count())>=8);
      await page.locator('[data-k="date_start_input"]').fill('920128');await page.locator('[data-k="date_end_input"]').fill('199402');
      assert.equal(await page.locator('[data-project-calendar="date_start_input"]').inputValue(),'1992-01-28');
      await page.locator('[data-pick-location]').click();await page.waitForSelector('.location-dialog[open]');
      await page.locator('.location-map').click({position:{x:80,y:100}});
      await page.screenshot({path:path.join(out,'map-'+width+'.png')});
      await page.locator('#map-label').fill('서울 성수동');await page.locator('[data-map-apply]').click();
      assert.equal(await page.locator('[data-k="loc"]').inputValue(),'서울 성수동');
      await page.locator('[data-act="save"]').click();
      const saved=await page.evaluate(()=>DB.projects.find(p=>p.code==='2604'));
      assert(Math.abs(saved.location_point.lat-37.5665)<1);assert(Math.abs(saved.location_point.lng-126.9780)<1,'Map projection longitude mismatch');
      assert.equal(saved.date_start,'1992.01.28');assert.equal(saved.date_end,'1994.02');assert.equal(saved.status,'CUSTOM REVIEW');assert.equal(saved.year,1992);assert.equal(saved.month,1);assert(Number.isFinite(saved.location_point.lat));assert(!('date_start_input' in saved));
      await page.evaluate(()=>{location.hash='#/project/2604';});await page.waitForSelector('.pd-head');assert((await page.locator('.specs').textContent()).includes('1992.01.28 — 1994.02'));
      await page.evaluate(()=>{DB.posts.push({id:'secret',slug:'secret',t:'HIDDEN TEST',d:'2099.01.01',body:[],pub:false});session=null;location.hash='#/feed';});await page.waitForSelector('.rows');assert(!(await page.locator('#app').textContent()).includes('HIDDEN TEST'));
      assert.equal(await page.locator('.feed-feature').count(),1);
      assert.equal(await page.locator('.feed-card').count(),await page.evaluate(()=>DB.news.length+livePosts().length-1));
      const newest=await page.evaluate(()=>DB.news.concat(livePosts()).sort((a,b)=>dnum(b.d)-dnum(a.d)||String(a.id).localeCompare(String(b.id)))[0].t);
      assert((await page.locator('.feed-feature .feed-title').textContent()).includes(newest));
      const heroBox=await page.locator('.feed-feature').boundingBox(),archiveBox=await page.locator('.feed-card').first().boundingBox();
      assert(heroBox.width>archiveBox.width*1.5);assert(heroBox.y+heroBox.height<=archiveBox.y);
      if(width<=390)assert.equal(await page.locator('.feed-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2);
      if(width>=1440)assert(heroBox.height<=650,'Latest feature is too tall on desktop');
      await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('on'));
      await page.locator('.feed img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode().catch(()=>{});}))); // Warm lazy images for the full-page capture only.
      await page.screenshot({path:path.join(out,'feed-'+width+'.png'),fullPage:true});
      if(width===1440){
        const edgeCases=await page.evaluate(()=>{
          const news=DB.news,posts=DB.posts;
          try{
            DB.posts=[];DB.news=[];const empty=viewFeed();
            DB.news=[{id:'test',t:'<script>unsafe</script>',d:'2099.01.01',url:'javascript:alert(1)'}];const single=viewFeed();
            DB.news[0].url='https://example.com/article';const external=viewFeed();
            DB.news=[];DB.posts=[{id:'post',slug:'encoded slug',t:'Post',d:'2099.01.01',body:[],pub:null}];const post=viewFeed();
            return {empty:empty.includes('등록된 피드가 없습니다.'),single:!single.includes('feed-archive')&&single.includes('&lt;script&gt;unsafe&lt;/script&gt;')&&!single.includes('href="javascript:'),external:external.includes('target="_blank" rel="noopener"'),post:post.includes('href="#/blog/encoded%20slug"')};
          }finally{DB.news=news;DB.posts=posts;}
        });
        assert(Object.values(edgeCases).every(Boolean),'Feed empty/single/link compatibility failed');
      }
      if(width===1440){
        const compatibility=await page.evaluate(async()=>{
          let payload;const client={from:()=>({upsert:p=>{payload=p;return{select:async()=>({error:null})};}})};
          sb=client;const oldRefresh=DB.refresh;DB.refresh=async()=>{};DB.cols.projectDates=false;DB.cols.projectPoint=false;
          try{await DB.save('projects',{code:'old',year:2026,month:1,date_start:'2026.01',date_end:null,location_point:null});return payload;}finally{sb=null;DB.refresh=oldRefresh;DB.cols.projectDates=true;DB.cols.projectPoint=true;}
        });
        assert(!('date_start' in compatibility));assert(!('date_end' in compatibility));assert(!('location_point' in compatibility));assert.equal(compatibility.year,2026);
      }
      results.push({width,routes:10,columns:density.columns,cardWidth:density.cardWidth,titleSize:density.cardTitle,indexMeta:indexUI.meta,footer:true,infinite:true,backToTop:'fixed viewport position with footer clearance',dateRange:true,status:true,mapSelection:'mock tiles',about:'full bleed, white overlays, 4.8s morph, stronger hover and click, recovery, reduced motion',header:glass,mobileScroll:width<=390?'single viewport scroll verified':'desktop',feed:'latest feature and compact archive, publication and links preserved'});await page.close();
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({testedAt:new Date().toISOString(),results,errors,limitations:'Demo memory only; map tiles mocked; no remote writes or schema execution.'},null,2)+'\n');
    console.log(JSON.stringify({passed:results.length,results,errors}));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
