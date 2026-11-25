/* ============ AUTOPILOT 2026.09.30-b — everything automatic from progressive data ============
   The reshape: Fuel no longer waits to be managed. Once a day, on boot, the engine reads
   Jay's own logged progress — intake trend, weight trend, adherence — and moves every number
   itself: maintenance (learned, same ±150/wk cap and ±400 sanity band as Calorie Check),
   surplus via the goal-mode percent, and macros from the current targets. Every change lands
   in the one-line feed with its reason. The only thing that ever asks permission is a big
   move (stall → raise the goal), which arrives as an approve/dismiss card. Nothing is ever
   deleted or reset — worst case a target stays where it was. */
var AUTO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 3v4h-4"/></svg>';
function autoState(){
  if(!S.auto) S.auto = {};
  var a = S.auto;
  if(!Array.isArray(a.feed)) a.feed = [];
  if(!Array.isArray(a.props)) a.props = [];
  return a;
}
function autoLog(text){
  var a = autoState();
  a.feed.unshift({d: todayStr(), t: text});
  if(a.feed.length > 40) a.feed.length = 40;
}
function autoCheckStall(){
  /* bulk-only for now: flat trend + strong adherence = the goal is the ceiling */
  var a = autoState(), g = S.goals;
  if(!(g.surplus > 0)) return;
  var st = trendState();
  if(st.conf !== "solid" || st.rateWk == null) return;
  var comp = completeDayCals();
  if(comp.cals.length < 7) return;
  var recent = comp.cals.slice(-7);
  var avg = recent.reduce(function(x,y){ return x+y; }, 0) / recent.length;
  var goal = goalTotal();
  if(!(goal > 0) || avg < goal * 0.9) return;
  var kind = null, to = 0, txt = "";
  if(Math.abs(st.rateWk) < 0.15){
    kind = "stall"; to = g.surplus + 150;
    txt = "Weight's been flat for 2+ weeks and you're hitting " + Math.round(avg).toLocaleString() +
      " of your " + Math.round(goal).toLocaleString() +
      " kcal goal — that's a stall, not a willpower problem. Raise the goal to " +
      Math.round(goal + 150).toLocaleString() + " kcal?";
  } else if(st.rateWk > 1.0){
    kind = "fast"; to = Math.max(0, g.surplus - 100);
    txt = "Gaining " + fmtRate(st.rateWk) + " lb/wk — faster than a lean bulk needs. Trim the goal to " +
      Math.round(goal - 100).toLocaleString() + " kcal to keep it mostly muscle?";
  }
  if(!kind) return;
  var quiet = addDays(todayStr(), -14);
  if(a.props.some(function(p){ return p.kind === kind && p.d >= quiet; })) return; /* acted or dismissed in the last 14d: stay quiet */
  a.props.unshift({id: uid(), d: todayStr(), kind: kind, from: g.surplus, to: to, text: txt, done: 0});
  if(a.props.length > 12) a.props.length = 12;
}
function autoApplyProp(id){
  var a = autoState(), g = S.goals;
  var p = null;
  for(var i = 0; i < a.props.length; i++) if(a.props[i].id === id) p = a.props[i];
  if(!p || p.done) return;
  p.done = 1;
  if(p.kind === "stall" || p.kind === "fast"){
    g.surplus = p.to; g.mode = "custom"; g.surplusMode = "custom"; /* 2026.10.21-e (audit): without this, the next commitGoals() re-derived the surplus from the mode and the applied proposal silently reverted */
    autoDeriveMacros();
    autoLog("Goal → " + Math.round(goalTotal()).toLocaleString() + " kcal (" + (p.kind === "stall" ? "+150" : "−100") + " — your call).");
  }
  save(); renderAll();
  showToast("Goal updated");
}
function autoDismissProp(id){
  var a = autoState();
  for(var i = 0; i < a.props.length; i++) if(a.props[i].id === id) a.props[i].done = 1;
  save(); paintAutoZone();
}

