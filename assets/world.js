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

  // korpus: górna skorupa + ciemny brzuch + linia podziału
  const shell=new THREE.Mesh(new THREE.SphereGeometry(.5,36,22),SH);
  shell.scale.set(.5,.27,1.02);drone.add(shell);
  const belly=new THREE.Mesh(new THREE.SphereGeometry(.5,32,18),DK);
  belly.scale.set(.44,.15,.9);belly.position.y=-.04;drone.add(belly);
  const seam=new THREE.Mesh(new THREE.SphereGeometry(.5,32,10),DK);
  seam.scale.set(.505,.03,1.028);seam.position.y=-.012;drone.add(seam);
  // kokpit-czujnik (przód = -Z)
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(.5,28,16),GL);
  canopy.scale.set(.27,.1,.3);canopy.position.set(0,.13,-.29);drone.add(canopy);
  // grzbietowy pasek + dyskretny GPS
  const stripe=new THREE.Mesh(new THREE.SphereGeometry(.5,24,10),DK);
  stripe.scale.set(.06,.022,.66);stripe.position.set(0,.2,.1);drone.add(stripe);
  const gps=new THREE.Mesh(new THREE.SphereGeometry(.5,20,12),SH);
  gps.scale.set(.11,.04,.15);gps.position.set(0,.2,.4);drone.add(gps);
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
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.024,.036,len,12),SH);
    arm.rotation.z=Math.PI/2;arm.position.set(len/2,.028,0);g.add(arm);
    // gondola
    const nac=new THREE.Group();nac.position.set(len,.02,0);g.add(nac);
    const pod=new THREE.Mesh(new THREE.CylinderGeometry(.05,.056,.09,16),DK);nac.add(pod);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.05,16,10),SH);
    cap.scale.y=.5;cap.position.y=.045;nac.add(cap);
    const foot=new THREE.Mesh(new THREE.CylinderGeometry(.017,.025,.09,10),DK);
    foot.position.y=-.115;nac.add(foot);
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

