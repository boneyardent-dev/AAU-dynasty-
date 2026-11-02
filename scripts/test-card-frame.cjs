const fs=require('fs'),vm=require('vm'),assert=require('assert'),root=require('path').resolve(__dirname,'..')+'/';
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={opp:{id:'flash'}};
const ctx=vm.createContext({S,starters:()=>[],escapeHtml:esc,sixAttributes:['Ath','Bag','Hdl','IQ','Def','Shoot'],cardOvr:v=>Math.round(v.reduce((a,b)=>a+Number(b||0),0)/v.length),cardAttributes:p=>p.vals,playerProfile(){},Math,Number,Date,String,JSON,Object,Array});
['physical.js','card-frame.js'].forEach(f=>vm.runInContext(fs.readFileSync(root+'public/'+f,'utf8'),ctx));
const mk=(o={})=>({id:'x1',n:'Test Player',p:'G',a:80,q:80,vals:[80,80,80,80,80,80],catalog:{position:'PG',height:'6-2',weight:185,classYear:2027,archetype:'Floor General',...o.catalog},...o.top});
const card=p=>{ctx.__p=p;return vm.runInContext('aauCard(__p)',ctx)};
let h=card(mk());
assert(/aau-t2/.test(h)&&/>80</.test(h),'80 overall is tier 2');assert(/aau-t1/.test(card(mk({top:{vals:[70,70,70,70,70,70]}}))),'low overall is tier 1');assert(/aau-t3/.test(card(mk({top:{vals:[90,90,90,90,90,90]}}))),'high overall is tier 3');
assert(/Test Player/.test(h)&&/Floor General/.test(h)&&/PG/.test(h)&&/Strength/.test(h)&&/Speed/.test(h)&&/Rebounding/.test(h),'front and back content');
assert(/AAU DYNASTY/.test(h)&&!/<img/.test(h),'no art file means monogram only, no image request');
assert(/aria-label="Test Player, 80 overall, PG/.test(h)&&/tabindex="0"/.test(h)&&/role="button"/.test(h),'accessible');
const art=mk({catalog:{art:{versions:3,titles:['After Hours','Concrete Royalty','Arrival']}}});
h=card(art);assert(/<img class="aau-img"[^>]*src="\/cards\/x1\.webp"/.test(h)&&/After Hours/.test(h)&&/aau-t1/.test(h),'version 1 art, title, tier');
vm.runInContext("aauSetVersion('x1',3)",ctx);h=card(art);assert(/\/cards\/x1-v3\.webp/.test(h)&&/Arrival/.test(h)&&/aau-t3/.test(h),'version 3 switches art, title and frame color');
vm.runInContext("aauSetVersion('x1',9)",ctx);assert(/x1-v3\.webp/.test(card(art)),'version is clamped to what exists');
ctx.__p=art;assert(/Concrete Royalty/.test(vm.runInContext('aauChips(__p)',ctx)),'version chips list titles');assert.equal(vm.runInContext('aauChips({id:"y",catalog:{}})',ctx),'','no chips when there is one version');
h=card(mk({top:{n:'<img src=x onerror=alert(1)>'}}));assert(!/<img src=x/.test(h)&&/&lt;img/.test(h),'names are escaped');
h=card(mk({top:{n:'Maximilian Featherstone-Haugh'}}));assert(/--nfs:[0-9.]+cqw/.test(h)&&parseFloat(/--nfs:([0-9.]+)cqw/.exec(h)[1])<12.5,'long names shrink');
ctx.window={AAU_ART:{x1:['data:image/webp;base64,AAA']}};assert(/src="data:image\/webp;base64,AAA"/.test(card(mk({catalog:{art:{versions:1}}}))),'inline art map overrides the file path');
ctx.__p=mk();for(const r of ['Common','Uncommon','Rare','Epic','Legendary','Mythic']){const x=vm.runInContext(`aauCard(__p,{rarity:'${r}'})`,ctx);assert(new RegExp('aau-r-'+r.toLowerCase()).test(x)&&new RegExp('aau-rar">'+r+'<').test(x)&&!/aau-t\d/.test(x),'rarity '+r+' sets frame and pill')}
const seed=JSON.parse(fs.readFileSync(root+'data/players.json','utf8')).players,j=seed.find(p=>p.id==='dyn-2027-jalen-cross');
assert(j&&j.art.versions===3&&j.art.titles.length===3,'sample player has three art versions');
for(const n of ['dyn-2027-jalen-cross','dyn-2027-jalen-cross-v2','dyn-2027-jalen-cross-v3'])assert(fs.existsSync(root+'public/cards/'+n+'.webp'),n+' art file exists');
assert(seed.filter(p=>p.art).length===seed.filter(p=>p.isFictional).length,'every fictional catalog player is flagged with art');
console.log('PASS: tiers, six rarities, content, accessibility, no-art fallback, art versions and chips, escaping, long names, inline art map, seed flags and files.');
// The edition hierarchy is explicit on both faces and does not depend on OVR.
ctx.__p=mk({top:{vals:[95,95,95,95,95,95]}});
for(const [index,r] of ['Common','Uncommon','Rare','Epic','Legendary','Mythic'].entries()){
 const x=vm.runInContext(`aauCard(__p,{rarity:'${r}'})`,ctx);
 assert(x.includes('TIER '+(index+1)+' / 6'),'visible tier number on '+r);
 assert.equal(x.includes('class="aau-crown"'),index>=4,'front crown reserved for elite editions');
 assert.equal(x.includes('ELITE · '),index>=4,'elite stamp belongs to Legendary/Mythic');
 assert(x.includes('>95<'),'rarity does not alter overall');
 const staticCard=vm.runInContext(`aauCard(__p,{rarity:'${r}',interactive:false})`,ctx);
 assert(staticCard.includes('role="img" data-static="true"')&&!staticCard.includes('tabindex="0"'),'pack fronts do not create nested flip buttons');
}
console.log('PASS: explicit six-tier hierarchy, elite-only crown/stamp, fixed ratings, noninteractive pack fronts.');
