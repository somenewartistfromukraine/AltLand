import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../stores/mapStore';
import { getMemoizedTileLayerUrl, getMemoizedTileLayerAttribution, getMemoizedTileLayerOptions } from '../../utils/memoize';
import L from 'leaflet';
import './MapContainer.css';

interface LocationInfo {
  lat: number;
  lng: number;
  zoom: number;
  tileX?: number;
  tileY?: number;
  tileZ?: number;
  timestamp: string;
  bounds?: L.LatLngBounds;
}

interface LocationInfo {
  lat: number;
  lng: number;
  zoom: number;
  tileX?: number;
  tileY?: number;
  tileZ?: number;
  timestamp: string;
  bounds?: L.LatLngBounds;
}

interface MapContainerProps {
  height?: string;
}

// Component to handle map events and update location info
const MapEvents = ({ onMoveEnd }: { onMoveEnd: (e: L.LeafletEvent) => void }) => {
  const map = useMapEvents({
    moveend: onMoveEnd,
    zoomend: onMoveEnd,
  });
  
  // Store the last center and zoom to prevent unnecessary updates
  const lastCenterRef = React.useRef<L.LatLng | null>(null);
  const lastZoomRef = React.useRef<number | null>(null);
  
  // Trigger initial position update
  React.useEffect(() => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    // Only update if center or zoom has actually changed
    if (!lastCenterRef.current || 
        !lastCenterRef.current.equals(center) || 
        lastZoomRef.current !== zoom) {
      
      lastCenterRef.current = center;
      lastZoomRef.current = zoom;
      
      const event = { target: map } as unknown as L.LeafletEvent;
      onMoveEnd(event);
    }
  }, [map, onMoveEnd]);
  
  return null;
};

const MapContainer: React.FC<MapContainerProps> = ({
  height = "100vh"
}) => {
  const { center, zoom, activeLayer } = useMapStore();
  const tileLayerOptions = getMemoizedTileLayerOptions(activeLayer);
  
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    lat: 0,
    lng: 0,
    zoom: 0,
    timestamp: new Date().toISOString()
  });

  const handleMoveEnd = React.useCallback((e: L.LeafletEvent) => {
    const map = e.target as L.Map;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bounds = map.getBounds();
    const pixelPoint = map.latLngToContainerPoint(center);
    const tileSize = 256; // Standard tile size
    const scale = Math.pow(2, zoom);
    const tileX = Math.floor((pixelPoint.x * scale) / tileSize);
    const tileY = Math.floor((pixelPoint.y * scale) / tileSize);

    setLocationInfo(prev => {
      // Only update if something actually changed
      if (prev.lat === parseFloat(center.lat.toFixed(6)) &&
          prev.lng === parseFloat(center.lng.toFixed(6)) &&
          prev.zoom === zoom) {
        return prev;
      }
      
      return {
        lat: parseFloat(center.lat.toFixed(6)),
        lng: parseFloat(center.lng.toFixed(6)),
        zoom,
        tileX,
        tileY,
        tileZ: zoom,
        timestamp: new Date().toISOString(),
        bounds
      };
    });
  }, []);

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

  // Set custom property for height if it's not the default
  const containerStyle = height !== '100vh' ? { '--map-height': height } as React.CSSProperties : {};
  
  return (
    <div 
      className={`map-container ${height === '100vh' ? 'full-height' : 'custom-height'}`} 
      style={containerStyle}
    >
      <LeafletMap 
        center={mapCenter}
        zoom={mapZoom}
        className="map-view"
        zoomControl={false}
        minZoom={2}
        maxZoom={18}
        maxBounds={[
          [-90, -180],
          [90, 180]
        ]}
        maxBoundsViscosity={1.0}
        whenReady={() => {
          // Initial position will be set by the MapEvents component
        }}
      >
        <TileLayer {...tileLayerProps} />
        <MapEvents onMoveEnd={handleMoveEnd} />
      </LeafletMap>
      <div className="crosshair" />
      
      <div className="location-info">
        <div className="info-row">
          <span className="info-label">Широта:</span>
          <span className="info-value">{locationInfo.lat}°</span>
        </div>
        <div className="info-row">
          <span className="info-label">Довгота:</span>
          <span className="info-value">{locationInfo.lng}°</span>
        </div>
        <div className="info-row">
          <span className="info-label">Зум:</span>
          <span className="info-value">{locationInfo.zoom}</span>
        </div>
        {locationInfo.tileX !== undefined && locationInfo.tileY !== undefined && (
          <div className="info-row">
            <span className="info-label">Тайл:</span>
            <span className="info-value">
              {locationInfo.tileX}, {locationInfo.tileY} @ {locationInfo.tileZ}
            </span>
          </div>
        )}
        <div className="info-row timestamp">
          {new Date(locationInfo.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export { MapContainer };
