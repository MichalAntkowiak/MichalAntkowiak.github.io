/* MA//BIOME:CIRCUIT → ZATOKA ANTEN (ELEKTRONIKA)
   Nadmorskie obserwatorium radiowe o fioletowym zmierzchu. Klif nad morzem,
   wielka czasza śledząca niebo, farma masztów kratowych, TRZY nadajniki
   emitujące rozchodzące się pierścienie fal (triangulacja — jak w projekcie
   Wi-Fi CSI), latarnia z obrotową wiązką, kolejka na klifie, boje, mewy. */
(function(root){
'use strict';
root.MABIOME_CIRCUIT={
  MAXALT:200,
  FOG_STOPS:[[0,0x120a24],[.28,0x35194a],[.52,0x6e3b66],[.76,0xb96a7e],[1,0xd98d84]],
  FOG_NEAR:170, FOG_FAR:560,
  SUN:{col:0xffb46a,int:.9},
  HEMI:{sky:0x8a5a8a,ground:0x27404e,int:.8},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m,e,ei)=>{const M=new THREE.MeshStandardMaterial({color:c,roughness:r??.8,metalness:m??.1});
      if(e){M.emissive=new THREE.Color(e);M.emissiveIntensity=ei??.8}return M};
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    const glow=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o??.5,depthWrite:false});
    let sd=77;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    const dyn=o=>{o.userData.dyn=true;return o};
    const strobes=[];

    const CONC=std(0x9a8fa0,.85), CONC2=std(0x7a7086,.85);
    const STEEL=std(0xb8aab8,.4,.6), DARK=std(0x352f42,.7,.2);
    const WHITE=std(0xe8dce4,.5,.2), RUST=std(0x8a5a4a,.8);
    const CYAN=std(0x3ad4e0,.3,.2,0x2ab4c8,1.0);
    const AMBER=bas(0xffc27a);

    /* ── MORZE: wielka tafla + ścieżka słońca + pasy piany ── */
    {const sea=new THREE.Mesh(new THREE.PlaneGeometry(900,700,12,10),
       std(0x23566a,.35,.3,0x0e2e3a,.3));
     sea.rotation.x=-Math.PI/2;sea.position.set(0,-0.55,-160);sea.name='terr';G.add(sea)}
    {const path=new THREE.Mesh(new THREE.BoxGeometry(15,.06,290),
       std(0xffb46a,.4,.1,0xd07a3a,.5));
     path.position.set(-58,-0.5,-200);path.rotation.y=.1;G.add(path)}
    const foams=[];
    const FOAMM=new THREE.MeshStandardMaterial({color:0xdfeef0,roughness:.7,
      transparent:true,opacity:.4,depthWrite:false});
    for(let i=0;i<7;i++){
      const f=dyn(new THREE.Mesh(new THREE.BoxGeometry(16+rnd()*18,.05,.6),FOAMM));
      f.userData={x:-150+i*50+rnd()*14,z:-47-rnd()*9,ph:rnd()*6,sp:.5+rnd()*.4};
      f.position.set(f.userData.x,-0.46,f.userData.z);G.add(f);foams.push(f)}

    /* ── KLIF/PLATEAU bazy (teren pod obserwatorium) ── */
    function slab(w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
      m.position.set(x,y,z);G.add(m);return m}
    {const top=new THREE.Mesh(new THREE.PlaneGeometry(250,92,10,6),std(0x4a3f5c,.9));
     top.rotation.x=-Math.PI/2;top.position.set(0,0,2);top.name='terr';G.add(top)}
    // masyw pod plateau (skirt — plateau nie lewituje)
    slab(250,9,92,0,-4.6,2,CONC2);
    slab(252,4,94,0,-8.5,2,DARK);
    // czoło klifu DOKŁADNIE na linii brzegowej (z≈-43)
    for(let i=0;i<10;i++){
      const w=26+rnd()*14;
      const c=slab(w,7+rnd()*5,9,-122+i*27+rnd()*6,-3.2,-44-rnd()*2,i%2?DARK:CONC2);
      c.rotation.y=(rnd()-.5)*.16}
    // pojedyncze głazy u podnóża klifu (w wodzie)
    for(let i=0;i<5;i++){
      const g=new THREE.IcosahedronGeometry(2+rnd()*2,0);const p=g.attributes.position;
      for(let k=0;k<p.count;k++)p.setXYZ(k,p.getX(k)*(0.7+rnd()*.5),p.getY(k)*(0.8+rnd()*.5),p.getZ(k)*(0.7+rnd()*.5));
      g.computeVertexNormals();
      const st=new THREE.Mesh(g,DARK);st.position.set(-110+i*52+rnd()*10,-0.4,-49-rnd()*3);G.add(st)}
    // skałki w morzu
    for(const [sx,sz,ss] of [[-96,-70,4],[-78,-96,6],[64,-64,3.4],[112,-110,7]]){
      const g=new THREE.IcosahedronGeometry(ss,0);const p=g.attributes.position;
      for(let k=0;k<p.count;k++)p.setXYZ(k,p.getX(k)*(0.7+rnd()*.5),p.getY(k)*(0.9+rnd()*.6),p.getZ(k)*(0.7+rnd()*.5));
      g.computeVertexNormals();
      const st=new THREE.Mesh(g,DARK);st.position.set(sx,ss*.3-0.6,sz);G.add(st)}

    /* ── WIELKA CZASZA (bohater, obraca się az.) ── */
    const dishAz=dyn(new THREE.Group());dishAz.position.set(-40,0,-26);G.add(dishAz);
    {const base=new THREE.Mesh(new THREE.CylinderGeometry(8,10,4,12),CONC2);
     base.position.y=2;dishAz.add(base);
     const ped=new THREE.Mesh(new THREE.CylinderGeometry(4.2,5.2,10,10),DARK);
     ped.position.y=9;dishAz.add(ped);
     for(let k=0;k<4;k++){const a=k/4*Math.PI*2;
       const leg=new THREE.Mesh(new THREE.BoxGeometry(1.2,9,1.2),STEEL);
       leg.position.set(Math.cos(a)*5.4,6.5,Math.sin(a)*5.4);
       leg.rotation.y=-a;leg.rotation.z=Math.cos(a)*.28;leg.rotation.x=-Math.sin(a)*.28;dishAz.add(leg)}
     const yoke=new THREE.Mesh(new THREE.BoxGeometry(10,2.4,3),STEEL);
     yoke.position.y=15;dishAz.add(yoke);
     const tilt=new THREE.Group();tilt.position.y=16;tilt.rotation.x=-.85;dishAz.add(tilt);
     dishAz.userData.tilt=tilt;
     const bowl=new THREE.Mesh(new THREE.SphereGeometry(15,20,10,0,Math.PI*2,0,Math.PI/2.6),
       new THREE.MeshStandardMaterial({color:0xd8ccd8,roughness:.5,metalness:.3,side:THREE.DoubleSide}));
     bowl.scale.y=.55;bowl.rotation.x=Math.PI;bowl.position.y=6.4;tilt.add(bowl);
     const hub=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2,2,10),DARK);
     hub.position.y=5.2;tilt.add(hub);
     for(let k=0;k<3;k++){const a=k/3*Math.PI*2;
       const strut=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,12,5),STEEL);
       strut.position.set(Math.cos(a)*4.6,10.6,Math.sin(a)*4.6);
       strut.rotation.z=Math.cos(a)*.42;strut.rotation.x=-Math.sin(a)*.42;tilt.add(strut)}
     const feed=new THREE.Mesh(new THREE.ConeGeometry(1,2.4,8),RUST);
     feed.position.y=15.6;feed.rotation.x=Math.PI;tilt.add(feed);
     const feedL=dyn(new THREE.Mesh(new THREE.SphereGeometry(.24,8,6),bas(0x3ad4e0)));
     feedL.position.y=16.9;tilt.add(feedL);strobes.push(feedL);
     const rimL=dyn(new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),bas(0xff3b30)));
     rimL.position.set(0,6.2,-14.2);tilt.add(rimL);strobes.push(rimL);
     const rimT=new THREE.Mesh(new THREE.TorusGeometry(14.2,.45,8,26),STEEL);
     rimT.rotation.x=Math.PI/2;rimT.position.y=6.2;rimT.scale.set(1,1,.55);
     rimT.rotation.x=Math.PI/2;tilt.add(rimT);
     const cw=new THREE.Mesh(new THREE.BoxGeometry(3,3,4),DARK);
     cw.position.set(0,3.4,5.4);tilt.add(cw);
     for(const sg of[-1,1]){
       const aFrame=new THREE.Mesh(new THREE.CylinderGeometry(.3,.4,13,6),STEEL);
       aFrame.position.set(sg*4.2,8.5,4.4);
       aFrame.rotation.x=.5;aFrame.rotation.z=sg*.22;dishAz.add(aFrame)}}

    /* dwie mniejsze czasze statyczne */
    function smallDish(x,z,ry,elev){
      const g2=new THREE.Group();g2.position.set(x,0,z);g2.rotation.y=ry;G.add(g2);
      const ped=new THREE.Mesh(new THREE.CylinderGeometry(1,1.4,5,8),CONC2);ped.position.y=2.5;g2.add(ped);
      const t=new THREE.Group();t.position.y=5.4;t.rotation.x=elev;g2.add(t);
      const bowl=new THREE.Mesh(new THREE.SphereGeometry(4.6,14,8,0,Math.PI*2,0,Math.PI/2.6),
        new THREE.MeshStandardMaterial({color:0xcfc2d0,roughness:.5,metalness:.3,side:THREE.DoubleSide}));
      bowl.scale.y=.55;bowl.rotation.x=Math.PI;bowl.position.y=1.9;t.add(bowl);
      const feed=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,3.6,5),STEEL);
      feed.position.y=2.6;t.add(feed)}
    smallDish(28,-34,.5,-.7); smallDish(74,-30,-.4,-.5);

    /* ── FARMA MASZTÓW KRATOWYCH (pion zjazdu) ── */
    function mast(x,z,h){
      const m=new THREE.Group();m.position.set(x,0,z);G.add(m);
      for(const [ox,oz] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        const leg=new THREE.Mesh(new THREE.CylinderGeometry(.14,.3,h,5),STEEL);
        leg.position.set(ox*.9,h/2,oz*.9);
        leg.rotation.z=-ox*.012;leg.rotation.x=oz*.012;m.add(leg)}
      for(let y=6;y<h;y+=7){
        const rim=new THREE.Mesh(new THREE.BoxGeometry(2.1-y*.008,.16,2.1-y*.008),STEEL);
        rim.position.y=y;m.add(rim);
        const dg=new THREE.Mesh(new THREE.BoxGeometry(.1,4.4,.1),STEEL);
        dg.rotation.z=(y/7)%2?.42:-.42;dg.position.set(0,y-3,0.95);m.add(dg)}
      const tip=new THREE.Mesh(new THREE.CylinderGeometry(.05,.1,4,4),STEEL);
      tip.position.y=h+2;m.add(tip);
      const sb=dyn(new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),bas(0xff3b30)));
      sb.position.y=h+.6;m.add(sb);strobes.push(sb);
      if(h>60){const sb2=dyn(new THREE.Mesh(new THREE.SphereGeometry(.4,8,6),bas(0xff3b30)));
        sb2.position.y=h*.55;m.add(sb2);strobes.push(sb2)}
      return m}
    mast(96,-16,92); mast(64,8,66); mast(112,-34,52); mast(84,-28,76);

    /* ── TRIANGULACJA: 3 nadajniki TX emitujące pierścienie fal ── */
    const txs=[]; const waves=[];
    const TXpos=[[-16,-36],[30,-22],[8,6]];
    TXpos.forEach(([tx,tz],i)=>{
      const m=new THREE.Group();m.position.set(tx,0,tz);G.add(m);
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,11,7),WHITE);
      pole.position.y=5.5;m.add(pole);
      const box=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.8,1),DARK);
      box.position.y=11.6;m.add(box);
      const ant=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3,4),STEEL);
      ant.position.y=13.8;m.add(ant);
      const led=dyn(new THREE.Mesh(new THREE.SphereGeometry(.24,8,6),bas(0x3ad4e0)));
      led.position.y=12.7;m.add(led);txs.push(led);
      for(let w=0;w<3;w++){
        const ring=dyn(new THREE.Mesh(new THREE.TorusGeometry(1,.09,6,32),glow(0x5ae0ea,.55)));
        ring.rotation.x=Math.PI/2;ring.position.set(tx,11.6,tz);
        ring.userData={ph:w/3,cx:tx,cz:tz};
        G.add(ring);waves.push(ring)}});
    // punkt przecięcia (triangulowana pozycja) – pulsujący marker
    const fix=dyn(new THREE.Mesh(new THREE.SphereGeometry(.5,10,8),bas(0xfff0a0)));
    fix.position.set(7,1.1,-17);G.add(fix);
    const beams=[];
    TXpos.forEach(([tx,tz])=>{
      const dx=7-tx,dz=-17-tz;const len=Math.hypot(dx,dz,10.5);
      const bm=dyn(new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,len,5),glow(0xfff0a0,.35)));
      bm.position.set((tx+7)/2,(11.6+1.1)/2,(tz-17)/2);
      bm.rotation.z=Math.atan2(dx,10.5)* -1;
      // orientacja: oś Y walca wzdłuż wektora (dx,-10.5,dz)
      const dir=new THREE.Vector3(dx,1.1-11.6,dz).normalize();
      bm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
      G.add(bm);beams.push(bm)});
    const fixRing=dyn(new THREE.Mesh(new THREE.TorusGeometry(1.1,.07,6,24),glow(0xfff0a0,.6)));
    fixRing.rotation.x=-Math.PI/2;fixRing.position.set(7,.3,-17);G.add(fixRing);

    /* ── BUNKIER KONTROLNY + PAD ── */
    {const b=slab(16,4.6,9,-6,2.3,14,CONC);
     const band=new THREE.Mesh(new THREE.BoxGeometry(14.5,1.1,.3),CYAN);
     band.position.set(-6,3.1,18.55);G.add(band);
     const door=slab(1.6,3,.4,-12.5,1.5,18.4,DARK);
     slab(3,.4,5,-6,4.8,12,CONC2);
     const roofAnt=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,5,5),STEEL);
     roofAnt.position.set(-11,7.1,12);G.add(roofAnt);
     const rd=new THREE.Group();rd.position.set(0,4.8,12);rd.rotation.x=-.6;G.add(rd);
     const rb=new THREE.Mesh(new THREE.SphereGeometry(1.6,10,6,0,Math.PI*2,0,Math.PI/2.6),
       new THREE.MeshStandardMaterial({color:0xcfc2d0,roughness:.5,metalness:.3,side:THREE.DoubleSide}));
     rb.scale.y=.55;rb.rotation.x=Math.PI;rd.add(rb)}
    // kable na słupkach bunkier→czasza
    for(let k=0;k<4;k++){const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,2.2,5),DARK);
      post.position.set(-14-k*9,1.1,4-k*14);G.add(post)}
    // pad
    const padDisc=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.1,.2,26),std(0x6a5f78,.7));
    padDisc.position.set(0,.1,0);G.add(padDisc);
    const pring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),bas(0xffb46a));
    pring.rotation.x=-Math.PI/2;pring.position.set(0,.21,0);G.add(pring);
    const hM=bas(0xf2ede2);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,.215,0);
    const h2=h1.clone();h2.position.x=.34;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.set(0,.215,0);
    G.add(h1,h2,h3);
    const beacon=dyn(new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),bas(0xff6a3a)));
    beacon.position.set(2.4,.5,0);G.add(beacon);
    // bębny kablowe + skrzynie + stojak przy lądowisku
    for(const [dx,dz,dr] of [[5.2,3.4,.9],[6.8,2.2,.7]]){
      const drum=new THREE.Mesh(new THREE.CylinderGeometry(dr,dr,.9,10),RUST);
      drum.rotation.z=Math.PI/2;drum.position.set(dx,dr,dz);G.add(drum);
      for(const e of[-1,1]){const fl2=new THREE.Mesh(new THREE.CylinderGeometry(dr+.18,dr+.18,.12,10),DARK);
        fl2.rotation.z=Math.PI/2;fl2.position.set(dx+e*.5,dr,dz);G.add(fl2)}}
    for(let k=0;k<3;k++){const cr=new THREE.Mesh(new THREE.BoxGeometry(1.1,.8,.9),k%2?CONC2:DARK);
      cr.position.set(-5.4+k*.3,.4+k*.82,3.8+(k%2)*.2);cr.rotation.y=k*.3;G.add(cr)}
    {const rack=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.7,.6),DARK);
     rack.position.set(4.6,.85,-3.6);G.add(rack);
     const scr2=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.06),CYAN);
     scr2.position.set(4.6,1.1,-3.28);G.add(scr2);
     const rl=dyn(new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),bas(0xff3b30)));
     rl.position.set(4.6,1.85,-3.6);G.add(rl);strobes.push(rl)}
    // światła podejścia wokół padu
    const appr=[];
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2;
      const st2=dyn(new THREE.Mesh(new THREE.BoxGeometry(.26,.1,.26),bas(0x9ff0e0)));
      st2.position.set(Math.cos(a)*3.1,.06,Math.sin(a)*3.1);G.add(st2);appr.push(st2)}
    // łaty ciemniejszego gruntu (plateau nie jest gołe)
    for(let k=0;k<7;k++){
      const patch=new THREE.Mesh(new THREE.CylinderGeometry(3+rnd()*4,3+rnd()*4,.06,9),std(0x40365a,.95));
      patch.position.set((rnd()-.5)*180,.03,(rnd()-.5)*70+4);G.add(patch)}
    // kępki traw nadmorskich
    for(let k=0;k<8;k++){
      const gx=(rnd()-.5)*190, gz=-38+rnd()*70;
      for(let b2=0;b2<3;b2++){const bl=new THREE.Mesh(new THREE.ConeGeometry(.07,.9+rnd()*.5,4),std(0x5a6a4e,.9));
        bl.position.set(gx+(rnd()-.5)*.5,.45,gz+(rnd()-.5)*.5);bl.rotation.z=(rnd()-.5)*.4;G.add(bl)}}
    // wiatrowskaz
    const sockPole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,3.2,6),STEEL);
    sockPole.position.set(-3.2,1.6,-2.4);G.add(sockPole);
    const sock=dyn(new THREE.Group());sock.position.set(-3.2,3.1,-2.4);G.add(sock);
    for(let k=0;k<3;k++){const seg=new THREE.Mesh(new THREE.ConeGeometry(.34-k*.09,.7,7),
      k%2?std(0xe8dce4,.6):std(0xd85a3a,.6));
      seg.rotation.z=-Math.PI/2;seg.position.x=.5+k*.62;sock.add(seg)}
    // liny między słupkami kablowymi (katenary uproszczone)
    for(let k=0;k<3;k++){
      const x1=-14-k*9,z1=4-k*14,x2=-14-(k+1)*9,z2=4-(k+1)*14;
      const len=Math.hypot(x2-x1,z2-z1);
      const wire=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,len,4),DARK);
      wire.position.set((x1+x2)/2,2.0,(z1+z2)/2);
      wire.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),
        new THREE.Vector3(x2-x1,0,z2-z1).normalize());
      G.add(wire)}

    /* pad WYNIESIONY? nie — na plateau; ale plateau ma z=26 poza terenem top (150/2=75 ok) */

    /* ── LATARNIA na cyplu + obrotowa wiązka ── */
    const lhouse=new THREE.Group();lhouse.position.set(-118,0,-20);G.add(lhouse);
    {const tw=new THREE.Mesh(new THREE.CylinderGeometry(2.2,3,16,10),WHITE);
     tw.position.y=8;lhouse.add(tw);
     const band1=new THREE.Mesh(new THREE.CylinderGeometry(2.55,2.75,2.6,10),RUST);
     band1.position.y=8;lhouse.add(band1);
     const gal=new THREE.Mesh(new THREE.CylinderGeometry(3,3,.5,10),DARK);
     gal.position.y=16.4;lhouse.add(gal);
     const lamp=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,2.4,8),std(0xfff0c0,.3,.1,0xffd98a,.9));
     lamp.position.y=17.8;lhouse.add(lamp);
     const halo=dyn(new THREE.Mesh(new THREE.SphereGeometry(2.6,10,8),glow(0xffe9b0,.16)));
     halo.position.y=17.8;lhouse.add(halo);lhouse.userData.halo=halo;
     const cap=new THREE.Mesh(new THREE.ConeGeometry(2,1.8,8),DARK);
     cap.position.y=20;lhouse.add(cap)}
    const beamHub=dyn(new THREE.Group());beamHub.position.set(-118,17.8,-20);G.add(beamHub);
    for(const sgn of[1,-1]){
      const beam=new THREE.Mesh(new THREE.ConeGeometry(3.2,46,10,1,true),glow(0xffe9b0,.07));
      beam.rotation.z=sgn*Math.PI/2;beam.position.x=sgn*23;beamHub.add(beam)}

    /* ── KOLEJKA LINOWO-TERENOWA na klifie ── */
    const funi={};
    {const track=new THREE.Group();track.position.set(120,0,-6);track.rotation.y=-.35;G.add(track);
     const ramp=new THREE.Mesh(new THREE.BoxGeometry(3.4,.5,42),CONC2);
     ramp.position.set(0,-3.2,-16);ramp.rotation.x=-.3;track.add(ramp);
     for(const sg of[-1,1]){const rl=new THREE.Mesh(new THREE.BoxGeometry(.16,.14,42),DARK);
       rl.position.set(sg*.9,-2.95,-16);rl.rotation.x=-.3;track.add(rl)}
     // stacja górna i dolna
     const stT=new THREE.Mesh(new THREE.BoxGeometry(4.4,2.6,3),CONC);
     stT.position.set(0,1.3,4.4);track.add(stT);
     const stB=new THREE.Mesh(new THREE.BoxGeometry(4.4,2.2,3),CONC2);
     stB.position.set(0,-8.2,-37);track.add(stB);
     const jetty=new THREE.Mesh(new THREE.BoxGeometry(3,.4,9),RUST);
     jetty.position.set(0,-9.1,-43);track.add(jetty);
     for(const jz of[-40,-46]){for(const jx of[-1.2,1.2]){
       const post=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,1.6,5),DARK);
       post.position.set(jx,-9.6,jz);track.add(post)}}
     const cab=dyn(new THREE.Group());track.add(cab);funi.cab=cab;
     const body=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.8,3.0),std(0xd85a3a,.5,.2));
     body.position.y=1.1;cab.add(body);
     const win=new THREE.Mesh(new THREE.BoxGeometry(2.2,.7,3.1),std(0xffe0b0,.3,.1,0xd0a060,.7));
     win.position.y=1.55;cab.add(win);
     cab.position.set(0,-3.2+Math.sin(.3)*(0+16)+.35,0)}
    const funiPath={zA:2,zB:-33,slope:.3};

    /* ── BOJE + MEWY + BALON METEO ── */
    const buoys=[];
    for(const [bx,bz] of [[-30,-70],[10,-96],[48,-84],[-64,-120]]){
      const b=dyn(new THREE.Group());b.position.set(bx,-0.3,bz);G.add(b);
      const hull=new THREE.Mesh(new THREE.CylinderGeometry(.55,.7,.8,8),std(0x5a3028,.7));hull.position.y=.3;b.add(hull);
      const cone2=new THREE.Mesh(new THREE.ConeGeometry(.5,.7,8),std(0x7a4034,.65));cone2.position.y=1.05;b.add(cone2);
      const tip=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.1,5),DARK);tip.position.y=1.9;b.add(tip);
      const led=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),AMBER);led.position.y=2.5;b.add(led);
      b.userData={ph:rnd()*6};buoys.push(b)}
    const gulls=[];
    for(let i=0;i<3;i++){
      const gl=dyn(new THREE.Group());G.add(gl);
      for(const sgn of[-1,1]){const w=new THREE.Mesh(new THREE.ConeGeometry(.22,.9,3),std(0xf2ede2,.6));
        w.rotation.z=sgn*Math.PI/2;w.position.x=sgn*.38;gl.add(w)}
      gl.userData={ph:i*2.2,r:40+i*16,h:16+i*9};
      const u=gl.userData;gl.position.set(-40+Math.cos(u.ph)*u.r,u.h,-70+Math.sin(u.ph)*u.r*.5);
      gulls.push(gl)}
    const balloon=dyn(new THREE.Group());balloon.position.set(40,86,-60);G.add(balloon);
    {const env=new THREE.Mesh(new THREE.SphereGeometry(3,12,10),std(0xe8e0ea,.5,.1));
     balloon.add(env);
     const line=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,5,4),DARK);
     line.position.y=-4.4;balloon.add(line);
     const box=new THREE.Mesh(new THREE.BoxGeometry(.9,.7,.9),RUST);
     box.position.y=-7.1;balloon.add(box);
     const bl=dyn(new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),bas(0xff3b30)));
     bl.position.y=-7.7;balloon.add(bl);strobes.push(bl)}

    /* ── DALEKIE CYPLE (sylwetki) ── */
    for(const [cx,cz,cw,ch] of [[-200,-210,260,30],[180,-260,300,40]]){
      const g=new THREE.PlaneGeometry(cw,ch,26,1);
      const P=g.attributes.position;
      for(let i=0;i<P.count;i++){if(P.getY(i)>0)P.setY(i,P.getY(i)*(0.25+rnd()*.75))}
      g.computeVertexNormals();
      const m=new THREE.Mesh(g,std(0x241536,1));
      m.position.set(cx,ch*.5-3,cz);G.add(m)}

    /* ── KSIĘŻYC (sierp) ── */
    {const mo=new THREE.Mesh(new THREE.SphereGeometry(6,14,12),bas(0xf2e8d8));
     mo.position.set(96,138,-210);G.add(mo);
     const sh=new THREE.Mesh(new THREE.SphereGeometry(6.1,14,12),bas(0x2a1440));
     sh.position.set(99,140,-209);G.add(sh)}
    /* ── ŻAGLÓWKI (sylwetki, kołyszą się) ── */
    const boats=[];
    for(const [bx,bz,ss] of [[-118,-150,1],[76,-190,1.3]]){
      const bt=dyn(new THREE.Group());bt.position.set(bx,-0.2,bz);G.add(bt);
      const hull=new THREE.Mesh(new THREE.BoxGeometry(4*ss,.7,1.3*ss),DARK);
      hull.position.y=.3;bt.add(hull);
      const mastB=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,4.4*ss,5),DARK);
      mastB.position.y=2.4;bt.add(mastB);
      const sail=new THREE.Mesh(new THREE.ConeGeometry(1.3*ss,3.6*ss,3),std(0xe8dce4,.7));
      sail.position.set(.5,2.6,0);sail.rotation.y=.5;bt.add(sail);
      bt.userData={ph:bx};boats.push(bt)}

    /* ── SMUGI CHMUR wysoko + SATELITA (przelot) ── */
    const skyStrips=[];
    for(let i=0;i<3;i++){
      const st=dyn(new THREE.Mesh(new THREE.BoxGeometry(70+rnd()*40,1.2,6),
        glow(i%2?0xd98da0:0xb97ab0,.16)));
      st.userData={h:118+i*26,r:90+rnd()*40,a:rnd()*6.28,sp:.014+rnd()*.01};
      const u=st.userData;st.position.set(Math.cos(u.a)*u.r,u.h,-70+Math.sin(u.a)*u.r*.4);
      G.add(st);skyStrips.push(st)}
    const sat=dyn(new THREE.Group());G.add(sat);
    {const dot=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),bas(0xffffff));sat.add(dot);
     for(let k=1;k<=3;k++){const tr=new THREE.Mesh(new THREE.SphereGeometry(.22-k*.05,5,4),glow(0xcfe0ff,.4-k*.1));
       tr.position.x=k*1.1;sat.add(tr)}}
    sat.visible=false;

    /* ── ŚWIATŁA ── */
    const pl1=new THREE.PointLight(0xffb46a,.8,120);pl1.position.set(-58,20,-120);G.add(pl1);
    const pl2=new THREE.PointLight(0x3ad4e0,.5,60);pl2.position.set(-6,6,16);G.add(pl2);

    return {group:G, pad:{h:.2},
      animate(dt,t){
        dishAz.rotation.y=Math.sin(t*.07)*.9;
        dishAz.userData.tilt.rotation.x=-.85+Math.sin(t*.11)*.12;
        foams.forEach(f=>{const u=f.userData;
          f.position.x=u.x+Math.sin(t*u.sp+u.ph)*6;
          f.position.z=u.z+Math.sin(t*.6+u.ph)*1.2;
          f.scale.x=.85+Math.sin(t*.8+u.ph)*.25;
          f.material.opacity=.28+Math.sin(t*.9+u.ph)*.12});
        // fale TX: pierścienie rosną i gasną (skala 1→14, cykl 3 s, przesunięte fazowo)
        waves.forEach(w=>{const u=w.userData;
          const c=((t*.33+u.ph)%1);
          const s=1+c*13;w.scale.set(s,s,1);
          w.material.opacity=.55*(1-c)});
        txs.forEach((led,i)=>led.visible=((t*1.2+i*.33)%1)<.55);
        const fp=.8+Math.sin(t*3)*.25;
        fix.scale.setScalar(fp);fixRing.scale.setScalar(1+Math.sin(t*3)*.2);
        beams.forEach((bm,i)=>bm.material.opacity=.22+((t*1.2+i*.33)%1<.55?.22:0));
        strobes.forEach((s2,i)=>s2.visible=((t+i*.4)%1.7)<.14);
        beamHub.rotation.y=t*.5;
        lhouse.userData.halo.scale.setScalar(.9+Math.sin(t*2.4)*.18);
        // kolejka: kabina jeździ po rampie (powierzchnia: y=-3.2+sin(.3)*(z+16))
        {const u=(Math.sin(t*.22)+1)/2;
         const z=funiPath.zA+(funiPath.zB-funiPath.zA)*u;
         funi.cab.position.set(0, -3.2+Math.sin(funiPath.slope)*(z+16)+.35, z);}
        buoys.forEach(b=>{const u=b.userData;
          b.position.y=-0.3+Math.sin(t*1.1+u.ph)*.18;
          b.rotation.z=Math.sin(t*.9+u.ph)*.08;
          b.children[2].visible=((t+u.ph)%2.2)<.5});
        gulls.forEach(gl=>{const u=gl.userData;u.ph+=dt*.4;
          gl.position.set(-40+Math.cos(u.ph)*u.r,u.h+Math.sin(u.ph*1.6)*2,-70+Math.sin(u.ph)*u.r*.5);
          gl.rotation.y=-u.ph;
          gl.children.forEach((w,k)=>w.rotation.x=Math.sin(t*8+k)*.45)});
        boats.forEach(bt=>{const u=bt.userData;
          bt.rotation.z=Math.sin(t*.8+u.ph)*.05;
          bt.position.y=-0.2+Math.sin(t*1.1+u.ph)*.12});
        balloon.position.x=40+Math.sin(t*.15)*5;
        balloon.position.y=86+Math.sin(t*.4)*1.4;
        beacon.visible=(t%1.4)<.18;
        appr.forEach((s3,i)=>s3.visible=((t*1.6+i/6)%1)<.6);
        sock.rotation.y=Math.sin(t*.5)*.6+.3;
        sock.children.forEach((c,k)=>c.position.y=Math.sin(t*3+k)*.05);
        skyStrips.forEach(st=>{const u=st.userData;u.a+=dt*u.sp;
          st.position.set(Math.cos(u.a)*u.r,u.h,-70+Math.sin(u.a)*u.r*.4)});
        {const per=21, tt=t%per;
         if(tt<6){sat.visible=true;
           sat.position.set(-150+tt*50,152+Math.sin(tt*.5)*4,-110);
           sat.rotation.z=-.06}
         else sat.visible=false}
      }};
  }
};
})(window);
