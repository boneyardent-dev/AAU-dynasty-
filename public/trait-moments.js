// Narrative from recorded effects only. No score, RNG, XP or reward changes.
function traitMoment(id,trait,title,text,phase,tone,priority){return {id:id+':'+trait+':'+phase,playerId:id,trait,title,text,phase,tone,priority};}
function buildTraitMoments(game){
 const snapshot=game?.simulation?.traits,rows=game?.boxScore?.players||[];if(!snapshot?.players)return [];
 const moments=[];
 for(const stats of rows){
  const id=stats.playerId,row=snapshot.players[id];if(!row||stats.minutes===0)continue;
  const ids=row.ids||[],notes=row.closingNotes||[],changes=row.statChanges||{},shift=row.firstAdjustment||0;
  const add=(trait,title,text,phase,tone,priority)=>moments.push(traitMoment(id,trait,title,text,phase,tone,priority));
  if(ids.includes('clutch')&&row.closingMargin>0&&notes.includes('Clutch close-game lift'))add('clutch','Clutch answered the moment.','A tight halftime score brought out a positive closing response.','Halftime response','positive',100);
  if(ids.includes('crashout')&&notes.includes('Crashout: calm response'))add('crashout','Your calm call helped settle the tilt.','Trailing by at least six, this player responded to Stay composed with a positive trait adjustment.','Your coaching call','positive',110);
  if(ids.includes('crashout')&&notes.includes('Crashout tilt under pressure'))add('crashout','Pressure fed the frustration.','With the team down at least six, the pressure call triggered a negative trait adjustment.','Your coaching call','negative',105);
  if(ids.includes('nervous')&&notes.includes('Nervous: calm reduced the penalty'))add('nervous','Your calm call eased the nerves.','Stay composed softened the Nervous penalty in a close game. The penalty was reduced, not erased.','Your coaching call','mixed',95);
  if(ids.includes('nervous')&&notes.includes('Nervous close-game penalty'))add('nervous','The tight game tested the nerves.','The close halftime score triggered a negative closing response. A calm call could soften that tradeoff next time.','Halftime response','negative',85);
  const extraRebounds=Math.max(0,changes.reb||0),extraSteals=Math.max(0,changes.stl||0);
  if(ids.includes('hustler')&&(extraRebounds||extraSteals))add('hustler','Hustler showed up in the dirty work.',`Traits lifted this player’s share${extraRebounds?' by '+extraRebounds+' rebound'+(extraRebounds===1?'':'s'):''}${extraRebounds&&extraSteals?' and':''}${extraSteals?' by '+extraSteals+' steal'+(extraSteals===1?'':'s'):''}.`,'Final box score','positive',75);
  if(ids.includes('jumpy')&&(changes.blk||0)>0)add('jumpy','Jumpy showed up at the rim.',`The trait lifted this player’s share of the team’s blocks by ${changes.blk}.`,'Final box score','positive',70);
  if(ids.includes('hacker')&&shift<0)add('hacker','Pressure tested the discipline.','The pressure approach brought out a discipline penalty instead of an execution lift.','Game execution','negative',80);
  else if(ids.includes('hacker')&&shift>0)add('hacker','Aggressive hands found an edge.',`The pressure approach gave this player an execution lift.${extraSteals?' The steal allocation also rose by '+extraSteals+'.':''}`,'Game execution','positive',70);
  if(ids.includes('streaky')&&Math.abs(shift)>.015){const hot=shift>0;add('streaky',hot?'Streaky ran hot.':'Streaky ran cold.',hot?'The trait amplified an above-normal execution roll.':'The trait amplified a below-normal execution roll.','Game execution',hot?'positive':'negative',65);}
  if(ids.includes('flashy')&&Math.abs(shift)>.015)add('flashy',shift>0?'The flair found its rhythm.':'The flair came with a cost.',shift>0?'Flashy lifted an above-normal execution roll.':'Flashy deepened a below-normal execution roll.','Game execution',shift>0?'positive':'negative',60);
  if(ids.includes('cocky')&&Math.abs(shift)>.015)add('cocky',shift>0?'Confidence carried over.':'Confidence took a knock.',shift>0?'The previous program win gave this player a Cocky execution lift.':'The previous program loss gave this player a Cocky execution dip.','Game execution',shift>0?'positive':'negative',60);
  if(ids.includes('hates-cardio')&&(row.fatigue||0)>0){const cost=row.fatigueByTrait?.['hates-cardio'];add('hates-cardio','The legs needed managing.',cost?`Hates Cardio cost ${cost} extra energy in this rotation.`:`This player’s traits cost ${row.fatigue} extra energy, including the Hates Cardio effect.`,'Energy management','negative',50);}
 }
 return moments.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
}
function traitHalftimeCues(sim,half,ids){
 const snapshot=sim?.traits;if(!snapshot?.players||!half)return [];
 const gap=half.us-half.them,cues=[];
 for(const id of ids){const traits=snapshot.players[id]?.ids||[];
  if(Math.abs(gap)<=6&&traits.includes('clutch'))cues.push(traitMoment(id,'clutch','This is a Clutch situation.','Keeping this player in the closing five can bring a positive close-game response.','Coach’s read','positive',80));
  if(Math.abs(gap)<=6&&traits.includes('nervous'))cues.push(traitMoment(id,'nervous','A calm huddle can help.','Nervous has a close-game downside. Stay composed softens it if this player closes.','Coach’s read','mixed',95));
  if(gap<=-6&&traits.includes('crashout'))cues.push(traitMoment(id,'crashout','Steady the player before the push.','At this deficit, pressure can trigger tilt. Stay composed can turn the response positive.','Coach’s read','mixed',100));
  if(['pace','press'].includes(S.tactic)&&traits.includes('hates-cardio'))cues.push(traitMoment(id,'hates-cardio','Watch the legs.','This high-energy approach costs Hates Cardio extra energy. Consider the closing rotation.','Coach’s read','mixed',60));
 }
 return cues.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
}
function traitMomentCards(moments,limit=3){
 const chosen=[],seen=new Set();for(const m of moments){if(seen.has(m.playerId))continue;chosen.push(m);seen.add(m.playerId);if(chosen.length===limit)break;}
 return chosen.map(m=>{const name=player(m.playerId)?.n||'Player';return `<article class="trait-moment tone-${m.tone}"><div class="trait-moment-top"><span>${escapeHtml(PLAYER_TRAITS[m.trait]?.name||m.trait)}</span><small>${escapeHtml(m.phase)}</small></div><b class="trait-moment-player">${escapeHtml(name)}</b><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.text)}</p></article>`;}).join('');
}
function traitMomentSection(moments,heading,kind){
 if(!moments.length)return kind==='halftime'?'':`<section class="trait-moments"><div class="kicker">FROM THE BENCH</div><h2>A quiet trait night.</h2><p class="small">No notable personality effects were recorded. The matchup and coaching breakdown still explain the game.</p></section>`;
 return `<section class="trait-moments trait-moments-${kind}" aria-label="${kind==='halftime'?'Halftime trait cues':'Game trait moments'}"><div class="kicker">${kind==='halftime'?'FROM YOUR BENCH':'THE PERSONALITY OF THIS GAME'}</div><h2>${heading}</h2><div class="trait-moment-grid">${traitMomentCards(moments,kind==='halftime'?2:3)}</div></section>`;
}
const momentHalftime=halftime;
halftime=function(){momentHalftime();const cues=traitHalftimeCues(S.simulation,S.half,S.five);app.querySelector('main .scoreboard')?.insertAdjacentHTML('beforeend',traitMomentSection(cues,'Coach the personality.','halftime'));};
const momentResult=result;
result=function(){
 momentResult();if(!S.game?.simulation?.traits)return;
 const moments=buildTraitMoments(S.game);S.game.traitMoments=moments;
 // The record and displayed result share the same simulation; older saves need no replay.
 const record=S.statLog[0];if(record?.simulation===S.game.simulation)record.traitMoments=moments;
 app.querySelector('main .scoreboard')?.insertAdjacentHTML('afterend',traitMomentSection(moments,'The traits behind the night.','final'));
};
const momentSeasonStats=seasonStats;
seasonStats=function(){momentSeasonStats();const games=S.statLog.filter(g=>g.traitMoments?.length);
 if(!games.length)return;
 app.querySelector('main')?.insertAdjacentHTML('beforeend',`<section class="trait-moments"><div class="kicker">YOUR PROGRAM’S STORY</div><h2>Personality notebook</h2><p class="small">Saved effects from your most recent games.</p>${games.slice(0,5).map(g=>`<details class="box trait-notebook"><summary>${escapeHtml(g.opponent)} · ${g.us}–${g.them} · ${g.win?'W':'L'}</summary><div class="trait-moment-grid">${traitMomentCards(g.traitMoments)}</div></details>`).join('')}</section>`);
};
