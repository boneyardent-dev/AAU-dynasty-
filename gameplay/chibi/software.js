/* CPU projection fallback for browsers that disable WebGL. Same meshes and camera. */
class CourtSoftwareRenderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas unavailable');this.shadowMap={};this.isSoftware=true;}
 setPixelRatio(){}setSize(w,h){this.canvas.width=w;this.canvas.height=h;}dispose(){}
 render(scene,camera,staticPass=false){
 const key=camera.position.toArray().join(',');
 if(!staticPass&&(!this.cache||this.cacheKey!==key)){this.render(scene,camera,true);this.cache=document.createElement('canvas');this.cache.width=this.canvas.width;this.cache.height=this.canvas.height;this.cache.getContext('2d').drawImage(this.canvas,0,0);this.cacheKey=key;}
 const T=THREE,ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),items=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3(),normal=new T.Vector3(),sun=new T.Vector3(.3,1,.4).normalize();
 const project=v=>[ (v.x+1)*w/2,(1-v.y)*h/2,v.z ];
 scene.traverse(o=>{if(!!o.userData.staticCourt!==staticPass||!o.visible)return;let ancestor=o.parent;while(ancestor){if(!ancestor.visible)return;ancestor=ancestor.parent;}
 if(o.isSprite){const image=o.material.map?.image;if(!image)return;let pos=o.getWorldPosition(new T.Vector3()),s=o.getWorldScale(new T.Vector3()),p=pos.clone().applyMatrix4(vp),edge=pos.clone().addScaledVector(new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),s.x/2).applyMatrix4(vp);items.push({order:o.renderOrder,z:p.z,image,x:(p.x+1)*w/2,y:(1-p.y)*h/2,w:Math.abs(edge.x-p.x)*w,h:Math.abs(edge.x-p.x)*w*s.y/s.x});return;}
 if(!o.isMesh)return;const pos=o.geometry.attributes.position,index=o.geometry.index,material=o.material;if(!pos||!material?.color)return;const count=index?index.count:pos.count;
 for(let i=0;i<count;i+=3){a.fromBufferAttribute(pos,index?index.getX(i):i).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(pos,index?index.getX(i+1):i+1).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(pos,index?index.getX(i+2):i+2).applyMatrix4(o.matrixWorld);normal.crossVectors(ab.copy(b).sub(a),ac.copy(c).sub(a)).normalize();if(normal.dot(ac.copy(camera.position).sub(a))<0&&material.side!==T.DoubleSide)continue;const light=.5+.5*Math.max(0,normal.dot(sun)),col=material.color;const rgb=[col.r,col.g,col.b].map(v=>Math.round(255*Math.pow(Math.min(1,v*light),1/2.2)));a.applyMatrix4(vp);b.applyMatrix4(vp);c.applyMatrix4(vp);if(a.z>1||b.z>1||c.z>1)continue;items.push({order:o.renderOrder,z:(a.z+b.z+c.z)/3,p:[project(a),project(b),project(c)],color:`rgb(${rgb.join(',')})`,opacity:material.opacity});}
 });
 if(staticPass){ctx.fillStyle='#101b29';ctx.fillRect(0,0,w,h);}else ctx.drawImage(this.cache,0,0);items.sort((a,b)=>(a.order-b.order)||(b.z-a.z));for(const t of items){if(t.image){ctx.globalAlpha=1;ctx.drawImage(t.image,t.x-t.w/2,t.y-t.h/2,t.w,t.h);continue;}ctx.globalAlpha=t.opacity??1;ctx.fillStyle=t.color;ctx.beginPath();ctx.moveTo(t.p[0][0],t.p[0][1]);ctx.lineTo(t.p[1][0],t.p[1][1]);ctx.lineTo(t.p[2][0],t.p[2][1]);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;
 }
}
