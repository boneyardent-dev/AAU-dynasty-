/* AAU Dynasty 2v2 input and presentation; simulation stays in two-on-two.js. */
(function(){
'use strict';
const canvas=document.getElementById('game'),score=document.getElementById('score'),caption=document.getElementById('caption'),fps=document.getElementById('fps');
let game=new AAUTwoOnTwo.TwoOnTwo(),view=new ChibiCourt(canvas),audio=new AAUCourt.CourtAudio();
const keys=new Set(),stick={x:0,y:0},history=[];let replay=null,replayAt=0,last=0,acc=0,frames=0,measure=0,eventCursor=0,paused=false;
const input=()=>({x:Math.max(-1,Math.min(1,(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)+stick.x)),y:Math.max(-1,Math.min(1,(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0)+stick.y))});
const actions={KeyJ:'crossover',KeyK:'pass',KeyL:'shoot',KeyI:'dunk',Space:'drive'};
function act(name){if(replay)return;if(game.side===1){if(name==='pass')name='switch';if(name==='shoot')name='contest';}game.action(name);}
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(!e.repeat&&actions[e.code])act(actions[e.code]);});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();stick.x=stick.y=0;});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.action)));
const joy=document.getElementById('joy'),knob=joy.querySelector('.knob');
function moveStick(e){const r=joy.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.33),y=(e.clientY-r.top-r.height/2)/(r.height*.33),d=Math.max(1,Math.hypot(x,y));stick.x=x/d;stick.y=y/d;knob.style.transform=`translate(${stick.x*30}px,${stick.y*30}px)`;}
joy.addEventListener('pointerdown',e=>{joy.setPointerCapture(e.pointerId);moveStick(e);});joy.addEventListener('pointermove',e=>{if(joy.hasPointerCapture(e.pointerId))moveStick(e);});function release(){stick.x=stick.y=0;knob.style.transform='';}joy.addEventListener('pointerup',release);joy.addEventListener('pointercancel',release);
if(matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');
document.getElementById('camera').onclick=()=>{view.view=(view.view+1)%4;view.setCamera();};
document.getElementById('sound').onclick=async e=>{if(audio.enabled)audio.disable();else await audio.enable();e.target.textContent=audio.enabled?'Sound on':'Sound off';};
document.getElementById('restart').onclick=()=>{game=new AAUTwoOnTwo.TwoOnTwo(Date.now());history.length=0;replay=null;replayAt=0;eventCursor=0;paused=false;};
document.getElementById('replay').onclick=()=>{if(history.length){replay=history.slice();replayAt=0;paused=true;}};
function tick(t){
 const dt=last?Math.min((t-last)/1000,.05):0;last=t;if(document.hidden){requestAnimationFrame(tick);return;}
 if(replay){replayAt+=dt*30;if(replayAt>=replay.length){replay=null;paused=false;}else view.render(replay[Math.floor(replayAt)],{names:true});}
 if(!replay){if(game.done)game.doneTime+=dt;if(!paused&&!game.done){acc+=dt;let steps=0;while(acc>=1/60&&steps++<4){game.step(1/60,input());acc-=1/60;}if(steps>=4)acc=0;history.push(game.snapshot());if(history.length>210)history.shift();}
  view.render(game.frame(),{names:true});for(const event of game.events.slice(eventCursor))audio.event(event,game);eventCursor=game.events.length;}
 score.textContent=game.score.join(' : ');caption.textContent=replay?'INSTANT REPLAY · '+replay[Math.floor(replayAt)]?.caption:game.caption;document.getElementById('replay').disabled=history.length<25||!!replay;
 frames++;if(t-measure>1000){fps.textContent=`${Math.round(frames*1000/(t-measure))} FPS (${view.renderer.isSoftware?'software fallback':'WebGL'})`;frames=0;measure=t;}
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
})();
