# Park Radar (front end)

Live parking availability map. One codebase runs as an installable **PWA**, and as **iOS** and **Android** apps via Capacitor.

The UI follows the **MVP · Minimal blue** flow and the **UI kit · MVP** board on the *Parking Heatmap* design canvas. Colours, type (Figtree), radii, elevation and icons come from the kit.

## Quick start

```bash
cp .env.example .env.local   # optional; defaults run against the mock backend
npm install
npm run dev                  # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build (PWA service worker included) |
| `npm run preview` | Serve the production build |
| `npm run test.unit` | Vitest unit/component tests |
| `npm run test.e2e` | Cypress against a running dev server |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run cap:android` / `cap:ios` | Build, sync and open the native project |

## Deployments

| Branch | Command | Worker | URL |
| --- | --- | --- | --- |
| `main` | `npm run deploy` | `park-radar` (`wrangler.jsonc`) | https://park-radar.maksym782.workers.dev |
| `krakow` | `npm run deploy:krakow` | `park-radar-krakow` (`wrangler.krakow.jsonc`) | https://park-radar-krakow.maksym782.workers.dev |

The Kraków build uses `.env.krakow`, so its API calls go through its own Worker.

## Configuration

All configuration is `VITE_*` env vars, validated at startup in `src/config/env.ts`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` | `mock` = in-app backend, `http` = real API |
| `VITE_API_BASE_URL` | `http://localhost:8080/v1` | Real API base URL |
| `VITE_MAP_STYLE_URL` | OpenFreeMap Positron | Any MapLibre style (no key needed by default) |
| `VITE_VALHALLA_URL` | FOSSGIS Valhalla server | Road routing, tried first |
| `VITE_ROUTING_URL` | OSRM demo server | Road routing, tried second |
| `VITE_DEFAULT_CENTER` | Tauron Arena, Kraków | Map centre when location is unavailable |
| `VITE_DEFAULT_CENTER_NAME` | `Tauron Arena` | Name shown for that centre |

## Public data and services

Everything the app loads from outside this repo. Except for the parking data, it all comes from **OpenStreetMap** or is bundled with the app. No source needs an API key.

