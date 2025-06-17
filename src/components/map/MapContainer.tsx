import React from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../stores/mapStore';

interface MapContainerProps {
  height?: string;
}

const TILE_LAYERS = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri"
  },
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors"
  }
} as const;

export const MapContainer: React.FC<MapContainerProps> = ({
  height = "100vh"
}) => {
  const { center, zoom, activeLayer } = useMapStore();

  return (
    <div style={{ height: height }}>
      <LeafletMap 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%' }}
        zoomControl={false} // Disable default zoom controls
      >
        <TileLayer
          url={TILE_LAYERS[activeLayer].url}
          attribution={TILE_LAYERS[activeLayer].attribution}
        />
      </LeafletMap>
    </div>
  );
};
