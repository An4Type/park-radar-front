export type Ring = number[][];

export type MultiPolygonCoords = Ring[][];

export interface HexShape {
  id: string;
  ring: Ring;
}

export interface ParkingGeometry {
  hexes: HexShape[];
  outline: MultiPolygonCoords;
}
