import React, { useMemo } from 'react';
import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../stores/mapStore';
import { getMemoizedTileLayerUrl, getMemoizedTileLayerAttribution, getMemoizedTileLayerOptions } from '../../utils/memoize';
import L from 'leaflet';

interface MapContainerProps {
  height?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({
  height = "100vh"
}) => {
  const { center, zoom, activeLayer } = useMapStore();
  const tileLayerOptions = getMemoizedTileLayerOptions(activeLayer);

  // Ensure we have valid center coordinates
  const mapCenter = useMemo(() => 
    center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])
      ? [center[0], center[1]] as L.LatLngExpression
      : [51.505, -0.09] as L.LatLngExpression, // Default to London if center is invalid
    [center]
  );

  // Ensure we have a valid zoom level
  const mapZoom = useMemo(() => 
    typeof zoom === 'number' && !isNaN(zoom) ? zoom : 13,
    [zoom]
  );

  // Get tile layer props
  const tileLayerProps = useMemo(() => ({
    url: getMemoizedTileLayerUrl(activeLayer),
    attribution: getMemoizedTileLayerAttribution(activeLayer),
    ...tileLayerOptions,
    // Ensure subdomains is always an array
    subdomains: tileLayerOptions.subdomains || ['a', 'b', 'c']
  }), [activeLayer, tileLayerOptions]);

  return (
    <div style={{ height: height }}>
      <LeafletMap 
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        minZoom={2}
        maxZoom={18}
        maxBounds={[
          [-90, -180],
          [90, 180]
        ]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer {...tileLayerProps} />
      </LeafletMap>
    </div>
  );
};

export { MapContainer };