/* ═════════ TEREN GÓRSKI: doliny, las, rzeka ═════════ */
MAWORLD.buildTerrain=function(THREE,opts){
  const isMobile=opts&&opts.isMobile;
  const G=new THREE.Group();
  const fbm=makeNoise(7);
  const W=280,D=140,SX=isMobile?90:150,SZ=isMobile?46:76; // wymiary i siatka
  const Z0=-128,Z1=12;

  function height(x,z){
    const n=fbm(x*.012+3,z*.012,5);           // 0..1
    let h=Math.pow(n,1.5)*17.5;               // grzbiety
    h-=10.5*Math.exp(-Math.pow(x/24,2));      // GŁÓWNA DOLINA wzdłuż osi Z
    h-=4.2*Math.exp(-Math.pow((x-62)/16,2));  // dolina boczna
    h+=2.2*fbm(x*.05,z*.05,3)-1.1;            // drobna rzeźba
    const edge=Math.min(1,Math.max(0,(z-Z0)/14))*Math.min(1,Math.max(0,(Z1-z)/10));
    return h*Math.pow(edge,.6)-.4}
  const riverX=z=>4.5*Math.sin(z*.045)+3*Math.sin(z*.013+2);

  // siatka terenu z kolorami wierzchołków
  const geo=new THREE.PlaneGeometry(W,D,SX,SZ);
  geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;
  const colors=new Float32Array(pos.count*3);
  const C={snow:[.93,.95,.97],rock:[.52,.53,.55],alp:[.42,.5,.36],
           forest:[.24,.36,.22],grass:[.4,.55,.33],bank:[.5,.52,.4]};
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i)+ (Z0+Z1)/2 - 0; // plane centr 0 → przesuniemy grupą
    const h=height(x,z);
    pos.setY(i,h);
    let c;
    if(h>11.5)c=mix(C.rock,C.snow,Math.min(1,(h-11.5)/2.2));
    else if(h>7.5)c=mix(C.alp,C.rock,(h-7.5)/4);
    else if(h>1.2)c=mix(C.grass,C.forest,Math.min(1,(h-1.2)/2.2));
    else c=mix(C.bank,C.grass,Math.max(0,h+.5)/1.7);
    const j=.94+fbm(x*.3,z*.3,2)*.12;         // delikatny jitter low-poly
    colors[i*3]=c[0]*j;colors[i*3+1]=c[1]*j;colors[i*3+2]=c[2]*j}
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();
  const terr=new THREE.Mesh(geo,new THREE.MeshStandardMaterial(
    {vertexColors:true,flatShading:true,roughness:1,metalness:0}));
  terr.position.z=(Z0+Z1)/2;
  G.add(terr);

  // RZEKA: wstęga wzdłuż dna doliny
  {const pts=[],half=2.2,steps=46;
   const posR=[];
   for(let s=0;s<=steps;s++){const z=Z0+8+(Z1-14-Z0-8)*s/steps,x=riverX(z);
     const y=height(x,z)+.18;
     posR.push([x,y,z])}
   const rg=new THREE.BufferGeometry();
   const arr=new Float32Array(steps*2*3*3);let k=0;
   const put=(x,y,z)=>{arr[k++]=x;arr[k++]=y;arr[k++]=z};
   for(let s=0;s<steps;s++){
     const[ax,ay,az]=posR[s],[bx,by,bz]=posR[s+1];
     put(ax-half,ay,az);put(bx-half,by,bz);put(ax+half,ay,az);
     put(ax+half,ay,az);put(bx-half,by,bz);put(bx+half,by,bz)}
   rg.setAttribute('position',new THREE.BufferAttribute(arr,3));
   rg.computeVertexNormals();
   const river=new THREE.Mesh(rg,new THREE.MeshStandardMaterial(
     {color:0x4b86bd,roughness:.22,metalness:.15}));
   G.add(river)}

  // LAS: instancjonowane świerki (korony + pnie), 3 odcienie zieleni
  const N=isMobile?340:1150;
  const crownG=new THREE.ConeGeometry(.5,1.5,6);
  const trunkG=new THREE.CylinderGeometry(.05,.08,.42,5);
  const crowns=new THREE.InstancedMesh(crownG,
    new THREE.MeshStandardMaterial({roughness:1,flatShading:true}),N);
  const trunks=new THREE.InstancedMesh(trunkG,
    new THREE.MeshStandardMaterial({color:0x4c3a29,roughness:1}),N);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(),P=new THREE.Vector3();
  const greens=[new THREE.Color(0x2e5230),new THREE.Color(0x3c6b35),new THREE.Color(0x27452a)];
  let placed=0,guard=0;
  while(placed<N&&guard++<N*30){
    const x=(Math.random()-.5)*W*.94, z=Z0+6+Math.random()*(Z1-Z0-16);
    const h=height(x,z);
    const inValley=h<.7;
    if(h>9)continue;
    if(inValley&&(h<-3.8||Math.random()<.8))continue;   // rzadkie kępy na dnie doliny
    if(Math.abs(x-riverX(z))<3.2)continue;                       // nie w rzece
    const slope=Math.abs(height(x+2,z)-h)+Math.abs(height(x,z+2)-h);
    if(slope>2.4)continue;
    const sc=.85+Math.random()*.9;
    P.set(x,h,z);S.setScalar(sc);Q.identity();
    M.compose(new THREE.Vector3(x,h+ .95*sc,z),Q,new THREE.Vector3(sc,sc,sc));
    crowns.setMatrixAt(placed,M);
    crowns.setColorAt(placed,greens[placed%3]);
    M.compose(new THREE.Vector3(x,h+.2*sc,z),Q,new THREE.Vector3(sc,sc,sc));
    trunks.setMatrixAt(placed,M);
    placed++}
  crowns.count=placed;trunks.count=placed;
  if(crowns.instanceColor)crowns.instanceColor.needsUpdate=true;
  G.add(crowns,trunks);
  return G;
};

