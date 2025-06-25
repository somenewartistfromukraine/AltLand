import React from 'react';
import { Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../stores/mapStore';

// Haversine formula for destination point
const destinationPoint = (lat: number, lng: number, bearing: number, distance: number): L.LatLng => {
  const R = 6378137; // Earth's radius in meters
  const brng = (bearing * Math.PI) / 180; // Bearing in radians

  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
    Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );

  return L.latLng((lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI);
};

const getBearing = (startLat: number, startLng: number, endLat: number, endLng: number): number => {
    const lat1 = startLat * Math.PI / 180;
    const lon1 = startLng * Math.PI / 180;
    const lat2 = endLat * Math.PI / 180;
    const lon2 = endLng * Math.PI / 180;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
}


const radii = [
  1, 2, 5, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 
  1000, 2000, 5000, 10000, 20000, 30000, 40000, 50000, 
  100000, 200000, 300000, 400000, 500000, 1000000
];

const formatRadius = (radius: number): string => {
  if (radius >= 1000) {
    return `${radius / 1000}km`;
  }
  return `${radius}m`;
};

const ConcentricCircles: React.FC = () => {
  const { targetPoint, center } = useMapStore();

  if (!targetPoint) {
    return null;
  }
  
  const bearing = getBearing(targetPoint.lat, targetPoint.lng, center.lat, center.lng);

  return (
    <>
      {radii.map((radius) => {
        const labelPosition = destinationPoint(targetPoint.lat, targetPoint.lng, bearing, radius);

        return (
          <React.Fragment key={radius}>
            <Circle
              center={targetPoint}
              radius={radius}
              pathOptions={{ color: 'yellow', weight: 1, fillOpacity: 0 }}
            />
            <Marker
              position={labelPosition}
              icon={L.divIcon({
                className: 'circle-label',
                html: `<div>${formatRadius(radius)}</div>`,
                iconSize: [50, 20],
                iconAnchor: [25, 10]
              })}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default ConcentricCircles;
