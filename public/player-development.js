// Dynasty development is saved with the director, separate from collectible editions.
const DEVELOPMENT_SKILLS=[['handling','Ball handling'],['athleticism','Athleticism'],['shooting','Shooting'],['defense','Defense'],['bag','Bag work'],['iq','Basketball IQ']];
function developmentState(){
  if(!D.development||D.development.v!==1)D.development={v:1,season:1,players:{},reports:[],offseason:null};
  return D.development;
}
const developmentRestore=storeAccountSnapshot;
storeAccountSnapshot=function(data){developmentRestore(data);D.development=data?.director?.development;};
const developmentBasePlayer=player;
function developmentProfile(id,commit=false){
  const stored=D.development?.players?.[id];if(stored)return stored;
  const p=developmentBasePlayer(id);if(!p)return null;
  const seed=circuitHash((accountId||'local')+':development:'+id),values=cardAttributes(players.find(x=>x.id===id)||p);
  const base=Object.fromEntries(DEVELOPMENT_SKILLS.map(([key],i)=>[key,values[i]]));
  const fresh={seed,xp:0,games:0,training:0,seasons:0,age:Math.max(14,Math.min(17,18-((Number(p.catalog?.classYear)||2028)-2027))),
    base,ceilings:Object.fromEntries(DEVELOPMENT_SKILLS.map(([key])=>[key,Math.min(99,Math.max(base[key],base[key]+3+circuitHash(seed+':'+key)%16))])),
    gains:Object.fromEntries(DEVELOPMENT_SKILLS.map(([key])=>[key,0])),skillXP:{},attempts:{},heightGain:0,weightGain:0,history:[]};
  if(commit)developmentState().players[id]=fresh;
  return fresh;
}
function developmentThreshold(p,key){return 60+(p.gains[key]||0)*12;}
function developmentValues(id){const p=developmentProfile(id);return p?DEVELOPMENT_SKILLS.map(([key])=>Math.min(99,p.base[key]+p.gains[key])):[];}
function developmentLevel(p){return 1+Math.floor(p.xp/100);}
function developmentHistory(p,entry){p.history.unshift({season:developmentState().season,...entry});p.history=p.history.slice(0,40);}
function awardDevelopment(id,xp,weights,reason,source='game'){
  const p=developmentProfile(id,true);if(!p||!Number.isFinite(xp)||xp<=0)return null;
  const skills=DEVELOPMENT_SKILLS.map(([key])=>key),sum=skills.reduce((n,key)=>n+Math.max(0,weights[key]||0),0);if(!sum)return null;
  const changes=[],beforeLevel=developmentLevel(p);p.xp+=xp;
  for(const key of skills){
    p.skillXP[key]=(p.skillXP[key]||0)+xp*Math.max(0,weights[key]||0)/sum;
    while(p.skillXP[key]>=developmentThreshold(p,key)){
      p.skillXP[key]-=developmentThreshold(p,key);p.attempts[key]=(p.attempts[key]||0)+1;
      const before=p.base[key]+p.gains[key],room=p.ceilings[key]-before;
      const roll=circuitHash(p.seed+':'+key+':'+p.attempts[key])%100;
      // A development opportunity can plateau; its outcome is saved, never rerolled on reload.
      const gain=room<=0||roll<18?0:Math.min(room,roll>=88?2:1);
      p.gains[key]+=gain;changes.push({key,before,after:before+gain,status:gain===2?'Breakthrough':gain?'Improved':'Plateau'});
    }
  }
  developmentHistory(p,{reason,xp,changes,level:developmentLevel(p)});
  return {id,xp,beforeLevel,level:developmentLevel(p),changes};
}
player=function(id){
  const p=developmentBasePlayer(id),d=D.development?.players?.[id];if(!p||!d)return p;
  const bounded=(stat,gain)=>Math.min(99,Math.max(40,p[stat]+gain));
  const result={...p,s:bounded('s',d.gains.shooting),pa:bounded('pa',(d.gains.handling+d.gains.bag)/2),d:bounded('d',d.gains.defense),q:bounded('q',d.gains.iq),a:bounded('a',d.gains.athleticism)};
  if(p.catalog){result.catalog={...p.catalog};const h=physInches(p.catalog.height);if(h!==null&&d.heightGain)result.catalog.height=physFmt(h+d.heightGain);if(Number.isFinite(p.catalog.weight))result.catalog.weight=p.catalog.weight+d.weightGain;}
  return result;
};
// Minutes are estimated rotation shares, not a possession simulation. Five players × 32 minutes.
const developmentBox=buildBoxScore;
buildBoxScore=function(us,them){
  const box=developmentBox(us,them),rows=box.players;if(!rows.length)return box;
  const ps=rows.map(row=>player(row.playerId)),opening=S.game?.simulation?.openingFive||S.simulation?.openingFive||S.five,closing=S.five;
  const halfMinutes=ids=>{const reserves=rows.filter(row=>!ids.includes(row.playerId)).length;
    return statAllocation(80,ps,p=>ids.includes(p.id)?(80-reserves*4)/5:4);};
  const first=halfMinutes(opening),second=halfMinutes(closing);
  rows.forEach((row,i)=>{row.minutes=first[i]+second[i];row.openingMinutes=first[i];row.closingMinutes=second[i];});
  const weight=(p,i)=>rows[i].minutes;
  const alloc=(total,skill)=>statAllocation(total,ps,p=>{const i=ps.findIndex(x=>x.id===p.id);return weight(p,i)*Math.max(1,skill(p));});
  const values={pts:alloc(us,p=>(p.s*.48+p.pa*.2+p.q*.18+p.a*.14)*(S.simulation?.rolls[p.id]||1)),
    reb:alloc(box.totals.reb,p=>physProfile(p).rebound*(p.p.includes('B')?1.4:1)),ast:alloc(box.totals.ast,p=>p.pa*.55+p.q*.45),
    stl:alloc(box.totals.stl,p=>p.d*.55+p.a*.45),blk:alloc(box.totals.blk,p=>p.d*(p.p.includes('B')?2:1))};
  rows.forEach((row,i)=>Object.keys(values).forEach(key=>row[key]=values[key][i]));box.totals.minutes=160;box.estimatedMinutes=true;return box;
};
function awardDevelopmentGame(g){
  if(g.development)return g.development;
  g.development=[];g.season=developmentState().season;
  for(const row of g.boxScore.players){
    if(!row.minutes||row.minutes<=0)continue;
    const production=Math.min(24,Math.round(row.pts*.35+row.reb*.7+row.ast+row.stl*2+row.blk*2));
    const xp=12+Math.round(row.minutes)+production;
    const weights={handling:2+row.ast,athleticism:2+row.reb*.4,shooting:2+row.pts*.35,defense:2+row.reb*.5+row.stl*2+row.blk*2,bag:2+row.pts*.15+row.ast*.5,iq:3+row.ast};
    const award=awardDevelopment(row.playerId,xp,weights,'Game vs. '+g.opponent);
    developmentProfile(row.playerId,true).games++;g.development.push({...award,minutes:row.minutes,productionXP:production});
  }
  return g.development;
}
const developmentRecord=recordGameStats;
recordGameStats=function(){developmentRecord();awardDevelopmentGame(S.statLog[0]);saveAll();};
// Existing paid specialist sessions now award focused experience rather than unlimited flat ratings.
trainingSession=function(trainerId,id){
  const t=trainers.find(x=>x.id===trainerId);
  if(!t||!D.trainers.includes(trainerId)||D.points<14||!player(id)||(!S.pick.includes(id)&&!D.signed.includes(id))||['half','result'].includes(S.screen))return;
  const focus={s:'shooting',pa:'handling',d:'defense',a:'athleticism',q:'iq'}[t.stat];
  D.points-=14;awardDevelopment(id,60,{[focus]:1},t.label+' training','training');
  const p=developmentProfile(id,true);p.training++;D.trainingSessions=(D.trainingSessions||0)+1;D.loyalty[id]=Math.min(100,loyalty(id)+6);saveAll();directorOffice();
};
// Preserve already-owned support-card effects. Successful sessions also teach the player.
const developmentSupport=useCircuitTrainer;
useCircuitTrainer=async function(id){if(supportBusy||['half','result'].includes(S.screen))return;const before=inventoryRead().support?.shooting||0;await developmentSupport(id);
  if((inventoryRead().support?.shooting||0)<before){awardDevelopment(id,30,{shooting:1},'Shooting support session','support');developmentProfile(id,true).training++;saveAll();await syncAccountSave();}};
