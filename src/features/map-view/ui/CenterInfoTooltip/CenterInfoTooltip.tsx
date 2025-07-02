import React, { useState, useEffect } from 'react';
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import geomagnetism from 'geomagnetism';
import { useMapStore } from '../../store/mapStore';

const TooltipContent: React.FC = () => {
  const { center } = useMapStore();
  const [elevation, setElevation] = useState<number | null>(null);
  const [declination, setDeclination] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const elevResponse = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${center.lat}&longitude=${center.lng}`);
        if (!elevResponse.ok) throw new Error('Elevation data not available');
        const elevData = await elevResponse.json();
        if (elevData.elevation && elevData.elevation.length > 0) {
          setElevation(elevData.elevation[0]);
        } else {
          throw new Error('Invalid elevation response');
        }

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
    }, 200);

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

const CenterInfoTooltip: React.FC = () => {
  const map = useMap();
  const [position, setPosition] = useState(map.getCenter());

  useMapEvents({
    move() {
      setPosition(map.getCenter());
    },
  });

  const transparentIcon = L.divIcon({
    className: 'crosshair-hover-area',
    iconSize: [30, 30],
    html: ''
  });

  return (
    <Marker position={position} icon={transparentIcon}>
      <Tooltip direction="right" offset={[20, 0]} permanent={false}>
        <TooltipContent />
      </Tooltip>
    </Marker>
  );
};

export default CenterInfoTooltip;
