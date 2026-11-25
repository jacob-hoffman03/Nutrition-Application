/* ============ PULL TO REFRESH ============ */
/* Native-style pull-to-refresh on every view: pull down from the very top and a
   refresh circle follows your finger; release past the threshold and the current
   view re-renders. Data is on-device, so "refresh" = a full fresh render. */
(function(){
  const el = document.getElementById("ptr");
  const spin = el.querySelector(".ptrspin");
  let pulling = false, sy = 0, pid = null;
  const busy = ()=>!!document.querySelector(".sheet.open")||!!document.querySelector(".lightbox.open");
  document.addEventListener("touchstart", e=>{
    pulling = false;
    if(busy() || e.target.closest(".tabbar") || e.touches.length!==1) return;
    if(viewAtTop()){ pulling = true; sy = e.touches[0].clientY; pid = e.touches[0].identifier; }
  }, {passive:true});
  document.addEventListener("touchmove", e=>{
    if(!pulling) return;
    const t = Array.prototype.find.call(e.touches, x=>x.identifier===pid);
    if(!t) return;
    const dy = t.clientY - sy;
    if(dy>8 && viewAtTop()){
      e.preventDefault();
      const p = Math.min(dy*0.55, 120);
      el.style.transform = "translate(-50%,"+(-64+p)+"px)";
      spin.style.transform = "rotate("+(p*3.6)+"deg)";
      el.dataset.p = p;
    }else if(dy<=0){
      el.style.transform = "translate(-50%,-64px)";
      spin.style.transform = "";
      el.dataset.p = 0;
    }
  }, {passive:false});
  const snapBack = ()=>{
    el.style.transition = "transform .2s ease";
    el.style.transform = "translate(-50%,-64px)";
    spin.style.transform = "";
    setTimeout(()=>{ el.style.transition = ""; }, 220);
  };
  document.addEventListener("touchend", ()=>{
    if(!pulling) return;
    pulling = false;
    const p = +el.dataset.p||0;
    el.dataset.p = 0;
    if(p>52){
      el.style.transition = "";
      el.style.transform = "translate(-50%,10px)";
      spin.style.transform = "";
      el.classList.add("on");
      try{
        renderAll();
        if(typeof curView!=="undefined" && curView==="analysis") renderAnalysis();
        if(typeof curView!=="undefined" && curView==="goals") renderGoals();
      }catch(err){}
      setTimeout(()=>{ el.classList.remove("on"); snapBack(); }, 750);
    }else snapBack();
  }, {passive:true});
  document.addEventListener("touchcancel", ()=>{ pulling=false; snapBack(); }, {passive:true});
})();
/* 2026.09.24-m: diary dropdown panels — collapsed rows, tap to expand, state persisted */
(function(){
  var P = S.diaryPanels || (S.diaryPanels = {water:0, alcohol:0, vape:0, energy:0});
  document.querySelectorAll(".dhead").forEach(function(hd){
    var key = hd.dataset.d, card = hd.closest(".dcard"); if(!card) return;
    if(P[key]) card.classList.add("open");
    var toggle = function(){ var open = card.classList.toggle("open"); P[key] = open?1:0; save(); };
    hd.addEventListener("click", toggle);
    hd.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); toggle(); } });
  });
  /* info buttons inside headers must not toggle the dropdown */
  ["waterInfo","streakInfo","nicPhaseInfo","alcPhaseInfo","energyInfo"].forEach(function(id){
    var b = document.getElementById(id);
    if(b) b.addEventListener("click", function(e){ e.stopPropagation(); });
  });
})();

/* 2026.09.24-k: iOS-style edge swipe-back. Drag right from the left edge to
   go back to the previous view. Wraps showView with a small history stack;
   navigating back to the view you came from pops instead of pushing. */
(function(){
  const EDGE=28, ACT=12, COMMIT=90;
  let navHist=[];
  const _showView=showView;
  showView=function(v, isBack){
    if(v!==curView){
      if(isBack){ /* goBack already popped — never push on the way back */ }
      else if(navHist[navHist.length-1]===v) navHist.pop();
      else{ navHist.push(curView); if(navHist.length>20) navHist.shift(); }
    }
    _showView(v);
  };
  function goBack(){
    const prev=navHist.pop();
    if(prev===undefined) return false;
    showView(prev, true);
    return true;
  }
  window.__goBack=goBack; window.__navHist=navHist;
  let sx=0, sy=0, pid=null, active=false, locked=false;
  const busy=()=>!!document.querySelector(".sheet.open")||!!document.querySelector(".lightbox.open");
  document.addEventListener("touchstart", e=>{
    active=false; locked=false;
    if(busy()||e.touches.length!==1) return;
    if(e.target.closest("input,textarea,select")) return;
    const t=e.touches[0];
    /* 2026.09.24-x: no history = nowhere to go back to, so don't engage at all —
       the view stays put (bounces back) instead of sliding into a black void */
    if(t.clientX<=EDGE && navHist.length>0){ sx=t.clientX; sy=t.clientY; pid=t.identifier; active=true; }
  }, {passive:true});
  document.addEventListener("touchmove", e=>{
    if(!active) return;
    const t=Array.prototype.find.call(e.touches, x=>x.identifier===pid);
    if(!t) return;
    const dx=t.clientX-sx, dy=t.clientY-sy;
    if(!locked){
      if(Math.abs(dy)>ACT&&Math.abs(dy)>Math.abs(dx)*1.4){ active=false; return; }
      if(dx>ACT&&dx>Math.abs(dy)*1.4) locked=true; else return;
    }
    e.preventDefault();
    const av=activeViewEl();
    if(av){ av.style.transition="none"; av.style.transform="translateX("+Math.max(0,Math.min(dx,innerWidth))+"px)"; }
  }, {passive:false});
  document.addEventListener("touchend", e=>{
    if(!active) return; active=false;
    const av=activeViewEl();
    const t=Array.prototype.find.call(e.changedTouches, x=>x.identifier===pid);
    const dx=t?t.clientX-sx:0;
    const commit=locked&&dx>COMMIT&&navHist.length>0;
    /* 2026.09.24-x: on commit, reset the drag and swap immediately — the incoming
       view's own fade covers the transition, so there's never a black gap */
    if(commit){
      if(av){ av.style.transition=""; av.style.transform=""; }
      goBack();
    } else if(av && locked){ /* partial drag springs back */
      av.style.transition="transform .18s ease";
      av.style.transform="";
      setTimeout(()=>{ av.style.transition=""; },200);
    }
  }, {passive:true});
  document.addEventListener("touchcancel", ()=>{ if(active){ active=false; const av=activeViewEl(); if(av){ av.style.transition=""; av.style.transform=""; } } }, {passive:true});
})();
