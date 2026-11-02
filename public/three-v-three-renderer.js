// Lightweight perspective renderer: articulated 3D geometry, projected and depth sorted.
// No remote models or runtime dependency downloads.
function t3Draw(progress){
 const canvas=document.getElementById('t3-court');if(!canvas?.getContext)return;const c=canvas.getContext('2d');if(!c)return;
 const w=canvas.clientWidth||960,h=Math.max(330,Math.min(600,w*.62)),ratio=Math.min(window.devicePixelRatio||1,2);if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.height=h+'px';}c.setTransform(ratio,0,0,ratio,0,0);
 const g=T3.game,e=T3.event,t=progress,faces=[],labels=[];
 // Camera at (13, 17, 24), looking toward the painted lane.
 function camera(p){const x=p[0],y=p[1]-1,z=p[2]-1;return [x*.88-z*.475,y*.87-(x*.475+z*.88)*.493,30-(y*.493+(x*.475+z*.88)*.87)];}
 function project(p){const a=camera(p),f=Math.min(w,h*1.7)*1.24;return [w*.5+a[0]*f/a[2],h*.49-a[1]*f/a[2],a[2]];}
 function poly(points,color){const pts=points.map(project);faces.push({pts,color,z:pts.reduce((s,p)=>s+p[2],0)/pts.length});}
 function box(x,y,z,sx,sy,sz,color){const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(p=>[x+p[0]*sx/2,y+p[1]*sy/2,z+p[2]*sz/2]);for(const f of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]])poly(f.map(i=>v[i]),color);}
 function limb(a,b,width,color){const dir=b.map((v,i)=>v-a[i]),len=Math.hypot(...dir)||1,u=[-dir[2],0,dir[0]],ul=Math.hypot(...u)||1;u[0]/=ul;u[2]/=ul;if(ul===1&&u[0]===0&&u[2]===0)u[0]=1;const v=[dir[1]*u[2]/len,(dir[2]*u[0]-dir[0]*u[2])/len,-dir[1]*u[0]/len];const ring=p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(q=>p.map((x,i)=>x+(u[i]*q[0]+v[i]*q[1])*width/2)),aa=ring(a),bb=ring(b);poly(aa,color);poly(bb,color);for(let i=0;i<4;i++)poly([aa[i],aa[(i+1)%4],bb[(i+1)%4],bb[i]],color);}
 function line(points,color,width=2){const pts=points.map(project);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 function sphere(p,r,color){for(let j=0;j<6;j++)for(let k=0;k<10;k++){const point=(a,b)=>[p[0]+r*Math.sin(a)*Math.cos(b),p[1]+r*Math.cos(a),p[2]+r*Math.sin(a)*Math.sin(b)];poly([point(j*Math.PI/6,k*Math.PI/5),point((j+1)*Math.PI/6,k*Math.PI/5),point((j+1)*Math.PI/6,(k+1)*Math.PI/5),point(j*Math.PI/6,(k+1)*Math.PI/5)],color);}}
 c.fillStyle='#080e1b';c.fillRect(0,0,w,h);const glow=c.createRadialGradient(w*.5,h*.2,10,w*.5,h*.5,w*.7);glow.addColorStop(0,'#20364b');glow.addColorStop(1,'#080e1b');c.fillStyle=glow;c.fillRect(0,0,w,h);
 // Ground first; all elevated objects sorted by camera depth.
 const court=[[-8,0,-8],[8,0,-8],[8,0,8],[-8,0,8]].map(project);c.beginPath();court.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fillStyle='#ba8655';c.fill();
 for(let z=-8;z<=8;z+=.8)line([[-8,.01,z],[8,.01,z]],'#a6754b',1);
 line([[-7.5,.02,-7.5],[7.5,.02,-7.5],[7.5,.02,7.5],[-7.5,.02,7.5],[-7.5,.02,-7.5]],'#fff0d4');line([[-2.4,.02,-7.5],[-2.4,.02,-1],[2.4,.02,-1],[2.4,.02,-7.5]],'#fff0d4');
 const arc=[];for(let i=0;i<=60;i++){const a=Math.PI*i/60;arc.push([6.6*Math.cos(a),.025,-6+6.6*Math.sin(a)]);}line(arc,'#fff0d4',2);line([[-6.6,.02,-7.5],[-6.6,.02,-6]],'#fff0d4');line([[6.6,.02,-7.5],[6.6,.02,-6]],'#fff0d4');
 box(0,2,-8,.22,4,.22,'#263545');box(0,3.8,-7.35,2.6,1.5,.12,'#dae8eb');box(0,3.65,-7.23,1,.65,.05,'#52667a');
 for(let k=0;k<18;k++){const a=k*Math.PI/9,b=(k+1)*Math.PI/9;limb([.46*Math.cos(a),3.15,-6.6+.46*Math.sin(a)],[.46*Math.cos(b),3.15,-6.6+.46*Math.sin(b)],.07,'#ff7135');limb([.46*Math.cos(a),3.12,-6.6+.46*Math.sin(a)],[.27*Math.cos(a),2.6,-6.6+.27*Math.sin(a)],.025,'#f1f1e9');}
 const starts=[[-4,2],[3.9,1.5],[.5,4.7]],positions=[];
 for(let side=0;side<2;side++)for(let i=0;i<3;i++){
  let [x,z]=starts[i];if(side===1){x*=.72;z-=1.6;}let jump=0,reach=0,run=0;
  const offense=e&&side===e.side&&i===e.actor,defense=e&&side!==e.side&&i===e.defender;
  if(e){if(offense&&e.kind!=='steal'){if(e.kind!=='three'){const drive=Math.min(1,t/.55);x=x*(1-drive);z=z*(1-drive)-5.8*drive;run=Math.sin(t*36)*.4;}else {x=i===0?-6.8:6.8;z=.4;}if(t>.4&&t<.84){jump=Math.sin((t-.4)/.44*Math.PI)*(e.kind==='dunk'?1.25:.6);reach=Math.sin((t-.4)/.44*Math.PI);} }
   if(defense){const approach=Math.min(1,t/.55);x=x*(1-approach)+.9*approach;z=z*(1-approach)-5.3*approach;if(e.kind==='block'&&t>.45&&t<.85){jump=Math.sin((t-.45)/.4*Math.PI)*1.05;reach=1;}}
  }
  const jersey=side===0?'#26ced0':'#ff6d47',skin=['#8e563b','#bf855c','#65422f'][i],base=jump;
  // Ground contact shadow.
  const shadow=project([x,.03,z]);c.beginPath();c.ellipse(shadow[0],shadow[1],14/(1+jump*.2),5,0,0,Math.PI*2);c.fillStyle='#0005';c.fill();
  box(x,base+1.18,z,.65,.82,.39,jersey);box(x,base+.68,z,.64,.35,.43,'#182839');sphere([x,base+1.91,z],.235,skin);
  for(const sign of [-1,1]){const hip=[x+sign*.19,base+.62,z],knee=[x+sign*.22,base+.32,z+run*sign],foot=[x+sign*.22,base+.09,z+run*sign*.6];limb(hip,knee,.19,skin);limb(knee,foot,.16,skin);box(foot[0],foot[1],foot[2]-.08,.23,.16,.4,'#eaf5f0');const shoulder=[x+sign*.4,base+1.49,z],elbow=[x+sign*(.48-reach*.12),base+1.16+reach*.8,z-.15],hand=[x+sign*.28,base+1.07+reach*1.05,z-.38];limb(shoulder,elbow,.16,skin);limb(elbow,hand,.14,skin);}
  positions[side*3+i]=[x,base+1.25,z-.4];labels.push({p:project([x,base+2.4,z]),text:g.teams[side][i].n.split(' ').slice(-1)[0],color:jersey});
 }
 let ball=e?positions[e.side*3+e.actor]:positions[0];if(e){const source=ball;if(t<.43){ball=[source[0]+.35,.3+Math.abs(Math.sin(t*45))*.9,source[2]];}else if(t<.76){const a=(t-.43)/.33;ball=e.kind==='dunk'?[source[0]*(1-a),source[1]+.85+(3.15-source[1]-.85)*a,source[2]*(1-a)-6.6*a]:[source[0]*(1-a),source[1]*(1-a)+3.2*a+Math.sin(a*Math.PI)*3,source[2]*(1-a)-6.6*a];}else{const a=Math.min(1,(t-.76)/.24);ball=[e.made?0:1.2*a,3.15*(1-a)+.24,-6.6+(e.made?0:2*a)];}}
 if(e?.kind==='steal')ball=positions[(1-e.side)*3+e.defender];
 sphere(ball,.23,'#ef8b30');
 faces.sort((a,b)=>b.z-a.z);for(const f of faces){c.beginPath();f.pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fillStyle=f.color;c.fill();c.strokeStyle='#00000012';c.lineWidth=.45;c.stroke();}
 c.font='600 11px system-ui';c.textAlign='center';for(const l of labels){c.fillStyle='#071321cc';c.fillRect(l.p[0]-38,l.p[1]-12,76,17);c.fillStyle=l.color;c.fillText(l.text,l.p[0],l.p[1]);}
 c.fillStyle='#ffffff66';c.textAlign='left';c.font='bold 11px system-ui';c.fillText('CIRCUIT ORIGINALS / HALF COURT',18,h-18);
}
