/* MA//BIOME:RIDGE → MAŁE PLANETY (DOŚWIADCZENIE)
   Oś czasu jako miniaturowe planetki w kosmosie (jak Mały Książę): każda
   z jednym etapem — drzewko, domek, obiekt — z zakrzywioną powierzchnią.
   Zjazd od najwyższej planety (studia) do bazowej (pad). Gwiazdy, komety,
   pierścienie orbit, dryfujące asteroidy. */
(function(root){
'use strict';
root.MABIOME_RIDGE={
  MAXALT:320,
  FOG_STOPS:[[0,0x05030f],[.25,0x0a0820],[.5,0x120e30],[.75,0x1a1642],[1,0x241e55]],
  SUN:{col:0xfff0d0,int:.9},
  HEMI:{sky:0x3a3a70,ground:0x100a24,int:.7},

  build(THREE){
    const G=new THREE.Group();
    const std=(c,r,m,e,ei)=>{const M=new THREE.MeshStandardMaterial({color:c,roughness:r??.85,metalness:m??0});
      if(e){M.emissive=new THREE.Color(e);M.emissiveIntensity=ei??.7}return M};
    const bas=c=>new THREE.MeshBasicMaterial({color:c});
    const glow=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o??.5,depthWrite:false});
    let sd=41;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};

    const WOOD=std(0x8a6238,.85), WOOD2=std(0x6f4d26,.85);
    const WHITE=std(0xe9e4d8,.6), SLATE=std(0x46506a,.7);
    const BRICK=std(0xc07a5e,.8), ORANGE=std(0xe8500f,.5);
    const LEAF=std(0x4e9a6a,.9), LEAF2=std(0x3f8a5c,.9);
    const GOLDL=bas(0xffd990);
    const dyn=o=>{o.userData.dyn=true;return o};

    /* ── PLANETA: kula z „biegunami" i akcesoriami; obiekty stoją NA powierzchni ── */
    function surfPos(planet,R,latDeg,lonDeg){
      // zwraca lokalny wektor pozycji na powierzchni + orientację „do góry"
      const lat=latDeg*Math.PI/180, lon=lonDeg*Math.PI/180;
      const x=R*Math.cos(lat)*Math.cos(lon);
      const y=R*Math.sin(lat);
      const z=R*Math.cos(lat)*Math.sin(lon);
      return new THREE.Vector3(x,y,z);
    }
    function placeOnSurface(planet,R,latDeg,lonDeg,obj){
      const p=surfPos(planet,R,latDeg,lonDeg);
      obj.position.copy(p);
      // orientacja: lokalny „up" = normalna do kuli (kierunek p)
      const up=p.clone().normalize();
      const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),up);
      obj.quaternion.copy(q);
      planet.add(obj);
      return obj;
    }
    function makePlanet(x,y,z,R,landCol,rockCol){
      const P=new THREE.Group();P.position.set(x,y,z);G.add(P);
      // kula lądu (ikosaedr — fasetowana)
      const g=new THREE.IcosahedronGeometry(R,2);
      const pos=g.attributes.position, cols=new Float32Array(pos.count*3);
      const cL=new THREE.Color(landCol), cR=new THREE.Color(rockCol);
      for(let i=0;i<pos.count;i++){
        const vy=pos.getY(i)/R;                    // -1 (dół) .. +1 (góra)
        const n=1+(rnd()-.5)*0.05;
        pos.setXYZ(i,pos.getX(i)*n,pos.getY(i)*n,pos.getZ(i)*n);
        // ląd na całej górnej połowie; skała pełznie od dołu w górę do równika
        const rockAmt = vy<0 ? Math.pow(-vy,0.8) : 0;
        const c=cL.clone().lerp(cR,rockAmt*.85);
        // drobna losowa wariacja odcienia (fasetki)
        const j=(rnd()-.5)*.05;
        cols[i*3]=Math.max(0,c.r+j);cols[i*3+1]=Math.max(0,c.g+j);cols[i*3+2]=Math.max(0,c.b+j);
      }
      g.setAttribute('color',new THREE.BufferAttribute(cols,3));g.computeVertexNormals();
      const globe=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,flatShading:true}));
      P.add(globe);
      // rdzeń świecący (mały akcent u bieguna południowego)
      const cap=new THREE.Mesh(new THREE.SphereGeometry(R*.28,10,8),std(rockCol,.8));
      cap.position.y=-R*.92;P.add(cap);
      return {group:P,R};
    }
    function tree(planet,R,lat,lon,s){
      const t=new THREE.Group();
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(.12*s,.18*s,1.0*s,6),WOOD);
      tr.position.y=.5*s;t.add(tr);
      const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(.9*s,0),rnd()<.5?LEAF:LEAF2);
      cr.position.y=1.4*s;t.add(cr);
      placeOnSurface(planet.group,R,lat,lon,t);return t;
    }
    const lamps=[];
    function lamp(planet,R,lat,lon){
      const l=new THREE.Group();
      const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,1.6,6),SLATE);
      p.position.y=.8;l.add(p);
      const g2=dyn(new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),GOLDL));
      g2.position.y=1.8;l.add(g2);lamps.push(g2);
      placeOnSurface(planet.group,R,lat,lon,l);
    }
    function bush(planet,R,lat,lon,s,col){
      const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.5*s,0),col||LEAF);
      const holder=new THREE.Group();b.position.y=.4*s;holder.add(b);
      placeOnSurface(planet.group,R,lat,lon,holder);
    }
    function rock(planet,R,lat,lon,s){
      const g=new THREE.IcosahedronGeometry(.5*s,0);const p=g.attributes.position;
      for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*(.7+rnd()*.5),p.getY(i)*(.6+rnd()*.5),p.getZ(i)*(.7+rnd()*.5));
      g.computeVertexNormals();
      const holder=new THREE.Group();const m=new THREE.Mesh(g,SLATE);m.position.y=.3*s;holder.add(m);
      placeOnSurface(planet.group,R,lat,lon,holder);
    }

    /* ── PLANETY (od dołu do góry: baza → liceum → kurier → korepetycje → studia) ── */
    const BASE = makePlanet(0,0,0,7.5,0x4ea87a,0x3a2f4e);          // pad
    const P1 = makePlanet(-24,54,-20,6,0x5a9ac8,0x2f3a60);         // LICEUM (błękitna)
    const P2 = makePlanet(24,112,-24,6,0xc89a48,0x5a3a22);         // KURIER (piaskowa)
    const P3 = makePlanet(-22,170,-22,6,0xb86a8a,0x4a2a3a);        // KOREPETYCJE (różowa)
    const P4 = makePlanet(18,228,-26,6.5,0xc8d0e0,0x3a3a5a);       // STUDIA (lodowa)
    const PLANETS=[BASE,P1,P2,P3,P4];

    /* ── ORBITY (pierścienie łączące — jak trajektorie) ── */
    function orbitRing(a,b){
      const pa=new THREE.Vector3(),pb=new THREE.Vector3();
      a.group.getWorldPosition(pa);b.group.getWorldPosition(pb);
      const mid=pa.clone().lerp(pb,.5);
      const d=pb.clone().sub(pa);const len=d.length();
      // eliptyczny pierścień w płaszczyźnie łączącej
      const ring=new THREE.Mesh(new THREE.TorusGeometry(len*.5,.08,6,40),glow(0x8a7ad0,.4));
      ring.position.copy(mid);
      ring.lookAt(pb);ring.rotateX(Math.PI/2);
      ring.scale.set(1,.4,1);
      G.add(ring);
      // kometka biegnąca po orbicie
      const comet=dyn(new THREE.Group());
      const head=new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),bas(0xfff0d0));comet.add(head);
      for(let k=0;k<4;k++){const tail=new THREE.Mesh(new THREE.SphereGeometry(.22-k*.05,6,4),glow(0xffd9a0,.5-k*.1));
        tail.position.x=-(k+1)*.5;comet.add(tail)}
      comet.userData={a,b,ph:rnd(),sp:.12+rnd()*.08};
      G.add(comet);
      return comet;
    }
    const comets=[];
    comets.push(orbitRing(BASE,P1));
    comets.push(orbitRing(P1,P2));
    comets.push(orbitRing(P2,P3));
    comets.push(orbitRing(P3,P4));

    /* ── ZABUDOWA PLANET ── */
    /* P1 LICEUM: ceglany domek z dachem + zegar + drzewko + ławeczka */
    {const pl=P1,R=pl.R;
     const house=new THREE.Group();
     const b=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.8,2),BRICK);b.position.y=.9;house.add(b);
     const roofG=new THREE.ConeGeometry(1.9,1.3,4);
     const roof=new THREE.Mesh(roofG,SLATE);roof.position.y=2.35;roof.rotation.y=Math.PI/4;house.add(roof);
     const door=new THREE.Mesh(new THREE.BoxGeometry(.5,.9,.1),WOOD);door.position.set(0,.45,1.02);house.add(door);
     const clk=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.1,12),WHITE);
     clk.rotation.x=Math.PI/2;clk.position.set(0,1.5,1.02);house.add(clk);
     for(const wx of[-.7,.7]){const w=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.08),std(0xcfe2ea,.4,.2));
       w.position.set(wx,1,1.0);house.add(w)}
     placeOnSurface(pl.group,R,64,10,house);
     tree(pl,R,20,120,1.1);tree(pl,R,-10,-90,.8);
     bush(pl,R,40,-140,1,LEAF2);bush(pl,R,-30,60,.8);
     lamp(pl,R,10,50);rock(pl,R,-50,150,1);
     // książki
     const books=new THREE.Group();
     [[0xc0605e,0],[0x5e8ac0,.1],[0x6ab07a,.2]].forEach(([c2,dy],i)=>{
       const bk=new THREE.Mesh(new THREE.BoxGeometry(.7-i*.08,.16,.5-i*.04),std(c2,.7));
       bk.position.y=.08+i*.18;bk.rotation.y=dy*3;books.add(bk)});
     placeOnSurface(pl.group,R,30,-30,books);}

    /* P2 KURIER: maszt + sterowiec (animowany) + skrzynie + rowerek */
    let airship;
    {const pl=P2,R=pl.R;
     const mast=new THREE.Group();
     const m=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,3,8),SLATE);m.position.y=1.5;mast.add(m);
     const ring=new THREE.Mesh(new THREE.TorusGeometry(.4,.06,6,12),ORANGE);ring.position.y=3;mast.add(ring);
     placeOnSurface(pl.group,R,72,-10,mast);
     // sterowiec zakotwiczony nad masztem
     const mastWorld=surfPos(pl,R,72,-10);
     const up=mastWorld.clone().normalize();
     airship=dyn(new THREE.Group());
     airship.position.copy(mastWorld.clone().add(up.clone().multiplyScalar(4)));
     const env=new THREE.Mesh(new THREE.SphereGeometry(1.5,12,8),ORANGE);env.scale.set(1.6,1,1);airship.add(env);
     const strp=new THREE.Mesh(new THREE.SphereGeometry(1.52,12,8,0,Math.PI*2,1.2,.5),WHITE);strp.scale.set(1.6,1,1);airship.add(strp);
     const gond=new THREE.Mesh(new THREE.BoxGeometry(1.4,.6,.8),WOOD);gond.position.y=-1.7;airship.add(gond);
     const tow=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2,4),SLATE);
     tow.position.copy(up.clone().multiplyScalar(-2.8));airship.add(tow);
     airship.userData.up=up;airship.userData.base=airship.position.clone();
     P2.group.add(airship);
     for(let i=0;i<4;i++){const c2=new THREE.Mesh(new THREE.BoxGeometry(.8,.6,.7),i%2?std(0x9a6a3a,.8):WOOD2);
       const holder=new THREE.Group();c2.position.y=.3;holder.add(c2);
       placeOnSurface(pl.group,R,20+i*8,60+i*20,holder)}
     // rowerek
     const bike=new THREE.Group();
     for(const wx of[-.5,.5]){const wh=new THREE.Mesh(new THREE.TorusGeometry(.4,.06,6,14),SLATE);
       wh.position.set(wx,.4,0);wh.rotation.y=Math.PI/2;bike.add(wh)}
     const bar=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,6),ORANGE);bar.rotation.z=Math.PI/2;bar.position.y=.5;bike.add(bar);
     placeOnSurface(pl.group,R,-20,140,bike);
     tree(pl,R,-40,-60,.9);lamp(pl,R,30,120);bush(pl,R,50,-120,.9);}

    /* P3 KOREPETYCJE: tablica + ławki + drzewo z huśtawką */
    let swing;
    {const pl=P3,R=pl.R;
     const board=new THREE.Group();
     const bd=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.4,.14),std(0x2c4438,.8));bd.position.y=1;board.add(bd);
     const fr=new THREE.Mesh(new THREE.BoxGeometry(2.7,1.7,.1),WOOD);fr.position.y=1;fr.position.z=-.06;board.add(fr);
     for(const[lx,ly,lw]of[[-.6,1.3,1],[.4,1.1,.8],[-.2,.8,.7]]){
       const ch=new THREE.Mesh(new THREE.BoxGeometry(lw,.06,.04),WHITE);ch.position.set(lx,ly,.09);board.add(ch)}
     placeOnSurface(pl.group,R,60,0,board);
     for(let i=0;i<3;i++){const bench=new THREE.Group();
       const bn=new THREE.Mesh(new THREE.BoxGeometry(1.4,.14,.5),WOOD);bn.position.y=.4;bench.add(bn);
       for(const e of[-.5,.5]){const lg=new THREE.Mesh(new THREE.BoxGeometry(.12,.4,.5),WOOD2);lg.position.set(e,.2,0);bench.add(lg)}
       placeOnSurface(pl.group,R,30-i*4,-40+i*30,bench)}
     // drzewo z huśtawką
     const t=new THREE.Group();
     const tr=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,2,7),WOOD);tr.position.y=1;t.add(tr);
     const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3,0),LEAF);cr.position.y=2.3;t.add(cr);
     const branch=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.3,6),WOOD);branch.rotation.z=Math.PI/2;branch.position.set(.7,1.8,0);t.add(branch);
     swing=new THREE.Group();swing.position.set(1.2,1.8,0);
     for(const e of[-.3,.3]){const rp=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.2,4),WOOD2);rp.position.set(e,-.6,0);swing.add(rp)}
     const seat=new THREE.Mesh(new THREE.BoxGeometry(.7,.08,.3),WOOD2);seat.position.y=-1.2;swing.add(seat);
     t.add(swing);
     placeOnSurface(pl.group,R,20,90,t);
     lamp(pl,R,-30,150);bush(pl,R,50,-100,1,LEAF2);rock(pl,R,-40,40,.9);}

    /* P4 STUDIA: fronton kolumnowy + proporzec + obracająca się zębatka + teleskop */
    let flag,gearMesh;
    {const pl=P4,R=pl.R;
     const uni=new THREE.Group();
     const pod=new THREE.Mesh(new THREE.BoxGeometry(3,.6,2.2),WHITE);pod.position.y=.3;uni.add(pod);
     const body=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.5,1.6),std(0xd9cdb8,.7));body.position.y=1.3;uni.add(body);
     for(const cx of[-.9,-.3,.3,.9]){const col=new THREE.Mesh(new THREE.CylinderGeometry(.13,.14,1.3,8),WHITE);
       col.position.set(cx,1.25,.9);uni.add(col)}
     const arch=new THREE.Mesh(new THREE.BoxGeometry(2.7,.3,1.9),WHITE);arch.position.y=2.15;uni.add(arch);
     const tg=new THREE.ConeGeometry(1.5,.6,3);const tym=new THREE.Mesh(tg,std(0xd9cdb8,.7));
     tym.position.set(0,2.5,.5);tym.rotation.y=Math.PI/2;uni.add(tym);
     const doorU=new THREE.Mesh(new THREE.BoxGeometry(.5,.9,.1),SLATE);doorU.position.set(0,.75,.82);uni.add(doorU);
     const mast=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,2,6),WHITE);mast.position.set(1.6,1.5,.4);uni.add(mast);
     flag=new THREE.Mesh(new THREE.BoxGeometry(.9,.5,.04),ORANGE);flag.position.set(2.1,2.1,.4);uni.add(flag);
     uni.userData.flag=flag;
     placeOnSurface(pl.group,R,58,0,uni);
     // zębatka-pomnik
     const gearHolder=new THREE.Group();
     const ped=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.8),SLATE);ped.position.y=.25;gearHolder.add(ped);
     gearMesh=dyn(new THREE.Group());gearMesh.position.y=1.1;
     const disc=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.2,14),std(0xb87445,.5,.5));disc.rotation.x=Math.PI/2;gearMesh.add(disc);
     for(let k=0;k<8;k++){const a=k/8*Math.PI*2;const th=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),std(0xb87445,.5,.5));
       th.position.set(Math.cos(a)*.7,Math.sin(a)*.7,0);gearMesh.add(th)}
     gearHolder.add(gearMesh);
     placeOnSurface(pl.group,R,20,-80,gearHolder);
     // teleskop
     const tel=new THREE.Group();
     const tp=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,.9,6),SLATE);tp.position.y=.45;tel.add(tp);
     const tube=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,1.1,8),WHITE);tube.rotation.x=-.7;tube.position.set(0,1,.2);tel.add(tube);
     placeOnSurface(pl.group,R,-20,120,tel);
     tree(pl,R,-40,-140,.8);lamp(pl,R,30,60);}

    /* BASE (pad): domek startowy, drzewko, staw-krater, drogowskaz, kwiaty */
    {const pl=BASE,R=pl.R;
     tree(pl,R,40,30,1.2);tree(pl,R,20,-60,1);tree(pl,R,-30,120,.9);
     bush(pl,R,50,80,1);bush(pl,R,-20,-100,.9,LEAF2);
     rock(pl,R,-40,40,1.1);rock(pl,R,10,160,.8);
     lamp(pl,R,30,-30);lamp(pl,R,-10,90);
     // kwiaty
     for(let i=0;i<10;i++){const holder=new THREE.Group();
       const fl=new THREE.Mesh(new THREE.SphereGeometry(.12,6,4),
         bas(i%3===0?0xe8709a:i%3===1?0xf0c95a:0xc9a8f0));fl.position.y=.2;holder.add(fl);
       placeOnSurface(pl.group,R,30+rnd()*40,rnd()*360,holder)}
     // drogowskaz (przy padzie, ale odsunięty od bieguna N gdzie ląduje dron)
     const sign=new THREE.Group();
     const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,1.8,7),WOOD);post.position.y=.9;sign.add(post);
     [[1.5,1],[1.1,-1],[.7,1]].forEach(([py,s2],i)=>{
       const ar=new THREE.Mesh(new THREE.BoxGeometry(1.2,.24,.08),i%2?WHITE:ORANGE);
       ar.position.set(s2*.6,py,0);sign.add(ar)});
     placeOnSurface(pl.group,R,45,150,sign);}

    /* ── PAD na biegunie północnym BASE (dron ląduje pionowo z góry) ── */
    const padY=BASE.R;
    const padDisc=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.05,.14,24),std(0x8a7ca0,.6));
    padDisc.position.y=padY+.05;BASE.group.add(padDisc);
    const pring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.05,8,36),bas(0xe8500f));
    pring.rotation.x=-Math.PI/2;pring.position.y=padY+.13;BASE.group.add(pring);
    const hM=bas(0xf2ede2);
    const h1=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,1.1),hM);h1.position.set(-.34,padY+.14,0);
    const h2=h1.clone();h2.position.x=.34;h2.position.y=padY+.14;
    const h3=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.2),hM);h3.position.set(0,padY+.14,0);
    BASE.group.add(h1,h2,h3);
    for(let k=0;k<4;k++){const a=k/4*Math.PI*2+Math.PI/4;
      const tl=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),bas(0xffcf7a));
      tl.position.set(Math.cos(a)*1.85,padY+.16,Math.sin(a)*1.85);BASE.group.add(tl)}

    /* ── KOSMOS: gwiazdy (punkty), mgławice, dryfujące asteroidy, dalekie planetki ── */
    // pola gwiazd
    {const N=600;const gg=new THREE.BufferGeometry();const arr=new Float32Array(N*3);
     for(let i=0;i<N;i++){const rr=120+rnd()*160, th=rnd()*Math.PI*2, ph=Math.acos(2*rnd()-1);
       arr[i*3]=rr*Math.sin(ph)*Math.cos(th);arr[i*3+1]=40+rr*Math.cos(ph)*.7;arr[i*3+2]=rr*Math.sin(ph)*Math.sin(th)-40}
     gg.setAttribute('position',new THREE.BufferAttribute(arr,3));
     const stars=new THREE.Points(gg,new THREE.PointsMaterial({color:0xdfe4ff,size:.7,sizeAttenuation:true,transparent:true,opacity:.9}));
     dyn(stars);G.add(stars)}
    // mgławice (płaskie kolorowe kłęby w tle)
    for(let i=0;i<4;i++){const neb=new THREE.Mesh(new THREE.SphereGeometry(20+rnd()*20,8,6),
      glow(i%2?0x6a4a9a:0x4a5a9a,.08));
      neb.position.set((rnd()-.5)*200,60+rnd()*160,-140-rnd()*60);neb.scale.y=.6;G.add(neb)}
    // dalekie mini-planetki
    for(let i=0;i<8;i++){const mp=new THREE.Mesh(new THREE.IcosahedronGeometry(2+rnd()*3,1),
      std([0x7ab0d0,0xd0a85a,0xc07a9a,0x8a9a6a][i%4],.9,0,0,0));
      mp.position.set((rnd()-.5)*220,30+rnd()*240,-120-rnd()*80);G.add(mp)}
    // dryfujące asteroidy (bliżej, animowane)
    const asteroids=[];
    for(let i=0;i<6;i++){
      const g=new THREE.IcosahedronGeometry(.6+rnd()*.8,0);const p=g.attributes.position;
      for(let k=0;k<p.count;k++)p.setXYZ(k,p.getX(k)*(.7+rnd()*.5),p.getY(k)*(.6+rnd()*.5),p.getZ(k)*(.7+rnd()*.5));
      g.computeVertexNormals();
      const a=dyn(new THREE.Mesh(g,SLATE));
      a.userData={x:(rnd()-.5)*70,y:20+rnd()*220,z:-30-rnd()*50,ph:rnd()*6,sp:.2+rnd()*.3,rr:rnd()*3};
      const u=a.userData;a.position.set(u.x,u.y,u.z);G.add(a);asteroids.push(a)}
    // słońce nisko z halo (bez mgły)
    {const sunM=new THREE.MeshBasicMaterial({color:0xfff0d0});sunM.fog=false;
     const sun=new THREE.Mesh(new THREE.CircleGeometry(11,24),sunM);
     sun.position.set(-70,150,-200);dyn(sun);G.add(sun);
     for(let k=0;k<2;k++){const hm=new THREE.MeshBasicMaterial({color:0xffe0b0,transparent:true,opacity:.1-k*.04,depthWrite:false});hm.fog=false;
       const halo=new THREE.Mesh(new THREE.CircleGeometry(14+k*8,24),hm);halo.position.set(-70,150,-202-k);dyn(halo);halo.renderOrder=-1;G.add(halo)}}

    /* ── ŚWIATŁA ── */
    const sunLight=new THREE.PointLight(0xfff0d0,.5,300);sunLight.position.set(-70,150,-200);G.add(sunLight);
    const key=new THREE.DirectionalLight(0xfff0d0,.6);key.position.set(-.5,.6,.4);G.add(key);

    return {group:G, pad:{h:.14},
      animate(dt,t){
        // planety obracają się powoli (życie)
        PLANETS.forEach((pl,i)=>{if(i>0)pl.group.rotation.y+=dt*(.05+i*.01)});
        BASE.group.rotation.y+=0;   // baza nieruchoma (pad stabilny)
        lamps.forEach((g2,i)=>{const s2=.9+Math.sin(t*5+i*1.7)*.12;g2.scale.setScalar(s2)});
        if(airship){const u=airship.userData;
          airship.position.copy(u.base.clone().add(u.up.clone().multiplyScalar(Math.sin(t*.7)*.4)));
          airship.rotation.z=Math.sin(t*.5)*.05}
        if(swing)swing.rotation.x=Math.sin(t*1.6)*.4;
        if(flag){flag.rotation.y=Math.sin(t*2.2)*.2}
        if(gearMesh)gearMesh.rotation.z+=dt*.5;
        // komety po orbitach
        comets.forEach(c=>{const u=c.userData;u.ph=(u.ph+dt*u.sp)%1;
          const pa=new THREE.Vector3(),pb=new THREE.Vector3();
          u.a.group.getWorldPosition(pa);u.b.group.getWorldPosition(pb);
          const mid=pa.clone().lerp(pb,.5);const d=pb.clone().sub(pa);const len=d.length();
          const ang=u.ph*Math.PI*2;
          // pozycja na eliptycznej orbicie w płaszczyźnie pion
          const dir=d.clone().normalize();
          const side=new THREE.Vector3(0,1,0).cross(dir).normalize();
          const pos=mid.clone()
            .add(dir.clone().multiplyScalar(Math.cos(ang)*len*.5))
            .add(side.clone().multiplyScalar(Math.sin(ang)*len*.2));
          c.position.copy(pos);
          const nx=mid.clone().add(dir.clone().multiplyScalar(Math.cos(ang+.1)*len*.5))
            .add(side.clone().multiplyScalar(Math.sin(ang+.1)*len*.2));
          c.lookAt(nx)});
        // asteroidy dryfują i obracają się
        asteroids.forEach(a=>{const u=a.userData;u.ph+=dt*.2;
          a.position.set(u.x+Math.sin(u.ph)*3,u.y+Math.cos(u.ph*.7)*2,u.z);
          a.rotation.x+=dt*u.sp;a.rotation.y+=dt*u.sp*.7});
      }};
  }
};
})(window);
