// Public submission endpoint; responses are accessible only through the owner's Cloudflare account.
import cards from './allowed-cards.json';
const reply=(body,status,origin)=>Response.json(body,{status,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','Vary':'Origin'}});
export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'';
 if(origin!==env.ALLOWED_ORIGIN)return new Response('Origin not permitted',{status:403});
 if(request.method==='OPTIONS')return reply({ok:true},200,origin);
 if(request.method!=='POST')return reply({error:'Method not allowed'},405,origin);
 try{
  const body=await request.text();
  if(body.length>20000)return reply({error:'Submission too large'},413,origin);
  let data;try{data=JSON.parse(body)}catch{return reply({error:'Invalid JSON'},400,origin)}
  const rating=x=>Number.isInteger(x)&&x>=1&&x<=5;
  const text=(x,max)=>typeof x==='string'&&x.length<=max;
  if(!data||data.game!==env.GAME||!Array.isArray(data.cards)||data.cards.length!==1||!text(data.respondent_id,100)||!data.respondent_id||!rating(data.overall_interest)||!text(data.overall_feedback,5000)||!text(data.started_at,40)||!text(data.completed_at,40)||!Number.isFinite(Date.parse(data.started_at))||!Number.isFinite(Date.parse(data.completed_at)))return reply({error:'Invalid survey submission'},400,origin);
  const c=data.cards[0],card=cards.find(x=>x.id===c?.card_id);
  if(!card||!rating(c.clarity)||!rating(c.interest)||!Number.isInteger(c.comprehension)||c.comprehension<0||c.comprehension>=card.options.length||!text(c.feedback,5000))return reply({error:'Invalid card answers'},400,origin);
  const result=await env.DB.prepare(`INSERT INTO responses (respondent_id,game,started_at,completed_at,overall_interest,overall_feedback,card_id,card_title,clarity,interest,comprehension,feedback) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(game,respondent_id) DO NOTHING`).bind(data.respondent_id,data.game,data.started_at,data.completed_at,data.overall_interest,data.overall_feedback,c.card_id,card.title,c.clarity,c.interest,c.comprehension,c.feedback).run();
  if(!result.success)throw Error('Database write failed');
  return reply({ok:true},200,origin);
 }catch{return reply({error:'Unable to save response. Please try again.'},503,origin)}
}};
