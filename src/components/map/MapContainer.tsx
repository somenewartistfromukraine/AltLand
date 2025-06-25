import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../stores/mapStore';
import { getMemoizedTileLayerUrl, getMemoizedTileLayerAttribution, getMemoizedTileLayerOptions } from '../../utils/memoize';
import L from 'leaflet';
import { getElevationForPoint, getElevationStatsForBounds, ElevationStats, PointElevationInfo } from '../../services/terrainService';
import ElevationOverlay from './ElevationOverlay';
import ConcentricCircles from './ConcentricCircles';
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

interface MapContainerProps {
  height?: string;
}

// Component to handle map events and update location info
const MapEvents = ({ onMoveEnd }: { onMoveEnd: (e: L.LeafletEvent) => void }) => {
  const map = useMapEvents({
    moveend: onMoveEnd,
  });

  useEffect(() => {
    // Manually trigger moveend on initial load to fetch elevation
    map.fire('moveend');
  }, [map]);

  return null;
};

const MapContainer: React.FC<MapContainerProps> = ({
  height = "100vh"
}) => {
  const { center, zoom, activeLayer, isElevationVisible, targetPoint, isCirclesVisible, setCenter, setZoom } = useMapStore();
  const tileLayerOptions = getMemoizedTileLayerOptions(activeLayer);

  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    lat: center.lat,
    lng: center.lng,
    zoom: zoom,
    timestamp: new Date().toISOString(),
  });
  const [k, setK] = useState(1.0);
  const [centerElevationInfo, setCenterElevationInfo] = useState<PointElevationInfo | null>(null);
  const [elevationStats, setElevationStats] = useState<ElevationStats | null>(null);
  const [isElevationLoading, setIsElevationLoading] = useState(true);


  const handleMoveEnd = React.useCallback(async (e: L.LeafletEvent) => {
    const map = e.target as L.Map;
    const newCenter = map.getCenter();
    const newZoom = map.getZoom();
    const bounds = map.getBounds();

    setCenter(newCenter);
    setZoom(newZoom);

    const tileZ = newZoom;
    const tileX = Math.floor((newCenter.lng + 180) / 360 * Math.pow(2, tileZ));
    const tileY = Math.floor((1 - Math.log(Math.tan(newCenter.lat * Math.PI / 180) + 1 / Math.cos(newCenter.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, tileZ));

    setLocationInfo({
      lat: newCenter.lat,
      lng: newCenter.lng,
      zoom: newZoom,
      tileX: tileX,
      tileY: tileY,
      tileZ: newZoom,
      timestamp: new Date().toISOString(),
      bounds: bounds,
    });

    // Fetch elevation data concurrently
    setIsElevationLoading(true);
    const [elevationInfo, stats] = await Promise.all([
      getElevationForPoint(newCenter, newZoom),
      getElevationStatsForBounds(bounds, newZoom)
    ]);
    setCenterElevationInfo(elevationInfo);
    setElevationStats(stats);
    setIsElevationLoading(false);


  }, [setCenter, setZoom]);



  // Ensure we have valid center coordinates
  const mapCenter: L.LatLngExpression = useMemo(() => [center.lat, center.lng], [center]);

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
      title="Переміщуйте та масштабуйте для дослідження. Перехрестя позначає центральну точку, для якої відображаються дані про висоту та координати."
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
        {isElevationVisible && <ElevationOverlay k={k} elevationStats={elevationStats} />}
        {targetPoint && (
          <Marker position={targetPoint} icon={L.divIcon({ className: 'red-dot-marker' })} />
        )}
        {targetPoint && isCirclesVisible && <ConcentricCircles />}
      </LeafletMap>
      <div className="crosshair" />

      {isElevationVisible && (
        <div className="k-slider-container">
          <input
            id="k-slider"
            title="Виділити западини <--O--> Виділити висоти"
            type="range"
            min="-1"
            max="1"
            step="0.05"
            value={k}
            onChange={(e) => setK(parseFloat(e.target.value))}
            className="k-slider"
          />
        </div>
      )}

      <div className="location-info" title="Поточні координати та висота в центрі мапи">
        <span>
          {`Шир: ${locationInfo.lat.toFixed(6)}, Дов: ${locationInfo.lng.toFixed(6)}, Вис: ${isElevationLoading ? '...' : centerElevationInfo !== null ? `${centerElevationInfo.elevation.toFixed(0)}м` : 'н/д'}`}
        </span>
      </div>


      {/* <ElevationProfile 
        data={elevationData || []} 
        isLoading={isElevationLoading} 
        error={elevationError} 
      /> */}
    </div>
  );
};

export { MapContainer };
