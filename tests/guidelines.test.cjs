const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const handler=require('../api/guidelines.js');
async function request(headers={},method='GET'){
  const result={headers:{}};
  await handler({headers,method},{setHeader:(key,value)=>result.headers[key]=value,status(code){result.status=code;return this;},json(body){result.body=body;return this;}});
  assert.match(result.headers['Cache-Control'],/no-store/);
  assert.equal(result.headers['Vercel-CDN-Cache-Control'],'no-store');
  assert.equal(result.headers['X-Robots-Tag'],'noindex, nofollow, noarchive');
  return result;
}
test('URL access works without credentials, roles, environment configuration or auth network',async()=>{
  const original=global.fetch;
  global.fetch=()=>{throw Error('Handbook must not depend on Auth');};
  try{
    for(const headers of [{},{authorization:'Bearer expired-token'}]){
      const response=await request(headers);assert.equal(response.status,200);assert.equal(response.body.access,'url');assert.equal(response.body.role,undefined);
      assert.equal(response.body.articles.length,26);
    }
  }finally{global.fetch=original;}
});
test('read-only API rejects mutations without disclosing payload',async()=>{
  for(const method of ['POST','PUT','DELETE']){
    const response=await request({},method);assert.equal(response.status,405);assert.equal(response.headers.Allow,'GET');assert.equal(response.body.articles,undefined);
  }
});
test('complete draft handbook contains monochrome action tokens and examples',async()=>{
  const {articles,tokens}=(await request()).body;
  assert.equal(new Set(articles.map(a=>a.id)).size,26);assert.equal(tokens.status,'draft');
  assert.equal(tokens.font.display,'Anton');assert.equal(tokens.font.body,'Wanted Sans');
  for(const color of Object.values(tokens.color)){
    assert.match(color,/^#[0-9a-f]{6}$/i);assert.equal(color.slice(1,3).toLowerCase(),color.slice(3,5).toLowerCase());assert.equal(color.slice(3,5).toLowerCase(),color.slice(5,7).toLowerCase());
  }
  assert.equal(tokens.color.accent,'#000000');assert.equal(tokens.color.accentHover,'#333333');
  for(const a of articles){assert.equal(a.status,'draft');assert.ok(a.specs.length>=3);assert.ok(a.good&&a.bad&&a.html&&a.css&&a.demo);}
  assert.match(articles.find(a=>a.id==='access').intro,/로그인·계정 승인 없이/);
  for(const group of ['Foundations','Materials','Components','Applications','Architecture'])assert.ok(articles.some(a=>a.group===group));
});
test('browser scripts parse, load without a session and contain no guide login UI',()=>{
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  scripts.forEach((match,index)=>new vm.Script(match[1],{filename:'index-inline-'+index+'.js'}));
  const handbook=html.slice(html.indexOf('/* URL-accessible handbook;'),html.indexOf('   9. CHROME + BOOT'));
  assert.doesNotMatch(handbook,/gd-login|gd-logout|auth\.getSession|Authorization|byx_guidelines_role/);
  assert.match(handbook,/if\(!GD\.error && !GD\.loading\) gdLoad\(\)/);
  assert.ok(html.includes('--gd-accent:#000000'));assert.ok(html.includes('Wanted Sans official'));
  assert.doesNotMatch(handbook,/#007f73|#00665d|#e8f3f0/i);
});
