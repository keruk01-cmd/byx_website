// Anonymous read-only probes; never uses a real administrator password or creates an identity.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
async function main(){
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),cfg=vm.runInNewContext('('+html.match(/window\.BYX_CONFIG\s*=\s*(\{[\s\S]*?\});/)[1]+')'),origin='https://byx-website.vercel.app',url=cfg.url+'/functions/v1/admin-accounts',headers={origin,apikey:cfg.key,'content-type':'application/json'};
 const options=await fetch(url,{method:'OPTIONS',headers});assert([200,204].includes(options.status));
 const missing=await fetch(url,{method:'POST',headers,body:'{"action":"list"}'});assert.equal(missing.status,401);
 const anonymous=await fetch(url,{method:'POST',headers:{...headers,Authorization:'Bearer '+cfg.key},body:'{"action":"list"}'});assert.equal(anonymous.status,401);
 const forged=await fetch(url,{method:'POST',headers:{...headers,Authorization:'Bearer invalid-token'},body:'{"action":"list","role":"owner"}'});assert.equal(forged.status,401);
 const auth={apikey:cfg.key,Authorization:'Bearer '+cfg.key,'content-type':'application/json'};
 const context=await fetch(cfg.url+'/rest/v1/rpc/cms_admin_context',{method:'POST',headers:auth,body:'{}'});assert([401,403].includes(context.status));
 const members=await fetch(cfg.url+'/rest/v1/cms_members?select=user_id&limit=0',{headers:auth});assert([401,403].includes(members.status));
 const projects=await fetch(cfg.url+'/rest/v1/projects?select=id&limit=0',{headers:auth});assert.equal(projects.status,200);
 const drafts=await fetch(cfg.url+'/rest/v1/posts?select=id&pub=eq.false&limit=1',{headers:auth});assert.equal(drafts.status,200);assert.deepEqual(await drafts.json(),[]);
 const result={testedAt:new Date().toISOString(),preflight:options.status,missingToken:missing.status,anonymousToken:anonymous.status,forgedToken:forged.status,anonymousContext:context.status,anonymousMemberTable:members.status,publicProjects:projects.status,anonymousDraftsVisible:false,productionWrites:false};fs.writeFileSync(path.join(__dirname,'artifacts/cms-live-checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}main().catch(error=>{console.error(error.message);process.exitCode=1;});
