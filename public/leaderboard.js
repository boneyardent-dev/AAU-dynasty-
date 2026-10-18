// Weekly leaderboard screen and score submission. Server: /api/leaderboard.
async function lbSubmit(won){try{const mode=S.mode==='pool'?'pool':S.mode==='semi'?'semi':'final';
 const r=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({won:!!won,mode,program:programs[S.team??0].n})});
 if(r&&r.ok){const d=await r.json().catch(()=>({}));if(d.recorded&&typeof vaultHydrate==='function')vaultHydrate()}}catch(e){}}
function lbMove(e){const st='display:inline-block;min-width:44px;font-weight:700;font-size:13px';
 if(e.isNew)return `<span style="${st};color:var(--gold)">NEW</span>`;
 if(e.movement>0)return `<span style="${st};color:var(--lime)">\u25B2 ${e.movement}</span>`;
 if(e.movement<0)return `<span style="${st};color:var(--red,#ff6b5e)">\u25BC ${-e.movement}</span>`;
 return `<span style="${st};color:var(--muted)">\u2013</span>`}
function lbDate(d){return new Date(d+'T12:00:00Z').toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'})}
function lbRow(e){return `<div style="display:grid;grid-template-columns:34px 52px 1fr auto;gap:6px;align-items:center;padding:10px 12px;border:1px solid ${e.isMe?'var(--lime)':'var(--line)'};border-radius:10px;margin-bottom:6px;${e.isMe?'background:var(--panel2)':''}"><b>${e.rank}</b>${lbMove(e)}<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(e.label)}${e.isMe?' (you)':''}<div class="small">${e.wins}-${e.losses}</div></span><b>${e.points}</b></div>`}
async function leaderboard(msg=''){S.screen='leaderboard';frame('<div class="kicker">WEEKLY LEADERBOARD</div><h2>Loading standings</h2>');
 let d=null,err='';try{const r=await fetch('/api/leaderboard',{cache:'no-store'});if(r.status===401)err='Sign in to join the weekly leaderboard.';else if(!r.ok)err='The leaderboard is unavailable right now. Try again soon.';else d=await r.json()}catch(e){err='Connect to the internet to see the leaderboard.'}
 if(S.screen!=='leaderboard')return;
 let rw=[];try{const r=await fetch('/api/leaderboard/rewards',{cache:'no-store'});if(r.ok)rw=(await r.json()).rewards||[]}catch(e){}
 const back=`<div class="row" style="margin-top:12px">${button('Daily rewards','rewards()','alt')}${button('Back','home()','alt')}</div>`;
 if(err)return frame(`<div class="kicker">WEEKLY LEADERBOARD</div><h2>Weekly leaderboard</h2><div class="box">${err}</div>${back}`);
 const me=d.entries.find(e=>e.isMe),top=d.entries.filter(e=>e.rank<=25),extra=me&&me.rank>25?`<div class="small" style="text-align:center;margin:6px 0">\u2026</div>${lbRow(me)}`:'';
 frame(`<div class="kicker">WEEKLY LEADERBOARD</div><h2>Week of ${lbDate(d.weekStart)}</h2><p class="small">Resets Monday ${lbDate(d.resetsOn)} at 12:00 AM Pacific. ${d.total} ${d.total===1?'program':'programs'} ranked.</p>
 ${msg?`<div class="box" style="border-color:var(--lime)">${escapeHtml(msg)}</div>`:''}${lbRewardHtml(rw)}${me?`<div class="box" style="border-color:var(--lime)"><div class="small">Your standing</div><b style="font-size:22px">#${me.rank}</b> ${lbMove(me)} <span class="small">${me.points} points, ${me.wins}-${me.losses}</span></div>`:'<div class="box">Play a game to get on this week\u2019s board.</div>'}
 <div class="small" style="margin:10px 2px">End-of-week packs: 1st place 5, top 3 get 4, top 10 get 3, top quarter 2, and 1 for playing 5 games (3 games minimum). Claim them next week.</div><div class="small" style="margin:10px 2px">Win 10 points. Loss 3 points. Semifinal and championship wins earn +5. Arrows compare with yesterday\u2019s standings.</div>
 ${top.length?top.map(lbRow).join(''):'<div class="box">No games played this week yet. Be the first.</div>'}${extra}${back}`)}

function lbRewardHtml(rw){return (rw||[]).map(r=>`<div class="box" style="border-color:var(--gold)"><div class="small">Reward from the week of ${lbDate(r.week)}</div><b>${escapeHtml(r.tier)}: finished #${r.rank}</b> <span class="small">(${r.games} games)</span><div style="margin:8px 0 0">${button('Claim '+r.packs+(r.packs===1?' pack':' packs'),`lbClaim('${r.week}')`)}</div></div>`).join('')}
async function lbPost(body){const r=await fetch('/api/leaderboard/rewards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not claim right now. Try again.');return d}
async function lbClaim(week){let msg='';try{const d=await lbPost({action:'claim',week});
 if(d.granted){if(typeof vaultHydrate==='function')await vaultHydrate();msg=`Reward claimed. +${d.granted} ${d.granted===1?'pack':'packs'} added to your vault.`}else msg='That reward was already claimed.'}catch(e){msg=e.message}
 leaderboard(msg)}
