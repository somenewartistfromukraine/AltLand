import React from 'react';
import { PointElevationInfo } from '../../services/terrainService';

interface LocationInfo {
  lat: number;
  lng: number;
}

interface LocationInfoPanelProps {
  locationInfo: LocationInfo;
  isElevationLoading: boolean;
  centerElevationInfo: PointElevationInfo | null;
  zoom: number;
}

const LocationInfoPanel: React.FC<LocationInfoPanelProps> = ({
  locationInfo,
  isElevationLoading,
  centerElevationInfo,
  zoom,
}) => {
  return (
    <div className="bottom-panel location-info-container" title="Поточні координати, висота та масштаб в центрі мапи">
      <span>
        {`Шир: ${locationInfo.lat.toFixed(6)}, Дов: ${locationInfo.lng.toFixed(6)}, Вис: ${isElevationLoading ? '...' : centerElevationInfo !== null ? `${centerElevationInfo.elevation.toFixed(0)}м` : 'н/д'}, Зум: ${zoom.toFixed(2)}`}
      </span>
    </div>
  );
};

export default LocationInfoPanel;
