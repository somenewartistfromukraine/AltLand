import { create } from 'zustand';

interface MapStore {
  center: { lat: number; lng: number };
  zoom: number;
  activeLayer: 'satellite' | 'osm';
  isElevationVisible: boolean;
  targetPoint: { lat: number; lng: number } | null;
  isCirclesVisible: boolean;
  isSearchVisible: boolean;
  searchLocation: { lat: number; lon: number } | null;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  setActiveLayer: (layer: 'satellite' | 'osm') => void;
  toggleElevationVisibility: () => void;
  setTargetPoint: (point: { lat: number; lng: number } | null) => void;
  toggleSearchVisibility: () => void;
  setSearchLocation: (location: { lat: number; lon: number } | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  center: { lat: 48.0739, lng: 37.7394 },
  zoom: 10,
  activeLayer: 'satellite',
  isElevationVisible: false,
  targetPoint: null,
  isCirclesVisible: false,
  isSearchVisible: false,
  searchLocation: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  toggleElevationVisibility: () => set((state) => ({ isElevationVisible: !state.isElevationVisible })),
  setTargetPoint: (point) => set({ targetPoint: point, isCirclesVisible: !!point }),
  toggleSearchVisibility: () => set((state) => ({ isSearchVisible: !state.isSearchVisible })),
  setSearchLocation: (location) => set({ searchLocation: location }),
}));
