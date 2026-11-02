/* AAU Dynasty / shared HTML court component. No network, storage or reward writes. */
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),V=(x,y)=>({x,y}),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),mix=(a,b,t)=>V(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t),unit=(a,b)=>{const d=dist(a,b)||1;return V((b.x-a.x)/d,(b.y-a.y)/d);};
const RIM_HEIGHT=103;
const TEAM_SIZE=5;
const hoop=V(910,340),spots=[V(480,320),V(660,85),V(480,510),V(850,635),V(840,280)];
function ratings(p){const r=p.gameRatings||{};return {shoot:p.s??r.Shooting??72,pass:p.pa??r['Ball Handling']??72,iq:p.q??r['Basketball IQ']??72,def:p.d??r.Defense??72,speed:p.a??r.Athleticism??72,handle:p.h??p.pa??r['Ball Handling']??72,finish:p.finishing??((p.a??r.Athleticism??72)*.6+(p.h??r['Ball Handling']??72)*.25+(p.q??r['Basketball IQ']??72)*.15)};}
class Match {
 constructor(teams,seed=2032){
  if(!Array.isArray(teams)||teams.length!==2||teams.some(t=>!Array.isArray(t.players)||t.players.length!==TEAM_SIZE))throw Error('Court needs two teams of five.');
  const ids=teams.flatMap(t=>t.players.map(p=>p.id));if(new Set(ids).size!==TEAM_SIZE*2)throw Error('Court player IDs must be unique.');
  this.teams=JSON.parse(JSON.stringify(teams));this.score=[0,0];this.possession=0;this.coverage='help';this.start(seed,0);
 }
 random(){this.state=(Math.imul(this.state,1664525)+1013904223)>>>0;return this.state/4294967296;}
 start(seed,side=this.side||0){
  this.seed=seed>>>0;this.state=hash(this.seed+":court-v1");this.side=side;this.before=[...this.score];this.elapsed=0;this.stageTime=0;this.phase='advance';this.caption='Walk it up. Set the floor.';this.events=[];this.holder=0;this.receiver=-1;this.ball=V(130,320);this.height=18;this.flight=0;this.after='';this.shot=null;this.shotTargets=null;this.done=false;this.doneTime=0;this.lastPass=null;this.reboundSpot=null;this.reboundWinner=null;this.rimScored=false;this.trail=[];this.attack=null;this.euroUsed=false;this.finishKind=null;this.rimContact=null;this.cushion=28+this.random()*42;this.helpDelay=.2+this.random()*1.15;this.readRoll=this.random();this.moveRoll=this.random();
  this.actors=[];for(let team=0;team<2;team++){const active=team===side;const roster=this.teams[team].players;roster.forEach((p,i)=>{const at=active?(i===0?V(195,320):{...spots[i]}):V(spots[i].x+40+this.random()*35,spots[i].y+(this.random()-.5)*60);this.actors.push({id:p.id,name:p.name||p.n,position:p.position||p.p||'G',team,slot:i,at,target:{...at},velocity:V(0,0),r:ratings(p),gait:0,face:1,catchUntil:0,defenseMode:'contain',skin:p.skin||['#985e3c','#c38b65','#70432e','#d4a07d'][hash(p.id)%4],hair:hash(p.id)%3,number:p.avatar?.number||i+1});});}
  this.off=this.actors.filter(a=>a.team===side);this.def=this.actors.filter(a=>a.team!==side);this.log('start',this.off[0]);
 }
 replay(){this.score=[...this.before];this.start(this.seed,this.side);}
 next(){this.possession++;this.start(this.seed+1,1-this.side);}
 log(type,a,extra={}){this.events.push({type,time:Math.round(this.elapsed*100)/100,playerId:a?.id,...extra});}
 contactRim(){this.rimContact={time:this.elapsed,kind:this.shot.kind,made:this.shot.made};this.log('rim_contact',this.off[this.shot.index],{kind:this.shot.kind,made:this.shot.made});}
 phaseTo(phase,caption){this.phase=phase;this.stageTime=0;this.caption=caption;}
 nearest(at){return Math.min(...this.def.map(a=>dist(a.at,at)));}
 pass(to,after){
  this.from={...this.ball};this.passHeight=this.height;this.receiver=to;this.flight=0;this.duration=clamp(dist(this.from,this.off[to].at)/720,.34,.78);this.after=after;this.lastPass={from:this.holder,to};this.log('pass',this.off[this.holder],{to:this.off[to].id});this.phaseTo('pass',`${this.off[this.holder].name} moves it.`);
 }
 targets(dt){
  this.off.forEach((a,i)=>a.target={...spots[i]});
  const next=this.phase==='pass'?this.after:this.phase;
  if(next==='cut'){this.off[0].target=V(873,365);this.off[2].target={...spots[0]};}
  if(['drive','kick','finish'].includes(next)){
   // The cutter clears above the rim. The big slides to the opposite dunker spot.
   const cutter=this.off[0];cutter.target=cutter.at.x>790&&cutter.at.y>185?V(935,125):V(850,75);
   this.off[1].target=V(635,115);this.off[2].target=V(800,435);this.off[3].target=V(850,625);this.off[4].target=V(865,215);
  }
  if(this.attack&&['drive','euro','finish'].includes(next)){
   const attack=this.attack,driver=this.off[this.holder];
   this.off.forEach((a,i)=>{if(i!==this.holder)a.target=i===4?V(850,attack.lane>0?205:475):i===0?V(580,110):{...spots[i]};});
   driver.target=next==='finish'?V(884,340+attack.lane*12):next==='euro'?V(865,340+(this.stageTime<.3?attack.lane*62:-attack.lane*28)):V(865,340+attack.lane*96);
  }
  if(['gather','shot','rim'].includes(this.phase)&&this.shot){this.off.forEach((a,i)=>a.target={...(this.shotTargets?.[i]||a.at)});this.off[this.shot.index].target={...this.shot.from};this.off.filter((a,i)=>i!==this.shot.index).forEach((a)=>{if(a.slot===4)a.target=V(850,270);});}
  // Keep teammates in separate windows, without moving a planted shooter or a cutter's lane.
  if(!['rebound','board','rim'].includes(this.phase))this.off.forEach((a,i)=>{
   if(this.shot&&['gather','shot'].includes(this.phase)&&i===this.shot.index)return;
   this.off.forEach(b=>{const gap=dist(a.target,b.target);if(a!==b&&gap<95&&gap>.1){const u=unit(b.target,a.target);a.target=V(a.target.x+u.x*(95-gap)*.45,a.target.y+u.y*(95-gap)*.45);}});
  });
  this.def.forEach((a,i)=>{
   const other=this.off[i],u=unit(other.at,hoop),onBall=i===this.holder&&this.phase!=='pass',receiving=i===this.receiver;
   let desired=V(other.at.x+u.x*(onBall?this.cushion:57),other.at.y+u.y*(onBall?this.cushion:57));a.defenseMode=onBall?'contain':'recover';
   if(!onBall&&!receiving){desired=mix(desired,hoop,this.coverage==='help'?.12:.02);a.defenseMode='gap';}
   if(this.attack&&['drive','euro','finish'].includes(next)){
    const driver=this.off[this.holder],gap=dist(a.at,driver.at);
    if(onBall){
     // A beaten defender chases from the hip rather than teleporting in front.
     const beaten=a.at.x<driver.at.x+12;
     desired=beaten?mix(driver.at,hoop,.06):V(driver.at.x+this.cushion,driver.at.y);
     a.defenseMode=beaten?'recover':'contain';
    }else if(this.coverage==='help'&&i===4&&driver.at.x>710&&this.stageTime>this.helpDelay){desired=next==='euro'?V(866,340+this.attack.lane*100):mix(driver.at,hoop,.55);a.defenseMode='help';}
    else if(this.coverage==='help'&&i===3&&driver.at.x>720&&gap<230){desired=mix(driver.at,hoop,.3);a.defenseMode='help';}
   }
   if(['gather','shot'].includes(this.phase)&&this.shot&&i===this.shot.index){desired=mix(other.at,hoop,.055);a.defenseMode='contest';}
   if(['gather','shot'].includes(this.phase)&&this.shot?.kind!=='jumper'&&dist(a.at,this.shot.from)<145){desired=mix(this.shot.from,hoop,.25);a.defenseMode='contest';}
   a.target=mix(a.target,desired,Math.min(1,dt*(3+a.r.def/22)));
  });
  if(this.phase==='rebound'&&this.reboundSpot){
   // Closest defenders find a body before chasing the ball; perimeter safety stays out.
   this.actors.forEach((a,i)=>{
    const spot=this.reboundSpot,angle=(i%TEAM_SIZE)*1.15+(a.team===this.side?.35:2.2),ring=38;
    a.target=V(spot.x+Math.cos(angle)*ring,spot.y+Math.sin(angle)*ring);
    if(a.team!==this.side&&this.stageTime<.35){const mark=this.off[a.slot];a.target=mix(mark.at,spot,.35);a.defenseMode='box out';}
    else if(a.slot===1&&dist(a.at,spot)>300)a.target=V(570,150);
    else a.defenseMode='rebound';
   });
  }
  if(this.phase==='board'&&this.reboundWinner){this.actors.forEach(a=>a.target={...a.at});}
 }
 move(dt){
  const velocities=this.actors.map(a=>{
   const d=dist(a.at,a.target),u=unit(a.at,a.target),defending=a.team!==this.side;
   const sliding=defending&&d<125&&!['rebound','board'].includes(this.phase);
   const attacking=this.attack&&a===this.off[this.holder]&&['drive','finish','euro'].includes(this.phase);
   const speed=(88+a.r.speed*.62)*(sliding?.82:1)*(attacking?1.35:1),acceleration=defending?470:610;
   let desired=V(u.x*Math.min(speed,Math.sqrt(2*acceleration*d),d*3.8),u.y*Math.min(speed,Math.sqrt(2*acceleration*d),d*3.8));
   this.actors.forEach(b=>{const sep=dist(a.at,b.at),radius=a.team===b.team?43:34;if(a!==b&&sep<radius&&sep>.01){const force=(radius-sep)*4;desired.x+=(a.at.x-b.at.x)/sep*force;desired.y+=(a.at.y-b.at.y)/sep*force;}});
   const change=V(desired.x-a.velocity.x,desired.y-a.velocity.y),size=Math.hypot(change.x,change.y)||1,k=Math.min(1,acceleration*dt/size);
   return V(a.velocity.x+change.x*k,a.velocity.y+change.y*k);
  });
  this.actors.forEach((a,i)=>{
   a.velocity=velocities[i];a.at=V(clamp(a.at.x+a.velocity.x*dt,12,975),clamp(a.at.y+a.velocity.y*dt,20,650));
   const movement=Math.hypot(a.velocity.x,a.velocity.y);if(movement>5)a.gait+=dt*(7+movement*.04);
   const focus=a.team!==this.side?this.ball:(Math.abs(a.velocity.x)>20?V(a.at.x+a.velocity.x,a.at.y):hoop);const face=focus.x>=a.at.x?1:-1;a.face+=(face-a.face)*Math.min(1,dt*8);
  });
 }

