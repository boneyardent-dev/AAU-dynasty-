const fs=require('fs'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'data/players.json'),'utf8'));
const cast=catalog.players.filter(p=>p.originalSeries==='concrete-royalty-v1');
assert.deepEqual(cast.map(p=>p.name).sort(),['Darius Vale','Jalen Cross','Kai Mori','Malik Okafor','Mateo Reyes','Owen Brooks'].sort(),'Concrete Royalty is a six-player collectible series');
assert(cast.every(p=>p.isFictional&&p.gameRatings&&p.signatureAbility&&p.art?.versions),'every original has fictional status, gameplay ratings, a signature ability, and card art');
for(const p of cast){const versions=p.art.versions;for(let v=1;v<=versions;v++){const suffix=v===1?'':`-v${v}`;assert(fs.existsSync(path.join(root,'public/cards',p.id+suffix+'.webp')),`${p.name} card portrait exists`);}}
assert.equal(cast.find(p=>p.id==='dyn-2027-jalen-cross').art.defaultVersion,2,'Jalen uses the Concrete Royalty art variant by default');
const pack=fs.readFileSync(path.join(root,'public/pack-premium.js'),'utf8'),api=fs.readFileSync(path.join(root,'app/api/players/route.ts'),'utf8');
assert(pack.includes("id:'concrete-royalty',name:'CONCRETE ROYALTY'"),'the featured drop is registered');
assert(pack.includes('/aau-dynasty-concrete-royalty-pack.png'),'the new illustrated pack artwork is wired into the shop');
assert(/targetSeries=themeId==='concrete-royalty'\?'concrete-royalty-v1':'circuit-originals-v1'/.test(pack),'Concrete Royalty packs draw from their own player series');
assert(/concreteRemaining=themeId==='concrete-royalty'&&fictionalPool\.length\?\[\.\.\.fictionalPool\]:null/.test(pack),'Concrete Royalty packs draw five different players');
assert(fs.existsSync(path.join(root,'public/aau-dynasty-concrete-royalty-pack.png')),'the pack art asset ships with the app');
assert(api.includes('concrete-royalty-v1'),'the database catalog version refreshes with this series');
console.log('PASS: six Concrete Royalty cards, player portraits, pack artwork, themed pool, and unique five-card pulls.');
