/* Local QA ONLY. No real Supabase requests, no production writes, no auth bypass in app.
   Vercel's ignore files exclude tests. Binds to loopback, never deploy this server. */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const handler=require('../api/guidelines.js');
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY='local-fixture';
global.fetch=async(_url,options)=>{
  const token=options.headers.Authorization;
  const valid=token==='Bearer fixture-viewer';
  return {status:valid?200:401,ok:valid,json:async()=>({id:'fixture-viewer',email_confirmed_at:'2026-01-01',app_metadata:{byx_guidelines_role:'viewer'}})};
};
const fixtureScript=`<script>
window.BYX_CONFIG={url:'https://example.supabase.co',key:'local-fixture',bucket:'media'};
window.supabase={createClient(){
 let session=sessionStorage.getItem('byx-qa')?{access_token:'fixture-viewer',user:{email:'viewer@example.test'}}:null;
 let callback=()=>{};
 return {auth:{
  async getSession(){return {data:{session}}},onAuthStateChange(fn){callback=fn},
  async signInWithPassword({email,password}){if(email!=='viewer@example.test'||password!=='preview-only')return {error:{message:'fixture credentials only'}};session={access_token:'fixture-viewer',user:{email}};sessionStorage.setItem('byx-qa','yes');callback('SIGNED_IN',session);return {data:{session}}},
  async signOut(){session=null;sessionStorage.removeItem('byx-qa');callback('SIGNED_OUT',null)}
 },from(){const q={select(){return q},order(){return Promise.resolve({data:[],error:null})},then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return q}};
}};
</script>`;
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/api/guidelines'){
    res.status=code=>{res.statusCode=code;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
    return handler(req,res);
  }
  if(url.pathname==='/'||url.pathname==='/index.html'||url.pathname.startsWith('/guidelines')||url.pathname==='/admin'){
    let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
    html=html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]+><\/script>/,fixtureScript);
    res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(html);return;
  }
  res.statusCode=404;res.end('Not found');
});
server.listen(4173,'127.0.0.1',()=>console.log('Local QA: http://127.0.0.1:4173/guidelines — viewer@example.test / preview-only (fixtures only)'));