const developmentHQ=hqDevelopment;
hqDevelopment=function(){let html=developmentHQ();for(const t of trainers)html=html.replace('+4 '+t.label+' and +6 loyalty per session.','60 focused '+t.label.toLowerCase()+' XP and +6 loyalty per session.');return `<div class="row">${button('Player development →','playerDevelopmentRoom()','alt')}</div>`+html;};
function developmentLink(){return `<div class="row">${button('Player development ↗','playerDevelopmentRoom()','alt')}${D.development?.offseason?button('Offseason report →','developmentOffseason()'):''}</div>`;}
const developmentRoster=roster;
roster=function(){developmentRoster();app.querySelector('main')?.insertAdjacentHTML('afterbegin',developmentLink());};
const developmentHome=home;
home=function(){developmentHome();app.innerHTML=app.innerHTML.replace('SEASON 01 / WEEK','SEASON '+String(D.development?.season||1).padStart(2,'0')+' / WEEK');app.querySelector('main')?.insertAdjacentHTML('afterbegin',developmentLink());};
const developmentResult=result;
result=function(){developmentResult();const awards=S.statLog[0]?.development;if(!awards)return;
  app.querySelector('main')?.insertAdjacentHTML('beforeend',`<section class="box dev-postgame"><div class="kicker">PLAYER DEVELOPMENT</div><h3>Production becomes progress.</h3><p class="small">Estimated rotation minutes and capped scoring, playmaking, rebounding and defensive production earn XP. Level milestones track experience; individual skills improve at their own pace.</p><div class="dev-awards">${awards.map(a=>`<div><b>${escapeHtml(player(a.id).n)}</b><span>${a.minutes} MIN · +${a.xp} XP${a.level>a.beforeLevel?' · LEVEL '+a.level:''}</span><small>${a.changes.map(c=>`${DEVELOPMENT_SKILLS.find(x=>x[0]===c.key)[1]} ${c.before} → ${c.after} (${c.status})`).join(' · ')||'Building experience toward the next skill opportunity.'}</small></div>`).join('')}</div><p class="small">After continuing, open Player development from your roster or lobby.</p></section>`);
};
function developmentCard(id){
  const p=player(id),d=developmentProfile(id),physical=physProfile(p),level=developmentLevel(d);
  return `<article class="box dev-player"><div class="dev-player-head">${playerPortrait(p)}<div><div class="kicker">LEVEL ${level} · ${d.xp} XP</div><h3>${escapeHtml(p.n)}</h3><p class="small">Simulated age ${d.age} · ${physFmt(physical.inches)}${physical.hKnown?'':' (est.)'} · ${physical.lbs} lbs${physical.wKnown?'':' (est.)'}</p><p class="small">${d.games} games · ${d.training} training sessions</p></div></div><div class="dev-level" role="progressbar" aria-label="${escapeHtml(p.n)} level progress" aria-valuenow="${d.xp%100}" aria-valuemin="0" aria-valuemax="100"><i style="width:${d.xp%100}%"></i></div><p class="small">${100-d.xp%100} XP to level ${level+1}. Growth differs by skill; levels do not guarantee rating gains.</p><div class="dev-skills">${DEVELOPMENT_SKILLS.map(([key,label])=>{const value=d.base[key]+d.gains[key],cap=value>=d.ceilings[key];return `<div><span>${label}</span><b>${value}${d.gains[key]?` <small>+${d.gains[key]}</small>`:''}</b><small>${cap?'At current ceiling':Math.floor(d.skillXP[key]||0)+' / '+developmentThreshold(d,key)+' skill XP'} · ${d.games<6?'Potential still being observed':cap?'Focus on other strengths':'Room to develop'}</small></div>`;}).join('')}</div><div class="row">${D.trainers.map(trainerId=>trainers.find(t=>t.id===trainerId)).filter(Boolean).map(t=>`<button class="pbtn" ${D.points<14?'disabled':''} onclick="trainingSession('${t.id}','${id}');playerDevelopmentRoom()">${escapeHtml(t.label)} · 60 XP · 14 pts</button>`).join('')||'<span class="small">Hire a specialist in Recruit HQ to focus training.</span>'}</div><details><summary>Development history</summary>${d.history.slice(0,8).map(h=>`<p class="small"><b>Season ${h.season} · ${escapeHtml(h.reason)}</b> · +${h.xp} XP${h.traitXP?` (Gym Rat +${h.traitXP})`:''}<br>${(h.changes||[]).map(c=>`${DEVELOPMENT_SKILLS.find(x=>x[0]===c.key)[1]} ${c.before} → ${c.after} · ${c.status}`).join('<br>')||'Experience gained; skills still developing.'}${h.physical?'<br>'+escapeHtml(h.physical):''}</p>`).join('')||'<p class="small">Play games or train to begin this player’s story.</p>'}</details></article>`;
}
function playerDevelopmentRoom(){
  if(['half','result'].includes(S.screen))return;S.screen='development';
  const ids=[...new Set([...S.pick,...D.signed])].filter(id=>player(id));
  frame(`<section class="hero dev-hero"><div class="kicker">SEASON ${D.development?.season||1} · PROGRAM DEVELOPMENT</div><h1>Develop the next<br>difference maker.</h1><p class="lede">Minutes build experience. Production shapes skills. Training guides the next step.</p><p class="small">${D.points} Director Points · Printed collection cards stay unchanged. All ages, potential and growth here are fictional game simulations.</p>${D.development?.offseason?button('Offseason report →','developmentOffseason()'):''}${button('Recruit HQ →','directorOffice()','alt')}</section><div class="dev-grid">${ids.map(developmentCard).join('')||'<section class="box">Draft or sign players to begin developing your program.</section>'}</div><section class="box"><h3>Every career develops differently</h3><p class="small">Six skills have individual ceilings. A skill opportunity can improve, plateau or produce a two-point breakthrough. Game production XP is capped at 24, so one scorer cannot take all the development. Offseason height changes depend on simulated age and a saved individual growth path, never on points scored. Unknown source heights stay estimated and do not receive invented growth spurts.</p></section>${button('← Return to roster','roster()','alt')}`);
}
// The original final weekend clamps at week 6. Make development an explicit year boundary.
const developmentFinishWeekend=finishWeekend;
finishWeekend=function(champ){
  if(S.screen==='end')return;
  const week=S.week;developmentFinishWeekend(champ);
  if(week===events.length-1){const d=developmentState();if(!d.offseason)d.offseason={season:d.season,roster:[...new Set([...S.pick,...D.signed])],processed:false};saveAll();app.querySelector('main')?.insertAdjacentHTML('afterbegin',`<section class="box"><h2>The season is complete.</h2><p>Review your players’ development and offseason physical changes before the next season.</p>${button('Review offseason →','developmentOffseason()')}</section>`);}
};
function developmentOffseason(){
  const pending=D.development?.offseason;if(!pending||S.screen==='half')return;S.screen='offseason';
  frame(`<section class="hero"><div class="kicker">SEASON ${pending.season} · OFFSEASON</div><h1>${pending.processed?'A new chapter.':'See who takes a leap.'}</h1><p class="lede">${pending.processed?'Individual growth is saved. Your collection and program history remain intact.':'Run offseason development once: each returning player gains focused experience and follows their individual physical growth path.'}</p><p class="small">Players return for another season in this development mode. Your printed cards remain unchanged.</p></section>${pending.processed?`<div class="dev-grid">${pending.rows.map(r=>`<section class="box"><h3>${escapeHtml(player(r.id)?.n||r.id)}</h3><p>${escapeHtml(r.text)}</p><p class="small">${r.award.changes.map(c=>`${DEVELOPMENT_SKILLS.find(x=>x[0]===c.key)[1]} ${c.before} → ${c.after} · ${c.status}`).join(' · ')||'Skill experience gained; no immediate rating change.'}</p></section>`).join('')}</div>${button('Begin next season →','beginDevelopmentSeason()')}`:button('Run offseason development →','runDevelopmentOffseason()')}${D.poach?'<p class="small">Resolve your rival offer in Recruit HQ before beginning the next season.</p>':''}<div class="row">${button('Recruit HQ','directorOffice()','alt')}${button('Player development','playerDevelopmentRoom()','alt')}</div>`);
}
function runDevelopmentOffseason(){
  const d=developmentState(),pending=d.offseason;if(!pending||pending.processed||S.screen!=='offseason')return;
  pending.rows=[];
  for(const id of pending.roster.filter(id=>player(id)&&(S.pick.includes(id)||D.signed.includes(id)))){
    const p=developmentProfile(id,true),before=physProfile(player(id)),age=p.age;
    const roll=circuitHash(p.seed+':height:'+pending.season)%100;
    const growth=before.hKnown&&age<18?Math.min(5-p.heightGain,86-before.inches,roll<20?0:roll>=85?2:1):0;
    const weight=before.wKnown&&age<20?2+circuitHash(p.seed+':weight:'+pending.season)%7:0;
    p.heightGain+=Math.max(0,growth);p.weightGain+=weight;p.age++;p.seasons++;
    const focus=[...DEVELOPMENT_SKILLS].sort((a,b)=>(p.base[a[0]]+p.gains[a[0]])-(p.base[b[0]]+p.gains[b[0]]))[0][0];
    const award=awardDevelopment(id,40,{[focus]:1},'Offseason development','offseason');
    const text=`Simulated age ${age} → ${p.age}. ${growth>0?'Height '+physFmt(before.inches)+' → '+physFmt(before.inches+growth)+(growth>=2?' · Growth spurt.':'.'):'No height change.'} ${weight?'Weight '+before.lbs+' → '+(before.lbs+weight)+' lbs.':'No weight change.'} +40 focused XP.`;
    p.history[0].physical=text;pending.rows.push({id,text,award});
  }
  pending.processed=true;d.reports.unshift(JSON.parse(JSON.stringify(pending)));d.reports=d.reports.slice(0,8);saveAll();developmentOffseason();
}
const developmentNextWeekend=nextWeekend;
nextWeekend=function(){if(D.development?.offseason){developmentOffseason();return;}developmentNextWeekend();};
function beginDevelopmentSeason(){
  const d=developmentState(),pending=d.offseason;if(!pending?.processed||S.screen!=='offseason')return;
  if(D.poach){directorOffice();return;}
  d.season++;d.offseason=null;S.week=0;S.poolAt=0;S.pw=0;S.pl=0;S.results=[];S.mode='pool';S.opp=null;S.half=null;S.game=null;S.simulation=null;
  // Attendance is generated afresh each season; old availability is not permanent eligibility.
  if(D.circuit)D.circuit.weeks={};
  D.playerForm={};
  S.pick.forEach(id=>S.energy[id]=100);saveAll();roster();
}
const developmentBoxTable=boxTable;
boxTable=function(box){
  if(!box?.estimatedMinutes)return developmentBoxTable(box);
  const keys=['minutes','pts','reb','ast','stl','blk'];
  return `<div class="table-wrap"><table class="table box-score-table"><thead><tr><th>Player</th>${['MIN','PTS','REB','AST','STL','BLK'].map(k=>'<th>'+k+'</th>').join('')}</tr></thead><tbody>${box.players.map(p=>`<tr><td><b>${escapeHtml(p.name)}</b><div class="small">${escapeHtml(p.position)}</div></td>${keys.map(k=>'<td>'+p[k]+'</td>').join('')}</tr>`).join('')}<tr class="you"><td>TEAM TOTAL</td>${keys.map(k=>'<td>'+box.totals[k]+'</td>').join('')}</tr></tbody></table><p class="small">Minutes are estimated rotation shares in a 32-minute game (160 team minutes).</p></div>`;
};
const developmentStrength=strengthParts;
strengthParts=function(ids=S.five){
  const parts=developmentStrength(ids),ps=ids.map(player).filter(Boolean);
  const withoutPhysicalGrowth=ps.map(p=>({...p,catalog:developmentBasePlayer(p.id)?.catalog}));
  const physical=physTeam(ps)-physTeam(withoutPhysicalGrowth);
  parts.developmentSize=physical;parts.total=Math.round(parts.total+physical);return parts;
};
const developmentLineupCard=lineupCard;
lineupCard=function(id,slot){const html=developmentLineupCard(id,slot),d=D.development?.players?.[id];return d?html.replace('</h3>',`</h3><p class="small">Development level ${developmentLevel(d)} · ${d.xp} XP</p>`):html;};
const developmentStartWeekend=startWeekend;
startWeekend=function(){if(D.development?.offseason){developmentOffseason();return;}developmentStartWeekend();};
const developmentNewTeam=newTeam;
newTeam=function(){if(D.development)D.development.offseason=null;developmentNewTeam();};
