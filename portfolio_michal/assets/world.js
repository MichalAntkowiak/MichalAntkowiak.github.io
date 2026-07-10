/* world.js — MA//DEORBIT: buildery świata (strona + podgląd node)
   API: MAWORLD.buildDrone / buildTerrain / buildCityGround            */
(function(root){
const MAWORLD={};

/* ───────── pomocnicze ───────── */
function mkCanvas(w,h){
  if(typeof document!=='undefined')
    {const c=document.createElement('canvas');c.width=w;c.height=h;return c}
  return {width:w,height:h,getContext(){return new Proxy({},{get:()=>()=>({addColorStop(){}})})}}
}
function tex(THREE,draw,w,h){const c=mkCanvas(w||256,h||256);
  try{draw(c.getContext('2d'),c.width,c.height)}catch(e){}
  const t=new THREE.CanvasTexture(c);return t}

/* szum wartościowy 2D + fbm (deterministyczny) */
function makeNoise(seed){
  const R=n=>{const x=Math.sin(n*127.1+seed*311.7)*43758.5453;return x-Math.floor(x)};
  const g=(ix,iz)=>R(ix*157+iz*113);
  const sm=t=>t*t*(3-2*t);
  function n2(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=sm(x-ix),fz=sm(z-iz);
    const a=g(ix,iz),b=g(ix+1,iz),c=g(ix,iz+1),d=g(ix+1,iz+1);
    return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz}
  return function fbm(x,z,oct){let v=0,amp=.5,f=1;
    for(let o=0;o<(oct||4);o++){v+=amp*n2(x*f,z*f);amp*=.5;f*=2.03}
    return v} // ~0..1
}

/* ═════════ DRON v3 — mały, minimalistyczny, gładki ═════════ */
MAWORLD.buildDrone=function(THREE){
  const SH =new THREE.MeshStandardMaterial({color:0xeef1f4,roughness:.35,metalness:.08}); // skorupa
  const DK =new THREE.MeshStandardMaterial({color:0x262d35,roughness:.5, metalness:.3});  // grafit
  const GL =new THREE.MeshStandardMaterial({color:0x0a0f14,roughness:.12,metalness:.7});  // szkło
  const ORM=new THREE.MeshBasicMaterial({color:0xe8500f});                                 // akcent

  const droneYaw=new THREE.Group(),drone=new THREE.Group();
  droneYaw.add(drone);

  // korpus: fazowany profil boczny (Extrude+bevel) — nie kula, nie klocek
  {const sh=new THREE.Shape();
   sh.moveTo(-.52,.02);sh.lineTo(-.5,.115);sh.lineTo(-.18,.155);sh.lineTo(.2,.15);
   sh.lineTo(.46,.07);sh.lineTo(.58,.0);sh.lineTo(.5,-.085);sh.lineTo(.1,-.125);
   sh.lineTo(-.28,-.115);sh.lineTo(-.48,-.06);sh.closePath();
   const g=new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,
     bevelThickness:.055,bevelSize:.055,bevelSegments:2,curveSegments:4});
   g.translate(0,0,-.15);
   const hull=new THREE.Mesh(g,SH);hull.rotation.y=Math.PI/2;drone.add(hull)}
  // ciemny pokład grzbietowy + kokpit klinowy + brzuch
  {const deck=new THREE.Mesh(new THREE.BoxGeometry(.26,.018,.62),DK);
   deck.position.set(0,.163,.02);drone.add(deck);
   const csh=new THREE.Shape();
   csh.moveTo(-.1,0);csh.lineTo(.16,0);csh.lineTo(.08,.075);csh.lineTo(-.06,.075);csh.closePath();
   const cg=new THREE.ExtrudeGeometry(csh,{depth:.17,bevelEnabled:true,
     bevelThickness:.02,bevelSize:.02,bevelSegments:1});
   cg.translate(0,0,-.085);
   const canopy=new THREE.Mesh(cg,GL);canopy.rotation.y=Math.PI/2;
   canopy.position.set(0,.15,-.27);drone.add(canopy);
   const belly=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.7),DK);
   belly.position.set(0,-.115,-.02);drone.add(belly);
   for(let i=0;i<2;i++){const vent=new THREE.Mesh(new THREE.BoxGeometry(.2,.012,.03),DK);
     vent.position.set(0,.168,.22+i*.09);drone.add(vent)}
   const gps=new THREE.Mesh(new THREE.BoxGeometry(.16,.035,.2),SH);
   gps.position.set(0,.175,.36);drone.add(gps);
   const gpsc=new THREE.Mesh(new THREE.BoxGeometry(.1,.012,.14),DK);
   gpsc.position.set(0,.2,.36);drone.add(gpsc)}
  // gimbal z kamerą pod nosem
  const gj=new THREE.Mesh(new THREE.SphereGeometry(.058,16,12),DK);
  gj.position.set(0,-.068,-.44);drone.add(gj);
  const cam=new THREE.Mesh(new THREE.BoxGeometry(.1,.085,.1),DK);
  cam.position.set(0,-.09,-.545);drone.add(cam);
  const lensR=new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,.018,18),ORM);
  lensR.rotation.x=Math.PI/2;lensR.position.set(0,-.09,-.6);drone.add(lensR);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.022,18),GL);
  lens.rotation.x=Math.PI/2;lens.position.set(0,-.09,-.61);drone.add(lens);

  // ramiona (przednie do przodu, tylne do tyłu) + gondole + śmigła
  const props=[];
  const mounts=[
    {mx: .2,mz:-.26, tx: .66,tz:-.6},{mx:-.2,mz:-.26, tx:-.66,tz:-.6},
    {mx:-.2,mz: .28, tx:-.64,tz: .6},{mx: .2,mz: .28, tx: .64,tz: .6}];
  mounts.forEach((m,i)=>{
    const dx=m.tx-m.mx,dz=m.tz-m.mz,len=Math.hypot(dx,dz);
    const g=new THREE.Group();
    g.position.set(m.mx,0,m.mz);
    g.rotation.y=Math.atan2(-dz,dx);
    drone.add(g);
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.024,.036,len,10),SH);
    arm.rotation.z=Math.PI/2;arm.scale.z=.7;arm.position.set(len/2,.028,0);g.add(arm);
    const mount=new THREE.Mesh(new THREE.BoxGeometry(.12,.09,.1),SH);
    mount.position.set(.03,.0,0);g.add(mount);
    // gondola
    const nac=new THREE.Group();nac.position.set(len,.02,0);g.add(nac);
    const pod=new THREE.Mesh(new THREE.CylinderGeometry(.05,.056,.09,16),DK);nac.add(pod);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.05,16,10),SH);
    cap.scale.y=.5;cap.position.y=.045;nac.add(cap);
    const foot=new THREE.Mesh(new THREE.CylinderGeometry(.016,.024,.13,10),DK);
    foot.position.y=-.135;nac.add(foot);
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.012,10),DK);
    pad.position.y=-.2;nac.add(pad);
    // śmigło
    const prop=new THREE.Group();prop.position.y=.07;nac.add(prop);
    [0,Math.PI].forEach(a=>{const hold=new THREE.Group();hold.rotation.y=a;prop.add(hold);
      const bl=new THREE.Mesh(new THREE.BoxGeometry(.4,.009,.05),DK);
      bl.position.x=.23;bl.rotation.x=.22;hold.add(bl)});
    const hub=new THREE.Mesh(new THREE.SphereGeometry(.021,12,8),DK);
    hub.scale.y=.8;prop.add(hub);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(.42,24),
      new THREE.MeshBasicMaterial({color:0xdfe6ec,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
    disc.rotation.x=-Math.PI/2;disc.position.y=.012;prop.add(disc);
    const o={prop,disc,dir:(i%2?1:-1)};
    // światła nawigacyjne: przód L czerwone / P zielone, tył białe strobo
    const front=m.mz<0;
    const led=new THREE.Mesh(new THREE.SphereGeometry(.02,8,8),
      new THREE.MeshBasicMaterial({color:front?(m.mx<0?0xff2a2a:0x2aff6a):0xffffff}));
    led.position.set(len+.046,-.005,0);g.add(led);
    if(!front)o.strobe=led;
    props.push(o)});

  return {droneYaw,drone,props};
};

