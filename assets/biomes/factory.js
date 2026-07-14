/* MA//BIOME:FACTORY → ZAKŁAD PRODUKCYJNY (MECHANIKA), noc
   Wg ref: sci-fi robot factory — otwarta hala z linią montażową ramion,
   trusy i świecące pasy pod stropem, suwnica, AGV na placu, zbiorniki, estakada rur. */
(function(root){
'use strict';
root.MABIOME_FACTORY={
  MAXALT:260,
  FOG_STOPS:[[0,0x05070d],[.2,0x0a1220],[.45,0x11213a],[.7,0x16304e],[1,0x1a3a5c]],
  SUN:{col:0x9fc0ff,int:.55},
  HEMI:{sky:0x2a4a72,ground:0x0a1420,int:.85},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m,e,ei)=>{const M=new THREE.MeshStandardMaterial({color:c,roughness:r??.7,metalness:m??0});
      if(e){M.emissive=new THREE.Color(e);M.emissiveIntensity=ei??.8}return M};
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    let sd=17;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};

    const ASPH=std(0x151a24,.9);
    const FLOORIN=std(0x232c3a,.8);
    const PANEL=std(0x2c3644,.6,.3), PANEL2=std(0x222b38,.6,.3);
    const STEEL=std(0x5a6a7e,.45,.6), STEEL2=std(0x3c4756,.5,.55);
    const YEL=std(0xe0a92c,.55,.2);
    const WHITE=std(0xc9d4e0,.5,.2);
    const DARK=std(0x11161e,.6,.3);
    const GLOWC=std(0x66d9f0,.3,0,0x2fb9d9,1.0);     // cyjan pas
    const GLOWW=std(0xdfeaff,.3,0,0xaac4e8,1.0);     // zimna biel
    const AMBER=bas(0xffb050);

    /* — PLAC — */
    const yard=new THREE.Mesh(new THREE.PlaneGeometry(560,420),ASPH);
    yard.rotation.x=-Math.PI/2;yard.name='terr';G.add(yard);
    for(let k=-3;k<=3;k++){const ln=new THREE.Mesh(new THREE.PlaneGeometry(240,.4),std(0x3a4454,.8));
      ln.rotation.x=-Math.PI/2;ln.position.set(0,.02,-6+k*20);ln.name='terr';G.add(ln)}

    /* — GRANIE nocne (sylwetki) — */
    function ridge(w,h,z,col,seed){
      const g=new THREE.PlaneGeometry(w,h,42,5);const P=g.attributes.position;
      for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i);
        const rl=1-Math.abs(Math.sin(x*.012+seed))*.9;
        P.setY(i,y+rl*h*.5*(y/h+.5))}
      g.computeVertexNormals();
      const m=new THREE.Mesh(g,std(col,.95));m.position.set(0,h*.28,z);G.add(m)}
    ridge(800,110,-216,0x101b2c,2.2);
    ridge(720,86,-196,0x0c1524,5.1);

    /* — HALA GŁÓWNA: otwarty front, wnętrze widoczne — */
    const HW=132, HD=62, HH=34, HZ=-96;    // wymiary i pozycja
    const hall=new THREE.Group();hall.position.set(-14,0,HZ);G.add(hall);
    // podłoga wnętrza
    const inFloor=new THREE.Mesh(new THREE.BoxGeometry(HW,0.4,HD),FLOORIN);
    inFloor.position.y=.2;hall.add(inFloor);
    // ściany: tył + boki (panele), front OTWARTY (tylko słupy i rygle)
    const back=new THREE.Mesh(new THREE.BoxGeometry(HW,HH,1.2),PANEL);
    back.position.set(0,HH/2,-HD/2);hall.add(back);
    for(const sgn of[-1,1]){const side=new THREE.Mesh(new THREE.BoxGeometry(1.2,HH,HD),sgn<0?PANEL:PANEL2);
      side.position.set(sgn*HW/2,HH/2,0);hall.add(side)}
    // pas świetlny na tylnej ścianie (logo-strip)
    const backGlow=new THREE.Mesh(new THREE.BoxGeometry(HW*.7,1.4,.3),GLOWC);
    backGlow.position.set(0,HH*.72,-HD/2+.8);hall.add(backGlow);
    // słupy frontu + rygle
    for(let k=0;k<=6;k++){const x=-HW/2+k*(HW/6);
      const col=new THREE.Mesh(new THREE.BoxGeometry(1.6,HH,1.6),STEEL2);
      col.position.set(x,HH/2,HD/2);hall.add(col)}
    for(const hgt of[HH*.55,HH*.98]){const beam=new THREE.Mesh(new THREE.BoxGeometry(HW,1.4,1.6),STEEL2);
      beam.position.set(0,hgt,HD/2);hall.add(beam)}
    // dach + świetlik kalenicowy
    const roof=new THREE.Mesh(new THREE.BoxGeometry(HW+2,1.2,HD+2),DARK);
    roof.position.y=HH+.6;hall.add(roof);
    const monitor=new THREE.Mesh(new THREE.BoxGeometry(HW*.5,2.4,10),PANEL2);
    monitor.position.y=HH+2.2;hall.add(monitor);
    const monGlow=new THREE.Mesh(new THREE.BoxGeometry(HW*.48,.5,.2),GLOWW);
    monGlow.position.set(0,HH+2.2,5.1);hall.add(monGlow);
    // trusy pod stropem
    for(let k=0;k<7;k++){const x=-HW/2+8+k*(HW-16)/6;
      const tr=new THREE.Mesh(new THREE.BoxGeometry(1,1,HD-4),STEEL);
      tr.position.set(x,HH-2,0);hall.add(tr);
      for(let d=0;d<5;d++){const dg=new THREE.Mesh(new THREE.BoxGeometry(.4,3.4,.4),STEEL2);
        dg.rotation.x=(d%2?1:-1)*.7;dg.position.set(x,HH-3.6,-HD/2+8+d*(HD-16)/4);hall.add(dg)}}
    // PASY ŚWIETLNE (rzędy pod stropem)
    const strips=[];
    for(let r=0;r<3;r++){for(let k=0;k<5;k++){
      const st2=new THREE.Mesh(new THREE.BoxGeometry(14,.28,.9),r===1?GLOWW:GLOWC);
      st2.position.set(-HW/2+16+k*(HW-32)/4,HH-4.6,-HD/2+12+r*(HD-24)/2);
      hall.add(st2);strips.push(st2)}}
    // wiszące kable (z sagiem)
    for(let k=0;k<8;k++){const x=-HW/2+10+k*(HW-20)/7;
      const cab=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,7+rnd()*4,5),DARK);
      cab.position.set(x,HH-2-(cab.geometry.parameters.height/2),-HD/2+6+rnd()*8);
      cab.rotation.z=(rnd()-.5)*.16;hall.add(cab)}

    /* — LINIA MONTAŻOWA wewnątrz: podest + stacje + RAMIONA — */
    const line=new THREE.Group();line.position.set(0,0,-6);hall.add(line);
    const bed=new THREE.Mesh(new THREE.BoxGeometry(HW-24,1.6,7),STEEL2);
    bed.position.y=1.2;line.add(bed);
    const bedGlow=new THREE.Mesh(new THREE.BoxGeometry(HW-24,.18,.3),GLOWC);
    bedGlow.position.set(0,2.1,3.6);line.add(bedGlow);
    const bedGlow2=bedGlow.clone();bedGlow2.position.z=-3.6;line.add(bedGlow2);
    // chassis produktów (co stację)
    const chassisL=[];
    for(let k=0;k<5;k++){
      const ch=new THREE.Group();ch.position.set(-HW/2+22+k*(HW-44)/4,2.6,0);line.add(ch);
      const b=new THREE.Mesh(new THREE.BoxGeometry(6,1.4,3.4),WHITE);b.position.y=.7;ch.add(b);
      const cab2=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.6,3),std(0xb8452f,.5,.2));
      cab2.position.set(-1.4,2.1,0);ch.add(cab2);
      chassisL.push(ch)}
    // RAMIONA robotów: podstawa+2 przeguby+chwytak; naprzemiennie po bokach
    const arms=[];
    function robotArm(x,z,mirror){
      const A=new THREE.Group();A.position.set(x,0,z);line.add(A);
      const base=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.9,1.6,12),DARK);
      base.position.y=.8;A.add(base);
      const pivot=new THREE.Group();pivot.position.y=1.7;A.add(pivot);
      const shoulder=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.6),YEL);
      shoulder.position.y=.6;pivot.add(shoulder);
      const upper=new THREE.Group();upper.position.y=1.2;pivot.add(upper);
      const arm1=new THREE.Mesh(new THREE.BoxGeometry(1.1,4.6,1.1),YEL);
      arm1.position.y=2.3;upper.add(arm1);
      const elbow=new THREE.Group();elbow.position.y=4.6;upper.add(elbow);
      const arm2=new THREE.Mesh(new THREE.BoxGeometry(.9,3.8,.9),WHITE);
      arm2.position.y=1.9;elbow.add(arm2);
      const wrist=new THREE.Mesh(new THREE.BoxGeometry(.7,.7,1.6),DARK);
      wrist.position.y=3.9;elbow.add(wrist);
      const tip=new THREE.Mesh(new THREE.BoxGeometry(.2,.9,.2),GLOWC);
      tip.position.set(0,4.4,.5);elbow.add(tip);
      const tip2=tip.clone();tip2.position.z=-.5;elbow.add(tip2);
      upper.rotation.z=(mirror?-1:1)*.7;
      elbow.rotation.z=(mirror?1:-1)*1.5;
      pivot.rotation.y=mirror?Math.PI:0;
      arms.push({pivot,upper,elbow,ph:rnd()*6});
      return A}
    for(let k=0;k<6;k++){
      const x=-HW/2+22+k*(HW-44)/5;
      robotArm(x,(k%2?5.4:-5.4),k%2===0)}

    /* — SUWNICA wewnętrzna (belka pod trusami, wózek jeździ) — */
    const gRail1=new THREE.Mesh(new THREE.BoxGeometry(HW-8,.8,.8),STEEL);
    gRail1.position.set(0,HH-6.4,-HD/2+6);hall.add(gRail1);
    const gRail2=gRail1.clone();gRail2.position.z=HD/2-6;hall.add(gRail2);
    const gantry=new THREE.Group();gantry.userData.dyn=true;gantry.position.set(-20,HH-6.4,0);hall.add(gantry);
    const gBeam=new THREE.Mesh(new THREE.BoxGeometry(2,1.4,HD-10),YEL);gantry.add(gBeam);
    const troll=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.2,2.6),DARK);
    troll.position.y=-1.2;gantry.add(troll);
    const hoist=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,8,6),DARK);
    hoist.position.y=-5.2;gantry.add(hoist);
    const hookBox=new THREE.Mesh(new THREE.BoxGeometry(2,1.2,2),std(0x2f6a9a,.5,.3));
    hookBox.position.y=-9.4;gantry.add(hookBox);

    /* — MASZYNY CNC pod tylną ścianą (rząd z ekranami) — */
    for(let k=0;k<4;k++){
      const mx=-HW/2+18+k*(HW-36)/3;
      const m2=new THREE.Group();m2.position.set(mx,0,-HD/2+5);hall.add(m2);
      const bodyM=new THREE.Mesh(new THREE.BoxGeometry(7,4.2,4),PANEL);
      bodyM.position.y=2.3;m2.add(bodyM);
      const baseM=new THREE.Mesh(new THREE.BoxGeometry(7.4,.4,4.4),DARK);
      baseM.position.y=.2;m2.add(baseM);
      const scr=new THREE.Mesh(new THREE.BoxGeometry(1.6,1,.12),GLOWC);
      scr.position.set(1.8,3.4,2.05);m2.add(scr);
      const winM=new THREE.Mesh(new THREE.BoxGeometry(3,1.6,.12),std(0x1a2634,.3,.4));
      winM.position.set(-1.2,2.6,2.05);m2.add(winM);
      const lampM=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),k%2?AMBER:bas(0x66f090));
      lampM.position.set(2.9,4.6,1.6);m2.add(lampM)}

    /* — PODWIESZONA LINIA (power&free): szyna + wiszące haki z częściami — */
    const pfY=HH-9, pfZ=8;
    const pfRail=new THREE.Mesh(new THREE.BoxGeometry(HW-16,.5,.5),STEEL);
    pfRail.position.set(0,pfY,pfZ);hall.add(pfRail);
    for(let k=0;k<6;k++){const drop=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,2.4,6),STEEL2);
      drop.position.set(-HW/2+14+k*(HW-28)/5,pfY+1.6,pfZ);hall.add(drop)}
    const hooks=[];
    for(let i=0;i<6;i++){
      const h2=new THREE.Group();h2.userData.dyn=true;hall.add(h2);
      const rod=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,2.2,6),DARK);
      rod.position.y=-1.1;h2.add(rod);
      const part=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.1,.9),
        i%2?WHITE:std(0xb8452f,.5,.2));
      part.position.y=-2.6;h2.add(part);
      h2.userData.off=i/6;
      h2.position.set(-HW/2+8+(i/6)*(HW-16),pfY-.4,pfZ);
      hooks.push(h2)}

    /* — ISKRY SPAWANIA przy 3. ramieniu — */
    const sparks=new THREE.Group();sparks.userData.dyn=true;
    sparks.position.set(-HW/2+22+2*(HW-44)/5, 3.2, -6);hall.add(sparks);
    const sparkCore=new THREE.Mesh(new THREE.SphereGeometry(.34,8,6),bas(0xdff4ff));
    sparks.add(sparkCore);
    for(let k=0;k<5;k++){const sp=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.06),bas(0xaee6ff));
      sp.rotation.z=rnd()*Math.PI;sp.position.set((rnd()-.5)*.8,(rnd()-.5)*.6,0);sparks.add(sp)}

    /* — HALA BOCZNA (zamknięta, pasmo okien) — */
    const hall2=new THREE.Group();hall2.position.set(96,0,-78);G.add(hall2);
    const h2b=new THREE.Mesh(new THREE.BoxGeometry(52,20,40),PANEL2);
    h2b.position.y=10;hall2.add(h2b);
    const h2roof=new THREE.Mesh(new THREE.BoxGeometry(54,1,42),DARK);
    h2roof.position.y=20.5;hall2.add(h2roof);
    const h2win=new THREE.Mesh(new THREE.BoxGeometry(48,1.4,.3),GLOWW);
    h2win.position.set(0,13,20.2);hall2.add(h2win);
    const h2door=new THREE.Mesh(new THREE.BoxGeometry(10,8,.5),DARK);
    h2door.position.set(-8,4,20.2);hall2.add(h2door);
    const h2doorGlow=new THREE.Mesh(new THREE.BoxGeometry(10.6,.3,.2),GLOWC);
    h2doorGlow.position.set(-8,8.4,20.3);hall2.add(h2doorGlow);

    /* — ESTAKADA RUR między halami — */
    {const y=11, x0=-14+HW/2, x1=96-26, zP=-84;
     const span=x1-x0;
     for(let k=0;k<=2;k++){const px=x0+k*span/2;
       const leg=new THREE.Mesh(new THREE.BoxGeometry(1,y,1),STEEL2);
       leg.position.set(px,y/2,zP);G.add(leg);
       const cross=new THREE.Mesh(new THREE.BoxGeometry(1,.8,6),STEEL2);
       cross.position.set(px,y,zP);G.add(cross)}
     const cols=[0x5a89b0,0x8a6a4a,0x5a6a7e,0x9a5a3a];
     for(let p=0;p<4;p++){
       const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,span,10),std(cols[p],.45,.5));
       pipe.rotation.z=Math.PI/2;pipe.position.set((x0+x1)/2,y+.9,zP-2.1+p*1.4);G.add(pipe);
       const valve=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.8,8),YEL);
       valve.position.set(x0+span*(.3+p*.15),y+1.6,zP-2.1+p*1.4);G.add(valve)}}

    /* — ZBIORNIKI — */
    for(const [sx,sz,sr,sh] of [[132,-118,7,22],[150,-112,5.5,18],[118,-124,4.5,15]]){
      const plinth=new THREE.Mesh(new THREE.CylinderGeometry(sr+.6,sr+.8,1,14),STEEL2);
      plinth.position.set(sx,.5,sz);G.add(plinth);
      const t2=new THREE.Mesh(new THREE.CylinderGeometry(sr,sr,sh,16),PANEL);
      t2.position.set(sx,sh/2+1,sz);G.add(t2);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(sr,14,8,0,Math.PI*2,0,Math.PI/2),STEEL);
      cap.position.set(sx,sh+1,sz);G.add(cap);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(sr+.05,.14,6,18),STEEL2);
      ring.rotation.x=Math.PI/2;ring.position.set(sx,sh*.45+1,sz);G.add(ring);
      const lad=new THREE.Mesh(new THREE.BoxGeometry(.5,sh,.2),STEEL2);
      lad.position.set(sx+sr+.12,sh/2+1,sz);G.add(lad);
      const tGlow=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),AMBER);
      tGlow.position.set(sx,sh+1+sr*.9,sz);G.add(tGlow)}

    /* — RURA hala2 → zbiorniki + podest na dużym zbiorniku — */
    {const pz=-100;
     const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,30,10),std(0x5a89b0,.45,.5));
     pipe.rotation.z=Math.PI/2;pipe.rotation.y=.35;pipe.position.set(112,9,pz+2);G.add(pipe);
     const elbow=new THREE.Mesh(new THREE.SphereGeometry(.62,10,8),std(0x5a89b0,.45,.5));
     elbow.position.set(126,9,pz-3);G.add(elbow);
     const down=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,8,10),std(0x5a89b0,.45,.5));
     down.position.set(126,5,pz-3);G.add(down)}
    {const cw=new THREE.Mesh(new THREE.BoxGeometry(5,.3,2),STEEL2);
     cw.position.set(132,23.6,-118+7.4);G.add(cw);
     for(const e of[-2.2,2.2]){const rl=new THREE.Mesh(new THREE.BoxGeometry(.12,1,.12),STEEL2);
       rl.position.set(132+e,24.3,-118+7.4);G.add(rl)}
     const rlb=new THREE.Mesh(new THREE.BoxGeometry(4.6,.1,.1),STEEL2);
     rlb.position.set(132,24.9,-118+7.4);G.add(rlb)}

    /* — DOK ZAŁADUNKOWY z ciężarówką — */
    {const dock=new THREE.Group();dock.position.set(-60,0,-63);G.add(dock);
     const ramp=new THREE.Mesh(new THREE.BoxGeometry(10,1.4,6),STEEL2);
     ramp.position.set(0,.7,0);dock.add(ramp);
     const truck=new THREE.Group();truck.position.set(0,0,6.8);dock.add(truck);
     const trailer=new THREE.Mesh(new THREE.BoxGeometry(5.4,3.4,9),WHITE);
     trailer.position.y=2.6;truck.add(trailer);
     const openB=new THREE.Mesh(new THREE.BoxGeometry(5.0,2.9,.3),DARK);
     openB.position.set(0,2.5,-4.4);truck.add(openB);
     const cab=new THREE.Mesh(new THREE.BoxGeometry(4.6,2.6,2.6),std(0x2f6a9a,.5,.2));
     cab.position.set(0,1.9,6.0);truck.add(cab);
     const winT=new THREE.Mesh(new THREE.BoxGeometry(4.2,1,.14),std(0x9fc4e8,.3,.3));
     winT.position.set(0,2.5,7.35);truck.add(winT);
     for(const wx of[-2.1,2.1])for(const wz of[-3.4,-1.2,5.4]){
       const wh=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.5,12),DARK);
       wh.rotation.z=Math.PI/2;wh.position.set(wx,.7,wz);truck.add(wh)}}

    /* — WÓZKI WIDŁOWE: 1 przy paletach + 1 jeżdżący — */
    function forklift(){
      const f=new THREE.Group();
      const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.5,1.5),YEL);b.position.y=1.05;f.add(b);
      const cage=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.3,1.4),DARK);cage.position.set(-.2,2.35,0);f.add(cage);
      const mast=new THREE.Mesh(new THREE.BoxGeometry(.24,3,1.2),STEEL2);mast.position.set(1.35,1.8,0);f.add(mast);
      for(const fz of[-.4,.4]){const fork=new THREE.Mesh(new THREE.BoxGeometry(1.5,.12,.22),STEEL);
        fork.position.set(2.2,.34,fz);f.add(fork)}
      for(const wx of[-.7,.8])for(const wz of[-.7,.7]){
        const wh=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.34,10),DARK);
        wh.rotation.x=Math.PI/2;wh.position.set(wx,.42,wz);f.add(wh)}
      return f}
    const fk1=forklift();fk1.position.set(16,0,12);fk1.rotation.y=-.5;G.add(fk1);
    const fk2=forklift();fk2.userData.dyn=true;fk2.position.set(-40,0,26);G.add(fk2);
    const boxLoad=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.2,1.2),std(0x9a4a2f,.6,.2));
    boxLoad.position.set(2.2,1.1,0);fk2.add(boxLoad);

    /* — BUDKA + SZLABAN (animowany) — */
    {const booth=new THREE.Group();booth.position.set(64,0,44);G.add(booth);
     const bb=new THREE.Mesh(new THREE.BoxGeometry(3,2.8,3),PANEL);bb.position.y=1.6;booth.add(bb);
     const br=new THREE.Mesh(new THREE.BoxGeometry(3.6,.3,3.6),DARK);br.position.y=3.1;booth.add(br);
     const bw=new THREE.Mesh(new THREE.BoxGeometry(2.4,1,.14),GLOWW);bw.position.set(0,1.9,1.55);booth.add(bw)}
    const gatePivot=new THREE.Group();gatePivot.userData.dyn=true;
    gatePivot.position.set(61,1.1,40);G.add(gatePivot);
    {const post=new THREE.Mesh(new THREE.BoxGeometry(.5,2.2,.5),STEEL2);
     post.position.set(61,1.1,40);G.add(post);
     const armG=new THREE.Mesh(new THREE.BoxGeometry(7,.22,.22),YEL);
     armG.position.x=-3.5;gatePivot.add(armG);
     for(let k=0;k<3;k++){const strp=new THREE.Mesh(new THREE.BoxGeometry(.9,.24,.24),WHITE);
       strp.position.x=-1-k*2.2;gatePivot.add(strp)}}

    /* — WENTYLATORY DACHOWE (kręcące się) — */
    const roofFans=[];
    for(const [fx,fz] of[[-44,-100],[6,-92],[36,-104]]){
      const duct=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.8,2,10),PANEL2);
      duct.position.set(fx,HH+2.2,fz);G.add(duct);
      const fan=new THREE.Group();fan.userData.dyn=true;fan.position.set(fx,HH+3.4,fz);G.add(fan);
      for(let b2=0;b2<4;b2++){const bl=new THREE.Mesh(new THREE.BoxGeometry(1.3,.08,.4),STEEL);
        const hold=new THREE.Group();hold.rotation.y=b2/4*Math.PI*2;
        bl.position.x=.75;hold.add(bl);fan.add(hold)}
      roofFans.push(fan)}

    /* — PARA z komina (3 kłęby, unoszą się) — */
    const puffs=[];
    for(let i=0;i<3;i++){
      const p2=new THREE.Mesh(new THREE.SphereGeometry(1.6,8,6),std(0x9aa8b8,.95));
      p2.userData.dyn=true;p2.userData.ph=i/3;
      {const u=i/3;p2.position.set(-146+u*4,38+u*14,-116-u*2);p2.scale.setScalar(.6+u*1.8)}
      G.add(p2);puffs.push(p2)}

    /* — OZNAKOWANIE placu: strzałki i pasy — */
    for(const [ax,az,rot] of[[-30,6,0],[10,6,0],[-30,-40,0],[30,-40,0]]){
      const ar=new THREE.Mesh(new THREE.PlaneGeometry(.6,3),std(0xc9d4e0,.8));
      ar.rotation.x=-Math.PI/2;ar.rotation.z=rot;ar.position.set(ax,.03,az);ar.name='terr';G.add(ar);
      const tip=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.0),std(0xc9d4e0,.8));
      tip.rotation.x=-Math.PI/2;tip.position.set(ax,.03,az-1.9);tip.name='terr';G.add(tip)}
    for(let k=0;k<6;k++){const zeb=new THREE.Mesh(new THREE.PlaneGeometry(.9,4.5),std(0xc9d4e0,.8));
      zeb.rotation.x=-Math.PI/2;zeb.position.set(46+k*1.7,.03,40);zeb.name='terr';G.add(zeb)}

    /* — KOMIN + strobo — */
    const chim=new THREE.Mesh(new THREE.CylinderGeometry(2,2.8,38,14),PANEL2);
    chim.position.set(-146,19,-116);G.add(chim);
    for(const bh of[12,24,34]){const br=new THREE.Mesh(new THREE.TorusGeometry(2.5-bh*.012,.16,6,16),STEEL2);
      br.rotation.x=Math.PI/2;br.position.set(-146,bh,-116);G.add(br)}
    const chStrobe=new THREE.Mesh(new THREE.SphereGeometry(.6,8,6),bas(0xff3b30));
    chStrobe.userData.dyn=true;chStrobe.position.set(-146,38.8,-116);G.add(chStrobe);

    /* — KONTENERY (stosy) — */
    const contC=[0x2f6a9a,0x9a4a2f,0x4a7a4f,0x8a8a3a];
    for(let i=0;i<7;i++){
      const cx=-96+(i%4)*10, cz=-30-Math.floor(i/4)*7, cy=1.6+((i%3===2)?3.2:0);
      const c=new THREE.Mesh(new THREE.BoxGeometry(9,3.2,4.4),std(contC[i%4],.6,.2));
      c.position.set(cx,cy,cz);c.rotation.y=(rnd()-.5)*.06;G.add(c);
      for(const e of[-4.4,4.4]){const rib=new THREE.Mesh(new THREE.BoxGeometry(.2,3.2,4.5),DARK);
        rib.position.set(cx+e,cy,cz);G.add(rib)}}

    /* — MASZTY oświetleniowe placu — */
    const mastHeads=[];
    for(const [mx,mz] of[[-60,10],[40,14],[-20,-46],[70,-40]]){
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.28,.4,17,8),STEEL2);
      pole.position.set(mx,8.5,mz);G.add(pole);
      const head=new THREE.Mesh(new THREE.BoxGeometry(3.6,.5,1),GLOWW);
      head.position.set(mx,17.2,mz);G.add(head);mastHeads.push(head);
      const lamp=new THREE.PointLight(0xaac8ee,.55,44);
      lamp.position.set(mx,16,mz);G.add(lamp)}

    /* — AGV (3 wózki krążące po placu) — */
    const agvs=[];
    for(let i=0;i<3;i++){
      const a2=new THREE.Group();a2.userData.dyn=true;G.add(a2);
      const body=new THREE.Mesh(new THREE.BoxGeometry(3.4,1,2.2),WHITE);
      body.position.y=.7;a2.add(body);
      const glowS=new THREE.Mesh(new THREE.BoxGeometry(3.5,.16,2.3),GLOWC);
      glowS.position.y=.28;a2.add(glowS);
      const load=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.2,1.8),std(contC[i],.6,.2));
      load.position.y=1.8;a2.add(load);
      const u={ph:i*2.1,rx:34+i*14,rz:22+i*8,cx:-8,cz:-16,sp:.24+i*.05};
      a2.userData=u;
      a2.position.set(u.cx+Math.cos(u.ph)*u.rx,0,u.cz+Math.sin(u.ph)*u.rz);
      a2.rotation.y=-u.ph+Math.PI/2;
      agvs.push(a2)}

    /* ── PION: komin pochodni, maszt kratowy, ładunkowce, smugi, warstwy mgły ── */
    /* pochodnia gazowa: wysoki komin z płomieniem i pierścieniami */
    const FLAME=std(0xffb050,.4,0,0xff7a20,1.0);
    const flareG=new THREE.Group();flareG.position.set(-96,0,-150);G.add(flareG);
    {const st2=new THREE.Mesh(new THREE.CylinderGeometry(1.5,2.6,88,12),PANEL2);
     st2.position.y=44;flareG.add(st2);
     for(let k=1;k<=6;k++){const r2=new THREE.Mesh(new THREE.TorusGeometry(1.9-k*.06,.16,6,14),STEEL2);
       r2.rotation.x=Math.PI/2;r2.position.y=k*12.5;flareG.add(r2)}
     // drabina + platforma szczytowa
     const lad=new THREE.Mesh(new THREE.BoxGeometry(.4,84,.2),STEEL2);
     lad.position.set(2.3,44,0);flareG.add(lad);
     const plat=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.2,.3,12),STEEL2);
     plat.position.y=84;flareG.add(plat);
     const rail=new THREE.Mesh(new THREE.TorusGeometry(3.1,.08,6,16),STEEL2);
     rail.rotation.x=Math.PI/2;rail.position.y=85;flareG.add(rail)}
    const flame=new THREE.Group();flame.userData.dyn=true;flame.position.set(-96,90,-150);G.add(flame);
    {const f1=new THREE.Mesh(new THREE.ConeGeometry(1.6,5.5,7),FLAME);f1.position.y=2.7;flame.add(f1);
     const f2=new THREE.Mesh(new THREE.ConeGeometry(.9,3.2,6),bas(0xffe08a));f2.position.y=2.2;flame.add(f2)}
    const flarePuffs=[];
    for(let i=0;i<3;i++){
      const p2=new THREE.Mesh(new THREE.SphereGeometry(2.2,8,6),std(0x39465a,.95));
      p2.userData.dyn=true;p2.userData.ph=i/3;
      {const u=i/3;p2.position.set(-96+u*16,96+u*46,-150-u*8);p2.scale.setScalar(.7+u*2.4)}
      G.add(p2);flarePuffs.push(p2)}

    /* maszt kratowy z antenami i strobo (110 j.) */
    const mastG=new THREE.Group();mastG.position.set(112,0,-46);G.add(mastG);
    const mastStrobes=[];
    {for(const [ox,oz] of[[-2,-2],[2,-2],[2,2],[-2,2]]){
       const leg=new THREE.Mesh(new THREE.CylinderGeometry(.24,.4,108,6),STEEL2);
       leg.position.set(ox*.75,54,oz*.75);
       leg.rotation.z=-ox*.012;leg.rotation.x=oz*.012;mastG.add(leg)}
     for(let k=1;k<=12;k++){const y=k*8.6;
       const rim=new THREE.Mesh(new THREE.BoxGeometry(3.6-y*.008,.22,3.6-y*.008),STEEL2);
       rim.position.y=y;mastG.add(rim);
       const dg=new THREE.Mesh(new THREE.BoxGeometry(.18,5.4,.18),STEEL2);
       dg.rotation.z=(k%2?.5:-.5);dg.position.set(0,y-4,1.5);mastG.add(dg)}
     for(const [dy,dr] of[[64,1.9],[78,1.4],[92,1.1]]){
       const dish=new THREE.Mesh(new THREE.SphereGeometry(dr,10,6,0,Math.PI*2,0,Math.PI/2),WHITE);
       dish.rotation.x=-1.1;dish.position.set(2.2,dy,0);mastG.add(dish)}
     for(const sy of[40,72,104]){
       const sb=new THREE.Mesh(new THREE.SphereGeometry(.6,8,6),bas(0xff3b30));
       sb.userData.dyn=true;sb.position.set(0,sy,0);mastG.add(sb);mastStrobes.push(sb)}
     const tip=new THREE.Mesh(new THREE.CylinderGeometry(.06,.14,7,6),STEEL2);
     tip.position.y=110;mastG.add(tip)}

    /* ładunkowce: sterowiec towarowy + 2 ciężkie drony na różnych pułapach */
    const flyers=[];
    {const ship=new THREE.Group();ship.userData.dyn=true;G.add(ship);
     const hull=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,20,12),WHITE);
     hull.rotation.z=Math.PI/2;ship.add(hull);
     for(const e of[-1,1]){const nose=new THREE.Mesh(new THREE.ConeGeometry(3.4,5,12),WHITE);
       nose.rotation.z=-e*Math.PI/2;nose.position.x=e*12.5;ship.add(nose)}
     const band=new THREE.Mesh(new THREE.CylinderGeometry(3.45,3.45,2.4,12),std(0x2f6a9a,.5,.3));
     band.rotation.z=Math.PI/2;ship.add(band);
     const gond=new THREE.Mesh(new THREE.BoxGeometry(7,2,2.6),PANEL);
     gond.position.y=-4.2;ship.add(gond);
     const gGlow=new THREE.Mesh(new THREE.BoxGeometry(6,.2,.3),GLOWC);
     gGlow.position.set(0,-5.1,1.35);ship.add(gGlow);
     const cargo=new THREE.Mesh(new THREE.BoxGeometry(5,3,3),std(0x9a4a2f,.6,.2));
     cargo.position.y=-7.4;ship.add(cargo);
     for(const e of[-1,1]){const fin=new THREE.Mesh(new THREE.BoxGeometry(.2,3.4,2.6),WHITE);
       fin.position.set(-11,e*2.6,0);fin.rotation.x=e*.5;ship.add(fin)}
     const nav=new THREE.Mesh(new THREE.SphereGeometry(.4,8,6),bas(0xff3b30));
     nav.position.set(-13.5,0,0);ship.add(nav);
     ship.userData={h:168,r:120,a:.4,sp:.045};
     {const u=ship.userData;ship.position.set(Math.cos(u.a)*u.r,u.h,-60+Math.sin(u.a)*u.r*.6);
      ship.rotation.y=-u.a+Math.PI/2}
     flyers.push(ship)}
    for(let i=0;i<2;i++){
      const dr=new THREE.Group();dr.userData.dyn=true;G.add(dr);
      const body=new THREE.Mesh(new THREE.BoxGeometry(4.4,1.2,2.6),WHITE);dr.add(body);
      const cab=new THREE.Mesh(new THREE.BoxGeometry(1.6,1,2),GLOWC);
      cab.position.set(1.8,.6,0);dr.add(cab);
      for(const ax of[-1.6,1.6])for(const az of[-1.9,1.9]){
        const arm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.6,6),STEEL2);
        arm.rotation.x=Math.PI/2;arm.position.set(ax,.2,az*.6);dr.add(arm);
        const rot=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.06,12),
          new THREE.MeshStandardMaterial({color:0xdfe8f2,roughness:.4,transparent:true,opacity:.35}));
        rot.position.set(ax,.7,az);dr.add(rot)}
      const load=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.6,1.8),
        i?std(0x4a7a4f,.6,.2):std(0x2f6a9a,.6,.2));
      load.position.y=-1.6;dr.add(load);
      dr.userData={h:74+i*46,r:64+i*28,a:i*3.1,sp:.16-i*.04};
      {const u=dr.userData;dr.position.set(Math.cos(u.a)*u.r,u.h,-60+Math.sin(u.a)*u.r*.6);
       dr.rotation.y=-u.a+Math.PI/2}
      flyers.push(dr)}

    /* smugi reflektorów omiatające niebo */
    const beams=[];
    for(const [bx,bz] of[[-60,10],[40,14]]){
      const beam=new THREE.Mesh(new THREE.ConeGeometry(3.4,58,10,1,true),
        new THREE.MeshBasicMaterial({color:0xbcd8f4,transparent:true,opacity:.06,
          side:THREE.DoubleSide,depthWrite:false}));
      beam.position.set(bx,17.2+29,bz);beam.userData.dyn=true;
      beam.userData={bx,bz,ph:bx*.01};G.add(beam);beams.push(beam)}

    /* warstwy mgły/chmur na pułapie (dają skalę podczas zjazdu) */
    const hazes=[];
    for(let i=0;i<7;i++){
      const hz=new THREE.Group();hz.userData.dyn=true;G.add(hz);
      const n=3+Math.floor(rnd()*3);
      for(let k=0;k<n;k++){
        const sl=new THREE.Mesh(new THREE.SphereGeometry(9+rnd()*9,8,6),
          new THREE.MeshStandardMaterial({color:0x2a3a58,roughness:1,
            transparent:true,opacity:.3,depthWrite:false}));
        sl.scale.y=.16;sl.position.set(k*12-(n*6),rnd()*2,(rnd()-.5)*10);hz.add(sl)}
      hz.userData={h:58+rnd()*160,r:70+rnd()*70,a:rnd()*6.28,sp:.008+rnd()*.012};
      const u=hz.userData;hz.position.set(Math.cos(u.a)*u.r,u.h,-60+Math.sin(u.a)*u.r*.5);
      hz.renderOrder=1;hazes.push(hz)}

    /* DACH hali: świetliki, kanały, pomost (widoczne przy podejściu z góry) */
    {const walk=new THREE.Mesh(new THREE.BoxGeometry(HW-14,.24,2.4),STEEL2);
     walk.position.set(0,HH+1.4,-18);hall.add(walk);
     for(const s2 of[-1,1]){const hr=new THREE.Mesh(new THREE.BoxGeometry(HW-14,.08,.08),STEEL2);
       hr.position.set(0,HH+2.3,-18+s2*1.15);hall.add(hr)}
     for(let k=0;k<5;k++){const sky=new THREE.Mesh(new THREE.BoxGeometry(12,.2,7),GLOWW);
       sky.position.set(-HW/2+16+k*(HW-32)/4,HH+1.25,8);hall.add(sky)}
     for(let k=0;k<3;k++){const duct=new THREE.Mesh(new THREE.BoxGeometry(3,1.6,16),PANEL2);
       duct.position.set(-40+k*38,HH+1.9,-6);hall.add(duct)}}

    /* — ŚWIATŁA sceny — */
    const inLight=new THREE.PointLight(0x7fb0e8,1.0,120);
    inLight.position.set(-14,HH-8,HZ);G.add(inLight);
    const inLight2=new THREE.PointLight(0x66d9f0,.6,80);
    inLight2.position.set(-14,10,HZ+10);G.add(inLight2);

    /* — PAD P-M1: płyta + pasy + świecące listwy apron — */
    const plate=new THREE.Mesh(new THREE.BoxGeometry(5.2,.16,5.2),STEEL);
    plate.position.y=.08;G.add(plate);
    for(let k=0;k<10;k++){
      const t=-2.3+k*.51;
      const seg=new THREE.Mesh(new THREE.BoxGeometry(1.1,.02,.5),k%2?YEL:DARK);
      seg.position.set(t,.17,2.45);seg.rotation.y=.5;G.add(seg);
      const s2=seg.clone();s2.position.z=-2.45;G.add(s2);
      const s3=seg.clone();s3.position.set(2.45,.17,t);s3.rotation.y=.5+Math.PI/2;G.add(s3);
      const s4=s3.clone();s4.position.x=-2.45;G.add(s4)}
    for(const s of[-1,1]){const ap=new THREE.Mesh(new THREE.BoxGeometry(7,.06,.3),GLOWC);
      ap.position.set(0,.05,s*3.6);G.add(ap);
      const ap2=new THREE.Mesh(new THREE.BoxGeometry(.3,.06,7),GLOWC);
      ap2.position.set(s*3.6,.05,0);G.add(ap2)}
    const ringP=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),bas(0xe8500f));
    ringP.rotation.x=-Math.PI/2;ringP.position.y=.18;G.add(ringP);
    const hM=bas(0xe8ecef);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,.185,0);
    const h2=h1.clone();h2.position.x=.34;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.y=.185;
    G.add(h1,h2,h3);

    return {group:G, pad:{h:.18},
      animate(dt,t){
        arms.forEach((a,i)=>{
          a.pivot.rotation.y+=Math.sin(t*.6+a.ph)*.0025;
          a.upper.rotation.z=(i%2?-1:1)*(.7+Math.sin(t*.9+a.ph)*.18);
          a.elbow.rotation.z=(i%2?1:-1)*(1.5+Math.sin(t*1.2+a.ph)*.3)});
        gantry.position.x=Math.sin(t*.22)*38-14;
        agvs.forEach(a2=>{const u=a2.userData;u.ph+=dt*u.sp;
          a2.position.set(u.cx+Math.cos(u.ph)*u.rx,0,u.cz+Math.sin(u.ph)*u.rz);
          a2.rotation.y=-u.ph+Math.PI/2});
        chStrobe.visible=(t%1.6)<.14;
        strips[7].visible=(t%3.1)>.12;      // jedna świetlówka migocze
        // linia podwieszona: haki suną, zawracają
        hooks.forEach(h2=>{const u=(t*.05+h2.userData.off)%1;
          h2.position.set(-HW/2+8+u*(HW-16),pfY-.4,pfZ)});
        // iskry: błyski
        sparks.visible=(t%1.3)<.5&&(Math.sin(t*37)>0);
        sparks.rotation.z=t*9;
        // widlak: pętla prostokątna po placu
        {const u=(t*.05)%1;let px,pz2,ry;
         if(u<.3){px=-40+u/.3*70;pz2=26;ry=0}
         else if(u<.5){px=30;pz2=26-(u-.3)/.2*36;ry=-Math.PI/2}
         else if(u<.8){px=30-(u-.5)/.3*70;pz2=-10;ry=Math.PI}
         else{px=-40;pz2=-10+(u-.8)/.2*36;ry=Math.PI/2}
         fk2.position.set(px,0,pz2);fk2.rotation.y=ry}
        // szlaban: cykl otwarcia
        {const c=(t%9);const a2=c<2? c/2 : c<5? 1 : c<7? 1-(c-5)/2 : 0;
         gatePivot.rotation.z=a2*1.35}
        roofFans.forEach((f,i)=>f.rotation.y+=dt*(5+i));
        // pochodnia: płomień tańczy, dym się unosi
        flame.scale.set(.85+Math.sin(t*11)*.12,.9+Math.sin(t*7.3)*.16,.85+Math.cos(t*9)*.12);
        flame.rotation.y=Math.sin(t*3)*.14;
        flarePuffs.forEach(p2=>{const u=(t*.09+p2.userData.ph)%1;
          p2.position.set(-96+u*16,96+u*46,-150-u*8);
          p2.scale.setScalar(.7+u*2.4);
          p2.material.opacity=undefined;p2.visible=u<.94});
        mastStrobes.forEach((s2,i)=>s2.visible=((t+i*.35)%1.8)<.12);
        // ładunkowce po orbitach
        flyers.forEach(f=>{const u=f.userData;u.a+=dt*u.sp;
          f.position.set(Math.cos(u.a)*u.r,u.h+Math.sin(t*.5+u.h)*1.5,-60+Math.sin(u.a)*u.r*.6);
          f.rotation.y=-u.a+Math.PI/2});
        // reflektory omiatają
        beams.forEach((b2,i)=>{const sw=Math.sin(t*.24+b2.userData.ph+i)*.5;
          b2.rotation.z=sw;b2.rotation.x=Math.sin(t*.17+i)*.28});
        // warstwy mgły dryfują
        hazes.forEach(hz=>{const u=hz.userData;u.a+=dt*u.sp;
          hz.position.set(Math.cos(u.a)*u.r,u.h,-60+Math.sin(u.a)*u.r*.5)});
        // para: unosi się i rośnie
        puffs.forEach(p2=>{const u=(t*.12+p2.userData.ph)%1;
          p2.position.set(-146+u*4,38+u*14,-116-u*2);
          const s2=.6+u*1.8;p2.scale.setScalar(s2);
          p2.visible=u<.92});
      }};
  }
};
})(window);
