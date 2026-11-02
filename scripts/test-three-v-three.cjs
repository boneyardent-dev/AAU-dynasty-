const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({console,home(){},Math,Set});vm.runInContext(fs.readFileSync('public/three-v-three.js','utf8'),c);
const teams=[0,1].map(side=>[0,1,2].map(i=>({id:side+'-'+i,n:'Player '+side+i,s:72,a:85,pa:75,d:70})));
c.teams=teams;
let dunks=0,threes=0;
for(let seed=1;seed<=250;seed++){
 c.seed=seed;vm.runInContext('g=t3Create(teams,seed);while(!g.done)t3Step(g,"attack")',c);
 const g=JSON.parse(vm.runInContext('JSON.stringify(g)',c));assert(g.turn<=60);assert.equal(g.events.length,g.turn);
 for(let s=0;s<2;s++){assert.equal(g.score[s],g.rows[s].reduce((n,r)=>n+r.pts,0));assert.equal(g.score[s],g.events.filter(e=>e.side===s).reduce((n,e)=>n+e.points,0));for(const r of g.rows[s]){assert(r.threeMade<=r.threeAttempts);assert(r.threeMade*3+r.dunks*2<=r.pts);assert(r.energy>=20&&r.energy<=100);dunks+=r.dunks;threes+=r.threeAttempts;}}
 assert.equal(vm.runInContext('t3Step(g)',c),null);
}
assert(dunks>100);assert(threes>100);
vm.runInContext('a=t3Create(teams,42);b=t3Create(teams,42);while(!a.done)t3Step(a);while(!b.done)t3Step(b)',c);assert.equal(vm.runInContext('JSON.stringify(a)',c),vm.runInContext('JSON.stringify(b)',c));
let range=0,attack=0;for(let seed=1;seed<=100;seed++){c.seed=seed;vm.runInContext('a=t3Create(teams,seed);b=t3Create(teams,seed);while(!a.done)t3Step(a,"range");while(!b.done)t3Step(b,"attack")',c);range+=vm.runInContext('a.rows[0].reduce((n,r)=>n+r.threeAttempts,0)',c);attack+=vm.runInContext('b.rows[0].reduce((n,r)=>n+r.threeAttempts,0)',c);}assert(range>attack*1.4);
assert.throws(()=>vm.runInContext('t3Create([teams[0],teams[0]],1)',c));
console.log('PASS: 250 complete exhibitions; six distinct players; event/score/stat conservation; bounded energy; tracked threes and dunks; deterministic replay; game completion; coaching changes shot selection.');
