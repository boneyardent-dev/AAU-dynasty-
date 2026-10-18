// Eight-round starter draft. Existing account saves and card inventory stay intact.
const archetypeDefinitions=window.AAU_ARCHETYPES;
const roleNames={G:'Guards',W:'Wings',B:'Bigs',Any:'Best available'};
function draftRole(p){return p.catalog?(['PG','SG','CG'].includes(p.catalog.position)?'G':['C','PF'].includes(p.catalog.position)?'B':'W'):p.p.includes('G')?'G':p.p.includes('B')?'B':'W';}
function projectedArchetype(p){
  const candidates=archetypeDefinitions.filter(a=>a.role===draftRole(p)),values=cardAttributes(p);
  const ratings=Object.fromEntries(sixAttributes.map((name,i)=>[name,values[i]]));
  const score=a=>{let hash=0;for(const c of p.id+':'+a.id)hash=(hash*31+c.charCodeAt(0))>>>0;return Object.entries(a.weights).reduce((n,[k,w])=>n+(ratings[k]||0)*w,0)+((hash%801)/100-4);};
  return candidates.find(a=>a.id===p.catalog?.gameplayArchetype)||[...candidates].sort((a,b)=>score(b)-score(a))[0];
}
function archetypeTag(p){const a=projectedArchetype(p);return `<span class="archetype-tag">${a.icon} ${escapeHtml(a.name)}</span>`;}
try{S.draft=JSON.parse(localStorage.getItem('aau82save')||'{}').draft||null;}catch{S.draft=null;}
const snapshotBeforeDraft=snapshotForAccount;
snapshotForAccount=function(){const data=snapshotBeforeDraft();data.game.draft=S.draft||null;return data;};
const restoreBeforeDraft=storeAccountSnapshot;
storeAccountSnapshot=function(data){restoreBeforeDraft(data);S.draft=data?.game?.draft||null;};
const saveBeforeDraft=saveAll;
saveAll=function(){saveBeforeDraft();try{const data=JSON.parse(localStorage.getItem('aau82save')||'{}');data.draft=S.draft||null;localStorage.setItem('aau82save',JSON.stringify(data));saveLocalAccountSnapshot();}catch{}};

