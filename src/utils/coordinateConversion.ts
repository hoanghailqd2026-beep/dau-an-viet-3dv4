/**
 * VN-2000 Coordinate System Conversion Utility for Ho Chi Minh City
 * 
 * Standard parameters for HCMC:
 * - Ellipsoid: VN-2000 (WGS-84 derived)
 * - Central Meridian (Kinh tuyến trục): 105°45' = 105.75° E
 * - Scale factor (Hệ số co giãn k0): 0.9999 (Zone 3°)
 * - False Easting (Y0): 500,000.0 m
 * - False Northing (X0): 0.0 m
 */

import type { HeritageSite, TourRoute, VN2000Coordinate, WGS84Coordinate } from '../types/heritage.ts';

const A = 6378137.0; // semi-major axis
const F = 1 / 298.257223563; // flattening
const E2 = 2 * F - F * F; // first eccentricity squared
const K0 = 0.9999; // scale factor for 3-degree zone
const Y0 = 500000.0; // false easting
const X0 = 0.0; // false northing
const L0 = 105.75 * (Math.PI / 180); // Central meridian for TP.HCM in radians (105°45')

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

/**
 * Converts WGS-84 (lat, lng) to VN-2000 (X northing, Y easting) in meters
 */
export function wgs84ToVN2000(coord: WGS84Coordinate): VN2000Coordinate {
  const phi = degreesToRadians(coord.lat);
  const lambda = degreesToRadians(coord.lng);

  const deltaLambda = lambda - L0;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N = A / Math.sqrt(1 - E2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = (E2 / (1 - E2)) * cosPhi * cosPhi;

  // Meridional arc distance M
  const e4 = E2 * E2;
  const e6 = e4 * E2;
  const M = A * (
    (1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi -
    (3 * E2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi) +
    (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi) -
    (35 * e6 / 3072) * Math.sin(6 * phi)
  );

  const dl2 = deltaLambda * deltaLambda;
  const dl4 = dl2 * dl2;
  const cosPhi2 = cosPhi * cosPhi;
  const cosPhi4 = cosPhi2 * cosPhi2;

  // Easting (Y)
  const Y = Y0 + K0 * N * (
    deltaLambda * cosPhi +
    (dl2 * deltaLambda / 6) * Math.pow(cosPhi, 3) * (1 - T + C) +
    (dl4 * deltaLambda / 120) * Math.pow(cosPhi, 5) * (5 - 18 * T + T * T + 72 * C - 58 * (E2 / (1 - E2)))
  );

  // Northing (X)
  const X = X0 + K0 * (
    M +
    N * tanPhi * (
      (dl2 / 2) * cosPhi2 +
      (dl4 / 24) * cosPhi4 * (5 - T + 9 * C + 4 * C * C) +
      (dl4 * dl2 / 720) * Math.pow(cosPhi, 6) * (61 - 58 * T + T * T + 600 * C - 330 * (E2 / (1 - E2)))
    )
  );

  return {
    x: Math.round(X * 100) / 100,
    y: Math.round(Y * 100) / 100,
    zone: '3_degree',
    centralMeridian: "105°45'",
  };
}

/**
 * Calculates Euclidean distance between two GPS coordinates in kilometers
 */
export function calculateDistanceKm(c1: WGS84Coordinate, c2: WGS84Coordinate): number {
  const R = 6371; // Earth radius in km
  const dLat = degreesToRadians(c2.lat - c1.lat);
  const dLng = degreesToRadians(c2.lng - c1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(c1.lat)) *
      Math.cos(degreesToRadians(c2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Calculates estimated road segment distance (with 1.28x road-network factor) in km
 */
export function calculateSegmentDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.2, Number((R * c * 1.28).toFixed(1)));
}

/**
 * Automatically sums segment distances across visible stops of a tour route.
 * Safely returns 0 (or curated distanceKm) for single-stop routes (e.g., Route 09 Bạch Dinh).
 */
export function calculateTourDistanceKm(
  tour: TourRoute,
  availableSites: HeritageSite[]
): number {
  const visibleStops = tour.sites
    .map((id) => availableSites.find((s) => s.id === id))
    .filter((s): s is HeritageSite => Boolean(s));

  if (visibleStops.length < 2) {
    return tour.sites.length === 1 && visibleStops.length === 1 ? tour.distanceKm || 0 : 0;
  }

  let total = 0;
  for (let i = 0; i < visibleStops.length - 1; i++) {
    total += calculateSegmentDistanceKm(
      visibleStops[i].gps.lat,
      visibleStops[i].gps.lng,
      visibleStops[i + 1].gps.lat,
      visibleStops[i + 1].gps.lng
    );
  }

  if (visibleStops.length !== tour.sites.length || !tour.distanceKm) {
    return Number(total.toFixed(1));
  }

  return Number(total.toFixed(1));
}

export function formatVN2000(coord: VN2000Coordinate): string {
  return `X: ${coord.x.toLocaleString('vi-VN')} m | Y: ${coord.y.toLocaleString('vi-VN')} m (KTT 105°45')`;
}

export function formatWGS84(coord: WGS84Coordinate): string {
  return `${coord.lat.toFixed(5)}°N, ${coord.lng.toFixed(5)}°E`;
}
