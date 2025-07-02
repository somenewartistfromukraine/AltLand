import L from 'leaflet';

const ELEVATION_API_URL = 'https://api.open-meteo.com/v1/elevation';
/**
 * Determines the grid resolution based on the current map zoom level.
 * Higher zoom levels get a denser grid for more detail.
 * @param zoom The current map zoom level.
 * @returns The resolution (width/height) for the elevation grid.
 */
const getGridResolutionForZoom = (zoom: number): number => {
  if (zoom < 8) return 15;      // Far out, low detail is fine
  if (zoom < 12) return 25;     // Medium zoom, medium detail
  if (zoom < 15) return 40;     // Close zoom, high detail
  return 50;                   // Very close, max detail
};

export interface ElevationSummary {
  min: number;
  max: number;
  avg: number;
}

export interface ElevationGrid extends ElevationSummary {
  grid: number[][]; // 2D array of elevation values
  bounds: L.LatLngBounds;
  resolution: number;
}

/**
 * Fetches a grid of elevation data for the given geographical bounds.
 * @param bounds The geographical bounds from the Leaflet map.
 * @returns A promise that resolves to an elevation grid object.
 */
export const getElevationGrid = async (bounds: L.LatLngBounds, zoom: number): Promise<ElevationGrid | null> => {
  const gridResolution = getGridResolutionForZoom(zoom);
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const east = bounds.getEast();

  const latStep = (north - south) / (gridResolution - 1);
  const lngStep = (east - west) / (gridResolution - 1);

  const latitudes: number[] = [];
  const longitudes: number[] = [];

  // Create a grid of points. The API expects flat arrays of numbers.
  for (let i = 0; i < gridResolution; i++) {
    const lat = south + i * latStep;
    for (let j = 0; j < gridResolution; j++) {
      const lng = west + j * lngStep;
      latitudes.push(parseFloat(lat.toFixed(4)));
      longitudes.push(parseFloat(lng.toFixed(4)));
    }
  }

  try {
    const response = await fetch(ELEVATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitudes, longitudes }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!data.elevation || data.elevation.length === 0) {
      return null;
    }

    const elevations: number[] = data.elevation;
    
    const grid: number[][] = [];
    for (let i = 0; i < gridResolution; i++) {
        grid[i] = [];
        for (let j = 0; j < gridResolution; j++) {
            grid[i][j] = elevations[i * gridResolution + j];
        }
    }

    const validElevations = elevations.filter(e => typeof e === 'number' && e > -9999);
    if (validElevations.length === 0) return null;

    const min = Math.min(...validElevations);
    const max = Math.max(...validElevations);
    const avg = validElevations.reduce((a, b) => a + b, 0) / validElevations.length;

    return {
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(avg),
      grid,
      bounds,
      resolution: gridResolution,
    };

  } catch (error) {
    console.error('Error fetching elevation grid data:', error);
    throw error; // Re-throw to be caught by react-query
  }
};
