/* MA//BIOME:CIRCUIT → SERCE REAKTORA (ELEKTRONIKA)
   Zjazd pionowym szybem wokół gigantycznego rdzenia energetycznego.
   Góra: pierścienie chłodzące, mgła, kominy pary. Środek: toroidy plazmy,
   szyny energii, kondensatory. Dno: pulsujący rdzeń — lądowisko.
   Estetyka: grafit + cyjan/magenta neon, emisja, obrotowe maszyny. */
(function(root){
'use strict';
const H=150;                    // wysokość szybu (całość zjazdu)
root.MABIOME_CIRCUIT={
  MAXALT:150,
  FOG_STOPS:[[0,0x02060c],[.2,0x061420],[.45,0x0a1e2e],[.7,0x0d2636],[1,0x103042]],
  SUN:{col:0x8fd0ff,int:.5},
  HEMI:{sky:0x1a3a54,ground:0x04101a,int:.75},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m,e,ei)=>{const M=new THREE.MeshStandardMaterial({color:c,roughness:r??.6,metalness:m??.3});
      if(e){M.emissive=new THREE.Color(e);M.emissiveIntensity=ei??.9}return M};
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    const glow=(c,o)=>{const M=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o??.5,depthWrite:false});return M};
    let sd=9;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};

    /* materiały */
    const GRAPH=std(0x1a2028,.7,.4), GRAPH2=std(0x232b35,.65,.45), GRAPHD=std(0x121820,.75,.35);
    const STEEL=std(0x3e4a58,.4,.7), STEEL2=std(0x556577,.35,.75);
    const CYAN=std(0x2fd4e8,.3,.2,0x1fb4d0,1.1);
    const MAG =std(0xe84fd0,.3,.2,0xc02fb0,1.1);
    const AMBER=std(0xffb84a,.3,.2,0xe89020,1.0);
    const PLASMA=bas(0x9ff0ff);
    const CORE_C=bas(0xff7ae0);

    const dyn=o=>{o.userData.dyn=true;return o};

    /* ── ŚCIANA SZYBU: fasetowany walec z panelami i pasami neonu ── */
    const RAD=52;
    {const wg=new THREE.CylinderGeometry(RAD,RAD+4,H+30,22,16,true);
     const P=wg.attributes.position, cols=new Float32Array(P.count*3);
     const cA=new THREE.Color(0x2a333f), cB=new THREE.Color(0x141a22), cC=new THREE.Color(0x0c1119);
     for(let i=0;i<P.count;i++){
       const x=P.getX(i),y=P.getY(i),z=P.getZ(i), r=Math.hypot(x,z);
       const push=(rnd()-.5)*5;
       P.setX(i,x/r*(r+push));P.setZ(i,z/r*(r+push));P.setY(i,y+(rnd()-.5)*2);
       const t=(y+(H+30)/2)/(H+30);
       const c=t>.6?cA.clone().lerp(cB,(1-t)/.4):cB.clone().lerp(cC,1-(t/.6));
       cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b}
     wg.setAttribute('color',new THREE.BufferAttribute(cols,3));wg.computeVertexNormals();
     const wall=dyn(new THREE.Mesh(wg,new THREE.MeshStandardMaterial({
       vertexColors:true,roughness:.85,metalness:.3,side:THREE.BackSide,flatShading:true})));
     wall.position.y=(H+30)/2-12;G.add(wall)}
    /* pionowe żebra konstrukcyjne co ~40° */
    for(let k=0;k<9;k++){const a=k/9*Math.PI*2;
      const rib=new THREE.Mesh(new THREE.BoxGeometry(1.4,H+20,2.2),GRAPH2);
      rib.position.set(Math.cos(a)*(RAD-1),H/2,Math.sin(a)*(RAD-1));
      rib.rotation.y=-a;G.add(rib);
      // pas neonu wzdłuż żebra (naprzemiennie cyjan/magenta)
      const strip=new THREE.Mesh(new THREE.BoxGeometry(.3,H+18,.3),k%2?CYAN:MAG);
      strip.position.set(Math.cos(a)*(RAD-2.4),H/2,Math.sin(a)*(RAD-2.4));G.add(strip)}
    /* pierścienie obwodowe (kondygnacje) */
    for(let ry=12; ry<H; ry+=18){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(RAD-2,.5,6,32),GRAPH2);
      ring.rotation.x=Math.PI/2;ring.position.y=ry;G.add(ring);
      const neon=new THREE.Mesh(new THREE.TorusGeometry(RAD-2.6,.14,6,32),(ry/18)%2?CYAN:MAG);
      neon.rotation.x=Math.PI/2;neon.position.y=ry;G.add(neon)}

    /* ── KOLUMNA RDZENIA (centralna, przez całą wysokość) ── */
    const colR=6, colBase=17;                 // kolumna startuje NAD lądowiskiem
    const colH=H-colBase+8;
    const column=new THREE.Mesh(new THREE.CylinderGeometry(colR,colR,colH,16),GRAPHD);
    column.position.y=colBase+colH/2;G.add(column);
    const coreRod=new THREE.Mesh(new THREE.CylinderGeometry(colR*.55,colR*.55,colH-2,12),CORE_C);
    coreRod.position.y=colBase+colH/2;G.add(coreRod);
    // zwieńczenie dolne kolumny nad padem (reaktor „wisi" nad komorą)
    const colCap=new THREE.Mesh(new THREE.ConeGeometry(colR+1,4,16),GRAPH2);
    colCap.rotation.x=Math.PI;colCap.position.y=colBase-1;G.add(colCap);
    const capGlow=new THREE.Mesh(new THREE.CylinderGeometry(colR*.5,.4,3,12),CORE_C);
    capGlow.position.y=colBase-1.5;G.add(capGlow);
    // segmentacja kolumny: ciemne obręcze
    for(let y=colBase+3,bi=0;y<H;y+=7,bi++){
      const band=new THREE.Mesh(new THREE.CylinderGeometry(colR+.3,colR+.3,1.2,16),GRAPH2);
      band.position.y=y;G.add(band);
      if(bi%2===0){const bg=new THREE.Mesh(new THREE.TorusGeometry(colR+.35,.1,6,16),bi%4?CYAN:MAG);
        bg.rotation.x=Math.PI/2;bg.position.y=y;G.add(bg)}}

    /* ── TOROIDY PLAZMY: obracające się pierścienie wokół kolumny (środek szybu) ── */
    const toroids=[];
    for(const [ty,tr,col] of [[H*.62,15,CYAN],[H*.5,19,MAG],[H*.38,15,AMBER]]){
      const grp=dyn(new THREE.Group());grp.position.y=ty;G.add(grp);
      const torus=new THREE.Mesh(new THREE.TorusGeometry(tr,1.2,8,28),STEEL);
      torus.rotation.x=Math.PI/2;grp.add(torus);
      const plCol=col===CYAN?bas(0x6ff0ff):col===MAG?bas(0xff8fe8):bas(0xffd98a);
      const plasma=new THREE.Mesh(new THREE.TorusGeometry(tr,.6,6,28),plCol);
      plasma.rotation.x=Math.PI/2;grp.add(plasma);
      // strzępy plazmy biegnące do kolumny
      for(let k=0;k<8;k++){const a=k/8*Math.PI*2;
        const arc=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,tr-colR,4),col===CYAN?bas(0x6ff0ff):col===MAG?bas(0xff8fe8):bas(0xffd98a));
        arc.position.set(Math.cos(a)*(tr+colR)/2,0,Math.sin(a)*(tr+colR)/2);
        arc.rotation.z=Math.PI/2;arc.rotation.y=-a;grp.add(arc)}
      toroids.push({grp,dir:col===MAG?-1:1,sp:.3+rnd()*.3})}

    /* ── PLATFORMY-KONDYGNACJE (trasa zjazdu) — wspornikowe, przy ścianie ── */
    const flames=[];
    function panelLight(parent,x,y,z,col){
      const l=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.14),col);
      l.userData.dyn=true;l.position.set(x,y,z);parent.add(l);flames.push(l)}
    function deck(a,y,depth,w){
      const grp=new THREE.Group();
      const rr=RAD-depth;
      grp.position.set(Math.cos(a)*rr,y,Math.sin(a)*rr);
      grp.rotation.y=-a+Math.PI/2;G.add(grp);
      // płyta kratownicowa
      const plate=new THREE.Mesh(new THREE.BoxGeometry(w,.5,depth*1.4),GRAPH);
      grp.add(plate);
      const edge=new THREE.Mesh(new THREE.BoxGeometry(w,.16,.2),CYAN);
      edge.position.set(0,.28,depth*.7);grp.add(edge);
      // wsporniki do ściany (w skałę/panel: +z)
      for(const sg of[-1,1]){
        const br=new THREE.Mesh(new THREE.CylinderGeometry(.2,.28,depth*1.5,6),STEEL2);
        br.position.set(sg*w*.4,-1.4,depth*.5);br.rotation.x=-.6;grp.add(br)}
      // balustrada od strony przepaści
      const rail=new THREE.Mesh(new THREE.BoxGeometry(w,.06,.06),STEEL2);
      rail.position.set(0,1,depth*.7);grp.add(rail);
      for(let k=-2;k<=2;k++){const pst=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1,4),STEEL2);
        pst.position.set(k*w*.2,.5,depth*.7);grp.add(pst)}
      return grp}

    /* GÓRA: hala chłodzenia — pierścienie, kominy pary, konsole */
    {const D=deck(3.7,H*.82,11,20);
     // konsola sterownicza z ekranami
     for(let k=0;k<3;k++){const con=new THREE.Mesh(new THREE.BoxGeometry(3,2.4,1.4),GRAPH2);
       con.position.set(-6+k*6,1.5,-3);D.add(con);
       const scr=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.4,.1),k%2?CYAN:MAG);
       scr.position.set(-6+k*6,2,-2.2);D.add(scr)}
     panelLight(D,7,2,-2,AMBER);panelLight(D,-8,2,-2,CYAN);
     // kominy pary za platformą
     for(const [cx,cz] of[[-7,-6],[6,-6]]){
       const stack=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,7,10),GRAPH);
       stack.position.set(cx,3.5,cz);D.add(stack)}}
    // para z góry (unosi się)
    const steams=[];
    for(let i=0;i<4;i++){const s2=new THREE.Mesh(new THREE.SphereGeometry(2.2,8,6),glow(0x9fc4d8,.28));
      s2.userData.dyn=true;s2.scale.y=.5;G.add(s2);steams.push(s2)}

    /* ŚRODEK: hala kondensatorów */
    {const D=deck(5.2,H*.56,10,18);
     for(let k=0;k<4;k++){const cap=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,5,12),STEEL);
       cap.position.set(-6+k*4,2.5,-2);D.add(cap);
       const top=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,.6,12),k%2?MAG:CYAN);
       top.position.set(-6+k*4,5.2,-2);D.add(top);
       const bolt=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,4.5),k%2?MAG:CYAN);
       bolt.position.set(-6+k*4,2.5,.2);D.add(bolt)}
     panelLight(D,7,1.6,1,CYAN)}

    /* NISKO: przetwornice + generator */
    {const D=deck(3.4,H*.32,10,16);
     const gen=new THREE.Mesh(new THREE.BoxGeometry(6,4,4),GRAPH2);
     gen.position.set(0,2,-2);D.add(gen);
     const coil=dyn(new THREE.Mesh(new THREE.TorusGeometry(1.6,.5,6,16),AMBER));
     coil.position.set(0,3,.4);D.add(coil);D.userData.coil=coil;
     for(const sg of[-1,1]){const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,6,8),STEEL);
       pipe.rotation.z=Math.PI/2;pipe.position.set(0,1,sg*1.6);D.add(pipe)}
     panelLight(D,6,1.4,1,AMBER);panelLight(D,-6,1.4,1,MAG)}

    /* ── SZYNY ENERGII: spiralne kable światła wzdłuż ściany ── */
    for(let s=0;s<3;s++){
      const col=[CYAN,MAG,AMBER][s];
      const pts=[];
      for(let i=0;i<=60;i++){const t=i/60;
        const a=s*2.1+t*Math.PI*4;
        const r=RAD-4-Math.sin(t*Math.PI)*2;
        pts.push(new THREE.Vector3(Math.cos(a)*r,6+t*(H-14),Math.sin(a)*r))}
      const curve=new THREE.CatmullRomCurve3(pts);
      const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,60,.22,5,false),col);
      G.add(tube)}

    /* ── MOSTY łączące platformy z kolumną (przejścia) ── */
    function bridge(a,y,depth){
      const rr=RAD-depth;
      const x0=Math.cos(a)*rr, z0=Math.sin(a)*rr;
      const len=rr-colR;
      const grp=new THREE.Group();
      grp.position.set(Math.cos(a)*(colR+len/2),y,Math.sin(a)*(colR+len/2));
      grp.rotation.y=-a;G.add(grp);
      const deckB=new THREE.Mesh(new THREE.BoxGeometry(len,.3,2.4),GRAPH);grp.add(deckB);
      const glowB=new THREE.Mesh(new THREE.BoxGeometry(len,.08,.3),CYAN);
      glowB.position.y=.2;grp.add(glowB);
      for(const sg of[-1,1]){const rl=new THREE.Mesh(new THREE.BoxGeometry(len,.05,.05),STEEL2);
        rl.position.set(0,.7,sg*1.1);grp.add(rl)}}
    bridge(3.7,H*.82-.2,11); bridge(5.2,H*.56-.2,10); bridge(3.4,H*.32-.2,10);

    /* ── DNO: komora rdzenia — pulsujący reaktor (lądowisko na szczycie) ── */
    const floor=new THREE.Mesh(new THREE.CylinderGeometry(RAD+4,RAD+4,2,24),GRAPHD);
    floor.position.y=-1;floor.name='terr';G.add(floor);
    // koncentryczne kręgi neonu na podłodze
    for(let k=1;k<=4;k++){const cr=new THREE.Mesh(new THREE.TorusGeometry(6+k*7,.16,6,32),k%2?CYAN:MAG);
      cr.rotation.x=-Math.PI/2;cr.position.y=.05;G.add(cr)}
    // podstawa reaktora (na niej pad)
    const base=new THREE.Mesh(new THREE.CylinderGeometry(7,9,4,16),GRAPH2);
    base.position.y=2;G.add(base);
    const baseGlow=dyn(new THREE.Mesh(new THREE.TorusGeometry(7,.35,8,24),CORE_C));
    baseGlow.rotation.x=-Math.PI/2;baseGlow.position.y=4.15;G.add(baseGlow);
    // szczeliny energii w bocznej ścianie podstawy
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;
      const slit=new THREE.Mesh(new THREE.BoxGeometry(.3,3,.3),k%2?CYAN:MAG);
      slit.position.set(Math.cos(a)*8,2,Math.sin(a)*8);G.add(slit)}
    // 6 kolumn energii wokół podstawy, biegnących w górę do pierwszego toroidu
    const pillars=[];
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2;
      const p=dyn(new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,H*.34,8),CYAN));
      p.position.set(Math.cos(a)*10,H*.17+4,Math.sin(a)*10);G.add(p);pillars.push(p)}

    /* ── DRONY SERWISOWE krążące (życie) ── */
    const drones=[];
    for(let i=0;i<3;i++){
      const d=dyn(new THREE.Group());G.add(d);
      const body=new THREE.Mesh(new THREE.BoxGeometry(1.6,.5,1),STEEL2);d.add(body);
      const eye=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),i%2?CYAN:MAG);
      eye.position.set(.8,0,0);d.add(eye);
      for(const e of[-1,1]){const bl=new THREE.Mesh(new THREE.BoxGeometry(.1,.05,.9),STEEL);
        bl.position.set(e*.5,.3,0);d.add(bl)}
      d.userData={ph:i*2.1,r:26+i*7,h:H*.4+i*20,sp:.4+i*.15};
      const u=d.userData;d.position.set(Math.cos(u.ph)*u.r,u.h,Math.sin(u.ph)*u.r);
      drones.push(d)}

    /* ── ISKRY unoszące się z rdzenia ── */
    const sparks=[];
    for(let i=0;i<16;i++){
      const sp=new THREE.Mesh(new THREE.SphereGeometry(.14,6,4),i%2?PLASMA:CORE_C);
      sp.userData.dyn=true;
      sp.userData={a:rnd()*6.28,r:2+rnd()*10,h:4+rnd()*H*.7,sp:.3+rnd()*.5,base:4+rnd()*3};
      G.add(sp);sparks.push(sp)}

    /* ── PAD REAKTORA (szczyt podstawy) ── */
    const padDisc=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.5,.2,24),std(0x1a2028,.4,.6));
    padDisc.position.y=4.5;G.add(padDisc);
    const padTrim=new THREE.Mesh(new THREE.TorusGeometry(2.4,.1,8,28),bas(0x2fd4e8));
    padTrim.rotation.x=-Math.PI/2;padTrim.position.y=4.6;G.add(padTrim);
    const pring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.06,8,36),bas(0x9ff0ff));
    pring.rotation.x=-Math.PI/2;pring.position.y=4.62;G.add(pring);
    const hM=bas(0xdff4ff);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,4.61,0);
    const h2=h1.clone();h2.position.x=.34;h2.position.y=4.61;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.y=4.61;
    G.add(h1,h2,h3);
    for(let k=0;k<4;k++){const a=k/4*Math.PI*2+Math.PI/4;
      const tl=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),bas(0x9ff0ff));
      tl.position.set(Math.cos(a)*2.2,4.67,Math.sin(a)*2.2);G.add(tl)}

    /* ── ŚWIATŁA ── */
    const pl1=new THREE.PointLight(0xff7ae0,1.1,60,2);pl1.position.set(0,6,0);G.add(pl1);
    const pl2=new THREE.PointLight(0x2fd4e8,.7,80);pl2.position.set(0,H*.5,0);G.add(pl2);
    const pl3=new THREE.PointLight(0x8fd0ff,.6,90);pl3.position.set(0,H+4,0);G.add(pl3);

    return {group:G, pad:{h:.14},
      animate(dt,t){
        // toroidy obracają się, plazma pulsuje
        toroids.forEach(o=>{o.grp.rotation.y+=dt*o.sp*o.dir;
          o.grp.rotation.x=Math.sin(t*.4+o.sp)*.06});
        // rdzeń pulsuje (skala świecących elementów)
        const pulse=.85+Math.sin(t*2.2)*.15;
        baseGlow.scale.set(pulse,pulse,1);
        pillars.forEach((p,i)=>{p.scale.x=p.scale.z=.8+Math.sin(t*2.2+i)*.25});
        // panele/ekrany migoczą
        flames.forEach((f,i)=>f.visible=((t*1.3+i*.4)%1)>.15);
        // para unosi się
        steams.forEach((s2,i)=>{const u=(t*.1+i/4)%1;
          s2.position.set((i<2?-7:6)+(rnd()-.5)*.2,H*.82+3+u*20,-6);
          s2.scale.set(.6+u*1.8,(.6+u*1.8)*.5,.6+u*1.8);
          s2.material.opacity=.28*(1-u)});
        // szyny/generator
        if(true){}
        drones.forEach(d=>{const u=d.userData;u.ph+=dt*u.sp*.4;
          d.position.set(Math.cos(u.ph)*u.r,u.h+Math.sin(t*.6+u.h)*1.5,Math.sin(u.ph)*u.r);
          d.rotation.y=-u.ph});
        sparks.forEach(s2=>{const u=s2.userData;
          const yy=u.base+((t*u.sp*8+u.h)% (H*.8));
          s2.position.set(Math.cos(u.a+t*.2)*u.r,yy,Math.sin(u.a+t*.2)*u.r);
          s2.visible=yy<H*.78});
      }};
  }
};
})(window);
