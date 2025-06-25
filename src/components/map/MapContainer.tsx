import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../stores/mapStore';
import { getMemoizedTileLayerUrl, getMemoizedTileLayerAttribution, getMemoizedTileLayerOptions } from '../../utils/memoize';
import L from 'leaflet';
import { getElevationForPoint, getElevationStatsForBounds, ElevationStats } from '../../services/terrainService';
import ElevationOverlay from './ElevationOverlay';
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
  const { center, zoom, activeLayer, setCenter, setZoom } = useMapStore();
  const tileLayerOptions = getMemoizedTileLayerOptions(activeLayer);

  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    lat: center.lat,
    lng: center.lng,
    zoom: zoom,
    timestamp: new Date().toISOString(),
  });
  const [k, setK] = useState(1.0);
  const [centerElevation, setCenterElevation] = useState<number | null>(null);
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
    const [elevation, stats] = await Promise.all([
      getElevationForPoint(newCenter, newZoom),
      getElevationStatsForBounds(bounds, newZoom)
    ]);
    setCenterElevation(elevation);
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
        <ElevationOverlay k={k} elevationStats={elevationStats} />
      </LeafletMap>
      <div className="crosshair" />

      <div className="k-slider-container">
        <label htmlFor="k-slider">k: {k.toFixed(2)}</label>
        <input
          id="k-slider"
          type="range"
          min="-1"
          max="1"
          step="0.05"
          value={k}
          onChange={(e) => setK(parseFloat(e.target.value))}
          className="k-slider"
        />
      </div>

      <div className="location-info">
        <div className="info-row">
          <span className="info-label">Широта:</span>
          <span className="info-value">{locationInfo.lat.toFixed(4)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Довгота:</span>
          <span className="info-value">{locationInfo.lng.toFixed(4)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Зум:</span>
          <span className="info-value">{locationInfo.zoom}</span>
        </div>
        {locationInfo.tileX !== undefined && (
          <div className="info-row">
            <span className="info-label">Тайл:</span>
            <span className="info-value">
              {locationInfo.tileX}, {locationInfo.tileY} @ {locationInfo.tileZ}
            </span>
          </div>
        )}
        <div className="info-row">
          <span className="info-label">Час:</span>
          <span className="info-value">{new Date(locationInfo.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Висота (центр):</span>
          <span className="info-value">
            {isElevationLoading ? 'Завантаження...' : 
             centerElevation !== null ? `${centerElevation.toFixed(2)} м` : 'Недоступно'}
          </span>
        </div>
        {elevationStats && (
          <div className="info-row stats-row">
            <span className="info-label">Статистика (min/avg/max):</span>
            <span className="info-value">
              {elevationStats.min.toFixed(0)} / {elevationStats.avg.toFixed(0)} / {elevationStats.max.toFixed(0)} м
            </span>
          </div>
        )}
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
