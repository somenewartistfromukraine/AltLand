
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useMapStore } from '../store/mapStore';
import { getSatelliteLayer, getOSMLayer, getReferenceLayer } from '../../../shared/lib/memoize';
import { getElevationForPoint, getElevationStatsForBounds, ElevationStats, PointElevationInfo } from '../services/terrainService';

import ElevationOverlay from './ElevationOverlay';
import ConcentricCircles from './ConcentricCircles';
import MapFlyTo from './MapFlyTo';
import RulerLine from './RulerLine';

// Import modular UI components
import MapEvents from '../ui/MapEvents/MapEvents';
import KSlider from '../ui/KSlider/KSlider';
import LocationInfoPanel from '../ui/LocationInfoPanel/LocationInfoPanel';
import TargetPointMarker from '../ui/TargetPointMarker/TargetPointMarker';
import CenterInfoTooltip from '../ui/CenterInfoTooltip/CenterInfoTooltip';

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

  return (
    <div 
      className={`map-container ${height === '100vh' ? 'full-height' : 'custom-height'}`}
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
      >
        <TileLayer {...tileLayerProps} />
        {activeLayer === 'satellite' && <TileLayer {...getReferenceLayer()} pane="shadowPane" />}
        
        <MapEvents onMoveEnd={handleMoveEnd} />
        <MapFlyTo />
        <CenterInfoTooltip />

        {isElevationVisible && <ElevationOverlay k={k} elevationStats={elevationStats} />}
        
        {targetPoint && <TargetPointMarker point={targetPoint} zoom={zoom} />}

        {isCirclesVisible && <ConcentricCircles />}
        {targetPoint && <RulerLine start={center} end={targetPoint} />}
      </LeafletMap>
      
      <div className="crosshair" />

      {isElevationVisible && (
        <KSlider k={k} onKChange={setK} />
      )}

      <LocationInfoPanel 
        locationInfo={locationInfo}
        isElevationLoading={isElevationLoading}
        centerElevationInfo={centerElevationInfo}
        zoom={zoom}
      />
    </div>
  );
};

export { MapContainer };
