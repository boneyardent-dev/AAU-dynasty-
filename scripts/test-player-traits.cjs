const assert=require('assert');const {create,run,json}=require('./verify-draft.cjs');
(async()=>{
 const t=create(),c=t.context,r=s=>run(c,s);await r('bootCatalog()');r('chooseTeam(0);roster()');for(let i=0;i<8;i++)r('pickDraftPlayer(S.draft.offers[0])');
 const raw=json(c,'players'),inventory=json(c,'inventoryRead()'),roster=json(c,'S.pick');
 const assignments=json(c,'players.map(p=>playerTraitIDs(p.id))');
 assert(assignments.every(ids=>ids.length===2&&new Set(ids).size===2));
 assert.equal(new Set(assignments.flat()).size,11,'all requested traits represented');
 assert(r('players.every(p=>{const ids=playerTraitIDs(p.id);return PLAYER_TRAITS[ids[0]].family!==PLAYER_TRAITS[ids[1]].family})'));
 const id=roster[0];c.subject=id;
 function reset(ids,roll=1){c.fixtureTraits=ids;c.fixtureRoll=roll;r('D.playerTraits={v:1,players:Object.fromEntries(S.pick.map(id=>[id,[]]))};D.playerTraits.players[subject]=fixtureTraits;S.game=null;S.tactic="space";S.statLog=[];S.simulation={traits:preparePlayerTraits(Object.fromEntries(S.pick.map(id=>[id,fixtureRoll])))}');}
 reset(['gym-rat','clutch']);
 let award=json(c,'awardDevelopment(subject,60,{shooting:1},"Shooting training","training")');assert.equal(award.xp,72);assert.equal(award.traitXP,12);
 award=json(c,'awardDevelopment(subject,60,{shooting:1},"Game","game")');assert.equal(award.xp,60);
 award=json(c,'awardDevelopment(subject,40,{shooting:1},"Offseason","offseason")');assert.equal(award.xp,40);
 reset(['gym-rat','clutch']);r('S.five=[subject,...S.pick.filter(id=>id!==subject).slice(0,4)];S.half={us:40,them:40}');assert.equal(r('traitClosingMargin(S.simulation,"pressure")'),.8);
 r('S.half={us:50,them:30}');assert.equal(r('traitClosingMargin(S.simulation,"pressure")'),0);
 reset(['hustler','nervous']);r('S.half={us:40,them:40}');assert.equal(r('traitClosingMargin(S.simulation,"pressure")'),-.8);assert.equal(r('traitClosingMargin(S.simulation,"calm")'),-.3);
 reset(['gym-rat','crashout']);r('S.half={us:30,them:40}');assert.equal(r('traitClosingMargin(S.simulation,"pressure")'),-1);assert.equal(r('traitClosingMargin(S.simulation,"calm")'),.4);
 reset(['hates-cardio','flashy']);r('S.tactic="pace"');assert.equal(r('traitFatigue(subject,S.five,S.five)'),3);assert.equal(r('traitFatigue(subject,S.five,[])'),1.5);assert.equal(r('traitFatigue(subject,[],[])'),0);r('S.tactic="space"');assert.equal(r('traitFatigue(subject,S.five,S.five)'),1);
 reset(['gym-rat','streaky'],1.2);assert(Math.abs(r('S.simulation.traits.players[subject].execution')-1.27)<1e-8);
 reset(['gym-rat','streaky'],.8);assert(Math.abs(r('S.simulation.traits.players[subject].execution')-.73)<1e-8);
 reset(['gym-rat','flashy'],1.2);assert(r('S.simulation.traits.players[subject].execution')>1.2);
 reset(['gym-rat','flashy'],.8);assert(r('S.simulation.traits.players[subject].execution')<.8);
 reset(['gym-rat','cocky']);r('S.statLog=[{win:true}]');let rolls=json(c,'Object.fromEntries(S.pick.map(id=>[id,1]))');c.rollFixture=JSON.parse(JSON.stringify(rolls));assert(r('preparePlayerTraits(rollFixture).players[subject].execution')>1);r('S.statLog=[{win:false}]');c.rollFixture=JSON.parse(JSON.stringify(rolls));assert(r('preparePlayerTraits(rollFixture).players[subject].execution')<1);
 reset(['gym-rat','hacker'],1.1);r('S.tactic="press"');c.rollFixture=Object.fromEntries(roster.map(id=>[id,.8]));assert(r('preparePlayerTraits(rollFixture).players[subject].execution')<.8);
 c.rollFixture=Object.fromEntries(roster.map(id=>[id,1.1]));assert(r('preparePlayerTraits(rollFixture).players[subject].execution')>1.1);
 reset(['gym-rat','jumpy'],1.1);assert(r('S.simulation.traits.players[subject].execution')>1.1);
 r('S.pick.forEach(id=>D.playerTraits.players[id]=["gym-rat","clutch"]);S.simulation={traits:preparePlayerTraits(Object.fromEntries(S.pick.map(id=>[id,1])))};S.half={us:40,them:40}');assert.equal(r('traitClosingMargin(S.simulation,"calm")'),2.5);assert.equal(r('traitClosingMargin(S.simulation,"calm")'),2.5,'reading a plan cannot stack boosts');
 // Stat-share effects operate on the real minutes-aware box score and conserve totals.
 reset([]);r('S.screen="roster";startWeekend();Object.values(availabilityWeek()).forEach(x=>{x.out=false;x.practice=false});S.game=null;S.simulation={openingFive:[...S.five],formAtTip:{},rolls:Object.fromEntries(S.pick.map(id=>[id,1]))};');
 const originalRandom=Math.random;Math.random=()=>.5;
 try{
  const baseline=json(c,'buildBoxScore(80,70)');const rebounder=[...baseline.players].sort((a,b)=>b.reb-a.reb)[0];c.rebounder=rebounder.playerId;
  r('D.playerTraits.players[rebounder]=["hustler","jumpy"];S.simulation.traits=preparePlayerTraits(Object.fromEntries(S.pick.map(id=>[id,1])))');
  const active=json(c,'buildBoxScore(80,70)');assert(active.players.find(p=>p.playerId===rebounder.playerId).reb>rebounder.reb,'Hustler changes rebounding allocation');
  for(const key of ['reb','stl','blk'])assert.equal(active.players.reduce((n,p)=>n+p[key],0),active.totals[key]);
 }finally{Math.random=originalRandom;}
 // Full gameplay: traits saved with results, fatigue and capped totals; no reroll or duplicate rewards.
 r('S.pick.forEach(id=>D.playerTraits.players[id]=["gym-rat","clutch"]);S.statLog=[];S.screen="roster";startWeekend();Object.values(availabilityWeek()).forEach(x=>{x.out=false;x.practice=false});tipOff();suggestLineup();confirmPregame()');
 const sim=json(c,'S.simulation');r('confirmPregame();beginGame()');assert.deepEqual(json(c,'S.simulation'),sim);
 r('S.half={us:40,them:40};finishGame("pressure")');assert.equal(r('S.game.simulation.traitMargin'),2.5);
 assert(r('S.game.boxScore.players.reduce((n,p)=>n+p.pts,0)===S.game.us'));
 assert(r('S.game.boxScore.players.reduce((n,p)=>n+p.minutes,0)===160'));
 const xp=json(c,'D.development'),points=r('D.points');r('finishGame("pressure")');assert.deepEqual(json(c,'D.development'),xp);assert.equal(r('D.points'),points);
 r('saveAll()');await r('syncAccountSave()');const loaded=create(new Map(t.storage),t.remote);await run(loaded.context,'bootCatalog()');assert.deepEqual(json(loaded.context,'D.playerTraits'),json(c,'D.playerTraits'));assert.deepEqual(json(loaded.context,'S.statLog[0].simulation.traits'),json(c,'S.game.simulation.traits'));
 run(loaded.context,'storeAccountSnapshot({game:{},director:{points:75}})');assert.equal(run(loaded.context,'D.playerTraits'),undefined,'legacy accounts do not inherit another coach’s traits');
 assert.deepEqual(json(c,'players'),raw);assert.deepEqual(json(c,'inventoryRead().inventory'),inventory.inventory);assert.deepEqual(json(c,'S.pick'),roster);
 r('advanceGame();D.trainers=["shooting"];playerDevelopmentRoom()');assert(r('developmentCard(subject).includes("Gym Rat")'));assert(r('developmentCard(subject).includes("72 XP")'));r('playerTraitsRoom()');assert(r('Object.values(PLAYER_TRAITS).every(t=>document.getElementById("app").innerHTML.includes(t.name))'));
 console.log('PASS: all 11 traits; stable two-family assignments; Gym Rat training-only XP; close-game/calm/tilt rules; fatigue costs; execution variance; margin caps; saved results and account isolation; stale-click protection; preserved identities/cards/ownership; visible trait guide.');
})().catch(e=>{console.error(e);process.exit(1)});
