'use strict';
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const depth = document.querySelector('.scene-depth');
  let frame=0, x=0, y=0;
  function reset() {
    if(frame) cancelAnimationFrame(frame);
    frame=0;
    if(depth){depth.style.setProperty('--scene-x','0px');depth.style.setProperty('--scene-y','0px');}
  }
  function sync() {
    document.documentElement.classList.toggle('motion-paused',document.hidden);
    if(reduced.matches||!fine.matches||document.hidden)reset();
  }
  document.addEventListener('pointermove',event=>{
    if(!depth||reduced.matches||!fine.matches||document.hidden||event.pointerType==='touch')return;
    x=(event.clientX/innerWidth-.5)*8;
    y=(event.clientY/innerHeight-.5)*6;
    if(!frame)frame=requestAnimationFrame(()=>{
      frame=0;depth.style.setProperty('--scene-x',x.toFixed(2)+'px');depth.style.setProperty('--scene-y',y.toFixed(2)+'px');
    });
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',reset);
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  fine.addEventListener('change',sync);
  sync();
})();
