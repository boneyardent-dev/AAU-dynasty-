const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..')+'/';
let cur='2026-10-12',store={v:1,packs:1,inventory:{},pulls:[],last:null,matches:0},html='';
const players=[];['G','W','B'].forEach((g,gi)=>{for(let i=0;i<40;i++)players.push({id:g+i,n:g+i,r:'Style'+(i%9),p:g})});
const ctx=vm.createContext({players,S:{},alert(e){throw new Error(e)},inventoryRead:()=>JSON.parse(JSON.stringify(store)),
 inventoryChange:async fn=>{const c=JSON.parse(JSON.stringify(store)),r=fn(c);store=c;return r},frame:h=>{html=h},button:(t,f)=>`<button onclick="${f}">${t}</button>`,Date,Math,JSON,Set,Number,Object,Array,Promise,RegExp,fetch:async()=>({ok:true,json:async()=>({date:cur})})});
vm.runInContext(fs.readFileSync(root+'public/retention.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),day=d=>{cur=d};
const own=ids=>{store.inventory={};ids.forEach(id=>store.inventory[id+':k']={playerId:id,quantity:1})};
(async()=>{
 day('2026-10-12');let r=await run('rtClaimDaily()');assert.deepEqual([r.pk,r.streak,store.packs],[1,1,2],'first claim');
 assert.equal(await run('rtClaimDaily()'),null,'no double claim same day');assert.equal(store.packs,2);
 day('2026-10-13');r=await run('rtClaimDaily()');assert.equal(r.streak,2);
 day('2026-10-14');r=await run('rtClaimDaily()');assert.deepEqual([r.pk,r.streak],[2,3],'day 3 bonus');
 for(let d=15;d<=17;d++){day('2026-10-'+d);await run('rtClaimDaily()')}
 day('2026-10-18');r=await run('rtClaimDaily()');assert.deepEqual([r.pk,r.streak],[3,7],'day 7 bonus');
 day('2026-10-19');r=await run('rtClaimDaily()');assert.deepEqual([r.pk,r.streak],[1,8],'cycle restarts at 1 pack');
 day('2026-10-22');r=await run('rtClaimDaily()');assert.equal(r.streak,1,'missed days reset streak');assert.equal(store.daily.best,8,'best kept');
 day('2026-10-20');assert.equal(await run('rtClaimDaily()'),null,'clock set backwards cannot claim again');
 const before=store.packs;own(['G0','G1','G2','G3']);assert.equal(await run("rtClaimGoal('guards5')"),0,'goal not ready');assert.equal(store.packs,before);
 own(['G0','G1','G2','G3','G4']);assert.equal(await run("rtClaimGoal('guards5')"),1);assert.equal(store.packs,before+1);
 assert.equal(await run("rtClaimGoal('guards5')"),0,'goal pays once');
 own(['W0','W1','W2','W3','W4','G0','B0','B1']);const gs=run('rtGoalState()');assert.equal(gs.find(g=>g.id==='wings5').ready,true);
 assert.equal(gs.find(g=>g.id==='guards5').done,true,'claimed goals stay done');
 own(Array.from({length:25},(_,i)=>'G'+i));assert.equal(run('rtGoalState()').find(g=>g.id==='col25').ready,true);
 let ss=run('rtSeasonState()');assert.equal(ss.xp,210,'xp from 9 daily claims + 1 goal');assert.equal(ss.lvl,2);
 const pk0=store.packs;assert.equal(await run('rtClaimLevel(1)'),1);assert.equal(store.packs,pk0+1);assert.equal(await run('rtClaimLevel(1)'),0,'level pays once');assert.equal(await run('rtClaimLevel(3)'),0,'locked level');
 run('inventoryChange(c=>rtXp(c,20))');await Promise.resolve();assert.equal(store.season.xp,230,'game xp');
 day('2026-11-20');await run('rtClaimDaily()');assert.equal(store.season.xp,230,'no xp after season ends');assert.equal(run('rtSeasonState()').over,true);
 day('2026-10-30');run('rewards()');assert(html.includes('Claim')&&html.includes('Collection goals'),'rewards screen renders');
 assert(run('rtReadyCount()')>=2,'ready count includes daily + goals');
 console.log('PASS: first claim; no double claim; streak; day 3 and day 7 bonuses; cycle; streak reset keeps best; backwards clock; goals gated, pay once; season xp, levels pay once, season end; screen renders.');
})().catch(e=>{console.error(e);process.exit(1)});
