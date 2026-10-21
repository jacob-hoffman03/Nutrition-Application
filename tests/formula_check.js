/* Formula check tests (2026.10.21, Jay's fix):
   The learned number stays the source, but commitGoals now guards it with
   a Mifflin-St Jeor sedentary floor (BMR x 1.2):
   1. Jay's real case: profile 23M, 5'10", 126.2 lb -> BMR 1,574 (at 125 lb:
      1,568), floor ~1,885. A held/learned 1,816 must be raised to the floor,
      stamped src=learned-stale-floored / learned-floored, with formulaCheck
      recording the learned value it replaced.
   2. A learned number ABOVE the floor is untouched (log calibrates).
   3. No data still presents NO number (nodata law unchanged) — the formula
      check never stands in as a source.
   4. No usable profile (no sex) -> no check, learned applies as before. */
const fs = require("fs");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ FAIL: " + name); } };

function boot() {
  const errors = [];
  const dom = new JSDOM(html, {
    url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      w.__errs = errors;
      w.addEventListener("error", e => errors.push(String(e.message)));
      w.localStorage.setItem("fuel.flags.v1", JSON.stringify({ zeroReset: 1, calcNet: 1 }));
    }
  });
  return { w: dom.window, errors };
}
const tick = () => new Promise(r => setTimeout(r, 80));

(async () => {
  console.log("Scenario F1: Jay's held 1,816 is below his floor -> floored");
  {
    const { w, errors } = boot(); await tick();
    w.eval(`
      S.goals.profile = {sex:"m", age:23, heightIn:70, weightLb:125, bodyFat:0, activityKey:"moderate", auto:false, units:"imp"};
      S.goals.adaptive = {ok:true, stale:true, value:1816, learned:1816, avg:2100, rateWk:0.57, days:12, span:18, partial:0, updated:"2026-10-10", shiftHold:{shift:"2026-10-11", span:5}};
      S.goals.maintenance = 1816; S.goals.mode = "custom"; S.goals.surplusMode = "rate"; S.goals.gainRate = 1.5; S.goals.surplus = 750; S.goals.macroAuto = true;
      S.goals.derived = {src:"learned", maint:1816, at:"2026-10-10", why:"adaptive"};
      save();
    `);
    const fc = JSON.parse(w.eval(`JSON.stringify(formulaCheck())`));
    ok(fc && fc.bmr === 1568, "Mifflin BMR for 23M/70in/125lb = 1568 (got " + (fc && fc.bmr) + ")");
    ok(fc && fc.floor === 1882, "sedentary floor = BMR x 1.2 = 1882 (got " + (fc && fc.floor) + ")");
    w.eval(`commitGoals("test")`);
    const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
    ok(g.maintenance === 1882, "maintenance raised to floor 1882 (got " + g.maintenance + ")");
    ok(g.formulaCheck && g.formulaCheck.floored === true && g.formulaCheck.learned === 1816, "formulaCheck records learned 1816 + floored");
    ok(g.derived && g.derived.src === "learned-floored", "provenance stamped learned-floored (got " + (g.derived && g.derived.src) + ")");
    ok(g.surplus === 750, "gain-rate surplus untouched at 750 (got " + g.surplus + ")");
    ok(w.eval(`goalTotal()`) === 2632, "goal total = 1882 + 750 = 2632 (got " + w.eval(`goalTotal()`) + ")");
    w.eval(`paintAdaptive()`);
    ok(/formula check/.test(w.eval(`document.getElementById("goalSrc").textContent`)), "check-in line explains the formula check");
    ok(errors.length === 0, "no runtime errors (" + errors.join("; ") + ")");
    w.close();
  }

  console.log("Scenario F2: learned above the floor is untouched");
  {
    const { w, errors } = boot(); await tick();
    w.eval(`
      S.goals.profile = {sex:"m", age:23, heightIn:70, weightLb:125, bodyFat:0, activityKey:"moderate", auto:false, units:"imp"};
      S.goals.adaptive = {ok:true, stale:false, value:2300, learned:2300, avg:2300, rateWk:0, days:15, span:20, partial:0, updated:"2026-10-20"};
      S.goals.maintenance = 2300; S.goals.mode = "bulk"; S.goals.macroAuto = true;
      S.goals.derived = {src:"learned", maint:2300, at:"2026-10-20", why:"adaptive"};
      save(); commitGoals("test");
    `);
    const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
    ok(g.maintenance === 2300, "maintenance stays learned 2300 (got " + g.maintenance + ")");
    ok(g.formulaCheck && g.formulaCheck.floored === false, "formulaCheck present, not floored");
    ok(g.derived && g.derived.src === "learned", "provenance stays learned");
    ok(errors.length === 0, "no runtime errors");
    w.close();
  }

  console.log("Scenario F3: no data -> still no number (formula never stands in)");
  {
    const { w, errors } = boot(); await tick();
    w.eval(`
      S.goals.profile = {sex:"m", age:23, heightIn:70, weightLb:125, bodyFat:0, activityKey:"moderate", auto:false, units:"imp"};
      S.goals.adaptive = null; S.goals.maintenance = 0; S.goals.surplus = 0; S.goals.derived = null;
      save(); commitGoals("test");
    `);
    const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
    ok(g.maintenance === 0, "maintenance stays 0 without data (got " + g.maintenance + ")");
    ok(g.derived && g.derived.src === "nodata", "provenance stays nodata");
    ok(errors.length === 0, "no runtime errors");
    w.close();
  }

  console.log("Scenario F4: profile without sex -> no check, old behaviour");
  {
    const { w, errors } = boot(); await tick();
    w.eval(`
      S.goals.profile = {sex:"", age:23, heightIn:70, weightLb:125, bodyFat:0, activityKey:"moderate", auto:false, units:"imp"};
      S.goals.adaptive = {ok:true, stale:false, value:1816, learned:1816, avg:2100, rateWk:0.57, days:12, span:18, partial:0, updated:"2026-10-10"};
      S.goals.maintenance = 1816; S.goals.mode = "custom"; S.goals.macroAuto = true;
      S.goals.derived = {src:"learned", maint:1816, at:"2026-10-10", why:"adaptive"};
      save(); commitGoals("test");
    `);
    const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
    ok(g.maintenance === 1816, "maintenance unchanged without a checkable profile (got " + g.maintenance + ")");
    ok(g.formulaCheck === null, "formulaCheck is null");
    ok(errors.length === 0, "no runtime errors");
    w.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