 step(dt){
  if(this.done){this.doneTime+=dt;return;}dt=clamp(dt,0,1/30);this.elapsed+=dt;this.stageTime+=dt;this.targets(dt);this.move(dt);this.trail.push({...this.ball,height:this.height});if(this.trail.length>5)this.trail.shift();
  if(this.phase==='pass'){
   this.flight+=dt/this.duration;this.ball=mix(this.from,this.off[this.receiver].at,Math.min(1,this.flight));this.height=this.passHeight+(35-this.passHeight)*Math.min(1,this.flight)+Math.sin(Math.min(1,this.flight)*Math.PI)*9;
   if(this.flight>=1){const passer=this.off[this.holder];if(this.nearest(this.ball)<20&&this.random()<clamp((95-passer.r.pass)/170,.01,.25)){const thief=this.def.reduce((a,b)=>dist(a.at,this.ball)<dist(b.at,this.ball)?a:b);this.log('steal',thief);this.end(`${thief.name} closes the window. Turnover.`);return;}this.holder=this.receiver;this.receiver=-1;this.off[this.holder].catchUntil=this.elapsed+.28;this.log('catch',this.off[this.holder]);this.phaseTo(this.after,{cut:'Pass. Cut hard. Fill behind.',drive:'The cut is covered. Reverse it. Attack the gap.',kick:'The help commits. Corner is open.',finish:'Hit the cutter. Finish the advantage.'}[this.after]);if(this.after==='drive'||this.after==='finish')this.beginAttack(this.after==='finish');}
  }else if(this.phase==='gather'){
   const a=this.off[this.holder],t=clamp(this.stageTime/.38,0,1);this.ball=V(a.at.x+12*(1-t),a.at.y);this.height=29+(this.shot.kind==='dunk'?24:45)*t;
   if(t>=1)this.releaseShot();
  }else if(this.phase==='shot'){
   this.flight+=dt/(this.shot.kind==='dunk'?.4:this.shot.kind==='layup'?.62:1.12);const t=Math.min(this.flight,1);this.ball=mix(this.shot.from,hoop,t);this.height=(this.shot.kind==='dunk'?53:74)+(RIM_HEIGHT-(this.shot.kind==='dunk'?53:74))*t+Math.sin(t*Math.PI)*(this.shot.kind==='dunk'?8:this.shot.kind==='layup'?28:this.shot.value===3?135:105);
   if(t>=1){
    this.contactRim();
    if(this.shot.made)this.phaseTo('rim','Soft touch. Through the net.');
    else{this.log('miss',this.off[this.shot.index]);this.reboundSpot=V(hoop.x-70-this.random()*85,hoop.y-110+this.random()*220);this.phaseTo('rebound','Off the rim. Find a body. Own the glass.');}
   }
  }else if(this.phase==='rim'){
   this.ball={...hoop};this.height=RIM_HEIGHT-clamp((this.stageTime-(this.shot.kind==='dunk'?.12:0))/.3,0,1)*36;
   if(!this.rimScored&&this.stageTime>(this.shot.kind==='dunk'?.24:.14)){this.rimScored=true;this.score[this.side]+=this.shot.value;this.log('made',this.off[this.shot.index],{points:this.shot.value,assistId:this.lastPass?.to===this.shot.index?this.off[this.lastPass.from].id:null});}
   if(this.stageTime>(this.shot.kind==='dunk'?.85:.5))this.end(`${this.off[this.shot.index].name}. ${this.shot.kind==='dunk'?'THROWS IT DOWN!':this.shot.kind==='layup'?(this.euroUsed?'Euro. Bucket.':'Off the glass. Bucket.'):this.shot.value===3?'THREE.':'Bucket.'}`);
  }else if(this.phase==='rebound'){
   const t=clamp(this.stageTime/.8,0,1);this.ball=mix(hoop,this.reboundSpot,t);this.height=RIM_HEIGHT*(1-t)+Math.sin(t*Math.PI)*48+6*t;
   if(this.stageTime>.8){
    const candidates=this.actors.filter(a=>dist(a.at,this.reboundSpot)<55).sort((a,b)=>(b.r.speed*.24-dist(b.at,this.reboundSpot))-(a.r.speed*.24-dist(a.at,this.reboundSpot)));
    if(candidates.length){this.reboundWinner=candidates[0];this.boardFrom={...this.ball};this.log('rebound',this.reboundWinner,{offensive:this.reboundWinner.team===this.side});this.phaseTo('board',`${this.reboundWinner.name} goes up. Two hands.`);}
    else if(this.stageTime>4)this.end('Loose ball. Reset the possession.');
   }
  }else if(this.phase==='board'){
   const t=clamp(this.stageTime/.32,0,1);this.ball=mix(this.boardFrom,this.reboundWinner.at,t);this.height=6+86*Math.sin(clamp(this.stageTime/.65,0,1)*Math.PI);
   if(this.stageTime>.65){this.height=34;this.end(`${this.reboundWinner.name} secures the ${this.reboundWinner.team===this.side?'offensive':'defensive'} board.`);}
  }else{
   const carrier=this.off[this.holder],hand=carrier.face<-.25?-1:1,build=/^(C|PF|B)$/.test(carrier.position)?1.14:1;this.ball=V(carrier.at.x+18*hand*build/1.18,carrier.at.y+3);const catchPose=carrier.catchUntil>this.elapsed;this.height=this.euroUsed&&['euro','finish'].includes(this.phase)?40:catchPose?33:7+Math.pow(Math.abs(Math.cos(this.elapsed*2.1*Math.PI)),1.25)*28*build;
   if(this.phase==='advance'&&dist(this.off[0].at,spots[0])<35&&this.stageTime>1.5)this.pass(1,'cut');
   else if(this.phase==='cut'){
    if(this.stageTime>1.35&&this.readRoll<.22&&this.off[this.holder].r.shoot>=80&&this.nearest(this.off[this.holder].at)>55){this.shoot();}
    else if(this.stageTime>1&&dist(this.off[0].at,hoop)<150&&this.nearest(this.off[0].at)>65)this.pass(0,'finish');
    else if(this.stageTime>2.5)this.pass(2,'drive');
   }else if(this.phase==='drive'){
    const driver=this.off[this.holder],range=dist(driver.at,hoop),help=this.def.filter(a=>a.slot!==this.holder&&a.at.x>driver.at.x-10&&dist(a.at,driver.at)<155);
    if(range<210&&help.length&&this.stageTime>1.1&&driver.r.iq>75&&this.nearest(this.off[3].at)>95&&this.readRoll<.55){this.log('help_read',driver);this.pass(3,'kick');}
    else if(range<140&&help.length&&driver.r.handle>=82&&this.moveRoll<clamp((driver.r.handle-60)/45,0,.85)&&!this.euroUsed&&this.stageTime>.65&&this.nearest(driver.at)>30){
     this.euroUsed=true;this.log('euro',driver);this.phaseTo('euro',driver.name+' shifts one way. Steps around the help.');
    }else if(range<240&&help.length&&this.stageTime>1.1&&driver.r.iq>65&&this.nearest(this.off[3].at)>130&&this.nearest(driver.at)<60){
     this.log('help_read',driver);this.pass(3,'kick');
    }else if(range<125||this.stageTime>3.5)this.phaseTo('finish',driver.name+' turns the corner. Takes it to the rim.');
   }else if(this.phase==='euro'&&this.stageTime>.65)this.phaseTo('finish',this.off[this.holder].name+' protects the ball. Finish it.');
   else if(this.phase==='finish'&&dist(carrier.at,hoop)<58&&this.stageTime>.25)this.shoot();
   else if(this.phase==='finish'&&this.stageTime>2.3)this.shoot();
   else if(this.phase==='kick'&&this.stageTime>.3){
    if(this.nearest(carrier.at)<80&&carrier.r.handle>75&&dist(carrier.at,hoop)>160)this.beginAttack();else this.shoot();
   }
   if(this.elapsed>23&&!['pass','gather','shot','rim','rebound','board'].includes(this.phase))this.shoot();
  }
 }
 laneSpace(lane){
  const a=this.off[this.holder],end=V(860,340+lane*90),mid=mix(a.at,end,.55);
  return Math.min(...this.def.map(d=>Math.min(dist(d.at,mid),dist(d.at,end))));
 }
 beginAttack(cut=false){
  const a=this.off[this.holder],up=this.laneSpace(-1),down=this.laneSpace(1);
  if(!cut&&a.r.shoot>80&&this.nearest(a.at)>60&&this.random()<clamp((a.r.shoot-a.r.handle+25)/100,.08,.45)){this.shoot();return;}
  this.attack={lane:up>down?-1:1,from:{...a.at}};this.lastPass=cut?this.lastPass:null;
  this.log(cut?'slash':'drive',a,{lane:this.attack.lane});
  this.phaseTo(cut?'finish':'drive',a.name+(cut?' slashes behind the defense.':' attacks the open shoulder.'));
 }
 shotProfile(kindOverride=null){
  const a=this.off[this.holder],range=dist(a.at,hoop),contest=clamp(1-Math.min(...this.def.map(d=>dist(d.at,a.at)*(range<105&&d.at.x<a.at.x-15?2.4:1)))/115,0,1),value=range>285?3:2;
  const rim=range<105,kind=kindOverride||(rim?(a.r.speed>=87&&contest<.72&&range<62?'dunk':'layup'):'jumper');
  // Continuous distance falloff: equal skill/contest favors closer attempts.
  const base=range<105?.82-range/105*.13:range<285?.69-(range-105)/180*.27:.42-Math.min(range-285,300)/300*.18;
  const skill=rim?a.r.finish:a.r.shoot,chance=clamp(base+(kind==='dunk'?.07:0)+(skill-75)*.006-contest*(rim?.32:.28),.08,.96);
  return {index:this.holder,from:{...a.at},contest,value,chance,kind,made:null};
 }
 shoot(){this.shotTargets=this.off.map(a=>({...a.target}));this.shot=this.shotProfile();this.flight=0;this.log('gather',this.off[this.holder]);this.phaseTo('gather',this.off[this.holder].name+(this.shot.kind==='dunk'?' loads up. Above the rim!':this.shot.kind==='layup'?' gathers. Protects the finish.':' sets the feet. Eyes on the rim.'));}
 releaseShot(){const kind=this.shot.kind;this.shot=this.shotProfile(kind);this.shot.made=this.random()<this.shot.chance;this.log('shot',this.off[this.holder],{value:this.shot.value,chance:this.shot.chance,contest:this.shot.contest,kind:this.shot.kind,euro:this.euroUsed});this.phaseTo('shot',this.off[this.holder].name+(this.shot.kind==='dunk'?' TAKES FLIGHT!':this.shot.kind==='layup'?' extends to the glass.':this.shot.contest>.5?' rises over the contest.':' rises. Space to let it fly.'));}

