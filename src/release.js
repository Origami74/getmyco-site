/* ══ LATEST RELEASE — straight from Zapstore ══════════════════════
   Zapstore publishes Myco as Nostr events:

     32267  the app            d=app.myco
     30063  one per release    i=app.myco, version, e → its asset(s)
     3063   the asset          url, size, filename, f=<abi>

   Only events signed by Myco's publisher key count. Anyone can publish
   a 30063 that says i=app.myco, so without the author filter a stranger
   could point the download button at their own APK.
   ═════════════════════════════════════════════════════════════════ */
import { EventStore } from "applesauce-core";
import { getTagValue } from "applesauce-core/helpers";
import { mapEventsToStore } from "applesauce-core/observable";
import { RelayPool } from "applesauce-relay";
import { lastValueFrom } from "rxjs";

export const APP_ID = "app.myco";
export const PUBLISHER = "bbb5dda0e15567979f0543407bdc2033d6f0bbb30f72512a981cfdb2f09e2747";
export const RELAYS = ["wss://relay.zapstore.dev"];
export const ZAPSTORE_URL = `https://zapstore.dev/apps/${APP_ID}`;

const RELEASE = 30063;
const ASSET = 3063;
const ABI = "android-arm64-v8a";

const eventStore = new EventStore();
const pool = new RelayPool();

/* pull every matching event into the store, then read them back out.
   request() completes on EOSE; a dead relay times out rather than hangs. */
async function load(filter) {
  await lastValueFrom(
    pool.request(RELAYS, filter, { timeout: 8000 }).pipe(mapEventsToStore(eventStore)),
    { defaultValue: null }
  );
  return eventStore.getByFilters(filter);
}

/* "0.11.0" > "0.9.2" — compare numerically, part by part */
function compareVersions(a = "", b = "") {
  const pa = a.split(/[.-]/).map(n => parseInt(n, 10) || 0);
  const pb = b.split(/[.-]/).map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function newest(releases) {
  return releases
    .filter(e => (getTagValue(e, "c") ?? "main") === "main")
    .sort((a, b) =>
      compareVersions(getTagValue(b, "version"), getTagValue(a, "version")) ||
      b.created_at - a.created_at
    )[0];
}

/* → { version, url, size, filename, notes } or null */
export async function getLatestRelease() {
  const releases = await load({ kinds: [RELEASE], authors: [PUBLISHER], "#i": [APP_ID] });
  const release = newest(releases);
  if (!release) return null;

  const assetIds = release.tags.filter(t => t[0] === "e").map(t => t[1]);
  if (!assetIds.length) return null;

  const assets = await load({ kinds: [ASSET], authors: [PUBLISHER], ids: assetIds });
  const asset =
    assets.find(a => a.tags.some(t => t[0] === "f" && t[1] === ABI)) ?? assets[0];
  if (!asset) return null;

  return {
    version: getTagValue(release, "version"),
    url: getTagValue(asset, "url"),
    size: parseInt(getTagValue(asset, "size") ?? "0", 10) || null,
    filename: getTagValue(asset, "filename"),
    notes: release.content,
    publishedAt: new Date(release.created_at * 1000),
  };
}
