/* Shared survey engine; no build step. */
const $ = id => document.getElementById(id);
const cfg = window.SURVEY_CONFIG;
const state = { cards: [], index: 0, answers: {}, respondentId: crypto.randomUUID(), startedAt: null, busy: false };
// Preserve saved responses and unfinished surveys on this device.
const savedKey = `survey-progress:deck-v1:${cfg.game}`;
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const configured = !!cfg.submissionEndpoint;
const req = async (data) => {
 const r = await fetch(cfg.submissionEndpoint, {method:'POST', headers:{'Content-Type':'text/plain;charset=UTF-8'}, body:JSON.stringify(data)});
 if(!r.ok) throw new Error(`Submission failed (${r.status}): ${await r.text()}`);
 const result=await r.json();
 if(result.ok!==true)throw new Error('The server did not confirm your submission. Please try again.');
 return result;
};
const shuffle = a => {for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
async function selectCards(){
 const r = await fetch('cards.json',{cache:'no-store'});if(!r.ok)throw new Error('Cards could not be loaded');
 const source=await r.json();return shuffle(source.filter(x=>x.active!==false)).slice(0,1);
}
function persist(){sessionStorage.setItem(savedKey,JSON.stringify({cards:state.cards,index:state.index,answers:state.answers,respondentId:state.respondentId,startedAt:state.startedAt}))}
function renderCard(card){
 const pic=card.image_url || card.image;
 if(pic){$('card-display').innerHTML=`<img src="${escapeHtml(pic)}" alt="${escapeHtml(card.title)}">`;return}
 $('card-display').innerHTML=`<article class="sampleCard" style="--sample:${escapeHtml(cfg.color)}"><div class="tag">${escapeHtml(cfg.name)} · Sample card</div><h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.description)}</p><div class="rule">${escapeHtml(card.effect)}</div><div class="id">${escapeHtml(card.id)} · Replace this sample with a real card image</div></article>`;
}
function ratings(name,val){return `<div class="rating">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="${name}" value="${n}" ${val===n?'checked':''}><span>${n}</span></label>`).join('')}</div><div class="scale"><span>1 · Very low</span><span>5 · Very high</span></div>`}
function render(){
 const card=state.cards[state.index];const a=state.answers[card.id]||{};
 $('step').textContent=`Card ${state.index+1} of ${state.cards.length}`;$('bar').style.width=`${(state.index+1)/state.cards.length*100}%`;
 renderCard(card);
 $('questions').innerHTML=`
 <div class="question"><label>1. How clear is this card?</label>${ratings('clarity',a.clarity)}</div>
 <div class="question"><label>2. How interesting would this card be during gameplay?</label>${ratings('interest',a.interest)}</div>
 <div class="question"><label>3. Based on the card, what would happen or what should you do?</label><div class="choices">${(card.options||[]).map((opt,i)=>`<label class="choice"><input type="radio" name="comprehension" value="${i}" ${a.comprehension===i?'checked':''}> <span>${escapeHtml(opt)}</span></label>`).join('')}</div></div>
 <div class="question"><label for="feedback">4. What would you improve? <span class="subtle small">(optional)</span></label><textarea id="feedback" placeholder="Anything confusing, unrealistic, or unbalanced?">${escapeHtml(a.feedback||'')}</textarea></div>`;
 $('prev').disabled=state.index===0;$('next').textContent=state.index===state.cards.length-1?'Finish card evaluations →':'Next card →';$('survey-error').textContent='';
}
function collect(){
 const card=state.cards[state.index], a={};
 for(const key of ['clarity','interest','comprehension']){const el=document.querySelector(`input[name="${key}"]:checked`);if(el)a[key]=Number(el.value)}
 a.feedback=$('feedback').value.trim();
 state.answers[card.id]=a;persist();return a;
}
function validate(a){return Number.isInteger(a.clarity)&&Number.isInteger(a.interest)&&Number.isInteger(a.comprehension)}
function show(name){['landing','survey','overall','complete'].forEach(id=>$(id).classList.toggle('hidden',id!==name));window.scrollTo({top:0,behavior:'smooth'})}
async function start(){
 $('start').disabled=true;$('start').textContent='Loading cards…';
 try{
  let old;try{old=JSON.parse(sessionStorage.getItem(savedKey))}catch{}
  if(old && old.cards?.length===1){Object.assign(state,old)}
  else{state.startedAt=new Date().toISOString();state.cards=await selectCards();if(state.cards.length<1)throw new Error('At least one active card is required.');state.index=0;persist()}
  render();show('survey');
 }catch(e){$('landing-error').textContent=e.message}
 finally{$('start').disabled=false;$('start').textContent='Start the 1-card survey →'}
}
async function submit(){
 if(state.busy)return;
 state.busy=true;$('submit').disabled=true;$('submit').textContent='Submitting…';$('overall-error').textContent='';
 const result={game:cfg.game,respondent_id:state.respondentId,started_at:state.startedAt,completed_at:new Date().toISOString(),overall_interest:Number(document.querySelector('input[name="overall_interest"]:checked')?.value),overall_feedback:$('overall-feedback').value.trim(),cards:state.cards.map(c=>({card_id:c.id,title:c.title,...state.answers[c.id]}))};
 try{
  if(!Number.isInteger(result.overall_interest))throw new Error('Please select an overall game interest rating.');
  if(!configured)throw new Error('Response collection is not connected yet. Your answers have not been submitted. Please contact the survey organizer.');
  await req(result);
  sessionStorage.removeItem(savedKey);show('complete');
 }catch(e){$('overall-error').textContent=e.message}
 finally{state.busy=false;$('submit').disabled=false;$('submit').textContent='Submit feedback ✓'}
}
$('start').onclick=start;
$('next').onclick=()=>{const a=collect();if(!validate(a)){$('survey-error').textContent='Please answer the three required questions before continuing.';return}if(state.index===state.cards.length-1){show('overall')}else{state.index++;persist();render();window.scrollTo({top:0,behavior:'smooth'})}};
$('prev').onclick=()=>{collect();state.index=Math.max(0,state.index-1);persist();render()};
$('back-overall').onclick=()=>{render();show('survey')};$('submit').onclick=submit;
$('start-new').onclick=()=>location.reload();
$('mode').textContent=configured?'Your answers will be sent securely to the survey organizer.':'Response collection is not connected yet. Submissions are currently unavailable.';
