/* MA//BIOME — wspólny silnik światów (dron + zjazd scrollem + HUD + mgła)
   Strona podaje moduł biomu: {build(THREE)->{group,pad:{x,z,h},animate?,alt?}, FOG_STOPS, SKY:[top,bottom], SUN:{col,int}, HEMI:{sky,ground,int}, MAXALT}
   Wymaga: three.min.js, GLTFLoader.js, world.js (buildDrone/mergeGroup/mergeStatic), hyper.js */
(function(root){
'use strict';
function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
function easeOutBack(x){const c=.35;return 1+(1+c)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

root.MABIOME={run(BIOME){
  const holder=document.getElementById('sky')||document.getElementById('scene');
  if(!holder||!window.THREE){document.body.classList.add('no3d');return}
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}
  catch(e){document.body.classList.add('no3d');return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setSize(innerWidth,innerHeight);
  holder.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(BIOME.FOG_STOPS[0][1],20,90);
  const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.1,460);
  camera.position.set(0,.55,7.6);

  const hemi=new THREE.HemisphereLight(BIOME.HEMI.sky,BIOME.HEMI.ground,BIOME.HEMI.int);scene.add(hemi);
  const sun=new THREE.DirectionalLight(BIOME.SUN.col,BIOME.SUN.int);
  sun.position.set(-7,9,4);scene.add(sun);
  const fill=new THREE.DirectionalLight(0x8fa8c4,.3);fill.position.set(5,2,-3);scene.add(fill);

  /* gwiazdy startowe (orbita) */
  const starGeo=new THREE.BufferGeometry();
  {const P=new Float32Array(420*3);
   for(let i=0;i<420;i++){P[i*3]=(Math.random()-.5)*160;P[i*3+1]=(Math.random()-.5)*120;P[i*3+2]=-40-Math.random()*80}
   starGeo.setAttribute('position',new THREE.BufferAttribute(P,3))}
  const starMat=new THREE.PointsMaterial({color:0xdfe8ff,size:.5,sizeAttenuation:true,transparent:true,opacity:.95});
  const stars=new THREE.Points(starGeo,starMat);scene.add(stars);

  /* świat: kolumna przesuwana scrollem */
  const R=140, GROUND_FINAL=-2.15;
  const world=new THREE.Group();scene.add(world);
  let gw;
  try{
    gw=BIOME.build(THREE);
    world.add(gw.group);
    gw.group.position.y=GROUND_FINAL-R;
    MAWORLD.mergeStatic(THREE,gw.group);
  }catch(err){
    console.error('MABIOME build error:',err);
    document.body.classList.add('no3d');
    try{renderer.dispose()}catch(_){}
    holder.innerHTML='';
    return;
  }
  const ground=gw.group;

  /* dron: fallback proceduralny → GLB */
  const {droneYaw,drone,props}=MAWORLD.buildDrone(THREE);
  scene.add(droneYaw);
  let FOOT_Y=new THREE.Box3().setFromObject(drone).min.y;
  const PAD_H=(gw.pad&&gw.pad.h)||0.06;
  let LAND_Y=GROUND_FINAL+PAD_H-FOOT_Y;
  if(THREE.GLTFLoader){
    new THREE.GLTFLoader().load('assets/drone.glb',g=>{
      const src=g.scene.getObjectByName('drone')||g.scene;
      while(drone.children.length)drone.remove(drone.children[0]);
      props.length=0;
      [...src.children].forEach(c=>drone.add(c));
      let idx=0;
      drone.children.filter(o=>/^prop_\d/.test(o.name)).sort((a,b)=>a.name.localeCompare(b.name))
        .forEach(prop=>{
          const disc=new THREE.Mesh(new THREE.CircleGeometry(.42,20),
            new THREE.MeshBasicMaterial({color:0xdfe6ec,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
          disc.rotation.x=-Math.PI/2;prop.add(disc);
          const o={prop,disc,dir:(idx%2?1:-1)};
          const st=drone.getObjectByName('strobe_'+idx)||drone.getObjectByName('strobe_'+(idx+2));
          if(st)o.strobe=st;props.push(o);idx++;});
      FOOT_Y=new THREE.Box3().setFromObject(drone).min.y;
      LAND_Y=GROUND_FINAL+PAD_H-FOOT_Y;
    },undefined,()=>{});
  }

  /* mgła per-biom */
  const fogA=new THREE.Color(),fogB=new THREE.Color();
  function fogColorAt(p){
    const S=BIOME.FOG_STOPS;
    for(let i=0;i<S.length-1;i++){const[a,ca]=S[i],[b,cb]=S[i+1];
      if(p<=b){fogA.setHex(ca);fogB.setHex(cb);return fogA.lerp(fogB,(p-a)/(b-a))}}
    return fogA.setHex(S[S.length-1][1])}

  /* sterowanie scroll */
  let targetP=0,p=0,mx=0,my=0,fov=46;
  const maxScroll=()=>Math.max(1,document.documentElement.scrollHeight-innerHeight);
  addEventListener('scroll',()=>{targetP=scrollY/maxScroll()},{passive:true});
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  targetP=scrollY/maxScroll();p=targetP;

  const altEl=document.getElementById('alt-v');
  const wpEl=document.getElementById('alt-wp');
  const fillEl=document.getElementById('alt-fill');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  renderer.compile(scene,camera);
  let last=performance.now(),t=0,perfN=0,perfAcc=0;
  function frame(){
    const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;
    p+=(targetP-p)*.07;
    const touch=smooth(.9,.985,p), eTouch=easeOutBack(touch);
    const leave=smooth(.05,.2,p);

    world.position.y=p*R;
    starMat.opacity=.95*(1-leave);

    /* dron */
    const YAW0=Math.PI*.9;
    droneYaw.rotation.y=YAW0+t*.13;
    drone.position.y=Math.sin(t*1.5)*.05*(1-touch)+eTouch*LAND_Y;
    drone.rotation.z=Math.sin(t*.9)*.02*(1-touch);
    const spd=18+(1-touch)*22;
    props.forEach(o=>{o.prop.rotation.y+=o.dir*spd*dt;
      o.disc.material.opacity=.16*(1-touch);
      if(o.strobe)o.strobe.material.color.setHex((t%1<.08)?0xffffff:0x666a70)});

    if(gw.animate){try{gw.animate(dt,t,p)}catch(err){
      console.error('animate error:',err);gw.animate=null}}

    /* atmosfera */
    const fc=fogColorAt(p);scene.fog.color.copy(fc);
    scene.fog.near=14+leave*8;
    scene.fog.far=60+smooth(.35,1,p)*300+(1-leave)*120;
    hemi.intensity=BIOME.HEMI.int*(.5+leave*.6);
    sun.intensity=BIOME.SUN.int*(.55+smooth(.1,.3,p)*.6);

    /* kamera */
    const tgtFov=46+clamp(Math.abs(targetP-p)*260,0,12);
    fov+=(tgtFov-fov)*.08;camera.fov=fov;camera.updateProjectionMatrix();
    camera.position.x+=(mx*1.0-camera.position.x)*.05;
    const camY=.55+my*-.4-touch*1.05;
    camera.position.y+=(camY-camera.position.y)*.06;
    camera.position.z+=(7.6-touch*1.8-camera.position.z)*.05;
    camera.lookAt(0,drone.position.y*.6-touch*.4,0);

    /* HUD */
    if(altEl){const alt=Math.round((1-p)*(BIOME.MAXALT||400));altEl.textContent=alt}
    if(fillEl)fillEl.style.height=(p*100).toFixed(1)+'%';
    document.body.classList.toggle('landed',touch>.995);

    /* adaptacja wydajności */
    perfN++;perfAcc+=dt;
    if(perfN===120){if(perfAcc/perfN>.024&&renderer.getPixelRatio()>1){
      renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight)}
      perfN=0;perfAcc=0}

    renderer.render(scene,camera);
    if(!reduced)requestAnimationFrame(frame);
  }
  frame();

  /* waypoint label w HUD wg sekcji */
  if('IntersectionObserver' in window){
    const rail=[...document.querySelectorAll('#rail a')];
    const io=new IntersectionObserver(es=>{es.forEach(e=>{
      if(e.isIntersecting){
        if(wpEl)wpEl.textContent=e.target.dataset.wp||'';
        const c=e.target.querySelector('.card');if(c)c.classList.add('in');
        rail.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));
      }})},{threshold:.35});
    document.querySelectorAll('section[data-wp]').forEach(s=>io.observe(s));
  }
}};
})(window);
