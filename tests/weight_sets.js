/* AM/PM weight sets (2026.10.18-e, Jay's ask).
   Night weights live in S.pmWeights, a separate series from S.weights.
   Non-negotiables under test:
   1. Estimator/trend isolation — identical AM data ± PM data must produce
      the identical learned maintenance, goal state and trend rate.
   2. Set math — same-day delta (PM-AM), overnight float (next AM-PM),
      medians over the last 14, all matching hand-computed values.
   3. The low-night flag fires only when tonight's PM is >=1.5 lb under
      his median night, with the float-calibrated prediction.
   4. Logging routes by slot: Night writes pmWeights only (no estimator
      sync), Morning writes weights as before; the slot auto-defaults to
      Night when the date already has a morning weigh-in.
   5. Legacy state (no pmWeights key) boots clean with the hint line. */
const fs = require("fs"), path = require("path"), os = require("os");
const { JSDOM } = require(path.join(__dirname, "..", "node_modules", "jsdom"));
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nxws-"));
fs.writeFileSync(path.join(tmp, "harness.html"), html.replace('persistence:"local"', 'persistence:"memory"'));

let pass = 0, fail = 0;
function ok(c, m){ if(c){ pass++; } else { fail++; console.log("  FAIL", m); } }
const near = (a, b, t) => Math.abs(a - b) <= (t || 0.051);

const EXPORT = JSON.parse(fs.readFileSync(path.join(os.homedir(), "workspace/user/files/fuel-data-8.json"), "utf8"));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function boot(state){
  const dom = new JSDOM(fs.readFileSync(path.join(tmp, "harness.html"), "utf8"), {
    url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w){
      w.localStorage.setItem("fuel.flags.v1", JSON.stringify({ zeroReset: 1, calcNet: 1 }));
      w.localStorage.setItem("fuel.v1", JSON.stringify(state));
    }
  });
  const w = dom.window;
  await sleep(500);
  return { w, doc: w.document, ev: x => w.eval(x) };
}

/* PM set paired against Jay's real AM weigh-ins (Oct 13 127.0, 14 127.6,
   15 126.6, 17 127.0; Oct 16 has no AM):
   deltas: +3.6, +3.3, +3.6, +3.4  -> median 3.5
   floats: 13->14 -3.0, 14->15 -4.3, 16->17 -2.8 -> median -3.0
   medPM of [130.6,130.9,130.2,129.8,130.4] = 130.4 */
const PMSET = [
  { d: "2026-10-13", w: 130.6 }, { d: "2026-10-14", w: 130.9 },
  { d: "2026-10-15", w: 130.2 }, { d: "2026-10-16", w: 129.8 },
  { d: "2026-10-17", w: 130.4 }
];
const withPM = pms => { const c = JSON.parse(JSON.stringify(EXPORT)); c.pmWeights = pms; return c; };

