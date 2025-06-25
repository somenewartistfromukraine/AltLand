import L from 'leaflet';

const ELEVATION_API_URL = 'https://api.open-meteo.com/v1/elevation';
const SAMPLES = 100; // Number of elevation samples to fetch for the visible area

export interface ElevationSummary {
  min: number;
  max: number;
  avg: number;
}

/**
 * Fetches elevation data for a given set of geographical bounds and calculates a summary.
 * @param bounds The geographical bounds from the Leaflet map.
 * @returns A promise that resolves to an elevation summary.
 */
export const getElevationSummary = async (bounds: L.LatLngBounds): Promise<ElevationSummary | null> => {
  const west = bounds.getWest();
  const east = bounds.getEast();
  const centerLat = bounds.getCenter().lat;

  const latitudes: string[] = [];
  const longitudes: string[] = [];

  // Create a series of points along the horizontal centerline of the bounds
  for (let i = 0; i < SAMPLES; i++) {
    const lng = west + (east - west) * (i / (SAMPLES - 1));
    latitudes.push(centerLat.toFixed(4));
    longitudes.push(lng.toFixed(4));
  }

  const apiUrl = `${ELEVATION_API_URL}?latitude=${latitudes.join(',')}&longitude=${longitudes.join(',')}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch elevation data: ${response.statusText}`);
    }
    const data = await response.json();

    if (!data.elevation || data.elevation.length === 0) {
      return null;
    }

    const elevations: number[] = data.elevation;
    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const avg = elevations.reduce((a, b) => a + b, 0) / elevations.length;

    return {
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(avg),
    };

  } catch (error) {
    console.error('Error fetching elevation data:', error);
    throw error; // Re-throw to be caught by react-query
  }
};