/* Consistency heatmap painter (2026.10.14-i). One yardstick — today's goal —
   applied to every day, so the colors can never disagree with the targets. */
function paintHeatmap(){
  var grid = document.getElementById("hmGrid"); if(!grid) return;
  var goal = goalTotal(), today = todayStr();
  var end = new Date(today + "T12:00:00");
  end.setDate(end.getDate() + (6 - (end.getDay() + 6) % 7)); /* Sunday of this week */
  var start = new Date(end); start.setDate(start.getDate() - 97); /* Monday, 14 weeks back */
  var html = "", logged = 0, inZone = 0;
  for(var i = 0; i < 98; i++){
    var d = new Date(start); d.setDate(d.getDate() + i);
    var ds = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    if(ds > today){ html += '<span class="hmcell fut"></span>'; continue; }
    if(isLocked(ds)){ html += '<button class="hmcell locked" data-hm="' + ds + '" aria-label="' + ds + ' (locked)"></button>'; continue; }
    var cal = dayTotals(ds).cal, pct = goal > 0 ? cal / goal : 0, op = "";
    if(cal > 0){ logged++; if(pct >= 0.85 && pct <= 1.15) inZone++;
      op = ' style="background:var(--acc);opacity:' + (pct < 0.5 ? ".3" : pct < 0.85 ? ".55" : pct <= 1.15 ? ".85" : "1") + '"'; }
    html += '<button class="hmcell" data-hm="' + ds + '" aria-label="' + ds + '"' + op + '></button>';
  }
  grid.innerHTML = html;
  var sum = document.getElementById("hmSum");
  if(sum) sum.textContent = logged ? Math.round(inZone / logged * 100) + "% in zone" : "";
  grid.querySelectorAll("[data-hm]").forEach(function(b){ b.onclick = function(){
    var now = new Date(todayStr() + "T12:00:00");
    dayOffset = Math.round((new Date(b.getAttribute("data-hm") + "T12:00:00") - now) / 864e5);
    renderDiary(); showView("diary");
  }; });
}