function randomDraftIndex(n){return Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/4294967296*n);}
function draftShuffle(array){const a=[...array];for(let i=a.length-1;i>0;i--){const j=randomDraftIndex(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function starterDraftPool(){const real=players.filter(p=>p.catalog);return real.length>=24?real:players;}
function roundRole(){
  const counts={G:0,W:0,B:0};S.pick.map(player).filter(Boolean).forEach(p=>counts[draftRole(p)]++);
  const remaining=8-S.pick.length,needed=(counts.G<1?1:0)+(counts.B<1?1:0);
  if(remaining<=needed)return counts.G<1?'G':counts.B<1?'B':'Any';
  return ['G','W','B','G','W','B','Any','Any'][S.pick.length];
}
function ensureDraftOffers(){
  if(!S.draft||S.draft.v!==1)S.draft={v:1,round:S.pick.length,offers:[],seen:[],complete:false};
  const draft=S.draft;
  if(draft.round===S.pick.length&&draft.offers.length===3&&draft.offers.every(id=>players.some(p=>p.id===id)&&!S.pick.includes(id)))return;
  const role=roundRole(),pool=starterDraftPool().filter(p=>!S.pick.includes(p.id)&&(role==='Any'||draftRole(p)===role));
  let available=pool.filter(p=>!draft.seen.includes(p.id));if(available.length<3)available=pool;
  if(available.length<3)available=starterDraftPool().filter(p=>!S.pick.includes(p.id));
  const shuffled=draftShuffle(available),anchor=shuffled[0],ovr=p=>cardOvr(cardAttributes(p));
  const band=anchor?shuffled.filter(p=>Math.abs(ovr(p)-ovr(anchor))<=6):[];
  const candidates=band.length>=3?band:shuffled,chosen=[];
  for(const p of candidates)if(!chosen.some(x=>projectedArchetype(x).id===projectedArchetype(p).id)){chosen.push(p);if(chosen.length===3)break;}
  for(const p of candidates)if(chosen.length<3&&!chosen.some(x=>x.id===p.id))chosen.push(p);
  draft.offers=chosen.map(p=>p.id);draft.round=S.pick.length;draft.role=role;draft.complete=false;
  draft.seen=[...new Set([...draft.seen,...draft.offers])];saveAll();
}
function teamIdentity(){const counts={G:0,W:0,B:0};const types={};for(const p of S.pick.map(player).filter(Boolean)){counts[draftRole(p)]++;const name=projectedArchetype(p).name;types[name]=(types[name]||0)+1;}return {counts,types};}
function draftedTeamPanel(){
  const {counts,types}=teamIdentity();return `<section class="box draft-team"><div class="sectionhead"><h3>Your team so far</h3><span class="pill">${S.pick.length}/8 PLAYERS</span></div><div class="draft-role-counts"><span>Guards <b>${counts.G}</b></span><span>Wings <b>${counts.W}</b></span><span>Bigs <b>${counts.B}</b></span></div><div class="draft-selected">${S.pick.map((id,i)=>{const p=player(id);return p?`<div><span class="draft-slot">${i+1}</span><div><b>${escapeHtml(p.n)}</b><small>${projectedArchetype(p).name} · ${p.catalog?.position||p.p}</small></div><strong>${cardOvr(cardAttributes(p))}</strong></div>`:'';}).join('')||'<p class="small">Your first choice sets the tone. Build a team, not just a stack of ratings.</p>'}</div><div class="row">${Object.entries(types).map(([name,count])=>`<span class="tag">${escapeHtml(name)} ×${count}</span>`).join('')}</div></section>`;
}
function starterDraftCard(p){
  const a=projectedArchetype(p),values=cardAttributes(p);return `<article class="silver-card draft-choice rarity-rare"><div class="kicker">STARTER DRAFT · ROUND ${S.pick.length+1}</div>${playerPortrait(p,true)}<div class="card-topline"><span class="card-ovr">${cardOvr(values)}<small>OVR</small></span><span class="card-pos">${escapeHtml(p.catalog?.position||p.p)}</span></div><h3>${escapeHtml(p.n)}</h3>${archetypeTag(p)}${p.catalog?.isCustom?'<div class="catalog-note">CUSTOM PLAYER · PROVISIONAL GAME RATINGS</div>':''}<div class="six-stats">${sixAttributes.map((k,i)=>`<span>${k}<b>${values[i]}</b></span>`).join('')}</div><div class="draft-strength"><b>BRINGS TO YOUR TEAM</b><p>${a.strength}</p><b>BUILD AROUND</b><p>${a.tradeoff}</p></div><button class="btn draft-pick" onclick="pickDraftPlayer('${p.id}')">Draft ${escapeHtml(p.n.split(' ')[0])} →</button><div class="catalog-note">Starter roster choice · does not award a collectible card.</div></article>`;
}
function starterDraft(){
  S.screen='draft';ensureDraftOffers();const draft=S.draft,round=S.pick.length+1;
  frame(`<div class="kicker">${escapeHtml(programs[S.team].n)} · STARTER DRAFT</div><div class="draft-heading"><div><h2>Three choices. One pick.</h2><p class="small">Pick one player each round. Eight rounds build your eight-player team.</p></div><span class="draft-round">ROUND <b>${round}</b> / 8</span></div><div class="draft-progress" aria-label="${S.pick.length} of 8 players selected">${Array.from({length:8},(_,i)=>`<span class="${i<S.pick.length?'done':i===S.pick.length?'current':''}">${i<S.pick.length?'✓':i+1}</span>`).join('')}</div><div class="draft-focus"><b>${roleNames[draft.role]} round</b><span>Fresh choices each round · No rerolls · Your progress saves automatically</span></div><div class="draft-options">${draft.offers.map(player).filter(Boolean).map(starterDraftCard).join('')}</div>${draftedTeamPanel()}<p class="small" style="margin-top:18px">Rounds 1–6 offer guards, wings, and bigs; rounds 7–8 are best available. Archetypes and six-attribute ratings are modeled for gameplay, not sourced scouting labels.</p><div class="row">${button('View all archetypes','archetypeGuide()','alt')}${button('← Home','home()','ghost')}</div>`);
}
function pickDraftPlayer(id){
  if(S.screen!=='draft'||S.pick.length>=8||!S.draft||S.draft.round!==S.pick.length||!S.draft.offers.includes(id)||S.pick.includes(id))return;
  const p=players.find(p=>p.id===id);if(!p)return;
  S.pick.push(id);S.energy[id]=100;D.loyalty[id]=82;
  // The free starter draft establishes the program; later recruits still cost points.
  if(p.prospect&&!D.signed.includes(id))D.signed.push(id);
  S.draft.offers=[];S.draft.round=S.pick.length;S.draft.complete=S.pick.length===8;
  if(S.pick.length===8)autoStarters();saveAll();roster();
}
const rosterBeforeStarterDraft=roster;
roster=function(){
  if(S.team===null){programPick();return;}
  if(S.pick.length<8){starterDraft();return;}
  S.screen='roster';const roster=S.pick.map(player).filter(Boolean),ready=S.five.length===5&&S.five.some(id=>player(id)?.p.includes('G'))&&S.five.some(id=>player(id)?.p.includes('B'));
  frame(`<div class="kicker">${escapeHtml(programs[S.team].n)} · YOUR EIGHT ARE SET</div><h2>${S.draft?.complete?'Draft complete. Make your run.':'Your team. Your identity.'}</h2><p class="small">Choose five starters, including a guard and a big. Your other three players are the bench.</p><div class="summary"><div class="kpi"><span>Team strength</span><b>${rating()}</b></div><div class="kpi"><span>Starters</span><b>${S.five.length}/5</b></div><div class="kpi"><span>Starter energy</span><b>${lineupEnergy()}%</b></div><div class="kpi"><span>Role fit</span><b>${fit()}</b></div></div><div class="draft-lineup">${roster.map(p=>`<article class="director-card"><div class="lineup-portrait">${playerPortrait(p)}</div><div class="playerhead"><span class="emoji">${projectedArchetype(p).icon}</span><div><div class="name">${escapeHtml(p.n)}</div><div class="role">${escapeHtml(p.catalog?.position||p.p)} · OVR ${cardOvr(cardAttributes(p))}</div></div></div>${archetypeTag(p)}${energyWidget(p.id)}<button class="pbtn ${S.five.includes(p.id)?'starter':''}" aria-pressed="${S.five.includes(p.id)}" onclick="setStarter('${p.id}')">${S.five.includes(p.id)?'★ STARTER · MOVE TO BENCH':'SET STARTER'}</button></article>`).join('')}</div>${draftedTeamPanel()}<div class="row"><button class="btn" onclick="startWeekend()" ${ready?'':'disabled'}>Start tournament →</button>${button('Auto-set starting five','autoStarters();saveAll();roster()','alt')}${button('Director’s office','directorOffice()','alt')}${button('Archetype guide','archetypeGuide()','ghost')}${button('← Home','home()','ghost')}</div>${ready?'':`<p class="small">Set five starters with at least one guard and one big before playing.</p>`}`);
};
// No full-pool or auto-draft shortcut while a starter draft is in progress.
autoDraft=function(){roster();};
draft=function(){roster();};
const newTeamBeforeDraft=newTeam;
newTeam=function(){S.draft=null;newTeamBeforeDraft();saveAll();};
const chooseTeamBeforeDraft=chooseTeam;
chooseTeam=function(i){chooseTeamBeforeDraft(i);saveAll();};
const homeBeforeDraft=home;
home=function(){homeBeforeDraft();app.querySelector('main').insertAdjacentHTML('afterbegin',S.team!==null&&S.pick.length<8?`<section class="box" style="margin-bottom:18px"><div class="kicker">YOUR DRAFT IS WAITING</div><h3>${escapeHtml(programs[S.team].n)} · ${S.pick.length}/8 picked</h3><div class="row">${button('Resume round '+(S.pick.length+1)+' →','roster()')}${button('Archetype guide','archetypeGuide()','alt')}</div></section>`:`<div class="row" style="margin-bottom:15px">${button('Player archetypes →','archetypeGuide()','alt')}${S.pick.length===8?button('Start a new team draft','startFreshTeamDraft()','ghost'):''}</div>`);};
function startFreshTeamDraft(){if(!confirm('Start a new team draft and replace your current roster? Your player cards, favorites, and Director points will stay saved.'))return;newTeam();programPick();}
function archetypeGuide(){S.screen='archetypes';frame(`<div class="kicker">AAU DYNASTY · TEAM-BUILDING ROLES</div><h2>Find your team’s identity.</h2><p class="small">Nine complementary archetypes. Surround each strength with the players who cover its tradeoffs.</p><div class="archetype-guide">${archetypeDefinitions.map(a=>`<article class="box"><div class="kicker">${roleNames[a.role]}</div><h3>${a.icon} ${a.name}</h3><p>${a.strength}</p><div class="small"><b>Build around:</b> ${a.tradeoff}</div></article>`).join('')}</div><p class="small" style="margin-top:18px">Archetypes describe projected roles in this game. The published recruiting ranks remain separate; archetype labels do not change card attributes or confer hidden stat boosts.</p><div class="row">${S.team!==null?button(S.pick.length<8?'Return to your draft →':'Return to your team →','roster()'):button('Start a team →','programPick()')}${button('← Home','home()','ghost')}</div>`);}
const silverCardBeforeArchetypes=silverCard;
silverCard=function(c,showFavorite=true){const p=players.find(p=>p.id===c.playerId),html=silverCardBeforeArchetypes(c,showFavorite);return p?html.replace('<div class="six-stats">',archetypeTag(p)+'<div class="six-stats">'):html;};
const catalogCardBeforeArchetypes=catalogCard;
catalogCard=function(p){return catalogCardBeforeArchetypes(p).replace('<div class="six-stats">',archetypeTag(p)+'<div class="six-stats">');};
const profileBeforeArchetypes=playerProfile;
playerProfile=function(id){profileBeforeArchetypes(id);const p=players.find(p=>p.id===id);if(!p?.catalog||S.screen!=='profile')return;const a=projectedArchetype(p);app.querySelector('main').insertAdjacentHTML('beforeend',`<section class="box" style="margin-top:18px"><div class="kicker">PROJECTED GAMEPLAY ARCHETYPE</div><h3>${a.icon} ${a.name}</h3><p>${a.strength}</p><p class="small">Build around: ${a.tradeoff}</p></section>`);};
const draftStyles=document.createElement('style');draftStyles.textContent=`
.draft-heading{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}.draft-round{display:block;color:var(--lime);font-size:18px;white-space:nowrap}.draft-round b{font-size:45px}.draft-progress{display:flex;gap:8px;margin:18px 0}.draft-progress span{flex:1;text-align:center;padding:10px 4px;border:1px solid #45516a;border-radius:8px;font-weight:800;color:#8c9db5}.draft-progress .done{background:#b7ff4420;border-color:var(--lime);color:var(--lime)}.draft-progress .current{background:var(--lime);border-color:var(--lime);color:#102017}.draft-focus{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;margin:20px 0;color:#c6d2e5}.draft-focus span{font-size:12px}.draft-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;align-items:stretch}.draft-choice{display:flex;flex-direction:column;animation:foil-in .4s ease-out}.draft-choice h3{font-size:23px;min-height:56px}.draft-choice .player-photo-frame,.draft-choice>.portrait-initials,.draft-choice>.fictional-portrait{height:260px;margin-top:12px}.draft-choice .player-photo-frame .player-photo{height:100%;object-fit:contain}.archetype-tag{display:inline-block;border:1px solid #6f8199;border-radius:8px;padding:8px 10px;margin:8px 0;font-size:12px;font-weight:900;background:#21354c;color:#edfbff}.draft-strength{padding:12px;margin:12px 0;border-radius:8px;background:#132d4210;font-size:12px;flex:1}.draft-strength b{font-size:9px;letter-spacing:1px}.draft-strength p{margin:5px 0 12px;color:#23384f}.draft-pick{width:100%;background:#152c41;color:#fff}.draft-team{margin-top:25px}.draft-team .sectionhead{margin-top:0}.draft-role-counts{display:flex;gap:15px;flex-wrap:wrap;color:#bccfe4;margin:15px 0}.draft-role-counts b{color:var(--lime)}.draft-selected{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.draft-selected>div{display:flex;align-items:center;gap:10px;padding:10px;background:#ffffff06;border-radius:8px}.draft-selected>div>div{flex:1}.draft-selected small{display:block;font-size:11px;color:#9fb0c8;margin-top:3px}.draft-slot{font-size:12px;color:var(--lime)}.draft-lineup{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}.archetype-guide{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:20px}.archetype-guide p{font-size:14px;margin:15px 0}.draft-lineup .name{font-size:15px}.draft-lineup .playerhead{gap:8px}.draft-lineup .emoji{font-size:22px}.draft-lineup .energy-row{flex-wrap:wrap}.draft-lineup .energy-track{min-width:35px}.draft-lineup .pbtn{width:100%;margin-top:12px;font-size:10px}@media(max-width:900px){.draft-lineup{grid-template-columns:repeat(2,minmax(0,1fr))}.draft-options{gap:10px}.draft-options .silver-card{padding:14px}.draft-choice .six-stats{grid-template-columns:1fr}}@media(max-width:650px){.draft-options,.archetype-guide,.draft-selected{grid-template-columns:1fr}.draft-choice .six-stats{grid-template-columns:1fr 1fr}.draft-choice h3{min-height:0}.draft-choice .player-photo-frame,.draft-choice>.portrait-initials,.draft-choice>.fictional-portrait{height:280px}.draft-heading h2{font-size:30px}.draft-lineup{grid-template-columns:1fr 1fr}.draft-progress{gap:4px}}@media(prefers-reduced-motion:reduce){.draft-choice{animation:none}}
`;document.head.appendChild(draftStyles);
