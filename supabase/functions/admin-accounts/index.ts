// Account credentials and the service key stay inside this authenticated endpoint.
const capabilities=['projects','feed','about','contact','inquiries'];
const allowedOrigin=(origin:string)=>origin==='https://byx-website.vercel.app'||/^https:\/\/byx-website-[a-z0-9-]+-keruk01-cmds-projects\.vercel\.app$/.test(origin);
const reply=(origin:string,status:number,value:unknown)=>new Response(status===204?null:JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','X-Content-Type-Options':'nosniff'}});
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const validPassword=(value:unknown)=>typeof value==='string'&&value.length>=12&&value.length<=128;
export async function handler(request:Request):Promise<Response>{
  const origin=request.headers.get('origin')||'';
  if(!allowedOrigin(origin))return new Response('Forbidden',{status:403});
  if(request.method==='OPTIONS')return reply(origin,204,null);
  if(request.method!=='POST')return reply(origin,405,{error:'허용되지 않는 요청입니다.'});
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer\s+\S+$/i.test(authorization))return reply(origin,401,{error:'관리자 로그인이 필요합니다.'});
  if(!request.headers.get('content-type')?.includes('application/json'))return reply(origin,415,{error:'올바른 형식으로 요청해주세요.'});
  if(Number(request.headers.get('content-length')||0)>8192)return reply(origin,413,{error:'요청이 너무 큽니다.'});
  let input:Record<string,unknown>;
  try{
    const reader=request.body?.getReader();if(!reader)throw Error('EMPTY');let size=0,raw='';const decoder=new TextDecoder();
    while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>8192){await reader.cancel();return reply(origin,413,{error:'요청이 너무 큽니다.'});}raw+=decoder.decode(chunk.value,{stream:true});}
    raw+=decoder.decode();const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('INVALID');input=parsed;
  }catch{return reply(origin,400,{error:'요청 내용을 확인해주세요.'});}
  let key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!key){try{key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;}catch{/* The platform may expose either server-key format. */}}
  const url=Deno.env.get('SUPABASE_URL');if(!url||!key)return reply(origin,503,{error:'지금은 계정을 관리할 수 없습니다.'});
  const serviceHeaders={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  const call=async(path:string,options:RequestInit={})=>{
    const response=await fetch(url+path,{...options,headers:{...serviceHeaders,...options.headers},signal:AbortSignal.timeout(10000)});
    const data=await response.json().catch(()=>null);if(!response.ok){const message=data?.message||data?.msg||'';throw Object.assign(Error(message),{status:response.status});}return data;
  };
  const rpc=(name:string,body:unknown)=>call('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(body)});
  try{
    const auth=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:authorization},signal:AbortSignal.timeout(10000)});
    if(!auth.ok)return reply(origin,401,{error:'로그인이 만료되었습니다. 다시 로그인해주세요.'});
    const user=await auth.json();if(!uuid(user.id))return reply(origin,401,{error:'유효한 관리자 로그인이 필요합니다.'});
    const member=(await call('/rest/v1/cms_members?user_id=eq.'+user.id+'&select=*'))?.[0];
    if(!member?.active)return reply(origin,403,{error:'관리자 접근 권한이 없습니다.'});
    const action=String(input.action||'list');
    if(action==='change_password'){
      if(!validPassword(input.password))return reply(origin,400,{error:'비밀번호는 12~128자로 입력해주세요.'});
      await call('/auth/v1/admin/users/'+user.id,{method:'PUT',body:JSON.stringify({password:input.password})});
      await rpc('cms_password_changed',{p_user:user.id});return reply(origin,200,{ok:true});
    }
    if(member.role!=='owner'||member.must_change_password)return reply(origin,403,{error:'최고 관리자만 계정을 관리할 수 있습니다.'});
    if(action==='list'){
      const members=await call('/rest/v1/cms_members?select=user_id,email,role,permissions,active,must_change_password,created_at,updated_at&order=created_at.asc');
      return reply(origin,200,{members});
    }
    const role=input.role==='owner'?'owner':input.role==='editor'?'editor':null;
    const permissions=Array.isArray(input.permissions)?Array.from(new Set(input.permissions.filter(value=>typeof value==='string'))):null;
    if(action!=='revoke'&&(!role||!permissions||permissions.some(value=>!capabilities.includes(String(value)))||(role==='editor'&&!permissions.length)))
      return reply(origin,400,{error:'계정 등급과 편집 가능한 메뉴를 지정해주세요.'});
    if(action==='create'){
      const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
      if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!validPassword(input.password))return reply(origin,400,{error:'이메일과 12~128자의 임시 비밀번호를 입력해주세요.'});
      if((await call('/rest/v1/cms_members?active=eq.true&select=user_id&limit=31')).length>=30)return reply(origin,409,{error:'관리자 계정은 최대 30개까지 등록할 수 있습니다.'});
      const previous=(await call('/rest/v1/cms_members?email=eq.'+encodeURIComponent(email)+'&select=*'))?.[0];
      if(previous?.active)return reply(origin,409,{error:'이미 관리자 권한이 있는 계정입니다.'});
      let created=null,target=previous?.user_id;
      try{
        if(target)await call('/auth/v1/admin/users/'+target,{method:'PUT',body:JSON.stringify({password:input.password})});
        else{created=await call('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,password:input.password,email_confirm:true})});target=created.id||created.user?.id;}
        if(!uuid(target))throw Error('CREATE_FAILED');
        const result=await rpc('cms_manage_member',{p_actor:user.id,p_target:target,p_email:email,p_role:role,p_permissions:permissions,p_active:true,p_require_password:true});
        return reply(origin,201,{member:result});
      }catch(error){
        if(created&&uuid(target)){try{await call('/auth/v1/admin/users/'+target,{method:'DELETE'});}catch{/* A stranded auth account has no CMS membership or write permissions. */}}
        if((error as {status?:number}).status===422)return reply(origin,409,{error:'이미 등록된 이메일입니다. 기존 계정의 접근 권한을 확인해주세요.'});throw error;
      }
    }
    if(!['update','revoke'].includes(action)||!uuid(input.user_id))return reply(origin,400,{error:'대상 계정을 확인해주세요.'});
    if(input.user_id===user.id)return reply(origin,409,{error:'본인의 최고 관리자 권한은 이 화면에서 변경하거나 제거할 수 없습니다.'});
    const target=(await call('/rest/v1/cms_members?user_id=eq.'+input.user_id+'&select=*'))?.[0];
    if(!target)return reply(origin,404,{error:'관리자 계정을 찾을 수 없습니다.'});
    const result=await rpc('cms_manage_member',{p_actor:user.id,p_target:target.user_id,p_email:target.email,p_role:action==='revoke'?target.role:role,p_permissions:action==='revoke'?target.permissions:permissions,p_active:action!=='revoke',p_require_password:target.must_change_password});
    return reply(origin,200,{member:result});
  }catch(error){
    const message=(error as Error).message;
    if(/OWNER_REQUIRED|CANNOT_CHANGE_SELF|LAST_OWNER_REQUIRED/.test(message))return reply(origin,403,{error:'최고 관리자 권한을 확인해주세요. 마지막 최고 관리자는 제거할 수 없습니다.'});
    if(/MEMBER_LIMIT|INVALID_MEMBER/.test(message))return reply(origin,400,{error:'계정 정보와 권한을 확인해주세요.'});
    return reply(origin,503,{error:'요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'});
  }
}
Deno.serve(handler);
