import React, { useState, useEffect } from 'react';

interface TooltipContentForPointProps {
  point: { lat: number; lng: number };
  zoom: number;
}

const TooltipContentForPoint: React.FC<TooltipContentForPointProps> = ({ point, zoom }) => {
  const [elevation, setElevation] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

export default TooltipContentForPoint;
