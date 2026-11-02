const assert=require('assert');const {create,run,json}=require('./verify-draft.cjs');
(async()=>{
 const t=create(),c=t.context,r=s=>run(c,s);await r('bootCatalog()');r('chooseTeam(0);roster()');for(let i=0;i<8;i++)r('pickDraftPlayer(S.draft.offers[0])');
 c.id=r('S.pick[0]');
 function verify(box){for(const row of box.players){assert(Number.isInteger(row.threeMade)&&Number.isInteger(row.threeAttempts));assert(row.threeMade>=0&&row.threeMade<=row.threeAttempts);assert(row.threeMade*3<=row.pts);if(row.minutes===0)assert.equal(row.threeAttempts,0);}for(const key of ['threeMade','threeAttempts','pts'])assert.equal(box.totals[key],box.players.reduce((n,row)=>n+row[key],0));}
 c.row={minutes:32,pts:30};c.p={...json(c,'player(id)'),p:'G'};
 assert.deepEqual(json(c,'threePointLine(row,p,"same-seed")'),json(c,'threePointLine(row,p,"same-seed")'));
 c.row={minutes:0,pts:0};assert.equal(r('threePointLine(row,p,"dnp").threeAttempts'),0);
 c.row={minutes:32,pts:1};assert.equal(r('threePointLine(row,p,"low").threeMade'),0);
 let weak=0,strong=0;
 for(let i=0;i<200;i++){c.seed='skill-'+i;c.row={minutes:32,pts:60};c.p.s=45;weak+=r('threePointLine(row,p,seed).threeMade');c.p.s=95;strong+=r('threePointLine(row,p,seed).threeMade');}
 assert(strong>weak*1.5,'shooting rating materially affects conversion across fixed seeds');
 r('startWeekend();Object.values(availabilityWeek()).forEach(x=>{x.out=false;x.practice=false});tipOff();suggestLineup();confirmPregame();finishGame("calm")');
 verify(json(c,'S.game.boxScore'));assert(r('boxTable(S.game.boxScore).includes("3PM–3PA")'));
 const before=json(c,'({game:S.game,development:D.development,points:D.points,inventory:inventoryRead()})');r('result();result();seasonStats()');assert.deepEqual(json(c,'({game:S.game,development:D.development,points:D.points,inventory:inventoryRead()})'),before);
 assert(r('app.innerHTML.includes("3PT GP")'));assert(r('developmentCard(id).includes("THREE-POINT SHOOTING")'));
 r('saveAll()');await r('syncAccountSave()');const restored=create(new Map(t.storage),t.remote);await run(restored.context,'bootCatalog()');assert.deepEqual(json(restored.context,'S.statLog[0].boxScore'),json(c,'S.statLog[0].boxScore'));
 const legacy={players:[{playerId:c.id,name:'Old player',position:'G',pts:12,reb:2,ast:3,stl:0,blk:0}],totals:{pts:12,reb:2,ast:3,stl:0,blk:0}};c.legacy=legacy;
 assert(r('boxTable(legacy).includes("<td>—</td>")'));assert.deepEqual(json(c,'legacy'),legacy,'rendering does not invent historical threes');
 c.games=[{boxScore:legacy},{boxScore:{players:[{playerId:c.id,threeMade:1,threeAttempts:2}]}},{boxScore:{players:[{playerId:c.id,threeMade:2,threeAttempts:8}]}}];
 assert.deepEqual(json(c,'threePointSummary(id,games)'),{threeMade:3,threeAttempts:10,threeGames:2});assert.equal(r('threePointPercent(threePointSummary(id,games))'),'30.0%','percentage uses total attempts, not average percentages');assert.equal(r('threePointPercent({threeMade:0,threeAttempts:0})'),'—');
 // Stress a range of score and minute allocations without altering the score-first engine.
 r('S.screen="half"');for(let i=0;i<100;i++){c.score=i;verify(json(c,'buildBoxScore(score,70)'));}
 console.log('PASS: bounded 3PM/3PA; conserved points/team totals; skill-sensitive conversion; deterministic shots; zero-minute/low-score cases; legacy exclusion; weighted percentages; player profiles; unchanged render rewards; account restore; 100 box scores.');
})().catch(e=>{console.error(e);process.exit(1)});
