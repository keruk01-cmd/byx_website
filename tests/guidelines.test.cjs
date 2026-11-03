const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const handler=require('../api/guidelines.js');
const originalFetch=global.fetch;
const originalUrl=process.env.SUPABASE_URL, originalKey=process.env.SUPABASE_PUBLISHABLE_KEY;
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY='publishable-test';
after(()=>{global.fetch=originalFetch;if(originalUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=originalUrl;if(originalKey===undefined)delete process.env.SUPABASE_PUBLISHABLE_KEY;else process.env.SUPABASE_PUBLISHABLE_KEY=originalKey;});
const user=(extra={})=>({id:'user-1',email_confirmed_at:'2026-01-01',is_anonymous:false,app_metadata:{byx_guidelines_role:'viewer'},...extra});
const upstream=(body,status=200)=>{global.fetch=async(url,options)=>{assert.equal(url,'https://example.supabase.co/auth/v1/user');assert.equal(options.headers.Authorization,'Bearer test-token');assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');return {ok:status===200,status,json:async()=>body};};};
async function request(headers={authorization:'Bearer test-token'},method='GET'){
  const result={headers:{}};
  await handler({headers,method},{setHeader:(key,value)=>result.headers[key]=value,status(code){result.status=code;return this;},json(body){result.body=body;return this;}});
  assert.match(result.headers['Cache-Control'],/no-store/);
  assert.equal(result.headers['Vercel-CDN-Cache-Control'],'no-store');
  if(result.status!==200){assert.equal(result.body.articles,undefined);assert.equal(result.body.tokens,undefined);}
  return result;
}
test('anonymous and malformed credentials never call auth or disclose docs',async()=>{
  global.fetch=()=>{throw Error('Must not call upstream');};
  for(const headers of [{},{authorization:'Bearer '},{authorization:'Basic test'},{authorization:'Bearer bad token'}])assert.equal((await request(headers)).status,401);
});
test('only GET is allowed',async()=>assert.equal((await request({},'POST')).status,405));
test('missing/unsafe server config fails closed',async()=>{
  const saved=process.env.SUPABASE_URL;
  for(const value of ['', 'http://localhost:1234', 'https://example.supabase.co@evil.test']){
    process.env.SUPABASE_URL=value;assert.equal((await request()).status,503);
  }
  process.env.SUPABASE_URL=saved;
});
test('expired token and auth outage disclose no document data',async()=>{
  for(const status of [401,403,429,500]){upstream({},status);assert.equal((await request()).status,status===401||status===403?401:503);}
  global.fetch=async()=>{throw new Error('Network unavailable');};assert.equal((await request()).status,503);
});
test('login alone, anonymous auth and editable metadata cannot grant access',async()=>{
  for(const body of [user({app_metadata:{}}), user({app_metadata:{byx_guidelines_role:'owner'}}),user({is_anonymous:true}),user({email_confirmed_at:null}),user({id:null}),user({app_metadata:{},user_metadata:{byx_guidelines_role:'admin'}})]){
    upstream(body);assert.equal((await request()).status,403);
  }
});
test('all three approved roles receive complete draft handbook',async()=>{
  for(const role of ['viewer','editor','admin']){
    upstream(user({app_metadata:{byx_guidelines_role:role}}));const r=await request();assert.equal(r.status,200);assert.equal(r.body.role,role);
    const {articles,tokens}=r.body;assert.equal(articles.length,26);assert.equal(new Set(articles.map(a=>a.id)).size,articles.length);
    assert.equal(tokens.status,'draft');assert.equal(tokens.font.display,'Anton');assert.equal(tokens.font.body,'Wanted Sans');
    for(const a of articles){assert.equal(a.status,'draft');assert.ok(a.specs.length>=3);assert.ok(a.good&&a.bad&&a.html&&a.css&&a.demo);}
    for(const group of ['Foundations','Materials','Components','Applications','Architecture'])assert.ok(articles.some(a=>a.group===group));
  }
});
test('role revocation is checked on every request',async()=>{
  upstream(user());assert.equal((await request()).status,200);upstream(user({app_metadata:{}}));assert.equal((await request()).status,403);
});
test('all inline JavaScript parses and sensitive article payload stays out of HTML',()=>{
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  scripts.forEach((match,index)=>new vm.Script(match[1],{filename:'index-inline-'+index+'.js'}));
  assert.ok(scripts.length>=2);assert.ok(!html.includes('0.13 / 0.18 / 0.25 / 0.35 / 0.50mm'));
  assert.ok(html.includes('gdClear()'));assert.ok(html.includes('Wanted Sans official'));
});
test('documented accent contrast and CSS match token values',async()=>{
  upstream(user());const {tokens}= (await request()).body;
  const rgb=tokens.color.accent.slice(1).match(/../g).map(hex=>parseInt(hex,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  const contrast=1.05/(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]+.05);
  assert.ok(contrast>=4.5);assert.ok(Math.abs(contrast-4.90)<.01);
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  assert.ok(html.includes('--gd-accent:'+tokens.color.accent.toLowerCase()));
});
