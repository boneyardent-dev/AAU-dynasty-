const assert=require('assert');const {create,run,json}=require('./verify-draft.cjs');
(async()=>{
 const t=create(),c=t.context,r=s=>run(c,s);await r('bootCatalog()');r('chooseTeam(0);roster()');for(let i=0;i<8;i++)r('pickDraftPlayer(S.draft.offers[0])');
 c.ids=json(c,'S.pick');c.hero=c.ids[0];
 function game(trait,extra={},minutes=20){return {us:70,them:69,boxScore:{players:[{playerId:c.hero,minutes}]},simulation:{traits:{players:{[c.hero]:{ids:[trait],notes:[],closingNotes:[],firstAdjustment:0,closingMargin:0,fatigue:0,...extra}}}}};}
 function moments(g){c.fixture=g;return json(c,'buildTraitMoments(fixture)');}
 assert.equal(moments(game('clutch')).length,0,'owning Clutch alone does not invent a moment');
 let g=game('clutch',{closingMargin:.8,closingNotes:['Clutch close-game lift']});const original=JSON.stringify(g);
 assert.equal(moments(g)[0].title,'Clutch answered the moment.');assert.equal(JSON.stringify(g),original,'story derivation is read-only');assert.deepEqual(moments(g),moments(g));
 assert.equal(moments(game('clutch',{closingMargin:.8,closingNotes:['Clutch close-game lift']},0)).length,0,'DNP gets no credit');
 assert.equal(moments({us:70,them:69,boxScore:{players:[]}}).length,0,'legacy games remain readable');
 assert(moments(game('crashout',{closingMargin:.4,closingNotes:['Crashout: calm response']}))[0].title.includes('calm'));
 assert.equal(moments(game('crashout',{closingMargin:-1,closingNotes:['Crashout tilt under pressure']}))[0].tone,'negative');
 assert.equal(moments(game('nervous',{closingMargin:-.3,closingNotes:['Nervous: calm reduced the penalty']}))[0].tone,'mixed');
 assert.equal(moments(game('hustler',{statChanges:{reb:0,stl:0}})).length,0);
 assert(moments(game('hustler',{statChanges:{reb:2,stl:1}}))[0].text.includes('2 rebounds'));
 assert.equal(moments(game('hustler',{statChanges:{reb:-1}})).length,0);
 assert(moments(game('jumpy',{statChanges:{blk:1}}))[0].text.includes('blocks'));
 assert.equal(moments(game('streaky',{firstAdjustment:.001})).length,0,'tiny changes are not a headline');
 assert.equal(moments(game('streaky',{firstAdjustment:-.07}))[0].tone,'negative');
 assert.equal(moments(game('flashy',{firstAdjustment:.05}))[0].tone,'positive');
 assert.equal(moments(game('cocky',{firstAdjustment:-.04}))[0].tone,'negative');
 assert.equal(moments(game('hacker',{firstAdjustment:-.06}))[0].tone,'negative');
 assert(moments(game('hates-cardio',{fatigue:4,fatigueByTrait:{'hates-cardio':3,jumpy:1}}))[0].text.includes('3 extra energy'),'only credit the recorded cardio cost');
 const cues=json(c,'traitHalftimeCues({traits:{players:{[hero]:{ids:["clutch","nervous"]}}}},{us:30,them:30},[hero])');assert.equal(cues.length,2);c.cues=cues;assert(r('traitMomentCards(cues).match(/<article/g).length')===1,'one featured card per player');
 assert(r('traitMomentSection([],"Example","final").includes("quiet trait night")'));
 // Real game integration: same score/XP after repeated rendering, save the story and read it in history.
 r('D.playerTraits={v:1,players:Object.fromEntries(S.pick.map(id=>[id,["gym-rat","clutch"]]))};startWeekend();Object.values(availabilityWeek()).forEach(x=>{x.out=false;x.practice=false});tipOff();suggestLineup();confirmPregame();S.half={us:40,them:40};finishGame("calm")');
 assert(r('S.statLog[0].traitMoments.length>0'));assert.equal(r('S.statLog[0].traitMoments[0].trait'),'clutch');
 const before=json(c,'({game:S.game,development:D.development,points:D.points,collection:inventoryRead()})');r('result();result()');
 assert.deepEqual(json(c,'({game:S.game,development:D.development,points:D.points,collection:inventoryRead()})'),before,'rendering does not award/recalculate');
 r('saveAll()');await r('syncAccountSave()');const restored=create(new Map(t.storage),t.remote);await run(restored.context,'bootCatalog()');assert.deepEqual(json(restored.context,'S.statLog[0].traitMoments'),json(c,'S.statLog[0].traitMoments'));
 r('advanceGame();seasonStats()');
 console.log('PASS: evidence-only trait stories; no ownership/DNP/legacy invention; calm/tilt/nerves; recorded stat and energy changes; quiet-night fallback; player deduplication; deterministic rendering without simulation/XP/reward changes; saved notebook.');
})().catch(e=>{console.error(e);process.exit(1)});
