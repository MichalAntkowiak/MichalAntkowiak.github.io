/* MA//BIOME:FACTORY — Dolina fabryczna (MECHANIKA), dzień
   Hale szedowe, zazębione koła zębate, suwnica, taśmociąg, silosy,
   robot portalowy, rdzawe granie w tle. */
(function(root){
'use strict';
root.MABIOME_FACTORY={
  MAXALT:360,
  FOG_STOPS:[[0,0x0a0f16],[.15,0x223140],[.35,0x6d8093],[.6,0x94a3ab],[.85,0xb2ab9c],[1,0xc4b9a4]],
  SUN:{col:0xffe3c0,int:1.15},
  HEMI:{sky:0xcfe0ea,ground:0x8a7a66,int:.75},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.7,metalness:m??0});
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    const GRND=std(0xb9a98c,.95);       // ubita ziemia
    const ASPH=std(0x5b6066,.9);
    const STEEL=std(0x8d99a4,.45,.6);
    const STEEL2=std(0x6b7681,.5,.55);
    const RUST=std(0x9a5a34,.8,.2);
    const COPP=std(0xb87445,.5,.5);
    const HALL=std(0xd9dade,.6,.1);
    const HALL2=std(0xc9cdd2,.62,.1);
    const ROOF=std(0x77828c,.55,.3);
    const SKYL=std(0xbcd6de,.3,.2);     // świetlik
    const YEL =std(0xe0b13c,.6);
    const DARK=std(0x2b3238,.6,.3);

    let sd=11;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};

    /* — TEREN — */
    const terr=new THREE.Mesh(new THREE.PlaneGeometry(560,420),GRND);
    terr.rotation.x=-Math.PI/2;terr.name='terr';G.add(terr);
    const yard=new THREE.Mesh(new THREE.PlaneGeometry(210,150),ASPH);
    yard.rotation.x=-Math.PI/2;yard.position.set(0,.02,-20);yard.name='terr';G.add(yard);
    // pasy jezdne na placu
    for(let k=-2;k<=2;k++){const ln=new THREE.Mesh(new THREE.PlaneGeometry(180,.5),std(0xe8e4d8,.8));
      ln.rotation.x=-Math.PI/2;ln.position.set(0,.03,-20+k*28);ln.name='terr';G.add(ln)}

    /* — GRANIE RDZAWE (3 plany silhouette) — */
    function ridge(w,h,z,mat,seed){
      const g=new THREE.PlaneGeometry(w,h,46,6);
      const P=g.attributes.position;
      for(let i=0;i<P.count;i++){
        const x=P.getX(i),y=P.getY(i);
        const rl=1-Math.abs(Math.sin(x*.013+seed))*.9;
        let e=(y/h+.5);
        P.setY(i, y + (rl*h*.5)*e - h*.18 + Math.sin(x*.09+seed*3)*2.2*e);
      }
      g.computeVertexNormals();
      const m=new THREE.Mesh(g,mat);m.position.set(0,h*.28,z);G.add(m);return m}
    ridge(760,120,-208,std(0xcabfa8,.9),2.0);   // najdalsza, wypłowiała
    ridge(680,96,-186,RUST,5.5);
    ridge(620,72,-166,std(0x7d4a2c,.85),9.0);

    /* — HALA GŁÓWNA z dachem szedowym — */
    function hall(x,z,w,d,h,teeth,rot){
      const grp=new THREE.Group();grp.position.set(x,0,z);grp.rotation.y=rot||0;G.add(grp);
      const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),rnd()<.5?HALL:HALL2);
      body.position.y=h/2;grp.add(body);
      // cokół + pas
      const base=new THREE.Mesh(new THREE.BoxGeometry(w+.4,1.2,d+.4),STEEL2);
      base.position.y=.6;grp.add(base);
      const band=new THREE.Mesh(new THREE.BoxGeometry(w+.1,.5,d+.1),YEL);
      band.position.y=h-.6;grp.add(band);
      // szedy: trójkątne segmenty z pochyłym świetlikiem
      const tw=w/teeth;
      for(let k=0;k<teeth;k++){
        const px=-w/2+tw*(k+.5);
        const rf=new THREE.Mesh(new THREE.BoxGeometry(tw*1.02,.4,d+.2),ROOF);
        rf.position.set(px- tw*.12,h+1.1,0);rf.rotation.z=.42;grp.add(rf);
        const sk=new THREE.Mesh(new THREE.BoxGeometry(.3,2.1,d*.9),SKYL);
        sk.position.set(px+tw*.34,h+1.05,0);grp.add(sk)}
      // brama + okna pasmowe
      const door=new THREE.Mesh(new THREE.BoxGeometry(w*.32,h*.55,.3),DARK);
      door.position.set(0,h*.28,d/2+.14);grp.add(door);
      for(const s of[-1,1]){const win=new THREE.Mesh(new THREE.BoxGeometry(w*.8,1.1,.12),SKYL);
        win.position.set(0,h*.72,s*(d/2+.05));grp.add(win)}
      return grp}
    hall(-52,-96,60,34,16,6);
    hall(46,-104,48,30,13,5,.06);
    hall(-6,-52,34,22,9,4,-.04);
    hall(96,-58,26,18,8,3,.1);

    /* — KOŁA ZĘBATE (zazębione, na stalowej ramie) — */
    function gear(r,thick,teeth,mat){
      const g2=new THREE.Group();
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(r,r,thick,24),mat);
      disc.rotation.x=Math.PI/2;g2.add(disc);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.22,r*.22,thick*1.6,12),DARK);
      hub.rotation.x=Math.PI/2;g2.add(hub);
      for(let k=0;k<teeth;k++){const a=k/teeth*Math.PI*2;
        const t=new THREE.Mesh(new THREE.BoxGeometry(r*.24,thick,r*.2),mat);
        t.position.set(Math.cos(a)*(r+r*.1),0,0);
        t.position.z=Math.sin(a)*(r+r*.1);
        // uwaga: koło leży w płaszczyźnie XZ po rotacji — zęby w XY koła:
        t.position.set(Math.cos(a)*(r+r*.1),Math.sin(a)*(r+r*.1),0);
        t.rotation.z=a;g2.add(t)}
      return g2}
    const gearWall=new THREE.Group();gearWall.position.set(-104,0,-40);G.add(gearWall);
    const frame=new THREE.Mesh(new THREE.BoxGeometry(2.2,26,3),STEEL2);
    frame.position.y=13;gearWall.add(frame);
    const gearA=gear(7.5,1.6,12,COPP); gearA.position.set(0,9,2.4); gearA.userData.dyn=true;gearWall.add(gearA);
    const gearB=gear(4.6,1.6,8,STEEL); gearB.position.set(11.2,13.2,2.4);gearB.userData.dyn=true;gearWall.add(gearB);
    const gearC=gear(3.2,1.6,7,RUST);  gearC.position.set(-9.2,16.4,2.4);gearC.userData.dyn=true;gearWall.add(gearC);
    const frame2=frame.clone();frame2.position.set(11.2,13,0);gearWall.add(frame2);

    /* — SUWNICA BRAMOWA nad placem — */
    const crane=new THREE.Group();crane.position.set(0,0,-20);G.add(crane);
    for(const e of[-1,1]){
      const legA=new THREE.Mesh(new THREE.BoxGeometry(1.2,22,1.2),YEL);
      legA.position.set(e*46,11,7);crane.add(legA);
      const legB=legA.clone();legB.position.z=-7;crane.add(legB);
      const cross=new THREE.Mesh(new THREE.BoxGeometry(1,1,15),YEL);
      cross.position.set(e*46,21,0);crane.add(cross)}
    const beam=new THREE.Mesh(new THREE.BoxGeometry(94,1.8,2.6),YEL);
    beam.position.y=22.6;crane.add(beam);
    const trolley=new THREE.Group();trolley.userData.dyn=true;trolley.position.set(-20,21.4,0);crane.add(trolley);
    const tb=new THREE.Mesh(new THREE.BoxGeometry(4,1.6,3.4),DARK);trolley.add(tb);
    const cable=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,9,6),DARK);
    cable.position.y=-5.3;trolley.add(cable);
    const hook=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.4,2.2),RUST);
    hook.position.y=-10.4;trolley.add(hook);

    /* — TAŚMOCIĄG + skrzynie — */
    const conv=new THREE.Group();conv.position.set(-10,0,18);G.add(conv);
    const belt=new THREE.Mesh(new THREE.BoxGeometry(120,.5,3.4),DARK);
    belt.position.y=2.2;conv.add(belt);
    for(let x=-56;x<=56;x+=8){
      const leg=new THREE.Mesh(new THREE.BoxGeometry(.5,2,3.8),STEEL2);
      leg.position.set(x,1,0);conv.add(leg)}
    const crates=[];
    for(let i=0;i<6;i++){
      const c=new THREE.Mesh(new THREE.BoxGeometry(2.6,2.2,2.6),i%2?std(0xc98a3a,.7):std(0x8aa06a,.7));
      c.userData.dyn=true;c.position.set(-55+i*20,3.6,0);conv.add(c);crates.push(c)}

    /* — SILOSY — */
    for(const [sx,sz,sr,sh] of [[128,-96,6,26],[143,-92,5,22],[114,-90,4.5,19]]){
      const s=new THREE.Mesh(new THREE.CylinderGeometry(sr,sr,sh,18),HALL);
      s.position.set(sx,sh/2,sz);G.add(s);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(sr,16,8,0,Math.PI*2,0,Math.PI/2),STEEL);
      cap.position.set(sx,sh,sz);G.add(cap);
      const lad=new THREE.Mesh(new THREE.BoxGeometry(.5,sh,.2),STEEL2);
      lad.position.set(sx+sr+.1,sh/2,sz);G.add(lad);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(sr+.05,.12,6,20),RUST);
      ring.rotation.x=Math.PI/2;ring.position.set(sx,sh*.4,sz);G.add(ring)}

    /* — ROBOT PORTALOWY — */
    const robot=new THREE.Group();robot.position.set(64,0,10);G.add(robot);
    const col1=new THREE.Mesh(new THREE.BoxGeometry(1.6,14,1.6),STEEL);col1.position.set(-9,7,0);robot.add(col1);
    const col2=col1.clone();col2.position.x=9;robot.add(col2);
    const rail=new THREE.Mesh(new THREE.BoxGeometry(20,1.2,1.8),STEEL2);rail.position.y=14.2;robot.add(rail);
    const carr=new THREE.Group();carr.userData.dyn=true;carr.position.set(0,13.4,0);robot.add(carr);
    const cb=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.6,2.4),COPP);carr.add(cb);
    const zax=new THREE.Mesh(new THREE.BoxGeometry(1,8,1),DARK);zax.position.y=-4.4;carr.add(zax);
    const grip=new THREE.Mesh(new THREE.BoxGeometry(2.2,1,1.6),YEL);grip.position.y=-8.8;carr.add(grip);

    /* — MOST KRATOWNICOWY nad suchym kanałem — */
    const chan=new THREE.Mesh(new THREE.PlaneGeometry(560,14),std(0x8f8570,.9));
    chan.rotation.x=-Math.PI/2;chan.position.set(0,.015,52);chan.name='terr';G.add(chan);
    const bridge=new THREE.Group();bridge.position.set(-70,0,52);G.add(bridge);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(26,.8,6),STEEL2);deck.position.y=3.4;bridge.add(deck);
    for(const s of[-1,1]){
      const top=new THREE.Mesh(new THREE.BoxGeometry(26,.5,.5),RUST);
      top.position.set(0,7.4,s*2.7);bridge.add(top);
      for(let k=0;k<6;k++){
        const dg=new THREE.Mesh(new THREE.BoxGeometry(.4,5.4,.4),RUST);
        dg.position.set(-11+k*4.4,5.4,s*2.7);dg.rotation.z=(k%2?1:-1)*.55;bridge.add(dg)}
      for(const px of[-13,13]){const post=new THREE.Mesh(new THREE.BoxGeometry(.5,4.4,.5),RUST);
        post.position.set(px,5.4,s*2.7);bridge.add(post)}}
    for(const px of[-11,0,11]){const pier=new THREE.Mesh(new THREE.BoxGeometry(1.6,3,5),std(0x9a9381,.85));
      pier.position.set(px,1.5,0);bridge.add(pier)}

    /* — KOMIN + strobo — */
    const chim=new THREE.Mesh(new THREE.CylinderGeometry(2.2,3,34,14),std(0xb9634a? 0xa85a40:0xa85a40,.75));
    chim.position.set(-140,17,-92);G.add(chim);
    for(const bh of[10,20,30]){const br=new THREE.Mesh(new THREE.TorusGeometry(2.5- bh*.012,.18,6,18),DARK);
      br.rotation.x=Math.PI/2;br.position.set(-140,bh,-92);G.add(br)}
    const chStrobe=new THREE.Mesh(new THREE.SphereGeometry(.6,8,6),bas(0xff3b30));
    chStrobe.userData.dyn=true;chStrobe.position.set(-140,34.8,-92);G.add(chStrobe);

    /* — PROPSY przy padzie: palety, beczki, wózek — */
    function pallet(x,z){const p=new THREE.Mesh(new THREE.BoxGeometry(3,.5,3),std(0xb08a56,.85));
      p.position.set(x,.27,z);G.add(p);
      const l=new THREE.Mesh(new THREE.BoxGeometry(3,.9,2.4),std(0xc9c2b2,.8));
      l.position.set(x,1,z);G.add(l)}
    pallet(9,10);pallet(13,10);pallet(11,14);
    for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,2,12),
      i%2?std(0x33628f,.5,.3):RUST);
      b.position.set(-12+ (i%3)*2.1,1,12+Math.floor(i/3)*2.2);G.add(b)}

    /* — PAD P-M1: stalowa płyta z pasami ostrzegawczymi — */
    const plate=new THREE.Mesh(new THREE.BoxGeometry(5.2,.16,5.2),STEEL);
    plate.position.y=.08;G.add(plate);
    for(let k=0;k<10;k++){
      const seg=new THREE.Mesh(new THREE.BoxGeometry(1.1,.02,.5),k%2?YEL:DARK);
      const t=-2.3+k*.51;
      seg.position.set(t,.17,2.45);seg.rotation.y=.5;G.add(seg);
      const s2=seg.clone();s2.position.z=-2.45;G.add(s2);
      const s3=seg.clone();s3.position.set(2.45,.17,t);s3.rotation.y=.5+Math.PI/2;G.add(s3);
      const s4=s3.clone();s4.position.x=-2.45;G.add(s4)}
    const ringP=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),bas(0xe8500f));
    ringP.rotation.x=-Math.PI/2;ringP.position.y=.18;G.add(ringP);
    const hM=bas(0xe8ecef);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,.185,0);
    const h2=h1.clone();h2.position.x=.34;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.y=.185;
    G.add(h1,h2,h3);

    return {group:G, pad:{h:.18},
      animate(dt,t){
        gearA.rotation.z+=dt*.5;
        gearB.rotation.z-=dt*.5*(7.5/4.6);
        gearC.rotation.z-=dt*.5*(7.5/3.2);
        trolley.position.x=Math.sin(t*.32)*30;
        carr.position.x=Math.sin(t*.6)*6;
        crates.forEach(c=>{c.position.x+=6*dt;if(c.position.x>58)c.position.x=-58});
        chStrobe.visible=(t%1.6)<.14;
      }};
  }
};
})(window);
