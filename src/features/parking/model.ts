export type MultiPolygonCoords = number[][][][];

export interface CellShape {
  id: string;
  ring: number[][];
}

export interface ClusterOutline {
  id: string;
  polygon: MultiPolygonCoords;
}

export interface ParkingGeometry {
  cells: CellShape[];
  clusters: ClusterOutline[];
}
