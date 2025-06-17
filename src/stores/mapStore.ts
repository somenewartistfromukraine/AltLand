import { create } from 'zustand';

interface MapStore {
  center: [number, number];
  zoom: number;
  activeLayer: 'satellite' | 'osm';
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setActiveLayer: (layer: 'satellite' | 'osm') => void;
}

export const useMapStore = create<MapStore>((set) => ({
  center: [50.4501, 30.5234],
  zoom: 10,
  activeLayer: 'satellite',
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
}));
