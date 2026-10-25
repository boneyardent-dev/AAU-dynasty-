// Persistent fictional game personalities. No printed ratings, odds or ownership changes.
const PLAYER_TRAITS={
 'gym-rat':{name:'Gym Rat',family:'work',description:'Learns faster in the gym: 20% more XP from specialist and support training. Game and offseason XP stay the same.'},
 hustler:{name:'Hustler',family:'work',description:'Chases extra chances: 15% more rebounding and steal allocation weight, at the cost of 1 extra energy for a full game in the starting units.'},
 'hates-cardio':{name:'Hates Cardio',family:'work',description:'Manage their bursts. A full game in the starting units costs 3 extra energy with Run & Gun or Full-Court Pressure, otherwise 1 extra energy.'},
 flashy:{name:'Flashy',family:'court',description:'High-risk flair: strong execution rolls get a lift; off games get a matching penalty. More upside, more mistakes.'},
 cocky:{name:'Cocky',family:'court',description:'Rides confidence: execution lifts after the program’s last win and dips after its last loss. Neutral before the first game.'},
 jumpy:{name:'Jumpy',family:'court',description:'Bouncy but impatient: 15% more block allocation weight and wider execution swings. Costs 1 extra energy for a full game in the starting units.'},
 crashout:{name:'Crashout',family:'court',description:'Tilt risk when down 6 or more at halftime: pressure costs 1 point of second-half margin; staying composed adds 0.4 instead.'},
 hacker:{name:'Hacker',family:'court',description:'Aggressive hands: pressure lifts good execution and steal allocation weight. An off roll brings a discipline penalty instead; pressure costs 1 extra energy.'},
 clutch:{name:'Clutch',family:'court',description:'Handles a tight game: adds 0.8 second-half margin while in the closing five when the halftime gap is 6 or fewer.'},
 nervous:{name:'Nervous',family:'court',description:'Feels a tight game: subtracts 0.8 second-half margin while in the closing five when the halftime gap is 6 or fewer. Staying composed reduces the penalty to 0.3.'},
 streaky:{name:'Streaky',family:'court',description:'Bigger swings: game execution varies 35% more around normal. Hot nights and cold nights both become more pronounced.'}
};
function traitState(){if(!D.playerTraits||D.playerTraits.v!==1)D.playerTraits={v:1,players:{}};return D.playerTraits;}
function playerTraitIDs(id,commit=false){
 if(!players.some(p=>p.id===id))return [];
 const saved=D.playerTraits?.players?.[id];
 if(Array.isArray(saved))return [...new Set(saved.filter(key=>PLAYER_TRAITS[key]))].slice(0,2);
 const choose=family=>{const pool=Object.keys(PLAYER_TRAITS).filter(key=>PLAYER_TRAITS[key].family===family);return pool[circuitHash(id+':traits:v1:'+family)%pool.length]};
 const ids=[choose('work'),choose('court')];if(commit)traitState().players[id]=ids;return ids;
}
function hasPlayerTrait(id,key){return playerTraitIDs(id).includes(key);}
const traitsRestore=storeAccountSnapshot;
storeAccountSnapshot=function(data){traitsRestore(data);D.playerTraits=data?.director?.playerTraits;};
function traitChips(id){return `<div class="trait-chips" aria-label="Game traits">${playerTraitIDs(id).map(key=>`<span>${PLAYER_TRAITS[key].name}</span>`).join('')}</div>`;}
function traitPanel(id){return `${traitChips(id)}<details class="trait-details"><summary>How these traits affect play</summary>${playerTraitIDs(id).map(key=>`<p><b>${PLAYER_TRAITS[key].name}</b> · ${PLAYER_TRAITS[key].description}</p>`).join('')}</details>`;}
function traitTrainingXP(id,base){return hasPlayerTrait(id,'gym-rat')?Math.round(base*1.2):base;}
const traitsAward=awardDevelopment;
awardDevelopment=function(id,xp,weights,reason,source='game'){
 const training=source==='training'||source==='support';playerTraitIDs(id,true);
 const actual=training?traitTrainingXP(id,xp):xp,award=traitsAward(id,actual,weights,reason,source);
 if(award&&actual!==xp){award.traitXP=actual-xp;const p=developmentProfile(id);p.history[0].traitXP=actual-xp;}
 return award;
};
// Capture individual effects before either score is calculated; rereading a report never rerolls.
function preparePlayerTraits(rolls){
 const snapshot={v:1,players:{},closingMargin:0};
 for(const id of S.pick){
  const ids=playerTraitIDs(id,true),raw=rolls[id],notes=[];let shift=0;
  if(ids.includes('flashy')){shift+=raw>=1?.05:-.05;notes.push(raw>=1?'Flashy execution lift':'Flashy execution risk');}
  if(ids.includes('cocky')&&S.statLog.length){const won=S.statLog[0].win;shift+=won?.04:-.04;notes.push(won?'Cocky confidence after a win':'Cocky confidence dip after a loss');}
  if(ids.includes('jumpy')){shift+=raw>=1?.03:-.03;notes.push('Jumpy timing swing');}
  if(ids.includes('streaky')){shift+=(raw-1)*.35;notes.push('Streaky execution swing');}
  if(ids.includes('hacker')&&S.tactic==='press'){shift+=raw<.9?-.06:.03;notes.push(raw<.9?'Hacker discipline risk':'Hacker pressure edge');}
  rolls[id]=Math.max(.6,Math.min(1.4,raw+shift));
  snapshot.players[id]={ids,baseExecution:raw,execution:rolls[id],firstAdjustment:rolls[id]-raw,closingMargin:0,fatigue:0,notes};
 }
 return snapshot;
}
function traitClosingMargin(sim,call){
 const traits=sim.traits;if(!traits)return 0;
 const gap=S.half.us-S.half.them,close=Math.abs(gap)<=6;let margin=0;
 for(const [id,row] of Object.entries(traits.players)){
  row.closingMargin=0;row.closingNotes=[];if(!S.five.includes(id))continue;
  if(close&&row.ids.includes('clutch')){row.closingMargin+=.8;row.closingNotes.push('Clutch close-game lift');}
  if(close&&row.ids.includes('nervous')){row.closingMargin-=call==='calm'?.3:.8;row.closingNotes.push(call==='calm'?'Nervous: calm reduced the penalty':'Nervous close-game penalty');}
  if(gap<=-6&&row.ids.includes('crashout')){
   if(call==='pressure'){row.closingMargin-=1;row.closingNotes.push('Crashout tilt under pressure');}
   if(call==='calm'){row.closingMargin+=.4;row.closingNotes.push('Crashout: calm response');}
  }
  margin+=row.closingMargin;
 }
 traits.closingMargin=Math.max(-2.5,Math.min(2.5,margin));return traits.closingMargin;
}
function traitFatigue(id,opening,closing){
 const row=S.game?.simulation?.traits?.players?.[id]||S.simulation?.traits?.players?.[id];
 if(!row)return 0;
 const share=(Number(opening.includes(id))+Number(closing.includes(id)))/2;
 const extra=(row.ids.includes('hustler')?1:0)+(row.ids.includes('jumpy')?1:0)+(row.ids.includes('hates-cardio')?(['pace','press'].includes(S.tactic)?3:1):0)+(row.ids.includes('hacker')&&S.tactic==='press'?1:0);
 row.fatigue=extra*share;return row.fatigue;
}
const traitsBox=buildBoxScore;
buildBoxScore=function(us,them){
 const box=traitsBox(us,them),rows=box.players;if(!rows.length)return box;
 const snapshot=S.game?.simulation?.traits||S.simulation?.traits;
 const factor=(row,key)=>{const ids=snapshot?.players?.[row.playerId]?.ids||playerTraitIDs(row.playerId);let n=1;
  if((key==='reb'||key==='stl')&&ids.includes('hustler'))n*=1.15;
  if(key==='blk'&&ids.includes('jumpy'))n*=1.15;
  if(key==='stl'&&ids.includes('hacker')&&S.tactic==='press')n*=snapshot?.players?.[row.playerId]?.firstAdjustment<0?.85:1.15;
  return n;};
 for(const key of ['reb','stl','blk']){if(!rows.some(row=>factor(row,key)!==1))continue;const allocated=statAllocation(box.totals[key],rows,row=>row[key]*factor(row,key));rows.forEach((row,i)=>row[key]=allocated[i]);}
 rows.forEach(row=>row.traits=[...(snapshot?.players?.[row.playerId]?.ids||playerTraitIDs(row.playerId))]);return box;
};
const traitsDevelopmentCard=developmentCard;
developmentCard=function(id){let html=traitsDevelopmentCard(id).replace('<div class="dev-level"',traitPanel(id)+'<div class="dev-level"');
 if(hasPlayerTrait(id,'gym-rat'))html=html.replaceAll('· 60 XP · 14 pts','· 72 XP · 14 pts');return html;};
