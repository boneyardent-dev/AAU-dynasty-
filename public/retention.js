// Retention layer: daily reward + streak + free pack, and collection goals.
// State lives inside the existing collection store (c.daily, c.goals), so local saves,
// the multi-tab lock, and account sync already cover it. Pack count is c.packs.
// NOTE: the date comes from the device clock. Real enforcement needs server time (see README notes).
const RT_CYCLE=[{pk:1},{pk:1},{pk:2,tag:'Day 3 bonus'},{pk:1},{pk:1},{pk:1},{pk:3,tag:'Day 7 bonus'}];
const RT_GOALS=[
{id:'guards5',t:'Guard room',d:'Own 5 different guards',n:5,pk:1,count:o=>o.filter(p=>p.p==='G').length},
{id:'wings5',t:'Wing depth',d:'Own 5 different wings',n:5,pk:1,count:o=>o.filter(p=>p.p==='W').length},
{id:'bigs5',t:'Frontcourt',d:'Own 5 different bigs',n:5,pk:1,count:o=>o.filter(p=>p.p==='B').length},
{id:'styles6',t:'Style points',d:'Own 6 different player styles',n:6,pk:1,count:o=>new Set(o.map(p=>p.r)).size},
{id:'col25',t:'Collector',d:'Own 25 different players',n:25,pk:2,count:o=>o.length},
{id:'col75',t:'Hall of cards',d:'Own 75 different players',n:75,pk:4,count:o=>o.length}];
let rtServerDay=null,rtSynced=false;
async function rtSync(){const r=await fetch('/api/clock',{cache:'no-store'});if(!r.ok)throw Error('clock');const j=await r.json();if(!/^\d{4}-\d{2}-\d{2}$/.test(j.date))throw Error('clock');rtServerDay=j.date;rtSynced=true}
function rtToday(){if(rtServerDay)return rtServerDay;const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function rtGap(a,b){return Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000)}
function rtDaily(c=inventoryRead()){const d=c.daily||{last:null,streak:0,best:0},today=rtToday();
 const claimed=!!d.last&&d.last>=today; // a clock set backwards cannot claim twice
 const live=claimed||(d.last&&rtGap(d.last,today)===1)?d.streak:0,next=claimed?d.streak:live+1;
 return {claimed,streak:live,best:d.best||0,next,reward:RT_CYCLE[(Math.max(next,1)-1)%7]}}
async function rtClaimDaily(){try{await rtSync()}catch(e){throw Error('Connect to the internet to claim your daily reward.')}let got=null;await inventoryChange(c=>{const s=rtDaily(c);if(s.claimed)return;const d=c.daily||{best:0},n=s.streak+1;
 c.daily={last:rtToday(),streak:n,best:Math.max(d.best||0,n)};const pk=RT_CYCLE[(n-1)%7].pk;c.packs=(c.packs||0)+pk;rtXp(c,20);got={pk,streak:n}});return got}
function rtOwned(c=inventoryRead()){const seen=new Set();return Object.values(c.inventory||{}).map(x=>players.find(p=>p.id===x.playerId)).filter(p=>p&&!seen.has(p.id)&&seen.add(p.id))}
function rtGoalState(c=inventoryRead()){const o=rtOwned(c);return RT_GOALS.map(g=>{const have=Math.min(g.n,g.count(o)),done=!!(c.goals&&c.goals[g.id]);return {...g,have,done,ready:!done&&have>=g.n}})}
async function rtClaimGoal(id){let got=0;await inventoryChange(c=>{const g=rtGoalState(c).find(x=>x.id===id);if(!g||!g.ready)return;c.goals={...(c.goals||{}),[id]:rtToday()};c.packs=(c.packs||0)+g.pk;rtXp(c,30);got=g.pk});return got}
function rtReadyCount(){try{const c=inventoryRead();return (rtDaily(c).claimed?0:1)+rtGoalState(c).filter(g=>g.ready).length}catch(e){return 0}}
const rtPacks=n=>n+(n===1?' pack':' packs');
async function rtDoDaily(){try{const r=await rtClaimDaily();rewards(r?`Day ${r.streak} claimed. +${rtPacks(r.pk)} added to your vault.`:'')}catch(e){alert(e.message)}}
async function rtDoGoal(id){try{const pk=await rtClaimGoal(id);rewards(pk?`Goal complete. +${rtPacks(pk)} added to your vault.`:'')}catch(e){alert(e.message)}}
function rewards(msg=''){S.screen='rewards';if(!rtSynced)rtSync().then(()=>{if(S.screen==='rewards')rewards(msg)}).catch(()=>{});const c=inventoryRead(),d=rtDaily(c),goals=rtGoalState(c),day=(Math.max(d.next,1)-1)%7;
 const bar=(v,n)=>`<div style="height:8px;border-radius:4px;background:var(--line);overflow:hidden;margin-top:8px"><i style="display:block;height:100%;width:${Math.round(v/n*100)}%;background:var(--lime)"></i></div>`;
 const days=RT_CYCLE.map((x,i)=>{const done=d.claimed?i<=day:i<day,now=!d.claimed&&i===day;return `<div style="flex:1;min-width:0;text-align:center;padding:8px 2px;border:1px solid ${now?'var(--lime)':'var(--line)'};border-radius:8px;background:${done?'var(--panel2)':'transparent'};opacity:${done?.6:1}"><div class="small">Day ${i+1}</div><b>${done?'\u2713':'+'+x.pk}</b></div>`}).join('');
 frame(`<div class="kicker">DAILY REWARDS</div><h2>Come back, keep the streak</h2>${msg?`<div class="box" style="border-color:var(--lime)">${msg}</div>`:''}
 <div class="box"><div class="small">${d.streak?`Current streak: ${d.streak} ${d.streak===1?'day':'days'}. Best: ${Math.max(d.best,d.streak)}.`:'Start a streak today.'}</div>
 <div style="display:flex;gap:5px;margin:12px 0">${days}</div>
 <div class="row">${d.claimed?`<button class="btn alt" disabled>Claimed today. Back tomorrow.</button>`:button(`Claim ${rtPacks(d.reward.pk)}${d.reward.tag?` (${d.reward.tag})`:''}`,'rtDoDaily()')}${button(`Open packs (${c.packs||0})`,'packRoom()','alt')}</div></div>
 ${rtSeasonHtml(c)}<div class="sectionhead"><h2>Collection goals</h2><span class="small">${goals.filter(g=>g.done).length}/${goals.length} complete</span></div>
 ${goals.map(g=>`<div class="box" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b>${g.t}</b><div class="small">${g.d}. Reward: ${rtPacks(g.pk)}</div></div>${g.done?'<span class="tag">Done</span>':g.ready?button('Claim',`rtDoGoal('${g.id}')`):`<span class="small">${g.have}/${g.n}</span>`}</div>${g.done?'':bar(g.have,g.n)}</div>`).join('')}
 <div class="row" style="margin-top:12px">${button('My collection','myCollection()','alt')}${button('Back','home()','alt')}</div>`)}

