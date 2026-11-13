#!/usr/bin/env node
/**
 * Refreshes data/availability.json and data/stats.json. Runs daily in GitHub Actions.
 * No dependencies — Node 20+.
 *
 * Availability comes from the iCal export links Airbnb gives each host:
 *   Airbnb → Calendar → (listing) → Availability → Connect calendars → "Export calendar"
 * Pass them as environment variables (GitHub: repository secrets):
 *   AIRBNB_ICAL_LEFT, AIRBNB_ICAL_RIGHT
 * Only the blocked date ranges are written to the site; the links themselves stay private.
 *
 * Ratings and review counts are read from the public listing pages. Airbnb has no public
 * API for this, so if the page layout changes the previous values are simply kept.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const LISTINGS = { left: '33269659', right: '33290360' };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const readJSON = async (p) => JSON.parse(await readFile(root + p, 'utf8'));
const writeJSON = (p, data) => writeFile(root + p, JSON.stringify(data, null, 2) + '\n');
const today = () => new Date().toISOString().slice(0, 10);

/** Parses an .ics file into sorted, merged [start, endExclusive] ISO date ranges. */
export function parseICal(text) {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const ranges = [];
  let ev = null;
  const toISO = (v) => { const m = v.match(/(\d{4})(\d{2})(\d{2})/); return m ? `${m[1]}-${m[2]}-${m[3]}` : null; };
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') ev = {};
    else if (line === 'END:VEVENT') { if (ev?.start && ev?.end && ev.end > ev.start) ranges.push([ev.start, ev.end]); ev = null; }
    else if (ev) {
      const i = line.indexOf(':'); if (i < 0) continue;
      const key = line.slice(0, i).split(';')[0], val = line.slice(i + 1);
      if (key === 'DTSTART') ev.start = toISO(val);
      if (key === 'DTEND') ev.end = toISO(val);
    }
  }
  ranges.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = r[1] > last[1] ? r[1] : last[1];
    else merged.push([...r]);
  }
  const cutoff = today();
  return merged.filter(([, end]) => end > cutoff);
}

async function updateAvailability() {
  const data = await readJSON('data/availability.json');
  let changed = false;
  for (const apt of Object.keys(LISTINGS)) {
    const url = process.env[`AIRBNB_ICAL_${apt.toUpperCase()}`];
    if (!url) { console.log(`availability/${apt}: no iCal link configured, skipped`); continue; }
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.includes('BEGIN:VCALENDAR')) throw new Error('response is not a calendar');
      data[apt] = parseICal(text);
      changed = true;
      console.log(`availability/${apt}: ${data[apt].length} blocked ranges`);
    } catch (e) { console.warn(`availability/${apt}: kept previous data (${e.message})`); }
  }
  if (changed) { data.updated = new Date().toISOString(); await writeJSON('data/availability.json', data); }
}

async function updateStats() {
  const data = await readJSON('data/stats.json');
  let changed = false;
  for (const [apt, id] of Object.entries(LISTINGS)) {
    try {
      const res = await fetch(`https://www.airbnb.com/rooms/${id}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const rating = Number(html.match(/"guestSatisfactionOverall":([\d.]+)/)?.[1] ?? html.match(/"ratingValue":([\d.]+)/)?.[1]);
      const reviews = Number(html.match(/"reviewCount":(\d+)/)?.[1] ?? html.match(/"visibleReviewCount":"?(\d+)/)?.[1]);
      if (!(rating >= 1 && rating <= 5) || !(reviews > 0)) throw new Error('rating not found on page');
      if (data[apt].rating !== rating || data[apt].reviews !== reviews) { data[apt].rating = rating; data[apt].reviews = reviews; changed = true; }
      console.log(`stats/${apt}: ${rating} from ${reviews} reviews`);
    } catch (e) { console.warn(`stats/${apt}: kept previous data (${e.message})`); }
  }
  if (changed) { data.updated = today(); await writeJSON('data/stats.json', data); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await updateAvailability();
  await updateStats();
}
