const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.BYX_PLAYWRIGHT_MODULE || 'playwright');
const sharp = require(process.env.BYX_SHARP_MODULE || 'sharp');
const guidelines = require('../api/guidelines.js');
const root = path.resolve(__dirname,'..'), out = path.join(__dirname,'artifacts');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8')
  .replace(/window\.BYX_CONFIG\s*=\s*\{[\s\S]*?\};/,"window.BYX_CONFIG={url:'',key:'',bucket:'media'};")
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,'');
const server = http.createServer((req,res)=>{
  if(req.url.startsWith('/api/guidelines')){
    res.status = code=>{res.statusCode=code;return res;};
    res.json = data=>res.end(JSON.stringify(data));
    return guidelines(req,res);
  }
  res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);
});
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin = 'http://127.0.0.1:'+server.address().port;
  const browser = await chromium.launch({headless:true,executablePath:process.env.BYX_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const errors=[], headers=[];
  try{
    for(const width of [1440,390,320]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(origin+'/#/about');await page.waitForSelector('.x-cloud-section');
      await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='dark');
      await page.evaluate(()=>location.hash='#/contact');await page.waitForSelector('.contact');
      await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='light');
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('#top')).color==='rgb(0, 0, 0)');
      const light=await page.locator('#top').evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
      assert.equal(light.color,'rgb(0, 0, 0)');
      await page.screenshot({path:path.join(out,'adaptive-header-light-'+width+'.png')});
      await page.evaluate(()=>location.hash='#/about');await page.waitForSelector('.x-cloud-section');
      await page.evaluate(()=>scrollTo(0,document.querySelector('.x-cloud-section').getBoundingClientRect().top+scrollY+100));
      await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='dark');
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('#top')).color==='rgb(255, 255, 255)');
      const dark=await page.locator('#top').evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el).backdropFilter,rule:getComputedStyle(document.querySelector('#rule')).backgroundColor,pill:getComputedStyle(document.querySelector('#nav-pill')).backgroundColor,pillText:getComputedStyle(document.querySelector('#nav a.on')).color}));
      assert.equal(dark.color,'rgb(255, 255, 255)','header '+width);assert.equal(dark.rule,dark.color,'slot rule '+width);assert.match(dark.pill,/0\.12|12%/,'translucent navigation pill '+width);if(width>880)assert.equal(dark.pillText,dark.color);assert.match(dark.blur,/22px/);
      await page.screenshot({path:path.join(out,'adaptive-header-dark-'+width+'.png')});
      const cdp=await page.context().newCDPSession(page);
      await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
      assert.equal(await page.locator('#top').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('#top')).backgroundColor==='rgb(0, 0, 0)');
      assert.equal(await page.locator('#top').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');
      await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      if(width<500){
        await page.locator('#burger').click();await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='light');
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('#top')).color==='rgb(0, 0, 0)');
        assert.equal(await page.locator('#burger i').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');
        await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='dark');
      }
      await page.evaluate(()=>location.hash='#/contact');await page.waitForSelector('.contact');
      await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='light');
      // A dark photograph over a white surface must also invert the header.
      await page.evaluate(async()=>{
        const cv=document.createElement('canvas');cv.width=100;cv.height=100;
        const cx=cv.getContext('2d');cx.fillStyle='#050505';cx.fillRect(0,0,100,100);
        app.innerHTML='<div style="height:1500px;background:white"><img id="dark-photo" style="display:block;width:100%;height:1000px;object-fit:cover" alt="Dark photograph fixture"></div>';
        const image=document.querySelector('#dark-photo');image.src=cv.toDataURL();await image.decode();scrollTo(0,200);
      });
      await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='dark');
      await page.evaluate(()=>{document.querySelector('#dark-photo').remove();scheduleHeaderTone();});
      await page.waitForFunction(()=>document.querySelector('#top').dataset.tone==='light');
      await page.goto(origin+'/guidelines/buttons');await page.waitForSelector('.gd-main');
      assert.equal(await page.locator('#top').isVisible(),false);assert.match(await page.title(),/GUIDELINES/);
      headers.push({width,light,dark,menu:true,photograph:true,reducedTransparency:true,guidelines:true});
      await page.close();
    }
    const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin);await page.waitForFunction(()=>DB.ready);
    const artwork=Buffer.from('<svg width="4000" height="2600" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop stop-color="#bbb"/><stop offset="1" stop-color="#223"/></linearGradient></defs><rect width="4000" height="2600" fill="url(#g)"/>'+Array.from({length:80},(_,i)=>'<path d="M'+i*50+' 0V2600M0 '+i*40+'H4000" stroke="white" stroke-width="3"/>').join('')+'</svg>');
    const fixtures=[];
    for(const format of ['jpeg','png','webp','avif']){
      const image=sharp(artwork);if(format==='avif')image.resize(800);
      const buffer=await image[format]({quality:95}).toBuffer();
      fixtures.push({name:'architecture.'+format,type:'image/'+format,base64:buffer.toString('base64')});
    }
    const images=await page.evaluate(async fixtures=>{
      const results=[];
      for(const fixture of fixtures){
        const bytes=Uint8Array.from(atob(fixture.base64),c=>c.charCodeAt(0));
        const original=new File([bytes],fixture.name,{type:fixture.type}),converted=await shrink(original);
        const bitmap=await createImageBitmap(converted);
        results.push({name:fixture.name,input:original.size,output:converted.size,type:converted.type,width:bitmap.width,height:bitmap.height,idempotent:(await shrink(converted))===converted});bitmap.close();
      }
      const png=Uint8Array.from(atob(fixtures[1].base64),c=>c.charCodeAt(0));
      const missingMime=await shrink(new File([png],'ARCHITECTURE.PNG'));
      const nativeBitmap=window.createImageBitmap;window.createImageBitmap=async()=>{throw Error('Bitmap decoder unavailable');};
      let fallback;try{fallback=await shrink(new File([png],'fallback.png',{type:'image/png'}));}finally{window.createImageBitmap=nativeBitmap;}
      const previousWebp=webpOK;webpOK=false;let jpeg;try{jpeg=await shrink(new File([png,new Uint8Array(2*1024*1024)],'fallback.png',{type:'image/png'}));}finally{webpOK=previousWebp;}
      const gif=new File([new Uint8Array([71,73,70])],'animation.gif',{type:'image/gif'}),svg=new File(['<svg/>'],'drawing.svg',{type:'image/svg+xml'}),broken=new File(['broken'],'broken.png',{type:'image/png'});
      return {results,missingMime:missingMime.type,decoderFallback:fallback.type,jpegFallback:{type:jpeg.type,name:jpeg.name},gifUnchanged:await shrink(gif)===gif,svgUnchanged:await shrink(svg)===svg,decodeFailureUnchanged:await shrink(broken)===broken};
    },fixtures);
    for(const image of images.results){assert(image.output<=image.input);assert(image.idempotent);if(image.name!=='architecture.avif')assert(Math.max(image.width,image.height)<=2560);}
    assert.equal(images.results[0].type,'image/webp');assert.equal(images.results[1].type,'image/webp');
    assert.equal(images.missingMime,'image/webp');assert.equal(images.decoderFallback,'image/webp');assert.equal(images.jpegFallback.type,'image/jpeg');assert.match(images.jpegFallback.name,/\.jpg$/);
    assert(images.gifUnchanged&&images.svgUnchanged&&images.decodeFailureUnchanged);
    const upload=await page.evaluate(async()=>{
      const cv=document.createElement('canvas');cv.width=cv.height=100;
      const blob=await new Promise(r=>cv.toBlob(r,'image/png'));const file=new File([blob],'test.png',{type:'image/png'});
      let uploaded,authCalls=0,storageCalls=0;
      const store={upload:async(path,file,options)=>{storageCalls++;uploaded={path,type:file.type,options};return{error:null};},getPublicUrl:path=>({data:{publicUrl:'https://example.test/'+path}})};
      sb={auth:{getSession:async()=>{authCalls++;return{data:{session:{user:{id:'test-admin'}}},error:null};}},storage:{from:bucket=>{if(bucket!=='media')throw Error('Wrong bucket');return store;}}};
      try{
        const url=await DB.upload(file);
        sb.auth.getSession=async()=>({data:{session:null},error:null});let expired;
        try{await DB.upload(file);}catch(e){expired=e.message;}
        sb.auth.getSession=async()=>({data:{session:{user:{id:'test-admin'}}},error:null});store.upload=async()=>({error:{message:'new row violates row-level security policy'}});let denied;
        try{await DB.upload(file);}catch(e){denied=e.message;}
        return {uploaded,url,authCalls,storageCalls,expired,denied};
      }finally{sb=null;}
    });
    assert.equal(upload.storageCalls,1);assert.equal(upload.uploaded.options.upsert,false);assert.equal(upload.uploaded.options.contentType,upload.uploaded.type);assert.match(upload.expired,/로그인/);assert.match(upload.denied,/이미지 저장소/);
    await page.close();assert.deepEqual(errors,[]);
    const result={testedAt:new Date().toISOString(),headers,images,upload,errors,limitations:'Local isolated demo and mocked Storage API; production authorization checked separately with rolled-back SQL probes. No end-to-end upload using a real administrator browser session.'};
    fs.writeFileSync(path.join(out,'header-upload-results.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result));
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
