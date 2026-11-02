// Possession-driven exhibition: one event feeds both the scoreboard and animation.
const T3={game:null,selected:[],plan:'attack',paused:false,speed:1,raf:0,clock:0,last:0,event:null};
function t3Clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function t3Create(teams,seed){
 if(teams.length!==2||teams.some(t=>t.length!==3)||new Set(teams.flat().map(p=>p.id)).size!==6)throw Error('Choose six distinct players.');
 return {teams:teams.map(t=>t.map(p=>({...p}))),rows:teams.map(t=>t.map(p=>({id:p.id,name:p.n,pts:0,threeMade:0,threeAttempts:0,dunks:0,ast:0,reb:0,stl:0,blk:0,energy:100}))),score:[0,0],seed:seed>>>0,turn:0,events:[],done:false};
}
function t3Roll(g){g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;return g.seed/4294967296;}
function t3Step(g,plan='attack'){
 if(g.done)return null;
 const side=g.turn%2,other=1-side,actor=Math.floor(t3Roll(g)*3),defender=Math.floor(t3Roll(g)*3),p=g.teams[side][actor],d=g.teams[other][defender],r=g.rows[side][actor],dr=g.rows[other][defender];
 const scheme=side===0?plan:'attack',fresh=.70+r.energy*.003;
 const e={index:g.turn,side,actor,defender,kind:'drive',made:false,points:0,assist:null,score:null};
 const steal=t3Clamp(.045+(d.d-p.pa)*.001+(scheme==='pressure'?.045:0),.02,.18);
 if(t3Roll(g)<steal){e.kind='steal';dr.stl++;}
 else {
  const three=t3Roll(g)<(scheme==='range'?.59:.22)+(p.s-70)*.003;
  const dunk=!three&&t3Roll(g)<t3Clamp(.30+(p.a-60)*.009+(scheme==='attack'?.13:scheme==='pressure'?.19:0),.15,.77);
  e.kind=three?'three':dunk?'dunk':'drive';if(three)r.threeAttempts++;
  const block=!three&&t3Roll(g)<t3Clamp(.045+(d.d-p.a)*.0015,.02,.17);
  if(block){e.kind='block';dr.blk++;}
  else {const chance=three?t3Clamp((.24+(p.s-50)*.004)*fresh,.15,.49):t3Clamp((.56+(p.a-d.d)*.003+(scheme==='attack'?.06:scheme==='pressure'?.04:0))*fresh,.25,.82);e.made=t3Roll(g)<chance;}
  if(e.made){e.points=three?3:2;r.pts+=e.points;g.score[side]+=e.points;if(three)r.threeMade++;if(dunk)r.dunks++;if(t3Roll(g)<.58){e.assist=(actor+1+Math.floor(t3Roll(g)*2))%3;g.rows[side][e.assist].ast++;}}
  else {const rebound=Math.floor(t3Roll(g)*3);g.rows[other][rebound].reb++;e.rebound=rebound;}
 }
 g.rows.flat().forEach(x=>x.energy=Math.min(100,x.energy+1.8));r.energy=Math.max(20,r.energy-(scheme==='pressure'?7:5));dr.energy=Math.max(20,dr.energy-3);
 g.turn++;g.done=Math.max(...g.score)>=21&&g.score[0]!==g.score[1]||g.turn>=48&&g.score[0]!==g.score[1]||g.turn>=60;
 e.score=[...g.score];e.done=g.done;g.events.push(e);return e;
}
function t3Pool(){const roster=S.pick.map(player).filter(Boolean);return roster.length>=3?roster:players.filter(p=>p.catalog?.isFictional||p.catalog?.originalSeries).slice(0,12).map(p=>player(p.id));}
function t3Room(preserveSelection=false){
 t3Stop();S.screen='threevthree';const pool=t3Pool();T3.selected=T3.selected.filter(id=>pool.some(p=>p.id===id));if(!preserveSelection&&T3.selected.length!==3)T3.selected=pool.slice(0,3).map(p=>p.id);
 frame(`<section class="t3-intro"><div class="kicker">CIRCUIT ORIGINALS / 3 ON 3</div><h1>ABOVE THE RIM.</h1><p>Three players. Open space. Attack the basket or let it fly.</p><p class="small">Exhibition · first to 21, or the lead after 48 possessions. Ties get up to 12 extra possessions. Baskets count 2 and 3.</p><p class="small">${S.pick.length>=3?'Choose three from your roster.':'Try the existing fictional player pool while building your roster.'} Exhibition stats last until you leave; no season rewards or save changes.</p><div class="t3-picks">${pool.map(p=>`<button class="t3-pick ${T3.selected.includes(p.id)?'selected':''}" aria-pressed="${T3.selected.includes(p.id)}" onclick="t3Pick('${p.id}')">${playerPortrait(p,true)}<b>${escapeHtml(p.n)}</b><small>SHOOT ${Math.round(p.s)} · ATH ${Math.round(p.a)}</small></button>`).join('')}</div><div class="row"><button class="btn" onclick="t3Start()" ${T3.selected.length!==3?'disabled':''}>TIP OFF · 3 ON 3 ↗</button><button class="btn alt" onclick="home()">Back to lobby</button></div></section>`);
}
function t3Pick(id){if(T3.selected.includes(id))T3.selected=T3.selected.filter(x=>x!==id);else if(T3.selected.length<3)T3.selected.push(id);t3Room(true);}

