# Fuel — Personal Nutrition Tracker

A private, phone-first nutrition tracker in the style of the RENPHO Health app, but nutrition-only with extra features:

- Calorie ring + protein/carbs/fat macro bars with daily targets
- Meal sections (breakfast, lunch, dinner, snacks) with per-meal totals
- Food search over a built-in database, favorites, and custom foods
- Serving-size picker when logging
- Water tracker, body-weight log with trend chart
- 7-day calorie chart, weekly averages, logging streak
- Day-by-day history navigation, JSON data export

All data is stored in the phone's browser (localStorage). Nothing is sent to any server.

## Deploy to Cloudflare Pages (free, your own link)

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Select this repository (`Nutrition-Application`).
3. Build settings: **no build command**, **output directory** = `/` (the site is static files: `index.html`, `styles.css`, `js/`).
4. Deploy. You'll get a `*.pages.dev` link.

## Add to iPhone home screen

1. Open your Pages link in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.

The app then opens full-screen like a native app. It does not work offline: there is no service worker, so the page needs a network connection to load. Your logged data stays on your phone.

## Tests

The tests boot the real app (`index.html` with `styles.css` and `js/*.js` inlined back in by `tests/_harness.js`) in [jsdom](https://github.com/jsdom/jsdom). With Node.js installed:

```bash
npm install --no-save jsdom
node tests/run_all.js
```

A few tests replay a private data export (`fuel-data-8.json`). It is never committed; put it in `tests/fixtures/` (git-ignored) or set `FUEL_FIXTURE=/path/to/file`. Without it those tests are skipped, not failed.
