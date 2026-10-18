/* v5 level-shift estimator verification (2026.10.18-a) */
const fs = require("fs");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const exportJson = fs.readFileSync("/home/hatch/workspace/user/files/fuel-data-8.json", "utf8");

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ FAIL: " + n); } };
const tick = () => new Promise(r => setTimeout(r, 120));

function boot(seed) {
  const errors = [];
  const dom = new JSDOM(html, {
    url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      w.addEventListener("error", e => errors.push(String(e.message)));
      w.localStorage.setItem("fuel.flags.v1", JSON.stringify({ zeroReset: 1, calcNet: 1 }));
      if (seed) w.localStorage.setItem("fuel.v1", seed);
    }
  });
  return { w: dom.window, errors };
}

async function testRealExport() {
  console.log("Test 1: Jay's real export (fuel-data-8) -> shift HOLD");
  const { w, errors } = boot(exportJson); await tick();
  const r = JSON.parse(w.eval(`JSON.stringify(adaptiveCalc())`));
  ok(r.ok === false && r.reason === "shift", "adaptiveCalc refuses fresh number, reason=shift (got ok=" + r.ok + ", reason=" + r.reason + ")");
  ok(r.shift === "2026-10-11", "shift detected at 2026-10-11 (got " + r.shift + ")");
  w.eval(`applyAdaptive()`);
  const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  ok(g.maintenance === 1917, "maintenance HELD at 1917, no further sinking (got " + g.maintenance + ")");
  ok(g.adaptive.stale === true, "stale flag set");
  ok(g.adaptive.shiftHold && g.adaptive.shiftHold.shift === "2026-10-11", "shiftHold recorded");
  const src = w.eval(`document.getElementById("goalSrc").textContent`);
  ok(/holding/.test(src) && /2026-10-11/.test(src) && /2026-10-21/.test(src), "source line explains the hold + gate date (" + src + ")");
  ok(errors.length === 0, "no runtime errors (" + errors.join("; ") + ")");
  w.close();
}

async function testSegment() {
  console.log("Test 2: synthetic post-shift segment (gate open) -> segment estimate");
  const { w, errors } = boot(null); await tick();
  w.eval(`
    S.goals.profile = {sex:"male", age:23, heightIn:70, weightLb:126.5, bodyFat:0, activityKey:"very", auto:false, units:"lb"};
    S.goals.adaptive = null; S.goals.maintenance = 2000; S.goals.surplus = 750; S.goals.mode = "bulk"; S.goals.macroAuto = true;
    S.days = {}; S.weights = [];
    /* flat ~120, then a +6 lb jump 12 days ago, confirmed flat at the new level */
    S.weights.push({d: addDays(todayStr(), -20), w: 120});
    S.weights.push({d: addDays(todayStr(), -18), w: 120.5});
    const J = addDays(todayStr(), -12);
    S.weights.push({d: J, w: 126.5});
    S.weights.push({d: addDays(todayStr(), -10), w: 126.2});
    S.weights.push({d: addDays(todayStr(), -8), w: 126.8});
    S.weights.push({d: addDays(todayStr(), -6), w: 126.4});
    S.weights.push({d: addDays(todayStr(), -4), w: 126.6});
    S.weights.push({d: addDays(todayStr(), -2), w: 126.5});
    S.weights.push({d: addDays(todayStr(), -1), w: 126.5});
    for (let i = 1; i <= 15; i++) { const ds = addDays(todayStr(), -i); S.days[ds] = {meals:{breakfast:[{n:"t", cal:2600, p:150, c:300, f:80}]}}; }
    save();
    window.__J = J;
  `);
  const r = JSON.parse(w.eval(`JSON.stringify(adaptiveCalc())`));
  ok(r.ok === true, "segment estimate is ok (got " + JSON.stringify(r) + ")");
  ok(r.algo === "v5-shift", "algo stamped v5-shift (got " + r.algo + ")");
  ok(r.shift === w.eval(`window.__J`), "shift = jump date");
  ok(r.avg === 2600, "segment avg = 2600 (got " + r.avg + ")");
  ok(Math.abs(r.rateWk) < 0.6, "segment rate near flat, NOT the jump (got " + r.rateWk + ")");
  ok(Math.abs(r.learned - 2600) < 300, "learned near 2600 (got " + r.learned + ")");
  w.eval(`applyAdaptive()`);
  const g = JSON.parse(w.eval(`JSON.stringify(S.goals)`));
  ok(g.adaptive.algo === "v5-shift" && g.adaptive.shift === w.eval(`window.__J`), "record carries v5-shift + shift date");
  ok(g.maintenance === g.adaptive.value, "maintenance = segment learned value");
  const src = w.eval(`document.getElementById("goalSrc").textContent`);
  ok(/weight jump/.test(src), "source line names the jump (" + src + ")");
  ok(errors.length === 0, "no runtime errors (" + errors.join("; ") + ")");
  w.close();
}

async function testUnconfirmed() {
  console.log("Test 3: unconfirmed jump -> standard v4 path (no false shift)");
  const { w, errors } = boot(null); await tick();
  w.eval(`
    S.goals.profile = {sex:"male", age:23, heightIn:70, weightLb:130, bodyFat:0, activityKey:"very", auto:false, units:"lb"};
    S.goals.adaptive = null; S.goals.maintenance = 2000; S.goals.surplus = 300; S.goals.mode = "bulk"; S.goals.macroAuto = true;
    S.days = {}; S.weights = [];
    for (let i = 1; i <= 15; i++) { const ds = addDays(todayStr(), -i); S.days[ds] = {meals:{breakfast:[{n:"t", cal:2200, p:150, c:250, f:65}]}}; }
    for (let i = 20; i >= 3; i -= 2) { S.weights.push({d: addDays(todayStr(), -i), w: 130}); }
    S.weights.push({d: addDays(todayStr(), -1), w: 134});  /* one-off spike, never confirmed */
    save();
  `);
  const r = JSON.parse(w.eval(`JSON.stringify(adaptiveCalc())`));
  ok(r.ok === true && !r.shift, "no shift triggered by a single unconfirmed spike (got " + JSON.stringify(r) + ")");
  ok(errors.length === 0, "no runtime errors");
  w.close();
}

(async () => {
  await testRealExport();
  await testSegment();
  await testUnconfirmed();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
