/* Local procedural rigs for the approved Tripo encounter meshes. No paid services. */
(function(){'use strict';
const files={champion:'champion-body-v2-a1ec1a0d',hollow:'hollow-champion-cfcaa98a',mass:'ravenous-mass-1844b257',colossus:'buried-colossus-e2ef41c5',carrion:'carrion-queen-2e89df48',earth:'hungry-earth-8d2e737a',hunt:'wolf-pack-wolf-e5ffb7dd',shield:'champion-shield-v2-4e7275f5',sword:'champion-sword-v2-b65fb2db'};
const heights={champion:27,hollow:30,mass:42,colossus:58,carrion:45,earth:27,hunt:20,shield:15,sword:20};
const cache=new Map();
const sat=x=>Math.max(0,Math.min(1,x));
function prepare(T,role,assets){
 if(cache.has(role))return cache.get(role);
 const source=assets['enc_'+role]?.scene;if(!source)throw Error('Encounter model missing: '+role);
 source.updateMatrixWorld(true);let mesh;source.traverse(o=>{if(o.isMesh&&!mesh)mesh=o;});
 if(!mesh)throw Error('Encounter mesh missing: '+role);
 const geo=mesh.geometry.clone();geo.applyMatrix4(mesh.matrixWorld);geo.rotateY(-Math.PI/2);geo.computeBoundingBox();
 const b=geo.boundingBox,c=b.getCenter(new T.Vector3()),h=heights[role],s=h/(b.max.y-b.min.y);
 geo.translate(-c.x,-b.min.y,-c.z);geo.scale(s,s,s);
 if(role==='carrion')geo.scale(1.3,1,1);
 if(role==='earth')geo.scale(1.25,.8,1.1);
 geo.computeBoundingBox();geo.computeBoundingSphere();
 const material=new T.MeshStandardMaterial({map:mesh.material.map,normalMap:mesh.material.normalMap,roughnessMap:mesh.material.roughnessMap,metalness:role==='champion'||role==='hollow'||role==='sword'||role==='shield'?.25:0,roughness:.88,color:0xffffff});
 if(material.map)material.map.encoding=T.sRGBEncoding;
 let boneSurface=null;
 if(role==='colossus'&&material.map?.image){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(material.map.image,0,0,1024,1024);const pixels=ctx.getImageData(0,0,1024,1024).data,uv=geo.attributes.uv;boneSurface=new Float32Array(uv.count);
  for(let i=0;i<uv.count;i++){const x=Math.min(1023,Math.max(0,Math.floor(uv.getX(i)*1024))),y=Math.min(1023,Math.max(0,Math.floor(uv.getY(i)*1024))),j=(y*1024+x)*4;boneSurface[i]=sat(((pixels[j]+pixels[j+1]+pixels[j+2])/765-.32)/.2);}
 }
 const prepared={geo,material,h:geo.boundingBox.max.y,box:geo.boundingBox.clone(),boneSurface};cache.set(role,prepared);return prepared;
}
function create(T,role,assets){
 const p=prepare(T,role,assets),h=p.h,root=new T.Group(),rig=new T.Group();root.name='Tripo '+role;root.add(rig);
 const bones=[],parts={},rest=[],owned=[];const base=new T.Bone();base.name='root';rig.add(base);bones.push(base);
 function bone(name,x,y,z,parent=base){const b=new T.Bone();b.name=name;const world=new T.Vector3(x*h,y*h,z*h);b.position.copy(world);if(parent!==base)b.position.sub(rest[bones.indexOf(parent)]);parent.add(b);bones.push(b);rest.push();rest[bones.length-1]=world;parts[name]=b;return b;}
 rest[0]=new T.Vector3();
 const human=role==='champion'||role==='hollow';
 if(human){bone('head',0,.82,0);for(const side of [-1,1]){const suffix=side<0?'R':'L',y=role==='champion'?.76:.74;const arm=bone('arm'+suffix,side*.18,y,0);const hand=bone('hand'+suffix,side*(role==='champion'?.43:.45),role==='champion'?.75:.62,0,arm);bone('leg'+suffix,side*.11,.44,0);}}
 else if(role==='hunt'){bone('head',0,.68,.44);bone('tail',0,.58,-.49);for(const side of [-1,1])for(const front of [false,true]){const name=(front?'front':'back')+(side<0?'R':'L'),hip=bone(name,side*.115,.49,front?.36:-.35),knee=bone(name+'Lower',side*.115,.23,front?.36:-.50,hip);bone(name+'Paw',side*.115,.055,front?.43:-.44,knee);}}
 else if(role==='carrion'){bone('head',0,.64,.12);bone('tail',0,.35,-.15);for(const side of [-1,1]){const suffix=side<0?'R':'L',wing=bone('wing'+suffix,side*.18,.70,0),tip=bone('wingTip'+suffix,side*.40,.72,-.02,wing);bone('primaries'+suffix,side*.55,.48,-.03,tip);bone('foot'+suffix,side*.10,.24,.03);}}
 else if(role==='colossus'){bone('head',0,.72,.04);bone('handR',-.26,.4,.12);bone('handL',.26,.4,.12);}
 else {bone('jaw',0,role==='mass'?.33:.25,.15);if(role==='mass'){bone('armR',-.32,.55,0);bone('armL',.32,.55,0);}}
 const geo=p.geo.clone(),pos=geo.attributes.position,indices=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4);
 function influence(i,name,w){w=sat(w);indices[i*4]=0;weights[i*4]=1-w;indices[i*4+1]=bones.indexOf(parts[name]);weights[i*4+1]=w;}
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i)/h,y=pos.getY(i)/h,z=pos.getZ(i)/h,ax=Math.abs(x),side=x<0?'R':'L';weights[i*4]=1;
  if(human){if(y>.82&&ax<.18)influence(i,'head',(y-.82)/.04);else if(y>.53&&ax>.16)influence(i,'arm'+side,(ax-.16)/.08);else if(y<.43)influence(i,'leg'+side,(.44-y)/.08);}
  else if(role==='hunt'){if(y<.49&&ax>.045&&Math.abs(z-(z>0?.36:-.40))<.23){const name=(z>0?'front':'back')+side,w=sat((.49-y)/.13),lower=sat((.29-y)/.11),paw=sat((.09-y)/.045);indices.set([0,bones.indexOf(parts[name]),bones.indexOf(parts[name+'Lower']),bones.indexOf(parts[name+'Paw'])],i*4);weights.set([1-w,w*(1-lower),w*lower*(1-paw),w*lower*paw],i*4);}else if(z>.32&&y>.55)influence(i,'head',(z-.32)/.18);else if(z<-.49)influence(i,'tail',(-z-.49)/.14);}
  else if(role==='carrion'){if(ax>.16&&y>.19){const w=sat((ax-.16)/.10),tip=sat((ax-.34)/.13),outer=sat((ax-.51)/.13);indices.set([0,bones.indexOf(parts['wing'+side]),bones.indexOf(parts['wingTip'+side]),bones.indexOf(parts['primaries'+side])],i*4);weights.set([1-w,w*(1-tip),w*tip*(1-outer),w*tip*outer],i*4);}else if(y>.62&&ax<.18&&z>-.05)influence(i,'head',(y-.62)/.10);else if(y<.25&&z>-.02)influence(i,'foot'+side,(.25-y)/.10);else if(z<-.16&&y<.5)influence(i,'tail',(-z-.16)/.10);}
  else if(role==='colossus'){const bone=p.boneSurface?.[i]??1;if(y>.72)influence(i,'head',(y-.72)/.06*bone);else if(ax>.2&&y>.11&&y<.6&&z>-.08)influence(i,'hand'+side,Math.min((ax-.2)/.1,(y-.11)/.08)*bone);}
  else {if(y>.17&&y<(role==='mass'?.46:.45)&&z>.12)influence(i,'jaw',Math.min((z-.12)/.1,(y-.17)/.08));else if(role==='mass'&&ax>.31&&y>.15&&y<.65)influence(i,'arm'+side,(ax-.31)/.1);}
 }
 geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const material=p.material.clone();material.skinning=true;owned.push(material);const skin=new T.SkinnedMesh(geo,material);skin.name=role+' body';skin.frustumCulled=false;rig.add(skin);root.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);skin.bind(skeleton);skin.normalizeSkinWeights();
 const armor=new T.Group();armor.name='Breakable armor';root.add(armor);
 // The hollow outer plates disappear at the existing phase transition, revealing a dark core.
 let shell=null,core=null;
 if(role==='hollow'){
  const sourceIndex=geo.index?.array||Array.from({length:pos.count},(_,i)=>i),shellIds=[],coreIds=[];
  for(let i=0;i<sourceIndex.length;i+=3){let x=0,y=0,z=0;for(let k=0;k<3;k++){const j=sourceIndex[i+k];x+=Math.abs(pos.getX(j))/h/3;y+=pos.getY(j)/h/3;z+=pos.getZ(j)/h/3;}const plate=y>.65&&y<.88&&x>.18||y>.48&&y<.72&&x<.19&&z>.055;(plate?shellIds:coreIds).push(...sourceIndex.slice(i,i+3));}
  const shellGeo=geo.clone();shellGeo.setIndex(shellIds);geo.setIndex(coreIds);shell=new T.SkinnedMesh(shellGeo,material);shell.frustumCulled=false;armor.add(shell);shell.bind(skeleton,skin.bindMatrix);owned.push(shellGeo);
  const coreMat=new T.MeshStandardMaterial({color:0x26212b,roughness:1,emissive:0x44200a,emissiveIntensity:.4});owned.push(coreMat);
  const coreGeo=new T.IcosahedronGeometry(1,2);owned.push(coreGeo);core=new T.Mesh(coreGeo,coreMat);core.position.set(0,h*.59,0);core.scale.set(h*.145,h*.19,h*.10);core.visible=false;rig.add(core);
 }
 function equipment(kind,hand){const q=prepare(T,kind,assets),g=q.geo.clone();if(kind==='sword'){
   // Remove the generated second guard's width without touching the blade or main guard.
   const a=g.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i)/q.h;if(y>.27&&y<.43){a.setX(i,Math.max(-q.h*.027,Math.min(q.h*.027,a.getX(i))));a.setZ(i,Math.max(-q.h*.027,Math.min(q.h*.027,a.getZ(i))));}}a.needsUpdate=true;g.computeVertexNormals();g.translate(0,-q.h*.22,0);
  }else g.translate(0,-q.h*.52,0);
  const mat=q.material.clone(),m=new T.Mesh(g,mat);m.name='Separate '+kind;owned.push(g,mat);hand.add(m);return m;}
 let sword,shield;if(human){sword=equipment('sword',parts.handR);sword.rotation.z=-1.05;sword.rotation.x=.25;if(role==='champion'){shield=equipment('shield',parts.handL);shield.rotation.z=1.05;shield.position.z=1.3;}}
 const U=root.userData;Object.assign(U,{tripoEncounter:true,role,parts,armor,skin,skeleton,sc:1,sword,shield});
 U.dispose=()=>{if(U.disposed)return;U.disposed=true;geo.dispose();for(const o of owned)o.dispose();skeleton.dispose();};
 U.flash=v=>{material.emissive.setRGB(v*.5,v*.3,v*.15);};
 // Two-link leg solve keeps support paws level while swing paws clear the ground.
 function legPose(name,zOffset,lift,bodyDrop=0){
  const hip=parts[name],knee=parts[name+'Lower'],paw=parts[name+'Paw'],a=rest[bones.indexOf(hip)],b=rest[bones.indexOf(knee)],c=rest[bones.indexOf(paw)];
  const l1=Math.hypot(b.y-a.y,b.z-a.z),l2=Math.hypot(c.y-b.y,c.z-b.z),dy=c.y-a.y+lift+bodyDrop,dz=c.z-a.z+zOffset,d=Math.min(l1+l2-.001,Math.max(Math.abs(l1-l2)+.001,Math.hypot(dy,dz)));
  const upper0=Math.atan2(b.z-a.z,a.y-b.y),lower0=Math.atan2(c.z-b.z,b.y-c.y),sign=lower0-upper0<0?-1:1;
  const bend=sign*Math.acos(Math.max(-1,Math.min(1,(d*d-l1*l1-l2*l2)/(2*l1*l2))));
  const upper=Math.atan2(dz,-dy)-Math.atan2(l2*Math.sin(bend),l1+l2*Math.cos(bend));
  hip.rotation.x=upper0-upper;knee.rotation.x=lower0-upper0-bend;paw.rotation.x=-hip.rotation.x-knee.rotation.x;
 }
 U.pose=(t,e={})=>{
  const cast=e.eventCast,wind=cast?sat((t-cast.started)/cast.wind):0,after=cast?t-cast.at:-1,hit=after>=0?Math.sin(Math.PI*sat(after/.35)):0,move=e.movingNow&&!cast,phase=t*(role==='hunt'?12:7),stride=move?Math.sin(phase):0;
  for(let i=1;i<bones.length;i++){bones[i].rotation.set(0,0,0);const parent=bones[i].parent,pr=parent===base?rest[0]:rest[bones.indexOf(parent)];bones[i].position.copy(rest[i]).sub(pr);}
  rig.position.y=move?Math.abs(Math.sin(phase))*h*.018:Math.sin(t*2)*h*.003;rig.rotation.set(0,0,0);
  if(human){const drop=role==='champion'?1.05:.6;parts.armR.rotation.z=drop;parts.armL.rotation.z=-drop;parts.legR.rotation.x=stride*.35;parts.legL.rotation.x=-stride*.35;parts.armR.rotation.x=-stride*.18;parts.armL.rotation.x=stride*.12;
   sword.rotation.z=-drop;if(shield)shield.rotation.z=drop;
   if(cast){const thrust=cast.shape==='lane';parts.armR.rotation.x=-wind*.9+hit*(thrust?-.5:1.8);parts.armR.rotation.y=thrust?0:-wind*.65+hit*1.2;parts.armR.rotation.z=drop-wind*.45;parts.armL.rotation.x=-.35;rig.rotation.y=-wind*.15+hit*.25;}
   if(e.eventBroken){armor.visible=false;if(core)core.visible=true;material.emissive.setRGB(.10,.035,0);}else{armor.visible=true;if(core)core.visible=false;}
  }else if(role==='hunt'){
   const gait=(e.eventDistance||0)/(h*1.1)+(e.eventIndex||0)*.21,windup=cast&&after<0?wind:0,flight=cast&&after>=0&&after<(cast.travel||0),landAge=e.eventLandingAt===undefined?10:t-e.eventLandingAt;
   const drop=windup*h*.055+(landAge>=0&&landAge<.3?Math.sin(landAge/.3*Math.PI)*h*.045:0);rig.position.y=-drop;
   for(const name of ['frontR','frontL','backR','backL']){const diagonal=name==='frontR'||name==='backL',u=(gait+(diagonal?0:.5))%1,stance=u<.6,swing=(u-.6)/.4;
    let offset=move?(stance?( .5-u/.6)*h*.5:(-.5+(.5-.5*Math.cos(swing*Math.PI)))*h*.5):0;
    let lift=move&&!stance?Math.sin(swing*Math.PI)*h*.12:0;
    if(flight){const f=sat(after/cast.travel);offset=(name.startsWith('front')?.16:-.12)*h*Math.sin(f*Math.PI);lift=h*.11;}
    legPose(name,offset,lift,drop);
   }
   parts.head.rotation.x=windup*.12-(flight?.12:0);parts.tail.rotation.y=Math.sin(t*3+(e.eventIndex||0))*.08;rig.rotation.x=flight?Math.sin(after/cast.travel*Math.PI)*-.1:0;
  }
  else if(role==='carrion'){
   const takeoff=sat((t-(e.eventTakeoffAt??t-2))/.75),landing=e.eventLandingAt===undefined?10:t-e.eventLandingAt,air=e.eventLanded?Math.max(0,1-landing/.4):takeoff,diving=cast?.style==='dive',travel=diving&&after>=0?sat(after/cast.travel):0;
   const stroke=Math.sin(t*10),power=diving?(after<0?.7:.2):takeoff<1?1.2:.95;
   for(const side of [-1,1]){const suffix=side<0?'R':'L',wing=parts['wing'+suffix],tip=parts['wingTip'+suffix],outer=parts['primaries'+suffix];
    wing.rotation.y=side*.75*(1-air)+side*.25*travel;wing.rotation.z=-side*(.08+air*(-.43+stroke*.65*power));
    const open=air*(1-(diving&&after>=0?.75*Math.sin(travel*Math.PI):0));tip.rotation.z=side*open*.18-side*air*Math.sin(t*7.5-.65)*.12*power;tip.rotation.y=side*.25*(1-air);
    outer.rotation.z=side*open*.03-side*air*Math.sin(t*7.5-1.1)*.06*power;parts['foot'+suffix].rotation.x=air*.6;
   }
   rig.position.y=e.eventLanded&&landing<.4?-Math.sin(Math.max(0,landing)/.4*Math.PI)*h*.035:0;
   rig.rotation.x=diving?(after<0?-.18*wind:.65*Math.sin(travel*Math.PI)):e.eventExposed?-.12:air*.16;rig.rotation.z=(e.eventBank||0)*air;
   parts.head.rotation.x=cast&&!diving?-.2*wind+.28*hit:-rig.rotation.x*.5;parts.tail.rotation.x=-air*.12;
  }
  else if(role==='colossus'){parts.head.rotation.x=cast?.12*wind-.3*hit:Math.sin(t)*.025;for(const [i,name]of ['handR','handL'].entries()){const b=parts[name];if(cast&&cast.hand===i){const dx=cast.x-e.x,dz=cast.z-e.z,c=Math.cos(e.yaw),s=Math.sin(e.yaw),progress=t-cast.started,reach=progress<cast.wind?wind:1-sat((progress-cast.wind-.14)/.5),u=reach*reach*(3-2*reach);b.position.x+=(dx*c-dz*s-rest[bones.indexOf(b)].x)*u;b.position.z+=(dx*s+dz*c-rest[bones.indexOf(b)].z)*u;b.position.y+=(after<0?wind*24:24*(1-sat(after/.14)));}}}
  else {parts.jaw.rotation.x=-wind*.35+hit*.5;if(role==='mass'){rig.rotation.z=Math.sin(t*3)*.025;parts.armR.rotation.x=stride*.2;parts.armL.rotation.x=-stride*.2;root.scale.setScalar(1+(e.eventGrowth||0)*.055);}else rig.scale.y=1+wind*.06;}
  if(!e.eventBroken)U.flash(e.flash>0?1:0);
 };
 U.anim=(t,state,progress=0)=>{if(state==='death'){const u=sat(progress);rig.rotation.z=-u*Math.PI*.42;rig.position.y=-h*u*.18;root.scale.y=1-u*.4;}else U.pose(t,{movingNow:state==='walk'||state==='run',eventLanded:true});};
 U.pose(0);return root;
}
window.BriarfordEncounterModels={files,create,prewarm(T,assets){for(const role of ['hunt','mass','colossus','carrion','earth'])prepare(T,role,assets);}};
})();
