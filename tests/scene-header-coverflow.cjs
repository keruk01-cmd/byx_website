const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.BYX_PLAYWRIGHT_MODULE||'playwright'),sharp=require(process.env.BYX_SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'artifacts');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(source);});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],results=[];
 try{const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [1440,390,320]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/#/about');await page.waitForSelector('#byx-function');await page.evaluate(()=>document.fonts.ready);
  const scenes=[];
  for(const[selector,canvas]of[['.cloud-scroll-runway','#x-cloud'],['.journey-scroll','#byx-journey'],['.function-layout','#byx-function']]){
   await page.locator(selector).evaluate(el=>{const b=el.getBoundingClientRect(),h=document.querySelector('#top').offsetHeight,c=el.querySelector('#byx-function'),extra=c?Math.max(0,c.getBoundingClientRect().height-innerHeight+h)*.5:0;scrollTo(0,b.top+scrollY-h+(b.height-innerHeight+h-extra)*.94);});await page.waitForTimeout(220);
   const scene=await page.locator(canvas).evaluate(c=>{const surface=c.id==='x-cloud'?c.parentElement:c.parentElement.parentElement,box=c.getBoundingClientRect(),s=getComputedStyle(surface);return{id:c.id,canvasMask:getComputedStyle(c).maskImage,surfaceMask:s.maskImage,overlay:getComputedStyle(surface,'::after').content,edgeTop:box.top+parseFloat(s.getPropertyValue('--scene-fade-top')),edgeBottom:box.bottom-parseFloat(s.getPropertyValue('--scene-fade-bottom')),head:document.querySelector('#top').offsetHeight};});assert(scene.canvasMask.includes('linear-gradient'));assert.equal(scene.surfaceMask,'none');assert.equal(scene.overlay,'none');assert(Math.abs(scene.edgeTop-scene.head)<1.5);assert(Math.abs(scene.edgeBottom-900)<1.5);scenes.push(scene);await page.screenshot({path:path.join(out,'scene-edges-'+canvas.slice(1)+'-'+width+'.png')});
  }
  if(width===1440){
   // Freeze the live renderer, then put a bright test grid in its real canvas under the glass.
   await page.locator('.journey-scroll').evaluate(el=>{const b=el.getBoundingClientRect(),h=document.querySelector('#top').offsetHeight;scrollTo(0,b.top+scrollY-h+(b.height-innerHeight+h)*.94);});await page.waitForTimeout(150);await page.evaluate(()=>{window.requestAnimationFrame=()=>0;document.getAnimations().forEach(a=>a.pause());});await page.waitForTimeout(100);
   await page.locator('#byx-journey').evaluate(c=>{const x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);});const before=await page.locator('#top').screenshot();
   await page.locator('#byx-journey').evaluate(c=>{const x=c.getContext('2d');x.fillStyle='#fff';for(let col=0;col<c.width;col+=32)x.fillRect(col,0,16,c.height);});const after=await page.locator('#top').screenshot();
   const region={left:600,top:10,width:280,height:50},a=await sharp(before).extract(region).removeAlpha().raw().toBuffer(),b=await sharp(after).extract(region).removeAlpha().raw().toBuffer();let difference=0;for(let i=0;i<a.length;i++)difference+=Math.abs(a[i]-b[i]);difference/=a.length;assert(difference>35,'The real scene canvas must remain visible behind header glass: '+difference);await page.screenshot({path:path.join(out,'scene-through-header-proof.png')});results.push({headerCanvasDifference:difference});
   await page.close();
  }else await page.close();
  // Seven-image layout and removal of gallery controls are covered by coverflow-seven.cjs.
  results.push({width,scenes});
 }
 assert.deepEqual(errors,[]);const result={testedAt:new Date().toISOString(),results,errors,limitations:'Isolated Chrome; synthetic canvas/legacy-layout fixtures. No production writes or physical-device/Safari/Firefox verification.'};fs.writeFileSync(path.join(out,'scene-header-coverflow-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
