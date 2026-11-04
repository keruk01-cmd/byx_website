// Non-writing production checks. No valid inquiry is submitted.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
async function main(){
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),object=html.match(/window\.BYX_CONFIG\s*=\s*(\{[\s\S]*?\});/)[1];
 const cfg=vm.runInNewContext('('+object+')'),origin='https://byx-website.vercel.app',endpoint=cfg.url+'/functions/v1/contact-inquiry';
 const headers={origin,apikey:cfg.key,'content-type':'application/json'};
 const options=await fetch(endpoint,{method:'OPTIONS',headers});assert.equal(options.status,204);
 const invalid=await fetch(endpoint,{method:'POST',headers,body:'{}'});assert.equal(invalid.status,400);
 const forbidden=await fetch(endpoint,{method:'POST',headers:{...headers,origin:'https://invalid.example'},body:'{}'});assert.equal(forbidden.status,403);
 const table=await fetch(cfg.url+'/rest/v1/contact_requests?select=id&limit=0',{headers:{apikey:cfg.key,Authorization:'Bearer '+cfg.key}});assert([401,403].includes(table.status));
 const result={testedAt:new Date().toISOString(),options:options.status,invalidSubmission:invalid.status,foreignOrigin:forbidden.status,anonymousInbox:table.status,validInquirySubmitted:false};
 fs.writeFileSync(path.join(__dirname,'artifacts/inquiry-live-checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
