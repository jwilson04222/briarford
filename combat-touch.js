// Keep joystick + command taps as game input, including Safari's legacy gestures.
(()=>{
 'use strict';
 const active=()=>document.body.classList.contains('mobile-playing');
 const control=target=>target instanceof Element&&!!target.closest('#game,#ov,#joy,#mobileMoveHint,#mobileAimHint,#mobilePrimary,#mobileSecondary,#mobileDash,#actionbtn,#dashbtn,#halchargebtn,#romanbtn');
 const block=e=>{if(e.cancelable)e.preventDefault();};
 for(const name of ['gesturestart','gesturechange','gestureend','dblclick']){
  document.addEventListener(name,e=>{if(active())block(e);},{capture:true,passive:false});
 }
 for(const name of ['touchstart','touchmove','touchend']){
  document.addEventListener(name,e=>{
   if(!active())return;
   // Leave pause/menu buttons and scrolling alone. Pointer Events own combat controls.
   if(control(e.target)||(name==='touchmove'&&e.touches.length>1))block(e);
  },{capture:true,passive:false});
 }
})();
