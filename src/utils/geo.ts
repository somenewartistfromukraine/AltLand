import geomagnetism from 'geomagnetism';

interface Point {
  lat: number;
  lng: number;
}

/**
 * Calculates the distance between two points using the Haversine formula.
 * @param start - The starting point { lat, lng }.
 * @param end - The ending point { lat, lng }.
 * @returns The distance in meters.
 */
export function calculateDistance(start: Point, end: Point): number {
  const R = 6371e3; // metres
  const φ1 = start.lat * Math.PI / 180; // φ, λ in radians
  const φ2 = end.lat * Math.PI / 180;
  const Δφ = (end.lat - start.lat) * Math.PI / 180;
  const Δλ = (end.lng - start.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

/**
 * Calculates the initial bearing (forward azimuth) from start to end point.
 * @param start - The starting point { lat, lng }.
 * @param end - The ending point { lat, lng }.
 * @returns The bearing in degrees.
 */
export function calculateBearing(start: Point, end: Point): number {
  const φ1 = start.lat * Math.PI / 180;
  const φ2 = end.lat * Math.PI / 180;
  const λ1 = start.lng * Math.PI / 180;
  const λ2 = end.lng * Math.PI / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const brng = (θ * 180 / Math.PI + 360) % 360; // in degrees

  return brng;
}

/**
 * Calculates azimuth and distance information.
 * @param start - The starting point { lat, lng }.
 * @param end - The ending point { lat, lng }.
 * @returns An object with distance and magnetic azimuth.
 */
export function getAzimuthAndDistance(start: Point, end: Point) {
  const distance = calculateDistance(start, end);
  const trueBearing = calculateBearing(start, end);

  // geomagnetism uses lat, lon order and a date
  const geo = geomagnetism.model().point([start.lat, start.lng]);
  const declination = geo.decl; // Magnetic declination

  const magneticAzimuth = (trueBearing + declination + 360) % 360;

  return {
    distance, // in meters
    magneticAzimuth, // in degrees
    trueBearing, // in degrees
  };
}
