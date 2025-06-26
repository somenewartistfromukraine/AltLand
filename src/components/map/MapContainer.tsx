import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import geomagnetism from 'geomagnetism';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../stores/mapStore';
import { getSatelliteLayer, getOSMLayer, getReferenceLayer } from '../../utils/memoize';

// Tooltip content for Point marker
interface TooltipContentForPointProps {
  point: { lat: number; lng: number };
  zoom: number;
}

const TooltipContentForPoint: React.FC<TooltipContentForPointProps> = ({ point, zoom }) => {
  const [elevation, setElevation] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tile, setTile] = useState<{ x: number; y: number; z: number } | null>(null);

  useEffect(() => {
    // Calculate tileX, tileY, tileZ
    const z = zoom;
    const x = Math.floor((point.lng + 180) / 360 * Math.pow(2, z));
    const y = Math.floor((1 - Math.log(Math.tan(point.lat * Math.PI / 180) + 1 / Math.cos(point.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    setTile({ x, y, z });

    // Fetch elevation
    const fetchElevation = async () => {
      try {
        const resp = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${point.lat}&longitude=${point.lng}`);
        if (!resp.ok) throw new Error('Elevation data not available');
        const data = await resp.json();
        if (data.elevation && data.elevation.length > 0) {
          setElevation(data.elevation[0]);
        } else {
          throw new Error('Invalid elevation response');
        }
        setError(null);
      } catch (err) {
        setError('Висота: недоступна');
        setElevation(null);
      }
    };
    fetchElevation();
  }, [point, zoom]);

  return (
    <div>
      <strong>Інформація про точку</strong><br />
      Шир: {point.lat.toFixed(6)}<br />
      Дов: {point.lng.toFixed(6)}<br />
      Зум: {zoom}<br />

      {elevation !== null ? `Висота: ${elevation.toFixed(0)} м` : error || 'Висота: ...'}
    </div>
  );
};
import { getElevationForPoint, getElevationStatsForBounds, ElevationStats, PointElevationInfo } from '../../services/terrainService';
import ElevationOverlay from './ElevationOverlay';
import ConcentricCircles from './ConcentricCircles';
import MapFlyTo from './MapFlyTo';
import RulerLine from './RulerLine';
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

// New component for the tooltip content
const TooltipContent: React.FC = () => {
  const { center } = useMapStore();
  const [elevation, setElevation] = useState<number | null>(null);
  const [declination, setDeclination] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch elevation
        const elevResponse = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${center.lat}&longitude=${center.lng}`);
        if (!elevResponse.ok) throw new Error('Elevation data not available');
        const elevData = await elevResponse.json();
        if (elevData.elevation && elevData.elevation.length > 0) {
          setElevation(elevData.elevation[0]);
        } else {
          throw new Error('Invalid elevation response');
        }

        // Calculate magnetic declination
        const model = geomagnetism.model();
        const { decl } = model.point([center.lat, center.lng]);
        setDeclination(decl);
        
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Дані недоступні';
        console.error("Failed to fetch center data:", err);
        setError(message);
        setElevation(null);
        setDeclination(null);
      }
    };

    const timer = setTimeout(() => {
        fetchData();
    }, 200); // Debounce fetching

    return () => clearTimeout(timer);
  }, [center]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <strong>Центр карти</strong><br />
      Шир: {center.lat.toFixed(6)}<br />
      Дов: {center.lng.toFixed(6)}<br />
      {declination !== null ? `Магн. схилення: ${declination.toFixed(2)}°` : 'Схилення: завантаження...'}<br />
      {elevation !== null ? `Висота: ${elevation.toFixed(0)} м` : 'Висота: завантаження...'}
    </div>
  );
};

// New component for the invisible marker and tooltip
const CenterInfoTooltip: React.FC = () => {
  const map = useMap();
  const center = map.getCenter();

  // Create a transparent icon that covers the crosshair area
  const transparentIcon = L.divIcon({
    className: 'crosshair-hover-area',
    iconSize: [30, 30],
    html: ''
  });

  return (
    <Marker position={center} icon={transparentIcon}>
      <Tooltip direction="right" offset={[20, 0]} permanent={false}>
        <TooltipContent />
      </Tooltip>
    </Marker>
  );
};

const MapContainer: React.FC<MapContainerProps> = ({
  height = "100vh"
}) => {
  const { center, zoom, activeLayer, isElevationVisible, targetPoint, isCirclesVisible, setCenter, setZoom } = useMapStore();
  
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
  const tileLayerProps = useMemo(() => {
    if (activeLayer === 'satellite') {
      return getSatelliteLayer();
    }
    return getOSMLayer();
  }, [activeLayer]);

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
        {activeLayer === 'satellite' && <TileLayer {...getReferenceLayer()} pane="shadowPane" />}
        <MapEvents onMoveEnd={handleMoveEnd} />
        <MapFlyTo />
        <CenterInfoTooltip />
        {isElevationVisible && <ElevationOverlay k={k} elevationStats={elevationStats} />}
        {targetPoint && (
  <Marker position={targetPoint} icon={L.divIcon({ className: 'point-marker' , iconSize: [32,32], iconAnchor: [16,16], html: '<div class="point-dot"></div>' })}>
    <Tooltip direction="top" offset={[0, -10]} permanent={false} interactive={true}>
      <TooltipContentForPoint point={targetPoint} zoom={zoom} />
    </Tooltip>
  </Marker>
)}
        {isCirclesVisible && <ConcentricCircles />}
        {targetPoint && <RulerLine start={center} end={targetPoint} />}
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

      <div className="bottom-panel location-info-container" title="Поточні координати, висота та масштаб в центрі мапи">
        <span>
          {`Шир: ${locationInfo.lat.toFixed(6)}, Дов: ${locationInfo.lng.toFixed(6)}, Вис: ${isElevationLoading ? '...' : centerElevationInfo !== null ? `${centerElevationInfo.elevation.toFixed(0)}м` : 'н/д'}, Зум: ${zoom.toFixed(2)}`}
        </span>
      </div>
    </div>
  );
};

export { MapContainer };