// Season pass (free track). Dates use the server day. XP: daily claim 20, finished game 20, goal 30.
// Each level has a free reward in pk; a paid track can add a `premium` field per level later.
const SEASON={id:'s1',name:'Season 1: Tip-Off',start:'2026-10-12',days:28};
const RT_LEVELS=[1,1,1,1,2,1,1,2,1,4],RT_XP_PER=100;
function rtSeasonEnd(){const d=new Date(Date.parse(SEASON.start+'T00:00:00Z')+(SEASON.days-1)*864e5);return d.toISOString().slice(0,10)}
function rtXp(c,n){const t=rtToday();if(t<SEASON.start||t>rtSeasonEnd())return;const s=c.season&&c.season.id===SEASON.id?c.season:{id:SEASON.id,xp:0,claimed:[]};s.xp=Math.min(RT_LEVELS.length*RT_XP_PER,s.xp+n);c.season=s}
function rtSeasonState(c=inventoryRead()){const s=c.season&&c.season.id===SEASON.id?c.season:{xp:0,claimed:[]},lvl=Math.floor(s.xp/RT_XP_PER),left=Math.max(0,rtGap(rtToday(),rtSeasonEnd())+1);
 return {xp:s.xp,lvl,left,over:rtToday()>rtSeasonEnd(),levels:RT_LEVELS.map((pk,i)=>({n:i+1,pk,done:s.claimed.includes(i+1),ready:i+1<=lvl&&!s.claimed.includes(i+1)}))}}
async function rtClaimLevel(n){let got=0;await inventoryChange(c=>{const st=rtSeasonState(c),l=st.levels.find(x=>x.n===n);if(!l||!l.ready)return;const s=c.season&&c.season.id===SEASON.id?c.season:{id:SEASON.id,xp:0,claimed:[]};s.claimed=[...s.claimed,n];c.season=s;c.packs=(c.packs||0)+l.pk;got=l.pk});return got}
async function rtDoLevel(n){try{const pk=await rtClaimLevel(n);rewards(pk?`Level ${n} reward claimed. +${rtPacks(pk)} added to your vault.`:'')}catch(e){alert(e.message)}}
function rtSeasonHtml(c){const s=rtSeasonState(c),into=s.lvl>=RT_LEVELS.length?RT_XP_PER:s.xp%RT_XP_PER;
 return `<div class="sectionhead"><h2>${SEASON.name}</h2><span class="small">${s.over?'Season over':s.left+(s.left===1?' day left':' days left')}</span></div><div class="box"><div class="small">Level ${s.lvl} of ${RT_LEVELS.length}. Earn XP from daily rewards, finished games, and goals.</div><div style="height:8px;border-radius:4px;background:var(--line);overflow:hidden;margin:8px 0 12px"><i style="display:block;height:100%;width:${Math.round(into/RT_XP_PER*100)}%;background:var(--gold)"></i></div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">${s.levels.map(l=>`<div style="text-align:center;padding:7px 2px;border:1px solid ${l.ready?'var(--gold)':'var(--line)'};border-radius:8px;opacity:${l.done?.5:1}"><div class="small">Lv ${l.n}</div><b>${l.done?'\u2713':'+'+l.pk}</b>${l.ready?`<button class="btn" style="margin-top:4px;padding:3px 6px;min-height:0" onclick="rtDoLevel(${l.n})">Claim</button>`:''}</div>`).join('')}</div></div>`}
