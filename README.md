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

## Configuration

All configuration is `VITE_*` env vars, validated at startup in `src/config/env.ts`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` | `mock` = in-app backend, `http` = real API |
| `VITE_API_BASE_URL` | `http://localhost:8080/v1` | Real API base URL |
| `VITE_MAP_STYLE_URL` | OpenFreeMap Positron | Any MapLibre style (no key needed by default) |
| `VITE_DEFAULT_CENTER` | Poznań Old Market | Map centre when location is unavailable |

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

## Native apps

iOS is already added, and its location permission string is set in `ios/App/App/Info.plist`. To add Android:

```bash
npm i @capacitor/android
npx cap add android
```

Then add `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` to `android/app/src/main/AndroidManifest.xml`.

Then run `npm run cap:android` or `npm run cap:ios`.
