export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type LocationStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "error"
  | "skipped";
