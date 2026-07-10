/* MA//HYPER — skok nadprzestrzenny między światami (wg referencji SW)
   Fazy: gwiazdy → promieniste smugi przyspieszające → błysk → nawigacja.
   Po załadowaniu nowej strony: smugi zapadają się z powrotem w gwiazdy. */
(function(root){
'use strict';
const N=380, DUR_OUT=1.05, DUR_IN=.7;
let cv,cx,stars,raf=null;

function ensure(){
  if(cv)return;
  cv=document.createElement('canvas');
  cv.id='ma-hyper';
  cv.style.cssText='position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:0;background:#02040c';
  document.body.appendChild(cv);
  cx=cv.getContext('2d');
  resize();addEventListener('resize',resize);
}
function resize(){if(!cv)return;cv.width=innerWidth;cv.height=innerHeight}
function seed(){
  stars=[];
  for(let i=0;i<N;i++){
    const a=Math.random()*Math.PI*2, r=Math.pow(Math.random(),.5);
    stars.push({a,r,tw:.4+Math.random()*.6,hue:200+Math.random()*40});
  }
}
function draw(t,mode){ /* t: 0..1; mode:'out'(rozpędzanie) lub 'in'(hamowanie) */
  const W=cv.width,H=cv.height,cxp=W/2,cyp=H/2;
  const R=Math.hypot(W,H)/2;
  /* prędkość smug: out=easeIn, in=odwrócone */
  const sp = mode==='out' ? Math.pow(t,2.6) : Math.pow(1-t,2.2);
  cx.globalCompositeOperation='source-over';
  cx.fillStyle='rgba(2,4,12,'+(mode==='out'?Math.min(1,t*2):1)+')';
  cx.fillRect(0,0,W,H);
  cx.globalCompositeOperation='lighter';
  for(const s of stars){
    const rr=s.r*R;
    const x=cxp+Math.cos(s.a)*rr, y=cyp+Math.sin(s.a)*rr;
    const len = sp * (rr*.9+30) ;                 // im dalej od środka, tym dłuższa smuga
    const x2=cxp+Math.cos(s.a)*(rr+len), y2=cyp+Math.sin(s.a)*(rr+len);
    const w = .6 + sp*2.2*s.tw;
    const al = .25 + sp*.75;
    cx.strokeStyle='hsla('+s.hue+',95%,'+(72+sp*20)+'%,'+al+')';
    cx.lineWidth=w;
    cx.beginPath();cx.moveTo(x,y);cx.lineTo(x2,y2);cx.stroke();
    if(sp<.25){ // jeszcze punktowe gwiazdy
      cx.fillStyle='hsla('+s.hue+',60%,88%,'+(0.5*(1-sp*4)*s.tw)+')';
      cx.fillRect(x-1,y-1,2,2);
    }
  }
  /* końcowy błysk przy wyjściu */
  if(mode==='out'&&t>.86){
    const f=(t-.86)/.14;
    cx.globalCompositeOperation='source-over';
    cx.fillStyle='rgba(225,240,255,'+f+')';
    cx.fillRect(0,0,W,H);
  }
  if(mode==='in'&&t<.18){
    const f=1-t/.18;
    cx.globalCompositeOperation='source-over';
    cx.fillStyle='rgba(225,240,255,'+f+')';
    cx.fillRect(0,0,W,H);
  }
}
function play(mode,done){
  ensure();seed();resize();
  cv.style.opacity='1';
  const T0=performance.now(), D=(mode==='out'?DUR_OUT:DUR_IN)*1000;
  cancelAnimationFrame(raf);
  (function tick(now){
    const t=Math.min(1,(now-T0)/D);
    draw(t,mode);
    if(t<1){raf=requestAnimationFrame(tick)}
    else{
      if(mode==='in'){cv.style.transition='opacity .25s';cv.style.opacity='0';
        setTimeout(()=>{cv.style.transition=''},300)}
      done&&done();
    }
  })(T0);
}
/* API */
root.MAHYPER={
  jump(url){                      // odlot → nawigacja
    try{sessionStorage.setItem('ma-hyper','1')}catch(e){}
    play('out',()=>{location.href=url});
  },
  arrive(){                       // przylot (wywołać na starcie strony)
    let f=null;try{f=sessionStorage.getItem('ma-hyper');sessionStorage.removeItem('ma-hyper')}catch(e){}
    if(f==='1'){ensure();cv.style.opacity='1';draw(0,'in');
      requestAnimationFrame(()=>play('in'))}
  }
};
})(window);
