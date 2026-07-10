/* MA//BIOME:RIDGE — Serpentyna (DOŚWIADCZENIE), świt
   Górska droga-oś czasu: tarasy-kamienie milowe od liceum po politechnikę. */
(function(root){
'use strict';
root.MABIOME_RIDGE={
  MAXALT:300,
  FOG_STOPS:[[0,0x0c0a1c],[.16,0x2c1a44],[.36,0x6e4470],[.56,0xa8636e],[.76,0xd08a62],[1,0xe6a866]],
  SUN:{col:0xffb46a,int:1.25},
  HEMI:{sky:0x9a72a8,ground:0x5c4a3c,int:.72},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.75,metalness:m??0});
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    const ROCK=std(0x8a6a58,.9), ROCK2=std(0x74584c,.92);
    const GRASS=std(0x7a8a4e,.9), ROAD=std(0x5b5a60,.85);
    const WOOD=std(0x8a6238,.85), WHITE=std(0xe9e2d4,.6);
    const BRICK=std(0xb9705a,.8), SLATE=std(0x4a4e58,.7);
    const ORANGE=std(0xe8500f,.5), GREENT=std(0x4e6e3c,.9);
    let sd=21;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};

    /* — STOK: plan wznoszący się ku tyłowi + fałdy — */
    const terrG=new THREE.PlaneGeometry(560,440,64,44);
    {const P=terrG.attributes.position;
     for(let i=0;i<P.count;i++){
       const x=P.getX(i), zz=P.getY(i);       // plane leży w XY przed rotacją
       const back=Math.max(0,Math.min(1,(zz+60)/220)); // zz→głębokość po rotacji
       let h=back*back*58;
       h+=Math.sin(x*.02+zz*.013)*3*back + Math.sin(x*.07)*1.2;
       h+=(rnd()-.5)*.8;
       P.setZ(i,h)}
     terrG.computeVertexNormals()}
    const terr=new THREE.Mesh(terrG,ROCK);
    terr.rotation.x=-Math.PI/2;terr.name='terr';G.add(terr);
    // łąka u podnóża
    const meadow=new THREE.Mesh(new THREE.PlaneGeometry(560,120),GRASS);
    meadow.rotation.x=-Math.PI/2;meadow.position.set(0,.02,44);meadow.name='terr';G.add(meadow);
    // dalekie granie sylwetkowe
    function farRidge(w,h,z,mat,seed){
      const g=new THREE.PlaneGeometry(w,h,40,4);const P=g.attributes.position;
      for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i);
        const rl=1-Math.abs(Math.sin(x*.011+seed));
        P.setY(i,y+rl*h*.5*(y/h+.5))}
      g.computeVertexNormals();
      const m=new THREE.Mesh(g,mat);m.position.set(0,h*.3,z);G.add(m)}
    farRidge(820,120,-224,std(0xd9986a,.9),1.2);
    farRidge(740,96,-206,std(0xb0765c,.9),4.4);

    /* — TARASY (kamienie milowe) — */
    const slopeH=z=>Math.pow((-z+60)/220,2)*58;
    const T=[ // [x, z, y] — y osadzone NA stoku
      [-46,-34, slopeH(-34)+1.0],    // T1 LICEUM  (~11.6)
      [ 44,-72, slopeH(-72)+1.0],    // T2 KURIER  (~21.9)
      [-40,-108,slopeH(-108)+1.0],   // T3 KOREPETYCJE (~34.8)
      [ 30,-146,slopeH(-146)+1.0],   // T4 POLITECHNIKA (~51.8)
    ];
    T.forEach(([tx,tz,ty])=>{
      const plat=new THREE.Mesh(new THREE.CylinderGeometry(13,15.5,4,20),ROCK2);
      plat.position.set(tx,ty-2,tz);G.add(plat);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(12.4,12.4,.3,20),std(0xa08a70,.85));
      top.position.set(tx,ty+.15,tz);G.add(top)});

    /* — SERPENTYNA: rampy między tarasami + słupki — */
    function ramp(x1,z1,y1,x2,z2,y2){
      const dx=x2-x1,dz=z2-z1,dy=y2-y1;
      const L=Math.hypot(dx,dz);
      const seg=new THREE.Mesh(new THREE.BoxGeometry(L+4,.5,5),ROAD);
      seg.position.set((x1+x2)/2,(y1+y2)/2+.1,(z1+z2)/2);
      seg.rotation.y=-Math.atan2(dz,dx);
      seg.rotation.z=Math.atan2(dy,L);
      G.add(seg);
      // środkowa linia
      const line=new THREE.Mesh(new THREE.BoxGeometry(L+3,.06,.3),std(0xe8e2d0,.7));
      line.position.copy(seg.position);line.position.y+=.32;
      line.rotation.copy(seg.rotation);G.add(line);
      // słupki barierki po zewnętrznej
      const n=Math.floor(L/6);
      for(let k=0;k<=n;k++){const t=k/n;
        const px=x1+dx*t, pz=z1+dz*t, py=y1+dy*t;
        const nx=-dz/L, nz=dx/L;
        const post=new THREE.Mesh(new THREE.BoxGeometry(.3,1.1,.3),WHITE);
        post.position.set(px+nx*2.8,py+.75,pz+nz*2.8);G.add(post)}}
    // start (łąka) → T1 → T2 → T3 → T4
    ramp(-8,26,0.4, T[0][0]+10,T[0][1]+6,T[0][2]);
    ramp(T[0][0]-8,T[0][1]-8,T[0][2], T[1][0]-10,T[1][1]+7,T[1][2]);
    ramp(T[1][0]+8,T[1][1]-8,T[1][2], T[2][0]+11,T[2][1]+6,T[2][2]);
    ramp(T[2][0]-9,T[2][1]-8,T[2][2], T[3][0]-11,T[3][1]+6,T[3][2]);

    /* — T1: LICEUM (budynek z dwuspadowym dachem, zegar, chorągiewka) — */
    {const [x,z,y]=T[0];
     const b=new THREE.Mesh(new THREE.BoxGeometry(12,6,8),BRICK);b.position.set(x,y+3,z);G.add(b);
     const roofG=new THREE.BufferGeometry();
     const hw=6.6,hd=4.6,rh=3;
     const v=new Float32Array([ -hw,0,-hd, hw,0,-hd, 0,rh,-hd,  -hw,0,hd, hw,0,hd, 0,rh,hd,
       -hw,0,-hd,-hw,0,hd,0,rh,hd, -hw,0,-hd,0,rh,hd,0,rh,-hd,
        hw,0,-hd,0,rh,-hd,0,rh,hd, hw,0,-hd,0,rh,hd,hw,0,hd]);
     roofG.setAttribute('position',new THREE.BufferAttribute(v,3));roofG.computeVertexNormals();
     const roof=new THREE.Mesh(roofG,SLATE);roof.position.set(x,y+6,z);G.add(roof);
     const door=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.6,.3),WOOD);door.position.set(x,y+1.3,z+4.1);G.add(door);
     for(const wx of[-3.6,-1.2,1.2,3.6])for(const wy of[2.2,4.4]){
       const w=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,.15),std(0xcfe2ea,.4,.2));
       w.position.set(x+wx,y+wy,z+4.05);G.add(w)}
     const clock=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.2,14),WHITE);
     clock.rotation.x=Math.PI/2;clock.position.set(x,y+7.4,z+2.4);G.add(clock);
     const sign=new THREE.Mesh(new THREE.BoxGeometry(4.2,1,.2),WHITE);
     sign.position.set(x,y+5.2,z+4.15);G.add(sign)}

    /* — T2: KURIER (rower, paczkomat, plecak termiczny) — */
    {const [x,z,y]=T[1];
     const bike=new THREE.Group();bike.position.set(x-4,y,z+2);bike.rotation.y=.6;G.add(bike);
     for(const wx of[-1.5,1.5]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(1,.14,8,18),SLATE);
       wheel.position.set(wx,1,0);bike.add(wheel);
       const hubm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.3,8),WHITE);
       hubm.rotation.x=Math.PI/2;hubm.position.set(wx,1,0);bike.add(hubm)}
     const bar1=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,2.4,8),ORANGE);
     bar1.rotation.z=.5;bar1.position.set(0,1.5,0);bike.add(bar1);
     const bar2=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.9,8),ORANGE);
     bar2.rotation.z=-.9;bar2.position.set(.8,1.55,0);bike.add(bar2);
     const seat=new THREE.Mesh(new THREE.BoxGeometry(.7,.2,.4),SLATE);seat.position.set(-.7,2.25,0);bike.add(seat);
     const hb=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.9,8),SLATE);
     hb.rotation.x=Math.PI/2;hb.position.set(1.5,2.4,0);bike.add(hb);
     // paczkomat
     const lock=new THREE.Mesh(new THREE.BoxGeometry(7,4.6,1.6),std(0xc9b649,.6));
     lock.position.set(x+4,y+2.3,z-3);G.add(lock);
     for(let cx2=0;cx2<5;cx2++)for(let cy2=0;cy2<3;cy2++){
       const cell=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.15,.12),SLATE);
       cell.position.set(x+4-2.6+cx2*1.3,y+.9+cy2*1.4,z-2.15);G.add(cell)}
     const pack=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.2),ORANGE);
     pack.position.set(x-1,y+.8,z-1);pack.rotation.y=.4;G.add(pack)}

    /* — T3: KOREPETYCJE (tablica, ławki, drzewo) — */
    {const [x,z,y]=T[2];
     const board=new THREE.Mesh(new THREE.BoxGeometry(6,3.2,.25),std(0x2c4438,.8));
     board.position.set(x,y+2.6,z-2);G.add(board);
     const frame3=new THREE.Mesh(new THREE.BoxGeometry(6.5,3.7,.15),WOOD);
     frame3.position.set(x,y+2.6,z-2.15);G.add(frame3);
     for(const [lx,ly,lw] of[[-1.6,3.2,2.4],[-1.2,2.6,1.6],[.9,3.1,1.8],[1.3,2.2,2.2],[-.2,1.8,1.4]]){
       const chalk=new THREE.Mesh(new THREE.BoxGeometry(lw,.12,.05),WHITE);
       chalk.position.set(x+lx,y+ly,z-1.85);chalk.rotation.z=(rnd()-.5)*.2;G.add(chalk)}
     for(const [px,pz] of[[-2.6,-2],[2.6,-2]]){
       const leg=new THREE.Mesh(new THREE.BoxGeometry(.3,2.2,.3),WOOD);
       leg.position.set(x+px,y+1.1,z+pz);G.add(leg)}
     for(const bz of[1.5,3.4]){
       const bench=new THREE.Mesh(new THREE.BoxGeometry(5.4,.3,1),WOOD);
       bench.position.set(x,y+.9,z+bz);G.add(bench);
       for(const px of[-2.2,2.2]){const bl=new THREE.Mesh(new THREE.BoxGeometry(.3,.9,.9),WOOD);
         bl.position.set(x+px,y+.45,z+bz);G.add(bl)}}
     const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.3,.4,2.6,8),WOOD);
     trunk.position.set(x+7,y+1.3,z+3);G.add(trunk);
     const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.4,0),GREENT);
     crown.position.set(x+7,y+3.8,z+3);G.add(crown)}

    /* — T4: POLITECHNIKA (kolumnowy fronton + proporzec ONYKS) — */
    let flag;
    {const [x,z,y]=T[3];
     const pod=new THREE.Mesh(new THREE.BoxGeometry(16,1.4,10),WHITE);
     pod.position.set(x,y+.7,z);G.add(pod);
     const body=new THREE.Mesh(new THREE.BoxGeometry(13,7,7.5),std(0xd9cdb8,.7));
     body.position.set(x,y+4.9,z-.6);G.add(body);
     for(const cx3 of[-5,-1.7,1.7,5]){
       const col=new THREE.Mesh(new THREE.CylinderGeometry(.55,.6,6.2,12),WHITE);
       col.position.set(x+cx3,y+4.5,z+3.4);G.add(col)}
     const arch=new THREE.Mesh(new THREE.BoxGeometry(14.6,1.3,8.6),WHITE);
     arch.position.set(x,y+8.1,z-.2);G.add(arch);
     // tympanon
     const tg=new THREE.BufferGeometry();
     const tv=new Float32Array([-7.3,0,0, 7.3,0,0, 0,2.6,0]);
     tg.setAttribute('position',new THREE.BufferAttribute(tv,3));tg.computeVertexNormals();
     const tym=new THREE.Mesh(tg,std(0xd9cdb8,.7));
     tym.position.set(x,y+8.7,z+3.9);G.add(tym);
     const tymB=tym.clone();tymB.rotation.y=Math.PI;tymB.position.z=z-4.3;G.add(tymB);
     const doorU=new THREE.Mesh(new THREE.BoxGeometry(2.4,4,.3),SLATE);
     doorU.position.set(x,y+3.4,z+3.3);G.add(doorU);
     // maszt + proporzec ONYKS (animowany)
     const mast=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,9,8),WHITE);
     mast.position.set(x+8.6,y+5.9,z+2);G.add(mast);
     flag=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.5,.08),ORANGE);
     flag.userData.dyn=true;flag.position.set(x+10.4,y+9.6,z+2);G.add(flag)}

    /* — DRZEWA iglaste na stoku — */
    for(let i=0;i<70;i++){
      const tx=(rnd()-.5)*420, tz=-30-rnd()*150;
      const back=Math.max(0,Math.min(1,(-tz-40)/200? (-tz+60)/220:0));
      const ty=Math.pow(Math.max(0,Math.min(1,(-tz+60)/220)),2)*58;
      if(T.some(([px,pz])=>Math.hypot(tx-px,tz-pz)<17))continue;
      const s=.7+rnd()*.9;
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(.14*s,.2*s,1.1*s,6),WOOD);
      tr.position.set(tx,ty+.55*s,tz);G.add(tr);
      const cone=new THREE.Mesh(new THREE.ConeGeometry(1.1*s,2.6*s,7),
        rnd()<.5?GREENT:std(0x5e7a44,.9));
      cone.position.set(tx,ty+2.2*s,tz);G.add(cone)}

    /* — BALON o świcie — */
    const balloon=new THREE.Group();balloon.userData.dyn=true;
    balloon.position.set(-70,64,-120);G.add(balloon);
    const env=new THREE.Mesh(new THREE.SphereGeometry(4,12,10),ORANGE);
    env.scale.y=1.15;balloon.add(env);
    const stripe=new THREE.Mesh(new THREE.SphereGeometry(4.02,12,10,0,Math.PI*2,1.1,.5),WHITE);
    stripe.scale.y=1.15;balloon.add(stripe);
    const bask=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,1.6),WOOD);
    bask.position.y=-5.6;balloon.add(bask);

    /* — PAD P-D1: kamienny krąg na łące + drogowskaz — */
    const padDisc=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.05,.06,26),std(0x9a9078,.85));
    padDisc.position.y=.03;G.add(padDisc);
    const pring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),bas(0xe8500f));
    pring.rotation.x=-Math.PI/2;pring.position.y=.065;G.add(pring);
    const hM=bas(0xf2ede2);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,.068,0);
    const h2=h1.clone();h2.position.x=.34;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.y=.068;
    G.add(h1,h2,h3);
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,3,8),WOOD);
    post.position.set(4,1.5,2);G.add(post);
    [[2.6,'r'],[2.1,'l'],[1.6,'r']].forEach(([py,side],i)=>{
      const arrow=new THREE.Mesh(new THREE.BoxGeometry(2.2,.4,.12),i%2?WHITE:ORANGE);
      arrow.position.set(4+(side==='r'?1:-1)*1.1,py,2);G.add(arrow)});

    return {group:G, pad:{h:.07},
      animate(dt,t){
        balloon.position.x+=dt*1.1;
        if(balloon.position.x>90)balloon.position.x=-90;
        balloon.position.y=64+Math.sin(t*.4)*2;
        if(flag){flag.rotation.y=Math.sin(t*2.2)*.22;
          flag.position.x=T[3][0]+10.4+Math.sin(t*2.2)*.2}
      }};
  }
};
})(window);
