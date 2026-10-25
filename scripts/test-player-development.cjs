const assert=require('assert');
const {create,run,json}=require('./verify-draft.cjs');
async function setup(){const t=create();await run(t.context,'bootCatalog()');run(t.context,'chooseTeam(0);roster()');for(let i=0;i<8;i++)run(t.context,'pickDraftPlayer(S.draft.offers[0])');return t;}
(async()=>{
 const t=await setup(),c=t.context,r=s=>run(c,s);
 const collection=json(c,'inventoryRead()'),raw=json(c,'players'),roster=json(c,'S.pick');
 r('startWeekend();tipOff();suggestLineup();confirmPregame();finishGame("bench")');
 const g=json(c,'S.statLog[0]');
 assert.equal(g.boxScore.players.reduce((n,p)=>n+p.minutes,0),160);
 assert(g.boxScore.players.every(p=>p.minutes>0&&p.minutes<=32));
 for(const key of ['pts','reb','ast','stl','blk'])assert.equal(g.boxScore.players.reduce((n,p)=>n+p[key],0),g.boxScore.totals[key]);
 const absent=roster.filter(id=>!g.boxScore.players.some(p=>p.playerId===id));for(const id of absent)assert.equal(r(`developmentProfile('${id}').xp`),0);
 const outgoing=g.simulation.rotation.outgoing,incoming=g.simulation.rotation.incoming;
 assert(g.boxScore.players.find(p=>p.playerId===outgoing).closingMinutes<g.boxScore.players.find(p=>p.playerId===outgoing).openingMinutes);
 assert(g.boxScore.players.find(p=>p.playerId===incoming).closingMinutes>g.boxScore.players.find(p=>p.playerId===incoming).openingMinutes);
 assert(g.development.every(a=>a.productionXP<=24&&a.xp<=68));
 const initial=json(c,'D.development');r('awardDevelopmentGame(S.statLog[0])');assert.deepEqual(json(c,'D.development'),initial,'no replay XP');
 const id=g.boxScore.players[0].playerId;c.devId=id;
 // Training earns focused XP, legacy bonuses are retained rather than rewritten.
 r('advanceGame();D.trainers=["shooting"];D.points=100;S.screen="development"');
 const before=r('developmentProfile(devId).xp'),bonuses=json(c,'D.bonuses');r('trainingSession("shooting",devId)');
 assert.equal(r('developmentProfile(devId).xp'),before+60);assert.equal(r('D.points'),86);assert.deepEqual(json(c,'D.bonuses'),bonuses);
 r('S.screen="half";trainingSession("shooting",devId)');assert.equal(r('D.points'),86);
 r('S.screen="development";D.points=0;trainingSession("shooting",devId)');assert.equal(r('developmentProfile(devId).xp'),before+60);
 // Keep ratings bounded; deterministic opportunities include plateaus and breakthroughs.
 const oldS=r('player(devId).s');r('awardDevelopment(devId,10000,{shooting:1},"Test training")');
 assert(r('player(devId).s')>=oldS&&r('player(devId).s')<=99);
 assert(r('developmentProfile(devId).gains.shooting+developmentProfile(devId).base.shooting<=developmentProfile(devId).ceilings.shooting'));
 assert(r('developmentProfile(devId).history[0].changes.some(x=>x.status==="Plateau")'));
 assert(r('players.filter(p=>p.catalog).slice(0,20).some(p=>{const x=awardDevelopment(p.id,1000,{defense:1},"Test");return x.changes.some(c=>c.status==="Breakthrough")})'));
 assert.deepEqual(json(c,'players'),raw,'catalog and printed ratings unchanged');
 assert.deepEqual(json(c,'inventoryRead().inventory'),collection.inventory,'ownership unchanged');
 // Concurrent support taps consume and teach once; printed support effects remain compatible.
 await r('inventoryChange(c=>{c.support={shooting:1}})');r('S.screen="support"');
 const supportXP=r('developmentProfile(devId).xp');await r('Promise.all([useCircuitTrainer(devId),useCircuitTrainer(devId)])');
 assert.equal(r('developmentProfile(devId).xp'),supportXP+30);assert.equal(r('inventoryRead().support.shooting'),0);
 // Reload the director payload, then switch accounts to a legacy snapshot.
 r('saveAll()');await r('syncAccountSave()');const reload=create(new Map(t.storage),t.remote);await run(reload.context,'bootCatalog()');assert.deepEqual(json(reload.context,'D.development'),json(c,'D.development'));
 run(reload.context,'storeAccountSnapshot({game:{},director:{points:75}})');assert.equal(run(reload.context,'D.development'),undefined,'legacy accounts cannot inherit another account’s development');
 // Final weekend -> one offseason -> year two; no growth on ordinary weekends.
 r('S.screen="weekend";S.week=0;finishWeekend(false)');assert.equal(r('D.development.offseason'),null);
 r('S.screen="weekend";S.week=5;finishWeekend(false);nextWeekend()');assert.equal(r('S.screen'),'offseason');
 const ages=json(c,'S.pick.map(id=>developmentProfile(id).age)');r('runDevelopmentOffseason()');
 assert(r('D.development.offseason.processed'));assert.deepEqual(json(c,'S.pick.map(id=>developmentProfile(id).age)'),ages.map(n=>n+1));
 const grown=json(c,'D.development');r('runDevelopmentOffseason()');assert.deepEqual(json(c,'D.development'),grown,'stale offseason clicks cannot grow again');
 const historyLength=r('S.statLog.length');r('D.poach=null;beginDevelopmentSeason();beginDevelopmentSeason()');assert.equal(r('developmentState().season'),2);assert.equal(r('S.week'),0);assert.equal(r('S.statLog.length'),historyLength);assert.deepEqual(json(c,'S.pick'),roster);
 r('home()');assert(r('document.getElementById("app").innerHTML.includes("SEASON 02 / WEEK")'));
 // Force saved individual growth seeds to cover spurt, plateau, maturity and unknown measurements.
 r('S.screen="weekend";S.week=5;finishWeekend(false);developmentOffseason()');
 r('for(const id of S.pick){const p=developmentProfile(id,true);p.age=16;p.heightGain=0;p.weightGain=0;}');
 r(`developmentProfile('marcus',true).age=16;D.signed.push('marcus');D.development.offseason.roster.push('marcus');`);
 r(`{const id=S.pick.find(id=>physProfile(player(id)).hKnown),p=developmentProfile(id,true);let seed=0;while(circuitHash(seed+':height:'+D.development.offseason.season)%100<85)seed++;p.seed=seed;}`);
 r(`{const id=S.pick.find(id=>physProfile(player(id)).hKnown&&developmentProfile(id).seed!==S.pick.map(x=>developmentProfile(x).seed)[0]);if(id)developmentProfile(id,true).age=18;}`);
 const agesBeforeGrowth=json(c,'S.pick.map(id=>developmentProfile(id).age)');
 const physical=json(c,'S.pick.map(id=>physProfile(player(id)))');r('runDevelopmentOffseason()');
 assert.equal(r("developmentProfile('marcus').age"),17,'unknown-height player still ages');assert.equal(r("developmentProfile('marcus').heightGain"),0,'unknown measurements must not become invented growth');
 const profiles=json(c,'S.pick.map(id=>developmentProfile(id))');assert(profiles.some(p=>p.heightGain===2),'cohort includes a height spurt');
 for(let i=0;i<profiles.length;i++)if(!physical[i].hKnown||agesBeforeGrowth[i]>=18)assert.equal(profiles[i].heightGain,0);
 r('playerDevelopmentRoom()');assert(r('document.getElementById("app").innerHTML.includes("Development history")'));
 assert.deepEqual(json(c,'players'),raw);assert.deepEqual(json(c,'inventoryRead().inventory'),collection.inventory);
 console.log('PASS: rotation minutes, conserved box scores, production XP caps, unavailable-player exclusion, replay guard, focused/costed training, bounded individual potential, plateaus/breakthroughs, printed-card preservation, account isolation/restore, offseason idempotency, physical growth and year-two handoff.');
})().catch(e=>{console.error(e);process.exit(1)});