/* ═════════ MIASTO NA GRUNCIE + TRAMWAJ ═════════ */
MAWORLD.buildCityGround=function(THREE,opts){
  const isMobile=opts&&opts.isMobile;
  const G=new THREE.Group();
  const beacons=[];
  const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.85,metalness:m??.05});
  const bas=c=>new THREE.MeshBasicMaterial({color:c});

  /* — nawierzchnie — */
  const sidewalk=new THREE.Mesh(new THREE.PlaneGeometry(300,240),std(0x8d949a,1));
  sidewalk.rotation.x=-Math.PI/2;sidewalk.position.y=-.02;G.add(sidewalk);
  const lot=new THREE.Mesh(new THREE.PlaneGeometry(46,32),std(0x474e55,1));
  lot.rotation.x=-Math.PI/2;G.add(lot);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(280,9),std(0x3a4147,1));
  road.rotation.x=-Math.PI/2;road.position.set(0,.005,-14);G.add(road);
  const dashM=bas(0xdfe4e8);
  for(let i=0;i<30;i++){const d=new THREE.Mesh(new THREE.BoxGeometry(1.6,.012,.14),dashM);
    d.position.set(-66+i*4.6,.012,-14);G.add(d)}
  for(let i=0;i<7;i++){const z=new THREE.Mesh(new THREE.BoxGeometry(.55,.013,4),dashM);
    z.position.set(-2.6+i*.9,.013,-14);G.add(z)}
  const curbM=std(0xb9bfc5,.9);
  [[0,-16.2,46.6,.5],[0,16.2,46.6,.5],[-23.2,0,.5,32.6],[23.2,0,.5,32.6]].forEach(([cx,cz,w,d])=>{
    const c=new THREE.Mesh(new THREE.BoxGeometry(w,.14,d),curbM);
    c.position.set(cx,.07,cz);G.add(c)});

  /* — tekstury okien — */
  const winTex=variant=>tex(THREE,(x,w,h)=>{
    x.fillStyle=variant==='glass'?'#39566e':'#242e38';x.fillRect(0,0,w,h);
    const cols=6,rows=16,cw=w/cols,rh=h/rows;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const lit=Math.random()<(variant==='glass'?.16:.3);
      x.fillStyle=lit?'#ffd98a':(variant==='glass'?'#4d708c':'#333e4a');
      x.fillRect(c*cw+2.5,r*rh+2.5,cw-5,rh-5)}},128,384);

  function roofKit(x,z,w,d,h){
    const parap=new THREE.Mesh(new THREE.BoxGeometry(w+.3,.5,d+.3),std(0x39434d,.9));
    parap.position.set(x,h+.25,z);G.add(parap);
    for(let k=0,n=1+Math.floor(Math.random()*3);k<n;k++){
      const ac=new THREE.Mesh(new THREE.BoxGeometry(.9+Math.random(),.7,1),std(0x9aa3ab,.8));
      ac.position.set(x+(Math.random()-.5)*w*.5,h+.85,z+(Math.random()-.5)*d*.5);G.add(ac)}
    if(Math.random()<.45){
      const tank=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,1.3,10),std(0x6d7680,.8));
      tank.position.set(x-w*.24,h+1.15,z+d*.2);G.add(tank)}
    if(h>34){
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,2.6,6),std(0x39434d));
      mast.position.set(x,h+1.8,z);G.add(mast);
      const b=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),bas(0xff3b30));
      b.position.set(x,h+3.2,z);G.add(b);beacons.push(b)}}

  function sideMat(variant,w,h){
    const m=std(0xffffff,.7,.12);m.map=winTex(variant);
    m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;
    m.map.repeat.set(Math.max(1,Math.round(w/2.6)),Math.max(2,Math.round(h/6)));
    return m}
  function boxTower(x,z,w,d,h,variant){
    const side=sideMat(variant,w,h),top=std(0x2c3742,.9);
    const tw=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[side,side,top,top,side,side]);
    tw.position.set(x,h/2,z);G.add(tw);roofKit(x,z,w,d,h);return tw}
  function steppedTower(x,z,w,d,h){
    let cw=w,cd=d,base=0;
    [.52,.3,.18].forEach(fr=>{const hh=h*fr;
      boxTowerNo(x,z,cw,cd,hh,base);base+=hh;cw*=.74;cd*=.74});
    roofKit(x,z,w*.55,d*.55,h);
    function boxTowerNo(x,z,w,d,hh,y0){
      const side=sideMat('concrete',w,hh);
      const tw=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),
        [side,side,std(0x2c3742,.9),std(0x2c3742,.9),side,side]);
      tw.position.set(x,y0+hh/2,z);G.add(tw)}}
  function cylTower(x,z,r,h){
    const side=sideMat('glass',2*Math.PI*r,h);
    const tw=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18,1,false),side);
    tw.position.set(x,h/2,z);G.add(tw);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(r+.2,r+.2,.5,18),std(0x39434d));
    cap.position.set(x,h+.25,z);G.add(cap);
    if(h>30){const b=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),bas(0xff3b30));
      b.position.set(x,h+1.2,z);G.add(b);beacons.push(b)}}
  function spire(x,z,w,h){
    boxTower(x,z,w,w,h*.72,'glass');
    const t=new THREE.Mesh(new THREE.CylinderGeometry(.2,w*.42,h*.28,8),std(0xcfd6dc,.5,.3));
    t.position.set(x,h*.72+h*.14,z);G.add(t);
    const ant=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,4,6),std(0x39434d));
    ant.position.set(x,h+2,z);G.add(ant);
    const b=new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),bas(0xff3b30));
    b.position.set(x,h+4.1,z);G.add(b);beacons.push(b)}

  /* pierścień kanionu — zróżnicowane typologie, korytarz wolny */
  boxTower(-16,-8, 9,9,42,'concrete');  cylTower(16,-7,4.4,36);
  steppedTower(-15,-21,10,9,30);        spire(18,-20,8,48);
  boxTower(-28,-4,10,12,25,'glass');    boxTower(28,-6,11,10,33,'concrete');
  boxTower(-17,-35,12,10,28,'glass');   steppedTower(15,-36,11,11,40);
  cylTower(0,-39,5,23);
  boxTower(-33,-24,9,9,20,'concrete');  boxTower(32,-26,10,9,26,'glass');
  boxTower(-46,-12,10,10,16,'concrete');boxTower(47,-14,10,10,19,'glass');
  if(!isMobile){steppedTower(-31,-42,10,10,22);boxTower(30,-44,9,11,18,'concrete');
    cylTower(-48,-34,4,14);boxTower(47,-36,9,9,15,'glass')}
  // dalsze pierzeje: proste, zamglone bloki (uziemione)
  const farM=std(0x9db4c6,1);
  const FR=isMobile?16:34;
  for(let i=0;i<FR;i++){
    const x=-80+Math.random()*160, z=-62-Math.random()*55;
    if(Math.abs(x)<10&&z>-70)continue;
    const w=5+Math.random()*8,h=7+Math.random()*16;
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),farM);
    b.position.set(x,h/2,z);G.add(b)}

  /* — billboard na jednej z wież — */
  {const bT=tex(THREE,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,0);
     g.addColorStop(0,'#e8500f');g.addColorStop(1,'#ff8a3d');
     x.fillStyle=g;x.fillRect(0,0,w,h);
     x.fillStyle='#fff';x.fillRect(w*.08,h*.4,w*.5,h*.16)},256,128);
   const bb=new THREE.Mesh(new THREE.PlaneGeometry(6,3),
     new THREE.MeshBasicMaterial({map:bT}));
   bb.position.set(-16,26,-3.4);G.add(bb);
   const bf=new THREE.Mesh(new THREE.BoxGeometry(6.4,3.4,.2),std(0x2c3742));
   bf.position.set(-16,26,-3.55);G.add(bf)}

  /* — TRAMWAJ: 3 człony, pantograf, trakcja — */
  const tram=new THREE.Group();G.add(tram);
  {const red=std(0xb5231f,.45,.2),wht=std(0xe8eaec,.5,.1),
     glz=std(0x121a22,.15,.7),drk=std(0x14181c,.8);
   const segL=3.1,gap=.16;
   for(let s=-1;s<=1;s++){
     const seg=new THREE.Group();seg.position.x=s*(segL+gap);tram.add(seg);
     const low=new THREE.Mesh(new THREE.BoxGeometry(segL,.5,1.05),red);
     low.position.y=.55;seg.add(low);
     const band=new THREE.Mesh(new THREE.BoxGeometry(segL,.42,1.02),glz);
     band.position.y=1.0;seg.add(band);
     const upr=new THREE.Mesh(new THREE.BoxGeometry(segL,.22,1.05),wht);
     upr.position.y=1.32;seg.add(upr);
     const roof=new THREE.Mesh(new THREE.BoxGeometry(segL*.96,.1,.9),std(0x9aa3ab,.6));
     roof.position.y=1.48;seg.add(roof);
     const bogie=new THREE.Mesh(new THREE.BoxGeometry(segL*.5,.3,.8),drk);
     bogie.position.y=.18;seg.add(bogie);
     if(s!==1){const bell=new THREE.Mesh(new THREE.BoxGeometry(gap+.24,.9,.9),drk);
       bell.position.set(s*(segL+gap)+ (segL+gap)/2,1,0);tram.add(bell)}
     for(let d=-1;d<=1;d+=2){ // drzwi
       const door=new THREE.Mesh(new THREE.BoxGeometry(.66,.86,.02),std(0x8f1b18,.5));
       door.position.set(d*segL*.22,.82,.53);seg.add(door)}}
   // czoła
   [-1,1].forEach(e=>{
     const nose=new THREE.Mesh(new THREE.BoxGeometry(.5,.9,.98),red);
     nose.position.set(e*(1.5*(segL+gap)+ .2),.86,0);nose.rotation.z=-e*.16;tram.add(nose);
     const shield=new THREE.Mesh(new THREE.BoxGeometry(.1,.5,.9),glz);
     shield.position.set(e*(1.5*(segL+gap)+.42),1.12,0);shield.rotation.z=-e*.16;tram.add(shield);
     const lamp=new THREE.Mesh(new THREE.BoxGeometry(.06,.09,.2),bas(0xfff2c9));
     lamp.position.set(e*(1.5*(segL+gap)+.46),.62,.28);tram.add(lamp);
     const lamp2=lamp.clone();lamp2.position.z=-.28;tram.add(lamp2)});
   // pantograf (środkowy człon)
   const pm=std(0x2b333c,.5,.4);
   [-1,1].forEach(k=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.1,6),pm);
     a.position.set(k*.28,2.0,0);a.rotation.z=k*.55;tram.add(a)});
   const pTop=new THREE.Mesh(new THREE.BoxGeometry(.9,.03,.08),pm);
   pTop.position.set(0,2.48,0);tram.add(pTop);
   tram.position.set(-40,0,-14);tram.userData={min:-70,max:70,v:4.4}}

  /* trakcja: słupy + lina nośna */
  {const pM=std(0x39434d,.6,.3);
   for(let x=-64;x<=64;x+=16){
     const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,4.4,8),pM);
     pole.position.set(x,2.2,-19);G.add(pole);
     const arm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,5.4,6),pM);
     arm.rotation.x=Math.PI/2;arm.position.set(x,4.15,-16.4);G.add(arm)}
   const wire=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,132,6),std(0x20262c,.4,.6));
   wire.rotation.z=Math.PI/2;wire.position.set(0,2.62,-14);G.add(wire)}

  /* sygnalizacja + wiata + hydrant */
  {const pM=std(0x2b333c,.6,.3);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,3,8),pM);
   pole.position.set(3.4,1.5,-9.6);G.add(pole);
   const box=new THREE.Mesh(new THREE.BoxGeometry(.26,.72,.2),std(0x14181c,.7));
   box.position.set(3.4,3.06,-9.6);G.add(box);
   [[0xd0342c,.28,1],[0xf2b01e,.0,0.25],[0x2e9e4f,-.28,0.25]].forEach(([c,dy,on])=>{
     const l=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),
       new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:on}));
     l.position.set(3.4,3.06+dy,-9.48);G.add(l)});
   // wiata przystanku
   const wpM=std(0x6d7680,.5,.4);
   [[-1.6],[1.6]].forEach(([wx])=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.3,8),wpM);
     p.position.set(-8+wx,1.15,-10.2);G.add(p)});
   const wr=new THREE.Mesh(new THREE.BoxGeometry(4,.08,1.5),
     new THREE.MeshStandardMaterial({color:0x9fc2d8,roughness:.15,metalness:.4,transparent:true,opacity:.65}));
   wr.position.set(-8,2.32,-10.2);wr.rotation.x=.06;G.add(wr);
   const bk=new THREE.Mesh(new THREE.BoxGeometry(3.4,.07,1.5),
     new THREE.MeshStandardMaterial({color:0x9fc2d8,roughness:.15,metalness:.4,transparent:true,opacity:.5}));
   bk.rotation.x=Math.PI/2;bk.position.set(-8,1.2,-10.94);G.add(bk);
   const bench=new THREE.Mesh(new THREE.BoxGeometry(2.6,.08,.4),std(0x7a5c3a,.9));
   bench.position.set(-8,.55,-10.5);G.add(bench);
   const hyd=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.5,10),std(0xc03028,.5));
   hyd.position.set(-4.5,.25,-8.9);G.add(hyd)}

  /* — parking na dziedzińcu — */
  const lineM=bas(0xe8ecef);
  function stall(x,z){const l1=new THREE.Mesh(new THREE.BoxGeometry(.08,.01,2.4),lineM);l1.position.set(x-1.25,.012,z);
    const l2=l1.clone();l2.position.x=x+1.25;const l3=new THREE.Mesh(new THREE.BoxGeometry(2.58,.01,.08),lineM);
    l3.position.set(x,.012,z-1.2);G.add(l1,l2,l3)}
  function car(color,x,z,rot){
    const g=new THREE.Group();
    const body=std(color,.35,.4),glass=std(0x121a22,.12,.8),dark=std(0x14181c,.8);
    const b=new THREE.Mesh(new THREE.BoxGeometry(1.72,.34,.78),body);b.position.y=.34;g.add(b);
    const hood=new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.74),body);hood.position.set(-.61,.55,0);g.add(hood);
    const cab=new THREE.Mesh(new THREE.BoxGeometry(.86,.3,.72),glass);cab.position.set(.06,.64,0);g.add(cab);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(.9,.05,.76),body);roof.position.set(.06,.815,0);g.add(roof);
    const mirL=new THREE.Mesh(new THREE.BoxGeometry(.1,.05,.05),body);mirL.position.set(-.28,.62,.42);g.add(mirL);
    const mirR=mirL.clone();mirR.position.z=-.42;g.add(mirR);
    [[-.55,.34],[-.55,-.34],[.55,.34],[.55,-.34]].forEach(([wx,wz])=>{
      const w=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.1,14),dark);
      w.rotation.x=Math.PI/2;w.position.set(wx,.16,wz);g.add(w);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.11,10),std(0x9aa3ab,.3,.7));
      hub.rotation.x=Math.PI/2;hub.position.set(wx,.16,wz);g.add(hub)});
    const hl=new THREE.Mesh(new THREE.BoxGeometry(.03,.07,.16),bas(0xfff2c9));
    hl.position.set(-.87,.4,.22);g.add(hl);const hr=hl.clone();hr.position.z=-.22;g.add(hr);
    const tl=new THREE.Mesh(new THREE.BoxGeometry(.03,.06,.5),bas(0xd0342c));
    tl.position.set(.87,.42,0);g.add(tl);
    g.position.set(x,0,z);g.rotation.y=rot;G.add(g)}
  const cols=[0xe8eaec,0x15181c,0x5b6670,0x7a1f1f,0x1e3a5c,0xcfd4d8];
  [-8.4,-5.6,-2.8,0,2.8,5.6,8.4].forEach(x=>{stall(x,4.2);stall(x,-4.2)});
  car(cols[0],-8.4,4.2,Math.PI/2);car(cols[1],-5.6,4.2,Math.PI/2);car(cols[2],-2.8,4.2,Math.PI/2);
  car(cols[3],5.6,4.2,Math.PI/2);car(cols[4],8.4,4.2,Math.PI/2);
  car(cols[5],-5.6,-4.2,-Math.PI/2);car(cols[1],2.8,-4.2,-Math.PI/2);car(cols[0],8.4,-4.2,-Math.PI/2);
  car(cols[2],-30,-12.6,0);car(cols[4],26,-15.4,Math.PI);
  // P-07
  const ringP=new THREE.Mesh(new THREE.TorusGeometry(1.35,.045,10,48),bas(0xe8500f));
  ringP.rotation.x=-Math.PI/2;ringP.position.y=.015;G.add(ringP);
  const hM=bas(0xe8ecef);
  const h1=new THREE.Mesh(new THREE.BoxGeometry(.16,.012,1),hM);h1.position.set(-.3,.016,0);
  const h2=h1.clone();h2.position.x=.3;
  const h3=new THREE.Mesh(new THREE.BoxGeometry(.46,.012,.16),hM);h3.position.y=.016;
  G.add(h1,h2,h3);
  // znak P + strzałka
  {const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.2,8),std(0x6d7680,.6,.5));
   post.position.set(5.4,1.1,-7.2);G.add(post);
   const pT=tex(THREE,(x,w,h)=>{x.fillStyle='#1a4fa0';x.fillRect(0,0,w,h);
     x.fillStyle='#fff';x.fillRect(w*.30,h*.18,w*.16,h*.64);
     x.fillRect(w*.30,h*.18,w*.42,h*.14);x.fillRect(w*.58,h*.18,w*.14,h*.3);
     x.fillRect(w*.30,h*.42,w*.42,h*.12)},128,128);
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshBasicMaterial({map:pT}));
   sign.position.set(5.4,2.55,-7.15);G.add(sign)}
  {const sh=new THREE.Shape();sh.moveTo(0,.9);sh.lineTo(.5,.1);sh.lineTo(.2,.1);sh.lineTo(.2,-.9);
   sh.lineTo(-.2,-.9);sh.lineTo(-.2,.1);sh.lineTo(-.5,.1);sh.closePath();
   const arr=new THREE.Mesh(new THREE.ShapeGeometry(sh),hM);
   arr.rotation.x=-Math.PI/2;arr.position.set(0,.014,-6.4);G.add(arr)}
  // latarnie + drzewa w donicach
  [[-11.5,1],[11.5,1],[-11.5,-7.5],[11.5,-7.5]].forEach(([lx,lz])=>{
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,3.4,10),std(0x3a444d,.6,.4));
    pole.position.set(lx,1.7,lz);G.add(pole);
    const armL=new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.06),pole.material);
    armL.position.set(lx-(lx>0?.45:-.45),3.35,lz);G.add(armL);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),bas(0xfff0cf));
    lamp.position.set(lx-(lx>0?.85:-.85),3.3,lz);G.add(lamp)});
  for(let i=0;i<6;i++){
    const tx=-13+i*5.2,tz=-8.6;
    const pot=new THREE.Mesh(new THREE.BoxGeometry(.9,.4,.9),std(0x8b9298,1));
    pot.position.set(tx,.2,tz);G.add(pot);
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.9,8),std(0x5b4632,1));
    trunk.position.set(tx,.85,tz);G.add(trunk);
    const crown=new THREE.Mesh(new THREE.SphereGeometry(.7,12,10),std(0x4d7a45,1));
    crown.scale.y=.85;crown.position.set(tx,1.7,tz);G.add(crown)}

  return {group:G,beacons,tram:G.children.includes(tram)?tram:tram};
};

if(typeof module!=='undefined')module.exports=MAWORLD;
root.MAWORLD=MAWORLD;
})(typeof window!=='undefined'?window:globalThis);
