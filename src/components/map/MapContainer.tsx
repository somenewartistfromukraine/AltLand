import React from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
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
  center = [50.4501, 30.5234],
  zoom = 10,
  height = "100vh"
}) => {
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'osm'>('satellite');

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
