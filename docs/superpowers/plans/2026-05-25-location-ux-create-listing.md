# Location UX Improvement for Create Listing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the need for owners to type raw latitude/longitude during listing creation by adding address search, browser geolocation, and an interactive map pin picker while preserving existing Leaflet/OpenStreetMap rendering and coordinate storage.

**Architecture:** Keep the current listing creation wizard and the existing Prisma `latitude`/`longitude` fields. The improvement should live mostly in the create-listing page and the map components so the data flow stays simple: owner enters a normal address/city, clicks a geocode action, optionally uses browser geolocation, and can fine-tune the result on the map. The server still stores numeric coordinates, and public map pages continue to hide listings that do not have valid coordinates.

**Tech Stack:** Next.js App Router, React state, Prisma/PostgreSQL, Leaflet/React-Leaflet, OpenStreetMap tiles, browser `navigator.geolocation`, lightweight fetch-based geocoding.

---

### Task 1: Map the current coordinate flow and validate the form contract

**Files:**
- Modify: `app/create-listing/page.tsx`
- Modify: `lib/listings.ts`
- Modify if needed: `lib/validations/listings.ts` or the existing listing validation file
- Inspect only: `prisma/schema.prisma`

- [ ] **Step 1: Verify how coordinates are currently stored**

Run:
```powershell
rg -n "latitude|longitude|LocationPreviewMap|validateCoordinatePair|parseCoordinateInput|listing coordinates|location" C:\Users\Victus\Downloads\getyourcave\getyourcave\app\create-listing\page.tsx C:\Users\Victus\Downloads\getyourcave\getyourcave\lib\listings.ts C:\Users\Victus\Downloads\getyourcave\getyourcave\components\maps\LocationPreviewMap.tsx C:\Users\Victus\Downloads\getyourcave\getyourcave\prisma\schema.prisma
```

Expected: the create-listing page already stores latitude/longitude in form state, and the schema accepts nullable coordinates.

- [ ] **Step 2: Confirm the save API accepts nullable coordinates**

Make sure the create/update flow keeps these values optional:
```ts
latitude: number | null
longitude: number | null
```

Expected: listings can still be saved without coordinates, and listings with coordinates continue to save as numeric values.

- [ ] **Step 3: Keep the public map behavior unchanged**

Do not change the existing list/detail map behavior:
- `ListingsMap` only shows listings with valid coordinates
- `ListingMap` shows a single map only when coordinates exist
- listings without coordinates still render safely

---

### Task 2: Replace manual lat/long typing with a button-driven location picker

**Files:**
- Modify: `app/create-listing/page.tsx`
- Create: `components/maps/LocationPickerMap.tsx`
- Modify: `components/maps/LocationPreviewMap.tsx`

- [ ] **Step 1: Create a map picker component that can be used inside the wizard**

Add a browser-only Leaflet component that supports:
```ts
type Props = {
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onMapPick?: (coords: { latitude: number; longitude: number }) => void;
};
```

Expected behavior:
- if valid coordinates exist, show a marker
- clicking the map updates the coordinates
- dragging the marker updates the coordinates if feasible
- invalid or empty coordinates show a friendly empty state instead of crashing

- [ ] **Step 2: Swap the manual coordinate UX for clearer controls**

In the create-listing location step, replace the always-visible raw coordinate fields with:
- address input
- city input
- `Find on map` button
- `Use my current location` button
- map preview/picker
- a collapsed `Manual coordinates` advanced section

Example state pattern:
```ts
const [isAdvancedCoordinatesOpen, setIsAdvancedCoordinatesOpen] = useState(false);
const [geoError, setGeoError] = useState<string | null>(null);
const [geoStatus, setGeoStatus] = useState<string | null>(null);
```

- [ ] **Step 3: Keep the wizard flow intact**

Do not add a new page or break the existing stepper. The location controls should live inside the current location step and preserve the rest of the listing form.

---

### Task 3: Add explicit geocoding and browser geolocation actions

**Files:**
- Modify: `app/create-listing/page.tsx`
- Create: `app/api/geocode/route.ts` if server proxying is used
- Inspect only: `components/maps/leafletHelpers.ts`

