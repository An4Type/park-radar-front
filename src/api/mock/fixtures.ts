export const STREETS = [
  "Station Ave",
  "Park Lane2",
  "Market St",
  "River Rd",
  "Mill St",
  "Castle Rd",
  "Church St",
  "Garden Way",
  "Bridge St",
  "King St",
  "Harbour Rd",
  "Elm Grove",
] as const;

export const ZONE_SUFFIXES = [
  "North",
  "South",
  "East",
  "West",
  "Central",
] as const;

export const DESTINATIONS: ReadonlyArray<{
  id: string;
  name: string;
  east: number;
  north: number;
}> = [
  { id: "old-town-hall", name: "Old Town Hall1", east: 650, north: 900 },
  { id: "old-town-museum", name: "Old Town Museum", east: 1100, north: 1050 },
  { id: "old-town-market", name: "Old Town Market", east: 1500, north: 1250 },
  { id: "central-station", name: "Central Station", east: -400, north: 1300 },
  { id: "city-library", name: "City Library", east: 300, north: -700 },
  { id: "riverside-park", name: "Riverside Park", east: -1200, north: -500 },
  { id: "arena", name: "City Arena", east: 2100, north: -900 },
  { id: "university", name: "University Campus", east: -1700, north: 800 },
  { id: "main-square", name: "Main Square", east: 900, north: 600 },
  { id: "shopping-centre", name: "Shopping Centre", east: -600, north: -1500 },
];
