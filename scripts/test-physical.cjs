const fs=require('fs'),vm=require('vm'),assert=require('assert'),root=require('path').resolve(__dirname,'..')+'/';
const mk=(id,pos,h,w,a=80,q=80,cy=2027)=>({id,p:pos,a,q,catalog:{height:h,weight:w,classYear:cy}});
const S={opp:{id:'flash'}};let lineup=[];
const ctx=vm.createContext({S,starters:()=>lineup,Math,Number,Date,String,JSON,Object,Array});
vm.runInContext(fs.readFileSync(root+'public/physical.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),P=p=>{ctx.__p=p;return run('physProfile(__p)')};
// ratings follow size
const big=P(mk('b','B','7-0',245)),guard=P(mk('g','G','5-10',165)),wing=P(mk('w','W','6-6',205));
assert(big.rebound>wing.rebound&&wing.rebound>guard.rebound,'rebounding rises with height');
assert(big.strength>guard.strength,'strength rises with size');assert(guard.speed>big.speed,'speed falls as size rises');
assert(P(mk('s','G','6-2',230)).strength>P(mk('l','G','6-2',165)).strength,'heavier frame is stronger at equal height');
assert(P(mk('s','G','6-2',230)).speed<P(mk('l','G','6-2',165)).speed,'heavier frame is slower at equal height');
assert(P(mk('q','G','6-2',185,95)).speed>P(mk('r','G','6-2',185,70)).speed,'athleticism still drives speed');
for(const x of [big,guard,wing])for(const k of ['strength','speed','rebound'])assert(x[k]>=40&&x[k]<=99,'bounded');
// missing data falls back to position averages and is flagged
const nr=P({id:'n',p:'G',a:80,q:80,catalog:{height:'Not reported',weight:null}});assert.equal(nr.inches,75);assert(!nr.hKnown&&!nr.wKnown);
const tiger=P(mk('t','G','5-4',null));assert(tiger.hKnown&&!tiger.wKnown&&tiger.lbs>100&&tiger.lbs<140,'known height, estimated weight');
assert(P({id:'x',p:'B',a:80,q:80}).inches===82,'players without catalog data use position defaults');
// matchups: size beats a small, quick team on the boards; a small lineup loses to a tall team
lineup=[mk('1','B','6-10',240),mk('2','B','6-9',230),mk('3','W','6-6',210),mk('4','W','6-6',205),mk('5','G','6-2',190)];
S.opp={id:'flash'};assert(run('matchupEdge()')>0,'big lineup has the edge on Flashpoint');
lineup=[mk('1','G','5-10',165),mk('2','G','6-0',170),mk('3','G','6-1',175),mk('4','W','6-3',185),mk('5','W','6-4',190)];
S.opp={id:'summit'};assert(run('matchupEdge()')<0,'small lineup is at a disadvantage vs a tall team');
S.opp={id:'flash'};assert(run('matchupEdge()')>-3.6&&run('matchupEdge()')<3.6,'edge is bounded');
S.opp={id:'unknown'};run('matchupEdge()');assert(/Your starters average/.test(run('sizeLine()')),'size report renders');
assert(Math.abs(run('physTeam(starters())'))<=2,'team term bounded');
// growth projections
run("physNow=()=>new Date('2026-10-12T12:00:00Z')");
const young=run("physProject({p:'G',a:80,q:80,catalog:{height:'5-4',weight:120,classYear:2032}})");
assert(young.growth>=6&&young.growth<=12&&young.lbs>150,'class of 2032 projects substantial growth, got '+JSON.stringify(young));
const senior=run("physProject({p:'G',a:80,q:80,catalog:{height:'6-3',weight:190,classYear:2027}})");assert(senior.growth<=1,'seniors are close to full size');
assert.equal(run("physProject({p:'G',a:80,q:80,catalog:{height:'Not reported',classYear:2030}})"),null,'no projection without a height');
ctx.__html=run("physHtml({p:'G',a:80,q:80,catalog:{height:'5-4',weight:null,classYear:2032}})");
assert(/Strength/.test(ctx.__html)&&/Rebounding/.test(ctx.__html)&&/estimated/.test(ctx.__html)&&/Growth projection/.test(ctx.__html)&&/not a prediction/.test(ctx.__html),'panel renders with estimate labels');
// the generated class gives sensible spreads
const seed=JSON.parse(fs.readFileSync(root+'data/players.json','utf8')).players.filter(p=>p.id.startsWith('dyn-'));
const prof=seed.map(c=>{const g=c.gameRatings;return {pos:c.position,...P({id:c.id,p:['PG','SG','CG'].includes(c.position)?'G':['C','PF'].includes(c.position)?'B':'W',a:g.Athleticism,q:g['Basketball IQ'],catalog:c})}});
const m=(pos,k)=>{const r=prof.filter(x=>pos.includes(x.pos));return r.reduce((s,x)=>s+x[k],0)/r.length};
assert(m(['C'],'rebound')>m(['PG'],'rebound')+15,'centers out-rebound point guards by a wide margin');
assert(m(['PG'],'speed')>m(['C'],'speed'),'guards are quicker than centers');
console.log('PASS: size drives strength, speed, rebounding; estimates flagged; matchup edges bounded and directional; team term bounded; growth projections; panel renders; seed class spreads.');