- [ ] **Step 1: Add a button-based geocode action**

When the owner clicks `Find on map`, geocode the entered address/city and set coordinates from the result.

Client-driven request example:
```ts
const query = encodeURIComponent(`${address}, ${city}`);
const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`);
```

If proxying through the server is cleaner, use a minimal API route instead:
```ts
const response = await fetch(`/api/geocode?q=${query}`);
```

Expected: geocoding happens only on explicit click, not on every keystroke.

- [ ] **Step 2: Add browser geolocation**

Implement `Use my current location` with `navigator.geolocation`:
```ts
navigator.geolocation.getCurrentPosition(
  (position) => {
    onLatitudeChange(String(position.coords.latitude));
    onLongitudeChange(String(position.coords.longitude));
  },
  (error) => setGeoError(error.message),
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
);
```

Expected:
- if permission is granted, coordinates update immediately
- if denied or unavailable, the UI shows a clean error state and still allows address search/manual pin selection

- [ ] **Step 3: Keep fallback behavior graceful**

Do not block listing creation if geolocation fails. If an IP-based fallback is too heavy or risky for this phase, use the graceful fallback already described above:
- search by address
- click the map to place the pin
- optionally open manual coordinates

This still satisfies the demo requirement without introducing a brittle external dependency.

---

### Task 4: Keep save/edit/public map behavior correct and finish with verification

**Files:**
- Modify: `app/create-listing/page.tsx`
- Modify if needed: `app/api/listings/route.ts`
- Modify if needed: `app/api/listings/[id]/route.ts`
- Modify if needed: `components/maps/ListingsMap.tsx`
- Modify if needed: `components/maps/ListingMap.tsx`

- [ ] **Step 1: Preserve listing edit prefill**

If the edit flow already loads listing coordinates, preload the map picker with the existing values so owners can adjust the pin without retyping coordinates.

Expected: editing a listing does not lose existing coordinates.

- [ ] **Step 2: Keep validation strict but user-friendly**

Ensure invalid numbers are rejected only at submit time:
- latitude must be between `-90` and `90`
- longitude must be between `-180` and `180`
- empty coordinates are allowed if the listing schema allows them

Example validation:
```ts
function isValidLatitudeLongitude(latitude: string, longitude: string) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
```

- [ ] **Step 3: Run the code checks**

Run:
```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Expected:
- lint passes
- typecheck passes
- build passes

- [ ] **Step 4: Manual browser test plan**

1. Run `npm run dev`.
2. Log in as `owner1@getyourcave.com`.
3. Open `/create-listing`.
4. Enter a normal address/city, such as `Paris, France`.
5. Click `Find on map`.
6. Confirm coordinates populate and the map pin appears.
7. Click the map or drag the pin if supported and confirm coordinates update.
8. Click `Use my current location`.
9. Allow geolocation and confirm coordinates update.
10. Deny geolocation and confirm the UI shows a clean error while still allowing address search/manual selection.
11. Submit the listing.
12. Log in as admin and approve the listing.
13. Open `/storage` and confirm the approved listing appears and the map renders.
14. Open `/storage/[id]` and confirm the listing detail map renders correctly.
15. Create another listing without coordinates if allowed and confirm it still saves and does not break map pages.

- [ ] **Step 5: Commit once verified**

Use a focused commit when the location workflow passes:
```powershell
git add app/create-listing/page.tsx app/api/geocode components/maps lib/listings.ts app/api/listings
git commit -m "feat: improve listing location picker"
```

---

### Self-check against the spec

- Current map/location files inspected: covered by Task 1.
- Manual latitude/longitude UX replaced with clearer controls: Task 2.
- Address search/geocoding: Task 3.
- Browser geolocation: Task 3.
- IP fallback: graceful fallback path documented in Task 3.
- Map pin selection: Task 2.
- Save behavior and nullable coordinates: Task 1 and Task 4.
- Edit behavior: Task 4.
- Public map behavior: Task 1 and Task 4.
- Error/empty states: Task 2 and Task 3.

