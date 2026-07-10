/* MA//BIOME:CIRCUIT — Kanion krzemowy (ELEKTRONIKA), noc
   Teren = laminat PCB, świecące ścieżki, budynki = układy scalone,
   kondensatory-wieże, CPU z wentylatorem, rzeka danych, mrugające LED. */
(function(root){
'use strict';
root.MABIOME_CIRCUIT={
  MAXALT:320,
  FOG_STOPS:[[0,0x02040c],[.14,0x041020],[.34,0x062033],[.58,0x0a2e40],[.8,0x0d3a4c],[1,0x0f4152]],
  SUN:{col:0x9fc8ff,int:.55},
  HEMI:{sky:0x18365a,ground:0x040d14,int:.8},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.7,metalness:m??0});
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    const LAM =std(0x0c211a,.9);        // laminat
    const LAM2=std(0x0a1b15,.92);
    const CHIP=std(0x14181d,.5,.15);    // korpus IC
    const CHIP2=std(0x1a1f26,.5,.15);
    const GOLD=std(0xd8a73a,.35,.85);   // piny/pady
    const SIL =std(0xb9c2cc,.4,.6);     // sitodruk/top
    const CAPB=std(0x1b3340,.55,.2);    // kondensator
    const CAPN=std(0x233049,.5,.2);
    const TRC =bas(0x27e0a0);           // ścieżka zielona
    const TRC2=bas(0x37c9f0);           // ścieżka cyjan
    const GLOW=bas(0x7fe6ff);

    /* — PŁYTA — */
    const board=new THREE.Mesh(new THREE.PlaneGeometry(560,420,1,1),LAM);
    board.rotation.x=-Math.PI/2;board.name='terr';G.add(board);
    // ciemniejsze strefy (zasilanie)
    [[-120,-70,150,120],[110,-90,170,140],[0,60,220,120]].forEach(([x,z,w,d])=>{
      const zone=new THREE.Mesh(new THREE.PlaneGeometry(w,d),LAM2);
      zone.rotation.x=-Math.PI/2;zone.position.set(x,.01,z);zone.name='terr';G.add(zone)});

    /* — ŚCIEŻKI (Manhattan) + PRZELOTKI — */
    function via(x,z){const v=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.14,10),GOLD);
      v.position.set(x,.07,z);G.add(v)}
    function seg(x1,z1,x2,z2,mat){
      const dx=x2-x1,dz=z2-z1,L=Math.hypot(dx,dz);
      const s=new THREE.Mesh(new THREE.BoxGeometry(L,.05,.32),mat);
      s.position.set((x1+x2)/2,.03,(z1+z2)/2);
      s.rotation.y=-Math.atan2(dz,dx);G.add(s)}
    function trace(pts,mat){for(let i=0;i<pts.length-1;i++)seg(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],mat);
      pts.forEach(p=>via(p[0],p[1]))}
    let sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    for(let i=0;i<26;i++){
      const x0=(rnd()-.5)*440,z0=40+rnd()*60;
      const midx=x0+(rnd()-.5)*120, z1=-20-rnd()*90, x1=midx+(rnd()-.5)*140, z2=-120-rnd()*60;
      trace([[x0,z0],[x0,z1],[midx,z1],[midx,z2],[x1,z2]],rnd()<.5?TRC:TRC2);
    }

    /* — UKŁADY SCALONE (budynki) — */
    function chip(x,z,w,d,h,rot){
      const grp=new THREE.Group();grp.position.set(x,0,z);grp.rotation.y=rot||0;G.add(grp);
      const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),rnd()<.5?CHIP:CHIP2);
      body.position.y=h/2+.4;grp.add(body);
      const top=new THREE.Mesh(new THREE.BoxGeometry(w*.7,.14,d*.7),SIL);
      top.position.y=h+.48;grp.add(top);
      const dot=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.1,10),std(0xe8ecef,.5));
      dot.position.set(-w*.3,h+.56,-d*.3);grp.add(dot);
      const pinN=Math.max(3,Math.floor(w/3.2));
      for(let k=0;k<pinN;k++){const px=-w/2+ (k+.5)*(w/pinN);
        [-1,1].forEach(s=>{const pin=new THREE.Mesh(new THREE.BoxGeometry(1.1,.5,.9),GOLD);
          pin.position.set(px,.28,s*(d/2+.55));grp.add(pin)})}
      // świecące okna-porty na ścianach
      const winRows=Math.max(1,Math.floor(h/4));
      for(let r=0;r<winRows;r++){const wy=2+r*(h-2)/winRows;
        const strip=new THREE.Mesh(new THREE.BoxGeometry(w*.86,.5,.06),rnd()<.5?TRC:TRC2);
        strip.position.set(0,wy,d/2+.04);grp.add(strip);
        const strip2=strip.clone();strip2.position.z=-d/2-.04;grp.add(strip2)}
      return grp}
    // klaster tylny (wysokie), środek, przód niżej
    chip(-96,-128,20,20,42,.1); chip(-40,-140,24,22,54,0); chip(28,-134,20,20,46,-.12);
    chip(96,-126,18,18,38,.15); chip(-140,-110,16,16,30,0); chip(150,-112,16,16,28,0);
    chip(-70,-84,16,14,24,.2); chip(66,-88,18,15,26,-.1);
    chip(-16,-70,14,12,18,0);  chip(120,-70,13,12,16,.3);
    chip(-116,-56,12,11,12,0); chip(40,-52,12,11,11,-.2);
    chip(-52,-40,10,9,8,.1);   chip(90,-38,10,9,7,0);

    /* — CPU centralny z radiatorem i wentylatorem — */
    const cpu=new THREE.Group();cpu.position.set(0,-104,0);
    cpu.position.set(0,0,-104);G.add(cpu);
    const die=new THREE.Mesh(new THREE.BoxGeometry(30,7,30),CHIP);die.position.y=3.9;cpu.add(die);
    for(let f=0;f<11;f++){const fin=new THREE.Mesh(new THREE.BoxGeometry(28,9,.8),SIL);
      fin.position.set(0,12,-13+f*2.6);cpu.add(fin)}
    const fanG=new THREE.Group();fanG.position.set(0,17.6,0);fanG.userData.dyn=true;cpu.add(fanG);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,1,12),CHIP2);fanG.add(hub);
    for(let b=0;b<5;b++){const bl=new THREE.Mesh(new THREE.BoxGeometry(9,.3,2.6),SIL);
      bl.position.x=5.4;bl.rotation.z=.5;
      const hold=new THREE.Group();hold.rotation.y=b/5*Math.PI*2;hold.add(bl);fanG.add(hold)}
    const ring=new THREE.Mesh(new THREE.TorusGeometry(11.5,.6,8,26),CHIP2);
    ring.rotation.x=Math.PI/2;ring.position.y=17.6;cpu.add(ring);
    const cpuGlow=new THREE.Mesh(new THREE.BoxGeometry(30.6,.4,30.6),GLOW);
    cpuGlow.position.y=.42;cpu.add(cpuGlow);

    /* — KONDENSATORY-WIEŻE — */
    function cap(x,z,r,h,navy){
      const m=navy?CAPN:CAPB;
      const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),m);
      c.position.set(x,h/2+.4,z);G.add(c);
      const band=new THREE.Mesh(new THREE.CylinderGeometry(r+.06,r+.06,h*.16,16),SIL);
      band.position.set(x,h*.86,z);G.add(band);
      const grv=new THREE.Mesh(new THREE.BoxGeometry(r*1.5,.16,.5),CHIP);
      grv.position.set(x,h+.5,z);G.add(grv);
      const grv2=grv.clone();grv2.rotation.y=Math.PI/2;G.add(grv2);grv2.position.set(x,h+.5,z)}
    cap(-150,-80,4.2,26); cap(160,-88,4.6,30,true); cap(-24,-118,3.6,22,true);
    cap(58,-114,3.4,20); cap(-88,-30,2.8,14); cap(132,-44,2.6,12,true);

    /* — REZYSTORY (leżące) — */
    function res(x,z,rot){
      const g2=new THREE.Group();g2.position.set(x,1.5,z);g2.rotation.y=rot;G.add(g2);
      const body=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,7,12),std(0xc9a06a,.7));
      body.rotation.z=Math.PI/2;g2.add(body);
      [[-2,-1.1,0x8a2f2a],[0,-1.1,0x2f6b3a],[2,-1.1,0x2a3f8a]].forEach(([bx,,bc])=>{
        const band=new THREE.Mesh(new THREE.CylinderGeometry(1.36,1.36,.7,12),std(bc,.6));
        band.rotation.z=Math.PI/2;band.position.x=bx;g2.add(band)});
      [-1,1].forEach(e=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,3,8),SIL);
        leg.rotation.z=Math.PI/2;leg.position.x=e*5;g2.add(leg);
        const bend=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,1.4,8),SIL);
        bend.position.set(e*6.4,-.7,0);g2.add(bend)})}
    res(-58,10,.3); res(70,4,-.5); res(-120,-8,1.1); res(24,22,0);

    /* — RZEKA DANYCH: kanał + płynące impulsy — */
    const canal=new THREE.Mesh(new THREE.PlaneGeometry(560,10),std(0x061219,.85));
    canal.rotation.x=-Math.PI/2;canal.position.set(0,.02,34);canal.name='terr';G.add(canal);
    [[-1,31.2],[1,36.8]].forEach(([,cz])=>{
      const edge=new THREE.Mesh(new THREE.BoxGeometry(560,.08,.3),TRC2);
      edge.position.set(0,.05,cz);G.add(edge)});
    const pulses=[];
    for(let i=0;i<14;i++){
      const pl=new THREE.Mesh(new THREE.BoxGeometry(4.5,.22,1.1),i%3?TRC2:TRC);
      pl.userData.dyn=true;pl.position.set(-280+i*40+ (i%2)*15,.2,34+(i%2?-1.6:1.6));
      pl.userData.v=26+(i%4)*7;G.add(pl);pulses.push(pl)}

    /* — LED (dwie mrugające grupy) — */
    const ledA=new THREE.Group();ledA.userData.dyn=true;G.add(ledA);
    const ledB=new THREE.Group();ledB.userData.dyn=true;G.add(ledB);
    const LMA=bas(0xff5a4d), LMB=bas(0x37e0a0);
    for(let i=0;i<26;i++){
      const x=(rnd()-.5)*380, z=(rnd())*70-10;
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.6,6),SIL);
      stem.position.set(x,1.2,z);G.add(stem);
      const led=new THREE.Mesh(new THREE.SphereGeometry(.55,8,6),(i%2?LMA:LMB));
      led.position.set(x,2.3,z);(i%2?ledA:ledB).add(led)}

    /* — ANTENA z czerwonym strobo — */
    const mastPos=[[-40,-140,60],[96,-126,44]];
    const strobes=[];
    mastPos.forEach(([mx,mz,mh])=>{
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.35,.6,14,8),SIL);
      mast.position.set(mx,mh+7,mz);G.add(mast);
      const sb=new THREE.Mesh(new THREE.SphereGeometry(.7,8,6),bas(0xff3b30));
      sb.userData.dyn=true;sb.position.set(mx,mh+14.6,mz);G.add(sb);strobes.push(sb)});

    /* — ŚCIANY KANIONU: pionowe płyty z pojedynczymi ścieżkami — */
    function wall(x,z,w,h,rot){
      const p=new THREE.Mesh(new THREE.BoxGeometry(w,h,3),LAM2);
      p.position.set(x,h/2-2,z);p.rotation.y=rot;G.add(p);
      if(rot===0)for(let k=0;k<Math.floor(w/26);k++){
        const tx=-w/2+13+k*26;
        const line=new THREE.Mesh(new THREE.BoxGeometry(.4,h*.7,.2),k%2?TRC:TRC2);
        line.position.set(x+tx, h*.42, z+1.6);G.add(line)}}
    wall(0,-196,540,86,0);
    wall(-262,-60,300,64,Math.PI/2);
    wall(262,-60,300,64,-Math.PI/2);

    /* — LĄDOWISKO: złoty pad lutowniczy — */
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.05,.05,26),GOLD);
    pad.position.y=.028;G.add(pad);
    const pring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),GLOW);
    pring.rotation.x=-Math.PI/2;pring.position.y=.06;G.add(pring);
    const hM=bas(0x0c211a);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,.062,0);
    const h2=h1.clone();h2.position.x=.34;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.y=.062;
    G.add(h1,h2,h3);

    /* — SITODRUK i drobnica na pierwszym planie — */
    const SILK=bas(0xcfd9e2);
    // przerywany okrąg wokół padu
    for(let k=0;k<12;k++){const a=k/12*Math.PI*2;
      const dash=new THREE.Mesh(new THREE.BoxGeometry(1.1,.02,.22),SILK);
      dash.position.set(Math.cos(a)*3.1,.03,Math.sin(a)*3.1);
      dash.rotation.y=-a+Math.PI/2;G.add(dash)}
    // ścieżki zasilające zbiegające do padu (4 kierunki)
    trace([[0,3.2],[0,14],[18,14],[18,30]],TRC2);
    trace([[0,-3.2],[0,-14],[-22,-14],[-22,-34]],TRC);
    trace([[3.2,0],[16,0],[16,-18],[46,-18]],TRC);
    trace([[-3.2,0],[-16,0],[-16,12],[-44,12]],TRC2);
    // obrysy footprintów (prostokąty sitodruku)
    [[-30,18,9,6],[36,10,7,5],[-14,-26,8,5],[52,-8,10,6],[-52,-4,7,7]].forEach(([fx,fz,fw,fd])=>{
      [[0,fd/2],[0,-fd/2]].forEach(([ox,oz])=>{
        const e=new THREE.Mesh(new THREE.BoxGeometry(fw,.02,.16),SILK);
        e.position.set(fx+ox,.028,fz+oz);G.add(e)});
      [[fw/2,0],[-fw/2,0]].forEach(([ox,oz])=>{
        const e=new THREE.Mesh(new THREE.BoxGeometry(.16,.02,fd),SILK);
        e.position.set(fx+ox,.028,fz+oz);G.add(e)})});
    // rozsyp SMD (kondensatorki/rezystorki 0603)
    for(let i=0;i<34;i++){
      const sx=(rnd()-.5)*130, sz=(rnd()-.35)*70;
      if(Math.hypot(sx,sz)<5)continue;
      const smd=new THREE.Mesh(new THREE.BoxGeometry(1.6,.6,.9),
        i%3?std(0x2b2f36,.5,.2):std(0xc9a06a,.7));
      smd.position.set(sx,.32,sz);smd.rotation.y=rnd()*Math.PI;G.add(smd);
      [-1,1].forEach(e=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.24,.6,.9),SIL);
        t.position.set(sx+Math.cos(smd.rotation.y)*e*.92,.32,sz-Math.sin(smd.rotation.y)*e*.92);
        t.rotation.y=smd.rotation.y;G.add(t)})}

    return {group:G, pad:{h:.06},
      animate(dt,t){
        fanG.rotation.y+=dt*9;
        const on=(t%1.1)<.55;
        ledA.visible=on;ledB.visible=!on;
        strobes.forEach(s=>s.visible=(t%1.4)<.12);
        pulses.forEach(pl=>{pl.position.x+=pl.userData.v*dt;
          if(pl.position.x>285)pl.position.x=-285});
      }};
  }
};
})(window);
