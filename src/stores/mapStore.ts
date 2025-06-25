import { create } from 'zustand';

interface MapStore {
  center: { lat: number; lng: number };
  zoom: number;
  activeLayer: 'satellite' | 'osm';
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  setActiveLayer: (layer: 'satellite' | 'osm') => void;
}

export const useMapStore = create<MapStore>((set) => ({
  center: { lat: 50.4501, lng: 30.5234 },
  zoom: 10,
  activeLayer: 'satellite',
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
}));
