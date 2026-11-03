/* AAU Dynasty: Three.js presentation adapter. Match remains the scoring authority. */
class ChibiCourt {
 constructor(canvas){
 const T=THREE;this.canvas=canvas;this.scene=new T.Scene();this.scene.background=new T.Color('#0b1320');this.scene.fog=new T.Fog('#0b1320',34,70);
 try{this.renderer=new T.WebGLRenderer({canvas,antialias:true});}catch(error){this.renderer=new CourtSoftwareRenderer(canvas);}this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.renderer.setSize(1280,720,false);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;
 this.camera=new T.PerspectiveCamera(39,1280/720,.1,100);this.views=[[23,18,22],[18,7,14],[12,25,25],[30,6,10]];this.view=0;this.spotlightActor=null;this.playerLab=false;this.setCamera();
 this.scene.add(new T.HemisphereLight(0xd6edff,0x574333,2.5));const light=new T.DirectionalLight(0xffebd0,3.5);light.position.set(10,20,8);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.5,far:60});light.shadow.bias=-.0005;this.scene.add(light);const fill=new T.DirectionalLight(0x93caff,2);fill.position.set(-8,9,-12);this.scene.add(fill);
 this.materials={};this.people=new Map();this.brandTexture=null;this.brandTexturePlane=null;this.court();this.scene.traverse(o=>{o.userData.staticCourt=true;});this.hoop();this.ball=this.mesh(new T.SphereGeometry(.2884,20,12),this.mat('#df7629'));this.scene.add(this.ball);
 const seams=new T.Group();for(let i=0;i<3;i++){const r=this.mesh(new T.TorusGeometry(.29046,.01236,4,36),this.mat('#512d1b'));r.rotation.set(i===0?Math.PI/2:0,i===1?Math.PI/2:0,i===2?.6:0);seams.add(r);}this.ball.add(seams);this.labels=true;
 }
 mat(color){return this.materials[color]||(this.materials[color]=new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.04}));}
 mesh(g,m){const a=new THREE.Mesh(g,m);a.castShadow=true;a.receiveShadow=true;return a;}
 sphere(parent,x,y,z,sx,sy,sz,color){const a=this.mesh(new THREE.SphereGeometry(1,12,8),this.mat(color));a.position.set(x,y,z);a.scale.set(sx,sy,sz);parent.add(a);return a;}
 box(parent,x,y,z,w,h,d,color){const a=this.mesh(new THREE.BoxGeometry(w,h,d),this.mat(color));a.position.set(x,y,z);parent.add(a);return a;}
 line(points,color='#fff1d5',width=.035,parent=this.scene){const T=THREE;for(let i=1;i<points.length;i++){const a=new T.Vector3(...points[i-1]),b=new T.Vector3(...points[i]);const m=this.mesh(new T.CylinderGeometry(width,width,a.distanceTo(b),6),this.mat(color));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());m.castShadow=false;if(points.every(p=>p[1]<.1))m.renderOrder=-5;parent.add(m);}}
 arc(x,z,r,start,end){this.line(Array.from({length:81},(_,i)=>{let a=start+(end-start)*i/80;return [x+Math.cos(a)*r,.025,z+Math.sin(a)*r];}));}
 court(){
 const T=THREE;this.box(this.scene,9.75,-.18,6.5,22,.3,15.4,'#263746').renderOrder=-30;
 for(let row=0;row<38;row++)for(let col=0;col<11;col++){let x=col*1.95+(row%2)*.975;const w=Math.min(1.93,19.5-x);if(w>0)this.box(this.scene,x+w/2,-.025,row*.342+.17,w,.05,.332,['#b27e4d','#c5915e','#d3a16d','#bc8a59'][(row*3+col*7)%4]).renderOrder=-20;}
 // Keep the fallback paint consistent with Mambas branding if the concept art is unavailable.
 this.box(this.scene,17.25,.006,6.8,4.5,.018,4.8,'#741d2b').renderOrder=-10;this.line([[0,.03,0],[19.5,.03,0],[19.5,.03,13],[0,.03,13],[0,.03,0]]);this.line([[15,.03,4.4],[19.5,.03,4.4],[19.5,.03,9.2],[15,.03,9.2],[15,.03,4.4]]);this.line([[2.6,.03,0],[2.6,.03,13]]);this.arc(2.6,6.5,1.8,0,Math.PI*2);this.arc(15,6.8,1.8,Math.PI/2,Math.PI*1.5);this.arc(18.2,6.8,5.7,Math.PI/2,Math.PI*1.5);
 for(let side=0;side<2;side++)for(let row=0;row<3;row++)for(let i=0;i<35;i++){let x=i*.62-.7,z=side?14.4+row*.5:-1.3-row*.5;this.sphere(this.scene,x,.55+row*.3,z,.12,.15,.12,['#48576c','#797167','#587883'][i%3]);this.box(this.scene,x,.25+row*.3,z,.24,.35,.25,'#26364b');}
 this.applyMambasCourt();
 }
 applyMambasCourt(){
  // The supplied 4:3 concept is a visual layer only. The measured lines above
  // remain the gameplay geometry, so art cannot change bounds, scoring or bounce.
  if(typeof document?.createElementNS!=='function')return;
  const T=THREE,loader=new T.TextureLoader();
  loader.load('/courts/mambas-united/v1/concept.png',(texture)=>{
   texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=this.renderer.capabilities?.getMaxAnisotropy?.()||1;
   const aspect=1448/1086,maxWidth=19.5,maxDepth=13,depth=Math.min(maxDepth,maxWidth/aspect),width=depth*aspect;
   const material=new T.MeshStandardMaterial({map:texture,color:'#ffffff',transparent:true,opacity:.68,roughness:.3,metalness:.12,depthWrite:false});
   const plane=new T.Mesh(new T.PlaneGeometry(width,depth),material);plane.rotation.x=-Math.PI/2;plane.position.set(9.75,.004,6.5);plane.renderOrder=-2;plane.userData.staticCourt=true;plane.userData.texture=texture;
   this.scene.add(plane);this.brandTexture=texture;this.brandTexturePlane=plane;
  },undefined,()=>{this.brandTexture=null;this.brandTexturePlane=null;});
 }
 hoop(){const T=THREE;this.box(this.scene,20.3,1.4,6.8,.15,2.8,.15,'#303947');this.box(this.scene,19.7,2.6,6.8,1.2,.12,.15,'#566577');const board=this.mesh(new T.BoxGeometry(.07,1.2,1.9),new T.MeshPhysicalMaterial({color:'#dcf3ff',transparent:true,opacity:.33,roughness:.14,metalness:.1,side:T.DoubleSide}));board.position.set(19.05,2.48,6.8);this.scene.add(board);
 this.line([[19,1.88,5.85],[19,3.08,5.85],[19,3.08,7.75],[19,1.88,7.75],[19,1.88,5.85]],'#d9e8ed',.025);this.line([[18.99,2.1,6.42],[18.99,2.65,6.42],[18.99,2.65,7.18],[18.99,2.1,7.18],[18.99,2.1,6.42]],'#ffffff',.022);
 this.rim=new T.Group();this.rim.position.set(18.2,2.06,6.8);this.scene.add(this.rim);const ring=this.mesh(new T.TorusGeometry(.3,.025,10,48),this.mat('#f37c30'));ring.rotation.x=Math.PI/2;this.rim.add(ring);this.box(this.rim,.4,0,0,.25,.06,.1,'#eb7830');this.net=new T.Group();this.rim.add(this.net);for(let i=0;i<12;i++){let a=i*Math.PI/6;this.line([[Math.cos(a)*.29,0,Math.sin(a)*.29],[Math.cos(a+.24)*.19,-.39,Math.sin(a+.24)*.19]],'#e4ecdf',.008,this.net);}for(let i=1;i<=3;i++){const r=this.mesh(new T.TorusGeometry(.29-i*.033,.006,4,36),this.mat('#e4ecdf'));r.rotation.x=Math.PI/2;r.position.y=-i*.13;this.net.add(r);}
 }
 textureLabel(text,bg,fg,w=512,h=96,size=40){const T=THREE,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=fg;ctx.font=`800 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2,w-14);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sprite.userData.texture=tex;return sprite;}
 player(a){const T=THREE,g=new T.Group(),body=new T.Group();g.add(body);this.scene.add(g);const kit=a.team===0?'#127f73':'#f0dfc1',trim=a.team===0?'#f6cb77':'#b62843',skin=a.skin;const big=/^(C|PF|B)$/.test(a.position),scale=big?1.12:1;g.scale.setScalar(scale);
 // Rounded toy proportions: a layered uniform, oversized head and readable shoes survive the wide court camera.
 this.sphere(body,0,.88,0,.235,.34,.165,kit);this.box(body,0,.65,0,.41,.23,.30,kit);this.box(body,0,.69,.15,.43,.055,.02,trim);this.box(body,-.17,.82,.02,.038,.28,.25,trim);this.box(body,.17,.82,.02,.038,.28,.25,trim);
 this.box(body,0,.48,0,.42,.16,.29,kit);this.box(body,-.14,.34,0,.16,.18,.19,trim);this.box(body,.14,.34,0,.16,.18,.19,trim);
 this.sphere(body,0,1.28,0,.09,.125,.09,skin);this.sphere(body,0,1.56,0,.34,.34,.31,skin);
 this.sphere(body,0,1.77,-.025,.315,.15,.29,'#211c20');if(a.hair===1){for(let j=0;j<9;j++){const angle=j/9*Math.PI*2;this.sphere(body,Math.cos(angle)*.27,1.56,Math.sin(angle)*.23,.055,.24,.055,'#211c20');}}else if(a.hair===2){for(let j=0;j<12;j++)this.sphere(body,Math.sin(j*2.4)*.22,1.84+(j%3)*.025,Math.cos(j*2.4)*.2,.11,.1,.1,'#211c20');}else if(a.hair===3){for(let j=0;j<5;j++)this.sphere(body,-.2+j*.1,1.91,.02,.065,.12,.08,'#211c20');}else if(a.hair===4){for(let j=0;j<7;j++){const side=j%2?-1:1;this.sphere(body,side*.22,1.78-j*.035,.02,.055,.16,.055,'#211c20');}}
 for(const sign of [-1,1]){this.sphere(body,sign*.32,1.55,0,.07,.095,.065,skin);this.sphere(body,sign*.12,1.57,.281,.07,.08,.025,'#fff8e9');this.sphere(body,sign*.12,1.565,.307,.034,.047,.013,'#151b26');this.box(body,sign*.12,1.68,.286,.13,.025,.025,'#251e24');this.box(body,sign*.12,1.69,.30,.11,.018,.012,'#251e24');}
 this.sphere(body,0,1.51,.31,.058,.068,.062,skin);this.line([[-.08,1.42,.29],[0,1.40,.32],[.08,1.42,.29]],'#703e32',.014,body);this.sphere(body,-.22,1.43,.285,.035,.025,.014,'#e68d7f');this.sphere(body,.22,1.43,.285,.035,.025,.014,'#e68d7f');
 const num=this.textureLabel(String(a.number),kit,a.team===0?'#ffe6b5':'#94223b',128,128,85);num.position.set(0,.91,.18);num.scale.set(.27,.27,1);body.add(num);
 const limbs=[];for(let j=0;j<4;j++){const segs=[];for(let k=0;k<2;k++){const mesh=this.mesh(new T.CylinderGeometry(j<2?.075:.09,j<2?.08:.095,1,14),this.mat(j<2?skin:'#724c38'));body.add(mesh);segs.push(mesh);}const end=this.sphere(body,0,0,0,j<2?.09:.12,j<2?.075:.08,j<2?.08:.20,j<2?skin:'#f4f2e8');limbs.push({segs,end});}
 const label=this.textureLabel(a.name.split(' ').at(-1),a.team===0?'#0b3935':'#442733','#fff5df');label.scale.set(1.2,.225,1);label.position.set(0,2.2,0);g.add(label);
 const active=this.mesh(new T.TorusGeometry(.38,.018,6,40),this.mat('#f6c66a'));active.rotation.x=Math.PI/2;active.position.y=.02;g.add(active);
 return {g,body,limbs,label,active,scale};
 }
 limb(p,i,start,elbow,end){const T=THREE,l=p.limbs[i],points=[start,elbow,end].map(v=>new T.Vector3(...v));l.segs.forEach((seg,k)=>{const a=points[k],b=points[k+1],delta=b.clone().sub(a);seg.position.copy(a).add(b).multiplyScalar(.5);seg.scale.y=delta.length();seg.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());});l.end.position.copy(points[2]);}
 setCamera(){if(this.labCamera&&this.spotlightActor){const a=this.spotlightActor,x=a.at.x*.02,z=a.at.y*.02,yaw=this.labCamera.yaw,pitch=this.labCamera.pitch,d=this.labCamera.distance;this.camera.position.set(x+Math.sin(yaw)*d,1.35+pitch+Math.cos(yaw)*d*.18,z+Math.cos(yaw)*d);this.camera.lookAt(x,1.02,z);return;}if(this.view===4&&this.spotlightActor){const a=this.spotlightActor,x=a.at.x*.02,z=a.at.y*.02;this.camera.position.set(x-2.8,2.9,z+3.4);this.camera.lookAt(x,1.05,z);}else{this.camera.position.set(...this.views[this.view%4]);this.camera.lookAt(11,0,6.5);}}
 render(m,opts){const T=THREE,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sh=m.shot,ball=new T.Vector3(m.ball.x*.02,m.height*.02,m.ball.y*.02);
 if(!this.spotlightActor||!this.playerLab)this.spotlightActor=m.actors.find(a=>a===m.off[m.holder])||m.actors[0];if(this.view===4)this.setCamera();
 for(const a of m.actors){let p=this.people.get(a.id);if(!p){p=this.player(a);this.people.set(a.id,p);}const own=a===m.off[m.holder],shooting=sh&&a===m.off[sh.index],def=a.team!==m.side,flight=shooting&&m.phase==='shot',dunk=shooting&&sh.kind==='dunk'&&['shot','rim'].includes(m.phase),run=clamp(Math.hypot(a.velocity.x,a.velocity.y)/130,0,1),gait=a.gait;
 p.g.visible=this.view!==4||a===this.spotlightActor;
 p.g.position.set(a.at.x*.02,0,a.at.y*.02);let jump=flight?Math.sin(clamp(m.stageTime/.6,0,1)*Math.PI)*.4:0;
 if(dunk){let t=m.phase==='shot'?clamp(m.flight,0,1):1,land=m.phase==='rim'?clamp((m.stageTime-.18)/.47,0,1):0;p.g.position.x=(sh.from.x+(910-sh.from.x)*t)*.02;p.g.position.z=(sh.from.y+(340-sh.from.y)*t)*.02;jump=(2.12-1.35*p.scale)*Math.sin(t*Math.PI/2)*(1-land);if(land>0){p.g.position.x+=(a.at.x*.02-p.g.position.x)*land;p.g.position.z+=(a.at.y*.02-p.g.position.z)*land;}}
 if(a===m.reboundWinner&&m.phase==='board')jump=Math.sin(clamp(m.stageTime/.65,0,1)*Math.PI)*.35;
 if(dunk&&m.phase==='rim'&&m.stageTime<.62){p.g.position.x=18.05;p.g.position.z=6.8;p.g.position.y=.72;p.body.rotation.x=-.12;p.body.rotation.z=Math.sin(m.stageTime*18)*.035;}else{p.g.position.y=jump;p.body.rotation.x=0;p.body.rotation.z=own&&m.phase==='euro'?Math.sin(m.stageTime*10)*.2:0;}const focus=def?m.ball:Math.hypot(a.velocity.x,a.velocity.y)>15?{x:a.at.x+a.velocity.x,y:a.at.y+a.velocity.y}:{x:910,y:340};p.body.rotation.y=Math.atan2(focus.x-a.at.x,focus.y-a.at.y);p.body.position.y=(!def?Math.sin(gait*2)*.018*run:-.045);p.g.updateMatrixWorld(true);
 const stride=Math.sin(gait)*.22*run,spread=def?.18:.11;
 this.limb(p,2,[-.11,.65,0],[-spread,.37,stride*.5],[-spread,.09,stride]);this.limb(p,3,[.11,.65,0],[spread,.37,-stride*.5],[spread,.09,-stride]);
 let left=[-.36,.67,-stride],right=[.36,.67,stride];if(def){left=[-.52,1.05,0];right=[.52,1.05,0];}if(own&&m.phase==='gather'){left=[-.12,1.2,.3];right=[.12,1.2,.3];}if(flight){left=[-.18,1.67,.2];right=[.12,1.9,.28];}if(a===m.reboundWinner&&m.phase==='board'){left=[-.18,1.65,.18];right=[.18,1.65,.18];}
 if(own&&!['pass','shot','rim','rebound','board','done'].includes(m.phase)){const local=p.body.worldToLocal(ball.clone());right=[local.x,local.y,local.z];}
 if(dunk&&((m.phase==='shot'&&m.flight>.08)||(m.phase==='rim'&&m.stageTime<.22&&sh.made))){const target=m.phase==='shot'?ball:new T.Vector3(18.2,2.08,6.8);const local=p.body.worldToLocal(target.clone());right=[local.x,local.y,local.z];left=[local.x-.12,local.y-.03,local.z];}
 this.limb(p,0,[-.23,1.08,0],[-.37,(left[1]+1.08)/2,left[2]*.4],left);this.limb(p,1,[.23,1.08,0],[.37,(right[1]+1.08)/2,right[2]*.4],right);p.label.visible=opts.names!==false;p.active.visible=own&&!m.done;
 }
 this.ball.position.copy(ball);this.ball.rotation.z=m.elapsed*4;this.ball.rotation.x=m.elapsed*2;const f=AAUCourt.rimFeedback(m);this.rim.position.y=2.06-f.drop*.02;this.rim.rotation.z=-f.drop*.012;this.net.scale.y=1+f.net*.025;this.net.rotation.x=f.sway*.015;this.renderer.render(this.scene,this.camera);
 }
 dispose(){this.renderer.dispose();this.scene.traverse(o=>{o.geometry?.dispose();if(o.userData.texture)o.userData.texture.dispose();});this.brandTexture?.dispose();}
}
