import { create } from 'zustand';

interface MapStore {
  center: { lat: number; lng: number };
  zoom: number;
  activeLayer: 'satellite' | 'osm';
  isElevationVisible: boolean;
  targetPoint: { lat: number; lng: number } | null;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  setActiveLayer: (layer: 'satellite' | 'osm') => void;
  toggleElevationVisibility: () => void;
  setTargetPoint: (point: { lat: number; lng: number } | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  center: { lat: 50.4501, lng: 30.5234 },
  zoom: 10,
  activeLayer: 'satellite',
  isElevationVisible: true,
  targetPoint: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  toggleElevationVisibility: () => set((state) => ({ isElevationVisible: !state.isElevationVisible })),
  setTargetPoint: (point) => set({ targetPoint: point }),
}));
