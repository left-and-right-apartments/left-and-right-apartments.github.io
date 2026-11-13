#!/usr/bin/env node
/**
 * Pre-computes the routes drawn on the maps and writes data/routes.json.
 * Run it again after adding places or moving the apartment pin:
 *   node scripts/build-routes.mjs
 *
 * Uses the public OSRM servers of FOSSGIS (routing.openstreetmap.de), politely, one request at a time.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const UA = { 'User-Agent': 'left-right-apartments-site/1.0 (route pre-computation)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const placeKey = (p) => (typeof p.name === 'string' ? p.name : p.name.en);

async function route(mode, from, to) {
  const profile = mode === 'car' ? 'routed-car/route/v1/driving' : 'routed-foot/route/v1/foot';
  const url = `https://routing.openstreetmap.de/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=polyline`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const r = j.routes?.[0];
      if (!r) throw new Error(j.code || 'no route');
      return { mode, m: Math.round(r.distance), s: Math.round(r.duration), line: r.geometry };
    } catch (e) {
      if (attempt === 2) { console.warn(`  ${mode} route failed: ${e.message}`); return null; }
      await sleep(1500);
    }
  }
}

const { home, places, arrivals } = JSON.parse(await readFile(root + 'data/places.json', 'utf8'));
const out = { home, places: {}, arrivals: {} };

for (const a of arrivals) {
  console.log('arrival', a.id);
  out.arrivals[a.id] = await route(a.mode, a, home);
  await sleep(700);
}
for (const p of places) {
  const key = placeKey(p);
  console.log('place', key);
  const r = await route(p.far ? 'car' : 'foot', home, p);
  if (r) out.places[key] = r;
  await sleep(700);
}
await writeFile(root + 'data/routes.json', JSON.stringify(out) + '\n');
console.log(`wrote ${Object.keys(out.places).length} place routes, ${Object.keys(out.arrivals).length} arrival routes`);
