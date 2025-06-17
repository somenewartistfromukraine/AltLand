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
    attribution: "© OpenStreetMap contributors",
    subdomains: ['a', 'b', 'c']
  }))
} as const;

// Memoized tile layer URL getter
export const getMemoizedTileLayerUrl = memoize((activeLayer: 'satellite' | 'osm') => {
  return memoizedTileLayers[activeLayer]().url;
});

// Memoized attribution getter
export const getMemoizedTileLayerAttribution = memoize((activeLayer: 'satellite' | 'osm') => {
  return memoizedTileLayers[activeLayer]().attribution;
});

// Memoized tile layer options
export const getMemoizedTileLayerOptions = memoize((activeLayer: 'satellite' | 'osm') => {
  const options = {
    subdomains: activeLayer === 'osm' ? ['a', 'b', 'c'] : undefined,
    maxZoom: activeLayer === 'satellite' ? 20 : undefined,
    detectRetina: activeLayer === 'satellite'
  };
  return options;
});
