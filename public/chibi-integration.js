// Main-game bridge. The v0.6 court owns temporary simulation state only.
let chibiSession=null;
let chibiPendingResult=null;
let chibiValidateResult=null;
function chibiStop(){if(chibiSession){chibiSession.stop();chibiSession=null;}chibiValidateResult=null;}
function chibiResultReady(result){
 const validation=chibiValidateResult?.(result,chibiSession?.broadcast?.teams||[]);
 if(!validation?.ok){chibiPendingResult=null;const status=document.getElementById('chibi-status');if(status)status.textContent=`The court finished, but its result could not be validated: ${validation?.error||'unknown validation error'}`;console.error('Chibi result validation:',validation);return;}
 chibiPendingResult=JSON.parse(JSON.stringify(result));
 const top=[...(result.teams?.[0]?.players||[])].sort((a,b)=>(b.points+b.assists+b.rebounds)-(a.points+a.assists+a.rebounds)).slice(0,2);
 const preview=top.map(p=>`${p.name} +${12+Math.min(24,Math.round(p.points*.35+p.rebounds*.7+p.assists)) + 32} XP`).join(' · ');
 const status=document.getElementById('chibi-status');if(status){status.textContent=preview?`Validated result ready · LIGHTWEIGHT PROGRESSION: ${preview}`:'Validated result ready.';if(!document.getElementById('chibi-commit'))status.insertAdjacentHTML('afterend',' <button id="chibi-commit" class="btn" onclick="chibiCommitResult()">Record game + apply development XP</button>');}
}
function chibiCommitResult(){
 const result=chibiPendingResult;if(!result||S.game?.chibiCommitId)return;
 const validation=chibiValidateResult?.(result,chibiSession?.broadcast?.teams||[]);if(!validation?.ok)return;
 const team=result.teams[0],opponent=result.teams[1],us=result.finalScore[0],them=result.finalScore[1];
 const rows=team.players.map(p=>({playerId:p.playerId,name:p.name,position:player(p.playerId)?.p||'G',minutes:32,pts:p.points,reb:p.rebounds,ast:p.assists,stl:p.steals,blk:0,threeMade:p.threeMade,threeAttempts:p.threeAttempts,threeRating:player(p.playerId)?.s||0,threeStyle:'Chibi match'}));
 const boxScore={players:rows,totals:{minutes:160,pts:us,reb:rows.reduce((n,p)=>n+p.reb,0),ast:rows.reduce((n,p)=>n+p.ast,0),stl:rows.reduce((n,p)=>n+p.stl,0),blk:0,threeMade:rows.reduce((n,p)=>n+p.threeMade,0),threeAttempts:rows.reduce((n,p)=>n+p.threeAttempts,0)},estimatedMinutes:true,threePointVersion:1,chibiVersion:1};
 S.opp={n:opponent.name,o:0,d:0,q:0};S.game={chibiCommitId:`${result.seed}:${us}-${them}`,us,them,win:us>them,call:'calm',simulation:{chibi:true,seed:result.seed,possessions:result.possessions,openingFive:[...S.five],closingFive:[...S.five],traits:null},boxScore};
 const record={id:`chibi-w${S.week+1}-g${S.statLog.length+1}-${result.seed}`,week:S.week+1,event:events[S.week]?.[0]||'Season game',stage:S.mode==='pool'?`Pool game ${S.poolAt+1}`:'Chibi match',team:programs[S.team]?.n||team.name,opponent:opponent.name,us,them,win:S.game.win,boxScore,simulation:S.game.simulation,starters:[...S.five]};
 S.statLog.unshift(record);if(typeof awardDevelopmentGame==='function')awardDevelopmentGame(record);S.game.development=record.development;
 S.wins+=S.game.win?1:0;S.losses+=S.game.win?0:1;D.lastReward=S.game.win?12:8;D.points+=D.lastReward;S.five.forEach(id=>D.loyalty[id]=Math.max(35,loyalty(id)+(S.game.win?1:-2)));S.energy&&S.five.forEach(id=>S.energy[id]=Math.max(0,(S.energy[id]??100)-13));
 saveAll();if(typeof inventoryChange==='function')inventoryChange(c=>{if(!(typeof aauVault!=='undefined'&&aauVault.enabled)){c.matches=(c.matches||0)+1;if(c.matches%3===0)c.packs=(c.packs||0)+1}}).catch(()=>{});if(typeof syncAccountSave==='function')syncAccountSave();const status=document.getElementById('chibi-status');if(status)status.textContent='Game recorded in your dynasty.';document.getElementById('chibi-commit')?.remove();result();
}
function chibiTeams(samples){
 const roster=[...new Set(S.pick)].map(player).filter(Boolean);
 if(roster.length<5)return JSON.parse(JSON.stringify(samples));
 const starters=[...new Set(S.five)].filter(id=>roster.some(p=>p.id===id));
 const ids=[...starters,...roster.map(p=>p.id).filter(id=>!starters.includes(id))].slice(0,5);
 const convert=p=>({...p,name:p.n,position:p.catalog?.position||p.p,avatar:p.catalog?.avatar});
 const opposing=players.filter(p=>!ids.includes(p.id)&&(p.catalog?.isFictional||p.catalog?.originalSeries)).slice(0,5).map(p=>convert(player(p.id)));
 if(opposing.length!==5)throw Error('Five distinct opponents are required.');
 return [{name:programs[S.team]?.n||'Your program',players:ids.map(id=>convert(player(id)))},{name:'Circuit Select',players:opposing}];
}
function chibiStart(){
 chibiStop();if(typeof t3Stop==='function')t3Stop();S.screen='chibi';
 const hasRoster=[...new Set(S.pick)].map(player).filter(Boolean).length>=5;
 frame(`<section><div class="kicker">CIRCUIT ORIGINALS / FIVE ON FIVE</div><h1>3D CHIBI COURTSIDE.</h1><p>${hasRoster?'Your starting five and current player ratings. Change your lineup in the roster screen.':'Original v0.6 sample teams. Draft five players to watch your own roster.'}</p><p class="small">Ten players · 12-possession preview · shoulder, broadcast and tactical cameras. Finish a game, then choose whether to record it and apply lightweight development XP.</p><div class="row"><button class="btn alt" onclick="home()">Back to lobby</button></div><p id="chibi-status" role="status">Loading the court…</p><iframe id="chibi-court" title="Ten-player 3D Chibi v0.6 gameplay" src="/chibi-v0.6/index.html" onload="chibiConnect(this)" style="display:block;width:100%;height:1100px;height:min(1100px,85vh);min-height:560px;border:0;margin-top:20px" allow="autoplay"></iframe></section>`);
}
function chibiConnect(iframe){
 if(!iframe.isConnected||S.screen!=='chibi')return;
 const status=document.getElementById('chibi-status');
 try{
  const w=iframe.contentWindow;
  const style=w.document.createElement('style');
  style.textContent='body{padding:0}main>.eyebrow,main>h1,main>.intro{display:none}.court-shell{margin:0 auto}';
  w.document.head.append(style);
  chibiPendingResult=null;
  chibiValidateResult=w.AAUCourt.validateResult;
  chibiSession=w.AAUCourt.mount(w.document.getElementById('court'),chibiTeams(w.AAUChibiSampleTeams),{onExit:()=>home(),onComplete:chibiResultReady});
  status.textContent='3D Chibi v0.6 · five players per team';
 }catch(error){status.textContent='The court could not start. Return to the lobby and try again.';console.error('Chibi startup:',error);}
}
const chibiFrameBase=frame;
frame=function(html){chibiStop();return chibiFrameBase(html);};
const chibiHomeBase=home;
 home=function(){chibiHomeBase();app.querySelector('main')?.insertAdjacentHTML('afterbegin',`<section class="t3-lobby"><div><div class="kicker">MAIN GAMEPLAY / 3D CHIBI v0.6</div><h2>FIVE ON FIVE. COURTSIDE.</h2><p>Ten articulated players · special dunks · shoulder camera</p><p class="small">12-possession gameplay preview. Season progression remains separate. Use Player Lab to isolate one animated player in an empty gym.</p></div><div class="row"><button class="btn" onclick="chibiStart()">PLAY 5 × 5 ↗</button><button class="btn alt" onclick="location.href='/player-lab/'">PLAYER LAB ↗</button></div></section>`);};
