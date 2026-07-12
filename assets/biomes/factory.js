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
      }};
  }
};
})(window);
