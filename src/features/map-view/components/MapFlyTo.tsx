import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../store/mapStore';

const MapFlyTo = () => {
  const map = useMap();
  const searchLocation = useMapStore((state) => state.searchLocation);
  const setSearchLocation = useMapStore((state) => state.setSearchLocation);

  useEffect(() => {
    if (searchLocation) {
      map.flyTo([searchLocation.lat, searchLocation.lon], 13);
      setSearchLocation(null); // Reset after flying
    }
  }, [searchLocation, map, setSearchLocation]);

  return null; // This component does not render anything
};

export default MapFlyTo;