| What | Service | Data and licence | Used in |
| --- | --- | --- | --- |
| Base map (streets, buildings, labels) | [OpenFreeMap](https://openfreemap.org), Positron style: `tiles.openfreemap.org` | Vector tiles in the [OpenMapTiles](https://openmaptiles.org) schema, built from OpenStreetMap ([ODbL](https://www.openstreetmap.org/copyright)). Fonts (Noto Sans) and icon sprites come from the same server. | `VITE_MAP_STYLE_URL`, `features/map` |
| Low-zoom relief | OpenFreeMap: `tiles.openfreemap.org/natural_earth` | [Natural Earth](https://www.naturalearthdata.com) shaded relief, public domain | Part of the Positron style |
| Fallback map (no WebGL2) | OpenStreetMap standard tiles: `tile.openstreetmap.org` | OpenStreetMap raster tiles, ODbL. Light use only, per the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). | `features/map/fallback/LeafletMap.tsx` |
| Driving routes and turn-by-turn (first choice) | [Valhalla](https://github.com/valhalla/valhalla) public server run by FOSSGIS: `valhalla1.openstreetmap.de` | Routes on OpenStreetMap roads. Turn instructions come back in the app language (`en-GB` / `pl-PL`). | `VITE_VALHALLA_URL`, `api/mock/routing/valhallaRoute.ts` |
| Driving routes (second choice) | [OSRM](https://project-osrm.org) demo server: `router.project-osrm.org` | Routes on OpenStreetMap roads. The app writes the turn instructions itself, in the app language. | `VITE_ROUTING_URL`, `api/mock/routing/osrmRoute.ts` |
| Place and street search | [Photon](https://photon.komoot.io) by komoot: `photon.komoot.io` | Geocoding of OpenStreetMap data. Results are biased towards the user's position. | `api/geocoding/photon.ts` |
| Address of a reported spot | [Nominatim](https://nominatim.org): `nominatim.openstreetmap.org` | Reverse geocoding of OpenStreetMap data. At most 1 request/s, per the [usage policy](https://operations.osmfoundation.org/policies/nominatim/). Results are cached in memory per ~11 m. | `features/reports/lib/reverseGeocode.ts` |
| Parking availability, zones, driver reports | Park Radar backend `parkradar.makssm.com`, reached through the Worker at `/api` | Project data, not public. Parking counts come from the backend's sources; zones are reports from app users. | `VITE_API_BASE_URL`, `api/http`, `worker/index.ts` |

Each route provider has a 5 s timeout. If both fail, the app draws a simple offline route (`api/mock/routeGenerator.ts`). The public routing, search and geocoding servers are free community services meant for light use. For heavier traffic, host your own instances or route through the backend.

**Attribution.** The map shows "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" (MapLibre), or "© OpenStreetMap contributors" on the fallback map. Keep this visible: the ODbL requires it.

**Bundled with the app (no network):**

- **Figtree** typeface, via [Fontsource](https://fontsource.org) (SIL Open Font License).
- **H3** hexagon grid ([h3-js](https://github.com/uber/h3-js), Apache-2.0). Only the mock backend uses it.
- **Mock data** (`api/mock`): parking names and street names for Poznań and Kraków, written by hand. Counts are generated.

**What leaves the device.** The user's position goes to the routing servers (route start), to Photon (to rank search results), to Nominatim (only the coordinates of a spot being reported) and to the backend (when submitting a report). Nothing is sent to any analytics service.

## Accessibility

The app targets **WCAG 2.2 level AA** in English and Polish.

- **Everything on the map is also in a list.** The list button on the home screen opens nearby parkings and driver reports, sorted by distance, with their availability. Each entry opens the same page as tapping it on the map. Keyboard and screen-reader users don't need the map.
- **Keyboard.** Every control can be reached with Tab, in visual order. Sheets (list, layers, filters, report, location help) are modal dialogs: focus moves into them, Tab stays inside, and Escape closes them and returns focus to the button that opened them. On every screen change, focus moves to the new screen's heading.
- **Screen readers.** Each screen has its own page title and `h1`. Status messages are announced: the report confirmation, rerouting, the number of search results and the next turn. The turn is announced only when it changes, not on every GPS fix. The page language follows the app language.
- **Zoom and reflow.** Pinch-zoom is allowed. At 320 px wide or 256 px tall (400% zoom), nothing scrolls sideways, and the controls become scrollable instead of being cut off. Text wraps instead of truncating, so increased text spacing loses nothing. Both orientations are supported.
- **Contrast.** Text is at least 4.5:1. Control states, such as the switch track and the selected segment, are at least 3:1.
- **Motion.** With *reduce motion* turned on, CSS transitions, map camera moves and the navigation arrow glide are switched off.

Check it with [axe DevTools](https://www.deque.com/axe/devtools/) and a real screen reader (VoiceOver, TalkBack) before each release. Automated tools catch only part of WCAG.

## Architecture

```
src/
  app/            App shell: providers, routes over one persistent map, native setup
  api/            Backend contract and implementations
    schemas.ts      zod wire schemas (single source of truth for types)
    types.ts        ParkingApi interface + inferred types
    http/           axios client + validated real implementation
    mock/           deterministic in-app backend (H3 hex zones, routes, places)
    queryKeys.ts    TanStack Query key factory
  features/       Domain modules, each with its hooks, logic and components
    location/       Capacitor Geolocation wrapper + zustand store
    map/            MapLibre canvas, layers, markers, camera, layer-mode store
    parking/        snapshot polling, H3 cell index, availability, recommendation, parking UI
    search/         destination search (debounced query)
    navigation/     route + live progress, trip store, instruction card
  pages/          Screens composed from features (Home, Search, Parking, Navigation)
  shared/         Feature-agnostic code
    ui/             UI-kit components (ActionBadge, IconButton, BottomSheet, …)
    lib/            geo, formatting, haptics
    navigation/     paths, transitions, back handling
  theme/          Design tokens, Ionic variable mapping, globals
```

Dependencies point one way only: `pages → features → shared/api`.

### Key decisions

- **One persistent map.** `MapCanvas` sits under the router outlet, and screens are transparent overlays on top of it. The map reads the current screen from the URL, so tiles, camera and state survive navigation. Screens cross-fade instead of sliding.
- **Same contract for mock and real API.** Both implement `ParkingApi` (`src/api/types.ts`), and both are checked against the zod schemas in tests. To switch, set `VITE_API_MODE=http`. The mock is loaded lazily, so it stays out of the main bundle.
- **Server state vs UI state.** TanStack Query handles caching, polling (the full map refreshes every 5 s, paused in the background) and abort signals. zustand holds UI state: the layer mode (persisted), location and the current trip.
- **Why not MSW?** Service workers are unavailable in iOS WKWebView and would clash with the PWA worker. An in-process mock behaves the same on every platform.

## Backend contract (for the real API)

| Endpoint | Response |
| --- | --- |
| `GET /parking?lat&lng` | `{ parking: ParkingDto[] }`, the whole map, polled every **5 s** |
| `GET /destinations?q&lat&lng` | `Destination[]` |
| `GET /routes?fromLat&fromLng&toLat&toLng` | `Route` |

`ParkingDto` matches the backend payload exactly: `id`, `name`, `address`, `latitude`, `longitude`, `totalSpaces`, `occupiedSpaces`, `freeSpaces`, `status`, `confidence` and `lastUpdatedAt`. Its schema is in `src/api/schemas.ts`, and it's mapped into the app model in `src/api/mappers.ts`. A non-`ACTIVE` status counts as 0 free spaces.

### Why points, not polygons

The backend sends **points** (one per facility). The client draws them like this:

1. Each facility goes into an H3 cell at **resolution 11** (≈50 m across). The hex is that facility's tap target.
2. Touching cells share **one outer outline**, so a block of parkings reads as one area. **This is visual only**: every facility keeps its own fill colour and is selected on its own. A tap picks the facility under the finger, or the nearest one if two share a cell.
3. Geometry is rebuilt **only when the set of cells changes**. A normal 5 s poll changes only counts, which go to MapLibre as **feature-state**. Polygons aren't re-uploaded or re-tessellated.

A point is about 200 bytes of JSON versus several hundred for a polygon, so the poll payload stays small. Hex size can be tuned on the client (`CELL_RESOLUTION` in `src/features/parking/lib/cellIndex.ts`) without changing the backend.

The mock (`src/api/mock`) produces the same JSON. It includes the real Poznań facilities plus generated ones, and its counts change every 5 s tick. Its data goes through the same schema and mapper as the HTTP client.

## Navigation

- **Road routes:** the mock asks an OSRM server (`VITE_ROUTING_URL`, the public OpenStreetMap demo by default) for a driving route. Routes and turn instructions follow real streets. If the router can't be reached, it falls back to a simple two-leg route. The real backend's `GET /routes` should return the same `Route` shape.
- **Snap to road:** each GPS fix is projected onto the route line (`features/navigation/lib/routeMatcher.ts`). Within 40 m, the arrow, the camera and the map rotation follow the road, and the route behind you is trimmed. Distances to the next turn are measured along the road.
- **Rerouting:** once you've joined the route, 3 fixes in a row more than 40 m away fetch a new route from your position, at most once every 10 s.
- **Production:** the public OSRM demo server is for development only. Use the backend, or your own OSRM/Valhalla instance, in production.

## Native apps

iOS is already added, and its location permission string is set in `ios/App/App/Info.plist`. To add Android:

```bash
npm i @capacitor/android
npx cap add android
```

Then add `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` to `android/app/src/main/AndroidManifest.xml`.

Then run `npm run cap:android` or `npm run cap:ios`.