function paintAutoZone(){
  var z = document.getElementById("autoZoneP");
  if(!z) return;
  var a = autoState(), html = "";
  a.props.forEach(function(p){
    if(p.done) return;
    html += '<div style="border:1.5px solid var(--acc);border-radius:6px;padding:10px;margin:8px 0">' +
      '<div style="font-size:12px;font-weight:800;letter-spacing:.4px;color:var(--acc);margin-bottom:4px">AUTOPILOT SUGGESTION</div>' +
      '<div style="font-size:14px;line-height:1.5">' + esc(p.text) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px">' +
      '<button class="bigbtn" style="flex:1;margin:0" data-ap-apply="' + p.id + '">Apply</button>' +
      '<button class="bigbtn" style="flex:1;margin:0;background:none;border:1.5px solid var(--line);color:var(--ink)" data-ap-dismiss="' + p.id + '">Not now</button>' +
      '</div></div>';
  });
  /* Compact feed (2026.10.14-i): the current maintenance is a hero number;
     history is one slim row per entry (value + delta + date) instead of the
     same long sentence repeated. Nothing is hidden — just said once. */
  var feed = a.feed.slice(0, 4);
  var curIx = -1;
  for(var cix = 0; cix < feed.length; cix++){ if(feed[cix].t.indexOf("Maintenance ") === 0){ curIx = cix; break; } }
  var maintVal = function(t){ var m = /→\s*([\d,]+)\s*kcal/.exec(t); return m ? parseInt(m[1].replace(/,/g, ""), 10) : null; };
  var fmtD = function(ds){ var p = String(ds || "").split("-"); if(p.length !== 3) return ds || ""; var mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return (mo[parseInt(p[1], 10) - 1] || "") + " " + parseInt(p[2], 10); };
  var pill = ' <span style="display:inline-block;font-size:10px;font-weight:800;letter-spacing:.6px;color:#0b7a4b;background:#e2f4e9;border-radius:5px;padding:2px 8px;margin-left:2px;vertical-align:3px">CURRENT</span>';
  if(feed.length){
    html += feed.map(function(f, ix){
      var v = maintVal(f.t);
      if(ix === curIx && v != null){
        var dm = /last (\d+) days/.exec(f.t);
        return '<div style="display:flex;align-items:baseline;gap:7px;padding:8px 0 10px;border-top:1px solid var(--line)"><b style="font-size:23px;letter-spacing:-.02em;color:var(--acc)">' + v.toLocaleString() + '</b>' +
          '<span style="font-size:12px;color:var(--muted)">kcal maintenance</span>' + pill +
          '<span style="margin-left:auto;color:var(--muted);font-size:12px">' + (dm ? dm[1] + 'd \u00b7 ' : '') + fmtD(f.d) + '</span></div>';
      }
      if(v != null){
        var older = null;
        for(var k = ix + 1; k < feed.length; k++){ var ov = maintVal(feed[k].t); if(ov != null){ older = ov; break; } }
        var dHtml = "";
        if(older != null && v !== older){ var dv = v - older; dHtml = ' <span style="font-size:11.5px;font-weight:700;color:' + (dv > 0 ? "#0b7a4b" : "#c0392b") + '">' + (dv > 0 ? "+" : "\u2212") + Math.abs(dv).toLocaleString() + '</span>'; }
        return '<div style="display:flex;align-items:baseline;gap:6px;font-size:13px;padding:6px 0;border-top:1px solid var(--line)"><b>' + v.toLocaleString() + '</b><span style="color:var(--muted)">kcal</span>' + dHtml + '<span style="margin-left:auto;color:var(--muted);font-size:12px">' + fmtD(f.d) + '</span></div>';
      }
      return '<div style="font-size:12.5px;color:var(--muted);padding:6px 0;border-top:1px solid var(--line);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(f.t) + ' <span style="font-size:11.5px">\u00b7 ' + fmtD(f.d) + '</span></div>';
    }).join("");
  }
  var lr = document.getElementById("autoLastRun");
  if(lr) lr.textContent = a.lastRun || "";
  /* Maintenance sparkline (2026.10.18-c, Jay's ask): the learned number as a
     line over its stored history (adaptiveHist, capped at 26 entries) —
     appended after the feed, same card, no new chrome. */
  var hist = (S.goals && S.goals.adaptiveHist) || [];
  if(hist.length >= 2){
    var hw = 320, hh = 56, hp = 6;
    var vs = hist.map(function(h){ return h.v; });
    var mn2 = Math.min.apply(null, vs), mx2 = Math.max.apply(null, vs);
    if(mx2 - mn2 < 40){ var mid2 = (mx2 + mn2) / 2; mn2 = mid2 - 20; mx2 = mid2 + 20; }
    var px = function(i){ return (hp + i * (hw - hp * 2) / (hist.length - 1)).toFixed(1); };
    var py = function(v){ return (hh - 15 - (v - mn2) / (mx2 - mn2) * (hh - 25)).toFixed(1); };
    var line = hist.map(function(h, i){ return (i ? "L" : "M") + px(i) + "," + py(h.v); }).join("");
    var lastH = hist[hist.length - 1];
    html += '<div style="border-top:1px solid var(--line);padding-top:8px;margin-top:2px">' +
      '<div style="display:flex;align-items:baseline;gap:6px"><span style="font-size:12px;font-weight:700">Maintenance trend</span>' +
      '<span style="margin-left:auto;font-size:11px;color:var(--muted)">' + fmtD(hist[0].d) + ' \u2192 ' + fmtD(lastH.d) + '</span></div>' +
      '<svg width="100%" height="' + hh + '" viewBox="0 0 ' + hw + ' ' + hh + '" preserveAspectRatio="none" style="display:block;margin-top:2px" aria-label="Learned maintenance history">' +
      '<path d="' + line + '" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + px(hist.length - 1) + '" cy="' + py(lastH.v) + '" r="3" fill="var(--acc)"/>' +
      '<text x="' + hp + '" y="' + (hh - 3) + '" font-size="9" fill="#9a9aa5">' + Math.round(hist[0].v).toLocaleString() + '</text>' +
      '<text x="' + (hw - hp) + '" y="' + (hh - 3) + '" font-size="9" fill="#9a9aa5" text-anchor="end">' + Math.round(lastH.v).toLocaleString() + '</text></svg></div>';
  }
  z.innerHTML = html;
  var unit = document.querySelector('#progOverview [data-pid="auto"]');
  if(unit) unit.style.display = html ? "" : "none";
  z.querySelectorAll("[data-ap-apply]").forEach(function(b){ b.onclick = function(){ autoApplyProp(b.getAttribute("data-ap-apply")); }; });
  z.querySelectorAll("[data-ap-dismiss]").forEach(function(b){ b.onclick = function(){ autoDismissProp(b.getAttribute("data-ap-dismiss")); }; });
}

