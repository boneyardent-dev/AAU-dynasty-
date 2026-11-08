/* AAU Dynasty 2v2 court mode. Ephemeral state; never writes dynasty saves. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const toward=(a,b)=>{const d=distance(a,b)||1;return {x:(b.x-a.x)/d,y:(b.y-a.y)/d};};
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const hoop={x:910,y:340};
const players=[
 {id:'custom-tiger-stancil',name:'Tiger Stancil',position:'PG',team:0,number:30,skin:'#9b603d',profile:'tiger',r:{handle:93,pass:93,shoot:88,def:80,speed:84,finish:87,iq:94}},
 {id:'custom-harley-hudson',name:'Harley Hudson',position:'C',team:0,number:44,skin:'#795036',profile:'harley',r:{handle:76,pass:76,shoot:73,def:89,speed:94,finish:91,iq:85}},
 {id:'custom-mambas-xander',name:'Xander Timmerman',position:'SG',team:1,number:17,skin:'#ad7959',profile:'xander',r:{handle:80,pass:80,shoot:80,def:80,speed:80,finish:80,iq:80}},
 {id:'dyn-2027-021',name:'Micah Yoon',position:'PG',team:1,number:12,skin:'#b99175',profile:'micah',r:{handle:96,pass:96,shoot:83,def:90,speed:90,finish:85,iq:89}}
];
class TwoOnTwo {
 constructor(seed=2032){
  this.seed=seed>>>0;this.randomState=this.seed||1;this.score=[0,0];this.elapsed=0;this.events=[];this.actors=players.map((p,i)=>({...p,slot:i%2,at:{x:[370,610,540,780][i],y:[280,510,330,150][i]},target:{x:500,y:340},velocity:{x:0,y:0},gait:0,face:1,catchUntil:0,hair:i}));
  this.side=0;this.holder=0;this.selected=this.actors[0].id;this.phase='live';this.ball={x:0,y:0};this.height=25;this.shot=null;this.rimContact=null;this.stageTime=0;this.flight=0;this.done=false;this.doneTime=0;this.reboundWinner=null;this.hand=1;this.actionTime=0;this.driveTime=0;this.contestTime=0;this.caption='Tiger brings it up. Make a play.';this.lastPass=null;this.reset(0);
 }
 random(){this.randomState=(Math.imul(this.randomState,1664525)+1013904223)>>>0;return this.randomState/4294967296;}
 get off(){return this.actors.filter(a=>a.team===this.side);}
 get def(){return this.actors.filter(a=>a.team!==this.side);}
 get carrier(){return this.off[this.holder];}
 get control(){return this.actors.find(a=>a.id===this.selected);}
 reset(side){
  this.side=side;this.off.forEach((a,i)=>{a.at={x:i?565:350,y:i?510:300};a.velocity={x:0,y:0};});this.def.forEach((a,i)=>{a.at={x:i?690:570,y:i?500:320};a.velocity={x:0,y:0};});
  this.holder=0;this.selected=(side===0?this.off[0]:this.def[0]).id;this.phase='live';this.stageTime=0;this.shot=null;this.lastPass=null;this.rimContact=null;this.reboundWinner=null;this.contestTime=0;this.aiPassed=false;this.hand=1;this.caption=(side===0?'Mambas Black':'Mambas Silver')+' ball. Play to 11.';this.syncBall();
 }
 syncBall(){const a=this.carrier,target=this.hand?1:-1,blend=this.actionTime>.27?1-2*clamp((.45-this.actionTime)/.18,0,1):0,side=target*(1-blend);this.ball={x:a.at.x+22*side,y:a.at.y+9};const bounce=Math.abs(Math.cos(this.elapsed*Math.PI*3.8));this.height=18+35*bounce;}
 action(name){
  if(this.side===1&&name==='contest'&&this.phase==='gather'){this.contestTime=.5;this.shot.chance=clamp(this.shot.chance-.18,.08,.94);this.events.push({type:'contest',playerId:this.control.id});this.caption=this.control.name+' gets a hand up!';return true;}
  if(this.phase!=='live')return false;
  const a=this.carrier;
  if(this.side===0){
   if(name==='pass'){this.pass();return true;}
   if(name==='shoot'||name==='dunk'){
    const range=distance(a.at,hoop);
    if(name==='dunk'&&range>132){this.driveTime=.9;this.caption=a.name+' attacks the rim. Get close to dunk.';return true;}
    if(name==='dunk'&&(range>132||a.r.speed<85))return false;
    const contest=clamp(1-Math.min(...this.def.map(d=>distance(d.at,a.at)))/130,0,1);
    const kind=name==='dunk'?'dunk':range<100?'layup':'jumper';
    const value=range>285?3:2;
    const skill=kind==='jumper'?a.r.shoot:a.r.finish;
    const chance=clamp((kind==='dunk'?.88:kind==='layup'?.75:.65-Math.max(0,range-130)*.0008)+(skill-75)*.004-contest*.31,.08,.94);
    this.shot={index:this.holder,from:{...a.at},kind,value,chance,made:null,contest};this.phase='gather';this.stageTime=0;this.caption=a.name+(kind==='dunk'?' loads up for a dunk.':' gathers for a shot.');this.events.push({type:'gather',playerId:a.id});return true;
   }
   if(name==='crossover'){this.hand=1-this.hand;this.actionTime=.45;this.driveTime=.55;this.caption=a.name+' changes hands and bursts.';this.events.push({type:'crossover',playerId:a.id});return true;}
   if(name==='drive'){this.driveTime=.8;this.caption=a.name+' attacks the gap.';return true;}
  }else if(name==='contest'){
   this.contestTime=.5;this.caption=this.control.name+' contests!';const d=distance(this.control.at,a.at);
   if(d<53&&this.random()<clamp((this.control.r.def-a.r.handle+80)/270,.1,.4)){this.events.push({type:'steal',playerId:this.control.id});this.caption=this.control.name+' strips the ball!';this.phase='reset';this.stageTime=0;this.nextSide=0;}
   return true;
  }else if(name==='switch'){this.selected=this.def.find(d=>d.id!==this.selected).id;return true;}
  return false;
 }
 pass(){const a=this.carrier;this.from={...this.ball};this.passHeight=this.height;this.receiver=1-this.holder;this.flight=0;this.duration=clamp(distance(this.from,this.off[this.receiver].at)/620,.3,.75);this.lastPass={from:this.holder,to:this.receiver};this.phase='pass';this.stageTime=0;this.caption=a.name+' finds '+this.off[this.receiver].name+'.';this.events.push({type:'pass',playerId:a.id});}
 move(dt,input={}){
  const controlled=this.control;
  for(const a of this.actors){
   let desired={x:0,y:0};
   if(a===controlled){let x=clamp(input.x||0,-1,1),y=clamp(input.y||0,-1,1),len=Math.hypot(x,y)||1;desired={x:x/len,y:y/len};if(this.driveTime>0&&this.side===0&&a===this.carrier&&x===0&&y===0)desired=toward(a.at,hoop);}
   else if(a===this.carrier){const goal=this.side===1?hoop:{x:650,y:340};desired=toward(a.at,goal);if(this.side===0)desired={x:0,y:0};}
   else if(a.team===this.side){const goal={x:this.carrier.at.x+30,y:a.slot===1?520:140};desired=distance(a.at,goal)>55?toward(a.at,goal):desired;}
   else {const mark=a.slot===this.holder?this.carrier:this.off[1-this.holder];const goal=lerp(mark.at,hoop,a.slot===this.holder?.13:.26);desired=distance(a.at,goal)>36?toward(a.at,goal):desired;}
   const speed=(84+a.r.speed*.73)*(a===controlled&&this.driveTime>0?1.37:1),accel=650;
   const target={x:desired.x*speed,y:desired.y*speed};const delta={x:target.x-a.velocity.x,y:target.y-a.velocity.y};const k=Math.min(1,accel*dt/(Math.hypot(delta.x,delta.y)||1));a.velocity.x+=delta.x*k;a.velocity.y+=delta.y*k;
  }
  for(const a of this.actors){a.at.x=clamp(a.at.x+a.velocity.x*dt,30,965);a.at.y=clamp(a.at.y+a.velocity.y*dt,35,640);for(const b of this.actors){if(a===b)continue;let d=distance(a.at,b.at);if(d<48&&d>.01){a.at.x+=(a.at.x-b.at.x)/d*(48-d)*.5;a.at.y+=(a.at.y-b.at.y)/d*(48-d)*.5;}}
   if(Math.hypot(a.velocity.x,a.velocity.y)>6)a.gait+=dt*(7+Math.hypot(a.velocity.x,a.velocity.y)*.04);
  }
 }
 step(dt,input={}){
  dt=clamp(dt,0,1/30);this.elapsed+=dt;this.stageTime+=dt;this.actionTime=Math.max(0,this.actionTime-dt);this.driveTime=Math.max(0,this.driveTime-dt);this.contestTime=Math.max(0,this.contestTime-dt);
  if(this.phase==='reset'){if(this.stageTime>1.2&&!this.done)this.reset(this.nextSide);return;}
  if(this.phase==='live'){
   this.move(dt,input);this.syncBall();
   if(this.side===1){const a=this.carrier,range=distance(a.at,hoop),pressure=Math.min(...this.def.map(d=>distance(d.at,a.at)));if(!this.aiPassed&&this.stageTime>1.4&&pressure<90&&distance(this.off[1-this.holder].at,this.def[1].at)>120){this.aiPassed=true;this.pass();return;}
    if(range<130||this.stageTime>6){const contest=clamp(1-pressure/125,0,1);this.shot={index:this.holder,from:{...a.at},kind:range<100&&a.r.speed>85?'dunk':range<130?'layup':'jumper',value:2,chance:clamp(.7+(a.r.shoot-80)*.004-contest*.33-(this.contestTime>0?.19:0),.1,.9),made:null,contest};this.phase='gather';this.stageTime=0;this.caption=a.name+' goes up.';}}
   return;
  }
  if(this.phase==='pass'){
   this.flight=clamp(this.flight+dt/this.duration,0,1);const receiver=this.off[this.receiver];this.ball=lerp(this.from,receiver.at,this.flight);this.height=this.passHeight+(38-this.passHeight)*this.flight+20*Math.sin(this.flight*Math.PI);
   if(this.flight===1){this.holder=this.receiver;this.selected=this.side===0?receiver.id:this.selected;receiver.catchUntil=this.elapsed+.3;this.phase='live';this.stageTime=0;this.caption=receiver.name+' catches in rhythm.';this.events.push({type:'catch',playerId:receiver.id});this.syncBall();}return;
  }
  const sh=this.shot,a=this.off[sh.index];
  if(this.phase==='gather'){
   this.ball={x:a.at.x+8,y:a.at.y+9};this.height=48+this.stageTime*105;
   if(this.stageTime>=.32){sh.made=this.random()<sh.chance;this.phase='shot';this.stageTime=0;this.flight=0;this.events.push({type:'shot',playerId:a.id,kind:sh.kind,chance:sh.chance});this.caption=sh.kind==='dunk'?'ABOVE THE RIM!':'Shot in the air.';}return;
  }
  if(this.phase==='shot'){
   const duration=sh.kind==='dunk'?.48:1.02;this.flight=clamp(this.flight+dt/duration,0,1);this.ball=lerp(sh.from,hoop,this.flight);this.height=(sh.kind==='dunk'?70:90)+(103-(sh.kind==='dunk'?70:90))*this.flight+Math.sin(this.flight*Math.PI)*(sh.kind==='dunk'?16:110);
   if(this.flight===1){this.rimContact={time:this.elapsed,kind:sh.kind,made:sh.made};this.phase='rim';this.stageTime=0;this.events.push({type:'rim_contact',playerId:a.id,kind:sh.kind,made:sh.made});this.caption=sh.made?'COUNT IT!':'Off the rim!';}return;
  }
  if(this.phase==='rim'){
   this.ball={...hoop};this.height=103-75*clamp(this.stageTime/.5,0,1);
   if(this.stageTime>.48){if(sh.made){this.score[this.side]+=sh.value;this.events.push({type:'made',playerId:a.id,points:sh.value});this.caption=a.name+(sh.kind==='dunk'?' THROWS IT DOWN!':' scores '+sh.value+'.');}else{this.events.push({type:'miss',playerId:a.id});this.caption=a.name+' misses. Reset the possession.';}
    this.nextSide=1-this.side;this.phase='reset';this.stageTime=0;if(this.score.some(v=>v>=11)){this.done=true;this.caption=(this.score[0]>this.score[1]?'Mambas Black':'Mambas Silver')+' wins!';}}
  }
 }
 frame(){return this;}
 snapshot(){const actors=this.actors.map(a=>({...a,at:{...a.at},velocity:{...a.velocity}}));return {...this,actors,off:actors.filter(a=>a.team===this.side),def:actors.filter(a=>a.team!==this.side),ball:{...this.ball},shot:this.shot?{...this.shot,from:{...this.shot.from}}:null};}
}
root.AAUTwoOnTwo={TwoOnTwo,players};if(typeof module!=='undefined')module.exports=root.AAUTwoOnTwo;
})(typeof window!=='undefined'?window:globalThis);
