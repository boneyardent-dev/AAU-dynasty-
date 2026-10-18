const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const definitions=JSON.parse(fs.readFileSync(root+'/data/archetypes.json'));
const catalog=JSON.parse(fs.readFileSync(root+'/data/players.json'));
let code=fs.readFileSync(root+'/game.html','utf8').replace('__AAU_ARCHETYPE_DATA__',JSON.stringify(definitions));
const inline=[...code.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)].map(m=>m[1]?fs.readFileSync(root+'/public'+m[1],'utf8'):m[2]);
function create(storage=new Map(),remote={saved:null},seed=123){
 const app={innerHTML:'',querySelector:()=>({insertAdjacentHTML(){}})},badge={};
 const sandbox={console,JSON,Math,Date,Set,Uint32Array,Promise,window:{addEventListener(){}},document:{head:{appendChild(){}},createElement:()=>({}),getElementById:id=>id==='app'?app:badge,querySelector:()=>null},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{locks:{request:async(k,fn)=>fn()}},crypto:{getRandomValues(array){seed=(Math.imul(seed,1664525)+1013904223)>>>0;array[0]=seed;return array;},randomUUID:()=>String(seed++)},clearTimeout(){},setTimeout(){return 1;},confirm:()=>true,alert(e){throw Error(e)},fetch:async(url,init)=>{if(url==='/api/players')return {ok:true,json:async()=>catalog};if(init?.method==='POST'){remote.saved=JSON.parse(init.body);return {ok:true,json:async()=>({saved:true})};}return {ok:true,json:async()=>({authenticated:true,userId:'draft-test-user',saved:remote.saved})};}};
 const context=vm.createContext(sandbox);inline.forEach((src,i)=>{if(i<inline.length-1)vm.runInContext(src,context);});return {context,storage,remote};
}
const run=(c,s)=>vm.runInContext(s,c),json=(c,s)=>JSON.parse(run(c,`JSON.stringify(${s})`));
module.exports={create,run,json};
if(require.main===module)(async()=>{
 let t=create();
 const existingCollection={v:1,packs:4,inventory:{'marcus:silver-foil:Rare':{playerId:'marcus',edition:'silver-foil',rarity:'Rare',quantity:2,favorite:true,attributes:[94,78,76,77,83,95]}},pulls:[],last:null,matches:0};
 t.storage.set('aau82.collection.v1',JSON.stringify(existingCollection));
 await run(t.context,'bootCatalog()');run(t.context,'chooseTeam(0);roster()');
 const offered=new Set();let pending;
 for(let round=0;round<8;round++){
  assert.equal(run(t.context,'S.screen'),'draft');assert.equal(run(t.context,'S.pick.length'),round);
  const ids=json(t.context,'S.draft.offers');assert.equal(ids.length,3);assert.equal(new Set(ids).size,3);
  for(const id of ids){const portrait=run(t.context,`playerPortrait(player('${id}'),true)`);assert(/class="(generated-player-avatar|circuit-portrait|player-photo-frame)/.test(portrait),'every draft offer has a visual avatar');}
  for(const id of ids){assert(!offered.has(id));offered.add(id);assert(!json(t.context,'S.pick').includes(id));}
  if(round===3){
   await run(t.context,'syncAccountSave()');pending=JSON.stringify(ids);
   const next=create(new Map(t.storage),t.remote,999);await run(next.context,'bootCatalog();');run(next.context,'roster()');
   assert.equal(JSON.stringify(json(next.context,'S.draft.offers')),pending);assert.equal(run(next.context,'S.pick.length'),3);t=next;
  }
  const id=ids[round%3];run(t.context,`pickDraftPlayer('${id}')`);assert.equal(run(t.context,'S.pick.length'),round+1);
  const teamPanel=run(t.context,'draftedTeamPanel()');assert.equal((teamPanel.match(/class="draft-mini-avatar"/g)||[]).length,round+1,'every drafted player appears with an avatar in the team preview');
  run(t.context,`pickDraftPlayer('${id}')`);assert.equal(run(t.context,'S.pick.length'),round+1,'stale click must not take another player');
 }
 assert.equal(offered.size,24);assert.equal(run(t.context,'S.screen'),'roster');assert.equal(run(t.context,'S.five.length'),5);
 assert(run(t.context,"S.five.some(id=>player(id).p.includes('G'))"));assert(run(t.context,"S.five.some(id=>player(id).p.includes('B'))"));
 assert.equal(run(t.context,'D.points'),75);assert.deepEqual(json(t.context,'inventoryRead()'),existingCollection,'starter draft must preserve card quantities, favorites and packs');
 assert.equal(new Set(json(t.context,'S.pick')).size,8);assert(run(t.context,'S.draft.complete'));
 const labels=json(t.context,'players.map(p=>projectedArchetype(p).name)');console.log('Archetypes represented:',[...new Set(labels)].join(', '));
 assert.equal(new Set(labels).size,9);
 run(t.context,"startWeekend();tipOff();confirmPregame();finishGame('calm');advanceGame()");assert.equal(run(t.context,'S.wins+S.losses'),1);
 await run(t.context,'syncAccountSave()');const reloaded=create(new Map(t.storage),t.remote);await run(reloaded.context,'bootCatalog()');run(reloaded.context,'roster()');assert.equal(run(reloaded.context,'S.pick.length'),8);
 assert(run(reloaded.context,'S.draft.complete'));assert.equal(run(reloaded.context,'S.wins+S.losses'),1);
 const original=json(reloaded.context,'S.pick');run(reloaded.context,'chooseTeam(1);roster()');assert.deepEqual(json(reloaded.context,'S.pick'),original,'existing teams must stay intact');
 const legacySaved=json(reloaded.context,'snapshotForAccount()');delete legacySaved.game.draft;
 const legacy=create(new Map(),{saved:legacySaved});await run(legacy.context,'bootCatalog()');run(legacy.context,'roster()');
 assert.deepEqual(json(legacy.context,'S.pick'),original);assert.equal(run(legacy.context,'S.draft'),null);
 for(let attempt=0;attempt<60;attempt++){
  const a=create(new Map(),{saved:null},attempt+4);await run(a.context,'bootCatalog()');run(a.context,'chooseTeam(0);roster()');
  for(let round=0;round<8;round++){const ids=json(a.context,'S.draft.offers');assert.equal(ids.length,3);run(a.context,`pickDraftPlayer('${ids[(attempt+round)%3]}')`);}
  const counts=json(a.context,'teamIdentity().counts');assert(counts.G>=2&&counts.W>=2&&counts.B>=2);
 }
 console.log('PASS: three choices × eight rounds; 24 nonrepeated offers; account-backed mid-draft resume; stale-click protection; nine archetypes; completed roster; tournament play; legacy roster preserved; 60 randomized drafts.');
})().catch(e=>{console.error(e);process.exit(1)});
