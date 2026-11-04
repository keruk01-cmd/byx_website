// Public intake only. Service credentials stay in the Edge Function environment.
const allowedOrigin=(origin:string)=>origin==='https://byx-website.vercel.app'||/^https:\/\/byx-website-[a-z0-9-]+-keruk01-cmds-projects\.vercel\.app$/.test(origin);
const response=(origin:string,status:number,body:unknown)=>new Response(status===204?null:JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type, apikey, authorization','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','X-Content-Type-Options':'nosniff'}});
export async function handler(request:Request):Promise<Response>{
  const origin=request.headers.get('origin')||'';
  if(!allowedOrigin(origin))return new Response('Forbidden',{status:403});
  if(request.method==='OPTIONS')return response(origin,204,null);
  if(request.method!=='POST')return response(origin,405,{error:'허용되지 않는 요청입니다.'});
  if(!request.headers.get('content-type')?.includes('application/json'))return response(origin,415,{error:'올바른 형식으로 입력해주세요.'});
  if(Number(request.headers.get('content-length')||0)>36000)return response(origin,413,{error:'문의 내용이 너무 깁니다.'});
  let input:Record<string,unknown>;
  try{
    const reader=request.body?.getReader();if(!reader)return response(origin,400,{error:'입력 내용을 확인해주세요.'});
    const decoder=new TextDecoder();let size=0,raw='';
    while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>36000){await reader.cancel();return response(origin,413,{error:'문의 내용이 너무 깁니다.'});}raw+=decoder.decode(chunk.value,{stream:true});}
    raw+=decoder.decode();const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return response(origin,400,{error:'입력 내용을 확인해주세요.'});input=parsed;
  }catch{return response(origin,400,{error:'입력 내용을 확인해주세요.'});}
  const text=(key:string)=>typeof input[key]==='string'?(input[key] as string).trim():'';
  const subject=text('subject'),email=text('email').toLowerCase(),phone=text('phone'),body=text('body');
  if(subject.length<3||subject.length>160||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length>40||body.length<10||body.length>8000||input.consent!==true||text('website'))return response(origin,400,{error:'제목, 이메일, 설명과 동의 항목을 확인해주세요.'});
  let key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!key){try{key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;}catch{/* Missing credentials are handled below. */}}
  const url=Deno.env.get('SUPABASE_URL');
  if(!url||!key)return response(origin,503,{error:'지금은 접수할 수 없습니다. 잠시 후 다시 시도해주세요.'});
  try{
    const client=request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()||email;
    const salt=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const digest=await crypto.subtle.sign('HMAC',salt,new TextEncoder().encode(client));
    const fingerprint=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
    const result=await fetch(url+'/rest/v1/rpc/submit_contact_request',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_subject:subject,p_email:email,p_phone:phone,p_body:body,p_consent:true,p_client_hash:fingerprint}),signal:AbortSignal.timeout(10000)});
    if(!result.ok){const failure=await result.json().catch(()=>({}));return response(origin,failure.message==='RATE_LIMITED'?429:503,{error:failure.message==='RATE_LIMITED'?'잠시 후 다시 문의해주세요.':'접수하지 못했습니다. 잠시 후 다시 시도해주세요.'});}
    return response(origin,201,{accepted:true,id:await result.json()});
  }catch{return response(origin,503,{error:'접수하지 못했습니다. 잠시 후 다시 시도해주세요.'});}
}
Deno.serve(handler);