/* ═════════ MEGAŚWIAT GRUNTU: góry + dolina + SOLAR CITY (ciągły) ═════════ */
MAWORLD.buildGroundWorld=function(THREE,opts){
  const isMobile=opts&&opts.isMobile;
  const G=new THREE.Group();
  const beacons=[],spins=[];
  const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.85,metalness:m??.05});
  const bas=c=>new THREE.MeshBasicMaterial({color:c});
  const GLASS=new THREE.MeshStandardMaterial({color:0x8fc2ba,roughness:.16,metalness:.42});
  const WHITE=std(0xf2f4f1,.6,.08), CREAM=std(0xefe9dc,.7,.05), GREEN=std(0x4d7a45,1);
  const GREEN2=std(0x3c6b35,1), PANEL=std(0x16324f,.35,.5), WOOD=std(0x8a6a44,.9);

  const fbm=makeNoise(11);
  const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};

  /* — TEREN: dolina z miastem, pierścień wzgórz, ściana gór — */
  const CX=0,CZ=-34;
  function height(x,z){
    const d=Math.hypot(x-CX,z-CZ);
    let h=0;
    h+=sm(46,112,d)*(3+9*fbm(x*.02+4,z*.02,4));                 // wzgórza
    const r=1-Math.abs(2*fbm(x*.007+9,z*.007,5)-1);              // granie
    h+=sm(118,262,d)*(26+156*Math.pow(r,1.7)*(.5+.5*fbm(x*.003,z*.003,3)));
    h+=sm(40,80,d)*(4*fbm(x*.06,z*.06,3)-2);                     // mikrorelief
    const rw=Math.max(0,1-Math.max(0,(Math.abs(z+14)-6))/6)*Math.max(0,1-Math.max(0,(Math.abs(x)-44))/10);
    h*=(1-rw);                                                    // korytarz drogi
    h-=2.4*Math.exp(-((x+52)*(x+52)+(z+6)*(z+6))/300);            // niecka jeziora
    return h}
  const slopeAt=(x,z)=>Math.abs(height(x+3,z)-height(x-3,z))+Math.abs(height(x,z+3)-height(x,z-3));
  const TW=760,TD=520,TCZ=-160;
  const SX=isMobile?70:112,SZ=isMobile?52:84;
  const geo=new THREE.PlaneGeometry(TW,TD,SX,SZ);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;
  const colors=new Float32Array(pos.count*3);
  const C={snow:[.93,.95,.97],rock:[.5,.5,.53],scree:[.6,.6,.6],
           forest:[.22,.35,.21],alp:[.4,.5,.35],grass:[.45,.6,.38],pale:[.72,.75,.68]};
  const mix=(A,B,t)=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t];
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i)+TCZ;
    const h=height(x,z),sl=slopeAt(x,z);
    pos.setY(i,h);
    let c;
    if(h>112)c=mix(C.rock,C.snow,Math.min(1,(h-112)/26));
    else if(h>55||sl>7.5)c=mix(C.scree,C.rock,Math.min(1,sl/10));
    else if(h>8)c=mix(C.alp,C.forest,Math.min(1,(h-8)/14));
    else if(h>2)c=mix(C.grass,C.alp,(h-2)/6);
    else c=mix(C.pale,C.grass,Math.max(0,h)/2);
    const j=.94+fbm(x*.25,z*.25,2)*.12;
    colors[i*3]=c[0]*j;colors[i*3+1]=c[1]*j;colors[i*3+2]=c[2]*j}
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();
  const terr=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1}));
  terr.position.z=TCZ;terr.userData.win=false;G.add(terr);

  /* rzeka z gór do jeziora */
  {const steps=60,half0=3.6,half1=2.0;
   const rx=z=>-60+26*Math.sin(z*.012)+14*Math.sin(z*.004+1);
   const arr=new Float32Array(steps*6*3);let k=0;
   const put=(x,y,z)=>{arr[k++]=x;arr[k++]=y;arr[k++]=z};
   for(let s=0;s<steps;s++){
     const z0=-380+ (374)*s/steps, z1=-380+374*(s+1)/steps;
     const x0=rx(z0),x1=rx(z1);
     const y0=height(x0,z0)+.2,y1=height(x1,z1)+.2;
     const hh0=half0+(half1-half0)*s/steps,hh1=half0+(half1-half0)*(s+1)/steps;
     put(x0-hh0,y0,z0);put(x1-hh1,y1,z1);put(x0+hh0,y0,z0);
     put(x0+hh0,y0,z0);put(x1-hh1,y1,z1);put(x1+hh1,y1,z1)}
   const rg=new THREE.BufferGeometry();
   rg.setAttribute('position',new THREE.BufferAttribute(arr,3));
   rg.computeVertexNormals();
   G.add(new THREE.Mesh(rg,std(0x4b86bd,.2,.2)))}
  const lake=new THREE.Mesh(new THREE.CircleGeometry(12.5,26),std(0x4b86bd,.15,.25));
  lake.rotation.x=-Math.PI/2;lake.position.set(-52,.12,-6);G.add(lake);

  /* — LASY: świerki (zbocza) + liściaste (miasto i dachy) — */
  const NP=isMobile?520:1900;
  const pineC=new THREE.InstancedMesh(new THREE.ConeGeometry(.5,1.5,6),
    new THREE.MeshStandardMaterial({roughness:1,flatShading:true}),NP);
  const pineT=new THREE.InstancedMesh(new THREE.CylinderGeometry(.05,.08,.42,5),
    std(0x4c3a29,1),NP);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion();
  const greens=[new THREE.Color(0x2e5230),new THREE.Color(0x3c6b35),new THREE.Color(0x27452a)];
  let pp=0,guard=0;
  while(pp<NP&&guard++<NP*40){
    const x=(Math.random()-.5)*TW*.92,z=TCZ+(Math.random()-.5)*TD*.92;
    const h=height(x,z),d=Math.hypot(x-CX,z-CZ);
    if(h<7||h>58||d<58)continue;
    if(slopeAt(x,z)>5.5)continue;
    const sc=1+Math.random()*1.6;
    M.compose(new THREE.Vector3(x,h+.95*sc,z),Q,new THREE.Vector3(sc,sc,sc));
    pineC.setMatrixAt(pp,M);pineC.setColorAt(pp,greens[pp%3]);
    M.compose(new THREE.Vector3(x,h+.2*sc,z),Q,new THREE.Vector3(sc,sc,sc));
    pineT.setMatrixAt(pp,M);pp++}
  pineC.count=pp;pineT.count=pp;
  if(pineC.instanceColor)pineC.instanceColor.needsUpdate=true;
  pineC.userData.dyn=true;pineT.userData.dyn=true;G.add(pineC,pineT);

  const ND=isMobile?140:340;
  const decid=new THREE.InstancedMesh(new THREE.SphereGeometry(.7,8,7),
    new THREE.MeshStandardMaterial({roughness:1,flatShading:true}),ND);
  const decidT=new THREE.InstancedMesh(new THREE.CylinderGeometry(.06,.09,.8,6),
    std(0x5b4632,1),ND);
  const dgreens=[new THREE.Color(0x4d7a45),new THREE.Color(0x5d8a4a),new THREE.Color(0x6f9a52)];
  let dd=0;const putDecid=(x,y,z,sc)=>{if(dd>=ND)return;
    M.compose(new THREE.Vector3(x,y+1.15*sc,z),Q,new THREE.Vector3(sc,sc*.85,sc));
    decid.setMatrixAt(dd,M);decid.setColorAt(dd,dgreens[dd%3]);
    M.compose(new THREE.Vector3(x,y+.35*sc,z),Q,new THREE.Vector3(sc,sc,sc));
    decidT.setMatrixAt(dd,M);dd++};
  guard=0;
  while(dd<ND*.62&&guard++<ND*40){
    const x=(Math.random()-.5)*150,z=CZ+(Math.random()-.5)*120;
    const d=Math.hypot(x-CX,z-CZ),h=height(x,z);
    if(d<20||d>72||h>5)continue;
    putDecid(x,h,z,.8+Math.random()*.7)}
  decid.userData.dyn=true;decidT.userData.dyn=true;G.add(decid,decidT);

  /* — TURBINY WIATROWE na wzgórzach — */
  [[-118,-150],[112,-160],[-70,-208],[64,-214],[148,-96],[-152,-92]].forEach(([tx,tz])=>{
    const hy=height(tx,tz);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.3,.55,24,8),WHITE);
    pole.position.set(tx,hy+12,tz);G.add(pole);
    const nac=new THREE.Mesh(new THREE.BoxGeometry(1.6,.9,.9),WHITE);
    nac.position.set(tx,hy+24,tz+.2);G.add(nac);
    const rotor=new THREE.Group();rotor.position.set(tx,hy+24,tz+.85);
    rotor.userData.dyn=true;G.add(rotor);spins.push(rotor);
    for(let k=0;k<3;k++){const hold=new THREE.Group();hold.rotation.z=k/3*Math.PI*2;rotor.add(hold);
      const bl=new THREE.Mesh(new THREE.BoxGeometry(.5,8.5,.14),WHITE);
      bl.position.y=4.4;hold.add(bl)}});

  /* — tekstura okien (JEDNA, wspólna; powtórzenia w UV) — */
  const winT=tex(THREE,(x,w,h)=>{
    x.fillStyle='#2a3844';x.fillRect(0,0,w,h);
    const cols=4,rows=4,cw=w/cols,rh=h/rows;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      x.fillStyle=Math.random()<.22?'#ffe1a1':'#3d5468';
      x.fillRect(c*cw+2,r*rh+2,cw-4,rh-4)}},128,128);
  winT.wrapS=winT.wrapT=THREE.RepeatWrapping;
  const WINMAT=new THREE.MeshStandardMaterial({map:winT,roughness:.6,metalness:.15});
  function winBox(w,h,d){ // box z UV przeskalowanym do siatki okien 2.4×3
    const g=new THREE.BoxGeometry(w,h,d);
    const uv=g.attributes.uv;
    // skala UV: X wg szerokości ściany, Y wg wysokości
    for(let i=0;i<uv.count;i++){uv.setXY(i,uv.getX(i)*Math.max(1,Math.round(w/2.6)),uv.getY(i)*Math.max(1,Math.round(h/3)))}
    return g}
  G.userData.winMat=WINMAT;
  // Budynki-kit trafiają do osobnej grupy (dyn=true → pomijana przy merge,
  // chowana gdy załaduje się szczegółowy GLB). bT = aktualny cel dla brył budynków.
  const kitFallback=new THREE.Group();kitFallback.userData.dyn=true;G.add(kitFallback);
  kitFallback.userData.winMat=WINMAT;
  const kitSpots=[];
  let bT=G;   // domyślnie świat; przełączane na kitFallback wokół budynków
  const addWin=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(winBox(w,h,d),WINMAT);
    m.position.set(x,y,z);m.userData.win=true;bT.add(m);return m};

  /* — SOLAR CITY: choreografia wysokości (wysokie z tyłu → niskie przy placu) — */
  function greenTerraces(x,z,w,d,h){
    for(let y=3;y<h-1;y+=3.4){
      const t=new THREE.Mesh(new THREE.BoxGeometry(w+1.3,.34,d+1.3),GREEN);
      t.position.set(x,y,z);bT.add(t)}
    const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.6,.5,d+.6),GREEN2);
    roof.position.set(x,h+.25,z);bT.add(roof);
    putDecid(x-w*.25,h+.4,z,.6);putDecid(x+w*.2,h+.4,z+d*.2,.5)}
  function towerGreen(x,z,w,d,h){
    kitSpots.push({type:h>36?'glass':'setback',x,z,w,d,h});
    addWin(w,h,d,x,h/2,z);greenTerraces(x,z,w,d,h);
    if(h>40){const b=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),bas(0xff3b30));
      b.position.set(x,h+1,z);b.userData.dyn=true;G.add(b);beacons.push(b)}}
  const heroFallback=new THREE.Group();heroFallback.userData.dyn=true;G.add(heroFallback);
  const heroSpots=[];
  function towerCurved(x,z,r,h,kind,s){
    heroSpots.push({x,z,kind:kind||'drop',s:s||1});
    const cyl=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.12,h,16),GLASS.clone());
    cyl.position.set(x,h/2,z);heroFallback.add(cyl);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(r,16,10,0,Math.PI*2,0,Math.PI/2),WHITE.clone());
    cap.position.set(x,h,z);heroFallback.add(cap);
    for(let k=0;k<11;k++){const a=k*.62,vy=1.5+k*(h-3)/11;
      const v=new THREE.Mesh(new THREE.BoxGeometry(.5,h/11,1.1),GREEN.clone());
      v.position.set(x+Math.cos(a)*(r+.1),vy,z+Math.sin(a)*(r+.1));
      v.rotation.y=-a;heroFallback.add(v)}
    const b=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),bas(0xff3b30));
    b.position.set(x,h+r+.6,z);b.userData.dyn=true;heroFallback.add(b);beacons.push(b)}
  function solarRoof(x,z,w,d,y){
    const base=new THREE.Mesh(new THREE.BoxGeometry(w,.16,d),std(0x39434d));
    base.position.set(x,y+.08,z);bT.add(base);
    const pan=new THREE.Mesh(new THREE.BoxGeometry(w*.9,.08,d*.9),PANEL);
    pan.position.set(x,y+.36,z);pan.rotation.x=-.22;bT.add(pan);
  }
  function midStepped(x,z,w,d,h){
    kitSpots.push({type:'mid',x,z,w,d,h});
    let cw=w,cd=d,y0=0;
    [.5,.32,.18].forEach(fr=>{const hh=h*fr;
      addWin(cw,hh,cd,x,y0+hh/2,z);
      const g=new THREE.Mesh(new THREE.BoxGeometry(cw+.8,.3,cd+.8),GREEN);
      g.position.set(x,y0+hh+.15,z);bT.add(g);
      y0+=hh;cw*=.72;cd*=.72});
    solarRoof(x,z,w*.5,d*.5,h+.3)}
  function lowFriendly(x,z,w,d,h,accent){
    kitSpots.push({type:accent===0xd8712f?'low1':'low2',x,z,w,d,h});
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h-1,d),Math.random()<.5?WHITE:CREAM);
    body.position.set(x,1+(h-1)/2,z);bT.add(body);
    // parter podcieniowy
    const inset=new THREE.Mesh(new THREE.BoxGeometry(w-1,1.05,d-1),std(0x39434d));
    inset.position.set(x,.55,z);bT.add(inset);
    for(let k=0;k<=3;k++){const col=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.1,8),WHITE);
      col.position.set(x-w/2+.4+k*(w-.8)/3,.55,z+d/2-.25);bT.add(col)}
    // markiza + balkonowe zielenie + okna pasmowe
    const aw=new THREE.Mesh(new THREE.BoxGeometry(w-.6,.08,1),std(accent,.6));
    aw.position.set(x,1.35,z+d/2+.3);aw.rotation.x=-.28;bT.add(aw);
    for(let fy=2.1;fy<h-.8;fy+=1.5){
      const band=new THREE.Mesh(new THREE.BoxGeometry(w-.5,.7,.06),GLASS);
      band.position.set(x,fy,z+d/2+.04);bT.add(band);
      const green=new THREE.Mesh(new THREE.BoxGeometry(w-.7,.22,.3),GREEN);
      green.position.set(x,fy-.55,z+d/2+.18);bT.add(green)}
    const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.4,.3,d+.4),GREEN);
    roof.position.set(x,h-.35,z);bT.add(roof);
    if(Math.random()<.6)solarRoof(x-w*.15,z,w*.5,d*.5,h-.2);
    else putDecid(x,h-.2,z,.55)}

  // FAR TALLS (tył): 44–68 — wyższe, by tworzyły wyraźną panoramę przed górami
  bT=kitFallback;   // od tego miejsca bryły budynków idą do wymienialnej grupy
  towerGreen(-34,-108,10,10,64); towerCurved(-8,-118,5.5,68,'spiral',1.3);
  towerGreen(22,-104,11,10,54); towerGreen(58,-116,10,11,48);
  towerCurved(-66,-100,4.8,52,'drop',1.2); towerGreen(84,-96,10,10,44);
  towerGreen(-92,-92,9,10,40); towerGreen(102,-110,9,9,38);
  towerGreen(-110,-104,9,9,36);
  heroSpots.push({x:44,z:-88,kind:'drop',s:.9},{x:14,z:-86,kind:'spiral',s:.82});
  {// bliźniaki z mostkiem
   towerGreen(-52,-84,8,8,36); towerGreen(-38,-86,8,8,36);
   const br=new THREE.Mesh(new THREE.BoxGeometry(8,1.6,3),GLASS);
   br.position.set(-45,22,-85);G.add(br)}
  // MID (środek): 12–22 tarasowe + solar
  midStepped(-24,-58,10,9,20); midStepped(4,-64,11,10,22);
  midStepped(30,-56,9,9,16);   midStepped(58,-62,10,9,18);
  midStepped(-54,-60,9,8,14);  midStepped(-78,-52,8,8,12);
  midStepped(82,-50,8,8,13);   midStepped(-8,-46,8,8,12);
  // NEAR (przyjazna dzielnica): 4.5–8.5
  const AC1=0xd8712f,AC2=0x3f8f86;
  lowFriendly(-19,-24,8,7,7,AC1);  lowFriendly(-30,-18,7,6,5.5,AC2);
  lowFriendly(19,-26,8,7,8,AC2);   lowFriendly(30,-16,7,6,6,AC1);
  lowFriendly(-24,4,7,6,6,AC2);    lowFriendly(24,6,7,6,5,AC1);
  lowFriendly(-36,-6,6,6,4.5,AC1); lowFriendly(36,-4,6,6,5.5,AC2);
  lowFriendly(8,-30,7,6,6.5,AC1);  lowFriendly(-8,-30,7,6,7,AC2);
  bT=G;   // koniec budynków-kit — reszta świata znów do G
  // kopuła-pawilon i brama-łuk z pnączem
  {const dome=new THREE.Mesh(new THREE.SphereGeometry(4.6,18,12,0,Math.PI*2,0,Math.PI/2),GLASS);
   dome.position.set(20,0,-18);G.add(dome);
   const blob=new THREE.Mesh(new THREE.SphereGeometry(2.6,10,8),GREEN2);
   blob.scale.y=.8;blob.position.set(20,1.4,-18);G.add(blob);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(4.6,.16,8,24),WHITE);
   ring.rotation.x=Math.PI/2;ring.position.set(20,.1,-18);G.add(ring)}
  {const arch=new THREE.Mesh(new THREE.TorusGeometry(5.6,.42,10,22,Math.PI),WHITE);
   arch.rotation.y=Math.PI/2;arch.position.set(34,0,-14);G.add(arch);
   for(let k=0;k<5;k++){const a=.3+k*.5;
     const vine=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.9),GREEN);
     vine.position.set(34,Math.sin(a)*5.6,-14+Math.cos(a)*5.6);G.add(vine)}}

  /* — ULICA: nawierzchnie, tramwaj bio, trakcja, sygnalizacja, wiata — */
  const sidewalk=new THREE.Mesh(new THREE.PlaneGeometry(150,120),std(0x9aa19f,1));
  sidewalk.rotation.x=-Math.PI/2;sidewalk.position.set(0,-.02,CZ+14);G.add(sidewalk);
  const lot=new THREE.Mesh(new THREE.PlaneGeometry(40,26),std(0x565d61,1));
  lot.rotation.x=-Math.PI/2;lot.position.y=.005;G.add(lot);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(100,8),std(0x3f464c,1));
  road.rotation.x=-Math.PI/2;road.position.set(0,.006,-14);G.add(road);
  const dashM=bas(0xdfe4e8);
  for(let i=0;i<20;i++){const dsh=new THREE.Mesh(new THREE.BoxGeometry(1.5,.012,.13),dashM);
    dsh.position.set(-46+i*4.8,.013,-14);G.add(dsh)}
  for(let i=0;i<7;i++){const zb=new THREE.Mesh(new THREE.BoxGeometry(.55,.014,3.6),dashM);
    zb.position.set(-2.6+i*.9,.014,-14);G.add(zb)}
  // żywopłoty wzdłuż drogi
  [[-27,-9.4],[27,-9.4],[-27,-18.6],[27,-18.6]].forEach(([hx,hz])=>{
    const hedge=new THREE.Mesh(new THREE.BoxGeometry(30,.8,.8),GREEN);
    hedge.position.set(hx,.4,hz);G.add(hedge)});
  // MAGLEV: smukła kapsuła sunąca nad ulicą na uniesionej estakadzie
  const TRAM_Y=6.2;                       // wysokość toru nad placem
  const tram=new THREE.Group();tram.userData.dyn=true;G.add(tram);
  {const wht=std(0xf4f6f7,.35,.25),grn=std(0x5fbf7a,.4,.2),
     glz=std(0x0e1a24,.08,.85),acc=std(0xe8500f,.4,.1),
     glow=new THREE.MeshBasicMaterial({color:0x7fe6ff});
   const L=9.2;
   // kadłub: wygładzony walec z owalnym przekrojem (spłaszczony)
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,L,20,1),wht);
   body.rotation.z=Math.PI/2;body.scale.set(1,1,.72);tram.add(body);
   // nosy stożkowe z obu stron (aerodynamika)
   [-1,1].forEach(e=>{const nose=new THREE.Mesh(new THREE.ConeGeometry(.85,1.7,20),wht);
     nose.rotation.z=-e*Math.PI/2;nose.scale.set(1,1,.72);nose.position.x=e*(L/2+.85);tram.add(nose);
     const eye=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),glow);
     eye.position.set(e*(L/2+1.2),.12,.42);tram.add(eye);
     const eye2=eye.clone();eye2.position.z=-.42;tram.add(eye2)});
   // pasmo okien (ciągła szyba wzdłuż boku)
   [-1,1].forEach(s=>{const win=new THREE.Mesh(new THREE.BoxGeometry(L*.92,.62,.04),glz);
     win.position.set(0,.14,s*.62);tram.add(win)});
   // pomarańczowa linia akcentu + zielony pas dachowy (eco)
   const stripe=new THREE.Mesh(new THREE.BoxGeometry(L*.98,.12,.02),acc);
   stripe.position.set(0,-.28,.62);tram.add(stripe);
   const stripe2=stripe.clone();stripe2.position.z=-.62;tram.add(stripe2);
   const green=new THREE.Mesh(new THREE.BoxGeometry(L*.9,.14,.9),grn);
   green.position.set(0,.66,0);tram.add(green);
   // dolna listwa lewitacji z podświetleniem (maglev glow)
   const skirt=new THREE.Mesh(new THREE.BoxGeometry(L*.96,.16,1.05),glz);
   skirt.position.y=-.66;tram.add(skirt);
   const underglow=new THREE.Mesh(new THREE.BoxGeometry(L*.9,.05,.7),glow);
   underglow.position.y=-.75;tram.add(underglow);
   tram.position.set(-30,TRAM_Y,-14);tram.userData.min=-46;tram.userData.max=46;tram.userData.v=9.5}
  // ESTAKADA: smukły uniesiony tor na eleganckich pylonach w kształcie Y
  {const pyl=std(0xd8dde1,.5,.3),beam=std(0xc4cace,.45,.35),
     rail=new THREE.MeshBasicMaterial({color:0x5fd0e8});
   // ciągła belka toru
   const guide=new THREE.Mesh(new THREE.BoxGeometry(100,.5,1.6),beam);
   guide.position.set(0,TRAM_Y-1.05,-14);G.add(guide);
   const guideTop=new THREE.Mesh(new THREE.BoxGeometry(100,.08,.4),rail);
   guideTop.position.set(0,TRAM_Y-.78,-14);G.add(guideTop);   // świecąca szyna
   // pylony Y co 16 j.
   for(let x=-48;x<=48;x+=16){
     const col=new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,TRAM_Y-1.3,10),pyl);
     col.position.set(x,(TRAM_Y-1.3)/2,-14);G.add(col);
     [-1,1].forEach(s=>{const arm=new THREE.Mesh(new THREE.CylinderGeometry(.1,.16,1.7,8),pyl);
       arm.position.set(x,TRAM_Y-1.5,-14+s*0.0);arm.rotation.x=s*.5;
       arm.position.z=-14+s*.6;G.add(arm)});}}
  {const pM=std(0x2b333c,.6,.3);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,3,8),pM);
   pole.position.set(3.4,1.5,-9.6);G.add(pole);
   const box=new THREE.Mesh(new THREE.BoxGeometry(.26,.72,.2),std(0x14181c,.7));
   box.position.set(3.4,3.06,-9.6);G.add(box);
   [[0xd0342c,.28,1],[0xf2b01e,0,.25],[0x2e9e4f,-.28,.25]].forEach(([c,dy,on])=>{
     const l=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),
       new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:on}));
     l.position.set(3.4,3.06+dy,-9.48);G.add(l)});
   [[-1.6],[1.6]].forEach(([wx])=>{const p2=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.3,8),
     std(0x6d7680,.5,.4));p2.position.set(-8+wx,1.15,-10.2);G.add(p2)});
   const wr=new THREE.Mesh(new THREE.BoxGeometry(4,.1,1.5),GREEN);
   wr.position.set(-8,2.34,-10.2);G.add(wr);
   const bk=new THREE.Mesh(new THREE.BoxGeometry(3.4,.07,1.4),GLASS);
   bk.rotation.x=Math.PI/2;bk.position.set(-8,1.2,-10.9);G.add(bk);
   const bench=new THREE.Mesh(new THREE.BoxGeometry(2.6,.08,.4),WOOD);
   bench.position.set(-8,.55,-10.5);G.add(bench)}

  /* — PLAC: parking, fontanna, wiata solarna, kwiaty — */
  const lineM=bas(0xe8ecef);
  function stall(x,z){const l1=new THREE.Mesh(new THREE.BoxGeometry(.08,.01,2.4),lineM);l1.position.set(x-1.25,.02,z);
    const l2=l1.clone();l2.position.x=x+1.25;const l3=new THREE.Mesh(new THREE.BoxGeometry(2.58,.01,.08),lineM);
    l3.position.set(x,.02,z-1.2);G.add(l1,l2,l3)}
  function car(color,x,z,rot){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;G.add(g);
    const body=std(color,.35,.4),glass=std(0x121a22,.12,.8),dark=std(0x14181c,.8);
    const b=new THREE.Mesh(new THREE.BoxGeometry(1.72,.34,.78),body);b.position.y=.34;g.add(b);
    const hood=new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.74),body);hood.position.set(-.61,.55,0);g.add(hood);
    const cab=new THREE.Mesh(new THREE.BoxGeometry(.86,.3,.72),glass);cab.position.set(.06,.64,0);g.add(cab);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(.9,.05,.76),body);roof.position.set(.06,.815,0);g.add(roof);
    [[-.55,.34],[-.55,-.34],[.55,.34],[.55,-.34]].forEach(([wx,wz])=>{
      const w2=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.1,12),dark);
      w2.rotation.x=Math.PI/2;w2.position.set(wx,.16,wz);g.add(w2)});
    const hl=new THREE.Mesh(new THREE.BoxGeometry(.03,.07,.16),bas(0xfff2c9));
    hl.position.set(-.87,.4,.22);g.add(hl);const hr=hl.clone();hr.position.z=-.22;g.add(hr);
    const tl=new THREE.Mesh(new THREE.BoxGeometry(.03,.06,.5),bas(0xd0342c));
    tl.position.set(.87,.42,0);g.add(tl)}
  const cols=[0xe8eaec,0x30363c,0x5b6670,0x1e3a5c,0xcfd4d8,0x6fae5c];
  [-8.4,-5.6,-2.8,0,2.8,5.6,8.4].forEach(x=>{stall(x,4.2);stall(x,-4.2)});
  car(cols[0],-8.4,4.2,Math.PI/2);car(cols[1],-5.6,4.2,Math.PI/2);
  car(cols[2],5.6,4.2,Math.PI/2); car(cols[3],8.4,4.2,Math.PI/2);
  car(cols[4],-5.6,-4.2,-Math.PI/2);car(cols[5],8.4,-4.2,-Math.PI/2);
  // wiata solarna nad rzędem -4.2
  {for(let k=0;k<4;k++){const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,2.6,8),WHITE);
     post.position.set(-9+k*6,1.3,-5.6);G.add(post)}
   const slab=new THREE.Mesh(new THREE.BoxGeometry(20,.12,3.4),WHITE);
   slab.position.set(-.5,2.7,-4.4);slab.rotation.x=-.16;G.add(slab);
   const pans=new THREE.Mesh(new THREE.BoxGeometry(19.4,.08,3),PANEL);
   pans.position.set(-.5,2.83,-4.35);pans.rotation.x=-.16;G.add(pans)}
  // P-07: proste lądowisko — płaski dysk, cienki świecący pierścień, H, 4 lampki
  {const glow=new THREE.MeshBasicMaterial({color:0x7fe6ff});
   const disc=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.05,.06,28),std(0x333d47,.55,.25));
   disc.position.y=.03;G.add(disc);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(1.55,.05,8,40),bas(0xe8500f));
   ring.rotation.x=-Math.PI/2;ring.position.y=.065;G.add(ring);
   const hM=bas(0xe8ecef);
   const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.015,1.1),hM);h1.position.set(-.34,.068,0);
   const h2=h1.clone();h2.position.x=.34;
   const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.015,.2),hM);h3.position.y=.068;
   G.add(h1,h2,h3);
   for(let k=0;k<4;k++){const a=k/4*Math.PI*2+Math.PI/4;
     const l=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),glow);
     l.position.set(Math.cos(a)*1.85,.09,Math.sin(a)*1.85);G.add(l)}}
  {const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.2,8),std(0x6d7680,.6,.5));
   post.position.set(5.4,1.1,-7.2);G.add(post);
   const pT=tex(THREE,(x,w,h)=>{x.fillStyle='#1a4fa0';x.fillRect(0,0,w,h);
     x.fillStyle='#fff';x.fillRect(w*.30,h*.18,w*.16,h*.64);
     x.fillRect(w*.30,h*.18,w*.42,h*.14);x.fillRect(w*.58,h*.18,w*.14,h*.3);
     x.fillRect(w*.30,h*.42,w*.42,h*.12)},128,128);
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshBasicMaterial({map:pT}));
   sign.position.set(5.4,2.55,-7.15);G.add(sign)}
  // fontanna + rabaty kwiatowe
  {const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2.1,.4,18),WHITE);
   basin.position.set(-15,.2,-4);G.add(basin);
   const water=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,.1,18),std(0x4b86bd,.15,.3));
   water.position.set(-15,.42,-4);G.add(water);
   const jet=new THREE.Mesh(new THREE.ConeGeometry(.22,1.1,8),std(0xdfeaf2,.2,.1));
   jet.position.set(-15,1,-4);G.add(jet)}
  const NF=isMobile?60:150;
  const flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(.14,6,5),
    new THREE.MeshStandardMaterial({roughness:1}),NF);
  const fcols=[new THREE.Color(0xd0537a),new THREE.Color(0xe8a13a),new THREE.Color(0xc94b3c),new THREE.Color(0xeadb6a)];
  for(let k=0;k<NF;k++){
    const ang=Math.random()*7,rr=11+Math.random()*4;
    const fx=Math.cos(ang)*rr,fz=Math.sin(ang)*rr*.7-6;
    M.compose(new THREE.Vector3(fx,.2,fz),Q,new THREE.Vector3(1,1,1));
    flowers.setMatrixAt(k,M);flowers.setColorAt(k,fcols[k%4])}
  flowers.userData.dyn=true;G.add(flowers);
  // latarnie placu
  [[-11.5,1],[11.5,1],[-11.5,-7.5],[11.5,-7.5]].forEach(([lx,lz])=>{
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,3.4,8),std(0x3a444d,.6,.4));
    pole.position.set(lx,1.7,lz);G.add(pole);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),bas(0xfff0cf));
    lamp.position.set(lx-(lx>0?.55:-.55),3.28,lz);G.add(lamp)});
  // drzewa liściaste także wokół placu
  [[-13,7],[13,7],[-17,-12],[17,-12],[0,9]].forEach(([px,pz])=>putDecid(px,0,pz,1+Math.random()*.4));
  if(decid.instanceColor)decid.instanceColor.needsUpdate=true;
  decid.count=dd;decidT.count=dd;

  return {group:G,beacons,tram,spins,heroFallback,heroSpots,kitFallback,kitSpots};
};

