/* MA//BIOME:CIRCUIT → KOPALNIA KRYSZTAŁÓW (ELEKTRONIKA)
   Pionowy zjazd szybem: wejście jaskini u góry (światło dnia), im głębiej tym
   surowce RZADSZE ale okazalsze. Drewniane obudowy, latarnie, kładka linowa,
   wagoniki na torach, grzyby, jeziorko na dnie. Wg referencji low-poly mine. */
(function(root){
'use strict';
const H_SHAFT=150;            // wysokość szybu (zjazd całości)
root.MABIOME_CIRCUIT={
  MAXALT:140,
  FOG_STOPS:[[0,0x241309],[.18,0x1d1010],[.42,0x170c15],[.68,0x120a18],[1,0x0c0713]],
  SUN:{col:0xffd9a8,int:.5},              // poświata wejścia (z góry)
  HEMI:{sky:0x6a4a3a,ground:0x140a12,int:.55},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m,e,ei)=>{const M=new THREE.MeshStandardMaterial({color:c,roughness:r??.85,metalness:m??0});
      if(e){M.emissive=new THREE.Color(e);M.emissiveIntensity=ei??.7}return M};
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    let sd=5;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};

    /* materiały skały (warstwy głębokości) i drewna */
    const ROCK_T=std(0x8a5a3e,.95), ROCK_T2=std(0x9a6a48,.95);       // góra: ciepły brąz
    const ROCK_M=std(0x6a4238,.95), ROCK_M2=std(0x74463e,.95);       // środek
    const ROCK_D=std(0x4a2e3a,.95), ROCK_D2=std(0x3e2734,.95);       // dno: fiolet-brąz
    const WOOD=std(0x8a5a30,.85), WOOD2=std(0x74491f,.85);
    const DIRT=std(0x6a4c38,.95);
    const IRON=std(0x3a3f46,.6,.5);
    const MUSH=std(0xd8c9b2,.8), MUSH_C=std(0xc97a4e,.8);

    /* nieregularna bryła skalna (nawisy, głazy, rdzenie półek) */
    function rockChunk(mat,s){
      const g=new THREE.IcosahedronGeometry(1,0);
      const P=g.attributes.position;
      for(let i=0;i<P.count;i++){
        P.setXYZ(i,P.getX(i)*(0.7+rnd()*.6),P.getY(i)*(0.6+rnd()*.5),P.getZ(i)*(0.7+rnd()*.6))}
      g.computeVertexNormals();
      const m=new THREE.Mesh(g,mat);m.scale.setScalar(s);return m}

    /* ── KORPUS SZYBU: fasetowany walec z displacementem (jak w ref) ── */
    const RADIUS=46;
    {const wg=new THREE.CylinderGeometry(RADIUS,RADIUS+6,H_SHAFT+26,20,13,true);
     const P=wg.attributes.position;
     const cols=new Float32Array(P.count*3);
     const cTop=new THREE.Color(0x9a6a48), cMid=new THREE.Color(0x6a4238), cBot=new THREE.Color(0x3e2734);
     for(let i=0;i<P.count;i++){
       const x=P.getX(i),y=P.getY(i),z=P.getZ(i);
       const r=Math.hypot(x,z);
       const push=(rnd()-.5)*9;
       P.setX(i,x/r*(r+push));P.setZ(i,z/r*(r+push));
       P.setY(i,y+(rnd()-.5)*3);
       const t=(y+ (H_SHAFT+26)/2)/(H_SHAFT+26);   // 0 dno → 1 góra
       const c=t>.6?cTop.clone().lerp(cMid,(1-t)/.4):cMid.clone().lerp(cBot,1-(t/.6));
       cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b}
     wg.setAttribute('color',new THREE.BufferAttribute(cols,3));
     wg.computeVertexNormals();
     const wall=new THREE.Mesh(wg,new THREE.MeshStandardMaterial({
       vertexColors:true,roughness:.95,side:THREE.BackSide,flatShading:true}));
     wall.position.y=(H_SHAFT+26)/2-10;
     wall.userData.dyn=true;                    // pomija merge (zachowuje vertex-colors)
     G.add(wall)}
    /* stalaktyty z krawędzi nawisu */
    for(let k=0;k<12;k++){const a=rnd()*Math.PI*2, r=26+rnd()*10;
      const st=new THREE.Mesh(new THREE.ConeGeometry(1+rnd()*1.2,4+rnd()*5,5),k%2?ROCK_T:ROCK_M);
      st.rotation.x=Math.PI;st.position.set(Math.cos(a)*r,H_SHAFT+2-2,Math.sin(a)*r);G.add(st)}

    /* strop przy wejściu (nawis) + otwór nieba */
    for(let k=0;k<10;k++){const a=k/10*Math.PI*2;
      const ch=rockChunk(ROCK_T,12+rnd()*6);
      ch.position.set(Math.cos(a)*34,H_SHAFT+6,Math.sin(a)*34);G.add(ch)}
    const skyDisc=new THREE.Mesh(new THREE.CircleGeometry(26,20),bas(0xffe2b0));
    skyDisc.rotation.x=Math.PI/2;skyDisc.position.y=H_SHAFT+10;G.add(skyDisc);
    /* wiszące korzenie u wejścia */
    for(let k=0;k<9;k++){const a=rnd()*Math.PI*2, r=24+rnd()*8;
      const rt=new THREE.Mesh(new THREE.CylinderGeometry(.12,.04,5+rnd()*5,5),WOOD2);
      rt.position.set(Math.cos(a)*r,H_SHAFT+2-2.5-rnd()*2,Math.sin(a)*r);
      rt.rotation.z=(rnd()-.5)*.3;G.add(rt)}

    /* ── DNO: klepisko + jeziorko + głazy ── */
    const floor=new THREE.Mesh(new THREE.CircleGeometry(RADIUS+18,26),DIRT);
    floor.rotation.x=-Math.PI/2;floor.name='terr';G.add(floor);
    const pool=new THREE.Mesh(new THREE.CircleGeometry(11,22),std(0x1a2a4a,.25,.4));
    pool.rotation.x=-Math.PI/2;pool.position.set(-16,.04,-13);pool.name='terr';G.add(pool);
    const poolRim=new THREE.Mesh(new THREE.TorusGeometry(11.2,.5,6,24),ROCK_D2);
    poolRim.rotation.x=-Math.PI/2;poolRim.position.set(-16,.3,-13);G.add(poolRim);
    // fałszywe refleksy latarni na wodzie
    for(const pr of[[-18,-16],[-13,-11],[-19,-10]]){
      const gl=new THREE.Mesh(new THREE.CircleGeometry(.7,10),bas(0xffd27a));
      gl.rotation.x=-Math.PI/2;gl.position.set(pr[0],.06,pr[1]);G.add(gl)}
    for(let i=0;i<8;i++){const b=rockChunk(i%2?ROCK_D:ROCK_M,2+rnd()*2.5);
      b.position.set((rnd()-.5)*70,1,(rnd()-.5)*70);
      if(Math.hypot(b.position.x,b.position.z)<8)b.position.x+=14;G.add(b)}

    /* ── KRYSZTAŁ: dwutonowy shard (róż→błękit) ── */
    const CR_PINK=std(0xf07ae0,.25,0,0xd94fd0,.85);
    const CR_BLUE=std(0x7a9af0,.25,0,0x4f6ad9,.85);
    const CR_CYAN=std(0x7ae0e8,.2,0,0x3fc9d9,.95);
    const CR_GOLD=std(0xe8b84a,.2,0,0xb8862f,.9);
    const TIP_ICE=std(0xcfe0ff,.2,0,0x9ab8ff,.95);
    const TIP_GOLD=std(0xf7dfa0,.2,0,0xd9b45f,.95);
    function crystal(s,hue){
      const grp=new THREE.Group();
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.2,.7,1.6,5),hue);
      body.position.y=.8;grp.add(body);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(.2,.55,5),
        hue===CR_GOLD?TIP_GOLD:TIP_ICE);
      tip.position.y=1.85;grp.add(tip);
      const band=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.22,5),
        hue===CR_GOLD?TIP_GOLD:TIP_ICE);
      band.position.y=1.62;grp.add(band);
      const core=new THREE.Mesh(new THREE.CylinderGeometry(.13,.42,1.05,5),
        bas(hue===CR_PINK?0xff9af0:hue===CR_GOLD?0xffe9a8:0x9ab8ff));
      core.position.y=.6;grp.add(core);
      grp.scale.setScalar(s);
      grp.rotation.y=rnd()*Math.PI*2;
      grp.rotation.z=(rnd()-.5)*.25;
      return grp}
    function cluster(x,y,z,count,scale,hue){
      const c=new THREE.Group();c.position.set(x,y,z);G.add(c);
      c.add(crystal(scale,hue));
      for(let k=1;k<count;k++){
        const sub=crystal(scale*(0.35+rnd()*.4),rnd()<.3?CR_BLUE:hue);
        const a=rnd()*Math.PI*2, r=scale*(0.5+rnd()*.6);
        sub.position.set(Math.cos(a)*r,0,Math.sin(a)*r);
        sub.rotation.z=(rnd()-.5)*.7;c.add(sub)}
      return c}

    /* ── PÓŁKI — trasa zjazdu; gęstość maleje z głębokością ── */
    function ledge(a,y,depth,rad){
      const grp=new THREE.Group();G.add(grp);
      const cx=Math.cos(a)*(RADIUS-depth), cz=Math.sin(a)*(RADIUS-depth);
      grp.position.set(cx,y,cz);grp.rotation.y=-a+Math.PI/2;
      const plat=rockChunk(y/H_SHAFT>.5?ROCK_M:ROCK_D,1);
      plat.scale.set(rad,3,rad*.7);plat.position.y=-2;grp.add(plat);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(rad*.8,rad*.9,.8,10),DIRT);
      top.position.y=-.2;grp.add(top);
      return grp}

    const flames=[];
    function lantern(parent,x,y,z){
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,2.6,6),WOOD);
      post.position.set(x,y+1.3,z);parent.add(post);
      const arm=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1,6),WOOD);
      arm.rotation.z=Math.PI/2;arm.position.set(x+.5,y+2.6,z);parent.add(arm);
      const box=new THREE.Mesh(new THREE.BoxGeometry(.5,.7,.5),IRON);
      box.position.set(x+1,y+2.2,z);parent.add(box);
      const glow=new THREE.Mesh(new THREE.BoxGeometry(.34,.44,.34),bas(0xffd27a));
      glow.userData.dyn=true;glow.position.set(x+1,y+2.2,z);parent.add(glow);
      flames.push(glow)}

    function portal(parent,w,h){
      const l=new THREE.Mesh(new THREE.BoxGeometry(.5,h,.5),WOOD);l.position.set(-w/2,h/2,0);parent.add(l);
      const r=l.clone();r.position.x=w/2;parent.add(r);
      const top=new THREE.Mesh(new THREE.BoxGeometry(w+1,.5,.6),WOOD2);top.position.y=h;parent.add(top);
      const d1=new THREE.Mesh(new THREE.BoxGeometry(.35,h*.9,.35),WOOD2);
      d1.rotation.z=.5;d1.position.set(-w*.22,h*.45,0);parent.add(d1);
      const d2=d1.clone();d2.rotation.z=-.5;d2.position.x=w*.22;parent.add(d2)}

    /* P1 — taras wejściowy: brama + drabina + DUŻO drobnych różowych */
    {const L=ledge(3.9,H_SHAFT*.82,10,16);
     const gate=new THREE.Group();gate.position.set(0,0,-6);L.add(gate);portal(gate,7,6);
     const lad=new THREE.Mesh(new THREE.BoxGeometry(.3,7,.3),WOOD);lad.position.set(3.2,3.2,-6.2);L.add(lad);
     const lad2=lad.clone();lad2.position.x=4.4;L.add(lad2);
     for(let k=0;k<6;k++){const st=new THREE.Mesh(new THREE.BoxGeometry(1.5,.18,.3),WOOD2);
       st.position.set(3.8,1+k*1.05,-6.2);L.add(st)}
     lantern(L,-4,0,-4);
     for(let k=0;k<7;k++){const cl=cluster(0,0,0,3,2.4+rnd()*1.4,CR_PINK);
       G.remove(cl);cl.position.set((rnd()-.5)*20,0,(rnd()-.5)*9+2);L.add(cl)}}

    /* P2 — półka + KŁADKA LINOWA do mini-półki */
    {const L=ledge(5.15,H_SHAFT*.62,8,13);
     lantern(L,4.5,0,2);
     for(let k=0;k<4;k++){const cl=cluster(0,0,0,4,3.0+rnd()*1.6,rnd()<.5?CR_PINK:CR_BLUE);
       G.remove(cl);cl.position.set((rnd()-.5)*14,0,(rnd()-.5)*7);L.add(cl)}
     const L2=ledge(5.75,H_SHAFT*.60,6,8);
     const p1=new THREE.Vector3(),p2=new THREE.Vector3();
     L.getWorldPosition(p1);L2.getWorldPosition(p2);
     const dir=p2.clone().sub(p1);const len=dir.length();
     const bridge=new THREE.Group();G.add(bridge);
     bridge.position.copy(p1.clone().lerp(p2,.5));
     bridge.rotation.y=-Math.atan2(dir.z,dir.x);
     const slope=Math.atan2(p2.y-p1.y,Math.hypot(dir.x,dir.z));
     bridge.rotation.z=slope;
     const planks=9;
     for(let k=0;k<planks;k++){
       const t=k/(planks-1)-.5;
       const sag=Math.cos(t*Math.PI)*-1.3;
       const pl=new THREE.Mesh(new THREE.BoxGeometry(len/planks*.8,.14,1.5),WOOD2);
       pl.position.set(t*len,sag,0);
       pl.rotation.z=Math.sin(t*Math.PI*1.0)*-.14*Math.sign(t||1);
       bridge.add(pl)}
     for(const s of[-1,1]){
       for(let k=0;k<planks;k+=2){const t=k/(planks-1)-.5;
         const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1,5),WOOD);
         post.position.set(t*len,Math.cos(t*Math.PI)*-1.3+.55,s*.75);bridge.add(post)}
       const rope=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,len,5),WOOD2);
       rope.rotation.z=Math.PI/2;rope.position.set(0,-.25,s*.75);bridge.add(rope)}
     const glCl=cluster(0,0,0,2,2.8,CR_BLUE);G.remove(glCl);glCl.position.set(0,0,0);L2.add(glCl);
     lantern(L2,-2.5,0,-1)}

    /* P3 — półka z wagonikiem, torami, portal wzmocnienia */
    {const L=ledge(3.45,H_SHAFT*.38,9,14);
     lantern(L,-5,0,3);
     const gate=new THREE.Group();gate.position.set(0,0,-5.5);L.add(gate);portal(gate,6,5);
     const cl=cluster(0,0,0,3,4.4,CR_BLUE);G.remove(cl);cl.position.set(5,0,-2);L.add(cl);
     const cart=new THREE.Group();cart.position.set(-2,0,1);cart.rotation.y=.4;L.add(cart);
     const tub=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.5,2),std(0x6a3a2a,.7,.2));
     tub.position.y=1.4;cart.add(tub);
     const tubIn=new THREE.Mesh(new THREE.BoxGeometry(2.8,.3,1.6),bas(0x9a7ae0));
     tubIn.position.y=2.05;cart.add(tubIn);
     for(const wx of[-1.1,1.1])for(const wz of[-.8,.8]){
       const wh=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.25,10),IRON);
       wh.rotation.x=Math.PI/2;wh.position.set(wx,.4,wz);cart.add(wh)}
     for(const s of[-1,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(9,.16,.18),IRON);
       rail.position.set(0,.1,1+s*.8);L.add(rail)}
     for(let k=0;k<6;k++){const sl=new THREE.Mesh(new THREE.BoxGeometry(.5,.1,2.2),WOOD2);
       sl.position.set(-4+k*1.6,.05,1);L.add(sl)}}

    /* DNO: pojedyncze WIELKIE okazy — rzadkie i cenne */
    cluster(15,0,-20,2,9.5,CR_CYAN);
    cluster(-27,0,-6,1,11,CR_GOLD);
    cluster(26,0,-2,2,7.5,CR_BLUE);

    /* ── TORY zjazdowe po łuku ściany + przewrócony wagonik ── */
    {const turns=0.62, y0=H_SHAFT*.34, y1=4, steps=26, r=RADIUS-7;
     for(let k=0;k<steps;k++){
       const t=k/(steps-1), a=3.45+t*turns*2, y=y0+(y1-y0)*t;
       const seg=new THREE.Group();
       seg.position.set(Math.cos(a)*r,y,Math.sin(a)*r);
       seg.rotation.y=-a;G.add(seg);
       const tie=new THREE.Mesh(new THREE.BoxGeometry(2.4,.12,.5),WOOD2);seg.add(tie);
       for(const s of[-1,1]){const rl=new THREE.Mesh(new THREE.BoxGeometry(.16,.14,3.4),IRON);
         rl.position.set(s*.8,.1,0);seg.add(rl)}
       const br=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,3),WOOD);
       br.position.set(0,-.4,-1.2);seg.add(br)}
     const aEnd=3.45+turns*2;
     const dead=new THREE.Group();
     dead.position.set(Math.cos(aEnd)*(r-2),.8,Math.sin(aEnd)*(r-2));
     dead.rotation.set(.4,1.2,1.35);G.add(dead);
     dead.add(new THREE.Mesh(new THREE.BoxGeometry(3.2,1.5,2),std(0x5a3226,.75,.15)))}

    /* ── GIRLANDA świetlna nad dnem ── */
    {const pA=new THREE.Vector3(-30,16,-20),pB=new THREE.Vector3(26,19,-26);
     for(const p of[pA,pB]){const mast=new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,p.y,7),WOOD);
       mast.position.set(p.x,p.y/2,p.z);G.add(mast)}
     const N=11;let prev=null;
     for(let k=0;k<N;k++){const t=k/(N-1);
       const pos=pA.clone().lerp(pB,t);pos.y-=Math.sin(t*Math.PI)*4.5;
       const bulb=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),bas(0xffcf7a));
       bulb.userData.dyn=true;bulb.position.copy(pos);G.add(bulb);flames.push(bulb);
       if(prev){const d=pos.clone().sub(prev);
         const wire=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,d.length(),4),IRON);
         wire.position.copy(prev.clone().lerp(pos,.5));
         wire.lookAt(pos);wire.rotateX(Math.PI/2);G.add(wire)}
       prev=pos}}

    /* ── GRZYBKI ── */
    for(let i=0;i<26;i++){
      const a=rnd()*Math.PI*2, r=RADIUS-6-rnd()*10;
      const x=Math.cos(a)*r, z=Math.sin(a)*r, s=.4+rnd()*.7;
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.09*s,.13*s,.7*s,6),MUSH);
      stem.position.set(x,.35*s,z);G.add(stem);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.34*s,8,6,0,Math.PI*2,0,Math.PI/2),MUSH_C);
      cap.position.set(x,.7*s,z);G.add(cap)}

    /* ── NIETOPERZE ── */
    const bats=[];
    for(let i=0;i<3;i++){
      const bat=new THREE.Group();bat.userData.dyn=true;G.add(bat);
      for(const s of[-1,1]){const w=new THREE.Mesh(new THREE.ConeGeometry(.5,1.1,3),std(0x241a20,.8));
        w.rotation.z=s*Math.PI/2;w.position.x=s*.5;bat.add(w)}
      bat.userData={ph:i*2.1,r:20+i*6,h:H_SHAFT*.5+i*14};bats.push(bat)}

    /* ── ŚWIATŁA WNĘTRZA ── */
    const glowMag=new THREE.PointLight(0xd96ae0,.9,90);glowMag.position.set(0,26,0);G.add(glowMag);
    const glowWarm=new THREE.PointLight(0xffc27a,.8,60);glowWarm.position.set(-14,14,4);G.add(glowWarm);
    const shaftLight=new THREE.PointLight(0xffe2b0,.9,120);shaftLight.position.set(0,H_SHAFT+2,0);G.add(shaftLight);
    const l1=new THREE.PointLight(0xffc27a,.8,46);
    l1.position.set(Math.cos(3.9)*40,H_SHAFT*.82+4,Math.sin(3.9)*40);G.add(l1);
    const l2=new THREE.PointLight(0xd96ae0,.85,52);
    l2.position.set(Math.cos(5.15)*40,H_SHAFT*.62+5,Math.sin(5.15)*40);G.add(l2);

    /* ── PAD WYDOBYWCZY ── */
    const padDisc=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.1,.14,22),std(0x6a4a34,.8));
    padDisc.position.y=.07;G.add(padDisc);
    const pring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),bas(0xffb050));
    pring.rotation.x=-Math.PI/2;pring.position.y=.15;G.add(pring);
    const hM=bas(0xf2ead8);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,.155,0);
    const h2=h1.clone();h2.position.x=.34;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.y=.155;
    G.add(h1,h2,h3);
    for(let k=0;k<4;k++){const a=k/4*Math.PI*2+Math.PI/4;
      const tl=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),bas(0xffcf7a));
      tl.position.set(Math.cos(a)*1.85,.2,Math.sin(a)*1.85);G.add(tl)}

    return {group:G, pad:{h:.16},
      animate(dt,t){
        flames.forEach((f,i)=>{const s=.9+Math.sin(t*7+i*1.7)*.12;f.scale.setScalar(s)});
        bats.forEach(b=>{const u=b.userData;u.ph+=dt*.9;
          b.position.set(Math.cos(u.ph)*u.r,u.h+Math.sin(u.ph*2.3)*3,Math.sin(u.ph)*u.r);
          b.rotation.y=-u.ph+Math.PI/2;
          b.children.forEach((w,k)=>w.rotation.x=Math.sin(t*14+k)*.6)});
      }};
  }
};
})(window);
