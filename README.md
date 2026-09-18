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
3. Build settings: **no build command**, **output directory** = `/` (the site is a single `index.html`).
4. Deploy. You'll get a `*.pages.dev` link.

## Add to iPhone home screen

1. Open your Pages link in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.

The app then opens full-screen like a native app and works offline. Your logged data stays on your phone.
