const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
let configured=true;
global.Deno={env:{get:key=>configured?({SUPABASE_URL:'https://byx.example',SUPABASE_SERVICE_ROLE_KEY:'server-only-test-key'}[key]):undefined},serve:()=>{}};
const modulePromise=import(pathToFileURL(path.join(__dirname,'../supabase/functions/contact-inquiry/index.ts')).href);
const input={subject:'새로운 공간 프로젝트',email:'visitor@example.com',phone:'010-1234-5678',body:'프로젝트에 대해 함께 이야기하고 싶습니다.',consent:true,website:''};
const req=(body=input,extra={})=>new Request('https://edge.example/contact-inquiry',{method:'POST',headers:{origin:'https://byx-website.vercel.app','content-type':'application/json',...extra},body:JSON.stringify(body)});
test('valid request uses a server-only RPC, hashes client address and returns no personal data',async()=>{
 const {handler}=await modulePromise,old=global.fetch;let captured;
 global.fetch=async(url,options)=>{captured={url,options};return new Response(JSON.stringify('11111111-1111-4111-8111-111111111111'),{status:200});};
 try{const res=await handler(req(input,{'x-forwarded-for':'192.0.2.1'}));assert.equal(res.status,201);const value=await res.json();assert.equal(value.accepted,true);assert.equal(value.email,undefined);assert.equal(captured.url,'https://byx.example/rest/v1/rpc/submit_contact_request');assert.equal(captured.options.headers.apikey,'server-only-test-key');const data=JSON.parse(captured.options.body);assert.match(data.p_client_hash,/^[a-f0-9]{64}$/);assert(!JSON.stringify(data).includes('192.0.2.1'));}finally{global.fetch=old;}
});
test('origin, preflight, method, body types, size and required fields are bounded',async()=>{
 const {handler}=await modulePromise;
 assert.equal((await handler(req(input,{origin:'https://evil.example'}))).status,403);
 const options=await handler(new Request('https://edge.example',{method:'OPTIONS',headers:{origin:'https://byx-website.vercel.app'}}));assert.equal(options.status,204);assert.equal(await options.text(),'');
 assert.equal((await handler(new Request('https://edge.example',{headers:{origin:'https://byx-website.vercel.app'}}))).status,405);
 for(const body of [null,[],{...input,consent:false},{...input,email:'bad'},{...input,subject:'a'},{...input,website:'spam'}])assert.equal((await handler(req(body))).status,400);
 assert.equal((await handler(req({...input,body:'x'.repeat(40000)}))).status,413);
});
test('rate limit and database failures are sanitized without accepting the inquiry',async()=>{
 const {handler}=await modulePromise,old=global.fetch;
 try{
  global.fetch=async()=>new Response(JSON.stringify({message:'RATE_LIMITED'}),{status:400});const limited=await handler(req());assert.equal(limited.status,429);assert.equal((await limited.json()).accepted,undefined);
  global.fetch=async()=>new Response(JSON.stringify({message:'private database detail'}),{status:500});const failed=await handler(req());assert.equal(failed.status,503);assert(!(await failed.text()).includes('private database detail'));
  configured=false;const missing=await handler(req());assert.equal(missing.status,503);
 }finally{configured=true;global.fetch=old;}
});
