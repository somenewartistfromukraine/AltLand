import React, { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMoveEnd: (e: L.LeafletEvent) => void;
}

const MapEvents: React.FC<MapEventsProps> = ({ onMoveEnd }) => {
  const map = useMapEvents({
    moveend: onMoveEnd,
  });

  useEffect(() => {
    // Manually trigger moveend on initial load to fetch elevation
    map.fire('moveend');
  }, [map]);

  return null;
};

export default MapEvents;
