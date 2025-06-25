import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import { getElevationSummary, ElevationSummary } from '../services/elevationService';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes

/**
 * Custom hook to fetch elevation data for the given map bounds.
 * It uses TanStack Query for caching and state management.
 * @param bounds The geographical bounds from the Leaflet map.
 * @returns The result of the query, including the elevation summary, isLoading, and error state.
 */
export const useElevation = (bounds: L.LatLngBounds | null) => {
  // Create a stable query key from the bounds.
  // The key is rounded to 4 decimal places to avoid re-fetching on minor pans.
  const queryKey = [
    'elevation',
    bounds ? {
      north: bounds.getNorth().toFixed(4),
      south: bounds.getSouth().toFixed(4),
      east: bounds.getEast().toFixed(4),
      west: bounds.getWest().toFixed(4),
    } : null,
  ];

  return useQuery<ElevationSummary | null, Error>({
    queryKey: queryKey,
    queryFn: () => {
      if (!bounds) {
        return Promise.resolve(null);
      }
      return getElevationSummary(bounds);
    },
    enabled: !!bounds, // Only run the query if bounds are available
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false, // Optional: prevent refetching on window focus
    placeholderData: (previousData) => previousData, // Use placeholderData in v5 to keep old data visible while fetching new data
  });
};
