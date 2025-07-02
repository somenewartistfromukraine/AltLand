import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import TooltipContentForPoint from '../TooltipContentForPoint/TooltipContentForPoint';

interface TargetPointMarkerProps {
  point: { lat: number; lng: number };
  zoom: number;
}

const TargetPointMarker: React.FC<TargetPointMarkerProps> = ({ point, zoom }) => {
  return (
    <Marker position={point} icon={L.divIcon({ className: 'point-marker' , iconSize: [32,32], iconAnchor: [16,16], html: '<div class="point-dot"></div>' })}> 
      <Tooltip direction="top" offset={[0, -10]} permanent={false} interactive={true}>
        <TooltipContentForPoint point={point} zoom={zoom} />
      </Tooltip>
    </Marker>
  );
};

export default TargetPointMarker;
