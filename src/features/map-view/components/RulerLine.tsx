import React from 'react';
import { Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAzimuthAndDistance } from '../../../shared/lib/geo';

interface RulerLineProps {
  start: { lat: number; lng: number }; // map center
  end: { lat: number; lng: number };   // target point
}

// Tooltip content for Ruler (Polyline)
import geomagnetism from 'geomagnetism';

interface TooltipContentForRulerProps {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
}

const TooltipContentForRuler: React.FC<TooltipContentForRulerProps> = ({ start, end }) => {
  // Відстань і істинний азимут
  const { distance, trueBearing } = getAzimuthAndDistance(start, end);
  // Магнітний азимут
  let magneticAzimuth = trueBearing;
  let declination = 0;
  try {
    const model = geomagnetism.model();
    const mag = model.point([start.lat, start.lng]);
    declination = mag.decl;
    magneticAzimuth = trueBearing - declination;
    if (magneticAzimuth < 0) magneticAzimuth += 360;
  } catch {}
  // Дирекційний кут (приймаємо як істинний азимут)
  const directionAngle = trueBearing;
  const distanceText = distance < 1000 ? `${distance.toFixed(0)} м` : `${(distance / 1000).toFixed(2)} км`;
  return (
    <div>
      <strong>Лінійка</strong><br />
      Відстань: {distanceText}<br />
      Азимут: {trueBearing.toFixed(2)}°<br />
      Магн. азимут: {magneticAzimuth.toFixed(2)}°<br />
      Дирекційний кут: {directionAngle.toFixed(2)}°
    </div>
  );
};

const RulerLine: React.FC<RulerLineProps> = ({ start, end }) => {
  const map = useMap();
  const { distance, magneticAzimuth } = getAzimuthAndDistance(start, end);

  // Constants for layout in pixels
  const GAP_PX = 1;
  const TEXT_WIDTH_PX = 120; // Approximate width of the text label
  const TEXT_HEIGHT_PX = 20;

  // Convert geo coordinates to screen coordinates
  const centerPx = map.latLngToContainerPoint(L.latLng(start.lat, start.lng));
  const pointPx = map.latLngToContainerPoint(L.latLng(end.lat, end.lng));

  // Calculate the vector from the center to the point
  const vector = pointPx.subtract(centerPx);
  const totalDistancePx = vector.distanceTo(L.point(0, 0));
  
  // If the point is too close to the center, don't draw anything
  if (totalDistancePx < GAP_PX * 2 + TEXT_WIDTH_PX) {
    return null;
  }

  const unitVector = vector.divideBy(totalDistancePx);

  // Calculate the position for the text label
  // It starts after a 2px gap from the center
  const textStartPx = centerPx.add(unitVector.multiplyBy(GAP_PX));
  const textCenterPx = textStartPx.add(unitVector.multiplyBy(TEXT_WIDTH_PX / 2));
  const labelPosition = map.containerPointToLatLng(textCenterPx);

  // Calculate the start of the dashed line
  // It starts after the text and another 2px gap
  const lineStartPx = textStartPx.add(unitVector.multiplyBy(TEXT_WIDTH_PX + GAP_PX));
  const lineStartLatLng = map.containerPointToLatLng(lineStartPx);

  const positions: L.LatLngExpression[] = [
    lineStartLatLng,
    [end.lat, end.lng],
  ];

  const lineOptions = {
    color: 'yellow',
    weight: 2,
    dashArray: '5, 10',
    interactive: true,
  };

  const distanceText = distance < 1000
    ? `${distance.toFixed(0)} м`
    : `${(distance / 1000).toFixed(2)} км`;

  // Calculate rotation angle from the screen vector
  const angleRad = Math.atan2(unitVector.y, unitVector.x);
  let angleDeg = angleRad * (180 / Math.PI);

  // If the center is to the East of the Point (i.e., Point is on the left side of the screen),
  // flip the text 180 degrees to keep it readable.
  if (start.lng > end.lng) {
    angleDeg += 180;
  }

  const labelContent = `
    <div style="width: ${TEXT_WIDTH_PX}px; transform: rotate(${angleDeg}deg); transform-origin: center;">
      <div class="ruler-label">
        ${distanceText} | ${magneticAzimuth.toFixed(1)}°
      </div>
    </div>
  `;

  const labelIcon = L.divIcon({
    className: 'ruler-label-container',
    html: labelContent,
    iconSize: [TEXT_WIDTH_PX, TEXT_HEIGHT_PX],
    iconAnchor: [TEXT_WIDTH_PX / 2, TEXT_HEIGHT_PX / 2], // Anchor at the center of the div
  });

  return (
    <>
      <Polyline positions={positions} pathOptions={lineOptions} />

      <Marker position={labelPosition} icon={labelIcon} />
    </>
  );
};

export default RulerLine;
