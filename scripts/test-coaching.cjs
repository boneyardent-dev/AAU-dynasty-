const assert=require('assert');
const {create,run,json}=require('./verify-draft.cjs');
async function setup(){const t=create();await run(t.context,'bootCatalog()');run(t.context,'chooseTeam(0);roster()');for(let i=0;i<8;i++)run(t.context,'pickDraftPlayer(S.draft.offers[0])');run(t.context,"startWeekend();availabilityWeek();Object.values(availabilityWeek()).forEach(x=>{x.out=false;x.practice=false});tipOff();suggestLineup();confirmPregame()");return t;}
(async()=>{
 const t=await setup(),c=t.context;
 assert(run(c,"document.getElementById('app').innerHTML.includes('Coach the second half')"));
 assert(run(c,"document.getElementById('app').innerHTML.includes('replaces')"));
 const collection=json(c,'inventoryRead().inventory'),pick=json(c,'S.pick');
 const rotation=json(c,'benchRotation()'),opening=json(c,'S.five');
 run(c,"finishGame('bench')");
 assert.deepEqual(json(c,'S.five'),rotation.ids);
 assert(!run(c,`S.five.includes('${rotation.outgoing}')`));
 assert.equal(run(c,`S.game.simulation.energySpent['${rotation.outgoing}']`),run(c,`S.game.simulation.energySpent['${rotation.incoming}']`),'one half each charges equal fatigue');
 assert(run(c,`S.game.simulation.energySpent['${rotation.outgoing}']<S.game.simulation.energySpent[S.five.find(id=>S.game.simulation.openingFive.includes(id))]`));
 assert.deepEqual(json(c,'S.statLog[0].starters'),opening);
 assert.equal(run(c,'S.game.boxScore.players.reduce((n,p)=>n+p.pts,0)'),run(c,'S.game.us'));
 assert.equal(run(c,'S.game.simulation.closingDelta'),run(c,'S.game.simulation.closingParts.total+S.game.simulation.closingExecution+S.game.simulation.closingApproach-S.game.simulation.opponent'));
 const count=run(c,'S.statLog.length'),points=run(c,'D.points');run(c,"finishGame('pressure')");assert.equal(run(c,'S.statLog.length'),count);assert.equal(run(c,'D.points'),points);
 await run(c,'syncAccountSave()');const resumed=create(new Map(t.storage),t.remote);await run(resumed.context,'bootCatalog()');assert.deepEqual(json(resumed.context,'S.statLog[0].simulation'),json(c,'S.game.simulation'));assert.deepEqual(json(resumed.context,'S.five'),rotation.ids);
 // Directional checks: pressure must react to opponent composure and tired legs.
 run(c,'S.opp={...S.opp,q:60};S.five.forEach(id=>S.energy[id]=100)');const favorable=run(c,"coachingPlan('pressure').boost");run(c,'S.opp.q=99;S.five.forEach(id=>S.energy[id]=40)');assert(run(c,"coachingPlan('pressure').boost")<favorable);
 run(c,"S.opp={...S.opp,q:60};S.five.forEach(id=>S.energy[id]=100)");const good=run(c,"approachEffect(S.five,'press')");run(c,'S.opp.q=99');assert(run(c,"approachEffect(S.five,'press')")<good);
 // No playable reserve: disable rotation rather than silently ignore the call.
 run(c,"S.pick.filter(id=>!S.five.includes(id)).forEach(id=>availabilityWeek()[id].out=true)");assert.equal(run(c,'benchRotation()'),null);
 assert.deepEqual(json(c,'S.pick'),pick);assert.deepEqual(json(c,'inventoryRead().inventory'),collection);
 const absent=await setup(),ac=absent.context;
 run(ac,"S.pick.filter(id=>!S.five.includes(id)).forEach(id=>availabilityWeek()[id].out=true)");
 const rested=json(ac,'Object.fromEntries(S.pick.filter(id=>!S.five.includes(id)).map(id=>[id,playerEnergy(id)]))');
 run(ac,"finishGame('pressure')");
 for(const [id,energy] of Object.entries(rested)){assert.equal(run(ac,`playerEnergy('${id}')`),energy);assert.equal(run(ac,`S.game.simulation.energySpent['${id}']`),0);}
 assert(run(ac,'S.five.every(id=>S.game.simulation.energySpent[id]===19+tactics.find(t=>t.id===S.tactic).tax)'));
 // Complete an entire weekend and bracket using isolated state, preserving reward cadence.
 const w=await setup(),wc=w.context;
 run(wc,"finishGame('calm');advanceGame();tipOff();confirmPregame();finishGame('pressure');advanceGame();tipOff();confirmPregame();finishGame('star');advanceGame()");
 assert.equal(run(wc,'S.statLog.length'),3);assert.equal(run(wc,'inventoryRead().matches'),3);assert.equal(run(wc,'inventoryRead().packs'),2);
 run(wc,"startSemi();beginGame();confirmPregame();finishGame('calm');S.game.win=true;advanceGame();beginGame();confirmPregame();finishGame('calm');advanceGame()");
 assert.equal(run(wc,'S.screen'),'end');assert.equal(run(wc,'S.statLog.length'),5);assert(run(wc,'S.pick.every(id=>playerEnergy(id)>=0&&playerEnergy(id)<=100)'));
 console.log('PASS: visible coaching calls; real eligible rotation; split fatigue; closing-strength calculation; conserved scores; stale-call protection; saved coaching history; opponent/energy tradeoffs; unavailable reserves; intact ownership; five-game weekend flow and rewards. Bracket advancement forced for coverage.');
})().catch(e=>{console.error(e);process.exit(1)});
