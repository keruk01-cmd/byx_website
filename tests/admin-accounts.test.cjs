const{test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const{pathToFileURL}=require('node:url');
global.Deno={env:{get:key=>({SUPABASE_URL:'https://byx.example',SUPABASE_SERVICE_ROLE_KEY:'test-server-secret'}[key])},serve:()=>{}};
const modulePromise=import(pathToFileURL(path.join(__dirname,'../supabase/functions/admin-accounts/index.ts')).href);
const owner='11111111-1111-4111-8111-111111111111',editor='22222222-2222-4222-8222-222222222222',target='33333333-3333-4333-8333-333333333333';
const makeRequest=(body,headers={})=>new Request('https://edge.example/admin-accounts',{method:'POST',headers:{origin:'https://byx-website.vercel.app',authorization:'Bearer user-jwt','content-type':'application/json',...headers},body:JSON.stringify(body)});
async function fake(options,fn){
 const old=global.fetch,calls=[],actor=options.actor||owner;
 const member=id=>({user_id:id,email:id===owner?'owner@example.invalid':'editor@example.invalid',role:id===owner?'owner':'editor',permissions:id===owner?['projects','feed','about','contact','inquiries']:['feed'],active:options.active!==false,must_change_password:!!options.temporary});
 global.fetch=async(url,init={})=>{
  calls.push({url,init});const body=init.body?JSON.parse(init.body):null;
  const result=(value,status=200)=>new Response(JSON.stringify(value),{status});
  if(url.endsWith('/auth/v1/user'))return options.invalid?result({},401):result({id:actor});
  if(url.includes('/rest/v1/cms_members?user_id='))return result([member(url.includes(actor)?actor:target)]);
  if(url.includes('/rest/v1/cms_members?email='))return result(options.existing?[member(target)]:[]);
  if(url.includes('/rest/v1/cms_members?'))return result([member(owner)]);
  if(url.endsWith('/auth/v1/admin/users')&&init.method==='POST')return result({id:target,email:body.email});
  if(url.includes('/auth/v1/admin/users/'))return result({id:target});
  if(url.endsWith('/rpc/cms_manage_member'))return options.rpcError?result({message:options.rpcError},400):result({user_id:target,role:body.p_role,permissions:body.p_permissions,active:body.p_active,must_change_password:body.p_require_password});
  if(url.endsWith('/rpc/cms_password_changed'))return result(null);
  throw Error('Unexpected test request: '+url);
 };
 try{return await fn((await modulePromise).handler,calls);}finally{global.fetch=old;}
}
test('requires the allowed origin, a real Auth session and an active owner',async()=>{
 await fake({},async(handler,calls)=>{assert.equal((await handler(makeRequest({action:'list'},{origin:'https://evil.example'}))).status,403);assert.equal((await handler(makeRequest({action:'list'},{authorization:''}))).status,401);assert.equal(calls.length,0);});
 await fake({invalid:true},async handler=>assert.equal((await handler(makeRequest({action:'list'}))).status,401));
 await fake({active:false},async handler=>assert.equal((await handler(makeRequest({action:'list'}))).status,403));
 await fake({actor:editor},async(handler,calls)=>{assert.equal((await handler(makeRequest({action:'list',actor:owner,role:'owner'}))).status,403);assert.equal(calls.filter(c=>c.url.endsWith('/admin/users')).length,0);});
});
test('creates a temporary account with server-only credentials and a verified actor',async()=>{
 await fake({},async(handler,calls)=>{const response=await handler(makeRequest({action:'create',email:'new@example.invalid',password:'Temporary-password-123',role:'editor',permissions:['feed'],actor:editor}));assert.equal(response.status,201);const data=await response.json();assert(data.member.must_change_password);assert(!JSON.stringify(data).includes('Temporary-password'));assert(!JSON.stringify(data).includes('test-server-secret'));const auth=calls.find(c=>c.url.endsWith('/auth/v1/admin/users'));assert.equal(auth.init.headers.Authorization,'Bearer test-server-secret');assert.equal(JSON.parse(auth.init.body).email_confirm,true);const rpc=calls.find(c=>c.url.endsWith('/rpc/cms_manage_member'));assert.equal(JSON.parse(rpc.init.body).p_actor,owner);assert.equal(JSON.parse(rpc.init.body).p_require_password,true);});
});
test('validates capabilities/passwords and never modifies the caller account',async()=>{
 await fake({},async(handler,calls)=>{for(const payload of[{role:'root',permissions:['feed']},{role:'editor',permissions:['accounts']},{role:'editor',permissions:[]},{role:'editor',permissions:['feed'],password:'short'}])assert.equal((await handler(makeRequest({action:'create',email:'new@example.invalid',password:'Temporary-password-123',...payload}))).status,400);assert.equal((await handler(makeRequest({action:'revoke',user_id:owner}))).status,409);assert.equal(calls.filter(c=>c.url.endsWith('/auth/v1/admin/users')).length,0);});
});
test('revocation preserves Auth identity, media and content while removing membership access',async()=>{
 await fake({},async(handler,calls)=>{const response=await handler(makeRequest({action:'revoke',user_id:target}));assert.equal(response.status,200);assert.equal((await response.json()).member.active,false);assert(!calls.some(c=>c.init.method==='DELETE'));assert(!calls.some(c=>c.url.includes('/storage/')));const rpc=calls.find(c=>c.url.endsWith('/rpc/cms_manage_member'));assert.equal(JSON.parse(rpc.init.body).p_active,false);});
});
test('first-login password completion is self-only and does not grant account management',async()=>{
 await fake({actor:editor,temporary:true},async(handler,calls)=>{assert.equal((await handler(makeRequest({action:'list'}))).status,403);const response=await handler(makeRequest({action:'change_password',password:'My-private-password-123',user_id:owner}));assert.equal(response.status,200);assert(calls.some(c=>c.url.endsWith('/auth/v1/admin/users/'+editor)&&c.init.method==='PUT'));assert.equal(JSON.parse(calls.find(c=>c.url.endsWith('/rpc/cms_password_changed')).init.body).p_user,editor);assert(!JSON.stringify(await response.json()).includes('password'));});
});
test('failed creation cleans up only its own new identity; database details remain private',async()=>{
 await fake({rpcError:'private database details'},async(handler,calls)=>{const response=await handler(makeRequest({action:'create',email:'new@example.invalid',password:'Temporary-password-123',role:'editor',permissions:['feed']}));assert.equal(response.status,503);assert(!JSON.stringify(await response.json()).includes('private database'));const deleted=calls.filter(c=>c.init.method==='DELETE');assert.equal(deleted.length,1);assert(deleted[0].url.endsWith('/auth/v1/admin/users/'+target));});
 await fake({rpcError:'LAST_OWNER_REQUIRED'},async handler=>assert.equal((await handler(makeRequest({action:'revoke',user_id:target}))).status,403));
});