/* ═════════ SCALANIE STATYKI → kilka draw calli ═════════ */
/* Scala grupę klonów GLB (budynki/wieże) w kilka meshy — po podpisie materiału.
   Wywoływane po asynchronicznym załadowaniu, gdy mergeStatic już przeszło. */
MAWORLD.mergeGroup=function(THREE,group,root){
  root.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets={};   // sig → {list:[geo], mat}
  const doomed=[];
  group.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh)return;
    const m=Array.isArray(o.material)?o.material[0]:o.material;
    if(!m)return;
    const c=m.color||{r:1,g:1,b:1};
    const trans=m.transparent?1:0;
    // podpis: rodzaj + zaokrąglony kolor + przezroczystość (materiały bez tekstur łączymy)
    const sig=(m.isMeshStandardMaterial?'std':m.isMeshBasicMaterial?'bas':'oth')
      +'|'+trans+'|'+Math.round(c.r*12)+'_'+Math.round(c.g*12)+'_'+Math.round(c.b*12)
      +'|'+((m.roughness??.8).toFixed(1))+'_'+((m.metalness??0).toFixed(1));
    let g;try{g=o.geometry.clone().toNonIndexed();}catch(e){return;}
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));
    if(!g.attributes.normal)g.computeVertexNormals();
    const n=g.attributes.position.count;
    const col=new Float32Array(n*3);
    for(let i=0;i<n;i++){col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));
    // wyczyść zbędne atrybuty (uv/tangenty) by concat nie sypał
    for(const a of Object.keys(g.attributes))if(a!=='position'&&a!=='normal'&&a!=='color')g.deleteAttribute(a);
    if(!buckets[sig])buckets[sig]={list:[],mat:m};
    buckets[sig].list.push(g);
    doomed.push(o);
  });
  doomed.forEach(o=>o.parent&&o.parent.remove(o));
  function concat(list){
    let n=0;list.forEach(g=>n+=g.attributes.position.count);
    const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);
    let off=0;
    list.forEach(g=>{const c=g.attributes.position.count;
      P.set(g.attributes.position.array,off*3);
      N.set(g.attributes.normal.array,off*3);
      C.set(g.attributes.color.array,off*3);off+=c});
    const out=new THREE.BufferGeometry();
    out.setAttribute('position',new THREE.BufferAttribute(P,3));
    out.setAttribute('normal',new THREE.BufferAttribute(N,3));
    out.setAttribute('color',new THREE.BufferAttribute(C,3));
    return out}
  for(const sig in buckets){
    const {list,mat}=buckets[sig];
    const geo=concat(list);
    const nm=new THREE.MeshStandardMaterial({
      vertexColors:true,
      roughness:mat.roughness??.8, metalness:mat.metalness??0});
    const mesh=new THREE.Mesh(geo,nm);
    mesh.userData.merged=true;
    group.add(mesh);
  }
  return group;
};

