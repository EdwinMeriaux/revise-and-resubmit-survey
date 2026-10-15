// Deploy this Cloudflare Worker for ONE game, storing GH_TOKEN as a secret.
// Configure OWNER, REPO and ALLOWED_ORIGIN as Worker environment variables.
const header='respondent_id,game,started_at,completed_at,overall_interest,overall_feedback,card_id,card_title,clarity,interest,comprehension,feedback\n';
const csv=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""').replaceAll('\r',' ').replaceAll('\n',' ')+'"'};
const enc=x=>btoa(Array.from(new TextEncoder().encode(x),b=>String.fromCharCode(b)).join(''));
const dec=x=>new TextDecoder().decode(Uint8Array.from(atob(x.replace(/\s/g,'')),c=>c.charCodeAt(0)));
const cors=origin=>({'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'});
export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'';
 if(origin!==env.ALLOWED_ORIGIN)return new Response('Origin not permitted',{status:403});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:cors(origin)});
 try{
  const data=await request.json();
  if(data.game!==env.GAME||!Array.isArray(data.cards)||data.cards.length!==1||typeof data.respondent_id!=='string'||data.respondent_id.length>100)throw Error('Malformed submission');
  const rows=data.cards.map(c=>[data.respondent_id,data.game,data.started_at,data.completed_at,data.overall_interest,data.overall_feedback,c.card_id,c.title,c.clarity,c.interest,c.comprehension,c.feedback].map(csv).join(',')).join('\n')+'\n';
  const url=`https://api.github.com/repos/${env.OWNER}/${env.REPO}/contents/data/responses.csv`;
  const headers={'Authorization':`Bearer ${env.GH_TOKEN}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'academic-game-survey'};
  for(let n=0;n<10;n++){
   const r=await fetch(url,{headers});if(!r.ok)throw Error(`GitHub read error ${r.status}`);
   const previous=await r.json(); const contents=dec(previous.content);
   if(contents.includes(csv(data.respondent_id)+','))return Response.json({ok:true,duplicate:true},{headers:cors(origin)});
   const update=await fetch(url,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Record anonymous survey response',content:enc(contents+rows),sha:previous.sha,branch:'main'})});
   if(update.ok)return Response.json({ok:true},{headers:cors(origin)});
   if(update.status!==409&&update.status!==422)throw Error(`GitHub write error ${update.status}`);
  }
  throw Error('Too many concurrent updates; retry');
 }catch(e){return new Response('Unable to save response: '+e.message,{status:503,headers:cors(origin)});}
}};
