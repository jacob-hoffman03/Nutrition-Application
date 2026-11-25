/* Shared test helpers.
   Some tests replay a real data export (fuel-data-8.json). That file holds
   personal data, so it is never committed: drop it in tests/fixtures/ (git
   ignores that folder) or point FUEL_FIXTURE at it. When it is missing those
   tests print SKIPPED and exit 0 instead of crashing. */
const fs = require("fs"), path = require("path"), os = require("os");

const ROOT = path.join(__dirname, "..");
const FIXTURE_NAME = "fuel-data-8.json";

function fixturePath(){
  const candidates = [
    process.env.FUEL_FIXTURE,
    path.join(__dirname, "fixtures", FIXTURE_NAME),
    path.join(os.homedir(), "workspace/user/files", FIXTURE_NAME),
    "/home/hatch/workspace/user/files/" + FIXTURE_NAME
  ].filter(Boolean);
  return candidates.find(p => { try { return fs.statSync(p).isFile(); } catch(e) { return false; } }) || null;
}

/* Returns the export's text, or skips the whole test file when it is absent. */
function fixtureOrSkip(testName){
  const p = fixturePath();
  if(!p){
    console.log(testName + ": SKIPPED — needs the private export " + FIXTURE_NAME +
      " (put it in tests/fixtures/ or set FUEL_FIXTURE)");
    process.exit(0);
  }
  return fs.readFileSync(p, "utf8");
}

/* The app is index.html + styles.css + js/*.js. jsdom does not fetch
   subresources here, so tests get the page with every local stylesheet and
   script inlined back in — exactly the markup the browser ends up running. */
function appHtml(){
  const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
  return read("index.html")
    .replace(/<link rel="stylesheet" href="([^"?]+)(?:\?[^"]*)?">/g, (m, f) => "<style>\n" + read(f) + "</style>")
    .replace(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g, (m, f) => "<script>\n" + read(f) + "</script>");
}

module.exports = { ROOT, fixturePath, fixtureOrSkip, appHtml };
