export interface PickupPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const PICKUP_POINTS: PickupPoint[] = [
  { id: "msk", name: "Москва", latitude: 55.7558, longitude: 37.6173 },
  {
    id: "spb",
    name: "Санкт-Петербург",
    latitude: 59.9343,
    longitude: 30.3351,
  },
  { id: "kzn", name: "Казань", latitude: 55.7963, longitude: 49.1088 },
  {
    id: "ekb",
    name: "Екатеринбург",
    latitude: 56.8389,
    longitude: 60.6057,
  },
  { id: "krd", name: "Краснодар", latitude: 45.0355, longitude: 38.9753 },
  {
    id: "nsk",
    name: "Новосибирск",
    latitude: 55.0084,
    longitude: 82.9357,
  },
];

export function defaultPickupForCity(cityName: string): PickupPoint {
  return (
    PICKUP_POINTS.find((p) => p.name === cityName) ?? PICKUP_POINTS[0]!
  );
}
