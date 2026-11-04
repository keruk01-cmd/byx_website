// Read-only verification of the deployed artifact; never sends credentials or writes CMS data.
const https=require('node:https');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const base=process.argv[2]||'https://byx-website.vercel.app';
const normalize=text=>text.replace(/\r\n/g,'\n');
const hash=text=>crypto.createHash('sha256').update(normalize(text)).digest('hex');
function get(url,redirects=0){
  return new Promise((resolve,reject)=>{
    const request=https.get(url,{headers:{'Cache-Control':'no-cache','User-Agent':'BYX-deployment-verification'}},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location&&redirects<3){
        res.resume();return get(new URL(res.headers.location,url),redirects+1).then(resolve,reject);
      }
      const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({url:String(url),status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString('utf8')}));
    });
    request.setTimeout(20000,()=>request.destroy(Error('Deployment request timeout')));request.on('error',reject);
  });
}
async function main(){
  const expected=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const results=[];
  for(const route of ['/','/index.html','/admin','/admin/','/guidelines','/guidelines/buttons']){
    const response=await get(new URL(route,base));
    assert.equal(response.status,200,route+' HTTP status');
    assert.equal(hash(response.body),hash(expected),route+' must serve the current committed index.html');
    if(route.startsWith('/guidelines'))assert.match(response.headers['x-robots-tag']||'',/noindex/);
    results.push({route,status:response.status,htmlMatches:true});
  }
  const api=await get(new URL('/api/guidelines',base));assert.equal(api.status,200);
  const data=JSON.parse(api.body);assert.equal(data.articles.length,26);assert.equal(data.access,'url');
  const result={testedAt:new Date().toISOString(),base,sha256:hash(expected),results,api:{status:api.status,articles:data.articles.length,access:data.access},limitations:'Read-only HTTP artifact/routing verification; no administrator login or production file upload.'};
  fs.writeFileSync(path.join(__dirname,'artifacts/deployment-results.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
