/* Local QA ONLY. No real Supabase requests or production writes.
   Vercel's ignore files exclude tests. Binds to loopback, never deploy this server. */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const handler=require('../api/guidelines.js');
const fixtureScript=`<script>
window.BYX_CONFIG={url:'',key:'',bucket:'media'};
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
server.listen(4173,'127.0.0.1',()=>console.log('Local QA: http://127.0.0.1:4173/guidelines — no login, no production writes'));