MAWORLD.mergeStatic=function(THREE,root){
  root.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets={};const doomed=[];
  root.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh)return;
    let p=o;while(p&&p!==root){if(p.userData.dyn)return;p=p.parent}
    if(o.userData.dyn)return;
    const m=o.material;
    if(Array.isArray(m))return;
    let key;
    if(o.userData.win&&m.map)key='win';
    else if(m.map)return;                       // pojedyncze teksturowane (znak) zostają
    else if(m.transparent)key='glass';
    else if(m.isMeshBasicMaterial)key='basic';
    else key='std';
    const g=o.geometry.clone().toNonIndexed();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));
    const n=g.attributes.position.count;
    if(key!=='win'){
      const col=new Float32Array(n*3);
      for(let i=0;i<n;i++){col[i*3]=m.color.r;col[i*3+1]=m.color.g;col[i*3+2]=m.color.b}
      g.setAttribute('color',new THREE.BufferAttribute(col,3));
    }
    (buckets[key]=buckets[key]||[]).push(g);
    doomed.push(o)});
  doomed.forEach(o=>o.parent&&o.parent.remove(o));
  function concat(list,withUV){
    let n=0;list.forEach(g=>n+=g.attributes.position.count);
    const P=new Float32Array(n*3),N=new Float32Array(n*3);
    const C=withUV?null:new Float32Array(n*3);
    const U=withUV?new Float32Array(n*2):null;
    let off=0;
    list.forEach(g=>{
      const c=g.attributes.position.count;
      P.set(g.attributes.position.array,off*3);
      N.set(g.attributes.normal.array,off*3);
      if(C)C.set(g.attributes.color.array,off*3);
      if(U)U.set(g.attributes.uv.array,off*2);
      off+=c});
    const out=new THREE.BufferGeometry();
    out.setAttribute('position',new THREE.BufferAttribute(P,3));
    out.setAttribute('normal',new THREE.BufferAttribute(N,3));
    if(C)out.setAttribute('color',new THREE.BufferAttribute(C,3));
    if(U)out.setAttribute('uv',new THREE.BufferAttribute(U,2));
    return out}
  if(buckets.std)root.add(new THREE.Mesh(concat(buckets.std),
    new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:.08})));
  if(buckets.basic)root.add(new THREE.Mesh(concat(buckets.basic),
    new THREE.MeshBasicMaterial({vertexColors:true})));
  if(buckets.glass){const gm=new THREE.Mesh(concat(buckets.glass),
    new THREE.MeshStandardMaterial({vertexColors:true,roughness:.18,metalness:.45}));
    root.add(gm)}
  if(buckets.win){const first=root.userData.winMat;
    root.add(new THREE.Mesh(concat(buckets.win,true),first))}
};
if(typeof module!=='undefined')module.exports=MAWORLD;
root.MAWORLD=MAWORLD;
})(typeof window!=='undefined'?window:globalThis);
