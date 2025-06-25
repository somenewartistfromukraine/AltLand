import L from 'leaflet';

const AWS_TERRAIN_TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

/**
 * Decodes an RGB pixel from a AWS Terrain-RGB tile to elevation in meters.
 * @param r The red component (0-255).
 * @param g The green component (0-255).
 * @param b The blue component (0-255).
 * @returns The elevation in meters.
 */
export interface PointElevationInfo {
  elevation: number;
  r: number;
  g: number;
  b: number;
  tileX: number;
  tileY: number;
  zoom: number;
  pixelX: number;
  pixelY: number;
}

export const decodeElevation = (r: number, g: number, b: number): number => {
  return (r * 256 + g + b / 256) - 32768;
};

interface TileData {
  imageData: ImageData;
}

const tileCache = new Map<string, Promise<TileData | null>>();

/**
 * Fetches a terrain tile and returns its ImageData.
 * Caches the results to avoid re-fetching.
 * @param url The URL of the tile image.
 * @returns A promise that resolves with the tile's ImageData.
 */
const getTileData = (url: string): Promise<TileData | null> => {
  if (tileCache.has(url)) {
    return tileCache.get(url)!;
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 300; // ms

  const fetchWithRetry = (attempt: number): Promise<TileData | null> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'Anonymous';

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve({ imageData });
      };

      image.onerror = () => {
        if (attempt < MAX_RETRIES) {
          setTimeout(() => {
            resolve(fetchWithRetry(attempt + 1));
          }, RETRY_DELAY * attempt); // Increase delay for subsequent retries
        } else {
          resolve(null); // Failed after all retries
        }
      };
      image.src = url;
    });
  };

  const promise = fetchWithRetry(1);
  tileCache.set(url, promise);
  return promise;
};

/**
 * Gets the elevation for a specific geographical point at a given zoom level.
 * @param latLng The geographical coordinates.
 * @param zoom The current map zoom level.
 * @returns A promise that resolves to the elevation in meters, or null if it can't be determined.
 */
export const getElevationForPoint = async (latLng: L.LatLng, zoom: number): Promise<PointElevationInfo | null> => {
  const maxZoom = 15;
  const effectiveZoom = Math.min(zoom, maxZoom);

  try {
    const TILE_SIZE = 256;
    const n = Math.pow(2, effectiveZoom);
    const tileX = Math.floor(n * ((latLng.lng + 180) / 360));
    const tileY = Math.floor(n * (1 - (Math.log(Math.tan(latLng.lat * Math.PI / 180) + 1 / Math.cos(latLng.lat * Math.PI / 180)) / Math.PI)) / 2);

    const tileUrl = L.Util.template(AWS_TERRAIN_TILE_URL, { x: tileX, y: tileY, z: effectiveZoom });

    const tileData = await getTileData(tileUrl);
    if (!tileData) return null;
    const { imageData } = tileData;

    // Calculate pixel coordinates within the fetched tile
    const nTotal = Math.pow(2, zoom);
    const worldPx = nTotal * ((latLng.lng + 180) / 360) * TILE_SIZE;
    const worldPy = nTotal * (1 - (Math.log(Math.tan(latLng.lat * Math.PI / 180) + 1 / Math.cos(latLng.lat * Math.PI / 180)) / Math.PI)) / 2 * TILE_SIZE;

    const zoomDiff = zoom - effectiveZoom;
    const scale = Math.pow(2, zoomDiff);

    const px = Math.floor(worldPx % (TILE_SIZE * scale) / scale);
    const py = Math.floor(worldPy % (TILE_SIZE * scale) / scale);

    const pixelIndex = (py * imageData.width + px) * 4;
    const r = imageData.data[pixelIndex];
    const g = imageData.data[pixelIndex + 1];
    const b = imageData.data[pixelIndex + 2];

    if (r === undefined || g === undefined || b === undefined) return null;

    return {
      elevation: Math.round(decodeElevation(r, g, b)),
      r,
      g,
      b,
      tileX,
      tileY,
      zoom: effectiveZoom,
      pixelX: px,
      pixelY: py,
    };
  } catch (error) {
    console.error('Failed to get elevation for point:', error);
    return null;
  }
};

export interface ElevationStats {
  min: number;
  max: number;
  avg: number;
}

/**
 * Calculates elevation statistics (min, max, average) for a given geographical bounds.
 * @param bounds The geographical bounds.
 * @param zoom The current map zoom level.
 * @returns A promise that resolves to the elevation statistics, or null if an error occurs.
 */
export const getElevationStatsForBounds = async (bounds: L.LatLngBounds, zoom: number): Promise<ElevationStats | null> => {
  const maxZoom = 15;
  const effectiveZoom = Math.min(zoom, maxZoom);

  const TILE_SIZE = 256;
  const n = Math.pow(2, effectiveZoom);

  const latLngToTile = (lat: number, lng: number) => {
    const tileX = Math.floor(n * ((lng + 180) / 360));
    const tileY = Math.floor(n * (1 - (Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)) / 2);
    return { x: tileX, y: tileY };
  };

  const minTile = latLngToTile(bounds.getNorth(), bounds.getWest());
  const maxTile = latLngToTile(bounds.getSouth(), bounds.getEast());

  const tilePromises: Promise<TileData | null>[] = [];
  for (let x = minTile.x; x <= maxTile.x; x++) {
    for (let y = minTile.y; y <= maxTile.y; y++) {
      const tileUrl = L.Util.template(AWS_TERRAIN_TILE_URL, { x, y, z: effectiveZoom });
      tilePromises.push(getTileData(tileUrl));
    }
  }

  try {
    const tileResults = await Promise.all(tilePromises);
    const tiles = tileResults.filter((t): t is TileData => t !== null);
    const allElevations: number[] = [];

    for (const tile of tiles) {
      const data = tile.imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const elevation = decodeElevation(r, g, b);
        if (elevation > -10000) { // Filter out no-data values
          allElevations.push(elevation);
        }
      }
    }

    if (allElevations.length === 0) return null;

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    for (const elevation of allElevations) {
      if (elevation < min) min = elevation;
      if (elevation > max) max = elevation;
      sum += elevation;
    }

    const avg = sum / allElevations.length;

    return { min, max, avg };
  } catch (error) {
    console.error('Failed to process elevation stats:', error);
    return null;
  }
};
