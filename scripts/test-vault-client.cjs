const fs=require('fs'),vm=require('vm'),assert=require('assert'),root=require('path').resolve(__dirname,'..')+'/';
const ls={};let calls=[],local=[],alerts=[],posts=[],get={status:401,body:{error:'Sign in'}},post={};
const players=[{id:'a',n:'Alpha Guard',p:'G',r:'Floor General',a:80},{id:'b',n:'Beta Big',p:'B',r:'Rim Protector',a:80}];
const ctx=vm.createContext({localStorage:{getItem:k=>ls[k]??null,setItem:(k,v)=>{ls[k]=v}},collectionKey:'col',players,cardAttributes:p=>[p.a],S:{screen:'home'},PR:{phase:'idle',shopBusy:false},prFeaturedDrop:()=>({id:'midnight-run'}),prSound:()=>{},packBusy:false,
 alert:m=>alerts.push(m),circuitPost:(...a)=>calls.push(['post',...a]),saveAll:()=>calls.push('save'),packRoom:()=>calls.push('packRoom'),rewards:()=>calls.push('rewards'),
 fetch:async(u,o)=>{if(o&&o.method==='POST'){const b=JSON.parse(o.body);posts.push(b);const r=post[b.action];return {ok:r.ok!==false,status:r.status||200,json:async()=>r.body}}return {ok:get.status===200,status:get.status,json:async()=>get.body}},
 Promise,JSON,Object,Array,Error,Math,Date,Set,Number,String});
