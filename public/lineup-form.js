// Pregame rotation, bounded player form, and transparent simulation breakdowns.
let lineupDraft=[], lineupSlot=null, lineupReturn='weekend', lineupMessage='';
D.playerForm=D.playerForm||{};
const restoreBeforeForm=storeAccountSnapshot;
storeAccountSnapshot=function(data){restoreBeforeForm(data);D.playerForm=data?.director?.playerForm||{};};
function formValue(id){return Math.max(-3,Math.min(3,Number(D.playerForm?.[id]?.value)||0));}
function formBonus(id){const v=formValue(id);return Math.abs(v)>=2?v*2:0;}
function formLabel(id){const v=formValue(id);return v>=2?'🔥 Hot streak':v<=-2?'❄️ Slump':v===1?'↗ Warming up':v===-1?'↘ Cooling off':'• Steady';}
function formBadge(id){const bonus=formBonus(id);return `<span class="form-badge ${bonus>0?'hot':bonus<0?'cold':''}">${formLabel(id)}${bonus?` · ${bonus>0?'+':''}${bonus} form`:''}</span>`;}
const energyBeforeForm=energyWidget;
energyWidget=function(id){return energyBeforeForm(id)+formBadge(id);};
function validFive(ids){return ids.length===5&&new Set(ids).size===5&&ids.every(id=>S.pick.includes(id)&&player(id))&&ids.some(id=>player(id).p.includes('G'))&&ids.some(id=>player(id).p.includes('B'));}
function strengthParts(ids=S.five){
  const ps=ids.map(player).filter(Boolean),t=tactics.find(x=>x.id===S.tactic)||tactics[0];
  const skill=avg(ps,'s')*.28+avg(ps,'pa')*.20+avg(ps,'d')*.24+avg(ps,'q')*.17+avg(ps,'a')*.11;
  const energy=ids.length?ids.reduce((n,id)=>n+playerEnergy(id),0)/ids.length:100;
  const form=ids.length?ids.reduce((n,id)=>n+formBonus(id),0)/ids.length:0;
  return {skill,fit:fit()*.08,tactic:(t.off+t.def)*.3,energy:(energy-100)*.2,form,total:Math.round(skill+fit()*.08+(t.off+t.def)*.3+(energy-100)*.2+form)};
}
rating=function(){return strengthParts().total;};
function lineupCard(id,slot){
  const p=player(id),isStarter=slot!==null,selected=isStarter&&lineupSlot===slot;
  return `<article class="lineup-player ${selected?'selected':''}"><div class="kicker">${isStarter?'STARTER '+(slot+1):'BENCH'}</div><h3>${escapeHtml(p.n)}</h3><div class="small">${escapeHtml(p.catalog?.position||p.p)} · ${escapeHtml(projectedArchetype(p).name)} · OVR ${cardOvr(cardAttributes(p))}</div>${energyWidget(id)}<button class="btn ${selected?'':'alt'}" aria-pressed="${selected}" onclick="${isStarter?`selectLineupSlot(${slot})`:`swapLineupPlayer('${id}')`}">${isStarter?(selected?'Selected — pick a reserve':'Swap this starter'):(lineupSlot===null?'Choose a starter first':'Put in starting five')}</button></article>`;
}
function openPregame(){
  if(!S.opp||S.pick.length!==8||['half','result'].includes(S.screen))return;
  lineupReturn=S.mode==='pool'?'weekend':'bracket';lineupDraft=[...S.five];lineupSlot=null;lineupMessage='Tap a starter, then a bench player to swap them.';
  if(!validFive(lineupDraft))suggestLineup(false);
  renderPregame();
}
beginGame=openPregame;
function selectLineupSlot(slot){if(S.screen!=='pregame'||!lineupDraft[slot])return;lineupSlot=slot;lineupMessage=`Choose who replaces ${player(lineupDraft[slot]).n}.`;renderPregame();}
function swapLineupPlayer(id){
  if(S.screen!=='pregame'||!S.pick.includes(id)||lineupDraft.includes(id))return;
  if(lineupSlot===null){lineupMessage='First tap “Swap this starter” on the player coming out.';renderPregame();return;}
  const outgoing=lineupDraft[lineupSlot];lineupDraft[lineupSlot]=id;lineupSlot=null;lineupMessage=`${player(id).n} in. ${player(outgoing).n} to the bench.`;renderPregame();
}
function suggestLineup(render=true){
  let best=null,bestScore=-Infinity;
  function choose(at,ids){if(ids.length===5){if(validFive(ids)){const score=strengthParts(ids).total;if(score>bestScore){best=[...ids];bestScore=score;}}return;}for(let i=at;i<S.pick.length;i++)choose(i+1,[...ids,S.pick[i]]);}
  choose(0,[]);if(best)lineupDraft=best;lineupSlot=null;lineupMessage='Suggested five balances current skills, energy, form, and the guard/big requirement.';if(render)renderPregame();
}
function renderPregame(){
  S.screen='pregame';const parts=strengthParts(lineupDraft),opponent=S.opp.o*.42+S.opp.d*.36+S.opp.q*.22;
  frame(`<div class="kicker">${S.mode==='pool'?'POOL GAME '+(S.poolAt+1):S.mode==='semi'?'SEMIFINAL':'CHAMPIONSHIP'} · PREGAME</div><h2>Set your starting five</h2><p class="lede">${escapeHtml(programs[S.team].n)} vs. ${escapeHtml(S.opp.n)}</p><div class="summary"><div class="kpi"><span>Your strength</span><b>${parts.total}</b></div><div class="kpi"><span>Opponent strength</span><b>${opponent.toFixed(1)}</b></div><div class="kpi"><span>Starter energy</span><b>${Math.round(lineupDraft.reduce((n,id)=>n+playerEnergy(id),0)/5)}%</b></div><div class="kpi"><span>Form effect</span><b>${parts.form>=0?'+':''}${parts.form.toFixed(1)}</b></div></div><div class="row">${button('Suggest best five','suggestLineup()','alt')}${button('Reset changes','lineupDraft=[...S.five];lineupSlot=null;lineupMessage="Changes reset.";renderPregame()','ghost')}</div><p class="lineup-status" role="status" aria-live="polite">${escapeHtml(lineupMessage)}</p><div class="sectionhead"><h3>Starting five</h3><span class="small">At least one guard and one big</span></div><div class="pregame-grid">${lineupDraft.map((id,i)=>lineupCard(id,i)).join('')}</div><div class="sectionhead"><h3>Bench</h3><span class="small">Tap a reserve to complete your swap</span></div><div class="pregame-grid">${S.pick.filter(id=>!lineupDraft.includes(id)).map(id=>lineupCard(id,null)).join('')}</div><div class="sectionhead"><h3>Team approach</h3></div><div class="grid two">${tactics.map(t=>`<button class="choice ${S.tactic===t.id?'on':''}" onclick="S.tactic='${t.id}';renderPregame()"><b>${t.n}</b><span>${t.d}</span></button>`).join('')}</div>${!validFive(lineupDraft)?'<p class="lineup-status">Your five must include a guard and a big before tipoff.</p>':''}<div class="row pregame-actions"><button class="btn" onclick="confirmPregame()" ${validFive(lineupDraft)?'':'disabled'}>Lock lineup & tip off →</button>${button('← Back to matchup',"cancelPregame()",'alt')}</div>${simulationGuide()}`);
}
function cancelPregame(){if(S.screen!=='pregame')return;lineupSlot=null;lineupReturn==='bracket'?bracket():weekend();}
function simulationGuide(){return `<details class="box sim-guide"><summary>How game results, hot streaks & slumps work</summary><h3>1. Starting-five strength</h3><p>Shooting 28%, passing 20%, defense 24%, IQ 17%, athleticism 11%. Add 8% of roster fit and 30% of your tactic’s combined offense/defense bonus. Every energy point below 100 subtracts 0.2 from team strength, using average starter energy. Form adds the average starter form bonus.</p><h3>2. The matchup</h3><p>Opponent strength is 42% offense + 36% defense + 22% IQ. Each player draws a game execution factor from 0.75–1.25. The starters’ average adds up to ±3 strength. First-half margin uses 30% of the strength difference plus a random −5.5 to +5.5; each team also gets 0–3 extra points. Second-half margin uses 20% of the difference plus −4.5 to +4.5 and your halftime bonus. Tied finals get a fair 50/50 one-point overtime decider.</p><h3>3. Your halftime call</h3><p>Pressure: +2 second-half margin. Bench: 7% of bench depth. Floor general: 5.5% of average starter IQ. Composed: +1. Run & Gun and Full-Court Pressure cost more energy. Bench calls reduce reserve fatigue; they do not replace the five starters.</p><h3>4. Player form</h3><p>Execution of at least 1.12 counts as a strong game; at most 0.88 counts as an off game. Two consecutive strong/off games start a hot streak/slump at +4/−4 form. Three reach the cap of +6/−6. An ordinary game moves form one step toward steady; an opposite result resets the run. Form affects starting-five strength and scoring share, and carries between games. Permanent card ratings stay the same.</p><h3>5. The box score</h3><p>The engine decides the team score first, then allocates points by skills, starter/bench role, form, and game execution. Rebounds, assists, steals, and blocks use role and skill weights. This is a ratings-based simulation, not a possession-by-possession match.</p></details>`;}
function confirmPregame(){
  if(S.screen!=='pregame'||!validFive(lineupDraft))return;
  S.five=[...lineupDraft];const rolls={};S.pick.forEach(id=>rolls[id]=.75+Math.random()*.5);
  const parts=strengthParts(),execution=S.five.reduce((n,id)=>n+(rolls[id]-1)*12,0)/5,opponent=S.opp.o*.42+S.opp.d*.36+S.opp.q*.22;
  const delta=parts.total+execution-opponent,noise=Math.random()*11-5.5,gap=Math.round(delta*.3+noise),extraUs=Math.floor(Math.random()*4),extraThem=Math.floor(Math.random()*4);
  S.simulation={parts,execution,opponent,delta,rolls,firstNoise:noise,firstGap:gap,extraUs,extraThem,formAtTip:Object.fromEntries(S.pick.map(id=>[id,formBonus(id)]))};
  S.half={us:34+Math.max(gap,0)+extraUs,them:34+Math.max(-gap,0)+extraThem};saveAll();halftime();
}
const boxBeforeForm=buildBoxScore;
buildBoxScore=function(us,them){
  const box=boxBeforeForm(us,them),roster=S.pick.map(player).filter(Boolean);
  const pts=statAllocation(us,roster,p=>(S.five.includes(p.id)?1.35:.58)*(p.s*.48+p.pa*.20+p.q*.18+p.a*.14)*(S.simulation?.rolls[p.id]||1)*(1+(S.simulation?.formAtTip[p.id]||0)/100));
  box.players.forEach((row,i)=>{row.pts=pts[i];row.formAtTip=S.simulation?.formAtTip[row.playerId]||0;row.execution=S.simulation?.rolls[row.playerId]||1;});return box;
};
function advancePlayerForm(id,execution){
  D.playerForm=D.playerForm||{};const before=formValue(id),direction=execution>=1.12?1:execution<=.88?-1:0;
  const after=direction?(Math.sign(before)===direction?Math.max(-3,Math.min(3,before+direction)):direction):before-Math.sign(before);
  D.playerForm[id]={value:after,lastGame:S.statLog.length+1};return {id,before,after,performance:direction>0?'Strong game':direction<0?'Off game':'Steady game'};
}
// Replace the base game calculation while retaining director rewards and pack earning.
baseFinishGameImpl=function(call){
  const sim=S.simulation;if(!sim)return;
  const boost=call==='pressure'?2:call==='bench'?depth()*.07:call==='star'?avg(starters(),'q')*.055:1;
  const noise=Math.random()*9-4.5,gap=Math.round(sim.delta*.2+noise+boost);
  let us=S.half.us+32+Math.max(gap,0),them=S.half.them+32+Math.max(-gap,0),overtime=null;
  if(us===them){overtime=Math.random()<.5?'you':'opponent';if(overtime==='you')us++;else them++;}
  const changes=S.pick.map(id=>advancePlayerForm(id,sim.rolls[id]));
  S.game={us,them,win:us>them,call,simulation:{...sim,secondNoise:noise,secondGap:gap,boost,overtime},formChanges:changes};recordGameStats();
  const tax=tactics.find(t=>t.id===S.tactic).tax;
  S.five.forEach(id=>S.energy[id]=Math.max(50,playerEnergy(id)-13-tax));
  S.pick.filter(id=>!S.five.includes(id)).forEach(id=>S.energy[id]=Math.max(55,playerEnergy(id)-6+(call==='bench'?5:0)));
  result();
};
// The older director wrapper captured its base function, so invoke the new calculation here.
finishGame=function(call){
  if(S.screen!=='half'||!['pressure','bench','star','calm'].includes(call))return;
  baseFinishGameImpl(call);D.lastReward=S.game.win?12:8;D.points+=D.lastReward;
  S.five.forEach(id=>D.loyalty[id]=Math.max(35,loyalty(id)+(S.game.win?1:-2)));saveAll();result();
  inventoryChange(c=>{if(!(typeof aauVault!=='undefined'&&aauVault.enabled)){c.matches++;if(c.matches%3===0)c.packs++}}).catch(e=>alert(e.message));
};
const recordBeforeForm=recordGameStats;
recordGameStats=function(){recordBeforeForm();Object.assign(S.statLog[0],{simulation:S.game.simulation,formChanges:S.game.formChanges,starters:[...S.five]});saveAll();};
const resultBeforeForm=result;
result=function(){resultBeforeForm();const sim=S.game?.simulation;if(!sim)return;app.querySelector('main')?.insertAdjacentHTML('beforeend',`<section class="box sim-guide"><div class="kicker">WHY THIS GAME FINISHED ${S.game.us}–${S.game.them}</div><h3>The matchup, explained</h3><p>Your strength <b>${sim.parts.total}</b> (includes ${sim.parts.form>=0?'+':''}${sim.parts.form.toFixed(1)} form), game execution <b>${sim.execution.toFixed(1)}</b>, opponent <b>${sim.opponent.toFixed(1)}</b>. Matchup difference: <b>${sim.delta.toFixed(1)}</b>.</p><p>First-half margin: ${sim.firstGap} plus the extra-point difference (${sim.extraUs}−${sim.extraThem}). Second-half margin: ${sim.secondGap}, including <b>+${sim.boost.toFixed(1)}</b> for ${callLabel(S.game.call).toLowerCase()}.${sim.overtime?` Overtime: ${sim.overtime==='you'?'your team':'the opponent'} won the 50/50 decider.`:''}</p><h3>Form heading into your next game</h3><div class="form-results">${S.game.formChanges.map(x=>`<div><b>${escapeHtml(player(x.id).n)}</b><span class="small">${x.performance} · execution ${sim.rolls[x.id].toFixed(2)}</span>${formBadge(x.id)}</div>`).join('')}</div></section>${simulationGuide()}`);};
const advanceBeforeLineup=advanceGame;
advanceGame=function(){if(S.screen!=='result')return;advanceBeforeLineup();};
const weekendBeforeLineup=weekend;
weekend=function(){weekendBeforeLineup();app.innerHTML=app.innerHTML.replace(/Play Game (\d+) →/g,'Set lineup · Game $1 →');};
const bracketBeforeLineup=bracket;
bracket=function(){bracketBeforeLineup();app.innerHTML=app.innerHTML.replace('Tip off →','Set lineup & play →');};
const lineupStyles=document.createElement('style');lineupStyles.textContent=`
.pregame-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:12px}.lineup-player{background:#111722;border:1px solid var(--line);padding:16px;border-radius:14px}.lineup-player.selected{border:2px solid var(--lime);padding:15px;background:#1e281a}.lineup-player h3{margin-top:8px}.lineup-player .btn{margin-top:14px;width:100%;font-size:12px;min-height:44px}.lineup-player .energy-row{flex-wrap:wrap}.form-badge{display:inline-block;color:#c3ccda;background:#263040;padding:5px 8px;border-radius:7px;font-size:11px;margin-top:8px}.form-badge.hot{background:#4d2e16;color:#ffcd81}.form-badge.cold{background:#15334b;color:#9edbff}.lineup-status{border-left:3px solid var(--lime);padding:12px;background:#d9ff4908}.pregame-actions{position:sticky;bottom:0;background:#090c12ed;padding:12px;border:1px solid var(--line);border-radius:12px;z-index:2}.sim-guide{margin-top:20px}.sim-guide summary{cursor:pointer;font-weight:800}.sim-guide h3{margin-top:20px}.sim-guide p{font-size:13px;color:#bcc8d9}.form-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.form-results>div{display:flex;flex-direction:column;align-items:flex-start;border-top:1px solid var(--line);padding-top:10px}@media(max-width:520px){.pregame-grid{grid-template-columns:1fr}.pregame-actions .btn{flex:1;min-height:48px}}
`;document.head.appendChild(lineupStyles);
