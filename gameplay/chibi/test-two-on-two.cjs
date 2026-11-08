const assert=require('node:assert/strict');
const {TwoOnTwo,players}=require('./two-on-two.js');
assert.equal(new Set(players.map(p=>p.id)).size,4);
assert.deepEqual(players.slice(0,3).map(p=>p.name),['Tiger Stancil','Harley Hudson','Xander Timmerman']);
const m=new TwoOnTwo(55);const x=m.carrier.at.x;
for(let i=0;i<40;i++)m.step(1/60,{x:1,y:0});assert(m.carrier.at.x>x+20,'player responds to movement');
assert(m.action('crossover'));const side=m.hand;for(let i=0;i<20;i++)m.step(1/60);assert.equal(Math.sign(m.ball.x-m.carrier.at.x),side?1:-1,'ball changes hands');
assert(m.action('pass'));let frames=0;while(m.phase==='pass'&&frames++<100)m.step(1/60);assert.equal(m.carrier.name,'Harley Hudson');assert.equal(m.selected,m.carrier.id);
assert(m.action('shoot'));frames=0;while(m.phase!=='reset'&&frames++<180)m.step(1/60);assert.equal(m.phase,'reset','shot reaches rim and finishes');
for(let i=0;i<90;i++)m.step(1/60);assert.equal(m.side,1,'alternating possession');assert(m.action('switch'));assert(m.action('contest'));
const dunk=new TwoOnTwo(12);dunk.carrier.at={x:843,y:340};assert(dunk.action('pass'));while(dunk.phase==='pass')dunk.step(1/60);dunk.carrier.at={x:850,y:340};assert(dunk.action('dunk'));assert.equal(dunk.shot.kind,'dunk');
for(let i=0;i<110;i++){dunk.step(1/60);assert(dunk.actors.every(a=>Number.isFinite(a.at.x)&&a.at.x>=0&&a.at.x<=975));}
assert(dunk.events.some(e=>e.type==='rim_contact'&&e.kind==='dunk'));
assert(!('localStorage' in globalThis),'court simulation has no persistence dependency');
// Render the live mode through the same ChibiCourt adapter used by the existing 5v5.
const fs=require('node:fs'),vm=require('node:vm'),THREE=require('./three.min.js');
const ctx=new Proxy({measureText:()=>({width:50})},{get:(o,k)=>o[k]||(()=>{})});
const canvas=()=>({width:1280,height:720,getContext:()=>ctx});
const sandbox={THREE,AAUCourt:require('./engine.cjs'),document:{createElement:canvas},devicePixelRatio:1};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/software.js','utf8')+fs.readFileSync(__dirname+'/renderer.js','utf8')+';this.C=ChibiCourt;',sandbox);
const view=new sandbox.C(canvas()),live=new TwoOnTwo(44);view.render(live,{names:true});
assert.equal(view.people.size,4);const tiger=view.people.get(players[0].id),harley=view.people.get(players[1].id),xander=view.people.get(players[2].id);
assert(tiger.scale<harley.scale&&harley.scale<xander.scale,'distinct silhouettes');
let hand=tiger.limbs[1].end.getWorldPosition(new THREE.Vector3());assert(hand.distanceTo(view.ball.position)<.43,'dribble hand tracks ball');
live.action('crossover');for(let i=0;i<17;i++)live.step(1/60);view.render(live,{names:true});
hand=tiger.limbs[0].end.getWorldPosition(new THREE.Vector3());assert(hand.distanceTo(view.ball.position)<.43,'crossover hand tracks ball');
view.dispose();
console.log('PASS: 2v2 movement, crossover, pass, catch, shot, rim, dunk, defense and possession cycle.');