const run=s=>vm.runInContext(s,ctx);
run(`function inventoryRead(){const raw=localStorage.getItem(collectionKey);return raw?JSON.parse(raw):{v:1,packs:1,inventory:{},pulls:[],last:null,matches:0}}
async function inventoryChange(fn){const c=inventoryRead(),r=fn(c);localStorage.setItem(collectionKey,JSON.stringify(c));return r}
async function prCommitFiveCards(){__local('open')}async function collectPackBatch(){await inventoryChange(c=>{c.last=null});__local('collect')}
async function toggleCardFavorite(key){await inventoryChange(c=>{c.inventory[key].favorite=!c.inventory[key].favorite});__local('fav')}
async function purchaseFeaturedPack(){__local('shop')}`);
ctx.__local=n=>local.push(n);
vm.runInContext(fs.readFileSync(root+'public/retention.js','utf8').replace(/const RT_/g,'var RT_'),ctx);
vm.runInContext(fs.readFileSync(root+'public/vault.js','utf8'),ctx);
const vault=(o={})=>({packs:3,matches:7,packThemes:[],last:null,cards:[{cardKey:'a:silver-foil:Epic',playerId:'a',rarity:'Epic',quantity:2,favorite:true,specialEdition:'CIRCUIT BREAKERS'},{cardKey:'zz:silver-foil:Rare',playerId:'zz',rarity:'Rare',quantity:1,favorite:false,specialEdition:null}],daily:{last:'2026-10-20',streak:2,best:4},season:{id:'s1',xp:40,claimed:[]},goals:{guards5:'2026-10-19'},...o});
(async()=>{
 await new Promise(r=>setTimeout(r,0));assert.equal(run('aauVault.enabled'),false,'signed out: local play');
 await run('prCommitFiveCards()');await run('purchaseFeaturedPack()');assert.deepEqual(local,['open','shop'],'signed out uses the local code paths');
 ls.col=JSON.stringify({v:1,packs:9,inventory:{old:{}},pulls:[],last:null,matches:1});
 get={status:200,body:{vault:vault()}};assert.equal(await run('vaultHydrate()'),true);assert.equal(run('aauVault.enabled'),true);
 let c=JSON.parse(ls.col);assert.equal(c.packs,3,'server pack count replaces the local one');assert.equal(c.matches,7);assert.deepEqual(Object.keys(c.inventory),['a:silver-foil:Epic','zz:silver-foil:Rare'],'cards are retained until their player profiles load');
 const e=c.inventory['a:silver-foil:Epic'];assert.deepEqual([e.quantity,e.favorite,e.specialEdition,e.attributes[0]],[2,true,'CIRCUIT BREAKERS',80]);assert.equal(c.daily.streak,2);assert.equal(c.season.xp,40);assert.equal(c.goals.guards5,'2026-10-19');
 players.push({id:'zz',n:'Late Profile',p:'G',r:'Guard',a:72});assert.equal(run("players.find(p=>p.id===JSON.parse(localStorage.getItem(collectionKey)).inventory['zz:silver-foil:Rare'].playerId).n"),'Late Profile','deferred player data resolves a previously loaded card');
 const gameHtml=fs.readFileSync(root+'game.html','utf8');assert(/for\(const c of catalogData\.players\)[\s\S]*?await vaultHydrate\(\);home\(\)/.test(gameHtml),'rehydrate saved cards after the player catalog is ready');
 assert.equal(JSON.parse(ls['col:local-backup']).packs,9,'the old local collection is backed up once');
 get={status:200,body:{vault:vault({packs:4})}};await run('vaultHydrate()');assert.equal(JSON.parse(ls['col:local-backup']).packs,9,'backup is not overwritten');
 // opening a pack goes to the server and never to the local draw
 local=[];const batch={batchId:'B1',themeId:'t',bonusSupport:'scout',cards:[{pullId:'p1',playerId:'a',rarity:'Legendary',specialEdition:'PEACH JAM ELITE',cardKey:'a:silver-foil:Legendary'},{pullId:'p2',playerId:'b',rarity:'Common',specialEdition:null,cardKey:'b:silver-foil:Common'}]};
 post.open={body:{vault:vault({packs:2,last:batch,cards:[{cardKey:'a:silver-foil:Legendary',playerId:'a',rarity:'Legendary',quantity:1,favorite:false,specialEdition:'PEACH JAM ELITE'}]})}};
 await run('prCommitFiveCards()');c=JSON.parse(ls.col);assert.equal(local.length,0,'no local draw when signed in');assert.equal(c.packs,2);assert.equal(c.last.batchId,'B1');assert.equal(c.last.cards[0].revealed,false);assert.equal(c.support.scout,1,'bonus support added once');
 assert(calls.some(x=>x[0]==='post'&&/PEACH JAM ELITE/.test(x[3])),'news post for a Legendary pull');
 // hydrating in the middle of a reveal keeps reveal progress and does not add support again
 await run(`inventoryChange(c=>{c.last.cards[0].revealed=true})`);get={status:200,body:{vault:vault({packs:2,last:batch})}};await run('vaultHydrate()');c=JSON.parse(ls.col);assert.equal(c.last.cards[0].revealed,true);assert.equal(c.support.scout,1);
 // server refusal is shown, collect clears the batch on the server, favorites sync
 post.open={ok:false,status:409,body:{error:'Play more games to earn a pack.'}};await run('prCommitFiveCards()');assert(/Play more games/.test(alerts.at(-1)));
 post.collect={body:{vault:vault({packs:2,last:null})}};await run('collectPackBatch()');assert.equal(JSON.parse(ls.col).last,null);assert(posts.some(p=>p.action==='collect'));
 post.favorite={body:{vault:vault()}};await run(`toggleCardFavorite('a:silver-foil:Epic')`);assert(posts.some(p=>p.action==='favorite'&&p.cardKey==='a:silver-foil:Epic'&&p.value===false));
 // rewards come from the server
 post.daily={body:{granted:2,streak:3,vault:vault({packs:5})}};const d=await run('rtClaimDaily()');assert.deepEqual([d.pk,d.streak],[2,3]);assert.equal(JSON.parse(ls.col).packs,5);
 post.daily={body:{granted:0,streak:3,vault:vault({packs:5})}};assert.equal(await run('rtClaimDaily()'),null,'already claimed');
 post.goal={body:{granted:1,vault:vault({packs:6})}};assert.equal(await run(`rtClaimGoal('guards5')`),1);post.level={body:{granted:0,vault:vault({packs:6})}};assert.equal(await run('rtClaimLevel(2)'),0);
 assert(posts.some(p=>p.action==='goal'&&p.id==='guards5')&&posts.some(p=>p.action==='level'&&p.n===2));
 run(`var __c={season:null};rtXp(__c,20)`);assert.equal(run('__c.season'),null,'local XP is off when the server holds it');
 local=[];post['test-purchase']={body:{vault:vault({packs:7,packThemes:['midnight-run']})}};await run('purchaseFeaturedPack()');assert.equal(local.length,0,'account testing purchase does not use the phone-only shop');assert(posts.some(p=>p.action==='test-purchase'&&p.theme==='midnight-run'),'account testing purchase is validated by the server');assert.equal(JSON.parse(ls.col).packs,7);assert.deepEqual(JSON.parse(ls.col).packThemes,['midnight-run'],'testing purchase refreshes the account vault');
 get={status:401,body:{error:'Sign in'}};await run('vaultHydrate()');assert.equal(run('aauVault.enabled'),false,'signing out turns it off');
 console.log('PASS: signed-out stays local; signed-in mirrors the server vault with a one-time local backup; opens, collects, favorites, daily, goals, levels, and testing pack purchases go to the server; reveal progress survives refresh.');
})().catch(e=>{console.error(e);process.exit(1)});
