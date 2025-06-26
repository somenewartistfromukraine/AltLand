import { useMemo } from 'react';

// Type-safe memoization function
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    // Create a unique key based on arguments
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Memoized tile layer configuration
export const memoizedTileLayers = {
  satellite: memoize(() => ({
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
    maxZoom: 20,
    detectRetina: true
  })),
  osm: memoize(() => ({
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: " OpenStreetMap contributors",
    subdomains: ['a', 'b', 'c']
  })),
  
} as const;

// This is the configuration for the overlay
const referenceLayerConfig = {
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, HERE, Garmin, ODbL",
    maxZoom: 20,
    detectRetina: true
};

export const getSatelliteLayer = () => memoizedTileLayers.satellite();
export const getOSMLayer = () => memoizedTileLayers.osm();
// This function now provides the reference layer config
export const getReferenceLayer = () => referenceLayerConfig;