(async () => {
  /* ---------- Boot A: legacy state, no pmWeights ---------- */
  const A = await boot(JSON.parse(JSON.stringify(EXPORT)));
  A.ev("renderProgress()");
  ok(Array.isArray(A.ev("S.pmWeights")) && A.ev("S.pmWeights").length === 0, "A: pmWeights defaults to [] on legacy state");
  ok(/Log a/.test(A.doc.getElementById("wtSets").textContent) && /night/i.test(A.doc.getElementById("wtSets").textContent), "A: sets card shows the night-weight hint");
  const goalsA = A.ev("JSON.stringify({m:S.goals.maintenance, learned:(S.goals.adaptive||{}).learned, algo:(S.goals.adaptive||{}).algo})");
  const trendA = A.ev("JSON.stringify(weightTrend())");

  /* ---------- Boot B: real AM data + the PM set ---------- */
  const B = await boot(withPM(PMSET));
  B.ev("renderProgress()");
  ok(B.ev("S.pmWeights").length === 5, "B: 5 night weights loaded");
  const goalsB = B.ev("JSON.stringify({m:S.goals.maintenance, learned:(S.goals.adaptive||{}).learned, algo:(S.goals.adaptive||{}).algo})");
  ok(goalsA === goalsB, "B: estimator isolation — goals identical ± PM data (" + goalsB + ")");
  ok(trendA === B.ev("JSON.stringify(weightTrend())"), "B: trend isolation — weightTrend identical ± PM data");

  const st = B.ev("(()=>{ const s = wtSetStats(); return {nd:s.deltas.length, nf:s.floats.length, md:s.medDelta, mf:s.medFloat, mp:s.medPM}; })()");
  ok(st.nd === 4, "B: 4 same-day deltas (Oct 16 has no AM), got " + st.nd);
  ok(st.nf === 3, "B: 3 overnight floats, got " + st.nf);
  ok(near(st.md, 3.5), "B: median delta +3.5, got " + st.md);
  ok(near(st.mf, -3.0), "B: median float -3.0, got " + st.mf);
  ok(near(st.mp, 130.4), "B: median night 130.4, got " + st.mp);

  const setsTxt = B.doc.getElementById("wtSets").textContent;
  ok(/130\.4/.test(setsTxt) && /\+3\.4/.test(setsTxt), "B: latest set line shows Oct 17 127.0 -> 130.4 (+3.4): '" + setsTxt.slice(0, 90) + "'");
  ok(/Your usual set/.test(setsTxt) && /\+3\.5 by night/.test(setsTxt) && /3\.0 overnight/.test(setsTxt), "B: typicals line shows +3.5 by night / -3.0 overnight");
  ok(!/Low night/.test(setsTxt), "B: no low-night flag for a historical (non-today) last PM");

  const svg = B.doc.getElementById("weightChart").innerHTML;
  ok((svg.match(/fill="#8383a8"/g) || []).length >= 5, "B: chart draws >=5 night dots, got " + (svg.match(/fill="#8383a8"/g) || []).length);
  ok(/night weight/.test(B.doc.getElementById("wGoalLegend").textContent), "B: legend carries the night-weight key");

  const hist = B.doc.getElementById("weightHist");
  ok(hist.querySelectorAll(".wpdel").length === 5, "B: history lists 5 night entries with their own delete, got " + hist.querySelectorAll(".wpdel").length);
  ok(/night/.test(hist.textContent) && /129\.8/.test(hist.textContent), "B: PM-only date (Oct 16) still appears in history");

  /* logging: Oct 11 has an AM (127.4) and no PM -> slot defaults to Night */
  B.ev("window.confirm = () => true");
  const wBefore = B.ev("S.weights").length, mBefore = B.ev("S.goals.maintenance");
  const wd = B.doc.getElementById("weightDate"), wi = B.doc.getElementById("weightInput");
  wd.value = "2026-10-11"; wd.dispatchEvent(new B.w.Event("change"));
  ok(B.ev("wtSlot") === "pm", "B: slot auto-defaults to Night when the date has an AM only, got " + B.ev("wtSlot"));
  wi.value = "131.2"; B.doc.getElementById("weightAdd").click(); await sleep(60);
  ok(B.ev("S.pmWeights").some(p => p.d === "2026-10-11" && p.w === 131.2), "B: night log wrote pmWeights only");
  ok(B.ev("S.weights").length === wBefore, "B: night log did not touch S.weights");
  ok(B.ev("S.goals.maintenance") === mBefore, "B: night log did not move maintenance (no estimator sync)");

  /* logging: Oct 12 has neither -> Morning; AM path unchanged */
  wd.value = "2026-10-12"; wd.dispatchEvent(new B.w.Event("change"));
  ok(B.ev("wtSlot") === "am", "B: slot defaults to Morning for an empty date");
  wi.value = "126.8"; B.doc.getElementById("weightAdd").click(); await sleep(60);
  ok(B.ev("S.weights").some(p => p.d === "2026-10-12" && p.w === 126.8), "B: morning log wrote S.weights as before");

  /* night delete removes only the PM entry */
  const pmBefore = B.ev("S.pmWeights").length;
  B.doc.getElementById("weightHist").querySelector(".wpdel").click(); await sleep(60);
  ok(B.ev("S.pmWeights").length === pmBefore - 1, "B: night delete removed exactly one pmWeights entry");
  ok(B.ev("S.weights").length === wBefore + 1, "B: night delete left S.weights alone");

  /* ---------- Boot C: tonight is a low night ---------- */
  const C = await boot(withPM(PMSET.concat([{ d: "2026-10-18", w: 128.5 }])));
  C.ev("renderProgress()");
  const cTxt = C.doc.getElementById("wtSets").textContent;
  ok(/Low night for you/.test(cTxt), "C: low-night flag fires at 128.5 vs ~130.3 median night");
  ok(/~125\.5/.test(cTxt), "C: prediction uses his median float (128.5 - 3.0 = ~125.5): '" + cTxt.slice(-140) + "'");

  console.log(`weight_sets: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("ERROR", e && e.stack || e); process.exit(1); });
