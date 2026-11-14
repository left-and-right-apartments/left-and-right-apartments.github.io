# Left & Right cosy apartments

Static website for the two apartments in Heraklion, Crete. Plain HTML, CSS and JavaScript — no build step.

## Preview locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Where things live

| What | File |
| --- | --- |
| Page structure | `index.html` |
| Colours and layout | `assets/css/style.css` (palette at the top) |
| Texts in all languages (el, en, de, fr, it) | `assets/js/i18n.js` |
| Recommended places on the map | `data/places.json` |
| Guest review texts | `data/reviews.json` |
| Walking / driving routes drawn on the maps | `data/routes.json` (generated) |
| Ratings and review figures | `data/stats.json` |
| Booked dates | `data/availability.json` (written by the script) |
| Photos | `assets/img/left`, `assets/img/right` |

### Adding a place to the map

Add an entry to `data/places.json`:

```json
{ "name": "Name", "cat": "eat", "lat": 35.34, "lng": 25.13, "tags": ["cretan"], "fav": true }
```

`cat` is one of `eat`, `coffee`, `drinks`, `sights`, `beach`, `practical`. `tags` are keys of the `t.*` texts in `i18n.js`. `fav` shows the "Hosts' pick" badge. Coordinates: right-click the spot in Google Maps and copy the two numbers.

The apartment pin (`home`) is at Davaki 6. All distances and routes start from there.

### Strava routes

Each running and cycling route has a **GPX for Strava** button that downloads the route, so guests can import it into Strava, Garmin or Komoot. If you create the routes in your own Strava account (Strava → Routes → import the GPX → save as public), paste the route link into `data/places.json` as `"strava": "https://www.strava.com/routes/…"` on that route, and a **Strava route** button appears next to it.

After adding places or moving the pin, recompute the routes and walking times:

```bash
node scripts/build-routes.mjs
```

The "Getting here" texts (taxi, bus, prices) are in `assets/js/i18n.js` under the `arr.*` keys. Check the bus and taxi prices now and then.

When you change CSS or JS, bump the `?v=` number on their links in `index.html` so returning visitors get the new version.

## Booking form

The booking form in `index.html` (`<form id="bookForm" data-endpoint="">`) works in two ways:

- **No endpoint (default):** pressing "Send" opens the visitor's own email app with a pre-filled message to ekvardava@gmail.com. Nothing else to set up.
- **With a form service:** requests arrive in your inbox without the visitor needing an email app. Create a free form at [formspree.io](https://formspree.io) with your email, copy its URL (looks like `https://formspree.io/f/abcdwxyz`) and paste it into `data-endpoint`. The form shows a thank-you message after sending.

If the iCal links are set up, the form also warns the visitor when the chosen dates look booked.

## Publishing on GitHub Pages

1. Push this repository to GitHub.
2. Repository **Settings → Pages → Source: GitHub Actions**.
3. Repository **Settings → Secrets and variables → Actions**, add two secrets with the iCal export links of the listings:
   - `AIRBNB_ICAL_LEFT`
   - `AIRBNB_ICAL_RIGHT`

   You find each link in Airbnb under **Calendar → listing → Availability → Connect calendars → Export calendar**.

The workflow in `.github/workflows/deploy.yml` runs on every push and once a day. It refreshes the booked dates and the rating / review count, commits the changed data, and deploys the site. The iCal links stay secret; only the blocked date ranges are published.

Until the secrets are set, the calendar shows a note sending visitors to Airbnb.

## What is and is not live

- **Booked dates**: live from Airbnb's iCal export, refreshed daily.
- **Rating and review count**: read daily from the public listing pages. Airbnb has no public API, so if they change their page the last known values stay.
- **Category ratings and "guests mention" counts**: not refreshed automatically. Update them by hand in `data/stats.json` when you like.