 end(caption){this.done=true;this.phaseTo('done',caption);this.log('end',null,{score:[...this.score]});}
 snapshot(){return {seed:this.seed,coverage:this.coverage,score:[...this.score],events:JSON.parse(JSON.stringify(this.events)),seasonResult:false};}
}
function hash(s){let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
const project=p=>V(64+p.x*1.18,145+p.y*.68);
function text(ctx,s,x,y,size,color='#fff',align='left',weight=600){ctx.font=`${weight} ${size}px system-ui,sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,x,y);}
function stroke(ctx,points,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
function circle(ctx,x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function arcFloor(ctx,c,r,start,end){stroke(ctx,Array.from({length:81},(_,i)=>{const t=start+(end-start)*i/80;return project(V(c.x+Math.cos(t)*r,c.y+Math.sin(t)*r));}),'#f0e7ce',2.5);}
function rectFloor(ctx,x,y,w,h,fill,outline){const a=project(V(x,y)),b=project(V(x+w,y+h));ctx.fillStyle=fill;if(fill)ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);if(outline){ctx.strokeStyle=outline;ctx.lineWidth=3;ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}}
function rimFeedback(m){
 const hit=m.rimContact;if(!hit)return {drop:0,sway:0,net:0};
 const t=m.elapsed+(m.done?m.doneTime:0)-hit.time;
 if(t<0||t>1.5)return {drop:0,sway:0,net:0};
 const dunk=hit.kind==='dunk',impact=dunk?9:hit.made?1.2:3.5;
 return {drop:impact*Math.exp(-t*4.5)*(dunk?Math.cos(t*22):Math.sin(t*30)),sway:Math.sin(t*28)*Math.exp(-t*4)*(dunk?3:1.5),net:hit.made?Math.sin(clamp(t/.42,0,1)*Math.PI)*12+Math.sin(t*27)*Math.exp(-t*4)*2:Math.sin(t*30)*Math.exp(-t*6)};
}
function dunkPose(a,m){
 if(!m.shot||m.shot.kind!=='dunk'||m.off[m.shot.index]!==a||!['shot','rim','rebound'].includes(m.phase))return null;
 const flight=m.phase==='shot',t=flight?clamp(m.flight,0,1):1,age=flight?0:m.stageTime;
 if(!flight&&age>.65)return null;
 const from=project(m.shot.from),h=project(hoop),land=clamp((age-.18)/.47,0,1),tall=/^(C|PF|B)$/.test(a.position)?1.14:1;
 const apex=RIM_HEIGHT+12-76*tall;
 const airborne=V(from.x+(h.x-10-from.x)*t,h.y+12+(from.y-h.y-12)*(1-t));
 return {p:flight?airborne:mix(airborne,project(a.at),land),jump:flight?Math.sin(t*Math.PI/2)*apex:apex*(1-land),grip:!flight&&age<=.18&&m.shot.made};
}
function character(ctx,a,m){
 const dunk=dunkPose(a,m),p=dunk?.p||project(a.at),own=a.team===0,ink='#172334',kit=own?'#107c72':'#f4e9d7',trim=own?'#f3c66e':'#b93646',tall=/^(C|PF|B)$/.test(a.position)?1.14:1,run=clamp(Math.hypot(a.velocity.x,a.velocity.y)/95,0,1),defending=a.team!==m.side;
 const sliding=defending&&['contain','gap','contest','recover'].includes(a.defenseMode)&&Math.hypot(a.velocity.x,a.velocity.y)<135;
 const stride=Math.sin(a.gait)*(sliding?5:7)*run,shooter=m.shot&&m.off[m.shot.index]===a;
 const gathering=shooter&&m.phase==='gather',shooting=shooter&&m.phase==='shot'&&m.stageTime<.7,boarding=a===m.reboundWinner&&m.phase==='board';
 const contesting=defending&&m.phase==='shot'&&dist(a.at,m.shot.from)<115;
 const finishing=shooter&&m.shot.kind!=='jumper',euro=a===m.off[m.holder]&&m.phase==='euro';
 const gatherT=clamp(m.stageTime/.38,0,1),jump=dunk?dunk.jump:shooting?Math.sin(clamp(m.stageTime/.55,0,1)*Math.PI)*(finishing?(m.shot.kind==='dunk'?48:31):20):boarding?Math.sin(clamp(m.stageTime/.65,0,1)*Math.PI)*20:contesting?Math.sin(clamp((m.stageTime-.08)/.55,0,1)*Math.PI)*12:0;
 const crouch=gathering?Math.sin(gatherT*Math.PI)*5:sliding?4:0,bob=sliding?Math.sin(a.gait*2)*.6:Math.sin(a.gait*2)*1.1*run;
 const carrying=!m.done&&m.off[m.holder]===a&&!['pass','gather','shot','rim','rebound','board'].includes(m.phase);
 ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(0,0,18+jump*.1,6,0,0,Math.PI*2);ctx.fill();
 if(carrying||gathering){ctx.strokeStyle='#ffe3a1';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,1,23,8,0,0,Math.PI*2);ctx.stroke();}
 ctx.translate(0,-jump+bob);ctx.scale(tall,tall);
 const spread=sliding?9:5,lean=clamp(a.velocity.x/100,-1,1)*(sliding?1:3),left=V(-spread+stride,-2),right=V(spread-stride,-2);if(euro){left.x-=Math.sin(m.stageTime*9)*12;right.x+=Math.sin(m.stageTime*9)*12;}if(shooting&&finishing){left.y-=14;right.y-=6;}
 stroke(ctx,[V(-5,-18+crouch),V(-spread-1,-10+crouch*.5),left],ink,6);stroke(ctx,[V(5,-18+crouch),V(spread+1,-10+crouch*.5),right],ink,6);
 ctx.fillStyle='#f4f1e8';ctx.fillRect(left.x-6,left.y-3,12,5);ctx.fillRect(right.x-4,right.y-3,12,5);
 ctx.translate(lean,crouch);ctx.fillStyle=kit;ctx.fillRect(-11,-25,22,12);ctx.fillStyle=ink;ctx.fillRect(-1,-22,2,9);
 const hand=a.face<-.25?-1:1,catching=a.catchUntil>m.elapsed;
 let leftHand=V(-18,-27-stride*.5),rightHand=V(18,-27+stride*.5);
 if(defending){leftHand=V(-23,-34-stride*.3);rightHand=V(23,-34+stride*.3);}
 if(carrying){const dribbleY=-m.height/tall;if(hand>0)rightHand=V(18,dribbleY);else leftHand=V(-18,dribbleY);}
 if(euro||(m.euroUsed&&a===m.off[m.holder]&&m.phase==='finish')){leftHand=V(8,-40);rightHand=V(18,-40);}
 if(catching||gathering){leftHand=V(0,-35-(gathering?gatherT*18:0));rightHand=V(12,-35-(gathering?gatherT*18:0));}
 if(shooting){leftHand=finishing?V(-18,-42):V(-5,-69);rightHand=finishing?V(22,-79):V(8,-73);}
 if(shooting&&finishing){const ball=project(m.ball);rightHand=V((ball.x-p.x-lean)/tall,(ball.y-m.height-p.y+jump-bob)/tall);if(m.stageTime>.3&&m.shot.kind==='layup')rightHand=V(22,-72);}
 if(dunk?.grip){const h=project(hoop),f=rimFeedback(m);rightHand=V((h.x-p.x-lean)/tall,(h.y-RIM_HEIGHT+f.drop-p.y+jump-bob)/tall);leftHand=V(rightHand.x-9,rightHand.y+1);}
 if(boarding||contesting){leftHand=V(-15,-68);rightHand=V(15,-68);}
 // Bent elbows distinguish a defensive slide, dribble, catch and shooting follow-through.
 stroke(ctx,[V(-12,-40),V(-18,(leftHand.y-40)/2),leftHand],a.skin,6);stroke(ctx,[V(12,-40),V(18,(rightHand.y-40)/2),rightHand],a.skin,6);
 ctx.fillStyle=ink;ctx.fillRect(-12,-44,24,23);ctx.fillStyle=kit;ctx.fillRect(-10,-43,20,19);ctx.fillStyle=trim;ctx.fillRect(-10,-27,20,4);text(ctx,String(a.number),0,-29,12,own?'#ffe1a1':ink,'center',900);
 ctx.fillStyle=a.skin;ctx.fillRect(-4,-49,8,6);ctx.fillStyle=ink;ctx.fillRect(-11,-66,22,19);ctx.fillStyle=a.skin;ctx.fillRect(-10,-63,20,16);ctx.fillStyle='#251d1b';ctx.fillRect(-11,-68,22,a.hair===2?10:6);if(a.hair===1){ctx.fillRect(-13,-63,5,18);ctx.fillRect(8,-63,5,18);}
 ctx.fillStyle=ink;const gaze=Math.round(a.face*2);ctx.fillRect(-6+gaze,-56,3,2);ctx.fillRect(4+gaze,-56,3,2);
 if(shooting)stroke(ctx,[rightHand,V(rightHand.x+4,rightHand.y+5)],a.skin,3);
 ctx.restore();
}
function playerLabels(ctx,m){
 const taken=[],bodies=m.actors.map(a=>{const p=project(a.at);return {id:a.id,x:p.x-19,y:p.y-80,w:38,h:85};});const order=[...m.actors].sort((a,b)=>a.at.y-b.at.y);
 for(const a of order){const p=project(a.at),name=a.number+' '+a.name.split(' ').at(-1);ctx.font='600 12px system-ui';const w=ctx.measureText(name).width+12;let box;
  for(let level=0;level<8;level++){box={x:clamp(p.x-w/2+(level%2?10:-10),68,1210-w),y:p.y+8+Math.floor(level/2)*21,w,h:18};if(!taken.concat(bodies.filter(b=>b.id!==a.id)).some(b=>box.x<b.x+b.w+3&&box.x+box.w+3>b.x&&box.y<b.y+b.h+2&&box.y+box.h+2>b.y))break;}
  taken.push(box);if(box.y>p.y+20)stroke(ctx,[V(p.x,p.y+5),V(box.x+box.w/2,box.y)],'#abc4d455',1);
  ctx.fillStyle=a.team===0?'#0b2e2ddd':'#292235dd';ctx.fillRect(box.x,box.y,box.w,box.h);text(ctx,name,box.x+box.w/2,box.y+13,12,'#f4f5f7','center');
 }
}

function render(ctx,m,opts={}){
 ctx.clearRect(0,0,1280,720);ctx.fillStyle='#0c1420';ctx.fillRect(0,0,1280,720);
 const halo=ctx.createRadialGradient(660,350,20,660,350,700);halo.addColorStop(0,'#2d4257');halo.addColorStop(1,'#0a101a');ctx.fillStyle=halo;ctx.fillRect(0,0,1280,720);
 // Crowd silhouettes and brass court edge, away from playable space.
 for(let i=0;i<48;i++){const x=65+i*24;circle(ctx,x,107+(i%2)*9,6,i%3?'#455164':'#6c665d');ctx.fillStyle='#273548';ctx.fillRect(x-7,115+(i%2)*9,14,12);}
 ctx.fillStyle='#72573e';ctx.fillRect(55,139,1170,464);
 for(let r=0;r<34;r++)for(let c=0;c<12;c++){ctx.fillStyle=['#bb8f60','#bf9362','#c69a68','#c89c6b'][(r*7+c*3)%4];const x=64+c*106-(r%2)*53;const left=Math.max(x,64),width=Math.min(x+105,1214)-left;if(width>0)ctx.fillRect(left,145+r*13,width,12.7);}
 rectFloor(ctx,0,0,975,650,null,'#f0e7ce');rectFloor(ctx,750,220,225,240,'#165e55','#f0e7ce');stroke(ctx,[project(V(130,0)),project(V(130,650))],'#f0e7ce',3);arcFloor(ctx,V(130,325),90,0,Math.PI*2);arcFloor(ctx,V(750,340),90,0,Math.PI*2);arcFloor(ctx,hoop,285,Math.PI*.5,Math.PI*1.5);
 ctx.save();ctx.globalAlpha=.16;text(ctx,'MAMBAS',615,363,49,'#422f20','center',950);text(ctx,'UNITED',615,394,25,'#422f20','center',900);ctx.restore();
 text(ctx,'THE ROAD TO THE PEACH JAM',640,630,11,'#899baf','center',800);
 if(opts.debug){m.off.forEach((a,i)=>{stroke(ctx,[project(a.at),project(m.def[i].at)],'#82d9ed88',1);circle(ctx,project(a.target).x,project(a.target).y,4,'#e4be73');});}
 [...m.actors].sort((a,b)=>a.at.y-b.at.y).forEach(a=>character(ctx,a,m));if(opts.names!==false)playerLabels(ctx,m);
 const h=project(hoop),feedback=rimFeedback(m),rimY=h.y-RIM_HEIGHT+feedback.drop;
 stroke(ctx,[V(h.x+27,h.y-RIM_HEIGHT-35),V(h.x+27,h.y-RIM_HEIGHT+16)],'#edf2f6',5);
 // Spring-loaded rim and net deform at impact, then settle independently.
 stroke(ctx,[V(h.x+26,h.y-RIM_HEIGHT),V(h.x+11,rimY)],'#e37138',3);
 ctx.strokeStyle='#e37138';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(h.x,rimY,12,5+Math.abs(feedback.drop)*.14,0,0,Math.PI*2);ctx.stroke();
 const bottom=rimY+20+feedback.net,sw=feedback.sway;
 for(let n=0;n<5;n++){const x=-10+n*5;stroke(ctx,[V(h.x+x,rimY+3),V(h.x+x*.55+sw,bottom)],'#faf5dfbb',1.2);}
 for(let j=1;j<=3;j++){const t=j/3,w=10-4.5*t,y=rimY+3+(bottom-rimY-3)*t;stroke(ctx,[V(h.x-w+sw*t,y),V(h.x+w+sw*t,y)],'#faf5df99',1);}

 if(['pass','shot'].includes(m.phase))m.trail.forEach((p,i)=>{const t=project(p);circle(ctx,t.x,t.y-p.height,3,'rgba(243,186,99,'+((i+1)/m.trail.length*.15)+')');});const b=project(m.ball);ctx.fillStyle='#0003';ctx.beginPath();ctx.ellipse(b.x,b.y,7,3,0,0,Math.PI*2);ctx.fill();circle(ctx,b.x,b.y-m.height,7,'#ef8b37');ctx.strokeStyle='#62371e';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(b.x,b.y-m.height,7,0,Math.PI*2);ctx.stroke();stroke(ctx,[V(b.x-6,b.y-m.height),V(b.x+6,b.y-m.height)],'#62371e',1);
 text(ctx,m.teams[m.side].name.toUpperCase()+' · POSSESSION',79,680,13,'#dfbe80');text(ctx,`${m.elapsed.toFixed(1)}s  /  ${m.phase.toUpperCase()}`,1200,680,13,'#b0c0d4','right');
 if(m.done){ctx.fillStyle='#0b1420ee';ctx.fillRect(275,597,730,58);text(ctx,m.shot?.made?(m.shot.kind==='dunk'?'THROW IT DOWN. +2':m.shot.kind==='layup'?(m.euroUsed?'EURO. FINISH. +2':'TO THE RIM. +2'):m.shot.value===3?'FROM DEEP. +3':'BUCKET. +2'):m.reboundWinner?'BOARD SECURED':'POSSESSION COMPLETE',640,620,18,'#f5d18a','center',900);text(ctx,m.caption,640,642,13,'#fff','center');}
}
/* Broadcast owns presentation only. The live Match remains the sole scoring ledger. */
class Broadcast {
 constructor(teams,seed=2032,limit=12){this.teams=teams;this.seed=seed;this.limit=Math.max(1,Math.floor(limit));this.reset();}
 reset(){if(this.live)this.seed=(this.seed+this.limit)>>>0;this.live=new Match(this.teams,this.seed);this.history=[];this.ticks=0;this.coverageChanges=[{tick:0,value:this.live.coverage}];this.replayMatch=null;this.replayRecord=null;this.replayTicks=0;this.complete=false;}
 get match(){return this.replayMatch||this.live;}
 get replaying(){return !!this.replayMatch;}
 coverage(value){if(this.replaying||this.live.done)return;this.live.coverage=value;this.coverageChanges.push({tick:this.ticks,value});}
 record(){
  if(!this.live.done||this.history.length>this.live.possession)return;
  this.history.push({number:this.live.possession+1,seed:this.live.seed,side:this.live.side,before:[...this.live.before],score:[...this.live.score],events:JSON.parse(JSON.stringify(this.live.events)),coverageChanges:this.coverageChanges.map(c=>({...c})),caption:this.live.caption});
  this.complete=this.history.length>=this.limit;
 }
 step(dt){
  if(this.replaying){this.applyCoverage(this.replayMatch,this.replayRecord,this.replayTicks);this.replayMatch.step(dt);this.replayTicks++;if(this.replayMatch.done&&this.replayMatch.doneTime>1.2)this.returnLive();return;}
  this.live.step(dt);this.ticks++;this.record();
 }
 next(){if(this.replaying||!this.live.done||this.complete)return false;this.live.next();this.ticks=0;this.coverageChanges=[{tick:0,value:this.live.coverage}];return true;}
 applyCoverage(m,record,tick){for(const c of record.coverageChanges)if(c.tick===tick)m.coverage=c.value;}
 replay(index=this.history.length-1,full=false){
  const record=this.history[index];if(!record)return false;
  const m=new Match(this.teams,record.seed);m.score=[...record.before];m.start(record.seed,record.side);m.possession=record.number-1;
  const key=record.events.find(e=>e.type==='shot'||e.type==='steal'),start=full?0:Math.max(0,(key?.time||0)-2.6);let tick=0;
  while(m.elapsed<start&&!m.done){this.applyCoverage(m,record,tick);m.step(1/60);tick++;}
  this.replayMatch=m;this.replayRecord=record;this.replayTicks=tick;return true;
 }
 returnLive(){this.replayMatch=null;this.replayRecord=null;}
 totals(){return this.teams.map((t,team)=>{
  const stat={points:this.live.score[team],fgm:0,fga:0,threes:0,assists:0,rebounds:0,steals:0};
  const ids=new Set(t.players.map(p=>p.id));for(const r of this.history)for(const e of r.events){if(!ids.has(e.playerId))continue;if(e.type==='shot')stat.fga++;if(e.type==='made'){stat.fgm++;if(e.points===3)stat.threes++;if(e.assistId)stat.assists++;}if(e.type==='rebound')stat.rebounds++;if(e.type==='steal')stat.steals++;}return stat;
 });}
}
Broadcast.prototype.result=function(){
 if(!this.complete)return null;
 const players=this.teams.flatMap((team,teamIndex)=>team.players.map(p=>({playerId:p.id,team:teamIndex,name:p.name||p.n,points:0,fgm:0,fga:0,threeMade:0,threeAttempts:0,assists:0,rebounds:0,steals:0})));
 const byId=new Map(players.map(p=>[p.playerId,p]));
 for(const record of this.history)for(const event of record.events){const row=byId.get(event.playerId);if(!row)continue;if(event.type==='shot'){row.fga++;if(event.value===3)row.threeAttempts++;}if(event.type==='made'){row.fgm++;row.points+=event.points;if(event.points===3)row.threeMade++;if(event.assistId&&byId.has(event.assistId))byId.get(event.assistId).assists++;}if(event.type==='rebound')row.rebounds++;if(event.type==='steal')row.steals++;}
 return {version:1,seed:this.seed,possessions:this.history.length,finalScore:[...this.live.score],winner:this.live.score[0]===this.live.score[1]?null:(this.live.score[0]>this.live.score[1]?0:1),teams:this.teams.map((team,teamIndex)=>({name:team.name,players:players.filter(p=>p.team===teamIndex)})),events:this.history.flatMap(record=>record.events)};
};
function validateResult(result,teams){
 if(!result||result.version!==1||result.possessions!==12||!Array.isArray(result.finalScore)||result.finalScore.length!==2)return {ok:false,error:'Incomplete match result.'};
 const ids=teams.flatMap(team=>team.players.map(player=>player.id));if(new Set(ids).size!==TEAM_SIZE*2)return {ok:false,error:'Match teams must contain ten unique players.'};
 if(JSON.stringify(result.teams.flatMap(team=>team.players.map(player=>player.playerId)).sort())!==JSON.stringify([...ids].sort()))return {ok:false,error:'Result roster does not match submitted roster.'};
 const totals=result.teams.map(team=>team.players.reduce((sum,player)=>sum+player.points,0));if(totals.some((points,index)=>points!==result.finalScore[index]))return {ok:false,error:'Player points do not match final score.'};
 return {ok:true};
}
function describeEvent(e,teams){
 const p=teams.flatMap(t=>t.players).find(p=>p.id===e.playerId),name=p?.name||p?.n||'Player';
 const target=teams.flatMap(t=>t.players).find(p=>p.id===e.to);
 switch(e.type){case'drive':return name+' attacks the gap';case'slash':return name+' cuts hard to the rim';case'euro':return name+' · EURO STEP';case'pass':return name+' → '+(target?.name||target?.n||'teammate');case'help_read':return name+' draws help; finds the corner';case'shot':return name+(e.kind==='dunk'?' goes up for the DUNK':e.kind==='layup'?' extends for a layup':e.value===3?' launches a three':' pulls up')+(e.contest>.5?' · contested':' · room to shoot');case'made':return name+' scores +'+e.points+(e.assistId?' · assisted':'');case'miss':return name+' misses';case'rebound':return name+(e.offensive?' · offensive board':' · defensive board');case'steal':return name+' takes it away';default:return null;}
}
/* Original procedural effects; no downloads. Audio begins only on a user gesture. */
class CourtAudio {
 constructor(){this.context=null;this.enabled=false;this.active=new Set();}
 async enable(){const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return false;try{this.context=this.context||new Audio();await this.context.resume();this.enabled=this.context.state==='running';return this.enabled;}catch{this.enabled=false;return false;}}
 clear(){for(const node of this.active){try{node.stop();}catch{}}this.active.clear();}
 disable(){this.enabled=false;this.clear();}
 close(){this.disable();this.context?.close().catch(()=>{});}
 noise(duration,level,frequency,q=.7,delay=0){
  if(!this.enabled||this.context.state!=='running')return;const c=this.context,t=c.currentTime+delay,n=Math.ceil(c.sampleRate*duration),buffer=c.createBuffer(1,n,c.sampleRate),data=buffer.getChannelData(0);
  // Dedicated audio PRNG never touches the basketball simulation's seed.
  let state=3199;for(let i=0;i<n;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;data[i]=state/2147483648-1;}
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=q;
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+Math.min(.04,duration*.2));gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter);filter.connect(gain);gain.connect(c.destination);this.active.add(source);source.onended=()=>{this.active.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(t);source.stop(t+duration);
 }
 tone(duration,level,frequency){if(!this.enabled||this.context.state!=='running')return;const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(frequency*.45,t+duration);g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(c.destination);this.active.add(o);o.onended=()=>{this.active.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+duration);}
 event(e,m){if(!this.enabled)return;if(e.type==='rim_contact'&&(e.kind==='dunk'||!e.made)){this.tone(.21,e.kind==='dunk'?.13:.06,e.kind==='dunk'?155:340);this.noise(.12,.08,1700,1.5);}if(e.type==='made'){this.noise(.26,.18,3800,.5);const big=m.shot?.kind==='dunk';for(let i=0;i<5;i++)this.noise(big?1.65:1.15,big?.075:.045,430+i*260,.8,.04+i*.055);}}
}
function mount(host,teams,{seed=2032,onExit,onComplete,limit=12}={}){
 const broadcast=new Broadcast(teams,seed,limit),audio=new CourtAudio();let audioMatch=broadcast.match,audioCursor=0;
 function audioStep(){const m=broadcast.match;if(m!==audioMatch){audio.clear();audioMatch=m;audioCursor=m.events.length;return;}for(const event of m.events.slice(audioCursor))audio.event(event,m);audioCursor=m.events.length;}
 let paused=false,speed=1,names=true,debug=false,loop=true,highlights=true,stopped=false,completionNotified=false,raf=0,last=0,acc=0,historyKey='',eventKey='';
 host.innerHTML=`<section class="court-shell"><div class="court-mast"><span>AAU DYNASTY <b>/ COURTSIDE LAB</b></span><span class="court-status">● CPU vs CPU</span></div><div class="court-score"><span data-home></span><b data-score>0 : 0</b><span data-away></span></div><div class="court-broadcast"><strong data-mode>BIG PLAY PACE</strong><span data-progress></span><span data-pace></span></div><progress class="court-progress" max="${broadcast.limit}" value="0" aria-label="Completed lab possessions"></progress><canvas width="1280" height="720" aria-label="Animated five-on-five basketball possession"></canvas><div class="court-call" role="status" aria-live="polite"></div><div class="court-controls"><button data-do="pause">Pause</button><button data-do="sound" aria-pressed="false">Sound: off</button><button data-do="pace" aria-pressed="true">Big play pace: on</button><button data-do="speed">1× speed</button><button data-do="slow">Slow motion</button><button data-do="replay" disabled>Replay last play</button><button data-do="live" hidden>Return to live</button><button data-do="next" disabled>Next possession</button><button data-do="restart" hidden>New watch run</button><button data-do="coverage">Defense: help</button><button data-do="names">Names: on</button><button data-do="camera">Camera: broadcast</button><button data-do="lab">Player lab: off</button><button data-do="loop">Auto next: on</button>${onExit?'<button data-do="exit">Back to team</button>':''}</div><div class="court-recap" hidden><h3>Watch run complete</h3><p data-summary></p></div><div class="court-details"><section><h3>On the floor <span>LIVE READS</span></h3><ol class="court-reads"></ol></section><section><h3>Play log <span>SELECT TO REPLAY</span></h3><ol class="court-history"></ol><p class="court-empty">Completed possessions will appear here.</p></section></div><div class="court-stats" aria-label="Completed possession stats"></div><p class="court-foot">${broadcast.limit}-possession lab · faster setup, normal-speed key action · alternating half-court possessions · placeholder characters · no season rewards</p></section>`;
 const q=s=>host.querySelector(s),button=name=>q('[data-do="'+name+'"]');
 q('[data-home]').textContent=teams[0].name;q('[data-away]').textContent=teams[1].name;
 const canvas=q('canvas'),ctx=canvas.getContext('2d'),caption=q('.court-call'),score=q('[data-score]');if(!ctx)throw Error('Canvas 2D is unavailable in this browser.');
 function stop(){stopped=true;cancelAnimationFrame(raf);audio.close();observer?.disconnect();}
 function resume(){paused=false;button('pause').textContent='Pause';acc=0;}
 q('.court-controls').addEventListener('click',async e=>{const b=e.target.closest('[data-do]');if(!b||b.disabled)return;switch(b.dataset.do){
  case'sound':{const turningOn=!audio.enabled,ok=turningOn?await audio.enable():(audio.disable(),true);b.textContent=audio.enabled?'Sound: on':ok?'Sound: off':'Sound unavailable · retry';b.setAttribute('aria-pressed',String(audio.enabled));break;}
  case'pause':audio.clear();paused=!paused;b.textContent=paused?'Resume':'Pause';break;
  case'pace':highlights=!highlights;b.textContent='Big play pace: '+(highlights?'on':'off');b.setAttribute('aria-pressed',String(highlights));break;
  case'speed':speed=speed===1?2:1;b.textContent=speed+'× speed';button('slow').textContent='Slow motion';break;
  case'slow':speed=speed===.5?1:.5;b.textContent=speed===.5?'Normal speed':'Slow motion';button('speed').textContent=speed+'× speed';break;
  case'replay':audio.clear();if(broadcast.replay())resume();break;case'live':audio.clear();broadcast.returnLive();acc=0;break;
  case'next':broadcast.next();acc=0;break;case'restart':audio.clear();broadcast.reset();historyKey='';eventKey='';resume();break;
  case'coverage':broadcast.coverage(broadcast.live.coverage==='help'?'stay home':'help');break;
 case'names':names=!names;b.textContent='Names: '+(names?'on':'off');break;case'camera':view.view=(view.view+1)%5;view.setCamera();b.textContent='Camera: '+['broadcast','shoulder','tactical','baseline','player spotlight'][view.view];break;case'lab':view.playerLab=!view.playerLab;view.spotlightActor=null;view.view=view.playerLab?4:0;view.setCamera();b.textContent='Player lab: '+(view.playerLab?'on':'off');break;
  case'loop':loop=!loop;b.textContent='Auto next: '+(loop?'on':'off');break;case'exit':stop();onExit?.();break;
 }});
 q('.court-history').addEventListener('click',e=>{const b=e.target.closest('[data-replay]');if(b&&broadcast.replay(Number(b.dataset.replay)))resume();});
 const observer=typeof MutationObserver==='function'?new MutationObserver(()=>{if(!canvas.isConnected)stop();}):null;observer?.observe(document.body,{childList:true,subtree:true});
 function update(){
  const m=broadcast.match,replay=broadcast.replaying;
  if(caption.textContent!==m.caption)caption.textContent=m.caption;score.textContent=broadcast.live.score.join(' : ');
  q('[data-mode]').textContent=replay?'REPLAY · 0.5×':broadcast.complete?'RUN COMPLETE':highlights?'BIG PLAY PACE':'FULL POSSESSION';
  q('[data-progress]').textContent='Possession '+(replay?broadcast.replayRecord.number:Math.min(broadcast.live.possession+1,broadcast.limit))+' / '+broadcast.limit;
  q('[data-pace]').textContent=paused?'Paused':replay?'Score held at live result':broadcast.complete?'12 possessions complete':highlights&&speed===1&&['advance','cut'].includes(m.phase)?'Setup · 3×':'Action · '+speed+'×';
  q('progress').value=broadcast.history.length;button('live').hidden=!replay;button('replay').disabled=!broadcast.history.length;button('next').disabled=replay||!broadcast.live.done||broadcast.complete;
  button('coverage').disabled=replay||broadcast.live.done;button('coverage').textContent='Defense: '+broadcast.live.coverage;button('restart').hidden=!broadcast.complete;
  const key=(replay?'r':'l')+m.seed+':'+m.events.length;
  if(key!==eventKey){eventKey=key;const list=q('.court-reads');list.replaceChildren();for(const e of m.events.filter(e=>describeEvent(e,teams)).slice(-4).reverse()){const li=document.createElement('li'),time=document.createElement('time'),label=document.createElement('span');time.textContent=e.time.toFixed(1)+'s';label.textContent=describeEvent(e,teams);li.append(time,label);list.append(li);}if(!list.children.length){const li=document.createElement('li');li.textContent='Bring it up. Get organized.';list.append(li);}}
  const hk=broadcast.history.length+':'+broadcast.live.seed;
  if(hk!==historyKey){historyKey=hk;const list=q('.court-history');list.replaceChildren();q('.court-empty').hidden=!!broadcast.history.length;
   broadcast.history.slice().reverse().forEach(r=>{const li=document.createElement('li'),b=document.createElement('button'),n=document.createElement('small'),label=document.createElement('span');b.dataset.replay=String(r.number-1);n.textContent='#'+String(r.number).padStart(2,'0')+' · '+teams[r.side].name;label.textContent=r.caption;b.append(n,label);b.setAttribute('aria-label','Replay possession '+r.number+': '+r.caption);li.append(b);list.append(li);});
   const stats=q('.court-stats'),totals=broadcast.totals();stats.replaceChildren();teams.forEach((t,i)=>{const s=totals[i],box=document.createElement('section'),name=document.createElement('h3'),line=document.createElement('p');name.textContent=t.name;line.textContent=s.fgm+'/'+s.fga+' FG  ·  '+s.threes+' 3PM  ·  '+s.assists+' AST  ·  '+s.rebounds+' REB';box.append(name,line);stats.append(box);});
  }
  q('.court-recap').hidden=!broadcast.complete||replay;if(broadcast.complete){const [a,b]=broadcast.live.score;q('[data-summary]').textContent=(a===b?'Even at '+a+' apiece.':teams[a>b?0:1].name+' finishes ahead, '+Math.max(a,b)+'–'+Math.min(a,b)+'.')+' Review a possession from the play log, or start a fresh watch run.';if(!completionNotified){completionNotified=true;onComplete?.(broadcast.result());}}
 }
 function tick(t){
  if(stopped||!canvas.isConnected){stop();return;}const dt=last?Math.min((t-last)/1000,.05):0;last=t;
  if(!paused&&!document.hidden){acc+=dt;while(acc>=1/60){const m=broadcast.match,factor=broadcast.replaying?.5:highlights&&speed===1&&['advance','cut'].includes(m.phase)?3:speed;simulationBudget+=factor;while(simulationBudget>=1){broadcast.step(1/60);audioStep();simulationBudget--;if(loop&&!broadcast.replaying&&broadcast.live.done&&!broadcast.complete&&broadcast.live.doneTime>2.3)broadcast.next();}acc-=1/60;}}
  render(ctx,broadcast.match,{names,debug});update();raf=requestAnimationFrame(tick);
 }
 let simulationBudget=0;raf=requestAnimationFrame(tick);return {get match(){return broadcast.match;},broadcast,stop};
}
root.AAUCourt={Match,Broadcast,validateResult,describeEvent,render,mount,rimFeedback,dunkPose,CourtAudio};if(typeof module!=='undefined')module.exports=root.AAUCourt;
})(typeof window!=='undefined'?window:globalThis);
