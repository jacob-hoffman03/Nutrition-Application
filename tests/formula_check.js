/* Formula goal tests (2026.10.21-b) — this file began as tests for the
   formula CHECK (a sedentary floor guarding the learned number, -a). Jay
   then replaced the model entirely: the formula IS the goal now. These
   tests pin formulaGoal()/commitGoals() arithmetic directly:
   1. Jay's exact stats: 23M, 5'10", 126.2 lb, Very Active -> BMR 1,574,
      maintenance 2,715, and with his +1.5 lb/wk rate the goal is 3,465.
   2. The old failure mode is impossible: no state of the log can produce
      the 1,816 he was shown — sedentary for his stats is already 1,889.
   3. Female Mifflin (-161) and Katch-McArdle (body fat set) paths.
   4. formulaGoal() returns null without sex/stats -> commitGoals nodata. */
const fs = require("fs");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ FAIL: " + name); } };

function boot() {
  const dom = new JSDOM(html, {
    url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      w.localStorage.setItem("fuel.flags.v1", JSON.stringify({ zeroReset: 1, calcNet: 1 }));
    }
  });
  return dom.window;
}
const tick = () => new Promise(r => setTimeout(r, 80));
const JAY = `{sex:"male",age:23,heightIn:70,weightLb:126.2,bodyFat:0,activityKey:"very",auto:false,units:"lb",updatedAt:"2026-10-01"}`;

(async () => {
  console.log("Formula goal: Jay's exact case");
  let w = boot(); await tick();
  let ev = x => w.eval(x);
  ev(`S.goals.profile = ${JAY}; S.goals.surplusMode = "rate"; S.goals.gainRate = 1.5; S.goals.mode = "bulk"; commitGoals("t");`);
  ok(ev("formulaGoal().bmr") === 1574, "BMR 1,574, got " + ev("formulaGoal().bmr"));
  ok(ev("formulaGoal().maintenance") === 2715, "maintenance 2,715 at x1.725, got " + ev("formulaGoal().maintenance"));
  ok(ev("S.goals.maintenance") === 2715, "committed maintenance 2,715");
  ok(ev("goalTotal()") === 3465, "goal total 3,465 (2,715 + 750), got " + ev("goalTotal()"));
  ok(ev("S.goals.derived.src") === "formula", "src=formula");
  ev(`S.goals.profile.activityKey = "sedentary"; commitGoals("t");`);
  ok(ev("S.goals.maintenance") === 1888, "sedentary for his stats is 1,888 — the old 1,816 cannot occur, got " + ev("S.goals.maintenance"));

  console.log("Formula goal: female + Katch paths");
  w = boot(); await tick(); ev = x => w.eval(x);
  ev(`S.goals.profile = {sex:"female",age:30,heightIn:65,weightLb:140,bodyFat:0,activityKey:"moderate",auto:false,units:"lb",updatedAt:""}; commitGoals("t");`);
  /* BMR = 10*63.50 + 6.25*165.1 - 150 - 161 = 1,355.9 -> x1.465 = 1,986 */
  ok(ev("S.goals.maintenance") === 1986, "female moderate maintenance 1,986, got " + ev("S.goals.maintenance"));
  ev(`S.goals.profile = ${JAY}; S.goals.profile.bodyFat = 15; commitGoals("t");`);
  /* Katch BMR = 370 + 21.6 * (57.24 * 0.85) = 1,420.9 -> 1,421; x1.725 = 2,451 */
  ok(ev("formulaGoal().bmr") === 1421, "Katch-McArdle BMR 1,421 with body fat set, got " + ev("formulaGoal().bmr"));
  ok(ev("S.goals.maintenance") === 2451, "Katch maintenance 2,451, got " + ev("S.goals.maintenance"));

  console.log("Formula goal: missing inputs -> no number");
  w = boot(); await tick(); ev = x => w.eval(x);
  ev(`S.goals.profile = {sex:"",age:23,heightIn:70,weightLb:130,bodyFat:0,activityKey:"very",auto:false,units:"lb",updatedAt:""};`);
  ok(ev("formulaGoal()") === null, "no sex -> formulaGoal null");
  ev(`commitGoals("t");`);
  ok(ev("S.goals.maintenance") === 0 && ev("S.goals.derived.src") === "nodata", "commit -> 0 / nodata");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