function autoPilot(){
  var a = autoState(), g = S.goals, today = todayStr(), changed = false;
  if(a.lastRun !== today){
    a.lastRun = today;
    /* 1. FORMULA LAW (2026.10.21-b): once a day the goal re-derives from the
       CURRENT profile (formula, through the single derivation). It moves only
       if a profile input moved — the food log is never an input. A changed
       number lands in the feed with its reason. */
    var prevMaint = g.maintenance || 0;
    commitGoals("formula");
    if(g.maintenance > 0 && prevMaint > 0 && g.maintenance !== prevMaint){
      changed = true;
      autoLog("Maintenance \u2192 " + g.maintenance.toLocaleString() + " kcal — recalculated from your current weight (formula), not your food log.");
    }
    /* 2. stall / too-fast proposals — the one approve step */
    autoCheckStall();
    save();
    if(changed) renderAll();
  }
  paintAutoZone();
}

/* ============ QUIT TRACKER (2026.10.09-f) ============
   Research-grounded phase timelines (cessation research, report 2026-10-09).
   Start dates live under their own keys (fuel.quit.<nicotine|alcohol>.v1) —
   fuel.v1 is never touched here. */
var QT_NIC = [
 {id:"onset",name:"Onset",range:"First 24 hours",color:"#ef4444",d1:0,
  happening:"Blood nicotine halves within ~2 hours. Heart rate and blood pressure begin settling toward baseline, and the brain\u2019s nicotine receptors go quiet as withdrawal begins. A 2025 study found modern disposables deliver nicotine essentially like cigarettes \u2014 same dependence, not weaker.",
  expect:["First urges within 1\u20132 hours, building through the day \u2014 each lasts only minutes","Grazing all day with no break points makes the first 24\u201348h feel like a harder cliff","Restlessness","Appetite starts rising","Edgy, low mood, hard to focus, mild anxiety"],
  tips:["Pre-plan distractions for the 2-hour craving waves","Stay hydrated","Avoid pairing routines (coffee, alcohol) that cue use"],
  danger:null},
 {id:"peak",name:"The Peak",range:"Days 2\u20133",color:"#f97316",d1:2,
  happening:"Nicotine fully clears by ~72 hours. Receptors are at their sharpest point of recalibration and dopamine production hits a low point.",
  expect:["Strongest, most frequent cravings \u2014 each still lasts minutes","Same withdrawal syndrome as cigarettes \u2014 same symptoms, same day 2\u20133 peak","Headaches as nicotine leaves the system","Poor sleep / insomnia","Fatigue and possible quitters\u2019 cough","Peak irritability, anxiety, restlessness, trouble concentrating","Constipation can begin"],
  tips:["Expect one genuinely hard day \u2014 treat everything after as downhill","Eat 5 small meals a day to separate hunger from cravings","Lots of water; limit caffeine near bedtime","Short walks; a long evening walk helps insomnia","Breathe through cravings; nap or go to bed early"],
  danger:"Day 3 is widely reported as the single hardest day."},
 {id:"winddown",name:"Wind-down",range:"Days 4\u20137",color:"#eab308",d1:6,
  happening:"Taste and smell nerve endings begin regenerating \u2014 breathing gets easier. Receptor density starts declining and sleep architecture normalizes.",
  expect:["Cravings still frequent but shorter and arriving less often","Headaches mostly resolving","Sleep starting to settle; fatigue common","Anxiety and restlessness persist but the constant background discomfort eases"],
  tips:["Keep routines; light exercise; consistent bedtime","Keep a ritual replacement (mints, water, walks) \u2014 losing the hand-to-mouth habit itself worsens withdrawal (VCU research)","Give yourself concentration breaks \u2014 brain fog is temporary","Celebrate the 1-week mark: reaching it predicts long-term success"],
  danger:"Overconfidence trap (~days 7\u20138): feeling \u201ccured\u201d and rationalizing \u201cjust one.\u201d Most relapses happen after physical withdrawal passes, not during it."},
 {id:"easing",name:"Easing",range:"Weeks 2\u20134",color:"#3b82f6",d1:29,
  happening:"Circulation (gums/teeth) matches a nonsmoker by 2 weeks and lung function is improving. Dopamine production climbs back; natural reward function stabilizes.",
  expect:["Cravings much less frequent \u2014 mostly cue-triggered, 2\u201310 minutes each","Most physical symptoms gone; insomnia eased","Appetite still elevated","Withdrawal irritability/anxiety largely gone by ~2 weeks \u2014 but thought-triggered cravings can feel like square one"],
  tips:["Map your top-3 triggers and pre-decide replacements (walk, water, 2-minute game)","Use H.A.L.T.: hungry, angry, lonely, tired","Keep a written reasons-to-quit list and revisit it","Redirect romanticized thoughts; lean on support"],
  danger:"Week 3 (\u201cicky three #2\u201d): motivation wears off and cravings return through thought triggers. Stress and social situations are classic cues."},
 {id:"consol",name:"Consolidation",range:"Days 30\u201390",color:"#22c55e",d1:90,
  happening:"Receptors keep normalizing. PET research shows dopamine-production deficits return to normal after ~3 months \u2014 matching never-smokers. Lung function measurably improved; heart-attack risk dropping.",
  expect:["Cravings rare and brief, tied to old cues \u2014 each one survived weakens the habit loop","Appetite settling","Cough and shortness of breath decreasing","Mood generally stable; occasional \u201cblahs\u201d"],
  tips:["Use the five Ds: delay, distract, drink water, deep breathing, discuss","Plan ahead for surprise cravings at month 3 rather than being ambushed","Positive self-talk: feelings are temporary","Celebrate milestones"],
  danger:"Month 3 (\u201cicky three #3\u201d): the \u201cblahs\u201d \u2014 \u201cis that all there is?\u201d \u2014 plus \u201ccelebration\u201d or \u201cone to prove it\u201d thoughts."}
];
var QT_NIC_MILES = [
 {d:3,label:"Nicotine fully cleared (~72h)"},
 {d:7,label:"1 week \u2014 cravings shorter; predicts long-term success"},
 {d:14,label:"2 weeks \u2014 circulation like a nonsmoker"},
 {d:30,label:"1 month \u2014 entering consolidation"},
 {d:90,label:"3 months \u2014 dopamine back to normal (Rademacher 2016)"}
];
var QT_ALC = [
 {id:"reset",name:"Reset",range:"Days 1\u20137",color:"#14b8a6",d1:6,
  happening:"The liver starts reducing inflammation within 24 hours and clears the toxin backlog. The body rehydrates as alcohol\u2019s diuretic effect ends.",
  expect:["Sleep briefly unsettled, then improving \u2014 better mornings by week\u2019s end","Mild grumpiness for a day or two (habit interruption, not withdrawal)","Digestion improving within days","Reduced facial puffiness may begin"],
  tips:["Hydrate deliberately","Keep sleep routines","Plan social situations: alternate drinks, mocktails","The first-days\u2019 irritability is temporary"],
  danger:null},
 {id:"repair",name:"Visible repair",range:"Days 8\u201330",color:"#10b981",d1:29,
  happening:"REM sleep normalizes. Liver enzymes (ALT/AST) typically normalize around 2 weeks; liver fat drops up to ~20% by 1 month. In a controlled study of regular drinkers (Mehta et al. 2018, BMJ Open), one month off meant weight \u22121.5%, insulin resistance \u221225.9%, systolic BP \u22126.6%.",
  expect:["Sleep quality improves dramatically","Skin: less puffiness, more even tone, redness fading","Weight loss often begins as empty alcohol calories disappear","Sharper thinking (~18 days); mood evens out","Sugar cravings in weeks 2\u20133, then fade","Gut symptoms resolve within 4 weeks"],
  tips:["Have low-calorie snacks ready for the sugar cravings","Exercise to support mood and weight","Track weight and sleep to make the gains visible","Plan for weekend and social triggers"],
  danger:"Social occasions, weekends, celebrations (\u201cI\u2019ve earned one\u201d) and habit cues like after-work drinks are the classic trip points."},
 {id:"healing",name:"Deep healing",range:"Days 31\u201390",color:"#15803d",d1:90,
  happening:"Sleep becomes deeper and more consistent. Dopamine systems blunted by regular drinking recover. Fatty liver keeps reversing, cardiovascular risk trends down, and immune response strengthens.",
  expect:["Steadier daytime energy, fewer afternoon slumps","Anxiety and low mood tied to drinking ease","Continued gradual weight loss; leaner appearance","Stronger hair and nails with better nutrient absorption","Any urges are social/habit cues \u2014 easier to ride out than week 1"],
  tips:["Rebuild social rituals that don\u2019t center on alcohol","Keep tracking to lock in the habit","Benefits compound \u2014 long-term research finds former drinkers\u2019 health comparable to lifetime abstainers"],
  danger:null}
];
var QT_ALC_MILES = [
 {d:7,label:"1 week \u2014 first genuinely good sleep"},
 {d:14,label:"2 weeks \u2014 liver enzymes normalizing"},
 {d:30,label:"1 month \u2014 BP down, insulin sensitivity up (Mehta 2018)"},
 {d:90,label:"3 months \u2014 sustained energy, liver substantially repaired"}
];
var QT_DEF = {
 nicotine:{title:"Nicotine-free",phases:QT_NIC,miles:QT_NIC_MILES,seedTime:"T14:00:00",info:"quitnic"},
 alcohol:{title:"Alcohol-free",phases:QT_ALC,miles:QT_ALC_MILES,seedTime:"T00:00:00",info:"quitalc"}
};
function qtKey(key){ return "fuel.quit."+key+".v1"; }
function qtGet(key){
  try{ var v = JSON.parse(localStorage.getItem(qtKey(key))); if(v && typeof v==="object") return v; }catch(e){}
  return null;
}
function qtSet(key, obj){ try{ localStorage.setItem(qtKey(key), JSON.stringify(obj)); }catch(e){} }
/* Seed once: a tracker adopts the diary streak's last-use date when it has one;
   otherwise it starts empty until the user taps Start. Additive only. */
