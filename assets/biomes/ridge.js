/* MA//BIOME:RIDGE → PODNIEBNY ARCHIPELAG (DOŚWIADCZENIE)
   Latające wyspy w lawendowo-turkusowym zmierzchu: każda wyspa = etap drogi.
   Zjazd od szczytowej wyspy (studia) w dół osi czasu, lądowanie na wyspie-bazie.
   Wodospady w pustkę, mosty linowe, tyrolka, sterowiec kurierski, chmury, ptaki. */
(function(root){
'use strict';
root.MABIOME_RIDGE={
  MAXALT:320,
  FOG_STOPS:[[0,0x0c0a20],[.16,0x241a48],[.36,0x453a78],[.56,0x5f6aa0],[.76,0x6f9ab0],[1,0x86c2bc]],
  SUN:{col:0xffc9a0,int:1.0},
  HEMI:{sky:0x8a9ad0,ground:0x3a4a6a,int:.85},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m,e,ei)=>{const M=new THREE.MeshStandardMaterial({color:c,roughness:r??.8,metalness:m??0});
      if(e){M.emissive=new THREE.Color(e);M.emissiveIntensity=ei??.7}return M};
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    let sd=33;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};

    const ROCK=std(0x6a5a7e,.95), ROCK2=std(0x5a4a70,.95), ROCKD=std(0x453a5e,.95);
    const GRASS=std(0x63b08a,.9), GRASS2=std(0x54a07c,.9);
    const WOOD=std(0x8a6238,.85), WOOD2=std(0x6f4d26,.85);
    const WHITE=std(0xe9e4d8,.6), SLATE=std(0x46506a,.7);
    const BRICK=std(0xc07a5e,.8), ORANGE=std(0xe8500f,.5);
    const GOLDL=bas(0xffd990);
    const LEAF=std(0x4e9a6a,.9), LEAF2=std(0x3f8a5c,.9);

    /* ── BUDULEC WYSPY: spód-sopel + trawiasty blat + klify ── */
    function chunk(mat,sx,sy,sz2){
      const g=new THREE.IcosahedronGeometry(1,0);const P=g.attributes.position;
      for(let i=0;i<P.count;i++)P.setXYZ(i,
        P.getX(i)*(0.72+rnd()*.5),P.getY(i)*(0.6+rnd()*.5),P.getZ(i)*(0.72+rnd()*.5));
      g.computeVertexNormals();
      const m=new THREE.Mesh(g,mat);m.scale.set(sx,sy,sz2);return m}
    function island(x,y,z,rad){
      const I=new THREE.Group();I.position.set(x,y,z);G.add(I);
      // blat
      const top=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad*1.04,1.1,12),GRASS);
      top.position.y=-.55;I.add(top);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(rad*1.04,rad*.9,1.6,12),ROCK);
      rim.position.y=-1.9;I.add(rim);
      // sopel spodni z brył — zawsze PONIŻEJ blatu (margines na skalę bryły)
      let ry=-3.2, rr=rad*.86;
      while(rr>rad*.18){
        const n=Math.max(3,Math.floor(rr*.8));
        const vs=rr*.36;                        // pion bryły ograniczony
        for(let k=0;k<n;k++){const a=k/n*Math.PI*2+ry;
          const c=chunk(k%2?ROCK2:ROCKD,rr*.5,vs,rr*.5);
          c.position.set(Math.cos(a)*rr*.5,ry-vs*.55,Math.sin(a)*rr*.5);
          c.rotation.y=rnd()*3;                 // bez przechyłów pion-łamiących
          I.add(c)}
        ry-=vs*1.35;rr*=.66}
      const tip=chunk(ROCKD,rad*.2,rad*.34,rad*.2);tip.position.y=ry;I.add(tip);
      // kępy trawy na krawędzi
      for(let k=0;k<Math.floor(rad*1.6);k++){
        const a=rnd()*Math.PI*2, r2=rad*(.55+rnd()*.4);
        const bl=new THREE.Mesh(new THREE.ConeGeometry(.09,.7+rnd()*.5,4),k%2?LEAF:GRASS2);
        bl.position.set(Math.cos(a)*r2,.35,Math.sin(a)*r2);
        bl.rotation.z=(rnd()-.5)*.3;I.add(bl)}
      // zwisające pnącza
      for(let k=0;k<4;k++){const a=rnd()*Math.PI*2;
        const v=new THREE.Mesh(new THREE.CylinderGeometry(.05,.02,2+rnd()*2,4),LEAF2);
        v.position.set(Math.cos(a)*rad*.98,-1.6-v.geometry.parameters.height/2+1,Math.sin(a)*rad*.98);
        I.add(v)}
      return I}

    /* wodospad z krawędzi wyspy w pustkę (animowane pasy + mgiełka) */
    const falls=[];
    const WATER=std(0x8ec6ea,.25,.1,0x4f92c9,.45);
    const FOAM =std(0xe8f4fb,.5);
    function waterfall(I,a,rad){
      const cx=Math.cos(a), cz=Math.sin(a);
      const x=cx*rad*.93, z=cz*rad*.93;
      // strumień na blacie prowadzący do krawędzi
      const creek=new THREE.Mesh(new THREE.BoxGeometry(1.5,.06,rad*.5),WATER);
      creek.position.set(cx*rad*.66,.14,cz*rad*.66);creek.rotation.y=-a+Math.PI/2;I.add(creek);
      const pool=new THREE.Mesh(new THREE.CircleGeometry(1.9,12),WATER);
      pool.rotation.x=-Math.PI/2;pool.position.set(cx*rad*.42,.13,cz*rad*.42);I.add(pool);
      // PRZELEW przez krawędź: łagodny łuk (cylinder ćwiartka) — łączy blat ze strugą
      const spill=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,1.4,10,1,false,0,Math.PI/2),WATER);
      spill.rotation.z=Math.PI/2;spill.rotation.y=-a+Math.PI/2;
      spill.position.set(x,-.35,z);I.add(spill);
      const foamTop=new THREE.Mesh(new THREE.BoxGeometry(1.5,.2,.5),FOAM);
      foamTop.position.set(x,.06,z);foamTop.rotation.y=-a+Math.PI/2;I.add(foamTop);
      // struga: wąskie, przenikające pasy (nie „deska”)
      for(let i=0;i<5;i++){
        const w2=.95-i*.06;
        const st=new THREE.Mesh(new THREE.BoxGeometry(w2,3.4,.1),WATER);
        st.userData.dyn=true;
        st.position.set(x+(i%2?.22:-.22),-1.6-i*3.4,z);
        st.rotation.y=-a+Math.PI/2;
        I.add(st);falls.push({m:st,top:-1.6,span:17})}
      // rozpylenie u dołu
      for(let k=0;k<3;k++){
        const mist=new THREE.Mesh(new THREE.SphereGeometry(.85+k*.35,8,6),
          new THREE.MeshStandardMaterial({color:0xdfeef8,roughness:1,
            transparent:true,opacity:.34-k*.08,depthWrite:false}));
        mist.scale.y=.5;mist.position.set(x,-16.4-k*1.5,z);I.add(mist)}}

    /* drzewko */
    function tree(I,x,z,s){
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(.14*s,.2*s,1.2*s,6),WOOD);
      tr.position.set(x,.6*s,z);I.add(tr);
      const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1*s,0),rnd()<.5?LEAF:LEAF2);
      cr.position.set(x,1.8*s,z);I.add(cr)}
    /* latarnia złota */
    const lamps=[];
    function lamp(I,x,z){
      const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,2.2,6),SLATE);
      p.position.set(x,1.1,z);I.add(p);
      const g2=new THREE.Mesh(new THREE.SphereGeometry(.26,8,6),GOLDL);
      g2.userData.dyn=true;g2.position.set(x,2.5,z);I.add(g2);lamps.push(g2)}

    /* ── WYSPY: baza (pad) + 4 kamienie milowe, w łuku widoczności ── */
    const BASE = island(0,0,0,15);
    const I1 = island(-30,58,-34,11);      // LICEUM
    const I2 = island( 30,118,-40,11);     // KURIER
    const I3 = island(-26,178,-38,11);     // KOREPETYCJE
    const I4 = island( 18,238,-44,12);     // PW+ONYKS
    const ISLES=[[BASE,15],[I1,11],[I2,11],[I3,11],[I4,12]];

    /* ── MOSTY LINOWE między kolejnymi wyspami ── */
    function ropeBridge(A,B){
      const p1=new THREE.Vector3(),p2=new THREE.Vector3();
      A[0].getWorldPosition(p1);B[0].getWorldPosition(p2);
      // punkty krawędzi zwrócone ku sobie
      const dir=p2.clone().sub(p1);dir.y=0;dir.normalize();
      const e1=p1.clone().addScaledVector(dir,A[1]*.9);
      const e2=p2.clone().addScaledVector(dir,-B[1]*.9);
      const d=e2.clone().sub(e1);const len=d.length();
      const br=new THREE.Group();G.add(br);
      br.position.copy(e1.clone().lerp(e2,.5));
      br.rotation.y=-Math.atan2(d.z,d.x);
      br.rotation.z=Math.atan2(e2.y-e1.y,Math.hypot(d.x,d.z));
      const planks=Math.max(9,Math.floor(len/2.4));
      for(let k=0;k<planks;k++){
        const t=k/(planks-1)-.5;
        const sag=Math.cos(t*Math.PI)*-len*.05;
        const pl=new THREE.Mesh(new THREE.BoxGeometry(len/planks*.8,.14,1.5),WOOD2);
        pl.position.set(t*len,sag,0);br.add(pl)}
      for(const sgn of[-1,1]){
        const rope=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,len,5),WOOD2);
        rope.rotation.z=Math.PI/2;rope.position.set(0,.65,sgn*.75);br.add(rope);
        for(let k=1;k<planks;k+=2){const t=k/(planks-1)-.5;
          const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.1,5),WOOD);
          post.position.set(t*len,Math.cos(t*Math.PI)*-len*.05+.55,sgn*.75);br.add(post)}}
      // latarenki na linach mostu
      for(const q of[-.28,.28]){
        const lg=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),GOLDL);
        lg.userData.dyn=true;
        lg.position.set(q*len,Math.cos(q*Math.PI)*-len*.05+.95,.75);
        br.add(lg);lamps.push(lg)}
      // pylony bramek na końcach
      for(const [I,rad,sgn] of [[A[0],A[1],1],[B[0],B[1],-1]]){
        const gate=new THREE.Group();
        const gx=dir.x*rad*.86*sgn, gz=dir.z*rad*.86*sgn;
        gate.position.set(gx,0,gz);gate.rotation.y=-Math.atan2(d.z,d.x)+Math.PI/2;
        I.add(gate);
        for(const s2 of[-1,1]){const py=new THREE.Mesh(new THREE.BoxGeometry(.4,2.6,.4),WOOD);
          py.position.set(s2*1.1,1.3,0);gate.add(py)}
        const top=new THREE.Mesh(new THREE.BoxGeometry(3,.3,.4),WOOD2);
        top.position.y=2.6;gate.add(top)}}
    ropeBridge(ISLES[0],ISLES[1]);
    ropeBridge(ISLES[1],ISLES[2]);
    ropeBridge(ISLES[2],ISLES[3]);
    ropeBridge(ISLES[3],ISLES[4]);

    /* ── TYROLKA I4 → I2 (lina + sunący wózek z paczką) ── */
    const zipA=new THREE.Vector3(18+7,238+3.4,-44),
          zipB=new THREE.Vector3(30-6,118+3.2,-40);
    {const d=zipB.clone().sub(zipA);
     const line=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,d.length(),5),SLATE);
     line.position.copy(zipA.clone().lerp(zipB,.5));
     line.lookAt(zipB);line.rotateX(Math.PI/2);G.add(line);
     for(const [I,pos] of [[I4,zipA],[I2,zipB]]){
       const lp=new THREE.Vector3();I.getWorldPosition(lp);
       const m=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,3.4,6),WOOD);
       m.position.set(pos.x-lp.x,1.7,pos.z-lp.z);I.add(m)}}
    const zipCart=new THREE.Group();zipCart.userData.dyn=true;zipCart.position.copy(zipA);G.add(zipCart);
    {const wheel=new THREE.Mesh(new THREE.TorusGeometry(.22,.06,6,10),SLATE);
     zipCart.add(wheel);
     const rod=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1,5),SLATE);
     rod.position.y=-.55;zipCart.add(rod);
     const pack=new THREE.Mesh(new THREE.BoxGeometry(.9,.7,.7),ORANGE);
     pack.position.y=-1.25;zipCart.add(pack)}

    /* ── ZABUDOWA WYSP ── */
    /* I1: LICEUM — ceglany budynek, zegar, płotek, stos książek */
    {const I=I1;
     const b=new THREE.Mesh(new THREE.BoxGeometry(8,4.6,5.6),BRICK);b.position.set(0,2.3,-1);I.add(b);
     const roofG=new THREE.BufferGeometry();
     const hw=4.4,hd=3.2,rh=2.2;
     const v=new Float32Array([-hw,0,-hd,hw,0,-hd,0,rh,-hd, -hw,0,hd,0,rh,hd,hw,0,hd,
       -hw,0,-hd,-hw,0,hd,0,rh,hd, -hw,0,-hd,0,rh,hd,0,rh,-hd,
        hw,0,-hd,0,rh,-hd,0,rh,hd, hw,0,-hd,0,rh,hd,hw,0,hd]);
     roofG.setAttribute('position',new THREE.BufferAttribute(v,3));roofG.computeVertexNormals();
     const roof=new THREE.Mesh(roofG,SLATE);roof.position.set(0,4.6,-1);I.add(roof);
     const clock=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.16,12),WHITE);
     clock.rotation.x=Math.PI/2;clock.position.set(0,5.6,1.9);I.add(clock);
     const door=new THREE.Mesh(new THREE.BoxGeometry(1.2,2,.2),WOOD);door.position.set(0,1,1.85);I.add(door);
     for(const wx of[-2.6,2.6]){const w=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,.14),std(0xcfe2ea,.4,.2));
       w.position.set(wx,2.6,1.83);I.add(w)}
     for(let k=0;k<6;k++){const fp=new THREE.Mesh(new THREE.BoxGeometry(.14,.9,.14),WHITE);
       fp.position.set(-4.5+k*1.8,.45,3.6);I.add(fp)}
     const frail=new THREE.Mesh(new THREE.BoxGeometry(9.2,.1,.1),WHITE);
     frail.position.set(0,.85,3.6);I.add(frail);
     const books=new THREE.Group();books.position.set(4.2,0,2.2);I.add(books);
     [[0xc0605e,.0],[0x5e8ac0,.12],[0x6ab07a,.22]].forEach(([c2,dy],i)=>{
       const bk=new THREE.Mesh(new THREE.BoxGeometry(1.2-i*.12,.28,.9-i*.08),std(c2,.7));
       bk.position.y=.14+i*.3;bk.rotation.y=dy*3;books.add(bk)});
     tree(I,-4.6,2.4,1.1);lamp(I,3.2,3.4)}

    /* I2: KURIER — maszt dokowy, sterowiec (animowany), skrzynie, zsyp paczek */
    let airship;
    {const I=I2;
     const mast=new THREE.Mesh(new THREE.CylinderGeometry(.2,.3,7,8),SLATE);
     mast.position.set(-2,3.5,-2);I.add(mast);
     const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.09,6,12),ORANGE);
     ring.position.set(-2,6.8,-2);I.add(ring);
     airship=new THREE.Group();airship.userData.dyn=true;
     airship.position.set(2.5,9,-2);I.add(airship);
     const env=new THREE.Mesh(new THREE.SphereGeometry(2.6,12,8),ORANGE);
     env.scale.set(1.6,1,1);airship.add(env);
     const strp=new THREE.Mesh(new THREE.SphereGeometry(2.62,12,8,0,Math.PI*2,1.2,.5),WHITE);
     strp.scale.set(1.6,1,1);airship.add(strp);
     const gond=new THREE.Mesh(new THREE.BoxGeometry(2.6,1,1.2),WOOD);
     gond.position.y=-3;airship.add(gond);
     for(const e of[-1,1]){const fin=new THREE.Mesh(new THREE.BoxGeometry(.14,1,1.6),WHITE);
       fin.position.set(-4,e*.4,0);fin.rotation.x=e*.6;airship.add(fin)}
     const tow=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,3.6,4),SLATE);
     tow.position.set(-3.2,-1.4,0);tow.rotation.z=.9;airship.add(tow);
     for(let i=0;i<5;i++){const c2=new THREE.Mesh(new THREE.BoxGeometry(1.3,1,1.1),
       i%2?std(0x9a6a3a,.8):WOOD2);
       c2.position.set(2+(i%3)*1.5,.5+Math.floor(i/3)*1.05,2.2);c2.rotation.y=i*.25;I.add(c2)}
     const chute=new THREE.Mesh(new THREE.BoxGeometry(.9,4,.7),SLATE);
     chute.position.set(-4.5,1.6,2.4);chute.rotation.z=.5;I.add(chute);
     const pack2=new THREE.Mesh(new THREE.BoxGeometry(.8,.7,.6),ORANGE);
     pack2.position.set(-5.9,.4,2.9);I.add(pack2);
     tree(I,4.6,-3.4,.9);lamp(I,-4.2,-3.2)}

    /* I3: KOREPETYCJE — amfiteatr ławek, tablica, huśtawka na drzewie */
    let swing;
    {const I=I3;
     const board=new THREE.Mesh(new THREE.BoxGeometry(5.6,3,.24),std(0x2c4438,.8));
     board.position.set(0,2.4,-3.4);I.add(board);
     const frame3=new THREE.Mesh(new THREE.BoxGeometry(6.1,3.5,.14),WOOD);
     frame3.position.set(0,2.4,-3.55);I.add(frame3);
     for(const [lx,ly,lw] of[[-1.5,3,2.2],[-1.1,2.4,1.5],[.8,2.9,1.7],[1.2,2.0,2.0],[-.2,1.6,1.3]]){
       const ch=new THREE.Mesh(new THREE.BoxGeometry(lw,.11,.05),WHITE);
       ch.position.set(lx,ly,-3.26);ch.rotation.z=(rnd()-.5)*.2;I.add(ch)}
     for(const [px,pz] of[[-2.4,-3.4],[2.4,-3.4]]){
       const leg=new THREE.Mesh(new THREE.BoxGeometry(.26,2,.26),WOOD);
       leg.position.set(px,1,pz);I.add(leg)}
     for(let row=0;row<2;row++){
       const arc=2.4+row*2.1;
       for(let k=0;k<3;k++){const a=(-.5+k*.5);
         const bench=new THREE.Mesh(new THREE.BoxGeometry(2.6,.26,.8),WOOD);
         bench.position.set(Math.sin(a)*arc,(row===0?.7:1.0),Math.cos(a)*arc*.8-.4);
         bench.rotation.y=-a;I.add(bench);
         for(const e of[-1,1]){const bl=new THREE.Mesh(new THREE.BoxGeometry(.24,(row===0?.7:1.0),.7),WOOD2);
           bl.position.set(Math.sin(a)*arc+Math.cos(a)*e*1.05,(row===0?.35:.5),Math.cos(a)*arc*.8-.4-Math.sin(a)*e*1.05*.2);
           bl.rotation.y=-a;I.add(bl)}}}
     const tr=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,3,7),WOOD);
     tr.position.set(4.6,1.5,1.6);I.add(tr);
     const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(2.1,0),LEAF);
     cr.position.set(4.6,3.8,1.6);I.add(cr);
     const branch=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,2.2,6),WOOD);
     branch.rotation.z=Math.PI/2;branch.position.set(3.3,3.1,1.6);I.add(branch);
     swing=new THREE.Group();swing.userData.dyn=true;swing.position.set(2.6,3.1,1.6);I.add(swing);
     for(const e of[-.35,.35]){const rp=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.7,4),WOOD2);
       rp.position.set(e,-0.85,0);swing.add(rp)}
     const seat=new THREE.Mesh(new THREE.BoxGeometry(1,.1,.4),WOOD2);
     seat.position.y=-1.7;swing.add(seat);
     lamp(I,-4.4,1.8)}

    /* I4: PW+ONYKS — fronton kolumnowy, proporzec, pomnik-zębatka, teleskop */
    let flag;
    {const I=I4;
     const pod=new THREE.Mesh(new THREE.BoxGeometry(11,1.2,7.5),WHITE);
     pod.position.set(0,.6,-1);I.add(pod);
     const body=new THREE.Mesh(new THREE.BoxGeometry(9,5,5.4),std(0xd9cdb8,.7));
     body.position.set(0,3.6,-1.4);I.add(body);
     for(const cx3 of[-3.4,-1.15,1.15,3.4]){
       const col=new THREE.Mesh(new THREE.CylinderGeometry(.42,.46,4.4,10),WHITE);
       col.position.set(cx3,3.3,1.4);I.add(col)}
     const arch=new THREE.Mesh(new THREE.BoxGeometry(10.2,1,6.4),WHITE);
     arch.position.set(0,5.9,-1.1);I.add(arch);
     const tg=new THREE.BufferGeometry();
     const tv=new Float32Array([-5.1,0,0, 5.1,0,0, 0,1.9,0]);
     tg.setAttribute('position',new THREE.BufferAttribute(tv,3));tg.computeVertexNormals();
     const tym=new THREE.Mesh(tg,std(0xd9cdb8,.7));
     tym.position.set(0,6.4,2.0);I.add(tym);
     const doorU=new THREE.Mesh(new THREE.BoxGeometry(1.8,3,.24),SLATE);
     doorU.position.set(0,2.4,1.35);I.add(doorU);
     const mast=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,7,7),WHITE);
     mast.position.set(5.8,3.5,1.4);I.add(mast);
     flag=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.2,.07),ORANGE);
     flag.userData.dyn=true;flag.position.set(7.2,6.4,1.4);I.add(flag);
     // pomnik: zębatka na cokole
     const ped=new THREE.Mesh(new THREE.BoxGeometry(1.6,1,1.6),SLATE);
     ped.position.set(-5.4,.5,2.4);I.add(ped);
     const gear=new THREE.Group();gear.userData.dyn=true;gear.position.set(-5.4,2.1,2.4);I.add(gear);
     const disc=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.3,14),std(0xb87445,.5,.5));
     disc.rotation.x=Math.PI/2;gear.add(disc);
     for(let k=0;k<8;k++){const a=k/8*Math.PI*2;
       const tth=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.3),std(0xb87445,.5,.5));
       tth.position.set(Math.cos(a)*1.1,Math.sin(a)*1.1,0);gear.add(tth)}
     I.userData.gear=gear;
     // teleskop
     const tp=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,1.4,6),SLATE);
     tp.position.set(4.6,.7,-4.2);I.add(tp);
     const tube=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,1.8,8),WHITE);
     tube.rotation.x=-.7;tube.position.set(4.6,1.8,-4.6);I.add(tube);
     tree(I,-4.8,-3.8,1.0);lamp(I,2.2,3.8)}

    /* wodospady i drzewka rozrzucone */
    waterfall(BASE,3.9,15); waterfall(I2,0.6,11); waterfall(I3,3.8,11);
    tree(BASE,-8,4,1.3); tree(BASE,9,-6,1.1); tree(BASE,5,8,.9);
    tree(I1,3.8,-3.6,.8); tree(I4,-2,4.6,.8);

    /* ── WYSPA-BAZA: pad, staw, drogowskaz, kwiaty ── */
    {const pond=new THREE.Mesh(new THREE.CircleGeometry(4.2,16),std(0x3a6a9a,.3,.3));
     pond.rotation.x=-Math.PI/2;pond.position.set(-7,.05,3);BASE.add(pond);
     const rim=new THREE.Mesh(new THREE.TorusGeometry(4.3,.28,6,18),ROCK2);
     rim.rotation.x=-Math.PI/2;rim.position.set(-7,.16,3);BASE.add(rim);
     for(let i=0;i<14;i++){const a=rnd()*Math.PI*2,r2=6+rnd()*7;
       const fl=new THREE.Mesh(new THREE.SphereGeometry(.14,6,4),
         bas(i%3===0?0xe8709a:i%3===1?0xf0c95a:0xc9a8f0));
       fl.position.set(Math.cos(a)*r2,.35,Math.sin(a)*r2+2);BASE.add(fl)}
     const post=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,2.8,7),WOOD);
     post.position.set(6.6,1.4,5.2);BASE.add(post);
     [[2.4,1],[1.9,-1],[1.4,1]].forEach(([py,sgn],i)=>{
       const ar=new THREE.Mesh(new THREE.BoxGeometry(2,.36,.1),i%2?WHITE:ORANGE);
       ar.position.set(6.6+sgn*1.05,py,5.2);BASE.add(ar)});
     lamp(BASE,-3,-8);lamp(BASE,6,-3)}
    const padDisc=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.05,.08,26),std(0x8a7ca0,.8));
    padDisc.position.set(0,.04,0);BASE.add(padDisc);
    const pring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),bas(0xe8500f));
    pring.rotation.x=-Math.PI/2;pring.position.set(0,.09,0);BASE.add(pring);
    const hM=bas(0xf2ede2);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,.095,0);
    const h2=h1.clone();h2.position.x=.34;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.y=.095;
    BASE.add(h1,h2,h3);

    /* ── DALEKIE MINI-WYSPY (sylwetki w głębi) ── */
    for(let i=0;i<7;i++){
      const mx=(rnd()-.5)*260, my=40+rnd()*220, mz=-120-rnd()*90, r2=3+rnd()*5;
      const mi=new THREE.Group();mi.position.set(mx,my,mz);G.add(mi);
      const t2=new THREE.Mesh(new THREE.CylinderGeometry(r2,r2*1.05,.8,8),GRASS2);
      mi.add(t2);
      const u2=chunk(ROCKD,r2*.8,r2*.9,r2*.8);u2.position.y=-r2*.7;mi.add(u2)}

    /* ── CHMURY dryfujące (płaskie kłęby) ── */
    const clouds=[];
    for(let i=0;i<6;i++){
      const cl=new THREE.Group();cl.userData.dyn=true;G.add(cl);
      const n=3+Math.floor(rnd()*3);
      for(let k=0;k<n;k++){
        const p2=new THREE.Mesh(new THREE.SphereGeometry(2+rnd()*2.4,8,6),std(0xe8ecf4,.95));
        p2.scale.y=.45;p2.position.set(k*2.6-(n*1.3),rnd()*.8,(rnd()-.5)*2);cl.add(p2)}
      cl.userData={h:30+rnd()*230,r:60+rnd()*40,a:rnd()*6.28,sp:.02+rnd()*.03};
      const u0=cl.userData;
      cl.position.set(Math.cos(u0.a)*u0.r,u0.h,-30+Math.sin(u0.a)*u0.r*.5-30);
      clouds.push(cl)}

    /* ── PTAKI ── */
    const birds=[];
    for(let i=0;i<4;i++){
      const bird=new THREE.Group();bird.userData.dyn=true;G.add(bird);
      for(const sgn of[-1,1]){const w2=new THREE.Mesh(new THREE.ConeGeometry(.3,.95,3),std(0xf2ede2,.7));
        w2.rotation.z=sgn*Math.PI/2;w2.position.x=sgn*.4;bird.add(w2)}
      bird.userData={ph:i*1.9,r:24+i*8,h:70+i*55};
      const ub=bird.userData;
      bird.position.set(Math.cos(ub.ph)*ub.r,ub.h,-36+Math.sin(ub.ph)*ub.r*.6);
      birds.push(bird)}

    /* ── LAMPIONY unoszące się ── */
    const floatLan=[];
    for(let i=0;i<5;i++){
      const fl=new THREE.Group();fl.userData.dyn=true;G.add(fl);
      const paper=new THREE.Mesh(new THREE.CylinderGeometry(.32,.4,.7,8),std(0xf0b060,.6,0,0xd98a30,.7));
      fl.add(paper);
      const glow=new THREE.Mesh(new THREE.SphereGeometry(.14,6,4),GOLDL);
      glow.position.y=-.2;fl.add(glow);
      fl.userData={x:(rnd()-.5)*60,z:-20-rnd()*30,ph:rnd()*40,sp:1.4+rnd()};
      const uf=fl.userData;const y0=(uf.ph%70);
      fl.position.set(uf.x,y0,uf.z);fl.visible=y0>1&&y0<64;
      floatLan.push(fl)}

    /* ── SŁOŃCE nisko + poświata ── */
    {const sunM=new THREE.MeshBasicMaterial({color:0xfff0d0});sunM.fog=false;
     const sunDisc=new THREE.Mesh(new THREE.CircleGeometry(13,24),sunM);
     sunDisc.position.set(-64,152,-210);sunDisc.userData.dyn=true;G.add(sunDisc);
     for(let k=0;k<2;k++){
       const hm=new THREE.MeshBasicMaterial({color:0xffcf95,transparent:true,
         opacity:.12-k*.05,depthWrite:false});hm.fog=false;
       const halo=new THREE.Mesh(new THREE.CircleGeometry(16+k*8,24),hm);
       halo.position.set(-64,152,-212-k);halo.userData.dyn=true;halo.renderOrder=-1;G.add(halo)}}

    return {group:G, pad:{h:.14},
      animate(dt,t){
        // wyspy delikatnie oddychają (unoszą się)
        ISLES.forEach(([I],i)=>{if(i===0)return;
          I.position.y+= Math.sin(t*.35+i*1.7)*.004});
        falls.forEach(f=>{f.m.position.y-=dt*5;
          if(f.m.position.y<f.top-f.span)f.m.position.y+=f.span});
        lamps.forEach((g2,i)=>{const s2=.9+Math.sin(t*5+i*2.1)*.12;g2.scale.setScalar(s2)});
        if(airship){airship.position.y=9+Math.sin(t*.7)*.5;
          airship.rotation.z=Math.sin(t*.5)*.05}
        if(swing)swing.rotation.x=Math.sin(t*1.6)*.45;
        if(flag){flag.rotation.y=Math.sin(t*2.2)*.22;
          flag.position.x=7.2+Math.sin(t*2.2)*.18}
        if(I4.userData.gear)I4.userData.gear.rotation.z+=dt*.5;
        // tyrolka: wózek sunie w dół i wraca
        {const u=(t*.09)%1.25; const uu=Math.min(1,u);
         zipCart.position.lerpVectors(zipA,zipB,uu);
         zipCart.visible=u<1.05}
        clouds.forEach(cl=>{const u=cl.userData;u.a+=dt*u.sp;
          cl.position.set(Math.cos(u.a)*u.r,u.h,-30+Math.sin(u.a)*u.r*.5-30)});
        birds.forEach(b3=>{const u=b3.userData;u.ph+=dt*.5;
          b3.position.set(Math.cos(u.ph)*u.r,u.h+Math.sin(u.ph*1.7)*3,-36+Math.sin(u.ph)*u.r*.6);
          b3.rotation.y=-u.ph;
          b3.children.forEach((w3,k3)=>w3.rotation.x=Math.sin(t*9+k3)*.5)});
        floatLan.forEach(fl=>{const u=fl.userData;
          const y=((t*u.sp+u.ph)%70);
          fl.position.set(u.x+Math.sin(t*.6+u.ph)*2,y,u.z);
          fl.visible=y>1&&y<64});
      }};
  }
};
})(window);
