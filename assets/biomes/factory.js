/* MA//BIOME:FACTORY → PAROWOZOWNIA (MECHANIKA)
   Górska stacja parowa w złotej godzinie: obrotnica z lokomotywą, hala
   wachlarzowa, parowóz kursujący z wagonami, wieża wodna, żuraw węglowy,
   semafory, wiadukt i portal tunelu. Wszędzie para, mosiądz i zachód. */
(function(root){
'use strict';
root.MABIOME_FACTORY={
  MAXALT:240,
  FOG_STOPS:[[0,0x160e20],[.3,0x46203c],[.55,0x8a4444],[.78,0xd08a52],[1,0xf2c084]],
  SUN:{col:0xffd08a,int:1.0},
  HEMI:{sky:0xd0906a,ground:0x4a3a34,int:.8},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m,e,ei)=>{const M=new THREE.MeshStandardMaterial({color:c,roughness:r??.8,metalness:m??.1});
      if(e){M.emissive=new THREE.Color(e);M.emissiveIntensity=ei??.8}return M};
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    const glow=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o??.5,depthWrite:false});
    let sd=55;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    const dyn=o=>{o.userData.dyn=true;return o};
    const lampGlows=[];

    const BALLAST=std(0x6a5648,.95), DIRT=std(0x7a5a42,.95);
    const BRICK=std(0x9a4a38,.85), BRICK2=std(0x7a3a2c,.85);
    const IRON=std(0x3a3230,.6,.5), STEEL=std(0x8a7a6e,.5,.4);
    const RAIL=std(0xb8a890,.35,.7);
    const WOODT=std(0x5a4432,.9), GREEN=std(0x2e5a46,.6,.2);
    const BLACK=std(0x201c1e,.6,.3), REDD=std(0x8a2a22,.6,.2);
    const BRASS=std(0xc9963f,.35,.7);
    const WARM=std(0xffd9a0,.3,.1,0xe8a050,.85);
    const PATINA=std(0x3a6a52,.55,.5);            // zielona patyna żeliwa
    const PATINA2=std(0x2c5240,.6,.5);
    const GLASSC=new THREE.MeshStandardMaterial({color:0xffe9c9,roughness:.2,metalness:.1,
      transparent:true,opacity:.46,depthWrite:false});
    const LILYW=std(0xf2ece0,.5), LILYP=std(0xe89ab8,.55);
    const AMBERB=bas(0xffd98a);
    const SMOKE=new THREE.MeshStandardMaterial({color:0xcabfb4,roughness:1,transparent:true,opacity:.5,depthWrite:false});

    function ironLily(s2,col){
      const L=new THREE.Group();
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.05*s2,.08*s2,.7*s2,5),PATINA);
      stem.position.y=.35*s2;L.add(stem);
      for(let k=0;k<3;k++){const a=k/3*Math.PI*2;
        const pet=new THREE.Mesh(new THREE.ConeGeometry(.14*s2,.5*s2,5),col||PATINA);
        pet.position.set(Math.cos(a)*.14*s2,.78*s2,Math.sin(a)*.14*s2);
        pet.rotation.z=Math.cos(a)*.55;pet.rotation.x=-Math.sin(a)*.55;
        L.add(pet)}
      const mid=new THREE.Mesh(new THREE.SphereGeometry(.09*s2,6,5),BRASS);
      mid.position.y=.86*s2;L.add(mid);
      return L}

    /* ── TEREN ── */
    {const ap=new THREE.Mesh(new THREE.PlaneGeometry(480,340,10,8),DIRT);
     ap.rotation.x=-Math.PI/2;ap.position.set(0,-0.08,-40);ap.name='terr';G.add(ap)}
    {const ya=new THREE.Mesh(new THREE.PlaneGeometry(300,190,10,7),BALLAST);
     ya.rotation.x=-Math.PI/2;ya.position.set(0,0,-8);ya.name='terr';G.add(ya)}

    /* ── TORY (funkcja) ── */
    function track(x1,z1,x2,z2){
      const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),a=Math.atan2(dz,dx);
      const g2=new THREE.Group();g2.position.set((x1+x2)/2,0,(z1+z2)/2);g2.rotation.y=-a;G.add(g2);
      const nSl=Math.floor(len/2.2);
      for(let i=0;i<nSl;i++){const sl=new THREE.Mesh(new THREE.BoxGeometry(1.9,.14,.5),WOODT);
        sl.position.set(-len/2+1.1+i*2.2,.07,0);g2.add(sl)}
      for(const sg of[-1,1]){const rl=new THREE.Mesh(new THREE.BoxGeometry(len,.16,.14),RAIL);
        rl.position.set(0,.22,sg*.7);g2.add(rl)}
      return g2}

    /* układ torów */
    track(-92,18,92,18);            // linia kursowa (przed obrotnicą)
    track(-92,-14,-40,-14);         // dojazd do obrotnicy
    track(14,-14,92,-14);           // wyjazd
    track(-70,34,60,34);            // bocznica
    track(66,18,92,-2);             // łuk zjazdowy (prosty skos)

    /* ── OBROTNICA + LOKOMOTYWA (bohater) ── */
    const TT={x:-13,z:-14,r:13};
    {const floor2=new THREE.Mesh(new THREE.CylinderGeometry(TT.r-.2,TT.r+.2,.3,28),std(0x4a4038,.9));
     floor2.position.set(TT.x,.15,TT.z);G.add(floor2);
     const wall=new THREE.Mesh(new THREE.TorusGeometry(TT.r,.5,8,28),STEEL);
     wall.rotation.x=Math.PI/2;wall.position.set(TT.x,.3,TT.z);G.add(wall)}
    const bridge=dyn(new THREE.Group());bridge.position.set(TT.x,0.32,TT.z);G.add(bridge);
    {const deck=new THREE.Mesh(new THREE.BoxGeometry(TT.r*2-1,.5,3.2),STEEL);
     deck.position.y=.28;bridge.add(deck);
     for(const sg of[-1,1]){const rl=new THREE.Mesh(new THREE.BoxGeometry(TT.r*2-1,.14,.12),RAIL);
       rl.position.set(0,.4,sg*.7);bridge.add(rl)}
     const hut=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.8,1.6),WOODT);
     hut.position.set(TT.r-2,1.2,2.2);bridge.add(hut)}

    /* parowóz proceduralny */
    function loco(cabCol){
      const L=new THREE.Group();
      const frame=new THREE.Mesh(new THREE.BoxGeometry(9.4,.5,2.6),BLACK);
      frame.position.y=1.15;L.add(frame);
      const boiler=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,6.2,14),BLACK);
      boiler.rotation.z=Math.PI/2;boiler.position.set(-.6,2.75,0);L.add(boiler);
      const smokebox=new THREE.Mesh(new THREE.CylinderGeometry(1.42,1.42,1.2,14),IRON);
      smokebox.rotation.z=Math.PI/2;smokebox.position.set(-4.1,2.75,0);L.add(smokebox);
      const chim=new THREE.Mesh(new THREE.CylinderGeometry(.42,.55,1.5,10),BLACK);
      chim.position.set(-3.9,4.35,0);L.add(chim);
      const chimCap=new THREE.Mesh(new THREE.CylinderGeometry(.62,.5,.3,10),BRASS);
      chimCap.position.set(-3.9,5.15,0);L.add(chimCap);
      const dome=new THREE.Mesh(new THREE.SphereGeometry(.55,10,8),BRASS);
      dome.position.set(-1.2,4.05,0);L.add(dome);
      const cab=new THREE.Mesh(new THREE.BoxGeometry(2.6,2.9,2.9),cabCol);
      cab.position.set(3.2,3.05,0);L.add(cab);
      const roof=new THREE.Mesh(new THREE.BoxGeometry(3.1,.2,3.2),BLACK);
      roof.position.set(3.2,4.6,0);L.add(roof);
      for(const sz2 of[-1.5,1.5]){const win=new THREE.Mesh(new THREE.BoxGeometry(1,1,.08),WARM);
        win.position.set(3.2,3.5,sz2);L.add(win)}
      for(const sg of[-1,1])for(const wx of[-2.9,-.9,1.1]){
        const wh=new THREE.Mesh(new THREE.CylinderGeometry(1.02,1.02,.3,14),IRON);
        wh.rotation.x=Math.PI/2;wh.position.set(wx,1.02,sg*1.15);L.add(wh)}
      const buf=new THREE.Mesh(new THREE.BoxGeometry(.3,.8,2.6),REDD);
      buf.position.set(-5.1,1.15,0);L.add(buf);
      const lampF=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),bas(0xffe9b0));
      lampF.position.set(-5.2,2.4,0);L.add(lampF);
      return L}

    const locoTT=loco(GREEN);locoTT.position.set(0,0,0);locoTT.rotation.y=0;bridge.add(locoTT);

    /* ── HALA WACHLARZOWA (5 stanowisk łukiem za obrotnicą) ── */
    for(let k=0;k<5;k++){
      const a=(-0.62+k*0.31);
      const dist=TT.r+14.5;
      const sx=TT.x+Math.sin(a)*dist, sz=TT.z-Math.cos(a)*dist;
      const st=new THREE.Group();st.position.set(sx,0,sz);st.rotation.y=-a+Math.PI;G.add(st);
      const body=new THREE.Mesh(new THREE.BoxGeometry(9.6,8,17),k%2?BRICK:BRICK2);
      body.position.set(0,4,-8.5+17/2-8.5);body.position.z=-2.5;st.add(body);
      const doorRec=new THREE.Mesh(new THREE.BoxGeometry(7.6,6.4,.7),BLACK);
      doorRec.position.set(0,3.2,6.2);st.add(doorRec);
      const lintel=new THREE.Mesh(new THREE.BoxGeometry(9.8,1.2,1),STEEL);
      lintel.position.set(0,7.2,6.2);st.add(lintel);
      const sky=new THREE.Mesh(new THREE.BoxGeometry(7.4,.3,10),WARM);
      sky.position.set(0,8.2,-3);st.add(sky);
      track(TT.x+Math.sin(a)*(TT.r+1),TT.z-Math.cos(a)*(TT.r+1),sx+Math.sin(a)*4.5,sz-Math.cos(a)*4.5);
      const chim2=new THREE.Mesh(new THREE.CylinderGeometry(.4,.5,3.4,8),BRICK2);
      chim2.position.set(3.4,9.6,-6);st.add(chim2)}

    /* ── PAROWÓZ KURSOWY + wagony (wahadłowo po linii z=18) ── */
    const shuttle=dyn(new THREE.Group());G.add(shuttle);
    const loco2=loco(REDD);shuttle.add(loco2);
    function wagon(col){
      const W=new THREE.Group();
      const box=new THREE.Mesh(new THREE.BoxGeometry(7,2.6,2.7),col);
      box.position.y=2.3;W.add(box);
      for(const sg of[-1,1])for(const wx of[-2.4,2.4]){
        const wh=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.26,12),IRON);
        wh.rotation.x=Math.PI/2;wh.position.set(wx,.62,sg*1.12);W.add(wh)}
      return W}
    const w1=wagon(std(0x6a4a8a,.8));w1.position.x=8.6;shuttle.add(w1);
    const w2=wagon(std(0x3a5a7a,.8));w2.position.x=16.4;shuttle.add(w2);
    shuttle.position.set(-46,0,18);
    const shuttlePath={xA:-52,xB:44};

    /* ── PERON + WIATA SECESYJNA (żeliwne lilie, szklany daszek) ── */
    {const per=new THREE.Mesh(new THREE.BoxGeometry(58,.7,7),std(0x6e665e,.9));
     per.position.set(0,.35,26);G.add(per);
     const edge=new THREE.Mesh(new THREE.BoxGeometry(58,.16,.5),std(0xd8d0c4,.7));
     edge.position.set(0,.75,22.7);G.add(edge);
     for(let k=0;k<5;k++){const cx=-24+k*12;
       const col=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,5.6,8),PATINA);
       col.position.set(cx,3.5,26);G.add(col);
       const cap=ironLily(1.5,PATINA2);cap.position.set(cx,5.5,26);G.add(cap);
       // wolutowe wsporniki daszku
       for(const sg of[-1,1]){const vol=new THREE.Mesh(new THREE.TorusGeometry(.9,.09,6,10,Math.PI/1.4),PATINA);
         vol.position.set(cx,6.1,26+sg*1.1);vol.rotation.y=Math.PI/2;
         vol.rotation.z=sg>0?Math.PI:0;G.add(vol)}
       // lampa-dzwonek lilii pod daszkiem
       if(k%2===0){const bell=new THREE.Mesh(new THREE.ConeGeometry(.32,.5,7),PATINA2);
         bell.position.set(cx,6.0,24.4);bell.rotation.x=Math.PI;G.add(bell);
         const gl=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),AMBERB);
         gl.position.set(cx,5.72,24.4);G.add(gl);lampGlows.push(gl)}}
     const roofG=new THREE.Mesh(new THREE.BoxGeometry(60,.14,6.4),GLASSC);
     roofG.position.set(0,6.7,26);G.add(roofG);
     for(const rz of[23.4,28.6]){const rib=new THREE.Mesh(new THREE.BoxGeometry(60,.16,.16),PATINA);
       rib.position.set(0,6.62,rz);G.add(rib)}
     const crest=new THREE.Mesh(new THREE.BoxGeometry(60,.12,.1),BRASS);
     crest.position.set(0,6.82,26);G.add(crest);
     // secesyjne łuki poprzeczne nad daszkiem
     for(const ax of[-18,0,18]){
       const arch=new THREE.Mesh(new THREE.TorusGeometry(3.3,.12,6,12,Math.PI),PATINA);
       arch.position.set(ax,6.7,26);arch.rotation.y=Math.PI/2;G.add(arch);
       const fin=ironLily(.9,BRASS);fin.position.set(ax,9.95,26);G.add(fin)}}

    /* ── STAW Z LILIAMI WODNYMI (przy stacji) ── */
    {const pond=new THREE.Mesh(new THREE.CylinderGeometry(8.5,8.8,.22,20),
       std(0x1e4a4e,.3,.25,0x0e2e30,.35));
     pond.position.set(-62,.11,2);pond.scale.z=.72;G.add(pond);
     const rim=new THREE.Mesh(new THREE.TorusGeometry(8.6,.28,6,20),std(0x6a5a4a,.9));
     rim.rotation.x=Math.PI/2;rim.position.set(-62,.2,2);rim.scale.y=.72;G.add(rim);
     let pd=13;const prn=()=>{pd=(pd*16807)%2147483647;return pd/2147483647};
     for(let k=0;k<7;k++){
       const a=prn()*6.28,r=1.5+prn()*5.5;
       const pad2=new THREE.Mesh(new THREE.CylinderGeometry(.55+prn()*.35,.55,.07,9),
         k%2?std(0x3f7a4e,.8):std(0x2e5c3c,.8));
       pad2.position.set(-62+Math.cos(a)*r,.24,2+Math.sin(a)*r*.72);G.add(pad2);
       if(k<4){const fl=new THREE.Group();
         for(let p2=0;p2<4;p2++){const ang=p2/4*Math.PI*2;
           const pet=new THREE.Mesh(new THREE.ConeGeometry(.12,.3,5),k%2?LILYW:LILYP);
           pet.position.set(Math.cos(ang)*.1,.16,Math.sin(ang)*.1);
           pet.rotation.z=Math.cos(ang)*.7;pet.rotation.x=-Math.sin(ang)*.7;fl.add(pet)}
         const c2=new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),BRASS);
         c2.position.y=.2;fl.add(c2);
         fl.position.copy(pad2.position);G.add(fl)}}
     // trzciny
     for(const [rx,rz] of [[-68,-2.5],[-55.5,6.5]]){
       for(let k=0;k<4;k++){const reed=new THREE.Mesh(new THREE.CylinderGeometry(.03,.05,1.4+prn()*.8,4),PATINA2);
         reed.position.set(rx+prn()*.9,.8,rz+prn()*.7);reed.rotation.z=(prn()-.5)*.2;G.add(reed)}}
     // żabka na liściu
     {const frog=new THREE.Group();frog.position.set(-59.5,.31,4.4);G.add(frog);
      const b2=new THREE.Mesh(new THREE.SphereGeometry(.16,7,6),std(0x4e9a3a,.6));
      b2.scale.set(1,.75,1.2);b2.position.y=.1;frog.add(b2);
      for(const e of[-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.05,5,4),bas(0xfff4c0));
        eye.position.set(e*.08,.2,.1);frog.add(eye)}}
     // ważka (dyn) krąży nad stawem
     const dfly=dyn(new THREE.Group());G.add(dfly);
     {const body=new THREE.Mesh(new THREE.CylinderGeometry(.03,.05,.6,4),std(0x2a6ab8,.4,.4));
      body.rotation.z=Math.PI/2;dfly.add(body);
      for(const e of[-1,1]){const wing=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.14),GLASSC);
        wing.position.set(0,.06,e*.14);dfly.add(wing)}}
     dfly.userData={cx:-62,cz:2};
     dfly.position.set(-62,1.4,2);
     G.userData.dfly=dfly;
     // secesyjny płotek od strony torów
     for(let k=0;k<5;k++){const fx=-70+k*4.2;
       const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,1.1,5),PATINA);
       post.position.set(fx,.55,9.4);G.add(post);
       if(k<4){const rail2=new THREE.Mesh(new THREE.BoxGeometry(4.2,.07,.07),PATINA);
         rail2.position.set(fx+2.1,1.02,9.4);G.add(rail2);
         const curl=new THREE.Mesh(new THREE.TorusGeometry(.3,.05,5,8,Math.PI),PATINA2);
         curl.position.set(fx+2.1,.75,9.4);curl.rotation.x=0;G.add(curl)}}}

    /* ── WIEŻA WODNA + ŻURAW WĘGLOWY + PIASKOWNIA ── */
    {const wt=new THREE.Group();wt.position.set(36,0,-2);G.add(wt);
     for(const [ox,oz] of[[-1.6,-1.6],[1.6,-1.6],[1.6,1.6],[-1.6,1.6]]){
       const leg=new THREE.Mesh(new THREE.BoxGeometry(.5,8.6,.5),IRON);
       leg.position.set(ox,4.3,oz);wt.add(leg)}
     const tank=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.1,4.2,14),REDD);
     tank.position.y=10.6;wt.add(tank);
     for(const by of[9,12.2]){const band=new THREE.Mesh(new THREE.TorusGeometry(3.14,.09,6,18),IRON);
       band.rotation.x=Math.PI/2;band.position.y=by;wt.add(band)}
     const roof=new THREE.Mesh(new THREE.ConeGeometry(3.5,1.6,14),IRON);
     roof.position.y=13.5;wt.add(roof);
     for(let k=0;k<6;k++){const a=k/6*Math.PI*2;
       const fin=ironLily(.7,PATINA);
       fin.position.set(Math.cos(a)*3.1,12.7,Math.sin(a)*3.1);wt.add(fin)}
     const topFin=ironLily(1.1,BRASS);topFin.position.y=14.2;wt.add(topFin)}
    const spout=dyn(new THREE.Group());spout.position.set(36,9.4,-2);G.add(spout);
    {const arm=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,5.4,8),STEEL);
     arm.rotation.z=Math.PI/2.3;arm.position.set(-2.4,-.5,0);spout.add(arm);
     const tip=new THREE.Mesh(new THREE.CylinderGeometry(.24,.3,1.2,8),BRASS);
     tip.position.set(-4.9,-1.9,0);tip.rotation.z=.5;spout.add(tip)}
    // węgiel + żuraw
    {const stage=new THREE.Mesh(new THREE.BoxGeometry(9,2,7),WOODT);
     stage.position.set(56,1,12);G.add(stage);
     const heap=new THREE.Mesh(new THREE.ConeGeometry(3.4,3,9),BLACK);
     heap.position.set(56,3.9,12);G.add(heap)}
    const crane=dyn(new THREE.Group());crane.position.set(50,0,6);G.add(crane);
    {const post=new THREE.Mesh(new THREE.CylinderGeometry(.4,.55,8.6,10),IRON);
     post.position.y=4.3;crane.add(post);
     const boom=new THREE.Mesh(new THREE.BoxGeometry(7.4,.5,.5),STEEL);
     boom.position.set(3.4,8,0);crane.add(boom);
     const stay=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,7.4,4),IRON);
     stay.position.set(3.2,9.2,0);stay.rotation.z=-.36;crane.add(stay);
     const cable=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.4,4),BLACK);
     cable.position.set(6.6,6.2,0);crane.add(cable);
     const grab=new THREE.Mesh(new THREE.BoxGeometry(1.2,.9,1.2),IRON);
     grab.position.set(6.6,4.2,0);crane.add(grab)}
    {const sand=new THREE.Group();sand.position.set(44,0,-18);G.add(sand);
     const col=new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,7,8),STEEL);
     col.position.y=3.5;sand.add(col);
     const bin=new THREE.Mesh(new THREE.CylinderGeometry(1.5,.9,2.6,8),REDD);
     bin.position.y=7.6;sand.add(bin)}

    /* ── SEMAFORY (ramiona animowane) ── */
    const semArms=[];
    for(const [sx,sz] of [[-62,14],[24,24],[72,-6]]){
      const p=new THREE.Group();p.position.set(sx,0,sz);G.add(p);
      const post=new THREE.Mesh(new THREE.BoxGeometry(.4,6.6,.4),STEEL);
      post.position.y=3.3;p.add(post);
      const lad=new THREE.Mesh(new THREE.BoxGeometry(.16,5.4,.06),IRON);
      lad.position.set(.3,3,0);p.add(lad);
      const pivot=dyn(new THREE.Group());pivot.position.set(0,6.2,0);p.add(pivot);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(2.4,.42,.14),REDD);
      arm.position.x=1.1;pivot.add(arm);
      const tip=new THREE.Mesh(new THREE.BoxGeometry(.5,.42,.15),std(0xe8e0d4,.6));
      tip.position.x=2.2;pivot.add(tip);
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),bas(0xff6a4a));
      lamp.position.set(-.4,6.2,0);p.add(lamp);
      const fin=ironLily(.8,PATINA2);fin.position.y=6.6;p.add(fin);
      semArms.push(pivot)}

    /* ── KOZŁY OPOROWE + LAMPY ── */
    for(const [bx,bz,ry] of [[-90,18,0],[90,18,Math.PI],[-68,34,0]]){
      const b=new THREE.Group();b.position.set(bx,0,bz);b.rotation.y=ry;G.add(b);
      for(const sg of[-1,1]){const beam=new THREE.Mesh(new THREE.BoxGeometry(2.6,.3,.3),REDD);
        beam.position.set(-0.6,1.15,sg*.7);beam.rotation.z=.5;b.add(beam)}
      const cross=new THREE.Mesh(new THREE.BoxGeometry(.3,.9,2),REDD);
      cross.position.set(.3,1.35,0);b.add(cross)}
    for(const [lx,lz] of [[-40,8],[8,6],[-30,-30],[30,-24],[62,22],[-70,26]]){
      const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,5.4,7),PATINA);
      p.position.set(lx,2.7,lz);G.add(p);
      const arm=new THREE.Mesh(new THREE.TorusGeometry(.8,.07,6,10,Math.PI/1.15),PATINA);
      arm.position.set(lx+.4,5.35,lz);arm.rotation.z=-.4;G.add(arm);
      const bell=new THREE.Mesh(new THREE.ConeGeometry(.3,.45,7),PATINA2);
      bell.position.set(lx+1.15,5.15,lz);bell.rotation.x=Math.PI;bell.rotation.z=.12;G.add(bell);
      const gl=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),bas(0xffd98a));
      gl.position.set(lx+1.15,4.9,lz);G.add(gl);lampGlows.push(gl)}

    /* ── KOTŁOWNIA + WIELKI KOMIN + DYM ── */
    {const bh=new THREE.Mesh(new THREE.BoxGeometry(15,9,11),BRICK);
     bh.position.set(84,4.5,-34);G.add(bh);
     const bhr=new THREE.Mesh(new THREE.BoxGeometry(15.6,.7,11.6),BRICK2);
     bhr.position.set(84,9.3,-34);G.add(bhr);
     for(let k=0;k<3;k++){const win=new THREE.Mesh(new THREE.BoxGeometry(2,2.6,.14),WARM);
       win.position.set(78.6+k*5,4.6,-28.2);G.add(win)}}
    const chStrobe=dyn(new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),bas(0xff3b30)));
    {const ch=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.9,46,12),BRICK2);
     ch.position.set(93,23,-38);G.add(ch);
     for(const by of[10,24,38]){const band=new THREE.Mesh(new THREE.CylinderGeometry(2.55-by*.012,2.55-by*.012,1,12),BRICK);
       band.position.set(93,by,-38);G.add(band)}
     const cap=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.15,1.4,12),IRON);
     cap.position.set(93,46.6,-38);G.add(cap);
     chStrobe.position.set(93,48,-38);G.add(chStrobe)}
    const bigPuffs=[];
    for(let i=0;i<3;i++){
      const p2=dyn(new THREE.Mesh(new THREE.SphereGeometry(2.4,9,7),SMOKE.clone()));
      p2.userData.ph=i/3;
      const u=i/3;p2.position.set(93+u*10,49+u*46,-38-u*6);p2.scale.setScalar(.7+u*2.6);
      p2.material.opacity=.5*(1-u*.8);
      G.add(p2);bigPuffs.push(p2)}
    /* dymki lokomotyw */
    function puffSet(n){const arr=[];
      for(let i=0;i<n;i++){const p2=dyn(new THREE.Mesh(new THREE.SphereGeometry(.6,8,6),SMOKE.clone()));
        p2.userData.ph=i/n;G.add(p2);arr.push(p2)}return arr}
    const puffsTT=puffSet(2), puffsSh=puffSet(2);

    /* ── WIADUKT + PORTAL TUNELU ── */
    {const vx0=-74,vx1=26,vz=-58;
     const deck=new THREE.Mesh(new THREE.BoxGeometry(vx1-vx0,1.4,4.6),STEEL);
     deck.position.set((vx0+vx1)/2,10.6,vz);G.add(deck);
     for(const sg of[-1,1]){const par=new THREE.Mesh(new THREE.BoxGeometry(vx1-vx0,.8,.3),BRICK2);
       par.position.set((vx0+vx1)/2,11.6,vz+sg*2.3);G.add(par)}
     for(let px=vx0+7;px<vx1;px+=14){
       const pier=new THREE.Mesh(new THREE.BoxGeometry(4.4,10,5),BRICK);
       pier.position.set(px,5,vz);G.add(pier);
       const arch=new THREE.Mesh(new THREE.CylinderGeometry(4.4,4.4,5.2,12,1,false,0,Math.PI),BLACK);
       arch.rotation.z=Math.PI/2;arch.rotation.y=Math.PI/2;
       arch.position.set(px+7,5.9,vz);if(px+14<vx1)G.add(arch)}
     track(vx0,vz,vx1,vz)}
    {const px=58,pz=-52;
     const face=new THREE.Mesh(new THREE.BoxGeometry(12,11,3),BRICK);
     face.position.set(px,5.5,pz);G.add(face);
     const ringT=new THREE.Mesh(new THREE.TorusGeometry(3.4,.8,8,14,Math.PI),std(0xb8a890,.8));
     ringT.position.set(px,3.4,pz+1.6);G.add(ringT);
     const keyFin=ironLily(.9,PATINA2);keyFin.position.set(px,7.2,pz+1.4);G.add(keyFin);
     const hole=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.2,2.4,14,1,false,0,Math.PI),BLACK);
     hole.rotation.z=Math.PI/2;hole.rotation.y=Math.PI/2;
     hole.position.set(px,3.4,pz+1.4);G.add(hole);
     track(px,pz+2,px,-8);track(px,-8,74,10)}

    /* ── GRANIE (złote, dwie warstwy) ── */
    function ridgePlane(z,w,h,c1,c2){
      const g=new THREE.PlaneGeometry(w,h,40,6);
      const P=g.attributes.position;const cols=new Float32Array(P.count*3);
      const A=new THREE.Color(c1),B=new THREE.Color(c2);
      for(let i=0;i<P.count;i++){
        const t=(P.getY(i)/h)+.5;
        P.setY(i,P.getY(i)+(t>.6?(rnd()-.5)*h*.5*t:0));
        P.setZ(i,(rnd()-.5)*6);
        const c=B.clone().lerp(A,t);
        cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b}
      g.computeVertexNormals();
      g.setAttribute('color',new THREE.BufferAttribute(cols,3));
      const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));
      m.position.set(0,h*.32,z);G.add(m)}
    ridgePlane(-96,420,52,0xc9784a,0x5a3040);
    ridgePlane(-150,560,96,0xe8a060,0x46203c);

    /* ── CHMURY ZŁOTE + PTAKI ── */
    const clouds=[];
    for(let i=0;i<4;i++){
      const cl=dyn(new THREE.Group());G.add(cl);
      const n=3;
      for(let k=0;k<n;k++){
        const s2=new THREE.Mesh(new THREE.SphereGeometry(7+rnd()*6,8,6),
          new THREE.MeshStandardMaterial({color:0xf0c9a0,roughness:1,transparent:true,opacity:.34,depthWrite:false}));
        s2.scale.y=.32;s2.position.set(k*9-(n*4.5),rnd()*1.5,(rnd()-.5)*6);cl.add(s2)}
      cl.userData={h:64+rnd()*150,r:80+rnd()*60,a:rnd()*6.28,sp:.01+rnd()*.012};
      const u=cl.userData;cl.position.set(Math.cos(u.a)*u.r,u.h,-60+Math.sin(u.a)*u.r*.4);
      clouds.push(cl)}
    const birds=[];
    for(let i=0;i<4;i++){
      const b=dyn(new THREE.Group());G.add(b);
      for(const sg of[-1,1]){const w=new THREE.Mesh(new THREE.ConeGeometry(.2,.8,3),BLACK);
        w.rotation.z=sg*Math.PI/2;w.position.x=sg*.34;b.add(w)}
      b.userData={ph:i*1.7,r:46+i*14,h:60+i*34};
      const u=b.userData;b.position.set(Math.cos(u.ph)*u.r,u.h,-50+Math.sin(u.ph)*u.r*.5);
      birds.push(b)}

    /* ── PAD (origin) ── */
    const padDisc=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.1,.2,26),std(0x8a7a6a,.7));
    padDisc.position.set(0,.1,0);G.add(padDisc);
    const pring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),bas(0xffd08a));
    pring.rotation.x=-Math.PI/2;pring.position.set(0,.21,0);G.add(pring);
    const hM=bas(0x2a2420);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,.215,0);
    const h2=h1.clone();h2.position.x=.34;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.set(0,.215,0);
    G.add(h1,h2,h3);
    const beacon=dyn(new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),bas(0xff6a3a)));
    beacon.position.set(2.4,.5,0);G.add(beacon);

    /* ── ŚWIATŁA ── */
    const pl1=new THREE.PointLight(0xffd08a,.9,140);pl1.position.set(-60,30,-90);G.add(pl1);
    const pl2=new THREE.PointLight(0xffb46a,.5,50);pl2.position.set(TT.x,8,TT.z);G.add(pl2);

    return {group:G, pad:{h:.2},
      animate(dt,t){
        bridge.rotation.y=t*.07;
        // parowóz kursowy: wahadło z łagodnym nawrotem
        {const u=(Math.sin(t*.12)+1)/2;
         shuttle.position.x=shuttlePath.xA+(shuttlePath.xB-shuttlePath.xA)*u;}
        // dymki lokomotyw
        function drive(puffs,getPos){
          puffs.forEach(p2=>{const u=(t*.28+p2.userData.ph)%1;
            const [px,py,pz]=getPos();
            p2.position.set(px+u*2.2,py+u*7,pz);
            p2.scale.setScalar(.5+u*1.8);
            p2.material.opacity=.5*(1-u)});}
        drive(puffsTT,()=>{const th=bridge.rotation.y;
          return [TT.x-3.9*Math.cos(th), 5.3, TT.z+3.9*Math.sin(th)]});
        drive(puffsSh,()=>[shuttle.position.x-3.9,5.3,18]);
        spout.rotation.y=Math.sin(t*.4)*.3;
        crane.rotation.y=Math.sin(t*.23)*.55;
        semArms.forEach((a2,i)=>{const c=(t*.4+i*.7)%4;
          a2.rotation.z=(c<1?c:c<2?1:c<3?3-c:0)*-0.7});
        chStrobe.visible=(t%1.6)<.14;
        bigPuffs.forEach(p2=>{const u=(t*.07+p2.userData.ph)%1;
          p2.position.set(93+u*12,49+u*48,-38-u*7);
          p2.scale.setScalar(.7+u*2.8);
          p2.material.opacity=.5*(1-u*.85)});
        clouds.forEach(cl=>{const u=cl.userData;u.a+=dt*u.sp;
          cl.position.set(Math.cos(u.a)*u.r,u.h,-60+Math.sin(u.a)*u.r*.4)});
        birds.forEach(b=>{const u=b.userData;u.ph+=dt*.35;
          b.position.set(Math.cos(u.ph)*u.r,u.h+Math.sin(u.ph*1.5)*2.4,-50+Math.sin(u.ph)*u.r*.5);
          b.rotation.y=-u.ph;
          b.children.forEach((w,k)=>w.rotation.x=Math.sin(t*8+k)*.45)});
        lampGlows.forEach((g2,i)=>g2.scale.setScalar(.92+Math.sin(t*5+i*1.9)*.1));
        {const d=G.userData.dfly,u=d.userData;
         d.position.set(u.cx+Math.cos(t*1.1)*3.2,1.2+Math.sin(t*2.3)*.4,u.cz+Math.sin(t*1.7)*2.2);
         d.rotation.y=-t*1.1+Math.PI/2;
         d.children.forEach((w,k)=>{if(k>0)w.rotation.x=Math.sin(t*30+k)*.5})}
        beacon.visible=(t%1.4)<.18;
      }};
  }
};
})(window);