function qtSeed(){
  ["nicotine","alcohol"].forEach(function(key){
    var cur = qtGet(key);
    var lu = null;
    try{ lu = S.streaks && S.streaks[key] && S.streaks[key].lastUse; }catch(e){}
    if(key==="nicotine"){
      if(cur) return;
      if(lu) qtSet(key, {start:lu + QT_DEF[key].seedTime}); else if(!cur) qtSet(key, {start:null});
    }else{
      /* 2026.10.11-e: alcohol adopts the diary streak when the Timeline has no
         start yet — fixes "input data" showing while a streak is going */
      if(cur && cur.start) return;
      if(lu) qtSet(key, {start:lu + QT_DEF[key].seedTime});
      else if(!cur) qtSet(key, {start:null});
    }
  });
}
function qtHours(key, nowMs){
  var s = qtGet(key); if(!s || !s.start) return null;
  var t = new Date(s.start).getTime(); if(isNaN(t)) return null;
  return Math.max(0, ((nowMs==null?Date.now():nowMs) - t)/36e5);
}
function qtDayNum(h){ return Math.floor(h/24)+1; }
function qtPhaseIdx(phases, h){
  var d = Math.floor(h/24);
  for(var i=0;i<phases.length;i++){ if(d<=phases[i].d1) return i; }
  return phases.length; /* past day 90: complete */
}
var qtSelIdx = {nicotine:-1, alcohol:-1};
function qtEsc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }
function qtRenderTracker(key){
  var def = QT_DEF[key];
  var el = document.getElementById(key==="nicotine"?"qtNic":"qtAlc");
  if(!el) return;
  qtSeed();
  var st = qtGet(key), startISO = st && st.start;
  var h = startISO ? qtHours(key) : null;
  var html = '<div class="card qt-tracker">';
  html += '<div class="qt-head"><span class="qt-title">'+def.title+'</span>'
    + '<button class="ginfo sm" data-qtinfo="'+def.info+'" aria-label="About '+def.title+' phases">i</button>'
    + (h==null ? '' : '<span class="qt-day"><span class="qt-daynum">'+qtDayNum(h)+'</span><br><span class="qt-daylbl">DAY</span></span>')
    + '</div>';
  if(h==null){
    var n0 = new Date();
    var dv = n0.getFullYear()+"-"+String(n0.getMonth()+1).padStart(2,"0")+"-"+String(n0.getDate()).padStart(2,"0");
    html += '<div class="qt-sub">Not started yet \u2014 set your last day and tap start.</div>'
      + '<div class="qt-editrow"><input type="date" id="qt-'+key+'-date" value="'+dv+'" max="'+dv+'" aria-label="Last day">'
      + '<button class="qt-start" id="qt-'+key+'-start" style="width:auto;flex:1">Start counter</button></div>'
      + '<div class="qt-note">For a social drinker there is no withdrawal here \u2014 this timeline tracks sleep, hydration, liver, mood, weight and skin recovery.</div>';
  } else {
    var pi = qtPhaseIdx(def.phases, h);
    var done = pi>=def.phases.length;
    var shown = qtSelIdx[key]>=0 ? qtSelIdx[key] : Math.min(pi, def.phases.length-1);
    var cur = def.phases[Math.min(pi, def.phases.length-1)];
    var dNow = Math.floor(h/24);
    html += '<div class="qt-sub">'+(done
      ? "90+ days \u2014 past the timeline. This is just life now."
      : ("Day "+Math.min(qtDayNum(h),90)+" \u00b7 "+cur.name+" ("+cur.range+")"))+'</div>'; /* 2026.10.09-h: was "Day 91 · …(Days 30–90)" on the last phase day */
    var segs="", lbls="";
    def.phases.forEach(function(p,i){
      var prev = i===0?0:def.phases[i-1].d1+1, dur = p.d1-prev+1, fg = Math.sqrt(dur).toFixed(2);
      var cls = "qt-seg"+((i===pi&&!done)?" qt-cur":"")+(i===shown?" qt-sel":"");
      segs += '<button class="'+cls+'" data-qtkey="'+key+'" data-qti="'+i+'" title="'+qtEsc(p.name+" \u00b7 "+p.range)+'" aria-label="'+qtEsc(p.name+", "+p.range)+'" style="flex:'+fg+' 1 0%;background:'+p.color+'59;color:'+p.color+'"></button>';
      lbls += '<span class="qt-seglbl" style="flex:'+fg+' 1 0%">'+p.name+'</span>';
    });
    html += '<div class="qt-tl">'+segs+'</div><div class="qt-seglbls">'+lbls+'</div>';
    html += '<div class="qt-mtrack">'+def.miles.map(function(m){
      var pct = Math.min(100, m.d/91*100).toFixed(1);
      return '<span class="qt-mdot'+(dNow>=m.d?" done":"")+'" style="left:'+pct+'%" title="'+qtEsc(m.label)+'"></span>';
    }).join("")+'</div>';
    var p = def.phases[shown];
    html += '<div class="card qt-card" style="border-top-color:'+p.color+';margin:10px 0 0">'
      + '<div class="qt-phname">'+p.name+' <span class="qt-phrange">'+p.range+'</span></div>'
      + '<div class="qt-phsec"><b>What\u2019s happening</b><p>'+p.happening+'</p></div>'
      + '<div class="qt-phsec"><b>Expect</b><ul>'+p.expect.map(function(x){return '<li>'+x+'</li>';}).join("")+'</ul></div>'
      + '<div class="qt-phsec"><b>Try this</b><ul>'+p.tips.map(function(x){return '<li>'+x+'</li>';}).join("")+'</ul></div>'
      + (p.danger?'<div class="qt-danger"><b>\u26a0 Watch out</b>'+p.danger+'</div>':'')
      + '</div>';
    html += '<div class="card" style="margin:10px 0 0"><div class="flabel" style="margin-bottom:2px">Milestones</div>'
      + def.miles.map(function(m){
        var reached = dNow>=m.d;
        return '<div class="qt-mrow"><span class="qt-mdot2'+(reached?" done":"")+'"></span><span>'+m.label+'</span><span class="qt-mwhen">'+(reached?"done":"day "+m.d)+'</span></div>';
      }).join("")+'</div>';
    html += '<div class="card" style="margin:10px 0 0"><div class="flabel" style="margin-bottom:8px">Quit start</div>'
      + '<div class="qt-editrow"><input type="date" id="qt-'+key+'-date" value="'+startISO.slice(0,10)+'" aria-label="Start date">'
      + '<input type="time" id="qt-'+key+'-time" value="'+startISO.slice(11,16)+'" aria-label="Start time">'
      + '<button class="qt-save" id="qt-'+key+'-save">Save</button></div>'
      + '<button class="qt-reset" id="qt-'+key+'-reset">Restart counter from now</button></div>';
  }
  html += '</div>';
  el.innerHTML = html;
  el.querySelectorAll(".qt-seg").forEach(function(b){
    b.onclick = function(){
      var k = b.getAttribute("data-qtkey"), i = +b.getAttribute("data-qti");
      qtSelIdx[k] = (qtSelIdx[k]===i ? -1 : i);
      renderQuit();
    };
  });
  var ib = el.querySelector("[data-qtinfo]");
  if(ib) ib.onclick = function(){ openInfo(ib.getAttribute("data-qtinfo")); };
  var sv = document.getElementById("qt-"+key+"-save") || document.getElementById("qt-"+key+"-start");
  if(sv) sv.onclick = function(){
    var dEl = document.getElementById("qt-"+key+"-date");
    var tEl = document.getElementById("qt-"+key+"-time");
    var d = dEl && dEl.value; if(!d) return;
    var t = (tEl && tEl.value) || "00:00";
    var iso = d+"T"+t+":00";
    if(isNaN(new Date(iso).getTime())) return;
    qtSet(key, {start:iso}); qtSelIdx[key] = -1; renderQuit();
  };
  var rs = document.getElementById("qt-"+key+"-reset");
  if(rs) rs.onclick = function(){
    if(!confirm("Restart the "+def.title.toLowerCase()+" counter from right now?")) return;
    var n = new Date();
    var iso = n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0")
      +"T"+String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0")+":00";
    qtSet(key, {start:iso}); qtSelIdx[key] = -1; renderQuit();
  };
}
function renderQuit(){
  qtSeed();
  qtRenderTracker("nicotine");
  qtRenderTracker("alcohol");
}
(function(){
  var qo = document.getElementById("quitOpen");
  if(qo) qo.onclick = function(){ showView("quit"); };
  var qb = document.getElementById("quitBack");
  if(qb) qb.onclick = function(){ showView(viewReturn); }; /* 2026.10.11-d: back to where you came from */
})();
