/* Runs every test file in this folder and exits non-zero if any fail.
   Usage: node tests/run_all.js   (needs the jsdom package installed) */
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");

const files = fs.readdirSync(__dirname)
  .filter(f => f.endsWith(".js") && !f.startsWith("_") && f !== "run_all.js")
  .sort();

let failed = [], skipped = [];
for(const f of files){
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: "utf8", env: process.env });
  const out = (r.stdout || "") + (r.stderr || "");
  const lines = out.trim().split("\n");
  const last = lines[lines.length - 1] || "";
  if(r.status !== 0){ failed.push(f); console.log("✗ " + f + "\n" + lines.slice(-15).join("\n")); }
  else if(/SKIPPED/.test(out)){ skipped.push(f); console.log("– " + f + "  (skipped: fixture missing)"); }
  else console.log("✓ " + f + "  " + last.trim());
}
console.log("\n" + (files.length - failed.length - skipped.length) + " passed, " +
  skipped.length + " skipped, " + failed.length + " failed");
process.exit(failed.length ? 1 : 0);
