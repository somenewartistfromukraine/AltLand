import React from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../stores/mapStore';
import { getMemoizedTileLayerUrl, getMemoizedTileLayerAttribution, getMemoizedTileLayerOptions } from '../../utils/memoize';

interface MapContainerProps {
  height?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({
  height = "100vh"
}) => {
  const { center, zoom, activeLayer } = useMapStore();
  const tileLayerOptions = getMemoizedTileLayerOptions(activeLayer);

  return (
    <div style={{ height: height }}>
      <LeafletMap 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%' }}
        zoomControl={false} // Disable default zoom controls
      >
        <TileLayer
          url={getMemoizedTileLayerUrl(activeLayer)}
          attribution={getMemoizedTileLayerAttribution(activeLayer)}
          {...tileLayerOptions}
        />
      </LeafletMap>
    </div>
  );
};

export { MapContainer };
