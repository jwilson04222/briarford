// Landscape is required on touch devices; browser orientation locks are best effort.
(()=>{
 'use strict';
 const gate=document.getElementById('landscapeGate'),app=document.getElementById('app');
 const button=document.getElementById('landscapeEnter'),note=document.getElementById('landscapeNote');
 const touch=matchMedia('(pointer:coarse)').matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent));
 const orientation=screen.orientation,root=document.documentElement;
 const canLock=()=>typeof orientation?.lock==='function';
 const canFullscreen=()=>typeof root.requestFullscreen==='function'||typeof root.webkitRequestFullscreen==='function';
 let blocked=false,busy=false,previousFocus=null;
 function sync(){
  const next=touch&&innerHeight>innerWidth;
  const changed=next!==blocked;blocked=next;
  root.classList.toggle('landscapeBlocked',blocked);
  if(blocked){
   if(!gate.open){previousFocus=document.activeElement;gate.showModal();}
   app.inert=true;
  }else{
   if(gate.open)gate.close();
   app.inert=false;
   if(changed&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  }
  if(changed)window.dispatchEvent(new Event('briarfordorientationchange'));
 }
 async function lock(){
  if(!touch||!canLock())return false;
  try{await orientation.lock('landscape');return true;}catch(_){return false;}
 }
 async function enter(){
  if(busy||!touch)return false;
  busy=true;button.disabled=true;
  try{
   if(!document.fullscreenElement&&!document.webkitFullscreenElement){
    const request=root.requestFullscreen||root.webkitRequestFullscreen;
    if(request){try{await request.call(root,{navigationUI:'hide'});}catch(_){/* Manual rotation still works. */}}
   }
   const locked=await lock();
   if(!locked)note.textContent='Turn your phone sideways. If the screen stays upright, turn off Rotation Lock (or turn on Auto-rotate).';
   sync();return locked;
  }finally{busy=false;button.disabled=false;}
 }
 window.BriarfordOrientation={get blocked(){return blocked;},enter,sync};
 button.hidden=!(touch&&canLock()&&canFullscreen());
 button.addEventListener('click',enter);
 // The game's window-level controls must not receive touches through this gate.
 for(const type of ['pointerdown','pointerup','pointermove','touchstart','touchend','touchmove','keydown','keyup','click']){
  window.addEventListener(type,e=>{
   if(!blocked)return;
   if(type==='click'&&e.target.closest?.('#landscapeEnter'))void enter();
   e.stopImmediatePropagation();
  },true);
 }
 gate.addEventListener('cancel',e=>{if(blocked)e.preventDefault();});
 window.addEventListener('resize',sync);
 window.addEventListener('orientationchange',()=>{sync();setTimeout(sync,150);});
 orientation?.addEventListener?.('change',sync);
 document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement)void lock();sync();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
 sync();void lock();
})();
