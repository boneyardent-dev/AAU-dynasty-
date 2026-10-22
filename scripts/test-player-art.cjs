const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(root+'/data/player-art-manifest.json','utf8')),seed=JSON.parse(fs.readFileSync(root+'/data/players.json','utf8'));
const fictional=seed.players.filter(p=>p.isFictional),html=fs.readFileSync(root+'/game.html','utf8');
const core=[...html.matchAll(/\{id:'([^']+)',n:'([^']+)',r:'([^']+)',p:'([^']+)'/g)].map(m=>m[1]);assert.equal(Object.keys(manifest).length,new Set([...fictional.map(p=>p.id),...core]).size,'All fictional recruits, starters, and legacy recruits have mapped portraits');
assert(html.indexOf('src="/player-art.js"')<html.indexOf('src="/vault.js"'),'Fictional identities load before saved account cards');
const ctx=vm.createContext({players:[],prospects:[],catalogData:null,console,escapeHtml:String,S:{},starters:()=>[],cardAttributes:p=>Object.values(p.catalog?.gameRatings||{}),cardOvr:()=>80,sixAttributes:[]});
vm.runInContext(fs.readFileSync(root+'/public/player-art.js','utf8'),ctx);
assert.equal(ctx.players.length,fictional.length,'Fictional roster resolves with the API unavailable');
vm.runInContext(fs.readFileSync(root+'/public/physical.js','utf8'),ctx);vm.runInContext(fs.readFileSync(root+'/public/card-frame.js','utf8'),ctx);
const hashes=new Set();for(const [id,entry] of Object.entries(manifest)){
 assert(entry.versions.length>=1&&entry.src,'Portrait mapping includes a default and versions');
 for(const url of entry.versions){const file=root+'/public'+url;assert(fs.existsSync(file),id+' portrait file exists');const bytes=fs.readFileSync(file);assert(bytes.length>1000,id+' portrait is not empty');assert(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP',id+' uses an actual WebP file');}
 const hash=crypto.createHash('sha256').update(fs.readFileSync(root+'/public'+entry.src)).digest('hex');assert(!hashes.has(hash),id+' has distinct artwork');hashes.add(hash);
 ctx.p=ctx.players.find(p=>p.id===id)||{id,n:entry.name,p:'G',r:'Starter',s:80,pa:80,d:80,q:80,a:80};const card=vm.runInContext('aauCard(p)',ctx);assert(card.includes('class="aau-img"')&&card.includes(entry.src),id+' collection card renders its mapped portrait');
}
const decode=spawnSync('python3',['-c',`import json;from PIL import Image\nm=json.load(open('data/player-art-manifest.json'))\nfor p in m.values():\n for u in p['versions']:\n  im=Image.open('public'+u);im.load();assert im.width>=250 and im.height>=400,u\nprint('Decoded every mapped portrait successfully')`],{cwd:root,encoding:'utf8'});assert.equal(decode.status,0,decode.stderr);
console.log('PASS:',Object.keys(manifest).length,'distinct player portraits; all files decode; mapped art renders on collection cards; fictional identities available before network and account hydration.');
// Reproduce the blank saved-card case: account card arrives before the network catalog.
const fixture=require('./verify-draft.cjs').create(),run=s=>vm.runInContext(s,fixture.context);
run("catalogData=null;S.screen='packs'");
assert(run("prMiniCard({playerId:'dyn-2027-001',rarity:'Rare',quantity:1}).includes('/cards/dyn-2027-001.webp')"),'Saved cards render actual player art even without the network catalog');
assert(!run("prMiniCard({playerId:'dyn-2027-001',rarity:'Rare',quantity:1}).includes('pr-card-missing')"),'Saved cards resolve a real fictional profile instead of a placeholder');

assert(run("prMiniCard({playerId:'dyn-2027-001',rarity:'Rare',quantity:1}).includes('loading=\"eager\"')"),'Pack portraits preload before the card flips');

assert.deepEqual(run("players.filter(p=>p.catalog?.isFictional!==false&&!AAU_PLAYER_ART[p.id]).map(p=>p.id)"),[],'Every active fictional player, including legacy recruits, has a portrait mapping');