function t3Start(){
 if(T3.selected.length!==3)return;
 const us=T3.selected.map(player),opponents=players.filter(p=>!T3.selected.includes(p.id)&&(p.catalog?.isFictional||p.catalog?.originalSeries)).slice(0,3).map(p=>player(p.id));
 T3.plan='attack';T3.speed=1;T3.game=t3Create([us,opponents],crypto.getRandomValues(new Uint32Array(1))[0]);T3.event=null;T3.clock=0;T3.last=0;T3.paused=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;S.screen='threevthree';
 frame(`<section class="t3-arena"><div class="t3-top"><span>CIRCUIT ORIGINALS <b>3 × 3</b></span><span>EXHIBITION / FIRST TO 21</span></div><div class="t3-score" id="t3-score"></div><canvas id="t3-court" aria-label="3D half court with six animated basketball players" role="img"></canvas><div class="t3-call" id="t3-call" role="status">CHECK BALL. MAKE A STATEMENT.</div><div class="t3-controls"><button onclick="t3Pause()" id="t3-pause">${T3.paused?'Play':'Pause'}</button><button onclick="t3Next()">Next play</button><label>Speed <select onchange="T3.speed=Number(this.value)"><option value="1">1×</option><option value="2">2×</option></select></label><label>Game plan <select onchange="T3.plan=this.value"><option value="attack">Attack the rim</option><option value="range">Hunt threes</option><option value="pressure">Push the pace</option></select></label><button onclick="t3Room()">New matchup</button></div><p class="small">Live possession results drive the animation and stats. Three-pointers count toward points. Exhibition results do not affect your season.</p><div id="t3-stats"></div></section>`);
 t3Update();if(typeof t3Draw==='function')t3Draw(0);if(typeof requestAnimationFrame==='function')T3.raf=requestAnimationFrame(t3Animate);
}
function t3Stop(){if(T3.raf&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(T3.raf);T3.raf=0;T3.last=0;}
function t3Pause(){T3.paused=!T3.paused;const b=document.getElementById('t3-pause');if(b)b.textContent=T3.paused?'Play':'Pause';}
function t3Next(){if(!T3.game||T3.game.done)return;T3.event=t3Step(T3.game,T3.plan);T3.clock=T3.paused?2800:0;t3Update();}
function t3Update(){const g=T3.game;if(!g)return;document.getElementById('t3-score').innerHTML=`<span>YOUR THREE <b>${g.score[0]}</b></span><small>${g.done?'FINAL':g.turn>=48?'OVERTIME':'POSSESSION '+g.turn}</small><span><b>${g.score[1]}</b> CHALLENGERS</span>`;
 const e=T3.event;if(e){const name=g.teams[e.side][e.actor].n,def=g.teams[1-e.side][e.defender].n;document.getElementById('t3-call').textContent=e.kind==='steal'?def+' — PICKED THE POCKET!':e.kind==='block'?def+' — REJECTED!':name+(e.made?(e.kind==='dunk'?' — THROWS IT DOWN!':e.kind==='three'?' — THREE. CASH.':' — TO THE RIM!'):' — OFF THE RIM.');}
 document.getElementById('t3-stats').innerHTML=g.rows.map((rows,i)=>`<h3>${i?'Challengers':'Your three'}</h3><div class="table-wrap"><table class="table"><thead><tr>${['PLAYER','PTS','3PM–3PA','3PT%','DUNKS','AST','REB','STL','BLK','ENERGY'].map(x=>'<th>'+x+'</th>').join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.name)}</td>${[r.pts,r.threeMade+'–'+r.threeAttempts,r.threeAttempts?(100*r.threeMade/r.threeAttempts).toFixed(0)+'%':'—',r.dunks,r.ast,r.reb,r.stl,r.blk,Math.round(r.energy)+'%'].map(x=>'<td>'+x+'</td>').join('')}</tr>`).join('')}</tbody></table></div>`).join('');}
function t3Animate(now){if(S.screen!=='threevthree'||!document.getElementById('t3-court')){t3Stop();return;}const dt=T3.last?Math.min(80,now-T3.last):0;T3.last=now;if(!T3.paused){T3.clock+=dt*T3.speed;if(!T3.event||T3.clock>3400&&!T3.game.done)t3Next();}t3Draw(Math.min(1,T3.clock/3000));T3.raf=requestAnimationFrame(t3Animate);}
const t3HomeBase=home;
home=function(){t3Stop();t3HomeBase();app.querySelector('main')?.insertAdjacentHTML('afterbegin',`<section class="t3-lobby"><div><div class="kicker">OPTIONAL / 3 ON 3</div><h2>3 ON 3. ABOVE THE RIM.</h2><p>3D court action · dunks · live three-point tracking</p></div><button class="btn" onclick="t3Room()">PLAY 3 × 3 ↗</button></section>`);};