const traitsLineupCard=lineupCard;
lineupCard=function(id,slot){return traitsLineupCard(id,slot).replace('</h3>','</h3>'+traitChips(id));};
const traitsHQ=hqDevelopment;
hqDevelopment=function(){return traitsHQ()+`<p class="small">Gym Rat grants 20% extra specialist/support training XP. Other traits influence game execution, fatigue and close-game response.</p>${button('Trait guide →','playerTraitsRoom()','alt')}`;};
const traitsDevelopmentRoom=playerDevelopmentRoom;
playerDevelopmentRoom=function(){traitsDevelopmentRoom();if(S.screen==='development')app.querySelector('main')?.insertAdjacentHTML('afterbegin',`<div class="row">${button('Trait guide →','playerTraitsRoom()','alt')}</div>`);};
function playerTraitsRoom(){
 if(['half','result'].includes(S.screen))return;S.screen='traits';
 frame(`<section class="hero dev-hero"><div class="kicker">PLAYER PERSONALITY</div><h1>Coach the person.<br>Build the team.</h1><p class="lede">Two persistent game traits give each player habits, strengths and tradeoffs. Your lineup and halftime call can bring out their best.</p><p class="small">Fictional game traits. They do not change printed card ratings or physical growth. Tight-game effects use the halftime score; combined second-half effects are capped at ±2.5 points.</p></section><div class="dev-grid">${Object.values(PLAYER_TRAITS).map(t=>`<section class="box"><div class="kicker">${t.family==='work'?'WORK HABIT':'COURT PERSONALITY'}</div><h3>${t.name}</h3><p class="small">${t.description}</p></section>`).join('')}</div>${button('← Player development','playerDevelopmentRoom()','alt')}`);
}
const traitsHalftime=halftime;
halftime=function(){traitsHalftime();const sim=S.simulation;if(!sim?.traits)return;
 const notes=S.five.flatMap(id=>{const ids=sim.traits.players[id]?.ids||[];return ids.some(key=>['clutch','nervous','crashout','hates-cardio'].includes(key))?[`<p class="small"><b>${escapeHtml(player(id).n)}</b> · ${ids.map(key=>PLAYER_TRAITS[key].name).join(' / ')}</p>`]:[]});
 app.querySelector('main')?.insertAdjacentHTML('beforeend',`<section class="box trait-huddle"><h3>Know your closing group</h3>${notes.join('')||'<p class="small">Check player traits when planning your next rotation.</p>'}<p class="small">Clutch and Nervous respond to a halftime gap of 6 or fewer. Staying composed softens Nervous; it also steadies Crashout when trailing by 6 or more. High-energy approaches cost Hates Cardio more.</p></section>`);
};
const traitsResult=result;
result=function(){traitsResult();const sim=S.game?.simulation;if(!sim?.traits)return;
 const playing=new Set(S.game.boxScore.players.map(p=>p.playerId));
 app.querySelector('main')?.insertAdjacentHTML('beforeend',`<section class="box trait-recap"><div class="kicker">PERSONALITY IN PLAY</div><h3>Traits shaped the night.</h3><p class="small">Combined close-game response: ${sim.traits.closingMargin>=0?'+':''}${sim.traits.closingMargin.toFixed(1)} second-half margin (capped at ±2.5).</p><div class="dev-awards">${Object.entries(sim.traits.players).filter(([id])=>playing.has(id)).map(([id,row])=>`<div><b>${escapeHtml(player(id).n)}</b><span>${row.ids.map(key=>PLAYER_TRAITS[key].name).join(' · ')}</span><small>${[...row.notes,...(row.closingNotes||[])].join(' · ')||'No situational execution effect this game.'}${row.fatigue?' · '+row.fatigue.toFixed(1)+' extra energy':''}</small></div>`).join('')}</div></section>`);
};
const traitsGuide=simulationGuide;
simulationGuide=function(){return traitsGuide().replace('from 0.75–1.25','from 0.75–1.25 before trait adjustments (final range 0.60–1.40)').replace('</details>','<h3>Player traits</h3><p>Work habits affect training or fatigue. Court personalities can shift execution, defensive stat shares and close-game response. Trait margin effects are capped at ±2.5 in the second half. Individual effects are recorded in the postgame recap; permanent attributes and printed cards stay separate.</p></details>');};
