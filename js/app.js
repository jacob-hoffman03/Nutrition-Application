"use strict";
/* ============ ADD-FOOD SHEET ============ */
let sheetMeal = "breakfast", sheetFood = null, sheetTab = "recent", sheetSort = "time", tray = [];
const sheet = document.getElementById("sheet");
let sheetReturnTop = 0;
const sheetBody = ()=>document.querySelector("#sheet .body");
function openSheet(meal){
  sheetMeal = meal || "breakfast"; sheetFood = null; tray = [];
  document.getElementById("sheetSearch").value = "";
  document.getElementById("sheetQuick").style.display = "none";
  document.getElementById("sheetQuickToggle").textContent = "+ Quick add calories";
  sheetTab = "recent"; sheetSort = "time";
  document.querySelectorAll("#sheetTabs .segtab").forEach(t=>t.classList.toggle("sel", t.dataset.t==="recent"));
  document.getElementById("sheetSort").value = "time";
  showSearch(); renderSheetResults("");
  sheetBody().scrollTop = 0;
  sheet.classList.add("open");
}
function closeSheet(){ sheet.classList.remove("open"); }
document.getElementById("sheetScrim").onclick = closeSheet;
document.getElementById("sheetX").onclick = ()=>{
  if(document.getElementById("sheetDetail").style.display!=="none"){ showSearch(); sheetBody().scrollTop = sheetReturnTop; }
  else closeSheet();
};
document.getElementById("backToSearch").onclick = ()=>{ showSearch(); sheetBody().scrollTop = sheetReturnTop; };
document.getElementById("statusPill").onclick = ()=>{ renderZoneSheet(); document.getElementById("zoneSheet").classList.add("open"); };
document.getElementById("statusPill").onkeydown = e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); document.getElementById("statusPill").click(); } };
document.getElementById("zoneScrim").onclick = ()=>document.getElementById("zoneSheet").classList.remove("open");
document.getElementById("zoneX").onclick = ()=>document.getElementById("zoneSheet").classList.remove("open");
function closeInfoSheet(){ document.getElementById("infoSheet").classList.remove("open"); }
document.getElementById("infoScrim").onclick = closeInfoSheet;
document.getElementById("infoX").onclick = closeInfoSheet;
function foodThumb(f){ return f.img ? '<img src="'+f.img+'" alt="">' : (f.kind==="supp"?MEAL_ICON.supplements:FOOD_ICON); }
function sheetRowHtml(f, subExtra){
  const thumb = foodThumb(f);
  const diy = isCustom(f.n) ? '<span class="diy">DIY</span>' : "";
  const ver = isVerifiedFood(f.n) ? '<span class="verfd">Verified</span>' : "";
  /* remembered serving: "last: 2 scoops · 240 kcal" beats the generic per-serving line */
  const ls = S.lastServ && S.lastServ[f.n];
  let sub = Math.round(f.cal)+'kcal / '+esc(f.s);
  if(ls && ls.q>0){
    const serv = lastServServings(f, ls);
    sub = 'last: '+trimNum(ls.q)+' '+esc(ls.u==="serv"?servUnitLabel(f):ls.u)+' · '+Math.round(f.cal*serv)+' kcal';
  }
  if(subExtra) sub += ' · '+subExtra; /* Smart Go-tos reason (2026.10.18-b) — same sub-line, same style */
  return '<div class="arow2" data-n="'+esc(f.n)+'"><span class="athumb">'+thumb+'</span>'+
    '<div class="anm"><b>'+diy+ver+locPrefixHTML(f.loc)+esc(f.n)+'</b><span>'+sub+'</span></div>'+
    '<button class="aplus" data-n="'+esc(f.n)+'">+</button></div>';
}
/* ============ LOGGING WAVE (2026.09.24-u): go-tos + fill-the-gap ============ */
/* Smart Go-tos (2026.10.18-b, Jay's ask): the day's MACRO GAP — the macro he is
   behind on relative to his calorie pace (its remaining fraction vs the
   calories' remaining fraction, by >= 0.10). No goal on file -> no gap and
   suggestions stay neutral, per the no-number-without-data law. */
function macroGap(){
  const g = S.goals, tCal = goalTotal();
  if(!(tCal>0)) return null;
  const t = totals(viewDate());
  const calFrac = Math.max(0, (tCal - t.cal)/tCal);
  const defs = [["p","protein",g.protein],["c","carbs",g.carbs],["f","fat",g.fat]];
  let best = null;
  defs.forEach(([k, label, target])=>{
    if(!(target>0)) return;
    const rem = Math.max(0, target - (t[k]||0)), frac = rem/target;
    if(frac - calFrac >= 0.10 && (!best || frac > best.frac)) best = {key:k, label, rem, target, frac};
  });
  return best;
}
/* how much of the gap one remembered serving of f covers (0..1) */
function gapCover(f, gap){
  if(!gap || !(gap.rem>0)) return 0;
  const ls = S.lastServ && S.lastServ[f.n];
  const serv = ls ? lastServServings(f, ls) : 1;
  if(!(serv>0)) return 0;
  return Math.min((f[gap.key]||0)*serv, gap.rem)/gap.rem;
}
function gapReason(f, gap){
  const cov = gapCover(f, gap);
  if(cov < 0.25) return "";
  if(cov >= 0.95) return "covers your remaining "+gap.label;
  return "covers ~"+Math.round(cov*100)+"% of remaining "+gap.label;
}
/* Go-tos: zero-query suggestions weighted by frequency x recency x same-meal-slot x hour proximity,
   so the right food is visible before typing. Smart Go-tos adds one term: how
   well the food covers today's macro gap can re-rank his usuals for this meal —
   it never surfaces a food he does not already eat. Returns scored records. */
function gotoFoods(meal){
  const nowH = new Date().getHours();
  const score = new Map();
  const days = Object.keys(S.days).sort().reverse().slice(0, 30);
  days.forEach((k, di)=>{
    const d = S.days[k]; if(!d || !d.meals) return;
    MEALS.forEach(m => (d.meals[m]||[]).forEach(e=>{
      if(!e.n || e.n === "Quick add") return;
      const f = findFood(e.n); if(!f) return;
      let r = score.get(e.n);
      if(!r){ r = {f, sc:0}; score.set(e.n, r); }
      r.sc += 2;                               /* frequency */
      r.sc += Math.max(0, 6 - di*0.4);         /* recency */
      if(m === meal) r.sc += 4;                /* same meal slot */
      if(e.t){                                 /* hour proximity (today's logs carry e.t) */
        const h = new Date(e.t).getHours();
        let dh = Math.abs(h - nowH); dh = Math.min(dh, 24 - dh);
        r.sc += Math.max(0, 3 - dh*0.5);
      }
    }));
  });
  const gap = macroGap();
  const recs = [...score.values()];
  recs.forEach(r=>{
    r.fit = gapCover(r.f, gap);
    if(gap) r.sc += r.fit * 8; /* macro fit: re-ranks near-ties among his usuals, never outranks a true staple */
    r.reason = gap ? gapReason(r.f, gap) : "";
  });
  return recs.sort((a,b)=>b.sc - a.sc).slice(0, 4);
}
/* Fill the gap: rank candidates by how well one remembered serving closes the
   day's biggest macro gap without blowing past remaining calories. Smart
   Go-tos (2026.10.18-b): the gap is whichever macro he is behind on (carbs
   included); with no clear gap it falls back to the original protein rule. */
function gapFoods(){
  const k = viewDate(), t = totals(k), g = S.goals;
  const mCal = g.maintenance>0 ? g.maintenance : 0;
  const tCal = mCal + (g.surplus>0 ? g.surplus : 0);
  const calRem = Math.max(0, tCal - t.cal), pRem = Math.max(0, (g.protein||0) - t.p);
  const gap = macroGap();
  const key = gap ? gap.key : "p", gkLabel = gap ? gap.label : "protein";
  const rem = gap ? gap.rem : pRem;
  if(calRem < 60 && (gap ? rem < 10 : pRem < 5)) return [];
  const cands = new Map();
  recentFoods().concat((S.favorites||[]).map(n=>findFood(n)).filter(Boolean)).forEach(f=>{
    if(f && !cands.has(f.n)) cands.set(f.n, f);
  });
  const out = [];
  cands.forEach(f=>{
    const ls = S.lastServ && S.lastServ[f.n];
    const serv = ls ? lastServServings(f, ls) : 1;
    if(!(serv>0)) return;
    const gv = (f[key]||0)*serv, cal = f.cal*serv;
    if(gv <= 0 && cal <= 0) return;
    const fill = Math.min(gv, rem)/Math.max(rem, 1);
    const calOver = Math.max(0, cal - calRem - 200)/400;
    const calFit = calRem > 0 ? Math.min(cal, calRem)/calRem : 0;
    out.push({f, serv, p: f.p*serv, cal, gk: gv, gkLabel, sc: fill*2 - calOver + calFit*0.5});
  });
  return out.sort((a,b)=>b.sc - a.sc).slice(0, 3);
}
function paintSheetSmart(q){
  const smart = document.getElementById("sheetSmart");
  if(!smart) return;
  if(q){ smart.innerHTML = ""; smart.style.display = "none"; return; }
  let h = "";
  const gotos = gotoFoods(sheetMeal);
  if(gotos.length)
    h += '<div class="flabel" style="margin:6px 0 2px">Go-tos · '+esc(MEAL_LABEL[sheetMeal]||"")+'</div>' + gotos.map(r=>sheetRowHtml(r.f, r.reason)).join("");
  const gaps = gapFoods();
  if(gaps.length)
    h += '<div class="flabel" style="margin:12px 0 2px">Fill the gap</div>' + gaps.map(o=>
      '<button class="gaprow" data-n="'+esc(o.f.n)+'"><span class="athumb">'+foodThumb(o.f)+'</span>'+
      '<span class="gmain"><span class="gn">'+locPrefixHTML(o.f.loc)+esc(o.f.n)+'</span><span class="gs">'+trimNum(o.serv)+' × '+esc(o.f.s)+' · '+Math.round(o.cal)+' kcal</span></span>'+
      '<span class="gk">+'+r1(o.gk)+'g '+o.gkLabel+'<small>tap to adjust</small></span></button>').join("");
  smart.innerHTML = h; smart.style.display = h ? "" : "none";
  smart.querySelectorAll(".arow2").forEach(r=>r.onclick=()=>{ const f=findFood(r.dataset.n); if(f) openDetail(f); });
  smart.querySelectorAll(".arow2 .aplus").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const f=findFood(b.dataset.n); if(f) openDetail(f); });
  smart.querySelectorAll(".gaprow").forEach(r=>r.onclick=()=>{ const f=findFood(r.dataset.n); if(f) openDetail(f); });
}
function renderSheetResults(q0){
  const rawQ = String(q0||"").trim(), q = rawQ.toLowerCase();
  const box = document.getElementById("sheetResults"); box.innerHTML = "";
  paintSheetSmart(q);
  let list = sheetTab==="recent" ? recentFoods()
    : sheetTab==="favorites" ? S.favorites.map(n=>findFood(n)).filter(Boolean) /* by name: resolves custom + verified */
    : sheetTab==="supps" ? allFoods().filter(f=>f.kind==="supp") /* his whole stack, defaults + custom — never buried in All (2026.10.14-i) */
    : (function(){ const all = allFoods(); const cust = all.filter(f=>isCustom(f.n)).reverse(); return cust.concat(all.filter(f=>!isCustom(f.n))); })(); /* All: his foods first, then built-ins — via allFoods() so removed built-ins stay removed (2026.10.14-i) */ /* All: his foods first, then default foods not already his */
  if(q) list = list.filter(f => f.n.toLowerCase().includes(q) || (f.loc||"").toLowerCase().includes(q)); /* searching a place finds its foods too */
  if(!q && sheetTab==="recent" && !list.length) list = allFoods();
  if(sheetSort==="name") list = list.slice().sort((a,b)=>a.n.localeCompare(b.n));
  else if(["p","c","f","cal"].includes(sheetSort)) list = list.slice().sort((a,b)=>(b[sheetSort]||0)-(a[sheetSort]||0)); /* macro sorts, same keys as the Foods page */
  /* Verified section: Fuel's own built-in database sits on top while searching —
     his foods are never duplicated here (a name he already saved wins). */
  let verHtml = "";
  if(q){
    const seen = new Set(list.map(f=>f.n.toLowerCase()));
    const ver = VERIFIED_FOODS.filter(f=>f.n.toLowerCase().includes(q) && !seen.has(f.n.toLowerCase()) && !(S.deletedFoods||[]).includes(f.n));
    if(ver.length) verHtml = '<div class="flabel" style="margin:2px 0 6px">Verified foods</div>' +
      ver.slice(0, 12).map(f=>sheetRowHtml(f)).join("") /* 2026.10.21-e (audit): bare .map(sheetRowHtml) leaked the row index into the serving sub-line */ +
      (list.length ? '<div class="flabel" style="margin:10px 0 6px">Your foods</div>' : "");
  }
  box.innerHTML = verHtml + list.slice(0, 40).map(f=>sheetRowHtml(f)).join("") ||
    '<div class="empty">No matches for &ldquo;'+esc(rawQ)+'&rdquo;.<br><button class="ghostbtn" id="emptyCreate" style="margin-top:10px">Create &ldquo;'+esc(rawQ)+'&rdquo; as new food</button></div>';
  const ec = document.getElementById("emptyCreate");
  if(ec) ec.onclick = ()=>openCustomFromSheet(rawQ);
  box.querySelectorAll(".aplus").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const f=findFood(b.dataset.n); if(!f) return; if(sheetTab==="favorites") quickLog(f); else openDetail(f); }); /* favorites + = one-tap re-log with Undo; elsewhere + opens the serving-size panel */
  box.querySelectorAll(".arow2").forEach(r=>r.onclick=()=>{ const f=findFood(r.dataset.n); if(f) openDetail(f); }); /* row tap opens detail (2026.09.21-k) */
}
/* ============ ADD FOOD SHEET ============ */
/* one logged entry from a food + serving count; photo resolves by name at display time */
function buildEntry(f, qty){
  const e = {id:uid(), n:f.n, s:f.s, qty, img:null, /* photo lives on the library food; entryImg() resolves it by name */
    loc:f.loc||null, cal:f.cal*qty, p:f.p*qty, c:f.c*qty, f:f.f*qty,
    kind:f.kind||"food", nutrs:(f.nutrs||[]).map(x=>({n:x.n, amt:x.amt*qty, u:x.u})), xw:!!f.xw};
  if(dayOffset===0) e.t = Date.now(); /* log-time stamp drives tired-model recency; backfills stay untimed */
  return e;
}
/* favorites one-tap re-log: remembered serving straight into the diary, Undo toast */
function quickLog(f){
  const meal = f.kind==="supp" ? "supplements" : sheetMeal;
  const d = day();
  const e = buildEntry(f, round2(lastServServings(f, S.lastServ && S.lastServ[f.n])));
  if(!d.meals[meal]) d.meals[meal] = [];
  d.meals[meal].push(e);
  const mtObs = dayOffset===0 ? recordMealTime(meal) : null; /* one timing observation per logging action */
  save(); renderDiary(); haptic();
  showToast("Logged "+f.n+" · "+Math.round(e.cal)+" kcal", "Undo", ()=>{
    const dd = day(), arr = dd.meals[meal]||[];
    const i = arr.findIndex(x=>x.id===e.id);
    if(i>=0){ arr.splice(i,1); unrecordMealTime(meal, mtObs); save(); renderDiary(); }
  });
}
/* ---- quick-add: bare calories/macros, no food search — a rough entry beats a skipped day ---- */
document.getElementById("sheetQuickToggle").onclick = ()=>{
  const q = document.getElementById("sheetQuick");
  const open = q.style.display === "none";
  q.style.display = open ? "" : "none";
  document.getElementById("sheetQuickToggle").textContent = open ? "− Quick add calories" : "+ Quick add calories";
  if(open) document.getElementById("qKcal").focus();
};
document.getElementById("qAddBtn").onclick = ()=>{
  const gv = id => { const v = parseFloat(document.getElementById(id).value); return v>0 && v<100000 ? v : 0; };
  const kcalIn = gv("qKcal"), p = gv("qP"), c = gv("qC"), f = gv("qF");
  if(!(kcalIn>0) && !(p+c+f>0)){ showToast("Enter calories or macros first"); return; }
  const cal = kcalIn>0 ? Math.round(kcalIn) : Math.round(p*4 + c*4 + f*9);
  const e = {id:uid(), n:window.__qPhoto?"Photo log":"Quick add", s:"manual entry", qty:1, cal, p, c, f, kind:"food", img:window.__qPhoto||null};
  const meal = sheetMeal || "snacks";
  const d = day();
  if(!d.meals[meal]) d.meals[meal] = [];
  d.meals[meal].push(e);
  const mtObsQ = dayOffset===0 ? recordMealTime(meal) : null; /* one timing observation per logging action */
  ["qKcal","qP","qC","qF"].forEach(id=>document.getElementById(id).value="");
  window.__qPhoto=null; var _qp=document.getElementById("qPhotoPrev"); if(_qp) _qp.style.display="none"; /* 2026.09.30-b: clear meal photo */
  document.getElementById("sheetQuick").style.display = "none";
  document.getElementById("sheetQuickToggle").textContent = "+ Quick add calories";
  save(); renderDiary(); haptic();
  showToast("Logged "+Math.round(e.cal)+" kcal", "Undo", ()=>{
    const dd = day(), arr = dd.meals[meal]||[];
    const i = arr.findIndex(x=>x.id===e.id);
    if(i>=0){ arr.splice(i,1); unrecordMealTime(meal, mtObsQ); save(); renderDiary(); }
  });
};
function addToTray(f, qty, meal){
  const m = meal || (f.kind==="supp" ? "supplements" : sheetMeal);
  const ex = tray.find(t=>t.n===f.n && t.meal===m);
  if(ex) ex.qty = Math.round((ex.qty+qty)*100)/100;
  else tray.push({n:f.n, qty, meal:m});
  paintTray();
}
function paintTray(){
  const bar = document.getElementById("trayBar"), count = tray.length;
  const kcal = Math.round(tray.reduce((a,t)=>{ const f=findFood(t.n); return a+(f?f.cal*t.qty:0); },0));
  document.getElementById("trayCount").textContent = count;
  document.getElementById("trayKcal").textContent = kcal.toLocaleString()+" kcal";
  document.getElementById("trayAdd").disabled = !count;
  const inDetail = document.getElementById("sheetDetail").style.display!=="none";
  bar.style.display = (count && !inDetail) ? "" : "none";
}
document.getElementById("trayAdd").onclick = ()=>{
  const d = day();
  const seenMeals = {};
  tray.forEach(t=>{
    const f = findFood(t.n); if(!f) return;
    const e = buildEntry(f, t.qty);
    if(!d.meals[t.meal]) d.meals[t.meal] = [];
    d.meals[t.meal].push(e);
    seenMeals[t.meal] = 1; /* one timing observation per meal per logging action (2026.09.23-j) */
  });
  /* 2026.09.23-l: backfilling a past day must not stamp "now" as his usual eat time */
  if(dayOffset===0) Object.keys(seenMeals).forEach(m=>recordMealTime(m));
  save(); closeSheet(); renderDiary();
};
document.querySelectorAll("#sheetTabs .segtab").forEach(t=>t.onclick=()=>{ sheetTab=t.dataset.t;
  document.querySelectorAll("#sheetTabs .segtab").forEach(x=>x.classList.toggle("sel", x===t));
  renderSheetResults(document.getElementById("sheetSearch").value); });
document.getElementById("sheetSort").addEventListener("change", e=>{ sheetSort=e.target.value; renderSheetResults(document.getElementById("sheetSearch").value); });
let customFromSheet = false;
function openCustomFromSheet(presetName){
  closeSheet(); resetCustomForm(); customFromSheet = true;
  if(presetName) document.getElementById("cName").value = presetName;
  document.getElementById("csheet").classList.add("open");
}
document.getElementById("sheetCreate").onclick = ()=>openCustomFromSheet();
function showSearch(){
  document.getElementById("sheetSearchWrap").style.display = "";
  document.getElementById("sheetDetail").style.display = "none";
  document.getElementById("sheetTitle").textContent = "Add food";
  renderSheetResults(document.getElementById("sheetSearch").value);
  paintTray();
}
/* ---- detail: serving-size editor ---- */
let dQty = 1, dUnit = "serv", dMeal = "breakfast", dGramPer = 0;
let dMode = "serv"; /* 2026.09.24-u: reverse-portion — "serv" | "kcal" | "prot": type the target, we compute servings */
const round2 = x => Math.round(x*100)/100;
const trimNum = v => String(Math.round(v*100)/100); /* "2" not "2.00", "0.5" stays */
function gramPerFood(f){ return parseFloat((String(f.s).match(/[\d.]+(?=\s*g\b)/i)||[])[0])||0; }
/* servings represented by a remembered {q,u} (servings / grams / oz) */
function lastServServings(f, ls){
  if(!ls || !(ls.q>0)) return 1;
  if(ls.u==="serv") return ls.q;
  const gp = gramPerFood(f);
  if(!gp) return 1;
  return ls.u==="g" ? ls.q/gp : ls.q*gp/28.3495;
}
function haptic(){ try{ if(navigator.vibrate) navigator.vibrate(10); }catch(e){} }
/* ---- toast with one action (Undo) ---- */
let toastTimer = null;
function showToast(msg, btn, fn){
  const t = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  const b = document.getElementById("toastBtn");
  b.textContent = btn||""; b.style.display = btn ? "" : "none"; b.onclick = ()=>{ hideToast(); if(fn) fn(); };
  t.style.display = "";
  clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 5000);
}
function hideToast(){ document.getElementById("toast").style.display = "none"; clearTimeout(toastTimer); }
function parseGrams(s){ const m = String(s||"").match(/(\d+(?:\.\d+)?)\s*g\b/i); return m ? parseFloat(m[1]) : 0; }
function servUnitLabel(f){ return (f.kind==="supp" && (f.cUnit||f.unit)) ? (f.cUnit||f.unit) : "serving"; }
function dServings(){
  if(dMode==="kcal" && sheetFood && sheetFood.cal>0) return Math.max(0, dQty)/sheetFood.cal;
  if(dMode==="prot" && sheetFood && sheetFood.p>0) return Math.max(0, dQty)/sheetFood.p;
  if(dUnit==="g") return dQty/dGramPer;
  if(dUnit==="oz") return dQty*28.3495/dGramPer;
  return dQty;
}
/* ---- reverse-portion mode switch (2026.09.24-u) ---- */
function paintDModes(){
  const f = sheetFood, box = document.getElementById("dModes");
  if(!box) return;
  box.querySelectorAll(".chip").forEach(c=>{
    const m = c.dataset.m;
    c.classList.toggle("sel", m===dMode);
    c.style.display = (m==="prot" && !(f && f.p>0)) ? "none" : "";
  });
  const qi = document.getElementById("dQty");
  qi.placeholder = dMode==="kcal" ? "target kcal" : dMode==="prot" ? "target protein g" : "";
  document.getElementById("dUnits").style.display = dMode==="serv" ? "" : "none";
}
function setDMode(m){
  if(m==="prot" && !(sheetFood && sheetFood.p>0)) return;
  dMode = m;
  dQty = m==="serv" ? 1 : Math.max(1, Math.round(m==="kcal" ? sheetFood.cal : sheetFood.p));
  paintDModes(); paintDPresets(); updateDetail();
}
function openDetail(f){
  if(!f) return;
  sheetFood = f; dMeal = f.kind==="supp" ? "supplements" : sheetMeal;
  dGramPer = parseGrams(f.s); dUnit = "serv"; dQty = 1; dMode = "serv";
  var ls = (S.lastServ||{})[f.n];
  if(ls && ls.q>0 && ls.q<100000){ dQty = ls.q; if((ls.u==="g"||ls.u==="oz") && dGramPer>0) dUnit = ls.u; }
  document.getElementById("sheetSearch").blur();
  sheetReturnTop = sheetBody().scrollTop; sheetBody().scrollTop = 0;
  document.getElementById("trayBar").style.display = "none";
  document.getElementById("sheetSearchWrap").style.display = "none";
  document.getElementById("sheetDetail").style.display = "";
  document.getElementById("sheetTitle").textContent = "Log food";
  document.getElementById("dName").innerHTML = locPrefixHTML(f.loc) + esc(f.n);
  document.getElementById("dSub").textContent = Math.round(f.cal)+"kcal / "+f.s;
  document.getElementById("dThumb").innerHTML = foodThumb(f);
  const dm = document.getElementById("dMeals"); dm.innerHTML = "";
  MEALS.forEach(m=>{
    const b = document.createElement("button");
    b.className = "micon"+(m===dMeal?" sel":"");
    b.innerHTML = MEAL_ICON[m]+"<span>"+m[0].toUpperCase()+m.slice(1)+"</span>";
    b.onclick = ()=>{ dMeal = m; dm.querySelectorAll(".micon").forEach(x=>x.classList.toggle("sel", x===b)); };
    dm.appendChild(b);
  });
  paintDUnits(); paintDPresets(); paintDModes(); updateDetail();
}
function paintDUnits(){
  const f = sheetFood, box = document.getElementById("dUnits"); box.innerHTML = "";
  const units = [{id:"serv", label:servUnitLabel(f)}];
  if(dGramPer>0) units.push({id:"g", label:"g"}, {id:"oz", label:"oz"});
  units.forEach(u=>{
    const b = document.createElement("button");
    b.className = "chip"+(u.id===dUnit?" sel":"");
    b.textContent = u.label;
    b.onclick = ()=>{
      const serv = dServings();
      dUnit = u.id;
      dQty = dUnit==="serv" ? round2(serv) : dUnit==="g" ? round2(serv*dGramPer) : round2(serv*dGramPer/28.3495);
      paintDUnits(); updateDetail();
    };
    box.appendChild(b);
  });
}
/* ---- serving stepper: 1 tap for the common ±1 adjust (vs 4 taps to retype) ---- */
function stepQty(dir){
  const step = dMode==="kcal" ? 10 : dMode==="prot" ? 1 : dUnit==="g" ? 10 : dUnit==="oz" ? 0.5 : 1;
  let v = round2((dQty||0) + dir*step);
  if(v < step) v = step;
  if(v > 99999) v = 99999;
  dQty = v; updateDetail();
}
document.getElementById("dModes").querySelectorAll(".chip").forEach(c=>c.onclick=()=>setDMode(c.dataset.m));
document.getElementById("dMinus").onclick = ()=>stepQty(-1);
document.getElementById("dPlus").onclick = ()=>stepQty(1);
/* Manage any food from its detail sheet (2026.10.14-i, Jay's ask): built-ins
   can be edited (saving forks them into a custom food) and removed (hidden
   via S.deletedFoods, restorable from the Foods tab). */
document.getElementById("dEditBtn").onclick = ()=>{
  if(!sheetFood) return;
  const wasSheet = sheet.classList.contains("open");
  editCustomFood(sheetFood.n);
  if(wasSheet) customFromSheet = true; /* after saving, return to a refreshed search list */
};
document.getElementById("dRemoveBtn").onclick = ()=>{
  if(!sheetFood) return;
  const nm = sheetFood.n;
  if(isCustom(nm)) delCustomFood(nm); else delDefaultFood(nm);
  showSearch(); renderSheetResults(document.getElementById("sheetSearch").value);
};
/* ---- serving presets: up to 3 recent (qty,unit) combos per food, one-tap ---- */
function paintDPresets(){
  const f = sheetFood, box = document.getElementById("dPresets");
  if(dMode!=="serv"){ box.innerHTML = ""; box.style.display = "none"; return; } /* presets are serving-based */
  const ps = (S.lastServ && S.lastServ[f.n] && S.lastServ[f.n].presets) || [];
  box.innerHTML = "";
  if(!ps.length){ box.style.display = "none"; return; }
  box.style.display = "";
  ps.forEach(p=>{
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = trimNum(p.q)+" "+(p.u==="serv" ? servUnitLabel(f) : p.u);
    b.onclick = ()=>{ dQty = p.q; dUnit = p.u; paintDUnits(); updateDetail(); };
    box.appendChild(b);
  });
}
function updateDetail(){
  const f = sheetFood, serv = dServings(), qi = document.getElementById("dQty");
  if(document.activeElement!==qi) qi.value = dQty;
  document.getElementById("dUnit").textContent = dMode!=="serv" ? "≈ "+trimNum(serv)+" servings" : (dUnit==="serv" ? servUnitLabel(f) : dUnit);
  document.getElementById("dKcal").textContent = Math.round(f.cal*serv).toLocaleString()+" kcal";
  const dmEl = document.getElementById("dMacros");
  const mp = f.p*serv, mc = f.c*serv, mf = f.f*serv;
  if(mp+mc+mf>0){ dmEl.style.display = ""; dmEl.textContent = "P "+r1(mp)+"g · C "+r1(mc)+"g · F "+r1(mf)+"g"; }
  else dmEl.style.display = "none";
  document.getElementById("confirmAdd").textContent = "Confirm · "+Math.round(f.cal*serv).toLocaleString()+" kcal";
  const uc = foodUnitCost(f), dcEl = document.getElementById("dCost");
  if(uc>0){ dcEl.style.display=""; dcEl.textContent = fmtCost(uc*serv)+" · "+fmtCost(uc)+" each"; }
  else dcEl.style.display = "none";
}
document.getElementById("dQty").addEventListener("input", e=>{
  const v = parseFloat(e.target.value);
  if(v>0 && v<100000){ dQty = v; updateDetail(); }
});
document.getElementById("sheetSearch").addEventListener("input", e=>renderSheetResults(e.target.value));
document.getElementById("confirmAdd").onclick = ()=>{
  if(!sheetFood) return; /* guard: detail opened without a food (2026.09.21-k) */
  addToTray(sheetFood, round2(dServings()), dMeal);
  /* remember last serving + up to 3 recent (qty,unit) presets per food */
  const ls = (S.lastServ = S.lastServ||{});
  const rec = ls[sheetFood.n] || (ls[sheetFood.n] = {});
  rec.q = dMode==="serv" ? dQty : round2(dServings()); rec.u = dMode==="serv" ? dUnit : "serv";
  rec.presets = [{q:rec.q, u:rec.u}] /* 2026.10.21-e (audit): presets must store servings like rec.q does — in kcal/protein modes dQty is a nutrient target, and saving it raw made a "500 servings" preset */
    .concat((rec.presets||[]).filter(p=>!(round2(p.q)===round2(rec.q) && p.u===rec.u)))
    .slice(0, 3);
  save(); haptic();
  showSearch(); sheetBody().scrollTop = sheetReturnTop;
};

/* ============ FOODS TAB ============ */
function recentFoods(){
  const seen = new Map();
  const days = Object.keys(S.days).sort().reverse().filter(k=>{ const dd = S.days[k]; return dd && dd.meals && MEALS.some(m=>(dd.meals[m]||[]).length); }).slice(0,14); /* 2026.10.21-e (audit): browsing dates auto-creates empty day records — they must not push real recents out of the window */
  days.forEach(k => MEALS.forEach(m => (S.days[k].meals[m]||[]).forEach(e => {
    if(!seen.has(e.n)){ const f = findFood(e.n); if(f) seen.set(e.n, f); }
  })));
  /* freshly created foods appear in Recent immediately, newest first (2026.09.24-x) */
  (S.customFoods||[]).filter(f=>f.createdAt && !seen.has(f.n))
    .sort((a,b)=>b.createdAt-a.createdAt)
    .forEach(f=>seen.set(f.n, f));
  return [...seen.values()];
}
function delDefaultFood(name){
  if(!confirm(`Remove "${name}" from the app? Your past log entries keep their data. You can restore built-in foods from the Foods tab.`)) return;
  /* bake the photo into past entries first, same as custom deletes */
  const doomed = FOODS.find(f=>f.n===name);
  if(doomed && doomed.img){
    for(const k in (S.days||{})){
      const ms = (S.days[k]||{}).meals||{};
      Object.keys(ms).forEach(m=>(ms[m]||[]).forEach(e=>{ if(e.n===name && !e.img) e.img = doomed.img; }));
    }
  }
  (S.deletedFoods = S.deletedFoods || []).push(name);
  const fi = (S.favorites||[]).indexOf(name); if(fi>=0) S.favorites.splice(fi,1);
  save(); renderFoods();
}
function delCustomFood(name){
  if(!confirm(`Delete "${name}"? Your past log entries keep their data.`)) return;
  /* bake the photo into past entries first — they resolve the library by name,
     which is about to disappear */
  const doomed = (S.customFoods||[]).find(f=>f.n===name);
  if(doomed && doomed.img){
    for(const k in (S.days||{})){
      const ms = (S.days[k]||{}).meals||{};
      Object.keys(ms).forEach(m=>(ms[m]||[]).forEach(e=>{ if(e.n===name && !e.img) e.img = doomed.img; }));
    }
  }
  S.customFoods = S.customFoods.filter(f=>f.n!==name);
  const fi = S.favorites.indexOf(name); if(fi>=0) S.favorites.splice(fi,1);
  save(); renderFoods();
}
/* Foods page (2026.10.14-i): Supplements get their own card so the daily stack
   is never buried in the food list, and the list actually sorts — Recent,
   Most logged (counted from his diary, no new tracking), A–Z, per-serving
   Protein/Carbs/Fat/Calories, and protein density. The star chip filters to
   favorites. Sort choice persists. Search matches location too (parity with
   the add sheet). */
let foodSort = "recent", foodFavOnly = false;
try { const fp = JSON.parse(localStorage.getItem("fuel.foodSort.v1") || "null"); if(fp){ foodSort = fp.s || "recent"; foodFavOnly = !!fp.fav; } } catch(e) {}
function saveFoodSortPref(){ try { localStorage.setItem("fuel.foodSort.v1", JSON.stringify({s: foodSort, fav: foodFavOnly})); } catch(e) {} }
function logCounts(){
  const counts = {};
  Object.values(S.days || {}).forEach(d => Object.values(d.meals || {}).forEach(arr => (arr || []).forEach(e => { if(e && e.n) counts[e.n] = (counts[e.n] || 0) + 1; })));
  return counts;
}
function sortFoodList(list){
  const by = fn => list.slice().sort((a, b) => fn(b) - fn(a));
  switch(foodSort){
    case "name": return list.slice().sort((a, b) => a.n.localeCompare(b.n));
    case "freq": { const c = logCounts(); return by(f => c[f.n] || 0); }
    case "p": return by(f => f.p || 0);
    case "c": return by(f => f.c || 0);
    case "f": return by(f => f.f || 0);
    case "cal": return by(f => f.cal || 0);
    case "dens": return by(f => f.cal > 0 ? (f.p || 0) / f.cal : 0);
    default: return list;
  }
}
function foodRowHtml(f){
  return `<div class="arow2" data-n="${esc(f.n)}"><span class="athumb">${foodThumb(f)}</span>
     <div class="anm"><b>${locPrefixHTML(f.loc)}${esc(f.n)}</b><span>${Math.round(f.cal)}kcal / ${esc(f.s)}</span></div>
     <button class="favstar" data-n="${esc(f.n)}" aria-label="${isFav(f.n)?"Remove from favorites":"Add to favorites"}">${isFav(f.n)?STAR_ON:STAR_OFF}</button>
     <button class="nedit" data-n="${esc(f.n)}" aria-label="Edit food"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button></div>`;
  /* 2026.11.25-a: the row's own + and × are gone — tapping the row already
     opens the log sheet (same as +), and that sheet has Edit and Remove.
     Every food on this page is yours, so the DIY badge was noise here. */
}
function wireFoodRows(box){
  box.querySelectorAll(".favstar").forEach(b=>b.onclick=e=>{ e.stopPropagation(); toggleFav(b.dataset.n); renderFoods(); });
  box.querySelectorAll(".aplus").forEach(b=>b.onclick=e=>{ e.stopPropagation(); openSheet(mealForNow()); openDetail(findFood(b.dataset.n)); });
  box.querySelectorAll(".ndel").forEach(b=>b.onclick=e=>{ e.stopPropagation(); delCustomFood(b.dataset.n); });
  box.querySelectorAll(".nedit").forEach(b=>b.onclick=e=>{ e.stopPropagation(); editCustomFood(b.dataset.n); });
  box.querySelectorAll(".arow2").forEach(r=>r.onclick=()=>{ openSheet(mealForNow()); openDetail(findFood(r.dataset.n)); });
}
function paintFoodSortChips(){
  document.querySelectorAll("#foodSortChips .chip").forEach(ch => {
    if(ch.dataset.s) ch.classList.toggle("sel", ch.dataset.s === foodSort);
    if(ch.dataset.fav) ch.classList.toggle("sel", foodFavOnly);
  });
}
function renderFoods(){
  paintFoodSortChips();
  const q = document.getElementById("foodSearch").value.trim().toLowerCase();
  let list = S.customFoods.slice().reverse();
  if(q) list = list.filter(f => f.n.toLowerCase().includes(q) || (f.loc || "").toLowerCase().includes(q));
  if(foodFavOnly) list = list.filter(f => isFav(f.n));
  const supps = sortFoodList(list.filter(f => f.kind === "supp"));
  const foods = sortFoodList(list.filter(f => f.kind !== "supp"));
  const total = supps.length + foods.length;
  document.getElementById("foodCount").textContent = total ? total + " item" + (total > 1 ? "s" : "") : "";
  const sc = document.getElementById("suppCard");
  sc.style.display = supps.length ? "" : "none";
  if(supps.length){
    document.getElementById("suppCount").textContent = "Supplements · " + supps.length;
    const sb = document.getElementById("suppResults");
    sb.innerHTML = supps.slice(0, 60).map(foodRowHtml).join("");
    wireFoodRows(sb);
  }
  document.getElementById("foodCardLabel").textContent = "Foods · " + foods.length;
  const box = document.getElementById("foodResults");
  box.innerHTML = foods.slice(0, 80).map(foodRowHtml).join("") || `<div class="empty">No custom foods yet — tap + Add custom food to create your first one.</div>`;
  wireFoodRows(box);
  const fr = document.getElementById("foodsRestore");
  if(fr){
    const nDel = (S.deletedFoods || []).length;
    fr.innerHTML = nDel ? `<div class="card" style="display:flex;align-items:center;gap:10px"><span style="flex:1;font-size:13px;color:var(--muted)">${nDel} built-in food${nDel > 1 ? "s" : ""} hidden</span><button class="chip" id="foodsRestoreBtn">Restore</button></div>` : "";
    const rb = document.getElementById("foodsRestoreBtn");
    if(rb) rb.onclick = ()=>{ S.deletedFoods = []; save(); renderFoods(); };
  }
}
document.querySelectorAll("#foodSortChips .chip").forEach(ch => ch.onclick = () => {
  if(ch.dataset.fav) foodFavOnly = !foodFavOnly;
  else foodSort = ch.dataset.s;
  saveFoodSortPref(); renderFoods();
});
document.getElementById("foodSearch").addEventListener("input", renderFoods);
const csheet = document.getElementById("csheet");
let cPhotoData = "";
function setCPhoto(data){
  cPhotoData = data || "";
  const prev = document.getElementById("cPhotoPreview");
  prev.style.display = cPhotoData ? "" : "none";
  if(cPhotoData) prev.src = cPhotoData; else prev.removeAttribute("src");
  document.getElementById("cPhotoBtn").style.display = cPhotoData ? "none" : "";
  document.getElementById("cPhotoDel").style.display = cPhotoData ? "" : "none";
}
/* Location quick-picks: locations already used on his foods, most recent first — one tap instead of typing (2026.10.13-a) */
function paintLocChips(){
  const box = document.getElementById("cLocChips"); if(!box) return;
  const seen = [];
  S.customFoods.slice().reverse().forEach(f=>{ if(f.loc && !seen.includes(f.loc)) seen.push(f.loc); });
  box.style.display = seen.length ? "" : "none";
  box.innerHTML = seen.slice(0,8).map(l=>`<button type="button" class="chip" data-loc="${esc(l)}">${esc(l)}</button>`).join("");
  box.querySelectorAll(".chip").forEach(ch=>ch.onclick=()=>{ document.getElementById("cLoc").value = ch.dataset.loc; });
}
let cEditing = null; // name of the custom food being edited (null = creating a new one)
let cForkOf = null; // built-in food being forked into a custom one on save (2026.10.14-i)
function editCustomFood(name){
  const cust = S.customFoods.find(x=>x.n===name);
  const f = cust || FOODS.find(x=>x.n===name);
  if(!f) return;
  resetCustomForm();
  cForkOf = cust ? null : name; /* built-in: saving forks it into a custom food and hides the original */
  cEditing = cust ? name : null;
  const isSupp = f.kind==="supp";
  cKind = isSupp ? "supp" : "food";
  document.querySelectorAll("#cKindChips .chip").forEach(x=>x.classList.toggle("sel", x.dataset.kind===cKind));
  document.getElementById("cSuppSec").style.display = isSupp ? "" : "none";
  document.getElementById("cFoodServSec").style.display = isSupp ? "none" : "";
  document.getElementById("cFoodNutrSec").style.display = isSupp ? "none" : "";
  document.getElementById("cSuppNutrSec").style.display = isSupp ? "" : "none";
  document.getElementById("cCal").placeholder = isSupp ? "0" : "Required";
  if(isSupp){
    if(f.unit && SUPP_UNITS.includes(f.unit)) cUnit = f.unit;
    document.querySelectorAll("#cUnitChips .chip").forEach(x=>x.classList.toggle("sel", x.dataset.u===cUnit));
  }
  document.getElementById("cName").value = f.n;
  const sv = document.getElementById("cServ");
  sv.value = f.s || ""; sv.dataset.dirty = "1";
  document.getElementById("cCal").value = f.cal || "";
  document.getElementById("cPrice").value = f.pr || "";
  document.getElementById("cPServ").value = f.ps || "";
  document.getElementById("cLoc").value = f.loc || "";
  if(isSupp){
    document.getElementById("cP").value = f.p || "";
    document.getElementById("cC").value = f.c || "";
    document.getElementById("cF").value = f.f || "";
    document.getElementById("cNutrRows").innerHTML = "";
    (f.nutrs||[]).forEach(x=>{
      addNutrRow(x.n, x.u);
      const rows = document.querySelectorAll("#cNutrRows .nutrrow");
      rows[rows.length-1].children[1].value = x.amt;
    });
    cNutrSeed = [...document.querySelectorAll("#cNutrRows .nutrrow")].map(r=>r.children[0].value+"|"+r.children[2].value).join(";");
    document.getElementById("cXW").checked = !!f.xw; paintXWTgl();
  } else {
    document.getElementById("fProt").value = f.p || "";
    document.getElementById("fCarb").value = f.c || "";
    document.getElementById("fFat").value = f.f || "";
    const idByName = {"Saturated Fat":"fSatFat","Trans Fat":"fTransFat","Cholesterol":"fChol","Sodium":"fSod",
      "Dietary Fiber":"fFiber","Total Sugars":"fSugar","Added Sugars":"fAddSugar","Vitamin D":"fVitD",
      "Calcium":"fCalc","Iron":"fIron","Potassium":"fPot"};
    (f.nutrs||[]).forEach(x=>{ const id = idByName[x.n]; if(id) document.getElementById(id).value = x.amt; });
  }
  setCPhoto(f.img || "");
  document.querySelector("#csheet h2").textContent = cForkOf ? "Edit Food" : "Edit Custom Food";
  document.getElementById("cSave").textContent = "Save changes";
  customFromSheet = false; csheet.classList.add("open");
}
function resetCustomForm(){
  cEditing = null;
  cForkOf = null;
  document.querySelector("#csheet h2").textContent = "Create Custom Food";
  document.getElementById("cSave").textContent = "Save";
  ["cName","cServ","cCal","cPrice","cPServ","cLoc","cP","cC","cF"].forEach(id=>document.getElementById(id).value="");
  paintLocChips();
  FOOD_LABEL_ROWS.forEach(([id])=>{document.getElementById(id).value="";});
  if(typeof pctMode!=="undefined"){ pctMode = {}; }
  document.querySelectorAll(".pcttgl").forEach(b=>b.classList.remove("sel"));
  ["fVitD","fCalc","fIron","fPot"].forEach(id=>{ const h = document.getElementById(id+"Hint"); if(h) h.textContent = ""; });
  document.getElementById("cPhotoFile").value = "";
  setCPhoto("");
  cKind = "food"; cUnit = "capsule"; cFoodUnit = "g";
  document.querySelectorAll("#cKindChips .chip").forEach(x=>x.classList.toggle("sel", x.dataset.kind==="food"));
  document.getElementById("cSuppSec").style.display = "none";
  document.getElementById("cFoodServSec").style.display = "";
  document.getElementById("cFoodNutrSec").style.display = "";
  document.getElementById("cSuppNutrSec").style.display = "none";
  document.querySelectorAll("#cFoodUnitChips .chip").forEach(x=>x.classList.toggle("sel", x.dataset.u==="g"));
  document.querySelectorAll("#cUnitChips .chip").forEach(x=>x.classList.toggle("sel", x.dataset.u==="capsule"));
  document.getElementById("cNutrRows").innerHTML = ""; cNutrSeed = "";
  document.getElementById("cXW").checked = false; paintXWTgl();
  const sv = document.getElementById("cServ"); sv.dataset.dirty = "";
  document.getElementById("cCal").placeholder = "Required";
}
document.getElementById("newCustomBtn").onclick = ()=>{ resetCustomForm(); customFromSheet = false; csheet.classList.add("open"); };
document.getElementById("cScrim").onclick = closeCustom;
function closeCustom(){ csheet.classList.remove("open"); if(customFromSheet){ customFromSheet = false; sheet.classList.add("open"); } }
document.getElementById("cX").onclick = closeCustom;
document.getElementById("cPhotoBtn").onclick = ()=>document.getElementById("cPhotoFile").click();
document.getElementById("cPhotoDel").onclick = ()=>{ document.getElementById("cPhotoFile").value=""; setCPhoto(""); };
document.getElementById("cPhotoFile").onchange = e=>{
  const file = e.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{
    const max = 320, scale = Math.min(1, max/Math.max(img.width, img.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.width*scale); cv.height = Math.round(img.height*scale);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    setCPhoto(cv.toDataURL("image/jpeg", 0.8));
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); alert("Couldn't read that photo."); };
  img.src = url;
};
/* %DV -> amount conversion for the label form (2026.10.14-i) */
function pctAmt(n, id){
  const v = parseFloat(document.getElementById(id).value) || 0;
  if(!(v>0)) return 0;
  if(typeof pctMode!=="undefined" && pctMode[id] && NUTR_DV[n]){
    /* 1 decimal kept: Iron's DV is only 18 mg, so whole-mg rounding would
       turn a label's 10% into 2 mg instead of 1.8 */
    return Math.round(v/100*NUTR_DV[n].dv*10)/10;
  }
  return v;
}
document.getElementById("cSave").onclick = ()=>{
  const n = document.getElementById("cName").value.trim();
  if(!n){ alert("Give it a name."); return; }
  const isSupp = cKind==="supp";
  const cal = parseFloat(document.getElementById("cCal").value)||0;
  if(!isSupp && !(cal>0)){ alert("Enter calories for the food."); return; }
  const num = id => parseFloat(document.getElementById(id).value) || 0;
  const sTxt = document.getElementById("cServ").value.trim() || (isSupp ? "1 "+cUnit : "1 serving");
  let p, c, f, nutrs;
  if(isSupp){
    p = num("cP"); c = num("cC"); f = num("cF");
    nutrs = [...document.querySelectorAll("#cNutrRows .nutrrow")].map(r=>({
      n:r.children[0].value.trim(), amt:parseFloat(r.children[1].value)||0, u:r.children[2].value
    })).filter(x=>x.n && x.amt>0);
    for(const x of nutrs){
      const dv = NUTR_DV[canonNutr(x.n)], u = String(x.u).toLowerCase();
      if(dv && u==="g" && x.amt>=1 && dv.unit!=="g"){
        if(!confirm(`Heads up: ${x.amt} g of ${x.n} is way over the daily value (${dv.dv} ${dv.unit}) — the unit is probably meant to be mg, not g.\n\nOK = save as ${x.amt} g anyway · Cancel = go back and fix it`)) return;
      }
    }
  } else {
    /* Food: fixed Nutrition Facts rows, fixed FDA units — no unit pickers. */
    p = num("fProt"); c = num("fCarb"); f = num("fFat");
    nutrs = [["Saturated Fat","fSatFat","g"],["Trans Fat","fTransFat","g"],
             ["Cholesterol","fChol","mg"],["Sodium","fSod","mg"],
             ["Dietary Fiber","fFiber","g"],["Total Sugars","fSugar","g"],["Added Sugars","fAddSugar","g"],
             ["Vitamin D","fVitD","mcg"],["Calcium","fCalc","mg"],["Iron","fIron","mg"],["Potassium","fPot","mg"]]
      .map(([n,id,u])=>({n, amt:pctAmt(n,id), u})).filter(x=>x.amt>0);
  }
  /* Serving-size plausibility: if the calories/macros can't physically fit the
     serving, the serving size is probably too small (Atwater: 4/4/9 kcal/g, fat max ~9). */
  const servG = servingGrams(sTxt), issues = [];
  const mp = p, mc = c, mf = f;
  if(servG){
    const macroG = mp+mc+mf;
    if(macroG > servG*1.05) issues.push(`Protein + carbs + fat add up to ${r1(macroG)} g, but the serving is only ${r1(servG)} g — the serving size has to be bigger (or the macros smaller).`);
    if(cal>0 && cal/servG > 9.5) issues.push(`${r1(cal)} kcal in a ${r1(servG)} g serving is ${(cal/servG).toFixed(1)} kcal/g — even pure fat is only 9 kcal/g. The serving size has to be bigger.`);
  }
  const expKcal = 4*mp+4*mc+9*mf;
  if(cal>0 && expKcal>0 && Math.abs(cal-expKcal) > Math.max(30, 0.25*Math.max(cal,expKcal)))
    issues.push(`Your macros work out to about ${Math.round(expKcal)} kcal (4/4/9 math), but you entered ${r1(cal)} kcal — double-check for a typo.`);
  if(issues.length && !confirm(issues.join("\n\n")+"\n\nSave anyway?")) return;
  /* Price: whole-package price + servings per package → cost per serving. */
  const cPr = parseFloat(document.getElementById("cPrice").value)||0;
  let cPs = parseFloat(document.getElementById("cPServ").value)||0;
  if(cPr>0 && !(cPs>0)) cPs = 1; /* price without servings = the food as defined is the whole package */
  const cLocTxt = document.getElementById("cLoc").value.trim();
  const rec = {n, s:sTxt,
    cal, p, c, f, img:cPhotoData, pr:cPr, ps:cPs,
    kind:isSupp?"supp":"food", unit:isSupp?cUnit:null, nutrs, xw:isSupp && document.getElementById("cXW").checked,
    createdAt: Date.now()}; /* Recent tab shows fresh creations immediately (2026.09.24-x) */
  if(cLocTxt) rec.loc = cLocTxt; /* restaurant or store; absent = homemade (2026.10.13-a) */
  if(cEditing){
    if(rec.n!==cEditing && S.customFoods.some(x=>x.n===rec.n)){ alert("You already have a food called \""+rec.n+"\"."); return; }
    const ix = S.customFoods.findIndex(x=>x.n===cEditing);
    if(ix>=0){ rec.createdAt = S.customFoods[ix].createdAt || rec.createdAt; S.customFoods[ix] = rec; }
    if(rec.n!==cEditing){
      Object.values(S.days||{}).forEach(d=>MEALS.forEach(m=>((d.meals||{})[m]||[]).forEach(e=>{ if(e.n===cEditing) e.n = rec.n; })));
      const fi = S.favorites.indexOf(cEditing); if(fi>=0) S.favorites[fi] = rec.n;
    }
  } else {
    S.customFoods.push(rec);
  }
  if(cForkOf){ (S.deletedFoods = S.deletedFoods || []).push(cForkOf); cForkOf = null; }
  resetCustomForm();
  save(); renderFoods(); csheet.classList.remove("open");
  if(customFromSheet){ customFromSheet = false; renderSheetResults(document.getElementById("sheetSearch").value); sheet.classList.add("open"); }
};

/* Food serving units: FDA household measures (21 CFR 101.9(b)(5)) + metric.
   Serving sizes on labels are declared in household measure + metric equivalent. */
const FOOD_SERV_UNITS = ["g","kg","oz","lb","mL","L","fl oz","cup","tbsp","tsp","serving"];
let cFoodUnit = "g";
const cFoodUnitBox = document.getElementById("cFoodUnitChips");
cFoodUnitBox.innerHTML = FOOD_SERV_UNITS.map(u=>`<button type="button" class="chip${u===cFoodUnit?" sel":""}" data-u="${u}">${u}</button>`).join("");
cFoodUnitBox.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{
  cFoodUnit = c.dataset.u;
  cFoodUnitBox.querySelectorAll(".chip").forEach(x=>x.classList.toggle("sel", x===c));
  const sv = document.getElementById("cServ");
  if(!sv.dataset.dirty) sv.value = (cFoodUnit==="g" ? "100 " : "1 ")+cFoodUnit;
});
/* Food uses a real Nutrition Facts layout: fixed rows with FDA-fixed units,
   just fill in amounts. The free-form name/unit builder is supplement-only now. */
const FOOD_LABEL_ROWS = [
  ["fFat","Total Fat","g"],["fSatFat","Saturated Fat","g"],["fTransFat","Trans Fat","g"],
  ["fChol","Cholesterol","mg"],["fSod","Sodium","mg"],
  ["fCarb","Total Carbohydrate","g"],["fFiber","Dietary Fiber","g"],["fSugar","Total Sugars","g"],["fAddSugar","Added Sugars","g"],
  ["fProt","Protein","g"],
  ["fVitD","Vitamin D","mcg"],["fCalc","Calcium","mg"],["fIron","Iron","mg"],["fPot","Potassium","mg"]
];
document.getElementById("cFoodNutrBox").innerHTML = FOOD_LABEL_ROWS.map(([id,n,u])=>{
  const pct = ["fVitD","fCalc","fIron","fPot"].includes(id)
    ? `<span class="pcthint" id="${id}Hint"></span><button type="button" class="pcttgl" data-for="${id}" aria-label="Enter as percent of daily value">%DV</button>` : "";
  return `<div class="cfrow"><span>${n} (${u})</span><span class="cfrowin">${pct}<input id="${id}" type="number" inputmode="decimal" placeholder="Optional"></span></div>`;
}).join("");
/* % Daily Value entry for the four micronutrients (2026.10.14-i, Jay's ask):
   many labels print only a % for Vitamin D / Calcium / Iron / Potassium, no
   mcg/mg amount. In % mode the field takes the % and converts it to the
   amount with the FDA daily value on save, so nutrient totals stay right. */
let pctMode = {};
const PCT_FIELDS = ["fVitD","fCalc","fIron","fPot"];
const PCT_NAME = {fVitD:"Vitamin D", fCalc:"Calcium", fIron:"Iron", fPot:"Potassium"};
function paintPctHint(id){
  const hint = document.getElementById(id+"Hint"); if(!hint) return;
  const v = parseFloat(document.getElementById(id).value) || 0;
  const dv = NUTR_DV[PCT_NAME[id]];
  if(pctMode[id] && v>0 && dv){
    const amt = v/100*dv.dv;
    hint.textContent = "= " + (amt>=100 ? Math.round(amt) : Math.round(amt*10)/10) + " " + dv.unit;
  } else hint.textContent = "";
}
document.querySelectorAll(".pcttgl").forEach(b=>b.onclick = ()=>{
  const id = b.dataset.for;
  pctMode[id] = !pctMode[id];
  b.classList.toggle("sel", !!pctMode[id]);
  paintPctHint(id);
});
PCT_FIELDS.forEach(id=>{ const el = document.getElementById(id); if(el) el.addEventListener("input", ()=>paintPctHint(id)); });
/* ============ SUPPLEMENT CREATION ============ */
const SUPP_UNITS = ["capsule","tablet","softgel","gummy","scoop","packet","dropper (mL)","serving","g","mg","mcg","mL","IU"];
const NUTR_UNITS = ["mg","mcg","g","IU","mL"];
let cKind = "food", cUnit = "capsule";
const cUnitBox = document.getElementById("cUnitChips");
cUnitBox.innerHTML = SUPP_UNITS.map(u=>`<button type="button" class="chip${u===cUnit?" sel":""}" data-u="${u}">${u}</button>`).join("");
cUnitBox.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{
  cUnit = c.dataset.u;
  cUnitBox.querySelectorAll(".chip").forEach(x=>x.classList.toggle("sel", x===c));
  const sv = document.getElementById("cServ");
  if(!sv.dataset.dirty) sv.value = "1 "+cUnit;
});
document.getElementById("cServ").addEventListener("input", e=>{ e.target.dataset.dirty = e.target.value.trim() ? "1" : ""; });
document.querySelectorAll("#cKindChips .chip").forEach(c=>c.onclick=()=>{
  cKind = c.dataset.kind;
  document.querySelectorAll("#cKindChips .chip").forEach(x=>x.classList.toggle("sel", x===c));
  document.getElementById("cSuppSec").style.display = cKind==="supp" ? "" : "none";
  document.getElementById("cFoodServSec").style.display = cKind==="food" ? "" : "none";
  document.getElementById("cFoodNutrSec").style.display = cKind==="food" ? "" : "none";
  document.getElementById("cSuppNutrSec").style.display = cKind==="supp" ? "" : "none";
  document.getElementById("cCal").placeholder = cKind==="supp" ? "0" : "Required";
  const sv = document.getElementById("cServ");
  if(cKind==="supp" && !sv.dataset.dirty) sv.value = "1 "+cUnit;
  else if(cKind==="food" && !sv.dataset.dirty) sv.value = "100 "+cFoodUnit;
  if(cKind==="supp" && nutrRowsPristine()) seedNutrRows();
});
/* Default nutrient rows for the SUPPLEMENT builder, from FDA label research (2026-09-18):
   the most common dietary ingredients on Supplement Facts labels.
   Food uses the fixed Nutrition Facts rows above instead — no free-form builder.
   Empty rows are dropped on save, so these are just fill-in-the-blank. */
const NUTR_DEFAULTS = {
  supp:[["Vitamin D","mcg"],["Magnesium","mg"],["Zinc","mg"],["Vitamin B12","mcg"]]
};
function addNutrRow(name, unit){
  const r = document.createElement("div");
  r.className = "nutrrow";
  r.innerHTML = `<input type="text" placeholder="e.g. Vitamin D3" value="${esc(name||"")}"><input type="number" inputmode="decimal" placeholder="Amt"><select>${NUTR_UNITS.map(u=>`<option${u===unit?" selected":""}>${u}</option>`).join("")}</select><button type="button" class="ndel" aria-label="Remove">×</button>`;
  r.querySelector(".ndel").onclick = ()=>r.remove();
  document.getElementById("cNutrRows").appendChild(r);
}
let cNutrSeed = "";
function nutrRowsPristine(){
  const cur = [...document.querySelectorAll("#cNutrRows .nutrrow")].map(r=>r.children[0].value+"|"+r.children[2].value).join(";");
  return cur===cNutrSeed && [...document.querySelectorAll("#cNutrRows .nutrrow")].every(r=>!String(r.children[1].value).trim());
}
function seedNutrRows(){
  document.getElementById("cNutrRows").innerHTML = "";
  (NUTR_DEFAULTS.supp||[]).forEach(([n,u])=>addNutrRow(n,u));
  cNutrSeed = [...document.querySelectorAll("#cNutrRows .nutrrow")].map(r=>r.children[0].value+"|"+r.children[2].value).join(";");
}
/* Serving → grams, so plausibility checks run on a metric base.
   Household → metric equivalents per FDA (1 oz = 28.3495 g, 1 cup = 236.588 mL);
   mL≈g assumes water-like density, fine for a sanity check. */
const FOOD_UNIT_G = {g:1, kg:1000, oz:28.3495, lb:453.592, ml:1, l:1000, "fl oz":29.5735, cup:236.588, tbsp:14.7868, tsp:4.92892};
function servingGrams(sTxt){
  const t = String(sTxt||"").trim();
  let m = t.match(/\(([\d.]+)\s*g\)/i);
  if(m && parseFloat(m[1])>0) return parseFloat(m[1]);
  m = t.match(/^([\d.]+)\s*([a-zA-Z ]+)?/);
  if(!m || !(parseFloat(m[1])>0)) return null;
  const per = FOOD_UNIT_G[(m[2]||"g").trim().toLowerCase()];
  return per ? parseFloat(m[1])*per : null;
}
document.getElementById("cNutrAdd").onclick = addNutrRow;

/* ============ PROGRESS TAB ============ */
/* week backtrack: off=0 is the current 7 days, off=1 the 7 before that, ... (up to a year) */
let weekOffset = 0;
const MAX_WEEKS_BACK = 52;
function weekDays(off){
  off = off||0;
  const out = [];
  /* 2026.09.27-f: calendar week Mon–Sun (not Sun–Sat / rolling 7) */
  const t = new Date(); t.setHours(12,0,0,0);
  const mon = new Date(t); mon.setDate(t.getDate()-((t.getDay()+6)%7)-off*7);
  for(let i=0;i<7;i++){ const d=new Date(mon); d.setDate(mon.getDate()+i); const k=dstr(d);
    out.push({k, label:d.toLocaleDateString(undefined,{weekday:"narrow"}), future:k>todayStr(), locked:isLocked(k), ...totals(k), logged:dayHasData(S.days[k])}); }
  return out;
}
function weekLabel(days){
  const o = {month:"short", day:"numeric"};
  const f = new Date(days[0].k+"T12:00:00"), t = new Date(days[6].k+"T12:00:00");
  return f.toLocaleDateString(undefined,o)+" – "+t.toLocaleDateString(undefined,o);
}
function streak(){
  let s=0; const d=new Date();
  for(let i=0;i<365;i++){ const k=dstr(d);
    if(isLocked(k)){ d.setDate(d.getDate()-1); continue; } /* 2026.10.08-f: locked day = neutral skip */
    const dd=S.days[k];
    const has = dayHasData(dd);
    if(has) s++; else if(i>0 || k!==todayStr()) break;
    d.setDate(d.getDate()-1);
  }
  return s;
}
/* ============ CALORIE CHECK (Hall 2014 model-based feedback control) ============
   Formulas guess; weigh-ins decide. Compare the 7-day-averaged weight trend over 2+ weeks
   against the target rate, then adjust intake ±100-150 kcal. Research finds no large
   "metabolic damage" term beyond what the formulas predict — the trend is the truth. */
function targetRateBand(){
  /* 2026.11.25-c: your own weight (7-day weigh-in average), never an assumed
     150 lb; no surplus = maintenance band, not a 0%-exactly target */
  const m = S.goals.mode, w = goalWeight().lb;
  const s = S.goals.surplus>0 ? S.goals.surplus : 0;
  if(m==="maintain" || !(s>0) || !(w>0)) return [-0.15, 0.15];
  if(s>0){
    /* 2026.09.25-d: derive the band from the prescribed surplus so it always
       contains the app's own projection — a +15% bulk at 123 lb projects
       0.66%/wk, which the old fixed [0.3,0.6] cap flagged as "too fast" and made
       Auto-tune cut the goal for following the recommendation. Custom mode
       already worked this way. */
    const r = s*7/3500/w*100;
    return [r*0.6, r*1.4];
  }
  if(m==="lean") return [0.25, 0.5];
  if(m==="bulk") return [0.3, 0.6];
  return [0, 0];
}
/* ============ WEIGHT GOAL + ANALYSIS (Progress) ============ */
function sortedWeights(){ return (S.weights||[]).slice().sort((a,b)=>a.d<b.d?-1:1); }
function curBodyWeight(){
  const ws = sortedWeights();
  if(ws.length) return ws[ws.length-1].w;
  const p = S.goals.profile||{};
  return p.weightLb>0 ? p.weightLb : 0;
}
/* 2026.11.25-c: the weight every goal calculation uses (calories, protein,
   gain-rate band). One morning's water swing (±1-2 lb) no longer moves your
   targets: it is the average of your weigh-ins in the 7 days ending at the
   latest one (the same window as the Progress trend). One weigh-in in that
   window = that weigh-in; no weigh-ins = the weight typed in your profile. */
function goalWeight(){
  const ws = sortedWeights();
  if(ws.length){
    const T = p => new Date(p.d+"T12:00:00").getTime(), last = ws[ws.length-1];
    const win = ws.filter(p => T(p) > T(last) - 7*864e5);
    if(win.length >= 2) return {lb: win.reduce((a,p)=>a+p.w,0)/win.length, n: win.length, src: "7-day average of "+win.length+" weigh-ins"};
    return {lb: last.w, n: 1, src: "latest weigh-in"};
  }
  const p = S.goals.profile||{};
  return p.weightLb>0 ? {lb: p.weightLb, n: 0, src: "profile"} : {lb: 0, n: 0, src: "none"};
}
/* Trend from weigh-ins: halves-by-date split so the two windows never overlap (same method as Calorie Check).
   2026 graph-UX refresh: rates are computed on the 7-day moving average ("trend weight",
   Happy Scale/Libra/MacroFactor convention) — raw daily noise (±1-2%) misleads. Falls back
   to raw when too sparse for a trend. Display stats (hi/lo/change) stay on raw. */
function weightTrend(){
  const ws = sortedWeights();
  if(ws.length < 2) return null;
  const T = p => new Date(p.d+"T12:00:00").getTime();
  const ma = trendMA(ws).filter(m=>m.n>=2);
  const rs = ma.length>=3 ? ma : ws;
  const spanD = Math.max(1, Math.round((T(rs[rs.length-1])-T(rs[0]))/86400000));
  const rateWk = halvesRate(rs);
  const vals = ws.map(p=>p.w);
  return {rateWk, daily: rateWk==null?null:rateWk/7, change: ws[ws.length-1].w-ws[0].w, spanD,
          hi: Math.max(...vals), lo: Math.min(...vals), n: ws.length,
          disp: {hi: wDisp(Math.max(...vals)), lo: wDisp(Math.min(...vals)), change: wDisp(ws[ws.length-1].w-ws[0].w)}};
}
/* ============ ANALYTICS ENGINE — one data layer for compound metrics ============
   Pure functions over S (no DOM): diary days, weights, water, training, and tired
   level flow into one place so every surface reads the same numbers.
   Honest-data rules: missing data returns null/"sparse" flags, never implies a
   bad state; correlation is stated as correlation, never as causation. */
/* One day's combined diary record. foodLogged = has calories (what adherence counts);
   logged = food or water (what the day streak counts). waterRatio is null when there
   is no water target (blank slate) — no invented ratio. */
function dayTotals(ds){
  const d = S.days[ds] || {};
  const t = totals(ds);
  const mm = mealMacros(ds);
  const n = {fiber:0, sugars:0, sodium:0, pot:0};
  MEALS.forEach(m=>{ n.fiber+=mm[m].fiber; n.sugars+=mm[m].sugars; n.sodium+=mm[m].sodium; n.pot+=mm[m].pot; });
  const w = waterCalc(ds);
  const waterOz = Math.round((d.waterOz||0)*10)/10;
  const foodLogged = t.cal>0;
  return {ds, logged: foodLogged || waterOz>0, foodLogged, cal:t.cal, p:t.p, c:t.c, f:t.f,
    fiber:n.fiber, sugars:n.sugars, sodium:n.sodium, pot:n.pot, waterOz,
    waterRatio: (w.target>0 && !w.unset) ? waterOz/(w.target*8) : null,
    alcStd: alcData(d).std, trained: !!trainDay(ds).done};
}
/* Hit test: within ±10% of the calorie goal AND protein ≥90% — the same two tests
   adherenceStats() has always used. No goal or no food logged -> not a hit. */
function dayHit(ds){
  const t = dayTotals(ds);
  const goal = goalTotal(), pt = S.goals.protein;
  if(!t.foodLogged || !(goal>0 && pt>0)) return false;
  return t.cal>=goal*0.9 && t.cal<=goal*1.1 && t.p>=pt*0.9;
}
/* Last n days, newest last: [{ds, ...dayTotals fields, hit}]. */
function adherenceSeries(n){
  const out = [], m = n||14;
  for(let i=m-1;i>=0;i--){ const ds = addDays(todayStr(),-i); if(isLocked(ds)) continue; const t = dayTotals(ds); t.hit = dayHit(ds); out.push(t); }
  return out;
}
/* Rolling average over the last `days` calendar days. Honest rule: the denominator
   is logged days only — missing days are never padded with zeros. Returns null with
   no logged days. */
function rollingAvg(nutrient, days){
  const vals = [];
  for(let i=days-1;i>=0;i--){ const ds=addDays(todayStr(),-i); if(isLocked(ds)) continue; const t = dayTotals(ds); if(t.foodLogged) vals.push(t[nutrient]||0); }
  if(!vals.length) return null;
  return {avg: vals.reduce((a,v)=>a+v,0)/vals.length, n: vals.length, span: days};
}
/* Share of logged days (last n) hitting protein ≥90%. pct null when no goal/data. */
function proteinConsistency(n){
  n = n||14;
  const pt = S.goals.protein;
  if(!(pt>0)) return {pct:null, hit:0, n, nLogged:0};
  const s = adherenceSeries(n);
  const food = s.filter(x=>x.foodLogged);
  const hit = food.filter(x=>x.p>=pt*0.9).length;
  return {pct: food.length ? Math.round(hit/food.length*100) : null, hit, n, nLogged: food.length};
}
/* Last n days of water: [{ds, oz, ratio|null}]. */
/* Weight trend state: direction, vs the weight goal, and confidence. Rates come from
   the same trend-MA weightTrend() every surface uses. "sparse" below the Calorie
   Check gates (4+ weigh-ins, 14+ day span); flat inside a ±0.1 lb/wk noise floor. */
function trendState(){
  const wt = weightTrend();
  if(!wt || wt.rateWk==null) return {dir:"none", vsGoal:"none", conf:"sparse", rateWk:null, spanD:0, n:0};
  const rateWk = wt.rateWk;
  const dir = Math.abs(rateWk)<0.1 ? "flat" : (rateWk>0 ? "up" : "down");
  const gw = S.goals.weight>0 ? S.goals.weight : 0;
  const cur = curBodyWeight();
  let vsGoal = "none";
  if(gw>0 && cur>0){
    if(Math.abs(gw-cur)<=1) vsGoal = "at";
    else if(Math.sign(gw-cur)===Math.sign(rateWk) && Math.abs(rateWk)>=0.05) vsGoal = "toward";
    else vsGoal = "away";
  }
  const conf = (wt.n>=4 && wt.spanD>=14) ? "solid" : "sparse";
  return {dir, vsGoal, conf, rateWk, spanD: wt.spanD, n: wt.n};
}
/* Projected arrival at the weight goal at the current trend pace. Returns {ok:true,
   etaDate, etaDs, etaWeeks, wkLo, wkHi, rangeTxt, paceWarn, rateWk, toGo} or
   {ok:false, why} — never a fake date. It is a projection of the scale, not of
   muscle (the UI says so). The confidence range comes from the spread between
   the early-half and recent-half trend rates: when the pace itself is wobbly,
   the range widens honestly instead of pretending precision. */
function rateConfidence(){
  const ws = sortedWeights();
  if(ws.length < 4) return null;
  const ma = trendMA(ws).filter(m=>m.n>=2);
  if(ma.length < 4) return null;
  const T = p => new Date(p.d+"T12:00:00").getTime();
  const mid = (T(ma[0])+T(ma[ma.length-1]))/2;
  const early = ma.filter(p=>T(p)<=mid), recent = ma.filter(p=>T(p)>mid);
  const rE = halvesRate(early), rR = halvesRate(recent), rF = halvesRate(ma);
  if(rE==null || rR==null || rF==null) return null;
  return {rateWk: rF, margin: Math.max(0.1, Math.abs(rR-rE)/2)};
}
function goalProjection(){
  const gw = S.goals.weight>0 ? S.goals.weight : 0;
  if(!(gw>0)) return {ok:false, why:"Set a weight goal and this estimates your arrival date."};
  const cur = curBodyWeight();
  if(!(cur>0)) return {ok:false, why:"Log your weight and this estimates your arrival date."};
  const toGo = gw-cur;
  if(Math.abs(toGo)<=1) return {ok:false, why:"At goal — set a new one to keep going.", atGoal:true};
  const st = trendState();
  if(st.conf==="sparse") return {ok:false, why:"Log your weight for 2+ weeks (at least 4 weigh-ins) and this estimates your arrival date."};
  if(Math.abs(st.rateWk)<0.05) return {ok:false, why:"Your trend is flat right now — there is no pace to project. Give it 2-3 weeks."};
  if(st.vsGoal==="away") return {ok:false, why:"You are trending away from your goal — this only projects forward motion."};
  const etaWeeks = Math.ceil(Math.abs(toGo)/Math.abs(st.rateWk));
  const etaDs = addDays(todayStr(), etaWeeks*7);
  const etaDate = new Date(etaDs+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
  /* confidence range from pace wobble */
  let wkLo = etaWeeks, wkHi = etaWeeks;
  const rc = rateConfidence();
  if(rc && Math.abs(rc.rateWk) > rc.margin && Math.sign(rc.rateWk)===Math.sign(toGo)){
    wkLo = Math.max(1, Math.ceil(Math.abs(toGo)/(Math.abs(rc.rateWk)+rc.margin)));
    wkHi = Math.ceil(Math.abs(toGo)/Math.max(0.05, Math.abs(rc.rateWk)-rc.margin));
  }
  const rangeTxt = wkLo===wkHi ? "≈"+wkLo+" wk" : "≈"+wkLo+"–"+wkHi+" wk";
  /* pace warnings: gaining too fast/slow on a bulk, losing too fast/slow on a cut */
  let paceWarn = "";
  const sp = Math.abs(st.rateWk);
  if(toGo > 0){
    if(st.rateWk > 1.0) paceWarn = "Gaining fast — over ~1 lb/wk on a bulk usually adds more fat than muscle. Consider trimming the surplus a little.";
    else if(st.rateWk < 0.15) paceWarn = "Gaining slower than a lean-bulk pace (~0.25–0.5 lb/wk). If this holds, the surplus may need a bump.";
  } else {
    if(sp > 1.5) paceWarn = "Losing fast — over ~1.5 lb/wk risks muscle loss. Consider easing the deficit.";
    else if(sp < 0.25) paceWarn = "Losing slower than a typical cut pace (~0.5–1 lb/wk). The deficit may need a nudge.";
  }
  return {ok:true, etaWeeks, wkLo, wkHi, rangeTxt, paceWarn, etaDs, etaDate, rateWk:st.rateWk, toGo};
}
/* Rate in display units with the sign trap avoided: explicit "−" for negatives. */
const fmtRate = v => (v>=0?"+":"−")+wDisp(Math.abs(v)).toFixed(1);
/* ======== compound insights: each returns {key, conf, title, copy, ev} ======== */
function insightAdherenceVsTrend(){
  const key = "adh";
  const a = adherenceStats();
  const st = trendState();
  const wu = wUnit();
  if(st.conf==="sparse")
    return {key, conf:"partial", title:"The trend needs a few more weigh-ins",
      copy:"Daily weight swings 1-2%, so 2-3 weeks of weigh-ins reveals the real trend. Log a few more and this fills in.",
      ev:"The weight-trend math needs 4+ weigh-ins over 14+ days (same gates as the Calorie Check). Right now: "+st.n+" weigh-ins."};
  if(a.n<7)
    return {key, conf:"partial", title:"Not enough logged days to read the trend",
      copy:a.n+" of the last 14 days have food logged. The weight trend is solid, but there is not enough eating data to compare it against.",
      ev:"Adherence-trend comparisons need at least 7 logged food days out of 14. This is a logging gap, not a failure."};
  const lead = "Last 14 days: "+fmtRate(st.rateWk)+" "+wu+"/wk at "+a.pct+"% adherence";
  const detail = a.hit+" of "+a.n+" logged days hit calories within ±10% of goal and protein ≥90%";
  if(st.vsGoal==="toward" && a.pct>=70)
    return {key, conf:"solid", title:lead,
      copy:detail+". The scale is moving with your consistency — hold the target and re-check in 2-3 weeks.",
      ev:"Consistency lines up with the trend. Self-monitoring adherence is the strongest predictor of nutrition outcomes (Burke et al., J Am Diet Assoc 2011)."};
  if(a.pct>=70)
    return {key, conf:"solid", title:lead,
      copy:detail+", but the scale is not following. Worth a look at your target — the Calorie Check below has the math.",
      ev:"High adherence with a flat/away trend points at the target, not the effort: weigh-ins calibrate the formula, which is the roughest part of the math (±10-15%)."};
  return {key, conf:"partial", title:lead,
    copy:detail+". Too few consistent days to read the trend against your eating — this is a logging gap, not a failure.",
    ev:"With adherence under 70% the trend can't be attributed to the target or the effort. Tighter logging for 2 weeks would settle it."};
}
function insightProteinVsTrend(){
  const key = "pro";
  const pc = proteinConsistency(14);
  const st = trendState();
  const avg = rollingAvg("p",14);
  if(pc.pct===null || pc.nLogged<7 || !avg)
    return {key, conf:"partial", title:"Protein trend needs logged days",
      copy:"Log food for a week and this compares your protein consistency against the scale.",
      ev:"Protein-vs-trend needs a protein goal and 7+ logged food days in the last 14."};
  const avgPStr = Math.round(avg.avg)+"g/day avg";
  const maint = S.goals.maintenance>0 ? S.goals.maintenance : 0;
  const surplus = goalTotal()-maint;
  if(surplus>0 && st.conf==="solid"){
    if(pc.pct>=70 && st.dir==="up")
      return {key, conf:"solid", title:"Protein "+avgPStr+" — gains leaning quality",
        copy:"High protein and the scale is climbing: more of this gain is likely muscle, not just scale weight.",
        ev:"Muscle gains top out near 1.6 g/kg/day (Morton et al. 2018); pairing a surplus with high protein and training leans gains toward muscle (see the Muscle Gain estimate)."};
    if(pc.pct<50)
      return {key, conf:"solid", title:"Protein "+avgPStr+" — under target",
        copy:"Gaining on low protein leans the extra weight toward fat. Aim for 90% of your protein goal most days.",
        ev:"Protein under half your logged days while gaining: the surplus builds tissue, and without enough protein more of it is fat."};
  }
  if(surplus<=0 && st.dir==="down" && pc.pct<50)
    return {key, conf:"solid", title:"Protein low while losing",
      copy:"Low protein makes a deficit cost more muscle. Keep protein at 90% of goal while the scale drops.",
      ev:"Cutting without enough protein raises the muscle cost of each pound lost (Ruiz-Castellano et al., Nutrients 2021)."};
  return {key, conf:"partial", title:"Protein "+avgPStr+" · "+pc.pct+"% of goal days",
    copy:"Protein is steady; nothing about it argues with the scale right now.",
    ev:pc.hit+" of "+pc.nLogged+" logged days hit ≥90% of your "+S.goals.protein+"g protein goal."};
}
/* Today only — tiredLevel() is anchored to the current clock, so a historical
   tiredness series would not be valid. Pairs today's water fact with today's
   fatigue estimate, without claiming one caused the other. */
function insightWaterVsTired(){
  const t = dayTotals(todayStr());
  const lv = tiredLevel();
  const waterBit = t.waterRatio!==null ? "Water "+Math.round(t.waterRatio*100)+"% of target · " : "";
  return {key:"tired", conf:"solid",
    title: waterBit+"fatigue "+lv.level+"/5 ("+lv.label+")",
    copy: lv.why.length ? lv.why[0] : "Nothing moving the needle right now.",
    ev: (lv.why.length? lv.why.map(w=>"• "+w).join("<br>") : "• Nothing moving the needle right now.")+"<br><br>Rough estimates from your log, not medical verdicts — sleep, stress, and illness matter too, and the app can't see those."};
}
function insightTrainingWeek(){
  let sessions = 0;
  for(let i=0;i<7;i++) if(trainDay(addDays(todayStr(),-i)).done) sessions++;
  const todayDone = trainDay(todayStr()).done;
  return {key:"train", conf:"solid",
    title: sessions+" session"+(sessions===1?"":"s")+" in the last 7 days",
    copy: todayDone ? "Workout logged today — acute exercise reliably lifts perceived energy (Loy et al. 2013)." :
      (sessions===0 ? "Training log is empty — log a session and it shows up here." : "Sessions logged. Keep the streak going."),
    ev:"Training days come from your training log (done sessions in the last 7 days)."};
}
function insightSodiumVsBloat(){
  const avg = rollingAvg("sodium",7);
  const b = bloatScore();
  if(!avg || b.score===null) return null; /* row hidden: the diary hero already covers today's bloat */
  return {key:"bloat", conf:"solid",
    title:"Sodium averaging "+Math.round(avg.avg).toLocaleString()+"mg/day · bloat: "+b.label,
    copy: b.why.length ? b.why[0] : "Nothing bloating you today.",
    ev:"Today's bloat score: "+b.score+"/100 ("+b.label+"), predicted from sodium, fiber, sugar, meal size, water, and alcohol. In a randomized trial, high-sodium diets raised bloating risk 27% and high-fiber diets 41% (Peng et al., Am J Gastroenterol 2019)."};
}
/* ======== streaks: logging streak exists as streak(); goal + weigh-in streaks added ======== */
/* ============ 1-MONTH MILESTONE (research 2026-09-18) ============
   Suggests a weight goal one month out, anchored to the profile update date
   (S.goals.profile.updatedAt, stamped by commitGoalsInputs). The rate comes
   from HIS profile — not a fixed lean-bulk number: expected scale change from
   his actual daily surplus/deficit via 3,500 kcal/lb energy math (same as
   paintGainProj; Hall 2011 notes it overstates long-term change). Guardrails
   from research: gains above ~0.5%/wk are mostly fat, not muscle (Helms et al.
   2023, SMO); losses capped at 1.0%/wk to preserve muscle (Ruiz-Castellano et
   al., Nutrients 2021; Garthe et al., IJSNEM 2011). Cross-checks: McDonald
   beginner max ~2 lb muscle/month; Aragon beginner 1–1.5% BW/month.
   When the goal is reached or passed, the milestone rolls forward: the next
   month is predicted from the current weight at the same profile-derived rate. */
function suggestedMilestone(){
  const cur = curBodyWeight(); if(!(cur>0)) return null;
  const g = S.goals.weight;
  const ws = sortedWeights();
  const startW = ws.length ? ws[0].w : ((S.goals.profile||{}).weightLb>0 ? S.goals.profile.weightLb : cur);
  let dir = 0, passed = false;
  if(g>0){
    if(g>=startW && cur>=g) passed = true;        /* gain goal reached/passed */
    else if(g<startW && cur<=g) passed = true;     /* loss goal reached/passed */
    else dir = Math.sign(g-cur);
    if(passed) dir = g>=startW ? 1 : -1;          /* keep rolling the same direction */
  } else {
    dir = Math.sign(goalTotal()-((S.goals.maintenance>0)?S.goals.maintenance:goalTotal()));
  }
  if(dir===0) return null;
  const maint = S.goals.maintenance>0 ? S.goals.maintenance : 0;
  const gap = goalTotal()-maint; /* kcal/day: surplus (+) or deficit (−) */
  const MODE_LABEL = {lean:"Lean Bulk", bulk:"Bulk", maintain:"Maintain", custom:"Custom"};
  let lbWk, basis;
  if(dir>0){
    if(gap>0){ lbWk = gap*7/3500; basis = "surplus"; }
    else { lbWk = cur*0.004; basis = "guideline"; } /* no surplus configured: lean-bulk default */
    lbWk = Math.min(lbWk, cur*0.015); /* sanity cap: 1.5%/wk */
  } else {
    if(gap<0){ lbWk = Math.abs(gap)*7/3500; basis = "deficit"; }
    else { lbWk = cur*0.007; basis = "guideline"; }
    lbWk = Math.min(lbWk, cur*0.01); /* evidence cap: 1.0%/wk */
  }
  const pctWk = lbWk/cur*100;
  const delta = dir*lbWk*(30/7);
  let target = Math.round((cur+delta)*2)/2;
  if(!passed && g>0){ target = dir>0 ? Math.min(target,g) : Math.max(target,g); }
  if(target===cur || (!passed && g>0 && Math.abs(target-g)<0.01)) return null;
  const base = passed ? todayStr() : ((S.goals.profile||{}).updatedAt || todayStr());
  const dt = new Date(base+"T12:00:00"); dt.setDate(dt.getDate()+30);
  return {target, dateStr: dt.toLocaleDateString(undefined,{month:"short",day:"numeric"}),
          lbWk, pctWk, dir, gap, basis, modeName: MODE_LABEL[S.goals.mode]||"Custom", passed};
}
let MS_EV = ""; /* milestone evidence text, shown in the ⓘ sheet */
function milestoneHtml(ms){
  const wu = wUnit(), d1 = v => wDisp(v).toFixed(1);
  const sgn = ms.dir>0 ? "+" : "−";
  let ev;
  if(ms.basis==="surplus"){
    const pct = S.goals.maintenance>0 ? Math.round(ms.gap/S.goals.maintenance*100) : 0;
    ev = `Based on your ${ms.modeName} (+${pct}% ≈ +${Math.round(ms.gap).toLocaleString()} kcal/day) — ≈${sgn}${d1(ms.lbWk)} ${wu}/week (${ms.pctWk.toFixed(2)}% of body weight) by energy math (3,500 kcal/lb — a first-week heuristic that overstates over time, Hall 2011). `+
      (ms.pctWk>0.5
        ? `That's faster than the 0.25–0.5%/week lean-gain guideline — the extra is mostly fat, not muscle (Helms et al., Sports Med Open 2023).`
        : `Inside the 0.25–0.5%/week lean-gain guideline (MASS / Helms consensus); beginners max out around 2 lb of muscle a month (McDonald; Aragon: 1–1.5% BW/month).`);
  } else if(ms.basis==="deficit"){
    ev = `Based on your ${Math.round(Math.abs(ms.gap)).toLocaleString()} kcal/day deficit — ≈${sgn}${d1(ms.lbWk)} ${wu}/week (${ms.pctWk.toFixed(2)}% of body weight). `+
      (ms.pctWk>=0.99 ? `Capped at 1.0%/week — faster losses cost muscle (Ruiz-Castellano et al., Nutrients 2021; Garthe et al., IJSNEM 2011).`
                      : `Inside the 0.5–1.0%/week range that best preserves muscle while cutting (Ruiz-Castellano et al., Nutrients 2021).`);
  } else if(ms.dir>0){
    ev = `No surplus configured — paced at +${d1(ms.lbWk)} ${wu}/week (~0.4% of bodyweight), the lean-bulk guideline from the evidence-based coaching consensus (MASS / Helms / Henselmans). Set your surplus in Goals › Calorie goal and this follows it.`;
  } else {
    ev = `No deficit configured — paced at −${d1(ms.lbWk)} ${wu}/week (~0.7% of bodyweight), the range that best preserves muscle while cutting (Ruiz-Castellano et al., Nutrients 2021).`;
  }
  MS_EV = ev+` Early weeks read high — that's glycogen and water, not tissue. Judge the 4-week trend, not week 1.`;
  return `<div class="msugg"><div class="msrow"><div><b>${ms.passed?"Goal reached — next milestone":"Suggested 1-month milestone"}</b><span>${d1(ms.target)} ${wu} by ${ms.dateStr} — ${ms.passed?"one month from today, rolling forward":"one month from your profile update"}</span></div><div style="display:flex;gap:10px;align-items:center;flex:none"><button class="ginfo" id="msInfo" aria-label="How this milestone is estimated">i</button><button class="chip" id="msUse">Use as goal</button></div></div></div>`;
}
function paintWtGoal(){
  const val = document.getElementById("wtGoalVal"), box = document.getElementById("wtGoalProg");
  const g = S.goals.weight, wu = wUnit();
  const d1 = v => wDisp(v).toFixed(1); /* display magnitude in current units */
  val.textContent = g>0 ? d1(g)+" "+wu : "Set goal";
  const cur = curBodyWeight();
  const ms = suggestedMilestone(), msHtml = ms ? milestoneHtml(ms) : "";
  const wireMs = ()=>{
    const b = document.getElementById("msUse");
    if(b && ms) b.onclick = ()=>{ S.goals.weightStart = cur; S.goals.weight = ms.target; save(); renderProgress(); };
    const mi = document.getElementById("msInfo");
    if(mi) mi.onclick = ()=>openInfo("milestone");
  };
  if(!(g>0)){ box.innerHTML = `<div class="rangenote">Set a target weight — this tracks progress and estimates your pace from weigh-ins.</div>`+msHtml; wireMs(); return; }
  if(!(cur>0)){ box.innerHTML = `<div class="rangenote">Log your weight below to start tracking progress toward ${d1(g)} ${wu}.</div>`+msHtml; wireMs(); return; }
  const ws = sortedWeights(), start = (S.goals.weightStart>0) ? S.goals.weightStart : (ws.length ? ws[0].w : cur);
  const toGo = g - cur;
  const done = toGo===0 ? "At goal" : toGo>0 ? d1(toGo)+" "+wu+" to go" : d1(Math.abs(toGo))+" "+wu+" above goal";
  const pct = g===start ? 100 : Math.min(100, Math.max(0,(cur-start)/(g-start)*100));
  const tr = weightTrend();
  const f1 = v => (v>=0?"+":"")+d1(v);
  let eta = "";
  if(tr && tr.rateWk!=null && Math.abs(tr.rateWk)>=0.05){
    if(toGo>0 && tr.rateWk>0) eta = ` · ≈${Math.ceil(toGo/tr.rateWk)} wk at ${f1(tr.rateWk)} ${wu}/wk`;
    else if(toGo<0 && tr.rateWk<0) eta = ` · ≈${Math.ceil(Math.abs(toGo)/Math.abs(tr.rateWk))} wk at ${f1(tr.rateWk)} ${wu}/wk`;
    else eta = ` · trending ${f1(tr.rateWk)} ${wu}/wk (away from goal)`;
  }
  const justStarted = ws.length <= 1;
  box.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:13px"><b>${done}</b><span style="color:var(--muted)">${pct.toFixed(0)}%</span></div>`+
    `<div class="wgoalbar"><i style="width:${pct.toFixed(1)}%"></i></div>`+
    (toGo===0 ? `<div class="rangenote" style="margin-top:6px">Goal reached — set a new one to keep going.</div>`
              : `<div class="rangenote" style="margin-top:6px">${justStarted ? "Starting point set — log weigh-ins and this bar tracks your run." : "Pace from your weigh-ins"+eta+". <button class=\"linkbtn\" id=\"paceWhy\">Why it jumps around</button>"}</div>`)+msHtml;
  wireMs();
  const pw = document.getElementById("paceWhy");
  if(pw) pw.onclick = ()=>openInfo("wtgoal");
}
/* ================= ANALYTICS ENGINE — BODY METRICS =================
   Research sources (2026 refresh): BMI WHO 2006 cutoffs (screening, not diagnosis —
   cannot separate muscle from fat); waist-to-height ratio NICE NG246 2022
   (<0.5 lower, 0.5-0.59 increased, 0.6+ high central-adiposity risk). */
let BMI_CTX = ""; /* full BMI explainer, shown in the ⓘ sheet */
function paintWtAnalysis(){
  const p = S.goals.profile||{}, hIn = p.heightIn>0 ? p.heightIn : 0, w = curBodyWeight();  const bv = document.getElementById("bmiVal"), pill = document.getElementById("bmiPill"),
        mark = document.getElementById("bmiMark"), note = document.getElementById("bmiNote"),
        stats = document.getElementById("wtStats"), ctx = document.getElementById("wtContext");
  if(!(w>0) || !(hIn>0)){
    bv.textContent = "—"; pill.style.display = "none"; mark.style.display = "none";
    const needH = !(hIn>0), needW = !(w>0);
    note.innerHTML = (needH && needW)
      ? `Log your weight below and add your height in <button class="linkbtn bmi-go-prof">Goals › Profile</button> for BMI, a healthy range, and rate stats.`
      : needH
      ? `Add your height in <button class="linkbtn bmi-go-prof">Goals › Profile</button> for BMI and your healthy weight range.`
      : `Log your weight below for BMI and rate stats.`;
    const go = note.querySelector(".bmi-go-prof");
    if(go) go.onclick = ()=>{ commitGoalsInputs(); save(); renderGoals(); showView("goals"); };
    stats.innerHTML = ""; ctx.textContent = ""; ctx.style.display = "none"; BMI_CTX = "";
    return;
  }
  const bmi = w/(hIn*hIn)*703;
  const cat = bmi<18.5 ? ["Underweight","#2f9df0","#e8f3fe"] : bmi<25 ? ["Healthy","#1e9e5a","#e6f6ec"] : bmi<30 ? ["Overweight","#d98a12","#fdf3e2"] : ["Obese","#e5484d","#fdecec"];
  bv.textContent = bmi.toFixed(1);
  pill.style.display = ""; pill.textContent = cat[0]; pill.style.color = cat[1]; pill.style.background = cat[2];
  mark.style.display = ""; mark.style.left = Math.min(100,Math.max(0,(bmi-14)/20*100)).toFixed(1)+"%";
  const m = hIn*0.0254, lo = 18.5*m*m*2.20462, hi = 24.9*m*m*2.20462;
  const ht = Math.floor(hIn/12)+"'"+Math.round(hIn%12)+'"';
  const g = S.goals.weight;
  const wu3 = wUnit();
  note.textContent = `Healthy range for ${ht}: ${Math.round(wDisp(lo))}–${Math.round(wDisp(hi))} ${wu3} (WHO BMI 18.5–24.9).` +
    (g>0 ? (g>=lo-0.5 && g<=hi+0.5 ? ` Your ${wDisp(g)} ${wu3} goal sits inside it.` : ` Your ${wDisp(g)} ${wu3} goal is outside it — worth a second look.`) : "");
  const tr = weightTrend(), wu2 = wUnit();
  const f1 = v => (v>=0?"+":"")+wDisp(v).toFixed(1);
  stats.innerHTML = tr ? [
      [tr.daily==null?"—":f1(tr.daily)+" "+wu2,"Daily rate"],
      [f1(tr.change)+" "+wu2,"Change · "+tr.spanD+"d"],
      [wDisp(tr.hi).toFixed(1)+" "+wu2,"Highest"],
      [wDisp(tr.lo).toFixed(1)+" "+wu2,"Lowest"]
    ].map(x=>`<div class="stat2"><b>${x[0]}</b><span>${x[1]}</span></div>`).join("")
    : `<div class="stat2"><b>—</b><span>Log 2+ weigh-ins for rate stats</span></div>`;
  let c;
  if(bmi<18.5) c = "Under 18.5 is classified as underweight (WHO/CDC). BMI can't tell muscle from fat — as you train, judge the scale alongside strength and photos. A 5–20% calorie surplus with 1.6–2.2 g/kg protein is the research-backed way to gain.";
  else if(bmi<25) c = "BMI is in the healthy range (WHO/CDC 18.5–24.9). It still can't separate muscle from fat — lifters often read higher than their body-fat % suggests.";
  else if(bmi<30) c = "BMI 25–29.9 is classified as overweight (WHO/CDC). For lifters this often overstates fat — waist and body-fat % tell the truer story.";
  else c = "BMI 30+ is classified as obese (WHO/CDC). BMI is a screening tool, not a diagnosis — body-fat % and waist give the fuller picture.";
  BMI_CTX = c; ctx.style.display = "none"; ctx.textContent = ""; /* explainer lives in the ⓘ sheet */
  /* Waist-to-height ratio (NICE 2022): <0.5 lower central-adiposity risk, 0.5-0.59 increased, 0.6+ high. Needs waist + height in Goals › Profile. */
  const wn = document.getElementById("whtrNote"), waist = (S.goals.profile||{}).waistIn>0 ? S.goals.profile.waistIn : 0;
  if(waist>0 && hIn>0){
    const r = waist/hIn, zone = r<0.5 ? "lower central-adiposity risk" : r<0.6 ? "increased central-adiposity risk" : "high central-adiposity risk";
    wn.style.display = ""; wn.textContent = "Waist-to-height ratio "+r.toFixed(2)+" ("+zone+", NICE 2022 — keep waist under half your height).";
  } else { wn.style.display = "none"; wn.textContent = ""; }
}
function paintCalCheck(){
  const out = document.getElementById("calCheckOut"), wrap = document.getElementById("calCheckApply"), btn = document.getElementById("calApplyBtn");
  wrap.style.display = "none";
  const vs = document.getElementById("calCheckVerdict");
  const setV = t => { if(vs) vs.textContent = t; };
  const ws = (S.weights||[]).slice().sort((a,b)=>a.d<b.d?-1:1);
  if(ws.length < 4){ out.textContent = "Log your weight for 2+ weeks (at least 4 weigh-ins) and this compares your real rate of gain against your target."; setV("Needs data"); return; }
  const T = p => new Date(p.d+"T12:00:00").getTime();
  const spanD = Math.round((T(ws[ws.length-1])-T(ws[0]))/86400000);
  if(spanD < 14){ out.textContent = "Need weigh-ins spanning 2+ weeks ("+spanD+"d so far). Daily weight swings ±1–2%, so 2–3 weeks reveals the real trend."; setV("Needs data"); return; }
  /* Split the span into halves by date (not by count) so the two windows never overlap. */
  const mid = (T(ws[0])+T(ws[ws.length-1]))/2;
  const early = ws.filter(p=>T(p)<=mid), recent = ws.filter(p=>T(p)>mid);
  if(early.length<2 || recent.length<2){ out.textContent = "Log a couple more weigh-ins spread across the 2 weeks so both halves have data."; setV("Needs data"); return; }
  const avgW = a => a.reduce((x,p)=>x+p.w,0)/a.length;
  const avgT = a => a.reduce((x,p)=>x+T(p),0)/a.length;
  const wAvg = (avgW(early)+avgW(recent))/2;
  const rate = (avgW(recent)-avgW(early))/((avgT(recent)-avgT(early))/86400000)*7, pct = rate/wAvg*100;
  const bd = targetRateBand();
  const wu = wUnit();
  const f2 = v => (v>=0?"+":"")+v.toFixed(2);
  const f2w = v => (v>=0?"+":"−")+wDisp(Math.abs(v)).toFixed(2); /* weight rate in display units */
  let msg = "Actual: "+f2w(rate)+" "+wu+"/wk ("+f2(pct)+"%/wk). Target: "+bd[0].toFixed(2)+" to "+bd[1].toFixed(2)+"%/wk. ";
  let suggest = 0;
  if(pct < bd[0]-0.05) suggest = 150;
  else if(pct > bd[1]+0.05) suggest = -150;
  const lastT = S.goals.lastAutoTune;
  const sinceT = lastT ? Math.round((new Date(todayStr()+"T12:00:00")-new Date(lastT+"T12:00:00"))/86400000) : 999;
  /* Don't chase a missed goal: weight lagging while complete days average under
     90% of the calorie goal means the food — not the target — is the problem. */
  const goal = goalTotal(), avgC = avgCompleteIntake();
  const underAte = suggest>0 && goal>0 && avgC!=null && avgC < 0.9*goal;
  if(!suggest){
    msg += "On target — hold steady and re-check in 2–3 weeks.";
  } else if(underAte){
    msg += "Below target — but your complete days average "+Math.round(avgC).toLocaleString()+" kcal, under 90% of your "+Math.round(goal).toLocaleString()+" kcal goal. Hit the goal first; raising the target won't help until the food is actually eaten.";
  } else if(sinceT < 21){
    msg += (suggest>0?"Below target. ":"Above target. ")+"Maintenance was tuned on "+lastT+" — give it 2–3 weeks before changing again.";
  } else {
    msg += suggest>0 ? "Below target — consider +100–150 kcal/day." : "Above target — consider −100–150 kcal/day.";
    msg += " Give any change 2–3 weeks before judging it.";
  }
  out.textContent = msg;
  setV(!suggest ? "On target" : (suggest>0 ? "Below target" : "Above target"));
  if(suggest && sinceT >= 21 && !underAte){
    wrap.style.display = "";
    btn.textContent = "Apply "+(suggest>0?"+":"−")+Math.abs(suggest)+" kcal/day";
    btn.onclick = ()=>{
      /* 2026.10.21-e (audit): this Apply could never stick — in rate/% modes the next
         commitGoals() re-derived the surplus and silently reverted it, and lastAutoTune
         was never written, so the 21-day cooldown above was dead. Now: switch to a
         custom surplus (same "custom" mode switch as before, plus surplusMode), clamp
         at 0, and stamp the tune date the cooldown reads. */
      const eff = Math.max(0, Math.round((S.goals.surplus||0) + suggest));
      const applied = eff - (S.goals.surplus||0);
      S.goals.surplus = eff;
      S.goals.mode = "custom";
      S.goals.surplusMode = "custom";
      S.goals.lastAutoTune = todayStr();
      autoDeriveMacros();
      S.goals.autoNote = "Calibration "+todayStr()+": surplus "+(applied>=0?"+":"−")+Math.abs(applied)+" kcal based on your weight trend."+(applied!==suggest ? " (Floored at 0 — a surplus can't go negative.)" : "");
      save(); renderGoals(); renderProgress(); renderDiary(); paintCalCheck();
    };
  }
}
/* ================= ANALYTICS ENGINE — WEIGHT CHART =================
   Research sources (2026 graph-UX review: Happy Scale, Libra, MacroFactor, Withings):
   - raw weigh-ins as dots + the trend line over them; x-axis linear in time
     (gaps stay gaps, never compressed)
   - y-domain padded and always including the goal — never truncated to daily
     noise (Correll et al. 2019); goal as a dashed, labeled line, never styled
     like a data series
   - line segments + dots are color-coded by distance from the weight goal
     (Jay's request, 2026.09.22): green <=1 lb, yellow <=3 lb, red <=6 lb,
     dark red beyond; straight segments so dense weigh-ins can't loop the
     way the old Catmull-Rom smoothing did
   - inline SVG (<1k points/year is deep in SVG's comfort zone; crisp on retina) */
/* Research-backed weight analytics (2026.10.11-f):
   - EWMA trend (alpha=0.15, ~12-day effective window) beats simple moving averages:
     less lag, handles missing days by carrying forward, no fabricated points.
   - Outlier rejection: discard weigh-ins >6.6 lb from neighbor median (typos/unit errors).
   - Only complete days feed the TDEE math; partial days are "unknown", never zero. */
function ewmaTrend(ws, alpha){
  alpha = alpha || 0.15;
  if(!ws.length) return [];
  var pts = ws.slice().sort(function(a,b){ return a.d<b.d?-1:1; });
  /* neighbor-median outlier filter */
  var clean = pts.filter(function(p, i){
    var nb = [];
    if(i>0) nb.push(pts[i-1].w);
    if(i<pts.length-1) nb.push(pts[i+1].w);
    if(!nb.length) return true;
    nb.sort(function(a,b){ return a-b; });
    var med = nb[Math.floor(nb.length/2)];
    return Math.abs(p.w - med) <= 6.6;
  });
  if(!clean.length) return [];
  var out = [], trend = clean[0].w;
  var prevD = null;
  clean.forEach(function(p){
    /* carry trend forward across gaps (no fabricated weights) */
    trend = alpha*p.w + (1-alpha)*trend;
    out.push({d:p.d, w:trend, n:1, raw:p.w});
    prevD = p.d;
  });
  return out;
}
function trendMA(ws){
  /* 7-day trailing moving average ("trend weight"): each point averages the
     weigh-ins in its trailing 7 days. n = points in the window. */
  const T = p => new Date(p.d+"T12:00:00").getTime();
  return ws.map(p=>{
    const t = T(p), win = ws.filter(q=>{ const qt=T(q); return qt<=t && qt>t-7*86400000; });
    return {d:p.d, w:win.reduce((a,q)=>a+q.w,0)/win.length, n:win.length};
  });
}
let wRange = 90; /* chart range in days; 0 = all */
let wScrollEnd = false; /* when true, the All chart starts scrolled to the newest end */
function halvesRate(pts){
  /* Weekly rate via halves-by-date split (MacroFactor convention): the time window
     is cut in half and the mean of each half is compared, so the two windows never
     overlap. Points are {d:"YYYY-MM-DD", w:lb} — raw weigh-ins or trend-MA points. */
  if(pts.length<2) return null;
  const T = p => new Date(p.d+"T12:00:00").getTime();
  const mid = (T(pts[0])+T(pts[pts.length-1]))/2;
  const early = pts.filter(p=>T(p)<=mid), recent = pts.filter(p=>T(p)>mid);
  if(!early.length || !recent.length) return null;
  const avgW = a=>a.reduce((x,p)=>x+p.w,0)/a.length, avgT = a=>a.reduce((x,p)=>x+T(p),0)/a.length;
  const dDays = Math.max(1,(avgT(recent)-avgT(early))/86400000);
  return (avgW(recent)-avgW(early))/dDays*7;
}
function wRangeStats(pts){
  /* display stats for the visible chart range: rate via shared halvesRate, rest raw */
  if(pts.length<2) return {rateWk:null, change:0, hi:pts.length?pts[0].w:0, lo:pts.length?pts[0].w:0};
  const vals = pts.map(p=>p.w);
  return {rateWk: halvesRate(pts), change: pts[pts.length-1].w-pts[0].w, hi: Math.max(...vals), lo: Math.min(...vals)};
}
/* ============ AM/PM WEIGHT SETS (2026.10.18-e, Jay's ask) ============
   Night weights live in S.pmWeights, a SEPARATE series: they never enter
   S.weights, so the trend, the chart's trend line and the learned estimator
   stay morning-only by construction. A night weight's only jobs: pair with
   its morning (what the day added), pair with the NEXT morning (the
   overnight float), and flag a low night while the day can still be fixed. */
function pmSorted(){ return (S.pmWeights||[]).slice().sort((a,b)=>a.d<b.d?-1:1); }
function wtSetStats(){
  const am = {}; sortedWeights().forEach(p=>{ am[p.d]=p.w; });
  const pm = pmSorted();
  const deltas = [], floats = [];
  pm.forEach(p=>{
    if(am[p.d]!=null) deltas.push({d:p.d, v:p.w-am[p.d]});
    const nx = addDays(p.d,1);
    if(am[nx]!=null) floats.push({d:p.d, v:am[nx]-p.w});
  });
  const med = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y), m=Math.floor(s.length/2); return s.length%2 ? s[m] : (s[m-1]+s[m])/2; };
  const last14 = a => a.slice(-14);
  return { pm, am, deltas, floats,
    medDelta: med(last14(deltas).map(x=>x.v)),
    medFloat: med(last14(floats).map(x=>x.v)),
    medPM: med(last14(pm).map(p=>p.w)) };
}
function paintWtSets(){
  const box = document.getElementById("wtSets"); if(!box) return;
  const wu = wUnit(), st = wtSetStats();
  const f1 = v => wDisp(v).toFixed(1);
  const sgn = v => (v>0?"+":v<0?"\u2212":"")+f1(Math.abs(v));
  const dLbl = d => new Date(d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
  if(!st.pm.length){
    box.innerHTML = '<div class="rangenote">Log a <b>night</b> weight before bed (switch the log above to Night) and Fuel pairs it with your morning weigh-in: what the day added, what the night took off. Night weights never touch your trend or your daily number.</div>';
    return;
  }
  const last = st.pm[st.pm.length-1];
  let lines = "";
  if(st.am[last.d]!=null) lines += `<div class="rangenote">${dLbl(last.d)}: <b>${f1(st.am[last.d])} ${wu}</b> morning \u2192 <b>${f1(last.w)} ${wu}</b> night (${sgn(last.w-st.am[last.d])})</div>`;
  else lines += `<div class="rangenote">${dLbl(last.d)}: night <b>${f1(last.w)} ${wu}</b> (no morning weigh-in that day)</div>`;
  const fl = st.floats.filter(x=>x.d===last.d)[0];
  if(fl) lines += `<div class="rangenote">Overnight: ${sgn(fl.v)} \u2192 woke at <b>${f1(st.am[addDays(last.d,1)])} ${wu}</b></div>`;
  if(st.deltas.length>=3 || st.floats.length>=3){
    const parts = [];
    if(st.medDelta!=null) parts.push(sgn(st.medDelta)+" by night");
    if(st.medFloat!=null) parts.push(sgn(st.medFloat)+" overnight");
    lines += `<div class="rangenote">Your usual set (${Math.max(st.deltas.length, st.floats.length)} nights paired): ${parts.join(" \u00b7 ")}</div>`;
  }
  /* the low-night flag: tonight vs his own usual night; a prediction only
     once 3+ overnight floats are on file to calibrate it */
  if(last.d===todayStr() && st.pm.length>=5 && st.medPM!=null && last.w <= st.medPM-1.5){
    let msg = "Low night for you \u2014 your nights usually end around "+f1(st.medPM)+" "+wu+".";
    if(st.floats.length>=3 && st.medFloat!=null) msg += " With your usual overnight drop, tomorrow will likely read ~"+f1(last.w+st.medFloat)+" "+wu+".";
    msg += " A shake or some milk before bed can still move it.";
    lines += `<div class="rangenote" style="color:var(--ink); font-weight:600">${msg}</div>`;
  }
  box.innerHTML = lines;
}
function paintWeightChart(w){
  const svg = document.getElementById("weightChart"), wu = wUnit();
  const tiles = document.getElementById("wStatTiles");
  const ws = w.slice().sort((a,b)=>a.d<b.d?-1:1);
  const T = p => new Date(p.d+"T12:00:00").getTime();
  const f1 = v => wDisp(v).toFixed(1);
  if(ws.length===0){
    svg.innerHTML = `<text x="170" y="100" text-anchor="middle" fill="#9a9aa5" font-size="13">Log weight to see your trend</text>`;
    svg.setAttribute("aria-label","Weight chart: no weigh-ins yet");
    if(tiles) tiles.style.display = "none";
    return;
  }
  const pmAll = pmSorted();
  const tEnd = Math.max(T(ws[ws.length-1]), pmAll.length ? T(pmAll[pmAll.length-1]) : 0);
  const tStart = wRange>0 ? tEnd-wRange*86400000 : T(ws[0])-2*86400000;
  const pts = ws.filter(p=>T(p)>=tStart);
  const pmPts = pmAll.filter(p=>T(p)>=tStart && T(p)<=tEnd);
  /* flag: his set goal, else the auto milestone predicted from his data */
  let flag = null;
  if(S.goals.weight>0) flag = {v:S.goals.weight, auto:false};
  else { const ms = suggestedMilestone(); if(ms) flag = {v:ms.target, auto:true}; }
  const vals = pts.map(p=>p.w).concat(pmPts.map(p=>p.w));
  let mn = Math.min(...vals), mx = Math.max(...vals);
  if(flag){ mn = Math.min(mn,flag.v); mx = Math.max(mx,flag.v); }
  if(mx-mn<0.5){ mn-=0.5; mx+=0.5; }
  const pad = (mx-mn)*0.18; mn-=pad; mx+=pad;
  const H=200, PL=10, PR=44, PT=20, PB=24;
  /* All range: a wide time-linear canvas that scrolls horizontally (like Motion's
     savings graph) instead of squishing months into 340px */
  const allMode = wRange===0;
  const W = allMode ? Math.max(560, Math.round((tEnd-tStart)/86400000*4)+PL+PR) : 340;
  const X = t => PL + (t-tStart)/Math.max(1,(tEnd-tStart))*(W-PL-PR);
  const Y = v => PT + (1-(v-mn)/Math.max(0.001,(mx-mn)))*(H-PT-PB);
  const dFmtS = t => new Date(t).toLocaleDateString(undefined,{month:"short",day:"numeric"});
  let s = "";
  /* y gridlines + right-side labels */
  for(let i=0;i<=3;i++){
    const v = mn+(mx-mn)*i/3, y = Y(v);
    s += `<line x1="${PL}" y1="${y.toFixed(1)}" x2="${W-PR+6}" y2="${y.toFixed(1)}" stroke="#eeeef3" stroke-width="1"/>`+
         `<text x="${W-2}" y="${(y+3.5).toFixed(1)}" text-anchor="end" fill="#9a9aa5" font-size="10">${f1(v)}</text>`;
  }
  /* x labels: month starts for long spans, day ticks for short ones.
     Crowded labels are thinned first, then a pixel-distance pass guarantees no two
     printed labels sit within 38px of each other (the later label wins). */
  const spanD = (tEnd-tStart)/86400000, plotW = W-PL-PR;
  let xticks = [];
  if(spanD>62){ const d = new Date(tStart); d.setDate(1); d.setHours(12,0,0,0);
    if(d.getTime()<tStart) d.setMonth(d.getMonth()+1);
    while(d.getTime()<=tEnd){ xticks.push({t:d.getTime(), l:d.toLocaleDateString(undefined,{month:"short"})}); d.setMonth(d.getMonth()+1); }
    const maxN = Math.max(2, Math.floor(plotW/46));
    if(xticks.length>maxN){ const keep = Math.ceil(xticks.length/maxN); xticks = xticks.filter((_,i)=>i%keep===0); }
  } else {
    const step = Math.max(1, Math.ceil(spanD/3));
    const d0 = new Date(tStart); d0.setHours(12,0,0,0);
    for(let t=d0.getTime(); t<=tEnd; t+=step*86400000) xticks.push({t, l:dFmtS(t)});
    if(!xticks.length || xticks[xticks.length-1].t<tEnd-12*3600000) xticks.push({t:tEnd, l:dFmtS(tEnd)});
  }
  const kept = [];
  xticks.forEach(x=>{
    const xa = Math.min(Math.max(X(x.t), PL+22), W-PR-22);
    const prev = kept[kept.length-1];
    if(prev && x.l===prev.l) return;                    /* never print the same label twice */
    if(prev && xa-prev.xa<38) kept[kept.length-1] = {l:x.l, xa};  /* too close: later wins */
    else kept.push({l:x.l, xa});
  });
  kept.forEach(k=>{ s += `<text x="${k.xa.toFixed(1)}" y="${H-6}" text-anchor="middle" fill="#9a9aa5" font-size="10">${k.l}</text>`; });
  /* goal: one quiet dashed reference line — the trend is the headline */
  if(flag){
    const gy = Y(flag.v);
    s += `<line x1="${PL}" y1="${gy.toFixed(1)}" x2="${W-PR+6}" y2="${gy.toFixed(1)}" stroke="#c9c9d4" stroke-width="1.5" stroke-dasharray="6,5"/>`+
      `<text x="${PL+6}" y="${(gy-5).toFixed(1)}" fill="#9a9aa5" font-size="10" font-weight="700">goal ${f1(flag.v)}${wu}</text>`;
  }
  /* Water-weight context (2026.10.18-c, Jay's ask): one small dot per weigh-in,
     styled by what he ate the day BEFORE it — solid = fed day (near goal,
     glycogen + water aboard), hollow = light day. Muted on purpose: the
     trend line stays the headline, per the 2026.09.22 simplification.
     Needs a goal on file; without one, no dots and no legend. */
  const gt = goalTotal();
  let dotsDrawn = false;
  if(pts.length>=2 && gt>0){
    pts.forEach(p=>{
      const prev = dayTotals(addDays(p.d,-1));
      const fr = prev.foodLogged ? prev.cal/gt : -1;
      const cx = X(T(p)).toFixed(1), cy = Y(p.w).toFixed(1);
      if(fr>=0.85){ s += `<circle cx="${cx}" cy="${cy}" r="3.2" fill="${THEME.acc}"/>`; dotsDrawn = true; }
      else if(fr>=0 && fr<=0.60){ s += `<circle cx="${cx}" cy="${cy}" r="3.2" fill="#fff" stroke="#a9a9ba" stroke-width="1.4"/>`; dotsDrawn = true; }
      else { s += `<circle cx="${cx}" cy="${cy}" r="2.6" fill="${THEME.acc}" opacity="0.30"/>`; }
    });
  }
  /* night weights (2026.10.18-e): faint slate dots, no line — context only,
     drawn under the trend line so the morning trend stays the headline. */
  let pmDrawn = false;
  pmPts.forEach(p=>{
    s += `<circle cx="${X(T(p)).toFixed(1)}" cy="${Y(p.w).toFixed(1)}" r="2.8" fill="#8383a8" opacity="0.55"/>`;
    pmDrawn = true;
  });
  const ma = trendMA(pts);
  const mxy = ma.map((m,i)=>[X(T(pts[i])), Y(m.w)]);
  /* one clean trend line in the app theme with a soft fill beneath it.
     Straight segments — the old Catmull-Rom spline looped over itself on dense
     weigh-ins (e.g. 2026-03-26..29), which read as a broken line.
     (2026.09.22: simplified per Jay — raw dots, milestone lines and the
     goal-proximity segment colors were too much; the goal panel below the
     chart carries the "to go" status now.) */
  if(mxy.length>=2){
    const straight = "M"+mxy.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join("L");
    s += `<path d="${straight}L${mxy[mxy.length-1][0].toFixed(1)},${H-PB}L${mxy[0][0].toFixed(1)},${H-PB}Z" fill="${THEME.acc}" opacity="0.08"/>`;
    s += `<path d="${straight}" fill="none" stroke="${THEME.acc}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    const ept = mxy[mxy.length-1];
    s += `<circle cx="${ept[0].toFixed(1)}" cy="${ept[1].toFixed(1)}" r="4.5" fill="${THEME.acc}" stroke="#fff" stroke-width="1.5"/>`;
  } else if(mxy.length===1){
    s += `<circle cx="${mxy[0][0].toFixed(1)}" cy="${mxy[0][1].toFixed(1)}" r="4.5" fill="${THEME.acc}" stroke="#fff" stroke-width="1.5"/>`+
      `<text x="${mxy[0][0].toFixed(1)}" y="${(mxy[0][1]-12).toFixed(1)}" text-anchor="middle" fill="${THEME.acc}" font-size="11" font-weight="700">${f1(pts[0].w)}${wu}</text>`;
  }
  svg.innerHTML = s;
  svg.setAttribute("role","img");
  /* All mode renders on the wide canvas; other ranges keep the fluid 340 layout */
  if(allMode){ svg.setAttribute("width", W); svg.setAttribute("viewBox", `0 0 ${W} 200`); }
  else { svg.setAttribute("width", "100%"); svg.setAttribute("viewBox", "0 0 340 200"); }
  const wsc = document.getElementById("wChartScroll");
  if(wsc && allMode && wScrollEnd){ wsc.scrollLeft = wsc.scrollWidth; wScrollEnd = false; }
  const wlg = document.getElementById("wGoalLegend");
  if(wlg){ /* legend slot carries the dot keys (2026.10.18-c, night dots -e) */
    const parts = [];
    if(dotsDrawn) parts.push('<span><i class="wlg-dot fed"></i>fed day before</span><span><i class="wlg-dot light"></i>light day before</span><span>water weight shows up in the dots first</span>');
    if(pmDrawn) parts.push('<span><i class="wlg-dot night"></i>night weight</span>');
    if(parts.length){ wlg.innerHTML = parts.join(""); wlg.style.display = ""; }
    else wlg.style.display = "none";
  }
  svg.setAttribute("aria-label",`Weight chart: ${pts.length} weigh-ins, ${dFmtS(tStart)} to ${dFmtS(tEnd)}`+(flag?`, ${flag.auto?"auto milestone":"goal"} ${f1(flag.v)} ${wu}`:""));
  /* pace line under the chart: range rate + change. Records (high/low/avg)
     live in the Stats view — the chart stays a clean daily glance. The goal
     projection is hidden when the trend is flat or moving away from the goal. */
  const wtp = document.getElementById("wTrendPace");
  if(wtp){
    if(pts.length>=2){
      const st = wRangeStats(pts);
      const sgn = v => (v>0?"+":v<0?"\u2212":"")+f1(Math.abs(v));
      let phtml = `Pace: <b>${st.rateWk==null?"\u2014":sgn(st.rateWk)+" "+wu+"/wk"}</b>`;
      wtp.innerHTML = phtml; wtp.style.display = "";
    } else { wtp.style.display = "none"; }
  }
}
function paintWtStats(){
  /* Stats view: all-time records and averages — occasional-use numbers,
     kept out of the daily glance */
  const box = document.getElementById("wStatTiles");
  if(!box) return;
  const ws = sortedWeights(), wu = wUnit();
  const f1 = v => wDisp(v).toFixed(1);
  const sgn = v => (v>0?"+":v<0?"\u2212":"")+f1(Math.abs(v));
  if(ws.length===0){ box.innerHTML = ""; return; }
  const vals = ws.map(p=>p.w);
  const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
  const tr = weightTrend();
  box.innerHTML =
    `<div class="wstat"><span>Highest</span><b>${f1(Math.max(...vals))} ${wu}</b></div>`+
    `<div class="wstat"><span>Lowest</span><b>${f1(Math.min(...vals))} ${wu}</b></div>`+
    `<div class="wstat"><span>Average</span><b>${f1(avg)} ${wu}</b></div>`+
    `<div class="wstat"><span>Weigh-ins</span><b>${ws.length}</b></div>`+
    `<div class="wstat"><span>Weekly rate</span><b>${tr&&tr.rateWk!=null?sgn(tr.rateWk)+" "+wu+"/wk":"\u2014"}</b></div>`+
    `<div class="wstat"><span>Total change</span><b>${tr?sgn(tr.change)+" "+wu:"\u2014"}</b></div>`;
}
/* Hero status line: one plain-language sentence about where the trend is headed.
   A projection (weeks to goal) is shown only when the trend is actually moving
   toward the goal — flat or away-from-goal trends just say so, plainly. */
function wtStatusText(){
  const ws = sortedWeights(), wu = wUnit();
  const f1 = v => wDisp(v).toFixed(1);
  const sgn = v => (v>=0?"+":"\u2212")+f1(Math.abs(v));
  if(!ws.length) return "Log your first weigh-in and this becomes your trend.";
  const ma = trendMA(ws);
  const tw = ma.length && ma[ma.length-1].n>=2 ? ma[ma.length-1].w : ws[ws.length-1].w;
  const tr = weightTrend();
  const rate = tr && tr.rateWk!=null ? tr.rateWk : null;
  const flat = rate==null || Math.abs(rate)<0.05;
  const g = S.goals.weight;
  if(g>0){
    const toGo = g - tw;
    if(Math.abs(toGo) < 0.25) return "At your goal — hold this line.";
    if(flat) return "Holding steady — "+f1(Math.abs(toGo))+" "+wu+" to go.";
    const toward = (toGo>0 && rate>0) || (toGo<0 && rate<0);
    if(toward){
      const wk = Math.ceil(Math.abs(toGo)/Math.abs(rate));
      return "Trending "+sgn(rate)+" "+wu+"/wk — about "+wk+" week"+(wk>1?"s":"")+" from "+f1(g)+" "+wu+".";
    }
    return "Trending "+sgn(rate)+" "+wu+"/wk — that's away from your goal.";
  }
  if(flat) return "Holding steady.";
  return "Trending "+sgn(rate)+" "+wu+"/wk.";
}
/* Day-by-day panel (2026.10.18-d, Jay's ask): works like This week — metric
   categories (Carbs / Water / Sodium) in a segctl, a 7-day window with the
   same < > paging and backtrack labels, the total + per-day-average header,
   and bars7 bars with per-metric gradients. Averages count only days with
   data (food logged for carbs/sodium, water logged for water), locked days
   excluded — the same rules as the week panel above it. */
let dbOffset = 0;
const DB_METRICS = {
  crb: { unit:"g", get:t=>t.c, has:t=>t.foodLogged, fmt:v=>String(Math.round(v)), tot:v=>Math.round(v).toLocaleString(), grad:"", gradT:"background:linear-gradient(var(--acc),var(--acc-deep));" },
  wtr: { unit:"oz", get:t=>t.waterOz, has:t=>t.waterOz>0, fmt:v=>String(Math.round(v)), tot:v=>Math.round(v).toLocaleString(), grad:"background:linear-gradient(#6fc3f7,#2f8fe8);", gradT:"background:linear-gradient(#2f8fe8,#1f6fc4);" },
  sod: { unit:"mg", get:t=>t.sodium, has:t=>t.foodLogged, fmt:v=>v>=1000?((v/1000).toFixed(1).replace(/\.0$/,"")+"k"):String(Math.round(v)), tot:v=>Math.round(v).toLocaleString(), grad:"background:linear-gradient(#bcbcd8,#8383a8);", gradT:"background:linear-gradient(#8383a8,#5f5f86);" }
};
function paintDayCharts(){
  const seg = S.dbSeg || "crb", m = DB_METRICS[seg] || DB_METRICS.crb;
  document.querySelectorAll("#dbSeg .segbtn").forEach(b=>b.classList.toggle("on", b.dataset.dseg===seg));
  const box = document.getElementById("dbBars"); if(!box) return;
  const end = addDays(todayStr(), -dbOffset*7);
  const rows = [];
  for(let i=6;i>=0;i--){ const ds = addDays(end, -i), t = dayTotals(ds); rows.push({k:ds, v:m.get(t), has:m.has(t), locked:isLocked(ds), future: ds>todayStr()}); }
  const lg = rows.filter(r=>r.has && !r.locked);
  const total = lg.reduce((a,r)=>a+r.v, 0);
  $("dbTotal").textContent = m.tot(total);
  $("dbUnit").textContent = m.unit;
  $("dbAvg").textContent = lg.length ? Math.round(total/lg.length).toLocaleString()+"/day average · "+lg.length+" of 7 days" : "no logged days yet";
  $("dbRange").textContent = dbOffset===0 ? "Last 7 days" : weekLabel(rows);
  $("dbPrev").disabled = dbOffset>=MAX_WEEKS_BACK;
  $("dbNext").disabled = dbOffset===0;
  const max = Math.max(...rows.map(r=>r.v), 1);
  box.innerHTML = "";
  rows.forEach(r=>{
    const c = document.createElement("div");
    const dt = new Date(r.k+"T12:00:00"), isT = r.k===todayStr();
    c.className = "bcol"+(isWorkDayAuto(r.k)?" work":"")+(isT?" today":"")+(r.future?" future":"");
    c.innerHTML =
      `<div class="bkcal">${r.has?m.fmt(r.v):"–"}</div>`+
      `<div class="bar" style="height:${Math.max(r.v/max*100,2)}%;${isT?m.gradT:m.grad}"></div>`+
      `<div class="bl">${dt.toLocaleDateString(undefined,{weekday:"short"})}</div>`+
      `<div class="bdn">${dt.getDate()}</div>`+
      `<div class="bdot"></div>`;
    box.appendChild(c);
  });
  /* vs the week before: one quiet line in the rangenote style */
  const note = $("dbNote");
  if(note){
    const prows = [];
    for(let i=6;i>=0;i--){ const ds = addDays(end, -7-i), t = dayTotals(ds); prows.push({v:m.get(t), has:m.has(t), locked:isLocked(ds)}); }
    const plg = prows.filter(r=>r.has && !r.locked);
    if(lg.length && plg.length){
      const cur = total/lg.length, prev = plg.reduce((a,r)=>a+r.v,0)/plg.length;
      const nm = seg==="crb" ? "Carbs" : seg==="wtr" ? "Water" : "Sodium";
      note.textContent = nm+" averaged "+Math.round(cur).toLocaleString()+" "+m.unit+"/day — "+(Math.abs(cur-prev)<0.5 ? "same as " : (cur>prev ? "up from " : "down from "))+Math.round(prev).toLocaleString()+" "+m.unit+" the week before.";
    } else note.textContent = "";
  }
}
function renderProgress(){
  if(typeof paintHeatmap==="function") paintHeatmap(); /* defined in a later script block — same guard as paintAutoZone in renderDiary */
  (function(){ var s=S.weekSeg||"cal";
    document.querySelectorAll("#weekSeg .segbtn").forEach(function(x){x.classList.toggle("on",x.dataset.seg===s);});
    ["sum","cal","mac"].forEach(function(k){ var el=document.getElementById("wseg-"+k); if(el) el.hidden = k!==s; });
  })();
  const days = weekDays(weekOffset);
  const logged = days.filter(x=>x.logged && !x.locked);
  /* 2026.09.27-a: one window (last 7 days incl. today) and one rule (days with
     food logged) for every average on this page, so they can never disagree.
     2026.10.08-f: locked days are excluded from every average. */
  const lg = days.filter(x=>x.cal>0 && !x.locked);
  document.getElementById("stStreak").textContent = streak();
  document.getElementById("stAvgCal").textContent = lg.length ? Math.round(lg.reduce((a,x)=>a+x.cal,0)/lg.length).toLocaleString() : 0;
  document.getElementById("stAvgP").textContent = (lg.length ? Math.round(lg.reduce((a,x)=>a+x.p,0)/lg.length) : 0)+"g";
  const bb = document.getElementById("bars7"); bb.innerHTML = "";
  const max = Math.max(...days.map(x=>x.cal), (S.goals.maintenance>0?S.goals.maintenance:0)+(S.goals.surplus>0?S.goals.surplus:0), 1);
  days.forEach(x=>{
    const c = document.createElement("div");
    const dt = new Date(x.k+"T12:00:00"), isT = x.k===todayStr();
    /* 2026.09.27-e: schedule-strip style labels — kcal, name, day number,
       work/off dot. kcal always visible, so the tap-to-reveal is gone. */
    c.className = "bcol"+(isWorkDayAuto(x.k)?" work":"")+(isT?" today":"")+(x.future?" future":"");
    c.innerHTML =
      `<div class="bkcal">${x.logged?Math.round(x.cal).toLocaleString():"–"}</div>`+
      `<div class="bar" style="height:${Math.max(x.cal/max*100,2)}%;${isT?"background:linear-gradient(var(--acc),var(--acc-deep));":""}"></div>`+
      `<div class="bl">${dt.toLocaleDateString(undefined,{weekday:"short"})}</div>`+
      `<div class="bdn">${dt.getDate()}</div>`+
      `<div class="bdot"></div>`;
    bb.appendChild(c);
  });
  paintDayCharts();
  const w = S.weights.slice().sort((a,b)=>a.d<b.d?-1:1);
  /* analytics header: 7-day total */
  const wkTotal = days.filter(x=>!x.locked).reduce((a,x)=>a+x.cal,0);
  $("anaTotal").textContent = Math.round(wkTotal).toLocaleString();
  /* 2026.09.27-a: average over logged days (not ÷7), with the count shown —
     matches the weekly review and the ministat below */
  $("anaAvg").textContent = lg.length
    ? Math.round(wkTotal/lg.length).toLocaleString()+"/day average · "+lg.length+" of 7 days"
    : "no logged days yet";
  /* week backtrack labels + nav state */
  const wkLbl = weekOffset===0 ? "Last 7 days" : weekLabel(days);
  $("anaRange").textContent = wkLbl;
  $("mcWeek").textContent = weekOffset===0 ? "Weekly" : weekLabel(days);
  $("pgWkPrev").disabled = weekOffset>=MAX_WEEKS_BACK;
  $("pgWkNext").disabled = weekOffset===0;
  /* goal days: checkmarks for days that hit the calorie goal */
  const calGoal = (S.goals.maintenance>0?S.goals.maintenance:0)+(S.goals.surplus>0?S.goals.surplus:0);
  const CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4 10-11"/></svg>';
  const gd = $("goalDays"); gd.innerHTML = "";
  days.forEach(x=>{
    const hit = x.logged && calGoal>0 && x.cal >= calGoal*0.9;
    const el = document.createElement("div");
    el.className = "chal-day"+(hit?" hit":"")+(x.k===todayStr()?" today":"");
    el.innerHTML = '<span class="chal-dot">'+(hit?CHECK:"")+'</span><span>'+x.label+'</span>';
    gd.appendChild(el);
  });
  /* stacked macro chart from the week's diary data */
  const ms = $("macroStack"), ml = $("macroStackLbls"); ms.innerHTML = ""; ml.innerHTML = "";
  const maxG = Math.max(...days.map(x=>x.c+x.p+x.f), 1);
  days.forEach(x=>{
    const tot = x.c+x.p+x.f, col = document.createElement("div"); col.className = "mscol";
    col.innerHTML = '<div class="msbar" style="height:'+Math.max(tot/maxG*100,3)+'%">'
      +'<i style="height:'+(tot?x.f/tot*100:0)+'%;background:#34c77b"></i>'
      +'<i style="height:'+(tot?x.p/tot*100:0)+'%;background:#f5a623"></i>'
      +'<i style="height:'+(tot?x.c/tot*100:0)+'%;background:#8b8bf5"></i></div>';
    ms.appendChild(col);
    const lb = document.createElement("span"); lb.textContent = x.label; ml.appendChild(lb);
  });
  const dw = S.days[todayStr()];
  $("stWater").innerHTML = (dw&&dw.waterOz?Math.round(dw.waterOz*10)/10:0)+' <small>oz</small>';
  const wu = wUnit();
  document.getElementById("weightInput").placeholder = "Weight ("+wu+")";
  const wd = document.getElementById("weightDate");
  if(wd){ wd.max = todayStr(); if(!wd.value || wd.value>todayStr()) wd.value = todayStr(); }
  /* hero circle: just the current weight, unit, and latest weigh-in date */
  const lastW = w.length ? w[w.length-1] : null;
  document.getElementById("wtCircleNum").textContent = lastW ? wDisp(lastW.w).toFixed(1) : "—";
  document.getElementById("wtCircleUnit").textContent = wu;
  document.getElementById("wtCircleDate").textContent = lastW
    ? new Date(lastW.d+"T12:00:00").toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"})
    : "No weigh-ins yet";
  /* detail sheet hero: one smoothed trend number + one plain-language status
     line, so daily noise never reads as the headline */
  const wma = trendMA(w);
  const trendW = wma.length && wma[wma.length-1].n>=2 ? wma[wma.length-1].w : (lastW ? lastW.w : 0);
  document.getElementById("wtTrendNum").textContent = lastW ? wDisp(trendW).toFixed(1) : "—";
  document.getElementById("wtTrendUnit").textContent = wu;
  document.getElementById("wtStatus").textContent = wtStatusText();
  document.getElementById("wtDetailDate").textContent = lastW
    ? new Date(lastW.d+"T12:00:00").toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"})+" · "+wDisp(lastW.w).toFixed(1)+" "+wu+" · "+w.length+" weigh-ins"
    : "No weigh-ins yet";
  paintWeightChart(w);
  paintWtStats();
  paintWtSets();
  wtSlot = wtSlotDefault(document.getElementById("weightDate").value || todayStr()); paintWtSlotSeg();
  const wh = document.getElementById("weightHist");
  const pmMap = {}; pmSorted().forEach(p=>{ pmMap[p.d]=p.w; });
  const amMap = {}; w.forEach(p=>{ amMap[p.d]=p.w; });
  const allD = Array.from(new Set([...Object.keys(amMap), ...Object.keys(pmMap)])).sort().reverse();
  wh.innerHTML = allD.map(d=>{
    const lbl = new Date(d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
    let cells = "";
    if(amMap[d]!=null) cells += `<span style="display:flex;align-items:center;gap:2px"><b>${wDisp(amMap[d])} ${wu}</b><button class="wdel" data-d="${d}" aria-label="Delete morning weigh-in">×</button></span>`;
    if(pmMap[d]!=null) cells += `<span style="display:flex;align-items:center;gap:2px"><span style="color:var(--muted);font-size:12.5px">night</span><b>${wDisp(pmMap[d])} ${wu}</b><button class="wdel wpdel" data-d="${d}" aria-label="Delete night weigh-in">×</button></span>`;
    return `<div class="wrow"><span>${lbl}</span><span style="display:flex;align-items:center;gap:12px">${cells}</span></div>`;
  }).join("");
  wh.querySelectorAll(".wdel:not(.wpdel)").forEach(b=> b.onclick = ()=>{
    const dstr = new Date(b.dataset.d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
    if(!confirm("Delete the "+dstr+" weigh-in?")) return;
    S.weights = S.weights.filter(p=>p.d!==b.dataset.d);
    const rest = S.weights.slice().sort((a,c)=>a.d<c.d?-1:1);
    if(rest.length) syncWeightFromLog(rest[rest.length-1].w, rest[rest.length-1].d);
    else { S.goals.profile.weightLb = 0; S.goals.profHash = profHash(); commitGoals("weight-cleared"); } /* 2026.11.25-c: the goal blanks too. No weigh-ins left: blank-slate the synced weight so maintenance/BMI math can't use a ghost number (2026.09.24-x) */
    save(); renderProgress();
  });
  wh.querySelectorAll(".wpdel").forEach(b=> b.onclick = ()=>{
    const dstr = new Date(b.dataset.d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
    if(!confirm("Delete the "+dstr+" night weigh-in?")) return;
    S.pmWeights = (S.pmWeights||[]).filter(p=>p.d!==b.dataset.d);
    save(); renderProgress();
  });
  paintWtGoal(); paintWtAnalysis();
  paintCalCheck();
  paintMuscle();
  paintTrendChip(); paintInsights(); paintWeeklyReview(); paintTrajectory();
}
/* display helpers: weigh-ins are stored in lb; the UI follows the profile units toggle */
const wIsMet = () => (S.goals.profile||{}).units==="met";
const wUnit = () => wIsMet() ? "kg" : "lb";
const wDisp = lb => wIsMet() ? Math.round(lb/2.20462*10)/10 : Math.round(lb*10)/10;
const wToLb = v => wIsMet() ? v*2.20462 : v;
document.getElementById("wtGoalRow").addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); document.getElementById("wtGoalRow").click(); } });
document.getElementById("wtGoalInfo").onclick = (e)=>{ e.stopPropagation(); openInfo("wtgoal"); };
document.getElementById("waterInfo").onclick = ()=>openInfo("waterinfo");
var _si=document.getElementById("streakInfo"); if(_si) _si.onclick = ()=>openInfo("streakinfo");
var _npi=document.getElementById("nicPhaseInfo"); if(_npi) _npi.onclick = ()=>openInfo("nicphase");
var _api=document.getElementById("alcPhaseInfo"); if(_api) _api.onclick = ()=>openInfo("alcphase");
var _nt=document.getElementById("nicTap"); if(_nt) _nt.onclick = ()=>openCal("nicotine");
var _at=document.getElementById("alcTap"); if(_at) _at.onclick = ()=>openCal("alcohol");
/* organ healing satellites: tap opens milestone sheet; stopPropagation keeps the big circle's calendar closed */
[["nicHeal","quitlung"],["alcHeal","quitliver"]].forEach(function(p){
  var el=document.getElementById(p[0]); if(!el) return;
  el.onclick=function(e){ e.stopPropagation(); openInfo(p[1]); };
  el.onkeydown=function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); e.stopPropagation(); openInfo(p[1]); } };
});
document.getElementById("nutrInfo").onclick = ()=>openInfo("nutrients");
document.getElementById("bmiInfo").onclick = ()=>openInfo("bmi");
document.getElementById("calCheckInfo").onclick = ()=>openInfo("calcheck");
/* AM/PM log slot (2026.10.18-e): defaults to Night when the picked date
   already has a morning weigh-in and no night one yet, else Morning. */
var wtSlot = "am";
function paintWtSlotSeg(){ document.querySelectorAll("#wtSlotSeg .segbtn").forEach(b=> b.classList.toggle("on", b.dataset.s===wtSlot)); }
function wtSlotDefault(k){
  const hasAM = (S.weights||[]).some(p=>p.d===k), hasPM = (S.pmWeights||[]).some(p=>p.d===k);
  return (hasAM && !hasPM) ? "pm" : "am";
}
document.querySelectorAll("#wtSlotSeg .segbtn").forEach(b=> b.onclick = ()=>{ wtSlot = b.dataset.s; paintWtSlotSeg(); });
document.getElementById("weightDate").addEventListener("change", ()=>{ wtSlot = wtSlotDefault(document.getElementById("weightDate").value || todayStr()); paintWtSlotSeg(); });
document.getElementById("weightAdd").onclick = ()=>{
  const raw = parseFloat(document.getElementById("weightInput").value);
  const lo = wIsMet()?23:50, hi = wIsMet()?275:600;
  if(!raw || raw<lo || raw>hi){ alert(wIsMet() ? "Enter a valid weight in kg." : "Enter a valid weight."); return; }
  let k = document.getElementById("weightDate").value || todayStr();
  if(k>todayStr()){ alert("That date is in the future — pick today or an earlier date."); return; }
  if(k<"2000-01-01") k = todayStr();
  const v = Math.round(wToLb(raw)*10)/10;
  if(wtSlot==="pm"){
    S.pmWeights = (S.pmWeights||[]).filter(p=>p.d!==k); S.pmWeights.push({d:k, w:v});
    S.pmWeights.sort((a,b)=>a.d<b.d?-1:1);
    /* night weights never call syncWeightFromLog: the estimator stays morning-only */
  } else {
    S.weights = S.weights.filter(p=>p.d!==k); S.weights.push({d:k, w:v});
    syncWeightFromLog(v, k);
  }
  document.getElementById("weightInput").value = "";
  document.getElementById("weightDate").value = todayStr();
  save(); renderProgress();
};
document.querySelectorAll("#wRange button").forEach(b=>{
  b.onclick = ()=>{ wRange = parseInt(b.dataset.r,10);
    if(wRange===0) wScrollEnd = true; /* All: open at the newest end, scroll back for history */
    document.querySelectorAll("#wRange button").forEach(x=>x.classList.toggle("on", x===b));
    renderProgress(); };
});
/* ============ PROGRESS INSIGHTS + TRAJECTORY (analytics engine views) ============
   Compound views over dayTotals/adherenceSeries/trendState/goalProjection:
   what the last 14 days mean, not just what they were. */
/* ============ WEEKLY REVIEW (2026.09.24-e) ============
   One honest card from his own last-7-days data: avg intake vs goal, protein
   hit rate, trend-weight change, and exactly one suggested change. Needs 3+
   logged days or it stays hidden instead of guessing. */
function weeklyReviewData(){
  /* 2026.09.27-a: same window as the This-week panel — last 7 calendar days
     including today — so "Avg intake" can never disagree with it or the
     Avg kcal/7d ministat again. (The old i=7..1 loop silently excluded today.) */
  const days = weekDays(0);
  const logged = days.filter(x=>x.cal>0 && !x.locked); /* 2026.10.08-f: locked days excluded */
  if(logged.length < 3) return {ok:false};
  const goal = goalTotal(), pGoal = S.goals.protein||0;
  const avgCal = logged.reduce((a,x)=>a+x.cal,0)/logged.length;
  const pHit = pGoal>0 ? logged.filter(x=>x.p>=pGoal*0.9).length : 0;
  /* 2026.09.30-b: adherence (days at 90%+ of goal) + best/worst day by % of goal */
  const adhHit = goal>0 ? logged.filter(x=>x.cal>=goal*0.9).length : 0;
  const wday = k=>new Date(k+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"});
  let best=null, worst=null;
  if(goal>0 && logged.length){ const by=logged.slice().sort((a,b)=>(a.cal/goal)-(b.cal/goal)); worst=by[0]; best=by[by.length-1]; }
  let wtChg = null;
  const ws = sortedWeights();
  if(ws.length>=2){
    const ma = trendMA(ws), T = p=>new Date(p.d+"T12:00:00").getTime();
    const now = ma[ma.length-1];
    const ago = ma.filter(p=>T(p)<=T(now)-6*86400000).pop();
    if(ago) wtChg = now.w - ago.w;
  }
  /* 2026.09.30-b: pace to the weight goal at the current trend pace */
  let pace=null;
  try{ const gp=goalProjection(); if(gp.ok) pace={rateWk:gp.rateWk, etaDate:gp.etaDate, rangeTxt:gp.rangeTxt}; }catch(e){}
  /* exactly one suggestion, priority-ordered */
  let tip;
  const wu = wUnit();
  const st = trendState();
  if(goal>0 && avgCal < goal*0.9)
    tip = "Averaging "+Math.round(avgCal).toLocaleString()+" of your "+Math.round(goal).toLocaleString()+" kcal goal — add ~"+Math.round(goal-avgCal).toLocaleString()+" kcal/day (a shake or an extra snack closes it).";
  else if(pGoal>0 && pHit/logged.length < 0.7)
    tip = "Protein landed "+pHit+" of "+logged.length+" days — anchor each meal with 30–40g and the average takes care of itself.";
  else if(st.conf==="solid" && Math.abs(st.rateWk)<0.15 && logged.length>0 && adhHit/logged.length>=0.7 && S.goals.surplus>0)
    tip = "Trend is flat across 2+ weeks at "+Math.round(adhHit/logged.length*100)+"% adherence — the goal itself is the ceiling now, not your effort. Check the Autopilot suggestion up top.";
  else if(wtChg!=null && wtChg < -0.2 && S.goals.weight > curBodyWeight())
    tip = "Trend weight drifted "+wDisp(Math.abs(wtChg)).toFixed(1)+" "+wu+" down while bulking — the surplus isn't landing. Eat to the goal 7 days straight, then re-check.";
  else if(wtChg!=null && wtChg > 1.5)
    tip = "Trend weight up "+wDisp(wtChg).toFixed(1)+" "+wu+" this week — faster than a lean bulk needs. Slightly smaller surplus keeps it mostly muscle.";
  else
    tip = "Solid week — hold the line and re-check next week.";
  return {ok:true, n:logged.length, avgCal:Math.round(avgCal), goal:Math.round(goal),
          pHit, pGoal:Math.round(pGoal), wtChg, tip,
          adh:logged.length?Math.round(adhHit/logged.length*100):0,
          best:best?{d:wday(best.k),pct:Math.round(best.cal/goal*100)}:null,
          worst:worst?{d:wday(worst.k),pct:Math.round(worst.cal/goal*100)}:null,
          pace};
}
function paintWeeklyReview(){
  const r = weeklyReviewData(), card = document.getElementById("wkrevCard");
  if(!card) return;
  if(!r.ok){ card.style.display = "none"; return; }
  card.style.display = "";
  const wu = wUnit();
  document.getElementById("wkrevRange").textContent = "Last 7 days · "+r.n+" logged";
  const pct = r.goal>0 ? Math.round(r.avgCal/r.goal*100) : 0;
  const row = (l,v)=>'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span style="color:var(--muted)">'+l+'</span><b>'+v+'</b></div>';
  document.getElementById("wkrevRows").innerHTML =
    row("Avg intake", r.avgCal.toLocaleString()+" of "+r.goal.toLocaleString()+" kcal ("+pct+"%)") +
    row("Adherence", r.adh+"% of days at 90%+ of goal") +
    (r.best ? row("Best / worst day", r.best.d+" "+r.best.pct+"% · "+r.worst.d+" "+r.worst.pct+"%") : "") +
    row("Protein days", r.pGoal>0 ? r.pHit+" of "+r.n+" at "+r.pGoal+"g+" : "—") +
    (r.pace ? row("Pace to "+wDisp(S.goals.weight).toFixed(0)+" "+wu, fmtRate(r.pace.rateWk)+" "+wu+"/wk → ≈"+r.pace.etaDate+" ("+r.pace.rangeTxt+")") : "") +
    row("Trend weight", r.wtChg==null ? "—" : (r.wtChg>=0?"+":"−")+wDisp(Math.abs(r.wtChg)).toFixed(1)+" "+wu+" this week");
  document.getElementById("wkrevTip").textContent = r.tip;
}
function paintTrendChip(){
  const st = trendState(), el = $("trendChip"), wu = wUnit();
  let txt;
  if(st.conf==="sparse") txt = st.n<=1 ? "Log your weight and the trend line starts forming." : "Only "+st.n+" weigh-ins so far — the trend needs a few more dots.";
  else if(st.vsGoal==="at") txt = "At your goal — holding within a pound.";
  else if(st.dir==="flat") txt = "Trend is flat (±0.1 "+wu+"/wk) — holding steady.";
  else{
    const g = S.goals.weight>0 ? S.goals.weight : 0;
    const vs = st.vsGoal==="toward" ? " — toward your "+wDisp(g).toFixed(0)+" "+wu+" goal"
             : st.vsGoal==="away" ? " — away from your "+wDisp(g).toFixed(0)+" "+wu+" goal" : "";
    txt = "Trending "+(st.dir==="up"?"up":"down")+" "+fmtRate(st.rateWk)+" "+wu+"/wk"+vs+".";
  }
  el.textContent = txt;
}
function pearson(xs, ys){
  const n = xs.length;
  if(n<3) return null;
  const mx=xs.reduce((a,v)=>a+v,0)/n, my=ys.reduce((a,v)=>a+v,0)/n;
  let sxy=0, sxx=0, syy=0;
  for(let i=0;i<n;i++){ const dx=xs[i]-mx, dy=ys[i]-my; sxy+=dx*dy; sxx+=dx*dx; syy+=dy*dy; }
  if(sxx<=0||syy<=0) return null; /* no variance on one side: no correlation to compute */
  return sxy/Math.sqrt(sxx*syy);
}
function trendWeightByDay(){
  /* date -> latest trend-MA weight on or before that date (carry-forward) */
  const ws = sortedWeights(); if(ws.length<2) return {};
  const ma = trendMA(ws), map = {};
  let j=0, last=null;
  for(let i=45;i>=0;i--){
    const ds = addDays(todayStr(),-i);
    while(j<ma.length && ma[j].d<=ds){ last=ma[j].w; j++; }
    if(last!=null) map[ds]=last;
  }
  return map;
}
/* ======== CORRELATION INSIGHTS (2026.09.24-e) ========
   Day-N habits (alcohol, vape, water) vs day-N+1 outcomes (trend-weight delta,
   logged energy 1-5). Pearson r on paired days only; 14+ pairs required over the
   last 6 weeks; |r|<0.3 is reported as no clear link, never dressed up. Every
   row says correlation, not causation. Energy runs on the logged check-in only —
   never on the computed tired model. */
function correlationInsights(){
  const rows = [];
  const tw = trendWeightByDay();
  const N=42, MINP=14;
  const factors = [
    {label:"drink", get:ds=>{ const d=S.days[ds]||{}; return alcData(d).std>0?1:0; }},
    {label:"vape", get:ds=>{ const d=S.days[ds]||{}; return (d.vape&&d.vape!=="none")?1:0; }},
    {label:"hit your water target", get:ds=>{ const t=dayTotals(ds); return t.waterRatio==null?null:(t.waterRatio>=1?1:0); }},
  ];
  const outcomes = [
    {key:"wt", label:"next-day weight",
     get:ds=>{ const a=tw[ds], b=tw[addDays(ds,1)]; return (a==null||b==null)?null:Math.round((b-a)*100)/100; }},
    {key:"nrg", label:"next-day energy",
     get:ds=>{ const e=(S.days[addDays(ds,1)]||{}).energy; return (e>=1&&e<=5)?e:null; }},
  ];
  outcomes.forEach(o=>{
    let best=null;
    factors.forEach(f=>{
      const xs=[], ys=[];
      for(let i=N;i>=1;i--){
        const ds=addDays(todayStr(),-i);
        if(isLocked(ds) || isLocked(addDays(ds,1))) continue; /* 2026.10.09-h: locked days teach the model nothing */
        const x=f.get(ds), y=o.get(ds);
        if(x!=null&&y!=null){ xs.push(x); ys.push(y); }
      }
      if(xs.length>=MINP){
        const r=pearson(xs,ys);
        if(r!=null && (!best || Math.abs(r)>Math.abs(best.r))) best={flabel:f.label, r, n:xs.length};
      }
    });
    if(!best){
      rows.push({key:"corr-"+o.key, conf:"partial",
        title:"Not enough paired days for "+o.label+" yet",
        copy:"Correlations need "+MINP+"+ paired days over the last 6 weeks. "+(o.key==="nrg"?"Tap your energy (1-5) in the diary each day and this fills in.":"Keep logging weight and this fills in."),
        ev:"Sparse data is never presented as a finding — the gate is "+MINP+" paired days."});
      return;
    }
    const r=best.r, sig=Math.abs(r)>=0.3, dirWord=r>0?"higher":"lower";
    rows.push({key:"corr-"+o.key, conf:sig?"solid":"partial",
      title:(sig?"":"No clear link: ")+"days you "+best.flabel+" → "+o.label+" (r="+r.toFixed(2)+")",
      copy: sig
        ? "On days you "+best.flabel+", "+o.label+" tends to run "+dirWord+" ("+best.n+" paired days). Correlation, not causation — habits travel together."
        : best.n+" paired days and nothing stands out (|r| < 0.3). That's a finding too: no single lever is driving "+o.label+".",
      ev:"Pearson r="+r.toFixed(2)+" over "+best.n+" paired days (day-N habit vs day-N+1 outcome, last 6 weeks). Correlation only — it can't say what caused what."});
  });
  return rows;
}
function paintInsights(){
  const rows = [insightAdherenceVsTrend(), insightProteinVsTrend(), insightWaterVsTired(),
                insightTrainingWeek(), insightSodiumVsBloat()].concat(correlationInsights()).filter(Boolean);
  rows.sort((a,b)=> (a.conf==="solid"?0:1)-(b.conf==="solid"?0:1));
  const shown = rows.slice(0,4);
  const el = $("insRows"); el.innerHTML = "";
  shown.forEach(r=>{
    const b = document.createElement("button");
    b.className = "insrow";
    b.innerHTML = "<b>"+esc(r.title)+(r.conf==="solid" ? "" : "<span class=\"insconf\">developing</span>")+"</b><span>"+esc(r.copy)+"</span>";
    b.onclick = ()=>openInfo("insight:"+r.key);
    el.appendChild(b);
  });
  document.getElementById("insCard").style.display = shown.length ? "" : "none";
}
function paintTrajectory(){
  const p = goalProjection();
  const head = $("trajHead"), sub = $("trajSub"), pctEl = $("trajPct"), fill = $("trajBarFill"), wrap = $("trajBarWrap");
  const g = S.goals.weight, wu = wUnit(), cur = curBodyWeight();
  const ws = sortedWeights(), start = (S.goals.weightStart>0) ? S.goals.weightStart : (ws.length ? ws[0].w : cur);
  const pct = g===start ? 100 : Math.min(100, Math.max(0,(cur-start)/(g-start)*100));

  if(!p.ok){
    head.textContent = p.atGoal ? "At goal" : "Paused";
    sub.textContent = p.why;
    pctEl.textContent = ""; fill.style.width = "0%"; wrap.style.display = p.atGoal ? "" : "none";
  } else {
    const toGo = Math.abs(p.toGo);
    head.textContent = "≈"+p.etaDate;
    sub.textContent = wDisp(toGo).toFixed(1)+" "+wu+" "+(p.toGo>0?"to go":"to lose")+" · at "+fmtRate(p.rateWk)+" "+wu+"/wk from your weigh-ins · "+p.rangeTxt+". A projection of the scale, not of muscle."+(p.paceWarn ? " "+p.paceWarn : "");
    pctEl.textContent = pct.toFixed(0)+"%";
    fill.style.width = pct.toFixed(1)+"%"; wrap.style.display = "";
  }

  /* 2026.10.11: Milestone Roadmap update */
  const rStartVal = $("roadStartVal"), rStartDate = $("roadStartDate");
  const rCurVal = $("roadCurVal"), rNetVal = $("roadNetVal");
  const rGoalVal = $("roadGoalVal"), rGoalEta = $("roadGoalEta");
  const rRateVal = $("roadRateVal"), rToGoVal = $("roadToGoVal");
  const rAdhVal = $("roadAdhVal"), rSummary = $("roadSummary"); /* 2026.10.21-e (audit): roadLine element was removed when the ring replaced the bar — dead handle dropped */
  const rPill = $("roadPill");

  if(rStartVal && cur > 0){
    rStartVal.textContent = wDisp(start).toFixed(1) + " " + wu;
    rStartDate.textContent = ws.length ? new Date(ws[0].d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"}) : "Baseline";
    rCurVal.textContent = wDisp(cur).toFixed(1) + " " + wu;
    const net = cur - start;
    rNetVal.textContent = (net >= 0 ? "+" : "−") + wDisp(Math.abs(net)).toFixed(1) + " " + wu;
    rGoalVal.textContent = g > 0 ? wDisp(g).toFixed(1) + " " + wu : "Set goal";
    rGoalEta.textContent = p.ok ? "≈" + p.etaDate : (g > 0 ? "Target set" : "No goal");
    if(rRateVal) rRateVal.textContent = p.ok ? fmtRate(p.rateWk) + " " + wu + "/wk" : "Building pace";
    if(rToGoVal) rToGoVal.textContent = g > 0 ? wDisp(Math.abs(g - cur)).toFixed(1) + " " + wu : "–";
    
    /* 7-day adherence */
    const days = weekDays(0), calGoal = goalTotal();
    const hits = days.filter(x => x.logged && calGoal > 0 && x.cal >= calGoal * 0.9).length;
    if(rAdhVal) rAdhVal.textContent = hits + " / 7 days";
    var wtRing = document.getElementById("wtRingFill"); /* 2026.10.14-i: progress ring replaces the straight bar */
    if(wtRing) wtRing.style.strokeDashoffset = (289 * (1 - Math.min(100, Math.max(0, pct)) / 100)).toFixed(1);
    if(rPill){
      const m = S.goals.mode;
      rPill.textContent = m === "bulk" ? "Surplus Bulk" : (m === "maintain" ? "Maintenance" : "Lean Bulk");
    }
    if(rSummary){
      if(p.ok){
        rSummary.textContent = "At your current pace of " + fmtRate(p.rateWk) + " " + wu + "/wk, you are on track to reach " + wDisp(g).toFixed(1) + " " + wu + " around " + p.etaDate + " (" + p.rangeTxt + ").";
      } else {
        rSummary.textContent = g > 0 ? "Log weigh-ins regularly to calculate your velocity and project your exact milestone arrival." : "Tap your weight circle to set a target weight goal.";
      }
    }
  }
}
/* Weight detail: Trend / Stats / History segmented views */
document.querySelectorAll("#wtSeg button").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll("#wtSeg button").forEach(x=>x.classList.toggle("on", x===b));
    const v = b.dataset.v;
    document.getElementById("wtViewTrend").style.display = v==="trend" ? "" : "none";
    document.getElementById("wtViewStats").style.display = v==="stats" ? "" : "none";
    document.getElementById("wtViewHistory").style.display = v==="history" ? "" : "none";
    if(v==="stats") paintWtStats();
  };
});
/* week backtrack navigator */
document.getElementById("pgWkPrev").onclick = ()=>{ if(weekOffset<MAX_WEEKS_BACK){ weekOffset++; renderProgress(); } };
document.getElementById("pgWkNext").onclick = ()=>{ if(weekOffset>0){ weekOffset--; renderProgress(); } };
/* Weight detail: full-screen sheet opened by tapping the Progress weight circle. */
function openWtDetail(){
  document.getElementById("wtDetail").classList.add("open");
  document.getElementById("wtDetail").querySelector(".wtd-scroll").scrollTop = 0;
  if(wRange===0){ const sc = document.getElementById("wChartScroll"); if(sc) sc.scrollLeft = sc.scrollWidth; }
}
function closeWtDetail(){
  document.getElementById("wtDetail").classList.remove("open");
  closeWtGoalEdit();
}
document.getElementById("wtCircle").onclick = openWtDetail;
document.getElementById("wtDetailBack").onclick = closeWtDetail;
/* In-sheet goal editor (replaces the old browser prompt). */
function openWtGoalEdit(){
  const wu = wUnit();
  document.getElementById("wtGoalEditUnit").textContent = wu;
  const inp = document.getElementById("wtGoalEditInput");
  inp.value = S.goals.weight>0 ? wDisp(S.goals.weight).toFixed(1) : "";
  inp.placeholder = "Target ("+wu+")";
  document.getElementById("wtGoalEdit").style.display = "";
  setTimeout(()=>inp.focus(), 60);
}
function closeWtGoalEdit(){
  const e = document.getElementById("wtGoalEdit");
  if(e) e.style.display = "none";
}
document.getElementById("wtGoalRow").onclick = (e)=>{
  if(e.target.closest(".ginfo")) return;
  const ed = document.getElementById("wtGoalEdit");
  if(ed.style.display==="none") openWtGoalEdit(); else closeWtGoalEdit();
};
document.getElementById("wtGoalEditSave").onclick = ()=>{
  const wu = wUnit(), lo = wIsMet()?23:50, hi = wIsMet()?275:600;
  const n = parseFloat(document.getElementById("wtGoalEditInput").value);
  if(!(n>lo && n<hi)){ alert("Enter a weight between "+lo+" and "+hi+" "+wu+"."); return; }
  S.goals.weight = Math.round(wToLb(n)*10)/10;
  S.goals.weightStart = curBodyWeight();
  save(); renderProgress(); closeWtGoalEdit();
};
document.getElementById("wtGoalEditClear").onclick = ()=>{
  S.goals.weight = 0; S.goals.weightStart = 0;
  save(); renderProgress(); closeWtGoalEdit();
};
document.getElementById("wtGoalEditCancel").onclick = closeWtGoalEdit;

/* ============ GOALS VIEW ============ */
function goalTotal(){ return (S.goals.maintenance>0) ? Math.round(S.goals.maintenance) + (S.goals.surplus>0?S.goals.surplus:0) : 0; }
/* ================= ANALYTICS ENGINE — MACROS =================
   Research sources (2026 refresh): protein 1.6-2.2 g/kg/d for muscle gain
   (Morton 2018 meta-analysis: breakpoint 1.62; ISSN 2017: 1.4-2.0) — auto default
   2.2 g/kg. No per-meal "30 g max" (Trommelen 2023: no upper limit in 12 h);
   practical guidance is 0.3-0.4 g/kg across 3-5 meals. Fat 20-35% of energy (AMDR,
   still current); carbs fill the rest (~3-6 g/kg for lifters). Typing any macro
   switches to manual. */
function deriveMacros(){
  const tot = goalTotal();
  if(!(tot>0)){ S.goals.protein=0; S.goals.carbs=0; S.goals.fat=0; return; }
  /* Custom split (2026.10.14-i): protein/fat as % of the goal, carbs fill —
     set with the steppers on the Goals page; null = the recommended split. */
  const sp = S.goals.splitPct;
  if(sp && sp.p>0 && sp.f>0){
    S.goals.protein = Math.round(tot*sp.p/100/4);
    S.goals.fat = Math.round(tot*sp.f/100/9);
    S.goals.carbs = Math.max(0, Math.round((tot - S.goals.protein*4 - S.goals.fat*9)/4));
    return;
  }
  const wKg = goalWeight().lb/2.20462; /* 2026.11.25-c: no assumed 150 lb — your weigh-in average */
  if(!(wKg>0)){ S.goals.protein=0; S.goals.carbs=0; S.goals.fat=0; return; }
  S.goals.protein = Math.round(wKg*2.2);
  S.goals.fat = Math.max(0, Math.round(tot*0.25/9));
  S.goals.carbs = Math.max(0, Math.round((tot - S.goals.protein*4 - S.goals.fat*9)/4));
}
function autoDeriveMacros(){ if(S.goals.macroAuto!==false) deriveMacros(); }
/* ================= ANALYTICS ENGINE — ENERGY =================
   calculator.net method (Jay's pick, 2026.09.24):
   - BMR: Mifflin-St Jeor 1990 — men: 10xW + 6.25xH - 5xA + 5; women: -161
     (W in kg, H in cm). Typical individual error ±10-15%.
   - BMR with body fat: Katch-McArdle (370 + 21.6x lean mass kg) — the formula
     calculator.net uses when body fat % is known.
   - Activity: calculator.net's own factors — Sedentary 1.2 · Light 1.375 ·
     Moderate 1.465 · Active 1.55 · Very active 1.725 · Extra active 1.9.
   The Calorie Check feedback loop + Adaptive TDEE calibrate against real data. */
const ACT_TIERS = [
  {key:"sedentary", pal:1.2,   label:"Sedentary",    desc:"little or no exercise"},
  {key:"light",     pal:1.375, label:"Light",        desc:"exercise 1-3 times/week"},
  {key:"moderate",  pal:1.465, label:"Moderate",     desc:"exercise 4-5 times/week"},
  {key:"active",    pal:1.55,  label:"Active",       desc:"daily exercise or intense exercise 3-4 times/week"},
  {key:"very",      pal:1.725, label:"Very active",  desc:"intense exercise 6-7 times/week"},
  {key:"extra",     pal:1.9,   label:"Extra active", desc:"very intense exercise daily, or physical job"}
];
const actPAL = p => (ACT_TIERS.find(t=>t.key===(p&&p.activityKey))||ACT_TIERS[2]).pal;
const MODE_PCT = {lean:10, bulk:15, maintain:0}; /* Helms 2023: bigger surpluses add fat, not muscle — bulk capped at +15% */
/* keep a preset mode's surplus glued to its % of maintenance */
function applyModePct(){
  const g = S.goals;
  /* Gain-rate mode (2026.10.14-i, GymGeek-style): the surplus is the chosen
     gain rate x 500 kcal/day (3500 kcal/lb / 7) — the same for any body. */
  if(g.surplusMode==="rate" && g.gainRate>=0 && g.maintenance>0){ g.surplus = Math.round(g.gainRate*500); return; }
  const pct = MODE_PCT[g.mode];
  if(pct!==undefined && g.maintenance>0) g.surplus = Math.round(g.maintenance*pct/100);
}
/* Photo dedup: log entries used to carry a second copy of their library food's
   photo. The library is now the source of truth (entryImg resolves by name), so
   strip copies that exactly match — entries with their own unique photo keep it. */
if(!flagGet().imgDedup){
  const lib = {};
  (S.customFoods||[]).forEach(f=>{ if(f.img) lib[f.n] = f.img; });
  for(const k in (S.days||{})){
    const ms = (S.days[k]||{}).meals||{};
    Object.keys(ms).forEach(m=>(ms[m]||[]).forEach(e=>{ if(e.img && lib[e.n]===e.img) e.img = null; }));
  }
  flagSet("imgDedup",1);
}
/* ================= ANALYTICS ENGINE — WEIGHT DYNAMICS =================
   Research sources (2026 refresh): Hall 2011 (dynamic energy balance — the
   3,500 kcal/lb rule is a first-week heuristic that overstates long-term change);
   target gain 0.25-0.5% body weight/week for lean bulks (Helms 2023). The
   Calorie Check below (Hall 2014 model-based feedback) keeps projections honest
   by comparing expected vs observed weigh-in trends. */
function paintGainProj(){
  const s = S.goals.surplus>0 ? S.goals.surplus : 0;
  const el = document.getElementById("gainProj");
  if(!el) return; /* 2026.10.21-d: the projection moved behind the info button */
  if(s <= 0){ el.textContent = S.goals.maintenance>0 ? "At maintenance" : ""; return; }
  const lbWk = s*7/3500; /* 3500 kcal/lb heuristic */
  el.textContent = "≈ +"+wDisp(lbWk).toFixed(2)+" "+wUnit()+"/week at this surplus";
}
function paintMaintNote(){
  /* 2026.10.21-c cleanup: the stats card no longer carries an explanatory
     note — the formula law lives in one place (the page's info button). */
  const el = document.getElementById("pfNote");
  if(el) el.textContent = "";
}
function readProfile(){
  const p = S.goals.profile, met = p.units==="met";
  const oldW = p.weightLb||0;
  const age = parseInt(document.getElementById("pfAge").value);
  /* store the age with today's date only when it actually changed, so it keeps counting up */
  if(age>=10 && age<=100 && (age!==effAge(p) || !p.ageAsOf)){ p.age = age; p.ageAsOf = todayStr(); }
  if(met){
    const cm = parseFloat(document.getElementById("pfHtCm").value);
    if(cm>100 && cm<250) p.heightIn = cm/2.54;
    const kg = parseFloat(document.getElementById("pfWeight").value);
    if(kg>20 && kg<700) p.weightLb = kg*2.20462;
  } else {
    const ft = parseFloat(document.getElementById("pfHtFt").value)||0;
    const inch = parseFloat(document.getElementById("pfHtIn").value)||0;
    if(ft>2 && ft<9 && inch>=0 && inch<12) p.heightIn = ft*12+inch;
    const lb = parseFloat(document.getElementById("pfWeight").value);
    if(lb>40 && lb<1500) p.weightLb = lb;
  }
  const f = parseFloat(document.getElementById("pfFat").value);
  p.bodyFat = (f>=0 && f<=70) ? f : 0;
  const wst = parseFloat(document.getElementById("pfWaist").value);
  if(met) p.waistIn = (wst>40 && wst<200) ? wst/2.54 : 0; /* cm → in */
  else p.waistIn = (wst>15 && wst<80) ? wst : 0;
  /* A manual profile-weight edit IS a weigh-in: it becomes today's entry (replacing
     any existing one) so the Progress header, chart, and history always agree with
     the profile field. Editing any other field leaves weigh-ins untouched. */
  if(p.weightLb>0 && Math.abs(p.weightLb-oldW)>=0.05){
    const t = todayStr(), w = Math.round(p.weightLb*10)/10;
    S.weights = (S.weights||[]).filter(x=>x.d!==t); S.weights.push({d:t, w});
    syncWeightFromLog(w, t);
  }
}
/* Commit every typed value on the Goals page into S.goals (memory; callers save).
   Called before ANY re-render and on every field change, so a tap can never
   silently wipe an edit the user typed but hadn't saved yet. */
function commitMacroInputs(){
  /* 2026.10.14-i: macros are calculated, never typed — the Goals page has no
     macro inputs anymore. Kept as a no-op because commitGoalsInputs() and a
     few legacy callers still call it. */
}function commitGoalsInputs(){
  commitMacroInputs();
  readProfile();
  S.goals.profile.updatedAt = todayStr(); /* anchors the 1-month milestone suggestion */
}
function renderGoalsProfile(){
  const p = S.goals.profile, met = p.units==="met";
  document.querySelectorAll("#pfUnits .chip").forEach(c=>c.classList.toggle("sel", c.dataset.u===p.units));
  document.querySelectorAll("#pfSex .chip").forEach(c=>c.classList.toggle("sel", c.dataset.x===p.sex));
  /* 2026.11.25-c: an unset field is empty, not "0"; age shows your age today */
  document.getElementById("pfAge").value = effAge(p) || "";
  document.getElementById("htImpRow").style.display = met?"none":"flex";
  document.getElementById("htMetRow").style.display = met?"flex":"none";
  const hasH = p.heightIn>0, hasW = p.weightLb>0;
  if(met) document.getElementById("pfHtCm").value = hasH ? Math.round(p.heightIn*2.54) : "";
  else { document.getElementById("pfHtFt").value = hasH ? Math.floor(p.heightIn/12) : ""; document.getElementById("pfHtIn").value = hasH ? Math.round(p.heightIn%12) : ""; }
  document.getElementById("pfWeight").value = hasW ? (met ? (p.weightLb/2.20462).toFixed(1) : Math.round(p.weightLb*10)/10) : "";
  document.getElementById("pfWeightUnit").textContent = met?"kg":"lb";
  document.getElementById("pfFat").value = p.bodyFat>0 ? p.bodyFat : "";
  document.getElementById("pfWaist").value = p.waistIn>0 ? (met ? Math.round(p.waistIn*2.54*10)/10 : Math.round(p.waistIn*10)/10) : "";
  document.getElementById("pfWaistUnit").textContent = met?"cm":"in";
  document.querySelectorAll("#pfAct .chip").forEach(c=>c.classList.toggle("sel", c.dataset.k===p.activityKey));
  paintMaintNote();
}
/* Complete-day gating: partial days must not teach the model. A day counts only
   with real food AND all three bars cleared: ≥800 kcal, ≥ half of maintenance,
   ≥ 60% of your own median day. Today is always excluded — unfinished by definition. */
function completeDayCals(WIN, fromDs){
  WIN=WIN||28; const raw=[]; /* compact model passes 14; legacy callers keep 28 */
  for(let i=WIN;i>=1;i--){ const ds=addDays(todayStr(),-i); /* 2026.10.21-e (audit): was WIN-1 days for a WIN-day window; today stays excluded by design */ if(fromDs && ds<fromDs) continue; if(isLocked(ds)) continue; const t=dayTotals(ds); if(t.foodLogged) raw.push(t.cal); }
  const srt=raw.slice().sort((a,b)=>a-b), med=srt.length?srt[Math.floor(srt.length/2)]:0;
  const maint=S.goals.maintenance||0;
  const cals=[]; let partial=0;
  raw.forEach(cal=>{ if(cal>=800 && cal>=0.5*maint && cal>=0.6*med) cals.push(cal); else partial++; });
  return {cals, partial, logged:raw.length};
}
function avgCompleteIntake(){ const r=completeDayCals(); return r.cals.length?r.cals.reduce((a,v)=>a+v,0)/r.cals.length:null; }
/* ============ ADAPTIVE TDEE ============
   Learns maintenance from the energy-balance equation instead of guessing it
   from an activity multiplier: TDEE = avg daily intake − (weight slope × 3500).
   Gaining weight means intake exceeded TDEE, so the trend subtracts;
   losing means intake fell short, so it adds back.
   The slope runs on EWMA trend weights over an aligned 21-day window so daily
   scale noise can't swing it; missing days are never padded with zeros. Below
   the coverage gates (10+ complete days, 10+ day weigh-in span) the last good
   value HOLDS with a stale flag — the estimate is never blended with the
   formula and never capped: one number, computed one way (2026.10.13-b/c). */
/* ============ SINGLE DERIVATION — FORMULA LAW (2026.10.21-b, Jay's redesign) ============
   maintenance, surplus and macros are DERIVED state — this is the only function
   allowed to write them. Maintenance has exactly ONE source now: the basic
   formula from the CURRENT profile — Mifflin-St Jeor BMR (Katch-McArdle when
   body fat is known) x the activity multiplier. The food log NEVER moves the
   goal (Jay, 2026-10-21: not based on food I eat — only my weight); the number
   moves only when a profile input moves: weight, height, age, sex, activity.
   No profile stats (or no sex, which Mifflin needs) -> no number is presented
   at all. The learned/adaptive engine still exists for the Calorie Check and
   insights, but it no longer writes this number. A manual maintOverride (the
   Calorie Check Apply Jay taps himself) remains the one explicit exception.
   Every derivation is stamped with its provenance. */
function actTier(p){
  p = p || (S.goals||{}).profile || {};
  return ACT_TIERS.find(t=>t.key===p.activityKey) || null; /* 2026.11.25-c: no silent "Moderate" */
}
function formulaGoal(){
  const p = (S.goals||{}).profile||{};
  if(!profileReady()) return null; /* sex, age, height, weight AND activity — nothing assumed */
  const gw = goalWeight();
  const wKg = gw.lb>0 ? gw.lb/2.20462 : 0;
  const hCm = p.heightIn>0 ? p.heightIn*2.54 : 0;
  const age = effAge(p);
  if(!(wKg>0 && hCm>0 && age>=10 && age<=100)) return null;
  let bmr, eq;
  if(p.bodyFat>0 && p.bodyFat<70){ bmr = 370 + 21.6*(wKg*(1-p.bodyFat/100)); eq = "Katch-McArdle: 370 + 21.6 x lean kg"; }
  else if(p.sex==="m" || p.sex==="male"){ bmr = 10*wKg + 6.25*hCm - 5*age + 5; eq = "Mifflin-St Jeor: 10 x kg + 6.25 x cm - 5 x age + 5"; }
  else if(p.sex==="f" || p.sex==="female"){ bmr = 10*wKg + 6.25*hCm - 5*age - 161; eq = "Mifflin-St Jeor: 10 x kg + 6.25 x cm - 5 x age - 161"; }
  else return null; /* Mifflin needs sex; without it there is no honest number */
  const tier = actTier(p), pal = tier.pal;
  return {bmr: Math.round(bmr), bmrRaw: bmr, pal, tier: tier.key, tierLabel: tier.label,
          maintenance: Math.round(bmr*pal), eq, wKg: Math.round(wKg*10)/10, hCm: Math.round(hCm*10)/10,
          age, weightLb: Math.round(gw.lb*10)/10, weightSrc: gw.src};
}
/* Back-compat name: the formula used to be only a CHECK under the learned
   number (2026.10.21-a); since -b it IS the goal. */
function formulaCheck(){ return formulaGoal(); }
function commitGoals(reason, maintOverride){
  const g = S.goals;
  let src;
  if(maintOverride>0){ g.maintenance = Math.round(maintOverride); src = "auto-tune"; g.formula = formulaGoal(); }
  else {
    const fg = formulaGoal();
    if(fg){ g.maintenance = fg.maintenance; src = "formula"; g.formula = fg; }
    else { g.maintenance = 0; src = "nodata"; g.formula = null; /* no stats -> no number, never a guess */ }
  }
  applyModePct();      /* preset modes: surplus stays glued to its % of maintenance */
  autoDeriveMacros();  /* macros follow the goal unless he locked them manually */
  g.derived = {src, maint: Math.round(g.maintenance||0), at: todayStr(), why: reason||""};
  save();
}
function dailyTrendSeries(ws, alpha){
  /* Daily trend weight (MacroFactor / Happy Scale convention): one EWMA step
     per calendar day. Days without a weigh-in re-step against the last known
     weight, so the trend digests a change on a clock — not on weigh-in count.
     Same neighbor-median outlier filter as the chart's ewmaTrend. */
  alpha = alpha || 0.15;
  if(!ws || !ws.length) return [];
  var pts = ws.slice().sort(function(a,b){ return a.d<b.d?-1:1; });
  var clean = pts.filter(function(p, i){
    var nb = [];
    if(i>0) nb.push(pts[i-1].w);
    if(i<pts.length-1) nb.push(pts[i+1].w);
    if(!nb.length) return true;
    nb.sort(function(a,b){ return a-b; });
    var med = nb[Math.floor(nb.length/2)];
    return Math.abs(p.w - med) <= 6.6;
  });
  if(!clean.length) return [];
  var byDay = {};
  clean.forEach(function(p){ byDay[p.d] = p.w; });
  var out = [], trend = null, last = null, end = todayStr();
  for(var ds = clean[0].d; ds <= end; ds = addDays(ds, 1)){
    if(byDay[ds] !== undefined) last = byDay[ds];
    if(last === null) continue;
    trend = (trend === null) ? last : alpha*last + (1-alpha)*trend;
    out.push({d: ds, w: trend});
  }
  return out;
}
function detectLevelShift(raw){
  /* v5 (2026.10.18-a): a LEVEL SHIFT is a >3 lb jump between consecutive
     weigh-ins whose landing level is then confirmed by 2+ later weigh-ins
     within 1.5 lb of the landing value (every weigh-in is a real reading —
     a shift is a level change, usually water/glycogen, not an error and not
     a rate). Returns the landing date of the LATEST confirmed shift among
     the sorted raw weigh-ins given, or null. Scoped to the caller's window,
     so a historical jump can never hijack the current estimate. */
  let found=null;
  for(let i=1;i<raw.length;i++){
    if(Math.abs(raw[i].w-raw[i-1].w)>3){
      const post=raw.slice(i);
      if(post.length>=3 && post.slice(1).filter(p=>Math.abs(p.w-post[0].w)<=1.5).length>=2) found=raw[i].d;
    }
  }
  return found;
}
function segmentTrendSeries(post){
  /* Daily EWMA (alpha 0.15, same convention as dailyTrendSeries) RE-SEEDED at
     the first post-shift weigh-in and stepped daily to today, carrying the
     last known weight forward. The pre-shift trend is never an input: the
     rate over a segment must measure movement since the shift, not the
     shift itself. */
  const byDay={}; post.forEach(p=>{ byDay[p.d]=p.w; });
  const out=[]; let trend=null, last=null;
  for(let ds=post[0].d; ds<=todayStr(); ds=addDays(ds,1)){
    if(byDay[ds]!==undefined) last=byDay[ds];
    if(last===null) continue;
    trend = trend===null ? last : 0.15*last + 0.85*trend;
    out.push({d:ds, w:trend});
  }
  return out;
}
function adaptiveCalc(){
  /* ADAPTIVE v3 (2026.10.13-b): one learned number over ONE aligned 21-day window —
     the intake average and the weight trend cover the same days (MacroFactor's
     ~3-week lookback). TDEE = avg intake − (lb/wk ÷ 7 × 3500). No formula blending,
     no confidence %. Coverage gates: below 10 complete days or a 10-day weigh-in
     span the estimate reports not-ok and the caller HOLDS the last good value
     instead of guessing (a frozen number beats a drifting one). */
  const WIN=21, MIN_DAYS=10, MIN_SPAN=10;
  if(!(S.goals.profile.weightLb>0)) return {ok:false, reason:"profile"};
  const comp=completeDayCals(WIN), cals=comp.cals, partial=comp.partial, logged=comp.logged||0;
  const ws=sortedWeights(), T=p=>new Date(p.d+"T12:00:00").getTime();
  const cutoff=new Date(todayStr()+"T12:00:00").getTime()-WIN*86400000;
  /* EWMA smoothing before differencing: water weight must not whipsaw the number */
  /* v4 (2026.10.15-a): trend from the DAILY-step series, not per-weigh-in
     points. Per-weigh-in stepping moved at weigh-in frequency, so a one-time
     step change (+5.6 lb quit-week rebound, 2026-10-11) stayed "current gain"
     for weeks and dragged maintenance down while the scale sat flat. The
     coverage span is still measured on the RAW weigh-ins in the window. */
  const wpts=dailyTrendSeries(ws).filter(p=>T(p)>=cutoff);
  const rawInWin=ws.filter(p=>T(p)>=cutoff);
  const spanD=rawInWin.length>=2?(T(rawInWin[rawInWin.length-1])-T(rawInWin[0]))/86400000:0;
  /* v5 (2026.10.18-a): when the window straddles a CONFIRMED level shift, the
     halves comparison reads the one-time jump as a continuous rate (the
     2026-10-11 rebound, 121.8 -> 127.4, scored +0.56 lb/wk while the scale
     sat flat for a week, and worsened daily as the lagging trend climbed).
     The rate window RESTARTS at the shift: intake average and trend both
     measure the post-shift segment only, under the same coverage gates.
     Below the gates there is NO fresh number — the caller HOLDS the last
     data-derived value until the new level has ~10 days behind it. */
  const shiftD=detectLevelShift(rawInWin);
  if(shiftD){
    const post=rawInWin.filter(p=>p.d>=shiftD);
    const postSpan=post.length>=2?(T(post[post.length-1])-T(post[0]))/86400000:0;
    const seg=completeDayCals(WIN, shiftD);
    if(postSpan>=MIN_SPAN && seg.cals.length>=MIN_DAYS){
      const sRate=halvesRate(segmentTrendSeries(post));
      if(sRate!=null){
        const sAvg=seg.cals.reduce((a,v)=>a+v,0)/seg.cals.length;
        const sLearned=sAvg-sRate/7*3500;
        return {ok:true, days:seg.cals.length, span:Math.round(postSpan), avg:Math.round(sAvg),
                rateWk:Math.round(sRate*100)/100, learned:Math.round(sLearned), value:Math.round(sLearned),
                partial:seg.partial, logged:seg.logged||0, shift:shiftD, algo:"v5-shift"};
      }
    }
    return {ok:false, reason:"shift", days:seg.cals.length, span:Math.round(postSpan),
            partial:seg.partial, logged:seg.logged||0, shift:shiftD};
  }
  if(cals.length<MIN_DAYS||rawInWin.length<2||spanD<MIN_SPAN)
    return {ok:false, reason:"data", days:cals.length, span:Math.round(spanD), partial, logged};
  const rateWk=halvesRate(wpts);
  if(rateWk==null) return {ok:false, reason:"data", days:cals.length, span:Math.round(spanD), partial, logged};
  const avg=cals.reduce((a,v)=>a+v,0)/cals.length;
  const learned=avg-rateWk/7*3500; /* energy balance: surplus (gain) subtracts, deficit (loss) adds back */
  return {ok:true, days:cals.length, span:Math.round(spanD), avg:Math.round(avg),
          rateWk:Math.round(rateWk*100)/100, learned:Math.round(learned),
          value:Math.round(learned), partial, logged};
}
/* Recompute the learned estimate and its provenance record. Returns true when the
   applied value moved. Never writes maintenance itself — commitGoals does that. */
function refreshAdaptive(){
  const g=S.goals, r=adaptiveCalc();
  if(!r.ok){
    /* HOLD: thin data keeps the last good value and flags it stale */
    if(g.adaptive&&g.adaptive.ok){ g.adaptive.stale=true;
      /* v5: a level-shift hold says WHY it is holding and since when */
      g.adaptive.shiftHold = r.reason==="shift" ? {shift:r.shift, span:r.span||0} : null; }
    else g.adaptive={ok:false, reason:r.reason, days:r.days||0, span:r.span||0, partial:r.partial||0, logged:r.logged||0, updated:todayStr(), shift:r.shift||null};
    return false;
  }
  /* ONE number (2026.10.13-c, Jay's call): the applied value IS the learned value.
     An earlier ±150-per-refresh cap made the headline lag the computed estimate
     (stored 2,055 → applied 2,205 while the note printed "Learned 2,319") — two
     numbers for one thing reads as the app lying. Noise control lives on the
     input side now: 21-day aligned window, EWMA trend, 10-day coverage gates. */
  let v=Math.round(r.value);
  const prev=g.adaptive&&g.adaptive.value>0?g.adaptive.value:null;
  g.adaptive={ok:true, stale:false, value:v, learned:r.learned, avg:r.avg,
    rateWk:r.rateWk, days:r.days, span:r.span, partial:r.partial||0, logged:r.logged||0, updated:todayStr(), algo:r.algo||"v4-daily"};
  if(r.shift) g.adaptive.shift=r.shift; /* v5: this estimate measures the post-shift segment only */
  g.adaptiveHist=g.adaptiveHist||[];
  const last=g.adaptiveHist[g.adaptiveHist.length-1];
  if(!last||last.d!==todayStr()) g.adaptiveHist.push({d:todayStr(), v});
  if(g.adaptiveHist.length>26) g.adaptiveHist=g.adaptiveHist.slice(-26);
  g.adTuneNote="Adaptive TDEE "+todayStr()+": estimate "+v.toLocaleString()+" kcal from your trend (info only — your Calorie Goal uses the profile formula)."; /* 2026.10.21-e (audit): refreshAdaptive no longer sets maintenance since the formula law */
  return prev==null||v!==prev;
}
function applyAdaptive(){
  refreshAdaptive();
  commitGoals("adaptive");
  paintAdaptive(); renderGoals(); renderDiary();
}
function paintAdaptive(){
  /* FORMULA LAW (2026.10.21-b): this line used to report the learned
     estimate's evidence. The goal is now the formula itself, so it shows the
     formula's inputs — the same numbers as the math table below it. */
  const g = S.goals, fg = g.formula || formulaGoal();
  paintFormulaTable(fg);
}
function paintFormulaTable(fg){
  const eq = document.getElementById("formulaEq"), tb = document.getElementById("formulaTable");
  if(!eq || !tb) return;
  fg = fg || formulaGoal();
  if(!fg){ eq.textContent = profileReady() ? "Add your stats below to see the math." : "Still needed: " + profileMissingText() + ". Nothing is calculated until your stats are complete."; tb.innerHTML = ""; return; }
  eq.textContent = fg.eq + " = " + fg.bmr.toLocaleString() + " kcal BMR  (" + fg.wKg + " kg — " + fg.weightSrc + ", " + fg.hCm + " cm, age " + fg.age + ")";
  tb.innerHTML = ACT_TIERS.map(t=>{
    const m = Math.round((fg.bmrRaw||fg.bmr)*t.pal), sel = t.key===fg.tier; /* same unrounded BMR commitGoals uses — table and goal always agree */
    return '<button type="button" data-k="' + t.key + '" style="display:flex;justify-content:space-between;align-items:center;width:100%;padding:8px 10px;margin:0 0 6px;border:1px solid var(--line);border-radius:10px;background:transparent;color:inherit;text-align:left;' + (sel ? 'border-color:var(--acc,#6c6cf4);font-weight:700' : '') + '">' +
      '<span>' + t.label + ' <span style="opacity:.6">× ' + t.pal + '</span></span>' +
      '<span>' + m.toLocaleString() + ' kcal' + (sel ? ' · yours' : '') + '</span></button>';
  }).join("");
  tb.querySelectorAll("button[data-k]").forEach(b=>b.onclick=()=>{
    commitGoalsInputs();
    S.goals.profile.activityKey = b.dataset.k;
    commitGoals("activity");
    renderGoals(); renderDiary();
  });
}
function syncWeightFromLog(newLb, dateStr){
  const p = S.goals.profile;
  const sw = sortedWeights(), latest = sw.length ? sw[sw.length-1] : null;
  /* backdated entries must not rewind the profile weight — it tracks the latest weigh-in */
  const effW = (!latest || dateStr>=latest.d) ? newLb : latest.w;
  const changed = Math.abs(effW - (p.weightLb||0)) >= 0.05;
  p.weightLb = effW;
  let tuned = false;
  /* 2026.11.25-c: every weigh-in (including backdated ones, which change the
     7-day average) re-derives maintenance + surplus + macros together, right
     away. This used to hinge on profile.auto — off by default with no switch
     in the app — so BMI and protein moved on a weigh-in while calories waited
     for the next day's background refresh. Food plays no part. */
  if(effW>0){
    const before = goalTotal();
    commitGoals("weight");
    tuned = goalTotal()!==before;
    if(changed || tuned) S.goals.autoNote = "Weighed "+wDisp(newLb)+" "+wUnit()+" on "+dateStr+" — your goal uses your "+goalWeight().src+" ("+wDisp(goalWeight().lb).toFixed(1)+" "+wUnit()+").";
  }
  return tuned;
}
/* ============ GOALS: collapsible sections + info buttons ============ */
/* Goals section explainers shown behind the ⓘ buttons */
function infoContent(k){
  if(k==="goaldetail"){
    const g = S.goals, fg = g.formula || formulaGoal(), tot = goalTotal();
    if(!fg || !(tot>0)) return {t:"Your calorie goal", b:`<div class="irow">Add your sex, age, height and weight in <b>Your stats</b> and your goal is calculated from them — never from your food log.</div>`};
    const s2 = g.surplus>0 ? g.surplus : 0;
    const proj = s2>0 ? "\u2248 +" + (s2*7/3500).toFixed(2) + " lb/week at this surplus" : "At maintenance — no surplus";
    return {t:"Your calorie goal", b:
      `<div class="irow"><b>Maintenance:</b> ${Math.round(g.maintenance).toLocaleString()} kcal</div>
       <div class="irow"><b>Surplus:</b> +${Math.round(s2).toLocaleString()} kcal</div>
       <div class="irow"><b>Daily goal:</b> ${Math.round(tot).toLocaleString()} kcal \u00b7 ${proj}</div>
       <div class="irow"><b>How:</b> BMR ${fg.bmr.toLocaleString()} \u00d7 ${fg.pal} (${fg.tierLabel}) at ${(+fg.weightLb).toLocaleString()} lb \u2014 ${fg.eq}.</div>
       <div class="irow">Your food log never moves this number. It changes only when your weight or stats change.</div>`};
  }
  if(k==="athlete" || k==="engine") return {t:"How your number works", b:
    `<div class="irow"><b>From your stats, nothing assumed.</b> Maintenance = your BMR × your activity multiplier. BMR is Mifflin-St Jeor from your sex, age, height and weight — or Katch-McArdle (lean mass) if you enter body fat. Until all five of sex, age, height, weight and activity are filled in, no number is shown at all.</div>
     <div class="irow"><b>Your weigh-ins keep it current.</b> The weight used is the average of your weigh-ins over the 7 days ending at your latest one, so one salty or dehydrated morning can't move your targets. Every new weigh-in recalculates everything right away. Night weigh-ins are kept separate and never move it.</div>
     <div class="irow"><b>Your age keeps up.</b> Age counts up each year from the day you entered it.</div>
     <div class="irow"><b>Your food log never changes the goal.</b> The Calorie Check on Progress compares your weight trend with your target and can suggest a change — it only applies one if you tap it.</div>
     <div class="irow"><b>Gain rate:</b> adds the surplus on top — rate × 500 kcal (so +1.5 lb/wk = +750). Maintain adds nothing.</div>
     <div class="irow"><b>Macros:</b> protein 2.2 g/kg of that same weight, fat 25% of the goal, carbs fill the rest (or your own split) — re-derived every time the goal changes.</div>`};
  /* 2026.09.22-h: Progress insight rows open their evidence here */
  if(k.indexOf("insight:")===0){
    const ik = k.slice(8);
    const map = {adh:insightAdherenceVsTrend, pro:insightProteinVsTrend, tired:insightWaterVsTired, train:insightTrainingWeek, bloat:insightSodiumVsBloat};
    const fn = map[ik]; if(!fn) return null;
    const r = fn(); if(!r) return null;
    return {t: r.title, b: `<div class="irow">${esc(r.copy)}</div><div class="irow">${r.ev}</div>`};
  }
  if(k==="activity") return {t:"Activity level", b:
    `<div class="irow">Your activity pick <b>is the multiplier</b> on your BMR: maintenance = BMR × 1.2 (Sedentary) up to × 1.9 (Extra active). It also sets your water target. Nothing is assumed — no goal is calculated until you pick one.</div>
     <div class="irow"><b>Sedentary:</b> little or no exercise. <b>Light:</b> exercise 1-3 times/week. <b>Moderate:</b> 4-5 times/week. <b>Active:</b> daily or intense 3-4 times/week. <b>Very active:</b> intense 6-7 times/week. <b>Extra active:</b> very intense daily, or a physical job.</div>`};
  if(k==="calorie") return {t:"Daily number", b:
    `<div class="irow">The big number is what to eat today: <b>maintenance</b> (your BMR × activity, from your stats and weigh-ins) <b>+ your surplus</b>. It is a check-in, not a target to beat — eat it and let the trend judge.</div>
     <div class="irow"><b>Maintain:</b> surplus 0 — eat at maintenance to hold your weight.</div>
     <div class="irow"><b>+0.5 / +1.0 / +1.5 lb/wk:</b> adds 250 / 500 / 750 kcal. Research (Helms 2023) puts useful muscle gain near 0.25-0.5% of body weight per week — bigger surpluses mostly add fat.</div>`};
  if(k==="macros") return {t:"Macros", b:
    `<div class="irow"><b>Protein:</b> muscle gains top out near <b>1.6 g/kg/day</b> (Morton 2018 meta-analysis); up to <b>2.2 g/kg</b> (1 g/lb) is the supported ceiling. No per-meal maximum — large protein meals are still used (Trommelen 2023); spread 0.3–0.4 g/kg across 3–5 meals.</div>
     <div class="irow"><b>Auto:</b> protein 2.2 g/kg of body weight, fat 25% of your calorie goal, carbs fill the rest — re-derived every time your goal changes.</div>`};
  if(k==="water"){
    const w = waterCalc();
    if(w.unset) return {t:"Water target", b:
    `<div class="irow"><b>Auto</b> needs your maintenance first — it is calculated from your stats on the Calorie Goal page.</div>
`};
    const pk = w.perKcal.toFixed(2).replace(/0+$/,"").replace(/\.$/,"");
    return {t:"Water target", b:
    `<div class="irow"><b>Auto</b> builds your target from maintenance: <b>${w.target*8} oz (${w.target} glasses)</b> = ${Math.round(w.tdee).toLocaleString()} kcal × ${w.tier} activity at ${pk} mL/kcal.</div>
     <div class="irow">The formula follows the <b>IOM</b> guideline of ~1.0–1.2 mL per kcal of energy expenditure, with ~80% of total water assumed to come from fluids (IOM AI: 3.7 L men / 2.7 L women; EFSA: 2.5 L / 2.0 L).</div>
     <div class="irow"><b>Creatine:</b> no extra water needed — controlled trials show creatine does <b>not</b> cause dehydration (ISSN, Kreider 2017). The "needs extra water" toggle is for other supplements (e.g. fiber).</div>`};
  }
  if(k==="advanced") return {t:"Advanced", b:
    `<div class="irow"><b>Always on:</b> every weigh-in and every stats change recalculates maintenance, macros, water and nutrient targets together, immediately.</div>
     <div class="irow">BMR formulas are about ±10% for an individual — your weigh-in trend is the check. If the scale disagrees with your target for 2+ weeks, the Calorie Check on Progress offers a ±150 kcal adjustment for you to approve.</div>`};
  if(k==="scores") return {t:"Energy & bloat", b: scoreInfoHTML()};
  if(k==="badges") return {t:"Food badges", b:
    `<div class="irow">The three dots under every food name say what the food is good for — a colored dot means yes, gray means no.</div>
     <div class="irow"><b style="color:#22c55e">●</b> <b>Bulk</b> — energy-dense food that helps you hit your surplus (under 35% of its calories from protein).</div>
     <div class="irow"><b style="color:#3b82f6">●</b> <b>Lean</b> — protein-forward (30%+ of calories from protein, under 35% from fat).</div>
     <div class="irow"><b style="color:#f59e0b">●</b> <b>Fiber</b> — 3g+ fiber per serving, keeps digestion moving on a bulk.</div>`};
  if(k==="schedule") return {t:"Work schedule", b:
    `<div class="irow"><b>Settings › Work schedule</b> sets which weekdays are work days — tap a day to select it, flip the switch to mark it work or off. Meal times are learned <b>separately</b> for work days and days off, so your "usual lunch" follows the right schedule.</div>
     <div class="irow">Past meal times keep the schedule they were learned under. The Work day / Day off pill on the diary is a one-day override — it never changes the weekly schedule.</div>
     <div class="irow"><b>Overdue nudge:</b> when a meal runs 1.5+ hours past your usual time for that day type (with 5+ logged days behind it) and you haven't logged it yet, a quiet banner appears at the top of the diary.</div>`};
  if(k==="wtgoal") return {t:"Weight goal", b:
    `<div class="irow">The bar measures your run from the <b>starting point</b> (your weight when the goal was set) to the goal — the % is how much of that run is done.</div>
     <div class="irow">Pace comes from your weigh-ins (halves-by-date rate). Daily weight swings ±1–2%, so <b>2+ weeks</b> of entries smooths the noise — judge the trend, not any single day.</div>
     <div class="irow">A manual weight edit in Goals › Profile becomes today's weigh-in, so the goal bar always tracks the same number as Progress.</div>`};
  if(k==="milestone") return {t:"1-month milestone", b:
    `<div class="irow">${MS_EV||"Log weigh-ins and set your calorie goal and this explains the suggested milestone."}</div>`};
  if(k==="bmi") return {t:"BMI", b:
    `<div class="irow">${BMI_CTX||"Add your height and weight to see your BMI analysis."}</div>
     <div class="irow"><b>Healthy range</b> uses WHO BMI 18.5–24.9 for your height. BMI is a screening tool, not a diagnosis — it can't separate muscle from fat.</div>`};
  if(k==="calcheck") return {t:"How this checks your target", b:
    `<div class="irow">Needs <b>4+ weigh-ins spanning 2+ weeks</b>. It splits the span into halves by date and compares the average weight of each half — that gives your real %/week against the target band (0.25–0.5%/week for lean gains).</div>
     <div class="irow">If you're clearly off-target and it's been 3+ weeks since the last tune, Fuel can nudge maintenance ±150 kcal — at most once every 2 weeks, and only with your tap.</div>`};
  if(k==="waterinfo") return {t:"Water target", b:
    `<div class="irow"><b>Auto</b> builds your target from maintenance + activity (<b>IOM 1.0–1.5 mL/kcal</b>) — that's the glasses count next to the title. Tap a bottle to log it.</div>
     <div class="irow">A supplement you flag <b>"needs extra water"</b> adds 16 oz — creatine needs no extra water (ISSN 2017). Set a manual target any time in Goals › Water.</div>`};
  if(k==="streakinfo") return {t:"Streaks", b:
    `<div class="irow">Tap a circle to set the <b>last day</b> you vaped or drank — the count is full days since that date, figured from the real calendar.</div>
     <div class="irow">The ring <b>fills toward 30 days clean</b> — its color blends smoothly through the phases as you build the streak: <b style="color:#ef4444">red</b> → <b style="color:#f97316">orange</b> → <b style="color:#eab308">yellow</b> → <b style="color:#3b82f6">blue</b> → <b style="color:#22c55e">green</b> (nicotine) or <b style="color:#14b8a6">teal</b> → <b style="color:#10b981">emerald</b> → <b style="color:#15803d">deep green</b> (alcohol).</div>
     <div class="irow">Slipped? Reset that streak below — the count just restarts.</div>
     <div class="slipline"><b>Nicotine</b><button class="slipbtn" data-slip="nicotine">Log a slip</button></div>
     <div class="slipline"><b>Alcohol</b><button class="slipbtn" data-slip="alcohol">Log a slip</button></div>`};
  if(k==="nicphase") return {t:"Nicotine phases", b:
    `<div class="irow phrow"><span class="pdot" style="background:#ef4444"></span><span><b>The first 3 days · Peak withdrawal</b><span>Nicotine fully leaves your body (~72h). Cravings hit hardest around day 2–3 — the worst of it, and the shortest part (Cleveland Clinic; NCI).</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#f97316"></span><span><b>Days 4–14 · Easing off</b><span>Physical symptoms fade over 1–2 weeks. Cravings still come in waves, but each one passes in minutes whether you act on it or not.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#eab308"></span><span><b>Days 15–30 · Rewiring</b><span>Most symptoms gone. Your brain is relearning routines — coffee, breaks, stress — without nicotine.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#22c55e"></span><span><b>Day 31+ · New normal</b><span>Cravings rare and brief. Sleep looks like a never-smoker's again. Typical timeline — everyone differs.</span></span></div>`};
  if(k==="alcphase") return {t:"Alcohol phases", b:
    `<div class="irow phrow"><span class="pdot" style="background:#ef4444"></span><span><b>The first 2 days · Clearing out</b><span>Hangover fades as your body clears the alcohol and rehydrates. Rough, but it's short.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#f97316"></span><span><b>Days 3–7 · Recalibrating</b><span>Sleep architecture resets — vivid dreams are normal (REM rebound). Digestion and hydration settle.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#eab308"></span><span><b>Days 8–30 · Repairing</b><span>Sleep quality climbs, liver fat drops, skin clears, energy steadies. Mornings start feeling different.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#22c55e"></span><span><b>Day 31+ · Thriving</b><span>Blood pressure eases down. Clear mornings become the baseline, not the exception. Typical timeline — everyone differs.</span></span></div>`};
  if(k==="quitnic") return {t:"Nicotine phases", b:
    `<div class="irow phrow"><span class="pdot" style="background:#ef4444"></span><span><b>First 24 hours · Onset</b><span>Blood nicotine halves in ~2 hours; heart rate and blood pressure begin settling. First urges within 1–2 hours.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#f97316"></span><span><b>Days 2–3 · The Peak</b><span>Strongest cravings; nicotine fully clears by ~72h. Day 3 is widely the single hardest day.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#eab308"></span><span><b>Days 4–7 · Wind-down</b><span>Cravings shorter and less frequent. Watch the day 7–8 overconfidence trap (“just one”).</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#3b82f6"></span><span><b>Weeks 2–4 · Easing</b><span>Physical symptoms mostly gone; circulation matches a nonsmoker by 2 weeks. Week 3 is the thought-trigger danger zone.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#22c55e"></span><span><b>Days 30–90 · Consolidation</b><span>Rare, brief cue-triggered cravings. Dopamine function normalizes by ~3 months. Month-3 “blahs” can ambush.</span></span></div>
     <div class="irow">Full detail per phase lives in <b>Quit tracker › Timeline</b>.</div>`};
  if(k==="quitlung") return {t:"Lung healing", b:
    `<div class="irow">Your lungs' progress toward fully healed — the small ring on your nicotine circle. 100% = 90 days: lung function substantially recovered, cilia restored.</div>
     <div class="irow phrow"><span class="pdot" style="background:#fca5a5"></span><span><b>12 hours · 10%</b><span>Carbon monoxide back to normal.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#f87171"></span><span><b>3 days · 20%</b><span>Cilia starting to regrow; breathing eases.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#dc2626"></span><span><b>2 weeks · 40%</b><span>Lung function measurably improving.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#b91c1c"></span><span><b>1 month · 60%</b><span>Healing well underway.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#15803d"></span><span><b>6 weeks · 75%</b><span>Coughing and wheezing fading.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#16a34a"></span><span><b>2 months · 88%</b><span>Almost there.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#86efac"></span><span><b>90 days · 100%</b><span>Lung function substantially recovered, cilia restored. Typical timeline — everyone differs.</span></span></div>`};
  if(k==="quitliver") return {t:"Liver healing", b:
    `<div class="irow">Your liver's progress toward fully healed — the small ring on your alcohol circle. For a social drinker: 100% = 90 days.</div>
     <div class="irow phrow"><span class="pdot" style="background:#fca5a5"></span><span><b>Day 1 · 10%</b><span>Liver inflammation dropping; body rehydrating.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#f87171"></span><span><b>Day 7 · 25%</b><span>Sleep improving; mornings getting better.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#dc2626"></span><span><b>Day 14 · 45%</b><span>Liver enzymes normalizing.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#15803d"></span><span><b>Day 30 · 65%</b><span>Liver fat down; weight dropping.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#16a34a"></span><span><b>Day 42 · 80%</b><span>Repair well underway.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#86efac"></span><span><b>Day 90 · 100%</b><span>Liver substantially repaired. Typical timeline — everyone differs.</span></span></div>`};
  if(k==="quitalc") return {t:"Alcohol-free phases", b:
    `<div class="irow phrow"><span class="pdot" style="background:#14b8a6"></span><span><b>Days 1–7 · Reset</b><span>Liver inflammation drops within 24h; body rehydrates. Sleep briefly unsettled, then better mornings.</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#10b981"></span><span><b>Days 8–30 · Visible repair</b><span>REM sleep normalizes; liver enzymes normalize ~2 weeks; sharper thinking ~18 days. One month off: weight −1.5%, insulin resistance −25.9% (Mehta 2018).</span></span></div>
     <div class="irow phrow"><span class="pdot" style="background:#15803d"></span><span><b>Days 31–90 · Deep healing</b><span>Deeper sleep, steadier energy, dopamine systems recover, fatty liver keeps reversing.</span></span></div>
     <div class="irow">Full detail per phase lives in <b>Quit tracker › Timeline</b>.</div>`};
  if(k==="nutrients") return {t:"Nutrient targets", b:
    `<div class="irow">Combined from everything logged today. Tap a nutrient to set your own daily target.</div>
     <div class="irow"><b>No targets until your profile is complete</b> (Calorie Goal › Your stats). Then every vitamin and mineral uses the official <b>RDA or AI for your sex and age</b> (NIH / NASEM Dietary Reference Intakes, adults 19+).</div>
     <div class="irow"><b>From your goal:</b> fiber is 14 g per 1,000 kcal; saturated fat and added sugars are capped at 10% of your calorie goal each (Dietary Guidelines 2020–2025). <b>Potassium</b> uses the NASEM 2019 adequate intake, <b>sodium</b> the 2,300 mg limit.</div>
     <div class="irow">A target you set yourself always wins. "Reset to FDA defaults" clears your own targets and goes back to these personal ones.</div>`};
  if(k==="energy") return {t:"Energy check-in", b:
    `<div class="irow">One tap a day, 1–5. Tap again to clear it.</div>
     <div class="irow">This is the <b>only logged energy series</b> — next-day energy correlations run on these check-ins, never on the computed tired model.</div>
     <div class="irow">After a few weeks of daily taps, Progress insights can show what actually moves your next-day energy.</div>`};
  if(k==="medals") return {t:"Medals", b:
    `<div class="irow">Every day brings <b>3 featured medals</b> — one easy, one medium, one hard — picked by date, so the set is different each day.</div>
     <div class="irow">Earn all 3 in a day and they merge into the <b>Daily Crown</b>, which you can earn again every day.</div>
     <div class="irow"><b>Lifetime medals</b> (streaks, all-time volumes, firsts) are always being chased quietly in the background — already-earned ones were banked silently, no fanfare storm.</div>
     <div class="irow">The full collection lives in <b>Settings › Medal case</b>, grouped by rarity. Tap any medal for its details and progress.</div>`};
  if(k==="snapshots") return {t:"Automatic snapshots", b:
    `<div class="irow">One best-effort snapshot of your data is saved each day you log something, under a separate storage key.</div>
     <div class="irow">Snapshots stay under ~4 MB total and silently skip before they can ever crowd out your real data — they protect against <b>in-app data corruption</b>, not a lost phone or cleared browser data.</div>
     <div class="irow">For a real off-phone backup, use <b>Settings › Export my data (JSON)</b> and keep the file somewhere safe.</div>`};
  if(k==="insights") return {t:"Progress insights", b:
    `<div class="irow">Correlation-style readouts from your own log — adherence vs weight trend, protein vs trend, water vs tiredness, training weeks, sodium vs bloat.</div>
     <div class="irow">They need a few weeks of consistent logging before they say anything useful, and they're <b>estimates, not medical advice</b> — sleep, stress, and illness matter too, and the app can't see those.</div>`};
}
function openInfo(k){
  const c = infoContent(k); if(!c) return;
  document.querySelectorAll(".sheet.open").forEach(x=>x.classList.remove("open")); /* 2026.10.09-h: never open under another sheet */
  document.getElementById("infoTitle").textContent = c.t;
  document.getElementById("infoBody").innerHTML = c.b;
  document.getElementById("infoSheet").classList.add("open");
}
function openGsec(name){
  document.querySelectorAll("#view-goals .gsec").forEach(s=>{
    const t = s.querySelector(".ghead span").textContent;
    if(t===name) s.classList.remove("closed");
  });
}
/* collapsible goal sections: tap the header to fold; open state persists */
document.querySelectorAll("#view-goals .gsec").forEach(s=>{
  s.querySelector(".ghead").onclick=()=>{
    s.classList.toggle("closed");
    try{
      const open=[...document.querySelectorAll("#view-goals .gsec:not(.closed)")].map(x=>x.id);
      localStorage.setItem("fuel_goals_secs", JSON.stringify(open));
    }catch(e){}
  };
});
try{
  const gsOpen=JSON.parse(localStorage.getItem("fuel_goals_secs")||"null");
  if(Array.isArray(gsOpen)) document.querySelectorAll("#view-goals .gsec").forEach(s=>s.classList.toggle("closed", !gsOpen.includes(s.id)));
}catch(e){}
/* ============ INFORMATION INDEX (2026.09.24-f) ============
   Every explainer lives in infoContent(); this index groups them so the app
   surface stays clean of paragraphs. ⓘ buttons next to main titles land here. */
const INFO_CATS = [
  {id:"diary",    label:"Diary & logging",  keys:["waterinfo","streakinfo","nicphase","alcphase","energy","scores","badges","schedule"]},
  {id:"goals",    label:"Goals & targets",  keys:["activity","calorie","macros","water","advanced"]},
  {id:"progress", label:"Progress & insights", keys:["wtgoal","milestone","bmi","calcheck","insights"]},
  {id:"nutrients",label:"Nutrients",        keys:["nutrients"]},
  {id:"medals",   label:"Medals",           keys:["medals"]},
  {id:"data",     label:"Data & backups",   keys:["snapshots"]},
];
let infoCat = "diary";
function renderInfo(cat){
  if(cat) infoCat = cat;
  const catsEl = document.getElementById("infoCats");
  if(!catsEl) return;
  catsEl.innerHTML = INFO_CATS.map(c=>`<button class="icat${c.id===infoCat?" sel":""}" data-cat="${c.id}">${esc(c.label)}</button>`).join("");
  catsEl.querySelectorAll(".icat").forEach(b=>b.onclick=()=>renderInfo(b.dataset.cat));
  const c = INFO_CATS.find(x=>x.id===infoCat) || INFO_CATS[0];
  document.getElementById("infoListLabel").textContent = c.label;
  const list = document.getElementById("infoList");
  list.innerHTML = "";
  c.keys.forEach(k=>{
    let entry = null;
    try{ entry = infoContent(k); }catch(e){ entry = null; }
    if(!entry) return;
    const b = document.createElement("button");
    b.className = "irow2";
    b.innerHTML = `<span>${esc(entry.t)}</span><span class="chev2">›</span>`;
    b.onclick = ()=>openInfo(k);
    list.appendChild(b);
  });
}
/* ⓘ next to a main title guides here, at the matching category */
function gotoInfoCat(cat){ infoCat = cat; showView("info"); }
document.getElementById("infoRow").onclick = ()=>gotoInfoCat("diary");
document.getElementById("infoBack").onclick = ()=>showView(viewReturn);
document.getElementById("diaryInfo").onclick = ()=>gotoInfoCat("diary");
document.getElementById("analysisInfo").onclick = ()=>gotoInfoCat("diary");
document.getElementById("progressInfo").onclick = ()=>gotoInfoCat("progress");
document.getElementById("goalsInfo").onclick = ()=>openInfo("goaldetail");
document.getElementById("energyInfo").onclick = ()=>openInfo("energy");
document.getElementById("snapInfo").onclick = ()=>openInfo("snapshots");
document.getElementById("medalCaseInfo").onclick = ()=>gotoInfoCat("medals");
function addDays(ds, n){ const d = new Date(ds+"T12:00:00"); d.setDate(d.getDate()+n); return dstr(d); }
function trainDay(ds){
  const t = S.training || (S.training = {sched:{}, done:{}});
  const wd = new Date(ds+"T12:00:00").getDay();
  const dn = t.done[ds];
  if(dn) return {train:true, split:dn.split, done:true};
  const plan = t.sched[wd];
  if(plan) return {train:true, split:plan.split, done:false};
  return {train:false};
}
/* deload tracking: consecutive weeks (Sun-start) with 4+ completed sessions */
/* ============ MUSCLE GAIN ESTIMATE ============
   Only a scan (DEXA etc.) truly measures muscle, so this is an honest estimate:
   weight gained x an estimated lean share. Lean share starts at 0.45 for a lean
   bulk and moves with logged data: surplus <=20% over maintenance (+0.10),
   protein >= 1.6 g/kg (Morton et al. 2018, +0.10), 3+ sessions/week (+0.10);
   a big surplus pushes the other way (-0.10). Clamped to [0.25, 0.70].
   Realistic beginner rate: ~0.5-1.5 lb muscle/month (Aragon/Helms models). */
function muscleStats(){
  const ws = (S.weights||[]).slice().sort((a,b)=>a.d<b.d?-1:1);
  if(ws.length < 4) return {ok:false, why:"Log your weight for 2+ weeks (at least 4 weigh-ins) and this estimates muscle gained from your logged food, protein, and training."};
  const T = p => new Date(p.d+"T12:00:00").getTime();
  const spanD = Math.round((T(ws[ws.length-1])-T(ws[0]))/86400000);
  if(spanD < 14) return {ok:false, why:"Need weigh-ins spanning 2+ weeks ("+spanD+"d so far). Daily weight swings ±1–2%, so 2–3 weeks reveals the real trend."};
  const mid = (T(ws[0])+T(ws[ws.length-1]))/2;
  const early = ws.filter(p=>T(p)<=mid), recent = ws.filter(p=>T(p)>mid);
  if(early.length<2 || recent.length<2) return {ok:false, why:"Log a couple more weigh-ins spread across the 2 weeks so both halves have data."};
  const avgW = a => a.reduce((x,p)=>x+p.w,0)/a.length, avgT = a => a.reduce((x,p)=>x+T(p),0)/a.length;
  const dW = avgW(recent)-avgW(early), weeks = (avgT(recent)-avgT(early))/86400000/7, wAvg = (avgW(early)+avgW(recent))/2;
  /* logged food over the span */
  const goal = goalTotal(), maint = S.goals.maintenance>0 ? S.goals.maintenance : goal;
  let calSur = 0, prot = 0, n = 0;
  for(let i=0;i<=spanD;i++){ const t = totals(addDays(ws[0].d, i)); if(t.cal>0){ n++; calSur += t.cal-goal; prot += t.p; } }
  const avgSurPct = (n && maint>0) ? (calSur/n)/maint*100 : 0;
  const protPerKg = (n && wAvg>0) ? (prot/n)/(wAvg/2.20462) : 0;
  let sess = 0;
  for(const k in S.training.done) if(k>=ws[0].d && k<=ws[ws.length-1].d) sess++;
  const sessWk = weeks>0 ? sess/weeks : 0;
  let lean = 0.45;
  if(avgSurPct>0 && avgSurPct<=20) lean += 0.10;
  else if(avgSurPct>20) lean -= 0.10;
  if(protPerKg>=1.6) lean += 0.10;
  if(sessWk>=3) lean += 0.10;
  lean = Math.min(0.70, Math.max(0.25, lean));
  const muscle = Math.max(0, dW)*lean;
  return {ok:true, dW, weeks, muscle, fat:Math.max(0,dW)-muscle, lean, avgSurPct, protPerKg, sessWk, n, rateMo: weeks>0 ? muscle/weeks*4.33 : 0};
}
function paintMuscle(){
  const ring = document.getElementById("muscleArc"), num = document.getElementById("muscleNum"), out = document.getElementById("muscleOut");
  const goal = S.goals.muscleGoal||0; /* blank slate: honest zero, no hidden 4 lb default */
  const wu = wUnit();
  const wd = v => wDisp(v).toFixed(1);
  document.getElementById("muscleGoalLbl").textContent = goal>0 ? wd(goal)+" "+wu : "Set goal";
  const mrv = document.getElementById("muscleRowVal"), mrg = document.getElementById("muscleRowGoal");
  if(mrv) mrv.textContent = "–";
  if(mrg) mrg.textContent = goal>0 ? "Goal "+wd(goal)+" "+wu : "Estimated gain — set a goal";
  const C = 2*Math.PI*52, st = muscleStats();
  if(!st.ok){ ring.setAttribute("stroke-dasharray","0 "+C); num.textContent = "–"; out.textContent = st.why; return; }
  ring.setAttribute("stroke-dasharray", (goal>0?Math.min(1,st.muscle/goal)*C:0)+" "+C);
  num.textContent = wd(st.muscle);
  if(mrv) mrv.textContent = wd(st.muscle)+" "+wu;
  const f1 = v => (v>=0?"+":"")+wd(v);
  let h = "Scale: <b>"+f1(st.dW)+" "+wu+"</b> over "+Math.max(2,Math.round(st.weeks))+" wks<br>";
  h += "Est. muscle: <b>"+f1(st.muscle)+" "+wu+"</b> · est. fat: "+wd(st.fat)+" "+wu+"<br>";
  h += "<span style=\"color:var(--muted)\">Lean share "+Math.round(st.lean*100)+"% — surplus "+st.avgSurPct.toFixed(0)+"%, protein "+st.protPerKg.toFixed(1)+" g/kg, "+st.sessWk.toFixed(1)+" sessions/wk.</span><br>";
  if(st.rateMo>0){
    if(goal<=0){ h += "Set a muscle goal above to track against it."; }
    else {
      const eta = st.muscle<goal ? Math.ceil((goal-st.muscle)/(st.rateMo/4.33)) : 0;
      h += st.muscle>=goal ? "<b style=\"color:var(--green)\">Goal hit.</b> Set a bigger one."
        : "Pace: <b>"+wd(st.rateMo)+" "+wu+"/mo</b> — realistic for a beginner is 0.5–1.5 "+wu+"/mo."+(eta>0?" At this pace the goal lands in ~"+eta+" wk"+(eta>1?"s":"")+".":"");
    }
  } else h += "Not gaining yet — the scale has to move up first.";
  out.innerHTML = h;
}
function openMuscleInfo(){
  document.getElementById("infoTitle").textContent = "Muscle estimate";
  document.getElementById("infoBody").innerHTML =
    `<div class="irow"><b>An honest estimate, not a measurement.</b><br><span style="color:var(--muted)">Only DEXA or similar truly measures muscle. This takes your scale trend and multiplies it by an estimated lean share.</span></div>`+
    `<div class="irow"><b>Lean share starts at 45%.</b><br><span style="color:var(--muted)">It rises when your logged surplus stays at or under 20% over maintenance, protein hits 1.6 g/kg/day (Morton et al. 2018), and you train 3+×/week — the behaviors research ties to leaner gains.</span></div>`+
    `<div class="irow"><b>Realistic pace: 0.5–1.5 lb/month</b><br><span style="color:var(--muted)">for a beginner (Aragon/Helms models). No hidden default — set your own goal with the button above (4 lb is about 3–4 months of solid beginner gains). Weigh-ins are the real answer.</span></div>`;
  document.getElementById("infoSheet").classList.add("open");
}
const MEDAL_DEFS = [
  {id:"silver", name:"Silver", color:"#a9b0c2", desc:"Hit your maintenance calories for the day."},
  {id:"bronze", name:"Bronze", color:"#cd7f32", desc:"Log all three meals: breakfast, lunch, and dinner."},
  {id:"gold", name:"Gold", color:"#f2b705", desc:"Hit your full daily target — maintenance plus surplus."},
  {id:"maxdiamond", name:"Max Diamond", color:"#5ec8f2", chroma:true, desc:"Go 1% over your 100% daily goal. All medals combine into one diamond award."}
];

/* ================= MEDAL COLLECTION SYSTEM (2026.09.24) =================
   Research-backed design — variable rewards, streaks + loss aversion,
   visible progress, collection/completionism, tiered rarity, PRs vs self:
   - 100+ medals in 5 rarity tiers (Common -> Legendary), each with its own
     gradient + glint animation. Still called medals.
   - Every day gets 3 featured daily medals, seeded by date so they're
     different each day. Earn all 3 -> they merge into the Daily Crown.
   - Lifetime medals (streaks, volumes, firsts) are always being chased in
     the background. Everything earned lands in the medal case on the profile.
   ========================================================================= */
const RARITY = {
  common:   {label:"Common",    g:["#a7b0c0","#6b7280"]},
  uncommon: {label:"Uncommon",  g:["#34d399","#059669"]},
  rare:     {label:"Rare",      g:["#60a5fa","#2563eb"]},
  epic:     {label:"Epic",      g:["#c084fc","#7c3aed"]},
  legendary:{label:"Legendary", g:["#fbbf24","#f59e0b","#f43f5e"]},
};
const RORDER = ["common","uncommon","rare","epic","legendary"];
/* white 24x24 glyphs for the badge centers (no emoji in app UI) */
const GLYPHS = {
  target:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="12" cy="12" r="1.9"/>',
  bolt:'<path d="M13.5 2 5.5 13.5h5L10 22l8.5-11.5h-5.5z"/>',
  bowl:'<path d="M3.5 12.5h17c0 4.8-3.8 8-8.5 8s-8.5-3.2-8.5-8z"/><path d="M9 8.5c1.5-2 6-2 7.5-4.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M13.5 8.5c1.5-2 5-2 6.5-4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  drop:'<path d="M12 2.8c3.6 4.6 6.2 8.2 6.2 11.8a6.2 6.2 0 0 1-12.4 0C5.8 11 8.4 7.4 12 2.8z"/>',
  leaf:'<path d="M5 19C5 10.5 10 5.5 19 5c.5 9-4.5 14-14 14z"/>',
  grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  flame:'<path d="M12 2.5s5.5 5 5.5 10a5.5 5.5 0 0 1-11 0c0-2 1-3.8 2.2-5.2.4 1.2 1.2 2.2 2.3 2.7-.3-2.7.2-5.2 1-7.5z"/>',
  scale:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M12 12l3.6-4.2" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="12" r="1.6"/>',
  chart:'<rect x="4" y="12" width="4.2" height="8" rx="1.2"/><rect x="9.9" y="8" width="4.2" height="12" rx="1.2"/><rect x="15.8" y="4" width="4.2" height="16" rx="1.2"/>',
  plus:'<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
  clock:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M12 7.5V12l3.4 2" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  camera:'<path d="M4 8.5h3l1.8-2.5h6.4L17 8.5h3A1.5 1.5 0 0 1 21.5 10v7.5a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 17.5V10A1.5 1.5 0 0 1 4 8.5z"/><circle cx="12" cy="13.8" r="3.4" fill="rgba(0,0,0,.35)"/>',
  flask:'<path d="M10 2.5h4V8l5.2 9.8a1.8 1.8 0 0 1-1.6 2.7H6.4a1.8 1.8 0 0 1-1.6-2.7L10 8z"/>',
  crown:'<path d="M3.5 16.5 2.5 7.5l5 3.4L12 4.5l4.5 6.4 5-3.4-1 9z"/><rect x="3.5" y="18" width="17" height="2.6" rx="1.3"/>',
  star:'<path d="M12 2.8l2.8 5.7 6.2.9-4.5 4.3 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.4l6.2-.9z"/>',
  heart:'<path d="M12 20.5S3.8 14.8 3.8 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.2 2.8c0 5.4-8.2 11.1-8.2 11.1z"/>',
  sun:'<circle cx="12" cy="12" r="5"/><g stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/></g>',
  moon:'<path d="M20 14.8A8.6 8.6 0 0 1 9.2 4 8.6 8.6 0 1 0 20 14.8z"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2.5"/><rect x="6.6" y="11" width="10.8" height="6.4" rx="1.2" fill="rgba(0,0,0,.32)"/>',
  spark:'<path d="M12 2l2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1z"/>',
};
/* circular badge: rarity gradient ring, dark inner disc, white glyph */
let __mgN = 0; /* 2026.09.27-c: unique gradient id per badge instance — duplicate
   SVG def ids are invalid HTML and trip audits when a medal renders twice */
function medalBadge(md, earned){
  const r = RARITY[md.rarity] || RARITY.common;
  const cols = earned ? r.g : ["#d9d9e2","#b9b9c6"];
  const gid = "mg" + String(md.id||md.icon||"m").replace(/[^a-z0-9]/gi,"") + (++__mgN);
  const stops = cols.map((c,i)=>`<stop offset="${cols.length>1 ? (i/(cols.length-1)) : 0}" stop-color="${c}"/>`).join("");
  return `<svg width="48" height="48" viewBox="0 0 48 48"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs>`+
    `<circle cx="24" cy="24" r="22" fill="url(#${gid})"/>`+
    `<circle cx="24" cy="24" r="16.5" fill="${earned?"rgba(0,0,0,.30)":"#f0f0f5"}"/>`+
    `<g transform="translate(14,14) scale(0.833)" fill="${earned?"#ffffff":"#c3c3d0"}">${GLYPHS[md.icon]||""}</g></svg>`;
}
/* ---------- data helpers for medal tests ---------- */
const FOOD_MEALS = ["breakfast","lunch","dinner","snacks"];
function mDayHasLog(ds){ const d=S.days[ds]; return !!(d && FOOD_MEALS.some(m=>((d.meals||{})[m]||[]).length>0)); }
function mNutrG(ds, canon){ /* grams of a nutrient for the day */
  const d=S.days[ds]; let v=0;
  if(d) FOOD_MEALS.forEach(m=>((d.meals||{})[m]||[]).forEach(e=>(e.nutrs||[]).forEach(x=>{
    if(canonNutr(x.n)===canon){ const u=String(x.u||"").toLowerCase(); v += u==="g"?x.amt : u==="mg"?x.amt/1000 : u==="mcg"?x.amt/1e6 : x.amt; }
  })));
  return v;
}
function mCalPct(ds){ const g=goalTotal(); return g>0 ? totals(ds).cal/g*100 : 0; }
function mStreak(pred){ /* consecutive days; today may still be in progress.
   2026.10.08-f: locked days are neutral skips — neither counted nor breaking. */
  let ds=todayStr(), n=0, guard=0;
  if(!pred(ds) && !isLocked(ds)) ds=addDays(ds,-1);
  for(;;){
    if(isLocked(ds)) ds=addDays(ds,-1);
    else if(pred(ds)){ n++; ds=addDays(ds,-1); }
    else break;
    if(++guard>1300) break;
  }
  return n;
}
function mWeekKey(ds){ const dt=new Date(ds+"T12:00:00"); const dow=(dt.getDay()+6)%7; const mon=new Date(dt); mon.setDate(dt.getDate()-dow); return mon.getFullYear()+"-"+String(mon.getMonth()+1).padStart(2,"0")+"-"+String(mon.getDate()).padStart(2,"0"); }
function mWeighWeekStreak(){
  const ws=new Set((S.weights||[]).map(w=>mWeekKey(w.d)));
  let n=0, cur=mWeekKey(todayStr());
  if(!ws.has(cur)) cur=mWeekKey(addDays(todayStr(),-7));
  while(ws.has(cur)){ n++; cur=mWeekKey(addDays(cur,-7)); if(n>300) break; }
  return n;
}
function mAllTime(){ let cal=0,p=0,woz=0,days=0,foods=new Set();
  for(const k in (S.days||{})){ if(isLocked(k)) continue; const dd=S.days[k]; if(!dd) continue; const t=totals(k); cal+=t.cal; p+=t.p; woz+=(dd.waterOz||0);
    if(mDayHasLog(k)) days++;
    FOOD_MEALS.forEach(m=>((dd.meals||{})[m]||[]).forEach(e=>foods.add((e.n||"").toLowerCase()))); }
  return {cal,p,woz,days,foods:foods.size};
}
function mDistinctFoods(ds){ const s=new Set(); const d=S.days[ds]; if(!d) return 0;
  FOOD_MEALS.forEach(m=>((d.meals||{})[m]||[]).forEach(e=>s.add((e.n||"").toLowerCase()))); return s.size; }
function mEntryHour(ds, h0, h1){ const d=S.days[ds]; if(!d) return false;
  return FOOD_MEALS.some(m=>((d.meals||{})[m]||[]).some(e=>{ if(!e.t) return false; const dt=new Date(e.t); const h=dt.getHours()+dt.getMinutes()/60; return h>=h0 && h<h1; })); }
function mPhotoCount(ds){ const d=S.days[ds]; let n=0; if(!d) return 0;
  FOOD_MEALS.forEach(m=>((d.meals||{})[m]||[]).forEach(e=>{ if(entryImg(e)) n++; })); return n; }
function mHasSupps(ds){ const d=S.days[ds]; return !!(d && ((d.meals||{}).supplements||[]).length>0); }
function mWaterPct(ds){ const t=waterTarget(ds)*8; return t>0 ? (S.days[ds]||{waterOz:0}).waterOz/t*100 : 0; }
function mLoggedDays(){ let n=0; for(const k in (S.days||{})) if(!isLocked(k) && mDayHasLog(k)) n++; return n; }
function fmtBig(n){ if(n>=1e6) return (n/1e6).toFixed(n%1e6?1:0)+"M"; if(n>=1e3) return (n/1e3).toFixed(n%1e3?1:0)+"k"; return String(Math.round(n)); }

/* ---------- catalog ---------- */
const MDEF = [];
function defMedal(o){ MDEF.push(Object.assign({kind:"daily", prog:null}, o)); return o; }
/* tiered builder: o = {id, name, cat, icon, kind, desc(v)->str, goal(v)->str,
   test(v)->bool, prog(v)->{v,t}|null, tiers:[[v, rarity], ...]} */
function defTiered(o){
  o.tiers.forEach(tr=>{
    const v=tr[0], rarity=tr[1];
    defMedal({id:o.id+"-"+String(v).replace(/\./g,"p"), name:o.name, goal:o.goal(v),
      cat:o.cat, icon:o.icon, rarity, kind:o.kind||"daily",
      desc:o.desc(v), test:()=>o.test(v), prog:o.prog?()=>o.prog(v):null});
  });
}
/* ===== DAILY medals — 3 featured per day, seeded by date ===== */
defTiered({id:"cal", name:"On Target", cat:"goal", icon:"target", kind:"daily",
  goal:v=>v+"% of goal", desc:v=>`Hit ${v}% of your daily calorie goal.`,
  tiers:[[40,"common"],[50,"common"],[75,"common"],[90,"uncommon"],[100,"rare"],[110,"epic"],[125,"legendary"]],
  test:v=>mCalPct(todayStr())>=v, prog:v=>({v:Math.round(mCalPct(todayStr())), t:v})});
defTiered({id:"pro", name:"Protein Power", cat:"protein", icon:"bolt", kind:"daily",
  goal:v=>v+"% protein", desc:v=>`Hit ${v}% of your protein target.`,
  tiers:[[50,"common"],[80,"uncommon"],[100,"rare"],[130,"epic"]],
  test:v=>{ const t=S.goals.protein; return t>0 && totals(todayStr()).p>=t*v/100; },
  prog:v=>{ const t=S.goals.protein; return t>0?{v:Math.round(totals(todayStr()).p), t:Math.round(t*v/100)}:null; }});
defTiered({id:"meals", name:"Full Table", cat:"meals", icon:"bowl", kind:"daily",
  goal:v=>v+" meal"+(v>1?"s":""), desc:v=>`Log ${v} meal${v>1?"s":""} today.`,
  tiers:[[1,"common"],[2,"common"],[3,"uncommon"],[4,"rare"]],
  test:v=>FOOD_MEALS.filter(m=>(((S.days[todayStr()]||{}).meals||{})[m]||[]).length>0).length>=v,
  prog:v=>({v:FOOD_MEALS.filter(m=>(((S.days[todayStr()]||{}).meals||{})[m]||[]).length>0).length, t:v})});
defTiered({id:"water", name:"Hydrated", cat:"water", icon:"drop", kind:"daily",
  goal:v=>v+"% water", desc:v=>`Drink ${v}% of your water target.`,
  tiers:[[25,"common"],[50,"common"],[100,"rare"],[150,"epic"]],
  test:v=>mWaterPct(todayStr())>=v, prog:v=>({v:Math.round(mWaterPct(todayStr())), t:v})});
defTiered({id:"fiber", name:"Roughage", cat:"fiber", icon:"leaf", kind:"daily",
  goal:v=>v+"% fiber", desc:v=>`Hit ${v}% of your fiber target.`,
  tiers:[[50,"common"],[100,"uncommon"]],
  test:v=>{ const t=fiberTarget(); return t>0 && mNutrG(todayStr(),"Fiber")>=t*v/100; },
  prog:v=>{ const t=fiberTarget(); return t>0?{v:Math.round(mNutrG(todayStr(),"Fiber")), t:Math.round(t*v/100)}:null; }});
defTiered({id:"variety", name:"Variety Plate", cat:"variety", icon:"grid", kind:"daily",
  goal:v=>v+" foods", desc:v=>`Log ${v} different foods today.`,
  tiers:[[5,"common"],[8,"uncommon"],[12,"rare"]],
  test:v=>mDistinctFoods(todayStr())>=v, prog:v=>({v:mDistinctFoods(todayStr()), t:v})});
defMedal({id:"early-1", name:"Early Bird", goal:"log before 8am", cat:"time", icon:"sun", rarity:"uncommon",
  desc:"Log a meal before 8am.", test:()=>mEntryHour(todayStr(),0,8)});
defMedal({id:"night-1", name:"Night Owl", goal:"log after 10pm", cat:"time", icon:"moon", rarity:"uncommon",
  desc:"Log a meal after 10pm.", test:()=>mEntryHour(todayStr(),22,24)});
defTiered({id:"photo", name:"Food Paparazzi", cat:"photo", icon:"camera", kind:"daily",
  goal:v=>v+" photo"+(v>1?"s":""), desc:v=>`Log ${v} food${v>1?"s":""} with a photo.`,
  tiers:[[1,"common"],[5,"rare"]],
  test:v=>mPhotoCount(todayStr())>=v, prog:v=>({v:mPhotoCount(todayStr()), t:v})});
defMedal({id:"sugar-1", name:"Sugar Smart", goal:"under sugar target", cat:"goal", icon:"target", rarity:"uncommon",
  desc:"Stay under 50g of sugar for the day.", test:()=>mDayHasLog(todayStr())&&mNutrG(todayStr(),"Total Sugars")<=50,
  prog:()=>({v:Math.round(mNutrG(todayStr(),"Total Sugars")), t:50, invert:true})});
defMedal({id:"macros-1", name:"Macro Master", goal:"all macros ±15%", cat:"goal", icon:"spark", rarity:"legendary",
  desc:"Land protein, carbs, and fat all within 15% of target.",
  test:()=>{ const g=S.goals; if(!(g.protein>0&&g.carbs>0&&g.fat>0)) return false; const t=totals(todayStr());
    return [t.p/g.protein,t.c/g.carbs,t.f/g.fat].every(r=>r>=0.85&&r<=1.15); }});
defMedal({id:"bfast-1", name:"Breakfast Club", goal:"log breakfast", cat:"meals", icon:"sun", rarity:"common",
  desc:"Log breakfast today.", test:()=>(((S.days[todayStr()]||{}).meals||{}).breakfast||[]).length>0});
defMedal({id:"snack-1", name:"Snack Attack", goal:"log a snack", cat:"meals", icon:"bowl", rarity:"common",
  desc:"Log a snack today.", test:()=>(((S.days[todayStr()]||{}).meals||{}).snacks||[]).length>0});
defMedal({id:"weekend-1", name:"Weekend Warrior", goal:"goal on weekend", cat:"goal", icon:"star", rarity:"rare",
  desc:"Hit 100% of your calorie goal on a Saturday or Sunday.",
  test:()=>{ const dow=new Date().getDay(); return (dow===0||dow===6)&&mCalPct(todayStr())>=100; }});
defMedal({id:"permeal-1", name:"Protein Each Meal", goal:"20g+ per meal", cat:"protein", icon:"bolt", rarity:"rare",
  desc:"Get 20g+ protein in breakfast, lunch, and dinner.",
  test:()=>["breakfast","lunch","dinner"].every(m=>(((S.days[todayStr()]||{}).meals||{})[m]||[]).reduce((a,e)=>a+(e.p||0),0)>=20)});
defMedal({id:"green-1", name:"Green Day", goal:"fiber + water 100%", cat:"fiber", icon:"leaf", rarity:"epic",
  desc:"Hit 100% of both your fiber and water targets.",
  test:()=>{ const ft=fiberTarget(); return ft>0&&mNutrG(todayStr(),"Fiber")>=ft&&mWaterPct(todayStr())>=100; }});
defMedal({id:"carbs-1", name:"Carb Loader", goal:"80% carbs", cat:"goal", icon:"chart", rarity:"common",
  desc:"Hit 80% of your carb target.", test:()=>{ const t=S.goals.carbs; return t>0&&totals(todayStr()).c>=t*0.8; }});
defMedal({id:"fat-1", name:"Fat in Check", goal:"fat ≤110%", cat:"goal", icon:"chart", rarity:"common",
  desc:"Keep fat at or under 110% of target.", test:()=>{ const t=S.goals.fat; return t>0&&totals(todayStr()).f<=t*1.1&&mDayHasLog(todayStr()); }});
defMedal({id:"bigpro-1", name:"Protein Machine", goal:"150g protein", cat:"protein", icon:"bolt", rarity:"epic",
  desc:"Eat 150g of protein in a day.", test:()=>totals(todayStr()).p>=150,
  prog:()=>({v:Math.round(totals(todayStr()).p), t:150})});
defMedal({id:"nosugar-1", name:"Low Sugar Day", goal:"≤15g sugar", cat:"goal", icon:"leaf", rarity:"rare",
  desc:"Keep total sugar at or under 15g.", test:()=>mDayHasLog(todayStr())&&mNutrG(todayStr(),"Total Sugars")<=15});
defMedal({id:"doubleday-1", name:"Double Down", goal:"6+ foods", cat:"variety", icon:"grid", rarity:"common",
  desc:"Log 6 or more foods in a day.", test:()=>{ let n=0; const d=S.days[todayStr()]; if(d) FOOD_MEALS.forEach(m=>n+=((d.meals||{})[m]||[]).length); return n>=6; }});

/* ===== LIFETIME medals — always being chased in the background ===== */
defTiered({id:"logstreak", name:"On a Roll", cat:"streak", icon:"flame", kind:"life",
  goal:v=>v+"-day log streak", desc:v=>`Log food ${v} days in a row.`,
  tiers:[[3,"uncommon"],[7,"rare"],[14,"epic"],[30,"epic"],[60,"legendary"],[100,"legendary"],[150,"legendary"],[200,"legendary"]],
  test:v=>mStreak(mDayHasLog)>=v, prog:v=>({v:mStreak(mDayHasLog), t:v})});
defTiered({id:"goalstreak", name:"Bullseye Streak", cat:"streak", icon:"target", kind:"life",
  goal:v=>v+"-day goal streak", desc:v=>`Hit your calorie goal (90%+) ${v} days in a row.`,
  tiers:[[2,"rare"],[5,"epic"],[10,"legendary"],[20,"legendary"],[30,"legendary"]],
  test:v=>mStreak(ds=>mDayHasLog(ds)&&mCalPct(ds)>=90)>=v, prog:v=>({v:mStreak(ds=>mDayHasLog(ds)&&mCalPct(ds)>=90), t:v})}); /* 2026.09.25-d: 90% band matches dayHit's definition of a hit — the old >=100% broke streaks on days adherence counted as hits */
defTiered({id:"waterstreak", name:"Flow State", cat:"water", icon:"drop", kind:"life",
  goal:v=>v+"-day water streak", desc:v=>`Hit your water target ${v} days in a row.`,
  tiers:[[3,"uncommon"],[7,"rare"],[14,"epic"]],
  test:v=>mStreak(ds=>mWaterPct(ds)>=100)>=v, prog:v=>({v:mStreak(ds=>mWaterPct(ds)>=100), t:v})});
defTiered({id:"prostreak", name:"Protein Streak", cat:"protein", icon:"bolt", kind:"life",
  goal:v=>v+"-day protein streak", desc:v=>`Hit your protein target ${v} days in a row.`,
  tiers:[[3,"uncommon"],[7,"rare"],[14,"epic"]],
  test:v=>mStreak(ds=>{ const t=S.goals.protein; return t>0&&totals(ds).p>=t; })>=v,
  prog:v=>({v:mStreak(ds=>{ const t=S.goals.protein; return t>0&&totals(ds).p>=t; }), t:v})});
defTiered({id:"weighstreak", name:"Scale Regular", cat:"weigh", icon:"scale", kind:"life",
  goal:v=>v+"-week weigh streak", desc:v=>`Weigh in ${v} weeks in a row.`,
  tiers:[[2,"common"],[4,"uncommon"],[8,"rare"],[12,"epic"]],
  test:v=>mWeighWeekStreak()>=v, prog:v=>({v:mWeighWeekStreak(), t:v})});
defTiered({id:"weighins", name:"Step On Up", cat:"weigh", icon:"scale", kind:"life",
  goal:v=>v+" weigh-ins", desc:v=>`Log ${v} weigh-ins all time.`,
  tiers:[[10,"common"],[25,"uncommon"],[50,"rare"],[100,"epic"]],
  test:v=>(S.weights||[]).length>=v, prog:v=>({v:(S.weights||[]).length, t:v})});
defMedal({id:"weigh20-1", name:"Scale Veteran", goal:"20-week streak", cat:"weigh", icon:"scale", rarity:"legendary", kind:"life",
  desc:"Weigh in 20 weeks in a row.", test:()=>mWeighWeekStreak()>=20, prog:()=>({v:mWeighWeekStreak(), t:20})});
defTiered({id:"calvol", name:"Fuel Tank", cat:"volume", icon:"chart", kind:"life",
  goal:v=>fmtBig(v)+" kcal all time", desc:v=>`Log ${fmtBig(v)} calories all time.`,
  tiers:[[50000,"common"],[100000,"uncommon"],[250000,"rare"],[500000,"epic"],[1000000,"legendary"]],
  test:v=>mAllTime().cal>=v, prog:v=>{ const a=mAllTime(); return {v:Math.round(a.cal), t:v, big:true}; }});
defTiered({id:"provol", name:"Protein Vault", cat:"volume", icon:"bolt", kind:"life",
  goal:v=>v+"kg protein all time", desc:v=>`Log ${v}kg of protein all time.`,
  tiers:[[1,"uncommon"],[5,"rare"],[10,"epic"]],
  test:v=>mAllTime().p>=v*1000, prog:v=>({v:Math.round(mAllTime().p/100)/10, t:v})});
defTiered({id:"watervol", name:"Reservoir", cat:"volume", icon:"drop", kind:"life",
  goal:v=>v+"L water all time", desc:v=>`Log ${v}L of water all time.`,
  tiers:[[50,"common"],[200,"rare"],[500,"epic"]],
  test:v=>mAllTime().woz>=v*33.814, prog:v=>({v:Math.round(mAllTime().woz/33.814), t:v})});
defTiered({id:"customs", name:"Mad Scientist", cat:"create", icon:"flask", kind:"life",
  goal:v=>v+" custom food"+(v>1?"s":""), desc:v=>`Create ${v} custom food${v>1?"s":""}.`,
  tiers:[[1,"common"],[5,"uncommon"],[15,"rare"]],
  test:v=>(S.customFoods||[]).length>=v, prog:v=>({v:(S.customFoods||[]).length, t:v})});
defTiered({id:"daycount", name:"Day Counter", cat:"volume", icon:"cal", kind:"life",
  goal:v=>v+" days logged", desc:v=>`Log food on ${v} different days.`,
  tiers:[[30,"common"],[60,"uncommon"],[100,"rare"],[200,"epic"],[365,"legendary"]],
  test:v=>mLoggedDays()>=v, prog:v=>({v:mLoggedDays(), t:v})});
defMedal({id:"first-log", name:"First Bite", goal:"first log", cat:"first", icon:"plus", rarity:"common", kind:"life",
  desc:"Log your very first food.", test:()=>mLoggedDays()>=1});
defMedal({id:"first-water", name:"First Sip", goal:"first water", cat:"first", icon:"drop", rarity:"common", kind:"life",
  desc:"Log water for the first time.", test:()=>mAllTime().woz>0});
defMedal({id:"first-weigh", name:"First Weigh-In", goal:"first weigh-in", cat:"first", icon:"scale", rarity:"common", kind:"life",
  desc:"Log your first weigh-in.", test:()=>(S.weights||[]).length>=1});
defMedal({id:"first-photo", name:"Say Cheese", goal:"first food photo", cat:"first", icon:"camera", rarity:"common", kind:"life",
  desc:"Log a food with a photo.", test:()=>{ for(const k in (S.days||{})) if(mPhotoCount(k)>0) return true; return false; }});
defMedal({id:"comeback-1", name:"Comeback Kid", goal:"return after 5+ days", cat:"streak", icon:"flame", rarity:"rare", kind:"life",
  desc:"Log food after 5 or more days away.",
  test:()=>{ const t=todayStr(); if(!mDayHasLog(t)) return false; let gap=0, ds=addDays(t,-1); while(!mDayHasLog(ds)&&gap<400){ gap++; ds=addDays(ds,-1); } return gap>=5; }});
defMedal({id:"tdee-1", name:"Metabolism Mapped", goal:"unlock adaptive TDEE", cat:"goal", icon:"chart", rarity:"epic", kind:"life",
  desc:"Unlock the adaptive TDEE panel: 7+ complete days with weigh-ins spanning 7+ days.",
  test:()=>{ try{ return adaptiveCalc().ok; }catch(e){ return false; } }}); /* 2026.09.25-d: gate on the real adaptiveCalc gates (7+ complete days, 7-day trend span) — the old test counted any 7 logged days and a 6-day span, awarding before the panel could unlock */
defMedal({id:"profile-1", name:"All Set", goal:"complete profile", cat:"first", icon:"star", rarity:"common", kind:"life",
  desc:"Set your name and profile photo.", test:()=>!!(S.profile&&S.profile.name&&S.profile.img)});
defMedal({id:"adherence-1", name:"Locked In", goal:"80% adherence", cat:"streak", icon:"heart", rarity:"epic", kind:"life",
  desc:"Reach 80% adherence over the last 14 days.",
  test:()=>{ try{ return (adherenceStats().pct||0)>=80; }catch(e){ return false; } },
  prog:()=>{ try{ const p=adherenceStats().pct; return p==null?null:{v:p, t:80}; }catch(e){ return null; } }});
defMedal({id:"earlyweek-1", name:"Early Bird Week", goal:"3 early mornings", cat:"time", icon:"sun", rarity:"rare", kind:"life",
  desc:"Log before 8am on 3 of the last 7 days.",
  test:()=>{ let n=0; for(let i=0;i<7;i++) if(mEntryHour(addDays(todayStr(),-i),0,8)) n++; return n>=3; }});
defMedal({id:"nightweek-1", name:"Night Owl Week", goal:"3 late nights", cat:"time", icon:"moon", rarity:"rare", kind:"life",
  desc:"Log after 10pm on 3 of the last 7 days.",
  test:()=>{ let n=0; for(let i=0;i<7;i++) if(mEntryHour(addDays(todayStr(),-i),22,24)) n++; return n>=3; }});
defMedal({id:"hydraweek-1", name:"Hydration Hero", goal:"3-day 150% streak", cat:"water", icon:"drop", rarity:"epic", kind:"life",
  desc:"Drink 150% of your water target 3 days in a row.", test:()=>mStreak(ds=>mWaterPct(ds)>=150)>=3});
defMedal({id:"wedweigh-1", name:"Weigh-in Wednesday", goal:"weigh on Wednesday", cat:"weigh", icon:"cal", rarity:"common", kind:"life",
  desc:"Weigh in on a Wednesday.", test:()=>(S.weights||[]).some(w=>new Date(w.d+"T12:00:00").getDay()===3)});
defMedal({id:"monthstart-1", name:"Fresh Start", goal:"log on the 1st", cat:"first", icon:"cal", rarity:"common", kind:"life",
  desc:"Log food on the 1st of a month.", test:()=>{ for(const k in (S.days||{})) if(k.slice(8)==="01"&&mDayHasLog(k)) return true; return false; }});
defMedal({id:"sodium-1", name:"Salt Smart", goal:"3-day low sodium", cat:"streak", icon:"heart", rarity:"uncommon", kind:"life",
  desc:"Stay under 2,300mg sodium 3 days in a row.",
  test:()=>mStreak(ds=>mDayHasLog(ds)&&mNutrG(ds,"Sodium")<=2.3)>=3});
defMedal({id:"proweek-1", name:"Protein Week", goal:"7-day protein avg", cat:"protein", icon:"bolt", rarity:"rare", kind:"life",
  desc:"Average your protein target or better over 7 days.",
  test:()=>{ const t=S.goals.protein; if(!(t>0)) return false; let s=0,n=0; for(let i=0;i<7;i++){ const ds=addDays(todayStr(),-i); if(isLocked(ds)) continue; if(mDayHasLog(ds)){ s+=totals(ds).p; n++; } } return n>=5&&s/n>=t; }});
defMedal({id:"supp-1", name:"Stacked", goal:"7-day supp streak", cat:"streak", icon:"plus", rarity:"uncommon", kind:"life",
  desc:"Log supplements 7 days in a row.", test:()=>mStreak(mHasSupps)>=7, prog:()=>({v:mStreak(mHasSupps), t:7})});
/* ===== special: the daily crown + legacy ===== */
defMedal({id:"crown", name:"Daily Crown", goal:"all 3 dailies", cat:"crown", icon:"crown", rarity:"legendary", kind:"special",
  desc:"Earn all 3 daily medals in one day.", test:()=>false});
defMedal({id:"legacy-crown", name:"OG Triple Crown", goal:"from the old system", cat:"crown", icon:"crown", rarity:"legendary", kind:"special",
  desc:"Carried over from the original 3-medal system.", test:()=>false});

/* ---------- engine ---------- */
function medalCase(){ if(!S.medalCase) S.medalCase={}; return S.medalCase; }
function awardMedal(id){ const c=medalCase(); const e=c[id]||(c[id]={d:todayStr(),n:0}); e.n++; e.ld=todayStr(); save(); }
function medalEarned(id){ return !!medalCase()[id]; }
function medalEarnedToday(id){ const e=medalCase()[id]; return !!(e&&e.ld===todayStr()); }
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
/* 3 featured daily medals: one easy, one medium, one hard — seeded by date
   so every day brings a different set (variable rewards). */
function dailyMedals(ds){
  const pool=MDEF.filter(m=>m.kind==="daily");
  const bands=[pool.filter(m=>m.rarity==="common"||m.rarity==="uncommon"),
               pool.filter(m=>m.rarity==="rare"),
               pool.filter(m=>m.rarity==="epic"||m.rarity==="legendary")];
  const h=hashStr("medals:"+ds), out=[];
  const fam=id=>id.replace(/-\d+$/,"");
  bands.forEach((arr,bi)=>{ if(!arr.length) return;
    const base=(h+bi*0x9E3779B9)>>>0;
    for(let t=0;t<arr.length;t++){ const m=arr[(base+t)%arr.length]; /* 2026.10.21-e (audit): the old multiplicative step could share a factor with the band length and visit only a subset — some days got 2 featured medals and an unreachable Crown */
      if(out.every(o=>fam(o.id)!==fam(m.id))){ out.push(m); break; } }
  });
  return out.slice(0,3);
}
function safeTest(md){ try{ return !!md.test(); }catch(e){ return false; } }
/* first run: silently bank everything already earned (no fanfare storm),
   and carry over the old triple-crown merges as a legacy medal. */
function seedMedalCase(){
  if(S.medalSeeded) return;
  const c=medalCase();
  MDEF.forEach(md=>{ if(md.kind==="life"&&!c[md.id]&&safeTest(md)) c[md.id]={d:todayStr(),n:1,ld:todayStr()}; });
  let legacyN=0, firstD=null;
  if(S.medalPop) for(const k in S.medalPop){ if((S.medalPop[k]||[]).indexOf("chroma")>=0){ legacyN++; if(!firstD||k<firstD) firstD=k; } }
  if(legacyN>0) c["legacy-crown"]={d:firstD,n:legacyN,ld:firstD};
  S.medalSeeded=1; save();
}
function checkMedals(){
  seedMedalCase();
  const featured=dailyMedals(todayStr()), fresh=[];
  featured.forEach(md=>{ if(!medalEarnedToday(md.id)&&safeTest(md)){ awardMedal(md.id); fresh.push(md); } });
  MDEF.forEach(md=>{ if(md.kind!=="life"||medalEarned(md.id)) return; if(safeTest(md)){ awardMedal(md.id); fresh.push(md); } });
  let crowned=false;
  if(featured.length===3&&featured.every(md=>medalEarnedToday(md.id))&&!medalEarnedToday("crown")){
    awardMedal("crown"); crowned=true;
    setTimeout(crownMerge, fresh.length*2300+600);
  }
  fresh.forEach((md,i)=>setTimeout(()=>medalFanfare(md), i*2300));
  if(fresh.length||crowned) refreshMedalRows();
}
function refreshMedalRows(){
  ["pMedals","mMedals"].forEach(id=>{ const el=document.getElementById(id); if(el){ el.innerHTML=medalRowHTML(todayStr()); wireMedals(el); } });
  const mh=document.getElementById("mMedalHint"); if(mh) mh.innerHTML=medalHintHTML();
  renderMedalCase();
}
/* big center-screen celebration for a newly earned medal */
function medalFanfare(md){
  const wrap=document.getElementById("totemWrap");
  const mel=document.getElementById("totemMedal"), nm=document.getElementById("totemName");
  wrap.classList.remove("show"); void wrap.offsetWidth;
  mel.className="totemmedal g-"+md.rarity;
  mel.innerHTML=`<span class="mbadge">${medalBadge(md,true)}</span>`;
  nm.innerHTML=`<div class="totemmedalname">${esc(md.name.toUpperCase())}</div><div class="totemrar">${RARITY[md.rarity].label} medal earned</div>`;
  wrap.classList.add("show");
  setTimeout(()=>{ wrap.classList.remove("show"); refreshMedalRows(); },1900);
}
/* all 3 daily medals earned: they fly to the center and combine into the crown */
function crownMerge(){
  const row=document.getElementById("pMedals");
  const crown=MDEF.find(m=>m.id==="crown");
  const showBig=()=>{ medalFanfare(crown); refreshMedalRows(); };
  const kids=row?[...row.children]:[];
  if(!kids.length){ showBig(); return; }
  const clones=kids.map(b=>{
    const rc=b.getBoundingClientRect(), c=document.createElement("div");
    c.className="mergemedal"; c.innerHTML=b.innerHTML;
    c.style.left=rc.left+"px"; c.style.top=rc.top+"px";
    document.body.appendChild(c); return c;
  });
  row.style.visibility="hidden";
  const cx=innerWidth/2, cy=innerHeight/2;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    clones.forEach(c=>{ c.style.transform=`translate(${cx-c.offsetLeft-20}px,${cy-c.offsetTop-20}px) scale(2.4)`; c.style.opacity="0"; });
  }));
  setTimeout(()=>{ clones.forEach(c=>c.remove()); row.style.visibility=""; showBig(); },950);
}
/* header + profile rows */
function medalRowHTML(ds){
  if(medalEarnedToday("crown")){
    const crown=MDEF.find(m=>m.id==="crown");
    return `<button class="medal g-legendary" data-crown="1" aria-label="Daily Crown"><span class="mbadge">${medalBadge(crown,true)}</span></button>`;
  }
  return dailyMedals(ds).map(md=>{ const earned=medalEarnedToday(md.id);
    return `<button class="medal g-${md.rarity}${earned?"":" dim"}" data-m="${md.id}" aria-label="${esc(md.name)}"><span class="mbadge">${medalBadge(md,earned)}</span></button>`; }).join("");
}
function wireMedals(el){ el.querySelectorAll(".medal").forEach(b=>b.onclick=openDailySheet); }
function medalHintHTML(){
  const n=Object.keys(medalCase()).length;
  return `3 new medals every day · <b>${n}/${MDEF.length}</b> in your case — tap a medal for details.`;
}
/* ---------- sheets ---------- */
function progBarHTML(md){
  if(!md.prog) return "";
  let p; try{ p=md.prog(); }catch(e){ return ""; }
  if(!p||!(p.t>0)) return "";
  const pct=Math.max(0,Math.min(100,(p.invert?Math.max(0,(p.t-p.v)/p.t*100):p.v/p.t*100)));
  const txt=(p.big?fmtBig(p.v)+" / "+fmtBig(p.t):Math.round(p.v)+" / "+Math.round(p.t));
  return `<div class="mprog"><div class="mprogbar"><i style="width:${pct}%"></i></div><span>${txt}</span></div>`;
}
function openDailySheet(){
  const featured=dailyMedals(todayStr());
  const crown=MDEF.find(m=>m.id==="crown");
  document.getElementById("infoTitle").textContent="Today's medals";
  document.getElementById("infoBody").innerHTML=
    featured.map(md=>{ const earned=medalEarnedToday(md.id);
      return `<div class="mrow" data-mid="${md.id}"><button class="medal g-${md.rarity}${earned?"":" dim"}"><span class="mbadge">${medalBadge(md,earned)}</span></button>`+
      `<div class="mmeta"><b>${esc(md.name)}</b><i class="r-${md.rarity}">${RARITY[md.rarity].label} · ${esc(md.goal||"")}</i>`+
      `<span>${esc(md.desc)}</span>${earned?"":progBarHTML(md)}</div><div class="mcheck">${earned?"✓":""}</div></div>`; }).join("")+
    (medalEarnedToday("crown")?`<div class="mrow" data-mid="crown"><button class="medal g-legendary"><span class="mbadge">${medalBadge(crown,true)}</span></button>`+
      `<div class="mmeta"><b>Daily Crown</b><i class="r-legendary">Legendary</i><span>All 3 daily medals earned.</span></div><div class="mcheck">✓</div></div>`:"")+
    `<div class="irow" style="color:var(--muted)">Fresh medals every day. Lifetime medals are always being chased in the background.</div>`+
    `<button class="mcasebtn" id="openCaseBtn">Open medal case · ${Object.keys(medalCase()).length}/${MDEF.length}</button>`;
  document.getElementById("infoSheet").classList.add("open");
  document.querySelectorAll("#infoBody .mrow .medal").forEach(b=>{ const mid=b.closest(".mrow").dataset.mid; if(mid) b.onclick=()=>openMedalDetail(mid); });
  document.getElementById("openCaseBtn").onclick=()=>{ document.getElementById("infoSheet").classList.remove("open"); openMedalCase(); };
}
function openMedalDetail(id){
  const md=MDEF.find(m=>m.id===id); if(!md) return;
  const e=medalCase()[id];
  document.getElementById("infoTitle").textContent=md.name;
  document.getElementById("infoBody").innerHTML=
    `<div class="mhero"><div class="medal big g-${md.rarity}"><span class="mbadge">${medalBadge(md,!!e)}</span></div>`+
    `<div><b class="r-${md.rarity}" style="font-size:15px">${RARITY[md.rarity].label}</b><br><span style="color:var(--muted);font-size:13px">${esc(md.goal||"")}</span></div></div>`+
    `<div class="irow">${esc(md.desc)}</div>${e?"":progBarHTML(md)}`+
    `<div class="irow" style="color:var(--muted)">${e?`Earned ${e.d}${e.n>1?` · ×${e.n}`:""}`:"Not yet earned."}${md.kind==="daily"?" This medal appears in the daily rotation.":""}</div>`;
  document.getElementById("infoSheet").classList.add("open");
}
/* ---------- medal case: its own page, grouped by rarity ---------- */
const CAT_LABEL={goal:"Goals",protein:"Protein",meals:"Meals",water:"Water",fiber:"Fiber",variety:"Variety",streak:"Streaks",weigh:"Weigh-ins",volume:"All-time",first:"Firsts",time:"Time",photo:"Photos",create:"Created",crown:"Crowns"};
function renderMedalCase(){
  const c=medalCase(), n=Object.keys(c).length;
  const bar=document.getElementById("mCaseBar");
  if(bar) bar.innerHTML=`<b>${n}/${MDEF.length}</b><span>collected</span>`+RORDER.map(r=>{
    const tot=MDEF.filter(m=>m.rarity===r).length, rn=MDEF.filter(m=>m.rarity===r&&c[m.id]).length;
    return `<span class="rdot r-${r}">${rn}/${tot}</span>`; }).join("");
  const host=document.getElementById("mCaseGroups");
  if(!host) return;
  host.innerHTML=RORDER.map(r=>{
    const ms=MDEF.filter(m=>m.rarity===r), rn=ms.filter(m=>c[m.id]).length;
    const label=(RARITY[r]&&RARITY[r].label)||r;
    return `<div class="flabel" style="margin:14px 0 8px">${esc(label)} · ${rn}/${ms.length}</div>`
      +`<div class="casegrid">`+ms.map(md=>{ const e=c[md.id];
        return `<button class="medal g-${md.rarity}${e?"":" dim"}" data-m="${md.id}" title="${esc(md.name)}" aria-label="${esc(md.name)}"><span class="mbadge">${medalBadge(md,!!e)}</span>${e&&e.n>1?`<span class="mx">×${e.n}</span>`:""}</button>`; }).join("")+`</div>`;
  }).join("");
  host.querySelectorAll(".medal").forEach(b=>b.onclick=()=>openMedalDetail(b.dataset.m));
}
function renderMedalsPage(){
  const mm=document.getElementById("mMedals");
  if(mm){ mm.innerHTML=medalRowHTML(todayStr()); wireMedals(mm); }
  const mh=document.getElementById("mMedalHint"); if(mh) mh.innerHTML=medalHintHTML();
  renderMedalCase();
}
/* jump to the case from the daily sheet */
function openMedalCase(){
  showView("medals");
}

function avatarHTML(pr, px){
  const initial = ((pr.name||"").trim().charAt(0)||"•").toUpperCase();
  return pr.img ? `<img src="${pr.img}" alt="Profile photo">` : `<span>${initial}</span>`;
}
function renderProfileStrip(){
  const pr = S.profile || {name:"", img:""};
  document.getElementById("pAvatar").innerHTML = avatarHTML(pr);
  document.getElementById("pName").textContent = pr.name || "You";
  const pm = document.getElementById("pMedals");
  pm.innerHTML = medalRowHTML(todayStr());
  wireMedals(pm);
  checkMedals();
}
document.getElementById("pAvatar").onclick = ()=>showView("profile");
function renderProfileCard(){
  const pr = S.profile || {name:"", img:""};
  const sa = document.getElementById("sAvatar");
  if(sa) sa.innerHTML = avatarHTML(pr);
  const nm = document.getElementById("sName");
  if(nm && document.activeElement!==nm) nm.value = pr.name || "";
  paintScoreWheel();
  renderThemePicker();
  renderPhotoStrip();
}
document.getElementById("sName").addEventListener("change", e=>{
  if(!S.profile) S.profile = {};
  S.profile.name = e.target.value.trim() || "";
  save(); renderProfileStrip(); renderProfileCard(); if(curView==="profile") renderProfile();
});
document.getElementById("pPhotoFile").onchange = e=>{
  const file = e.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{
    try{
      const max = 256, scale = Math.min(1, max/Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(img.width*scale)); cv.height = Math.max(1, Math.round(img.height*scale));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      if(!S.profile) S.profile = {};
      S.profile.img = cv.toDataURL("image/jpeg", 0.85);
      save(); renderProfileCard(); renderProfileStrip(); if(curView==="profile") renderProfile();
    }catch(err){ alert("Couldn't use that photo."); }
    URL.revokeObjectURL(url);
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); alert("Couldn't read that photo."); };
  img.src = url;
};
/* ============ WATER TARGET (settings UI) ============ */
function paintWater(){
  const w = waterCalc();
  const hv = document.getElementById("waterHeadVal");
  if(hv) hv.textContent = "Auto";
  const av = document.getElementById("waterAutoVal");
  if(av) av.textContent = w.unset ? "Auto · add your stats" : "Auto · " + (w.target*8) + " oz (" + w.target + " glasses)";
}
/* Macro split steppers (2026.10.14-i): % of the goal, GymGeek-style. The
   percentages shown are always derived from the stored grams, so the tiles,
   the segbar, and the steppers can never disagree. */
function paintSplit(){
  const g = S.goals, tot = goalTotal();
  const pc = v => tot>0 ? Math.round(v/tot*100)+"%" : "–";
  const eP = document.getElementById("spP"), eF = document.getElementById("spF"), eC = document.getElementById("spC");
  if(!eP) return;
  eP.textContent = pc((g.protein||0)*4);
  eF.textContent = pc((g.fat||0)*9);
  eC.textContent = pc((g.carbs||0)*4);
  document.getElementById("splitReset").style.display = g.splitPct ? "" : "none";
}
document.querySelectorAll("#splitCtl .sbtn").forEach(b=>b.onclick=()=>{
  const g = S.goals, tot = goalTotal(); if(!(tot>0)) return;
  if(!g.splitPct) g.splitPct = { p: Math.round((g.protein||0)*4/tot*100), f: Math.round((g.fat||0)*9/tot*100) };
  const np = g.splitPct.p + (b.dataset.sp==="p" ? parseInt(b.dataset.d, 10) : 0);
  const nf = g.splitPct.f + (b.dataset.sp==="f" ? parseInt(b.dataset.d, 10) : 0);
  if(np<5 || np>45 || nf<10 || nf>50 || (100-np-nf)<20) return; /* keep the split sane */
  g.splitPct = {p: np, f: nf};
  commitGoals("split");
  renderGoals(); renderDiary();
});
document.getElementById("splitReset").onclick = ()=>{
  S.goals.splitPct = null;
  commitGoals("split-reset");
  renderGoals(); renderDiary();
};
function renderGoals(){
  const g = S.goals, tot = goalTotal();
  document.getElementById("goalTotal").textContent = tot>0 ? Math.round(tot).toLocaleString() : "—";
  document.getElementById("gmCg").textContent = Math.round(g.carbs||0).toLocaleString();
  document.getElementById("gmPg").textContent = Math.round(g.protein||0).toLocaleString();
  document.getElementById("gmFg").textContent = Math.round(g.fat||0).toLocaleString();
  renderGoalsProfile();
  paintAdaptive();
  document.querySelectorAll("#goalMode .chip").forEach(c=>{
    const r = parseFloat(c.dataset.r);
    const sel = S.goals.surplusMode==="rate" ? Math.abs((S.goals.gainRate||0)-r)<0.01 : (r===0 && S.goals.mode==="maintain");
    c.classList.toggle("sel", sel);
  });
  paintSplit();
  paintGainProj();
  updateMacroSplit(); paintWater();
}
/* Macro split: read-only analysis (2026.10.14-i). Percentages are % of the daily
   calorie goal, uncapped — if the numbers go past 100% that's the truth. */
function updateMacroSplit(){
  const g = S.goals, tot = goalTotal();
  const c = Math.max(0, g.carbs||0), p = Math.max(0, g.protein||0), f = Math.max(0, g.fat||0);
  const cc = c*4, pc = p*4, fc = f*9, sum = cc+pc+fc;
  const pg = v => tot>0 ? Math.round(v/tot*100)+"%" : "–";
  document.getElementById("gmCp").textContent = pg(cc);
  document.getElementById("gmPp").textContent = pg(pc);
  document.getElementById("gmFp").textContent = pg(fc);
  const kc = v => v>0 ? Math.round(v).toLocaleString()+" kcal" : "";
  document.getElementById("gmCk").textContent = kc(cc);
  document.getElementById("gmPk").textContent = kc(pc);
  document.getElementById("gmFk").textContent = kc(fc);
  const w = v => (sum>0 ? v/sum*100 : 0)+"%";
  document.getElementById("segC").style.width = w(cc);
  document.getElementById("segP").style.width = w(pc);
  document.getElementById("segF").style.width = w(fc);
  /* fiber: always the research auto-target now (14 g / 1,000 kcal) */
  const fi = fiberTarget();
  document.getElementById("gmFip").textContent = fi>0 ? Math.round(fi)+" g" : "–";
  /* do the macros actually add up to the goal? */
  const an = document.getElementById("macroAnalysis");
  if(!(tot>0)){ an.textContent = ""; return; }
  const diff = Math.round(sum-tot);
  let st = "Macros total " + Math.round(sum).toLocaleString() + " kcal";
  if(diff !== 0) st += " · " + Math.abs(diff).toLocaleString() + (diff>0 ? " over" : " under") + " the goal";
  const kg2 = S.goals.profile.weightLb/2.20462;
  if(kg2>0 && p>0) st += " · protein " + (p/kg2).toFixed(1) + " g/kg";
  an.textContent = st;
}
document.querySelectorAll("#pfAct .chip").forEach(c=>c.onclick=()=>{
  commitGoalsInputs();
  S.goals.profile.activityKey = c.dataset.k;
  document.querySelectorAll("#pfAct .chip").forEach(x=>x.classList.toggle("sel", x===c));
  /* FORMULA LAW: the activity chip is a direct input to the goal —
     maintenance is BMR x this multiplier, re-derived on the tap. */
  commitGoals("activity");
  renderGoals(); renderDiary();
});
document.querySelectorAll("#pfUnits .chip").forEach(c=>c.onclick=()=>{
  commitGoalsInputs();
  S.goals.profile.units = c.dataset.u;
  save(); renderGoalsProfile();
});
document.querySelectorAll("#pfSex .chip").forEach(c=>c.onclick=()=>{
  commitGoalsInputs();
  S.goals.profile.sex = c.dataset.x;
  document.querySelectorAll("#pfSex .chip").forEach(x=>x.classList.toggle("sel", x===c));
  commitGoals("profile"); /* single derivation — same rule as the activity chips */
  renderGoals(); renderDiary();
});
/* 2026.09.27-h: "Needs extra water" is a schedule-style switch row now */
function paintXWTgl(){ const c=document.getElementById("cXW"), b=document.getElementById("cXWTgl"); if(c&&b) b.classList.toggle("on", c.checked); }
document.getElementById("cXWRow").onclick = ()=>{ const c=document.getElementById("cXW"); c.checked=!c.checked; paintXWTgl(); };
document.querySelectorAll("#goalMode .chip").forEach(c=>c.onclick=()=>{
  commitGoalsInputs();
  if(!(S.goals.maintenance>0)){ alert("Tap Calculate & Save first."); return; }
  const r = parseFloat(c.dataset.r);
  S.goals.gainRate = r;
  S.goals.surplusMode = "rate";
  S.goals.mode = r<=0 ? "maintain" : (r<=0.5 ? "lean" : "bulk"); /* labels other pages read */
  commitGoals("rate"); /* surplus (rate x 500) + macros re-derive atomically */
  renderGoals(); renderDiary();
});
document.getElementById("goalsDone").onclick = ()=>{
  commitGoalsInputs();
  /* THE one calculation (2026.10.21-b): the formula, from the profile
     inputs on this page. The food log is never consulted. One button. */
  S.goals.macroAuto = true;
  if(S.goals.nutrTargets) delete S.goals.nutrTargets["Fiber"]; /* fiber is auto now */
  commitGoals("calculate");
  save(); paintAdaptive(); renderGoals(); renderDiary();
  /* never silently "not work": if there's still nothing to calculate from, put the cursor on the missing weight field */
  /* 2026.11.25-c: never leave with a blank goal and no reason — say what is missing and stay */
  if(!profileReady()){ showView("goals"); showToast("Still needed: "+profileMissingText()); const first = {sex:"pfSex", age:"pfAge", height:(S.goals.profile.units==="met"?"pfHtCm":"pfHtFt"), weight:"pfWeight", activity:"pfAct"}[profileMissing()[0]]; const el = document.getElementById(first); if(el){ if(el.scrollIntoView) el.scrollIntoView({block:"center"}); if(el.focus) el.focus(); } return; }
  showView("profile");
};
/* Typed values commit on every field change (blur/return), so nothing the user
   typed can ever be lost or silently reverted — Calculate & Save finalizes. */
["pfAge","pfHtFt","pfHtIn","pfHtCm","pfWeight","pfFat","pfWaist"].forEach(id=>document.getElementById(id).addEventListener("change", ()=>{ commitGoalsInputs(); save(); paintMaintNote(); })); /* 2026.10.21-e (audit): pfWaist was the only stats field with no instant commit */
document.getElementById("goalsBack").onclick = ()=>{ commitGoalsInputs(); save(); showView(viewReturn); };

/* ============ SETTINGS ============ */
function renderSettings(){
  const g = S.goals;
  renderProfileCard();
  /* Profile hero (2026.10.14-i): painted from S.goals — the same stored
     maintenance/surplus/macros the Goals page runs on. Never the formula. */
  const hg = document.getElementById("pfHeroGoal");
  if(hg){
    hg.textContent = goalTotal()>0 ? Math.round(goalTotal()).toLocaleString() : "—";
    /* 2026.11.25-c: no surplus = maintaining, whatever the stored mode says */
    const md = document.getElementById("pfHeroMode"); if(md) md.textContent = !(g.maintenance>0) ? "not set" : !(g.surplus>0) ? "Maintain" : (({lean:"Lean Bulk", bulk:"Bulk", maintain:"Maintain", custom:"Custom"})[g.mode] || ""); /* local map: renderSettings runs at boot, before MODE_LABEL's script */
    const hs = document.getElementById("pfHeroSub");
    if(hs) hs.textContent = g.maintenance > 0
      ? Math.round(g.maintenance).toLocaleString() + " maintenance + " + Math.round(g.surplus).toLocaleString() + " surplus"
      : (profileReady() ? "Tap to calculate your goal" : "Add your " + profileMissingText() + " to calculate your goal");
    const hp = document.getElementById("pfHeroP"); if(hp) hp.textContent = g.protein>0 ? g.protein + "g" : "—";
    const hc = document.getElementById("pfHeroC"); if(hc) hc.textContent = g.carbs>0 ? g.carbs + "g" : "—";
    const hf = document.getElementById("pfHeroF"); if(hf) hf.textContent = g.fat>0 ? g.fat + "g" : "—";
  }
  document.getElementById("appVer").textContent = "Fuel " + APP_VERSION;
    const mrv=document.getElementById("medalCaseRowVal"); if(mrv) mrv.textContent=Object.keys(medalCase()).length+"/"+MDEF.length;
  const swv=document.getElementById("schedRowVal"); if(swv) swv.textContent=workDaysSummary();
  const srv=document.getElementById("snapRowVal"); if(srv) srv.textContent=listSnapshots().length+" saved";
  const grv=document.getElementById("grocRowVal"); if(grv){ const gl=(S.groceries||[]); const left=gl.filter(i=>!i.done).length; grv.textContent = gl.length ? (left ? left+" to buy" : "All bought") : "Empty"; }
}
/* ============ GROCERIES (2026.11.12-a) ============
   Weekly shopping list at the top of Settings. Categories are automatic —
   derived from each food's name/kind and ordered like a store path. Photos
   and nutrition come from the food library (the same records logging uses).
   Patterns borrowed from AnyList (auto-categories in aisle order, staples
   and recents one tap away, one reusable weekly list) and Cooklist
   (restock prediction from consumption history). "Running low?" reads the
   last 14 days of diary logs — servings eaten and days eaten — and shows
   its basis per item; pack counts use the food's package size (ps). */
const GROC_CATS = ["Produce","Meat & Seafood","Dairy & Eggs","Bakery & Grains","Pantry","Frozen","Drinks","Snacks","Household","Supplements","Other"];
function grocCategory(f){
  if(f && typeof f === "object" && f.kind === "supp") return "Supplements";
  const n = ((f && typeof f === "object" ? f.n : f) || "").toLowerCase();
  const has = (...ws) => ws.some(w => n.indexOf(w) >= 0);
  if(has("paper towel","dish soap","detergent","trash bag","foil","cleaner","batteries","shampoo","toothpaste","laundry")) return "Household";
  if(has("frozen","ice cream")) return "Frozen";
  if(has("soup","broth")) return "Pantry";
  if(has("banana","apple","avocado","lettuce","tomato","onion","garlic","lemon","lime","orange","grape","berr","spinach","kale","carrot","potato","broccoli","cucumber","celery","zucchini","squash","melon","peach","pear","plum","mango","pineapple","fruit","salad","mushroom","bell pepper")) return "Produce";
  if(has("beef","chicken","turkey","pork","bacon","sausage","ham","steak","salmon","tuna","shrimp","crab","lobster","tilapia","fish","meatball","jerky","ground")) return "Meat & Seafood";
  if(has("peanut butter","almond butter","nut butter")) return "Pantry";
  if(has("milk","cheese","yogurt","egg","butter","cream","cottage","mozzarella","cheddar","parmesan")) return "Dairy & Eggs";
  if(has("bread","bagel","tortilla","wrap","bun","muffin","pancake","waffle","rice","oat","pasta","macaroni","noodle","cereal","flour","quinoa","spaghetti","croissant","dough")) return "Bakery & Grains";
  if(has("juice","soda","coffee","tea","lemonade","kombucha","drink","sparkling")) return "Drinks";
  if(has("chips","cookie","cracker","candy","chocolate","popcorn","pretzel","granola","trail mix","snack")) return "Snacks";
  if(has("oil","sauce","marinara","honey","jam","jelly","syrup","spice","salt","sugar","vinegar","dressing","mayo","ketchup","mustard","beans","salsa","seasoning","powder")) return "Pantry";
  return "Other";
}
function grocItems(){ if(!Array.isArray(S.groceries)) S.groceries = []; return S.groceries; }
function grocFood(name){ try{ return findFood(name) || null; }catch(e){ return null; } }
function grocNutrLine(f){
  if(!f) return "";
  let s = Math.round(f.cal || 0) + " kcal · P" + Math.round(f.p || 0) + " C" + Math.round(f.c || 0) + " F" + Math.round(f.f || 0);
  if(f.s) s += " · " + f.s;
  return s;
}
function grocThumb(f){
  if(f && f.img) return `<img class="gthumb" src="${f.img}" alt="">`;
  return `<span class="gthumbph">${FOOD_ICON}</span>`;
}
function grocLogStats(daysBack){
  const cut = new Date(); cut.setDate(cut.getDate() - (daysBack - 1));
  const cutKey = dstr(cut);
  const stats = {};
  Object.keys(S.days || {}).forEach(k => {
    if(k < cutKey) return;
    const d = S.days[k]; if(!d || !d.meals) return;
    MEALS.forEach(m => (d.meals[m] || []).forEach(e => {
      const s = stats[e.n] || (stats[e.n] = { serv: 0, days: new Set() });
      s.serv += (e.qty == null || isNaN(e.qty)) ? 1 : e.qty;
      s.days.add(k);
    }));
  });
  return stats;
}
function grocSuggestions(){
  const stats = grocLogStats(14);
  const onList = new Set(grocItems().map(i => i.n));
  return Object.keys(stats)
    .filter(n => !onList.has(n) && (stats[n].serv >= 4 || stats[n].days.size >= 3))
    .map(n => ({ n, serv: stats[n].serv, days: stats[n].days.size }))
    .sort((a, b) => b.serv - a.serv).slice(0, 8);
}
function grocSuggestedQty(name, servPerWeek){
  const f = grocFood(name);
  if(f && f.ps > 0) return Math.max(1, Math.ceil(servPerWeek / f.ps));
  return 1;
}
function addGroc(name, qty){
  const items = grocItems();
  const ex = items.find(i => i.n === name);
  if(ex){ ex.qty = Math.min(99, (ex.qty || 1) + (qty || 1)); ex.done = false; }
  else items.push({ n: name, qty: qty || 1, done: false });
  save(); renderGroceries();
}
function grocRowHTML(it){
  const f = grocFood(it.n);
  const price = (f && f.pr > 0) ? " · $" + (f.pr * (it.qty || 1)).toFixed(2) : "";
  const sub = (grocNutrLine(f) + (price ? " · " + price.slice(3) : "")).trim();
  return `<div class="grow${it.done ? " done" : ""}">
    <button class="gcheck${it.done ? " on" : ""}" data-gact="tog" data-n="${esc(it.n)}" aria-label="Check off">${it.done ? "✓" : ""}</button>
    ${grocThumb(f)}
    <div class="gmain"><div class="gname">${esc(it.n)}</div>${sub ? `<div class="gsub">${esc(sub)}</div>` : ""}</div>
    <div class="gqty"><button class="gqbtn" data-gact="dec" data-n="${esc(it.n)}" aria-label="Less">−</button><span class="gqval">${it.qty || 1}</span><button class="gqbtn" data-gact="inc" data-n="${esc(it.n)}" aria-label="More">+</button></div>
    <button class="gdel" data-gact="del" data-n="${esc(it.n)}" aria-label="Remove">✕</button>
  </div>`;
}
function grocPickRowHTML(f){
  const ex = grocItems().find(i => i.n === f.n);
  const right = ex
    ? `<span class="gsub" style="flex:none; font-weight:700; color:var(--acc)">On list · ${ex.qty || 1}</span>`
    : `<button class="gadd" data-gact="add" data-n="${esc(f.n)}" aria-label="Add">+</button>`;
  return `<div class="grow">${grocThumb(f)}<div class="gmain"><div class="gname">${esc(f.n)}</div><div class="gsub">${esc(grocNutrLine(f))}</div></div>${right}</div>`;
}
function grocPickPool(){
  const seen = new Map();
  recentFoods().forEach(f => seen.set(f.n, f));
  allFoods().forEach(f => { if(!seen.has(f.n)) seen.set(f.n, f); });
  return [...seen.values()];
}
function renderGrocPick(){
  const box = document.getElementById("grocPick"); if(!box) return;
  const input = document.getElementById("grocSearch");
  const q = ((input && input.value) || "").trim().toLowerCase();
  let pool = grocPickPool();
  if(q){
    pool = pool.filter(f => f.n.toLowerCase().indexOf(q) >= 0 || (f.loc || "").toLowerCase().indexOf(q) >= 0);
    const seen = new Set(pool.map(f => f.n));
    VERIFIED_FOODS.filter(f => f.n.toLowerCase().indexOf(q) >= 0 && !seen.has(f.n)).slice(0, 8).forEach(f => pool.push(f));
  }
  let html = pool.slice(0, q ? 20 : 8).map(grocPickRowHTML).join("");
  if(q && !pool.some(f => f.n.toLowerCase() === q)){
    const typed = (input.value || "").trim();
    html += `<div class="grow"><span class="gthumbph">${FOOD_ICON}</span><div class="gmain"><div class="gname">${esc(typed)}</div><div class="gsub">Not in your foods — add as a plain item</div></div><button class="gadd" data-gact="add" data-n="${esc(typed)}" aria-label="Add item">+</button></div>`;
  }
  box.innerHTML = html || (q ? "" : `<div class="hint" style="padding:6px 0 2px">Foods you log and save will show up here.</div>`);
}
function renderGrocStaples(){
  const box = document.getElementById("grocStaples"); if(!box) return;
  const stats = grocLogStats(28);
  const onList = new Set(grocItems().map(i => i.n));
  const top = Object.keys(stats).filter(n => !onList.has(n)).sort((a, b) => stats[b].serv - stats[a].serv).slice(0, 6);
  box.innerHTML = top.length
    ? `<span class="gsub" style="font-weight:700">Staples:</span>` + top.map(n => `<button class="gchip" data-gact="add" data-n="${esc(n)}">+ ${esc(n)}</button>`).join("")
    : "";
}
function renderGrocSugg(){
  const card = document.getElementById("grocSuggCard");
  const box = document.getElementById("grocSugg"); if(!box) return;
  const sugg = grocSuggestions();
  if(card) card.style.display = sugg.length ? "" : "none";
  box.innerHTML = sugg.map(s => {
    const perWk = s.serv / 2;
    const qty = grocSuggestedQty(s.n, perWk);
    const f = grocFood(s.n);
    const basis = s.serv + " servings on " + s.days + (s.days === 1 ? " day" : " days") + " (2 wks) · ~" + (Math.round(perWk * 10) / 10) + "/wk" + ((f && f.ps > 0) ? " · ≈" + qty + " pack" + (qty > 1 ? "s" : "") : "");
    return `<div class="grow">${grocThumb(f)}<div class="gmain"><div class="gname">${esc(s.n)}</div><div class="gsub">${esc(basis)}</div></div><button class="gadd" data-gact="addsugg" data-n="${esc(s.n)}" data-q="${qty}" aria-label="Add suggested">+</button></div>`;
  }).join("");
}
function renderGroceries(){
  const listEl = document.getElementById("grocList"); if(!listEl) return;
  const items = grocItems();
  const done = items.filter(i => i.done).length;
  const total = items.reduce((t, i) => { const f = grocFood(i.n); return t + ((f && f.pr > 0) ? f.pr * (i.qty || 1) : 0); }, 0);
  const sum = document.getElementById("grocSummary");
  if(sum) sum.textContent = items.length
    ? done + " of " + items.length + " in the cart"
    : "Your list is empty — add foods below, or take a suggestion.";
  const priceEl = document.getElementById("grocPrice");
  if(priceEl){
    if(!items.length) priceEl.innerHTML = "";
    else if(total > 0){
      const remaining = items.filter(i => !i.done).reduce((t, i) => { const f = grocFood(i.n); return t + ((f && f.pr > 0) ? f.pr * (i.qty || 1) : 0); }, 0);
      const unpriced = items.filter(i => { const f = grocFood(i.n); return !(f && f.pr > 0); }).length;
      priceEl.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:baseline"><span style="font-weight:700">Predicted total</span><b style="font-size:19px">$${total.toFixed(2)}</b></div>`
        + `<div class="gsub">Still to buy $${remaining.toFixed(2)} · from saved package prices${unpriced ? " · " + unpriced + " item" + (unpriced > 1 ? "s" : "") + " without a price" : ""}</div>`;
    } else priceEl.innerHTML = `<div class="gsub">Add a package price to a food and the list gets a predicted total.</div>`;
  }
  const prog = document.getElementById("grocProg");
  if(prog) prog.style.width = items.length ? Math.round(done / items.length * 100) + "%" : "0%";
  if(!items.length) listEl.innerHTML = "";
  else{
    const byCat = {};
    items.forEach(it => { const c = grocCategory(grocFood(it.n) || it.n); (byCat[c] || (byCat[c] = [])).push(it); });
    listEl.innerHTML = GROC_CATS.filter(c => byCat[c]).map(c =>
      `<div class="gcat">${c}</div>` + byCat[c].slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)).map(grocRowHTML).join("")
    ).join("");
  }
  renderGrocPick();
  renderGrocStaples();
  renderGrocSugg();
}
["grocList","grocPick","grocSugg","grocStaples"].forEach(id => {
  const el = document.getElementById(id); if(!el) return;
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-gact]"); if(!b) return;
    const act = b.dataset.gact, name = b.dataset.n;
    const items = grocItems();
    const it = items.find(i => i.n === name);
    if(act === "tog" && it){ it.done = !it.done; save(); renderGroceries(); }
    else if(act === "inc" && it){ it.qty = Math.min(99, (it.qty || 1) + 1); save(); renderGroceries(); }
    else if(act === "dec" && it){ it.qty = Math.max(1, (it.qty || 1) - 1); save(); renderGroceries(); }
    else if(act === "del"){ S.groceries = items.filter(i => i.n !== name); save(); renderGroceries(); }
    else if(act === "add"){ addGroc(name, 1); }
    else if(act === "addsugg"){ addGroc(name, parseInt(b.dataset.q || "1", 10) || 1); }
  });
});
const grocSearchEl = document.getElementById("grocSearch");
if(grocSearchEl) grocSearchEl.addEventListener("input", renderGrocPick);
document.getElementById("grocClearDone").onclick = () => { S.groceries = grocItems().filter(i => !i.done); save(); renderGroceries(); };
document.getElementById("grocReset").onclick = () => { grocItems().forEach(i => i.done = false); save(); renderGroceries(); };
document.getElementById("grocRow").onclick = () => showView("groceries");
document.getElementById("grocBack").onclick = () => showView(viewReturn);
document.getElementById("schedRow").onclick = ()=>{ wsSel = new Date().getDay(); showView("worksched"); };
document.getElementById("wschedBack").onclick = ()=>showView(viewReturn);
document.getElementById("wschedInfo").onclick = ()=>openInfo("schedule");
document.getElementById("wDetTgl").onclick = ()=>setWorkDay(wsSel, workDays().indexOf(wsSel)<0);
document.getElementById("medalCaseRow").onclick = ()=>showView("medals");
document.getElementById("medalsBack").onclick = ()=>showView(viewReturn);
document.getElementById("snapRow").onclick = ()=>showView("snaps");
document.getElementById("snapsBack").onclick = ()=>showView(viewReturn);
document.getElementById("pfGoalsHero").onclick = ()=>{ renderGoals(); showView("goals"); };
document.getElementById("settingsRow").onclick = ()=>showView("settings");
document.getElementById("settingsBack").onclick = ()=>showView("profile");
document.getElementById("exportBtn").onclick = ()=>{
  /* 2026.10.21-e (audit): quit timelines, locked days and flags live OUTSIDE S in their
     own localStorage keys and were silently missing from backups — a phone switch lost
     the quit streaks for good. They now ride along in a __side envelope (old backups
     without it still import fine). Snapshots stay on-device by design. */
  const side = {};
  try{ for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i);
    if(k && (k.indexOf("fuel.quit.")===0 || k==="fuel.lockedDays.v1" || k==="fuel.flags.v1" || k==="fuel.foodSort.v1" || k==="fuel_ncat_collapsed" || k==="fuel_goals_secs")) side[k] = localStorage.getItem(k); } }catch(e){}
  const blob = new Blob([JSON.stringify(Object.assign({}, S, {__side: side}),null,2)],{type:"application/json"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="fuel-data.json"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
};
document.getElementById("importBtn").onclick = ()=>document.getElementById("importFile").click();
document.getElementById("muscleInfo").onclick = openMuscleInfo;
document.getElementById("muscleGoalBtn").onclick = ()=>{
  const cur = S.goals.muscleGoal||0, wu = wUnit();
  const v = prompt("Muscle goal ("+wu+")", cur>0 ? wDisp(cur) : "");
  if(v===null) return;
  const n = Math.round(wToLb(parseFloat(v))*10)/10;
  if(n>0 && n<=50){ S.goals.muscleGoal = n; save(); paintMuscle(); }
};
document.getElementById("importFile").onchange = e=>{
  const file = e.target.files[0];
  e.target.value = "";
  if(!file) return;
  const rd = new FileReader();
  rd.onload = ()=>{
    try{
      const obj = JSON.parse(rd.result);
      if(!obj || typeof obj!=="object" || !obj.goals || typeof obj.goals!=="object") throw new Error("bad");
      if(!confirm("Replace everything in the app with this backup? This can't be undone.")) return;
      if(obj.__side && typeof obj.__side==="object"){ try{ for(const k in obj.__side){ if(typeof obj.__side[k]==="string") localStorage.setItem(k, obj.__side[k]); } }catch(e){} }
      delete obj.__side;
      adoptState(obj); /* 2026.10.21-e (audit): full load() normalization instead of four ad-hoc patches — malformed inner shapes can no longer boot-loop the app */
      /* 2026.09.27-c: pre-split backup holds untagged numbers the learners now
         ignore — re-tag them from the restored entry timestamps instead of
         dropping to "still learning" */
      if(mealTimesNeedRebuild()) rebuildMealTimes();
      if(!S.goals.profHash){ const p0=S.goals.profile||{}; S.goals.profHash=[p0.weightLb,p0.heightIn,p0.age,p0.sex,p0.bodyFat,p0.activityKey].join("|"); }
      if(!S.days) S.days = {};
      save(); dayOffset = 0; renderAll(); showView("diary");
      alert("Backup restored.");
    }catch(err){ alert("That file doesn't look like a Fuel backup."); }
  };
  rd.onerror = ()=>alert("Couldn't read that file.");
  rd.readAsText(file);
};
document.getElementById("wipeBtn").onclick = ()=>{
  /* Erase means erase: every fuel.* key goes, and with no bundled backup in the
     app a reload simply starts blank (2026.11.01-a). */
  if(confirm("Erase ALL logged data? This cannot be undone.")){
    /* 2026.10.09-h: snapshots, flags, lock-days and quit data go too. The marker is
       kept for older builds that still read it; this build restores nothing. */
    try{
      const gone = [];
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.indexOf("fuel.")===0) gone.push(k); }
      gone.forEach(k=>{ try{ localStorage.removeItem(k); }catch(_){} });
      ["fuel_ncat_collapsed","fuel_goals_secs"].forEach(k=>{ try{ localStorage.removeItem(k); }catch(_){} });
      localStorage.setItem("fuel.erased","1");
    }catch(e){}
    S=load(); dayOffset=0; renderAll(); showView("diary");
  }
};

/* ============ NAV ============ */
let curView = "diary";
let viewReturn = "diary"; /* 2026.10.11-d: subview backs return to the tab you came from */
const MAIN_TABS = ["diary","progress","foods","profile"];
const SUB_VIEWS = ["quit","medals","info","goals","snaps","worksched","analysis","settings","groceries"]; /* 2026.10.21-e (audit): "calendar" had no view section — a stray showView("calendar") would have blanked the screen */
/* 2026.09.22-o: body no longer scrolls — the active .view owns the scroll, so
   scroll helpers target it instead of window. */
function activeViewEl(){ return document.querySelector(".view.active"); }
function viewAtTop(){ const v = activeViewEl(); return !v || v.scrollTop<=0; }
function showView(v){
  /* leaving the Goals page by any path (tab bar, back arrow, Done) commits typed
     values first — a tap can never silently wipe an edit */
  if(curView==="goals" && v!=="goals"){ commitGoalsInputs(); save(); }
  if(curView!==v && MAIN_TABS.indexOf(curView)>=0 && SUB_VIEWS.indexOf(v)>=0){ viewReturn = curView; }
  curView = v;
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active", x.id==="view-"+v));
  /* 2026.11.25-a: a sub-page keeps the tab you opened it from lit (Settings,
     Groceries, Goals… come from Profile) instead of always lighting Diary */
  const litTab = MAIN_TABS.indexOf(v)>=0 ? v : viewReturn;
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t.dataset.v===litTab));
  if(v==="progress"){ weekOffset = 0; renderProgress(); } /* always open on the current 7 days 2026.09.21-j */
  if(v==="profile") renderProfile();
  if(v==="groceries") renderGroceries();
  if(v==="settings") renderSettings();
  if(v==="medals") renderMedalsPage();
  if(v==="worksched") renderWorkSched();
  if(v==="quit") renderQuit();
  if(v==="snaps") renderSnaps();
  if(v==="info") renderInfo();
  if(v==="foods") renderFoods();
  if(v==="analysis") renderAnalysis();
  if(v==="goals") renderGoals();
  const av = activeViewEl(); if(av) av.scrollTop = 0;
  paintSigned();
}
/* 2026.09.22-k: Apple-Photos-style reorder — compact row list with drag handles, checkmark saves */
const PROG_UNITS = ["body","week","heatmap","auto"];
const PROG_TITLES = {body:"Weight",week:"This week",heatmap:"Consistency",auto:"Autopilot"};
const LINES_SVG = '<svg viewBox="0 0 24 24"><path d="M5 8h14M5 12h14M5 16h14"/></svg>';
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>';
function progUnits(){ return Array.prototype.slice.call(document.querySelectorAll("#progOverview .punit")); }
function progOrder(){
  const saved = (typeof S!=="undefined" && S && Array.isArray(S.progLayout)) ? S.progLayout.filter(function(p){ return PROG_UNITS.indexOf(p)>=0; }) : [];
  /* 2026.11.25-a: keep the SAVED order — this used to re-sort saved panels
     back into the default order, so Edit → drag → ✓ never stuck */
  const order = saved.filter(function(p, i){ return saved.indexOf(p)===i; })
    .concat(PROG_UNITS.filter(function(p){ return saved.indexOf(p)<0; }));
  const bIdx = order.indexOf("body");
  if(bIdx > 0){ order.splice(bIdx, 1); order.unshift("body"); }
  return order;
}
function applyProgLayout(){
  const box = document.getElementById("progOverview"); if(!box) return;
  const map = {}; progUnits().forEach(function(u){ map[u.getAttribute("data-pid")] = u; });
  progOrder().forEach(function(pid){ if(map[pid]) box.appendChild(map[pid]); });
}
function setProgEdit(on){
  const btn = document.getElementById("progEditBtn"), box = document.getElementById("progOverview"), list = document.getElementById("progReorder");
  if(!btn || !box || !list) return;
  document.body.classList.toggle("reordering", on);
  if(on){
    list.innerHTML = "";
    progOrder().forEach(function(pid){
      const row = document.createElement("div");
      row.className = "pr-row"; row.setAttribute("data-pid", pid);
      const t = document.createElement("span"); t.className = "pr-title"; t.textContent = PROG_TITLES[pid] || pid;
      const h = document.createElement("span"); h.className = "pr-handle"; h.setAttribute("aria-label","Drag to reorder"); h.innerHTML = LINES_SVG;
      h.addEventListener("pointerdown", prHandleDown);
      row.appendChild(t); row.appendChild(h); list.appendChild(row);
    });
    box.style.display = "none"; list.hidden = false;
    btn.classList.add("psave"); btn.innerHTML = CHECK_SVG; btn.setAttribute("aria-label","Save order");
  } else {
    box.style.display = ""; list.hidden = true; list.innerHTML = "";
    btn.classList.remove("psave"); btn.textContent = "Edit"; btn.setAttribute("aria-label","Rearrange panels");
    applyProgLayout();
  }
}
function prHandleDown(e){
  e.preventDefault();
  const handle = e.currentTarget, list = document.getElementById("progReorder");
  const row = handle ? handle.closest(".pr-row") : null;
  if(!row || !list) return;
  const rows = Array.prototype.slice.call(list.children);
  const H = row.offsetHeight + (parseFloat(getComputedStyle(row).marginBottom) || 0);
  const startIdx = rows.indexOf(row);
  const others = rows.filter(function(x){ return x !== row; });
  let target = startIdx, finished = false;
  const y0 = e.clientY;
  row.classList.add("dragging");
  list.classList.add("pr-dragging");
  try{ handle.setPointerCapture(e.pointerId); }catch(_){}
  const move = function(ev){
    if(finished) return;
    const dy = ev.clientY - y0;
    row.style.transform = "translateY(" + dy + "px)";
    const n = Math.max(0, Math.min(rows.length - 1, startIdx + Math.round(dy / H)));
    if(n !== target){
      target = n;
      others.forEach(function(r){
        const i = rows.indexOf(r);
        let off = 0;
        if(target > startIdx && i > startIdx && i <= target) off = -H;
        else if(target < startIdx && i >= target && i < startIdx) off = H;
        r.style.transform = off ? "translateY(" + off + "px)" : "";
      });
    }
  };
  const end = function(){
    if(finished) return; finished = true;
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", end);
    handle.removeEventListener("pointercancel", end);
    handle.removeEventListener("lostpointercapture", end);
    others.forEach(function(r){ r.style.transform = ""; });
    row.style.transform = "";
    row.classList.remove("dragging");
    list.classList.remove("pr-dragging");
    if(target !== startIdx){
      list.removeChild(row);
      const kids = list.children;
      if(target >= kids.length) list.appendChild(row);
      else list.insertBefore(row, kids[target]);
    }
  };
  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
  handle.addEventListener("lostpointercapture", end);
}
/* ============ PROFILE VIEW (2026.10.11-a) ============ */
/* 2026.11.25-a: Groceries, the calorie card and the streaks are all
   rearrangeable (the ≡ button used to have only one panel to move);
   Settings stays pinned at the bottom of Profile. */
const PROF_UNITS = ["groceries","goals","streaks"];
const PROF_TITLES = {groceries:"Groceries", goals:"Calorie goal", streaks:"Habit Trackers"};
function profOrder(){
  let saved = (S && Array.isArray(S.profOrder)) ? S.profOrder.filter(function(p){ return PROF_UNITS.indexOf(p)>=0; }) : [];
  if(saved.length < 2) saved = []; /* one panel can't express an order (old saves were ["streaks"]) */
  return saved.filter(function(p, i){ return saved.indexOf(p)===i; })
    .concat(PROF_UNITS.filter(function(p){ return saved.indexOf(p)<0; }));
}
function applyProfLayout(){
  const box = document.getElementById("profPanels"); if(!box) return;
  const map = {};
  box.querySelectorAll(".punit").forEach(function(u){ map[u.getAttribute("data-pid")] = u; });
  profOrder().forEach(function(pid){ if(map[pid]) box.appendChild(map[pid]); });
}
function qtDays(key){
  try{ const h = qtHours(key); return h==null ? null : Math.floor(h/24)+1; }catch(e){ return null; }
}
/* Profile streak panels (2026.10.11-e): full diary-Streaks feature parity —
   tap circle = date picker, tap satellite = healing info, tap i = phase info,
   tap panel body = Quit Tracker. */
function pfStreakHTML(key){
  var isNic = key==="nicotine";
  var label = isNic ? "days nicotine-free" : "days alcohol-free";
  var organ = isNic ? "Lungs" : "Liver";
  var days = streakDays(key), started = ohStartMs(key)!=null;
  var ph = started ? streakPhase(key, days, started) : "none";
  var ringCol = ph==="none" ? "rgba(255,255,255,.45)" : PHASE_COLOR[ph];
  var stageName = ph==="none" ? "Not started" : PHASE_NAME[key][ph];
  var BC = 2*Math.PI*28, boff = BC*(1-(started?Math.min(days,30)/30:0));
  var pct = 0;
  if(started){
    var x = ((Date.now()-ohStartMs(key))/36e5)/(isNic?1:24);
    pct = ohProgress(isNic?OH_LUNGS:OH_LIVER, x);
  }
  var SC = 2*Math.PI*15.5, soff = SC*(1-pct/100);
  var num = started ? days : "\u2013";
  return '<div class="pf-streak" data-key="'+key+'" role="button" tabindex="0" aria-label="'+label+', '+num+' days, '+stageName+'">'
    + '<span class="pf-dbl" data-act="cal" role="button" tabindex="0" aria-label="Set last day">'
    + '<svg class="pf-bigring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="5"/>'
    + '<circle cx="32" cy="32" r="28" fill="none" stroke="'+ringCol+'" stroke-width="5" stroke-linecap="round" stroke-dasharray="'+BC.toFixed(1)+'" stroke-dashoffset="'+boff.toFixed(1)+'" transform="rotate(-90 32 32)"/></svg>'
    + '<span class="pf-bignum"><b>'+num+'</b><span>days</span></span>'
    + '<span class="pf-sat" data-act="heal" role="button" tabindex="0" aria-label="'+organ+' healing info"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.30)" stroke-width="4"/>'
    + '<circle cx="18" cy="18" r="15.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="'+SC.toFixed(1)+'" stroke-dashoffset="'+soff.toFixed(1)+'" transform="rotate(-90 18 18)"/></svg>'
    + '<span class="pf-satpct">'+Math.round(pct)+'%</span></span></span>'
    + '<span class="pf-organ">'+organ+'</span>'
    + '<span>'+label+'</span>'
    + '<span class="pf-stage">'+stageName+'<span class="pf-ibtn" data-act="phase" role="button" tabindex="0" aria-label="About phases">i</span></span></div>';
}
function paintPfStreaks(){
  var st = document.getElementById("pfStreaks");
  if(st) st.innerHTML = pfStreakHTML("nicotine") + pfStreakHTML("alcohol");
}
/* one delegated listener for the profile streak panels (survives re-renders) */
(function(){
  var wrap = document.getElementById("pfStreaks");
  if(!wrap) return;
  function go(key, a){
    if(a==="cal") openCal(key);
    else if(a==="heal") openInfo(key==="nicotine"?"quitlung":"quitliver");
    else if(a==="phase") openInfo(key==="nicotine"?"nicphase":"alcphase");
    else showView("quit");
  }
  wrap.addEventListener("click", function(e){
    var p = e.target.closest(".pf-streak"); if(!p) return;
    var t = e.target.closest("[data-act]");
    go(p.getAttribute("data-key"), t ? t.getAttribute("data-act") : null);
  });
  wrap.addEventListener("keydown", function(e){
    if(e.key!=="Enter" && e.key!==" ") return;
    var p = e.target.closest(".pf-streak"); if(!p) return;
    e.preventDefault();
    var t = e.target.closest("[data-act]");
    go(p.getAttribute("data-key"), (t && e.target!==p) ? t.getAttribute("data-act") : null);
  });
})();
function renderProfile(){
  renderSettings();
  const pr = S.profile || {};
  const av = document.getElementById("pfAvatar");
  if(av) av.innerHTML = avatarHTML(pr);
  const nm = document.getElementById("pfName");
  if(nm) nm.textContent = pr.name || "You";
  const ws = sortedWeights(), lw = ws.length ? ws[ws.length-1] : null;
  const ndays = Object.keys(S.days||{}).filter(function(k){ return !isLocked(k)&&dayHasData(S.days[k]); }).length;
  const sub = document.getElementById("pfSub");
  if(sub) sub.textContent = ndays+" day"+(ndays===1?"":"s")+" logged"+(lw ? " · "+wDisp(lw.w).toFixed(1)+" "+wUnit() : "");
  paintPfStreaks();

  const p = S.goals.profile || {};
  const hIn = p.heightIn || 0;
  const curW = curBodyWeight();
  const wLb = curW > 0 ? curW : (lw ? lw.w : (p.weightLb || 0));
  const wu = wUnit();
  const bmi = (wLb>0 && hIn>0) ? (wLb/(hIn*hIn)*703) : 0;
  const whtr = (p.waistIn>0 && hIn>0) ? (p.waistIn/hIn) : 0;

  const cal = document.getElementById("pfCal");
  if(cal){
    const t = totals(viewDate()), g = goalTotal();
    const pct = g>0 ? Math.min(100, Math.round(t.cal/g*100)) : 0;
    cal.innerHTML =
      '<div class="prog-top"><span class="prog-label">Today\u2019s calories</span><span class="prog-date">'+esc(new Date().toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"}))+'</span></div>'+
      '<div class="prog-main"><div class="prog-pct"><b>'+Math.round(t.cal).toLocaleString()+'</b><span>'+(g>0 ? "of "+Math.round(g).toLocaleString()+" kcal goal" : "set your goal")+'</span></div>'+
      '<div class="pf-calbar"><i style="width:'+pct+'%"></i></div></div>';
  }
  const mx = document.getElementById("pfMetrics");
  if(mx){
    const maint = S.goals.maintenance>0 ? Math.round(S.goals.maintenance) : 0;
    const tile = function(v,l){ return '<div class="pf-met"><b>'+v+'</b><span>'+l+'</span></div>'; };
    mx.innerHTML =
      tile(wLb>0 ? wDisp(wLb).toFixed(1)+" "+wUnit() : "\u2013", "Weight") +
      tile(bmi>0 ? bmi.toFixed(1) : "\u2013", "BMI") +
      tile(maint>0 ? maint.toLocaleString()+" kcal" : "\u2013", "Maintenance") +
      tile(streak(), "Day streak") +
      tile(ndays, "Days logged") +
      tile(ws.length, "Weigh-ins");
  }
  applyProfLayout();
}
let profEditing = false;
function setProfEdit(on){
  profEditing = on;
  const btn = document.getElementById("profReorderBtn"), box = document.getElementById("profPanels"), list = document.getElementById("profReorder");
  if(!btn || !box || !list) return;
  btn.classList.toggle("on", on);
  btn.setAttribute("aria-label", on?"Done rearranging":"Rearrange panels");
  if(on){
    list.innerHTML = "";
    profOrder().forEach(function(pid){
      const row = document.createElement("div"); row.className = "pf-rrow"; row.setAttribute("data-pid", pid);
      const t = document.createElement("b"); t.textContent = PROF_TITLES[pid]||pid; row.appendChild(t);
      const up = document.createElement("button"); up.textContent = "\u2191"; up.setAttribute("aria-label","Move up");
      const dn = document.createElement("button"); dn.textContent = "\u2193"; dn.setAttribute("aria-label","Move down");
      up.onclick = function(){ profMove(pid,-1); }; dn.onclick = function(){ profMove(pid,1); };
      row.appendChild(up); row.appendChild(dn); list.appendChild(row);
    });
    box.style.display = "none"; list.hidden = false;
  }else{
    box.style.display = ""; list.hidden = true; list.innerHTML = "";
    applyProfLayout();
  }
}
function profMove(pid, dir){
  const o = profOrder(), i = o.indexOf(pid), j = i+dir;
  if(i<0 || j<0 || j>=o.length) return;
  const t = o[i]; o[i] = o[j]; o[j] = t;
  S.profOrder = o; save(); setProfEdit(true); applyProfLayout();
}
document.getElementById("profReorderBtn").onclick = function(){ setProfEdit(!profEditing); };
document.getElementById("pfAvatar").onclick = function(){ const f=document.getElementById("pPhotoFile"); if(f) f.click(); };
document.getElementById("progEditBtn").onclick = function(){
  if(document.body.classList.contains("reordering")){
    const list = document.getElementById("progReorder");
    if(list) S.progLayout = Array.prototype.map.call(list.children, function(r){ return r.getAttribute("data-pid"); });
    save();
    setProgEdit(false);
  } else setProgEdit(true);
};
/* 2026.09.24-l: week-card segments + body expandable rows */
document.querySelectorAll("#weekSeg .segbtn").forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll("#weekSeg .segbtn").forEach(function(x){x.classList.toggle("on",x===b);});
    ["sum","cal","mac"].forEach(function(s){ var el=document.getElementById("wseg-"+s); if(el) el.hidden = b.dataset.seg!==s; });
    S.weekSeg=b.dataset.seg; save();
  };
});
document.querySelectorAll("#dbSeg .segbtn").forEach(function(b){
  b.onclick=function(){ S.dbSeg=b.dataset.dseg; save(); paintDayCharts(); };
});
document.getElementById("dbPrev").onclick = ()=>{ if(dbOffset<MAX_WEEKS_BACK){ dbOffset++; paintDayCharts(); } };
document.getElementById("dbNext").onclick = ()=>{ if(dbOffset>0){ dbOffset--; paintDayCharts(); } };
document.querySelectorAll(".xrow").forEach(function(r){
  r.onclick=function(){
    var d=document.getElementById("xdetail-"+r.dataset.x); if(!d) return;
    var open=d.classList.toggle("open"); r.classList.toggle("open",open);
  };
});
/* 2026.10.05-e/f: signed values are color-coded app-wide — negatives dark red,
   positives dark green. Runs after every render; walks text nodes once and
   wraps standalone signed numbers (−25.5, -1,254, +150). Skips dates
   (2026-10-05), ranges (5-10, +100–150), SVG, scripts, inputs, and
   already-wrapped nodes, so it is idempotent across re-renders. */
function paintSigned(root){
  var r = root || document.body;
  var walker = document.createTreeWalker(r, NodeFilter.SHOW_TEXT, {
    acceptNode: function(n){
      var v = n.nodeValue;
      if(!v || (v.indexOf("-")<0 && v.indexOf("−")<0 && v.indexOf("+")<0)) return NodeFilter.FILTER_REJECT;
      var p = n.parentElement;
      if(!p || p.closest("svg") || p.closest("script,style")) return NodeFilter.FILTER_REJECT;
      var tag = p.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT") return NodeFilter.FILTER_REJECT;
      if(p.classList && p.classList.contains("neg")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  var nodes = [], n;
  while((n = walker.nextNode())) nodes.push(n);
  var re = /(^|[\s(])((?:−|-|\+)(?=\d)\d(?:[\d,]*\d)?(?:\.\d+)?)(?![\d-])/g, m;
  nodes.forEach(function(tn){
    var txt = tn.nodeValue, out = "", last = 0, found = false;
    re.lastIndex = 0;
    while((m = re.exec(txt))){
      found = true;
      var col = (m[2][0]==="−" || m[2][0]==="-") ? "#b00020" : "#0b7a4b";
      out += esc(txt.slice(last, m.index)) + m[1] + '<span class="neg" style="color:'+col+'">' + esc(m[2]) + "</span>";
      last = m.index + m[0].length;
    }
    if(!found) return;
    out += esc(txt.slice(last));
    var sp = document.createElement("span");
    sp.innerHTML = out;
    tn.parentNode.replaceChild(sp, tn);
  });
}
/* 2026.11.25-a: Progress is ~3/4 of a full render (17 of 23 ms with 5 months
   of logs) and showView("progress") already re-renders it on open, so a full
   render only repaints it while it is the screen being looked at. */
function renderAll(){ renderDiary(); renderFoods(); if(curView==="progress") renderProgress(); renderSettings(); applyProgLayout(); if(curView==="profile") renderProfile(); paintSigned(); }
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>showView(t.dataset.v));
/* Progress sub-tabs were removed in 2026.09.22-a: Progress is a single view whose
   weight circle opens the full-screen #wtDetail sheet. */
document.getElementById("tabFab").onclick = ()=>openSheet(mealForNow());
document.getElementById("dayPrev").onclick = ()=>{ dayOffset--; renderDiary(); };
document.getElementById("todayPill").onclick = ()=>{ dayOffset = 0; weekOff = 0; renderDiary(); };
document.getElementById("gearBtn").onclick = ()=>showView("profile");
document.getElementById("analysisLink").onclick = ()=>showView("analysis");
document.getElementById("analysisBack").onclick = ()=>showView("diary");
function mealForNow(){ const h = new Date().getHours(); return h<11?"breakfast":h<15?"lunch":h<21?"dinner":"snacks"; }
document.getElementById("trayIco").insertAdjacentHTML("afterbegin", FOOD_ICON);
applyTheme(themeColor());
/* Boot (2026.11.01-a): there is no bundled backup — a fresh install simply starts
   blank. If the saved state is damaged, stash the bytes and try the daily
   snapshots newest-first; with no snapshot the app starts blank and says so. */
/* 2026.10.21-e (audit): wholesale state replacements (snapshot / import) used to
   bypass load() entirely — no default-filling, no water migration, no null purge — so an
   older backup shape reached renderers raw. adoptState writes the object, then reloads it
   through load() so every restore gets the full normalization. */
function adoptState(obj){
  try{ localStorage.setItem(KEY, JSON.stringify(obj)); }catch(e){}
  S = load();
  if(!S.streaks) S.streaks = {};
  if(!S.streaks.nicotine) S.streaks.nicotine = { lastUse:null };
  if(!S.streaks.alcohol) S.streaks.alcohol = { lastUse:null };
  save();
}
let bootNote = "";
if(corruptBoot){
  /* 2026.10.09-h: fuel.v1 existed but would not parse — stash the damaged bytes,
     try daily snapshots newest-first instead of ever swapping in other data. */
  try{ /* 2026.10.21-e (audit): cap the stash — unbounded corrupt backups eat the same quota the app saves into */
    const cks = []; for(let ci=0; ci<localStorage.length; ci++){ const ck = localStorage.key(ci); if(ck && ck.indexOf("fuel.corrupt.")===0) cks.push(ck); }
    cks.sort(); while(cks.length>=2){ try{ localStorage.removeItem(cks.shift()); }catch(e){} }
    localStorage.setItem("fuel.corrupt."+Date.now(), String(corruptRaw).slice(0,300000)); }catch(e){}
  let restored = false;
  listSnapshots().forEach(function(k){
    if(restored) return;
    try{ const st = JSON.parse(localStorage.getItem(k));
      if(st && st.goals){ adoptState(st);
        bootNote = "Your saved data was damaged \u2014 restored from the "+k.slice(SNAP_PRE.length)+" backup. If anything looks off, check Settings \u2192 Snapshots.";
        restored = true; } }catch(e){}
  });
  if(!restored) bootNote = "Your saved data was damaged and no backup snapshot was found \u2014 the app has started fresh.";
  renderAll(); showSaveWarn(bootNote, true);
}else renderAll();
/* 2026.10.09-h: cross-tab guard — two tabs silently overwrite each other (last-writer-wins). Warn instead. */
window.addEventListener("storage", function(e){
  if(e && e.key===KEY) showSaveWarn("Fuel is open in another tab — use one tab so you don't lose changes.", true);
});
