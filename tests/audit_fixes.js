/* Audit regression tests — 2026.10.21-e fixes.
   Boots the real app in jsdom (same harness pattern as loc_feature.js). */
const fs = require("fs"), path = require("path");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log("  ✗ " + n); } };
const tick = (ms=120) => new Promise(r => setTimeout(r, ms));

function boot(seedObj) {
  const dom = new JSDOM(html, { url: "https://x.test/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) { w.fetch = () => new Promise(() => {}); /* never resolves: boot restore paths stay pending, app state comes from load() */
      if (seedObj) for (const k in seedObj) w.localStorage.setItem(k, seedObj[k]); } });
  return dom.window;
}
const JAY = { sex: "male", age: 23, heightIn: 70, weightLb: 126.2, bodyFat: 0, waistIn: 0, activityKey: "very", auto: true, units: "imp" };

async function main() {
  /* ---- 1. zeroReset can never re-fire once the state carries the marker ---- */
  {
    const state = { zeroResetDone: 1, days: {}, customFoods: [], favorites: [], weights: [], pmWeights: [],
      goals: { maintenance: 2715, surplus: 750, protein: 126, carbs: 380, fat: 95, mode: "bulk", surplusMode: "rate", gainRate: 1.5, macroAuto: true, profile: { ...JAY }, nutrTargets: {}, adaptiveHist: [] },
      training: { sched: {}, done: {}, deloads: {} }, profile: { name: "J", img: "", theme: "# 2f7cf6".replace(" ", "") }, bottles: [], waterV2: 1, recipes: [] };
    const w = boot({ "fuel.v1": JSON.stringify(state) }); await tick(); /* NO flags key at all */
    ok(w.eval("S.goals.maintenance") === 2715, "zeroReset: marked state survives a lost flags file (maintenance kept)");
    ok(w.eval("S.goals.profile.weightLb") === 126.2, "zeroReset: profile kept");
  }
  /* ---- 2. legacy numeric activity migrates to the CORRECT tier ---- */
  {
    const p = { ...JAY }; delete p.activityKey; p.activity = 1.9;
    const state = { zeroResetDone: 1, days: {}, customFoods: [], favorites: [], weights: [], pmWeights: [],
      goals: { maintenance: 0, surplus: 0, protein: 0, carbs: 0, fat: 0, mode: "bulk", macroAuto: true, profile: p, nutrTargets: {}, adaptiveHist: [] },
      training: { sched: {}, done: {}, deloads: {} }, profile: { name: "J", img: "", theme: "#2f7cf6" }, bottles: [], waterV2: 1, recipes: [] };
    const w = boot({ "fuel.v1": JSON.stringify(state), "fuel.flags.v1": JSON.stringify({ zeroReset: 1 }) }); await tick();
    ok(w.eval("S.goals.profile.activityKey") === "extra", "activity migration: 1.9 -> extra (was: unreachable + shifted to 'very'), got " + w.eval("S.goals.profile.activityKey"));
    ok(w.eval("S.goals.profile.activity") === undefined, "activity migration: legacy numeric field removed");
  }
  /* ---- 3. valid JSON without goals is treated as damage (corrupt path) ---- */
  {
    const w = boot({ "fuel.v1": JSON.stringify({ days: {} }), "fuel.flags.v1": JSON.stringify({ zeroReset: 1 }) }); await tick(200);
    ok(w.eval("corruptBoot") === true, "goal-less state: corruptBoot set (snapshot restore path), not silent seed swap");
    const stash = w.eval("(()=>{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.indexOf('fuel.corrupt.')===0) return k; } return null; })()");
    ok(!!stash, "goal-less state: damaged bytes stashed under fuel.corrupt.*");
  }
  /* ---- 4. adoptState normalizes a raw old-shape object (seed/import/snapshot path) ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    w.eval(`S.goals.profile = ${JSON.stringify(JAY)}; S.goals.mode = "bulk"; S.goals.surplusMode = "rate"; S.goals.gainRate = 1.5; S.goals.macroAuto = true; commitGoals("t");`);
    const rawOld = JSON.parse(JSON.stringify({ days: {}, goals: { maintenance: 2000, surplus: 100, profile: { sex: "m", age: 30, heightIn: 70, weightLb: 150, activityKey: "active" } } }));
    w.eval(`adoptState(${JSON.stringify(rawOld)})`);
    ok(Array.isArray(w.eval("S.pmWeights")), "adoptState: pmWeights default-filled");
    ok(Array.isArray(w.eval("S.goals.adaptiveHist")), "adoptState: adaptiveHist default-filled");
    ok(!!w.eval("S.streaks && S.streaks.nicotine"), "adoptState: streaks re-seeded");
    ok(w.eval("S.days && typeof S.days === 'object'"), "adoptState: days object present");
  }
  /* ---- 5. Calorie Check Apply sticks through later commits + stamps cooldown ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    w.eval(`S.goals.profile = ${JSON.stringify(JAY)}; S.goals.mode = "bulk"; S.goals.surplusMode = "rate"; S.goals.gainRate = 1.5; S.goals.macroAuto = true; commitGoals("t"); save();`);
    ok(w.eval("S.goals.surplus") === 750, "calcheck setup: rate-mode surplus 750");
    /* craft weigh-ins: fast gain (actual rate above the bulk band) -> suggest -150 */
    w.eval(`S.weights = []; for(let i=0;i<12;i++){ const d = addDays(todayStr(), -40 + i*3); S.weights.push({d, w: 120 + i*1.3}); } save(); showView("progress"); paintCalCheck();`);
    const shown = w.eval(`document.getElementById("calCheckApply").style.display !== "none"`);
    ok(shown, "calcheck: Apply offered for out-of-band trend");
    /* steep crafted gain (+2.39%/wk vs a 0.71-1.66 band) deterministically suggests -150 */
    w.eval(`document.getElementById("calApplyBtn").click();`);
    ok(w.eval("S.goals.surplus") === 600, "calcheck apply: surplus 750 -> 600, got " + w.eval("S.goals.surplus"));
    ok(w.eval("S.goals.lastAutoTune") === w.eval("todayStr()"), "calcheck apply: lastAutoTune stamped (cooldown alive)");
    ok(w.eval("S.goals.surplusMode") === "custom", "calcheck apply: surplusMode switched to custom");
    w.eval(`commitGoals("later");`);
    ok(w.eval("S.goals.surplus") === 600, "calcheck apply: survives the next commitGoals (was: silent revert)");
    w.eval(`paintCalCheck();`);
    ok(w.eval(`document.getElementById("calCheckApply").style.display`) === "none", "calcheck: cooldown hides Apply right after a tune");
  }
  /* ---- 6. Autopilot proposal Apply sticks too ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    w.eval(`S.goals.profile = ${JSON.stringify(JAY)}; S.goals.mode = "bulk"; S.goals.surplusMode = "rate"; S.goals.gainRate = 1.5; S.goals.macroAuto = true; commitGoals("t");`);
    w.eval(`const a = autoState(); a.props.unshift({id:"t1", d: todayStr(), kind:"stall", from:750, to:900, text:"x", done:0}); autoApplyProp("t1");`);
    ok(w.eval("S.goals.surplus") === 900, "autopilot apply: surplus -> 900");
    w.eval(`commitGoals("later");`);
    ok(w.eval("S.goals.surplus") === 900, "autopilot apply: survives the next commitGoals (was: silent revert)");
  }
  /* ---- 7. mealCals NaN guard ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    w.eval(`const d = day(); d.meals.breakfast.push({n:"bad", cal: undefined, p:0, c:0, f:0}); d.meals.lunch.push({n:"ok", cal: 300, p:10, c:10, f:10});`);
    const mc = w.eval("mealCals(todayStr())");
    ok(mc.breakfast === 0 && mc.lunch === 300, "mealCals: NaN entry reads as 0, not NaN");
  }
  /* ---- 8. completeDayCals window is a full WIN days ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    w.eval(`S.goals.profile = ${JSON.stringify(JAY)}; S.goals.mode="bulk"; S.goals.surplusMode="rate"; S.goals.gainRate=1.5; S.goals.macroAuto=true; commitGoals("t");
      for(let i=1;i<=21;i++){ const ds = addDays(todayStr(), -i); const d = S.days[ds] || (S.days[ds] = emptyDay()); d.meals.breakfast.push({n:"x", cal:3000, p:100, c:300, f:100}); } save();`);
    const r = w.eval("completeDayCals(21)");
    ok(r.logged === 21, "completeDayCals(21): sees all 21 complete days (was 20), got " + r.logged);
  }
  /* ---- 9. dailyMedals always fills 3 when the bands have medals ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    let all3 = true, badDay = "";
    for (let i = 0; i < 90; i++) {
      const ds = w.eval(`addDays(todayStr(), ${-i})`);
      const n = w.eval(`dailyMedals(${JSON.stringify(ds)}).length`);
      if (n !== 3) { all3 = false; badDay = ds + " -> " + n; break; }
    }
    ok(all3, "dailyMedals: 3 featured medals on 90 consecutive days " + badDay);
  }
  /* ---- 10. recentFoods ignores empty browsing shells ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    w.eval(`const old = addDays(todayStr(), -20); const d = S.days[old] || (S.days[old] = emptyDay()); d.meals.breakfast.push({n:"Chobani Plain Non- Fat Greek Yogurt", cal:100, p:17, c:6, f:0});
      for(let i=0;i<14;i++){ const k = addDays(todayStr(), -i); if(!S.days[k]) S.days[k] = emptyDay(); } save();`);
    const rec = w.eval("recentFoods().map(f=>f.n)");
    ok(rec.some(n => n.indexOf("Chobani") === 0), "recentFoods: real food survives 14 empty day shells, got " + JSON.stringify(rec.slice(0, 3)));
  }
  /* ---- 11. RDA targets honor sex:"male" (seed/export shape) ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    w.eval(`S.goals.profile = ${JSON.stringify(JAY)};`);
    const iron = w.eval(`profileNutrTarget("Iron")`);
    ok(iron && iron.val === 8, "profileNutrTarget: sex 'male' -> iron RDA 8 mg (was: fell back to FDA 18), got " + JSON.stringify(iron));
    ok(w.eval("potassiumTarget()") === 3400, "potassiumTarget: male AI 3400");
  }
  /* ---- 12. sheet rows carry no fake index suffix ---- */
  {
    const w = boot({ "fuel.flags.v1": JSON.stringify({ zeroReset: 1, calcNet: 1 }) }); await tick();
    w.eval(`openSheet("breakfast"); renderSheetResults("egg");`);
    await tick(60);
    const bad = w.eval(`(()=>{ const els = document.querySelectorAll("#sheetResults .fsub"); for(const e of els){ if(/·\\s*\\d+\\s*$/.test(e.textContent)) return e.textContent; } return null; })()`);
    ok(!bad, "sheet rows: no ' · N' index suffix in serving sub-lines" + (bad ? " — found: " + bad : ""));
  }

  console.log(`\naudit_fixes: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error("CRASH", e); process.exit(2); });
