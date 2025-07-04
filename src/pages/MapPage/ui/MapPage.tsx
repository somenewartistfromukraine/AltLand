import React, { useState, useRef } from 'react';
import { LazyMap } from '../../../features/map-view/components/LazyMap';
import { useMapStore } from '../../../features/map-view/store/mapStore';
import { LayerSelectorIcon, SatelliteIcon, OSMIcon, ElevationLayerIcon, MakePointIcon, SearchIcon } from '../../../features/map-view/components/MapIcons';
import SearchControl from '../../../features/map-view/components/SearchControl';
import Copyright from '../../../shared/ui/Copyright';

export const MapPage: React.FC = () => {
  const { activeLayer, setActiveLayer, isElevationVisible, toggleElevationVisibility, targetPoint, isSearchVisible, setTargetPoint, toggleSearchVisibility, center } = useMapStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setTargetPoint(null);
      longPressTimer.current = null;
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      setTargetPoint(center);
      longPressTimer.current = null;
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleLayerSelect = (layer: 'satellite' | 'osm') => {
    setActiveLayer(layer);
    setMenuOpen(false);
  };

  return (
    <div className="App">
      <div className="top-right-controls">
        <div className="search-container">
          {isSearchVisible && <SearchControl />}
          <div 
            className={`map-layer-button ${isSearchVisible ? 'active' : ''}`}
            onClick={toggleSearchVisibility} 
            title="Пошук"
          >
            <SearchIcon />
          </div>
        </div>
        <div className="layer-selector-container">
          {menuOpen && (
            <>
              <div className="map-layer-button" onClick={() => handleLayerSelect('satellite')} title="Супутник">
                <SatelliteIcon />
              </div>
              <div className="map-layer-button" onClick={() => handleLayerSelect('osm')} title="Карта">
                <OSMIcon />
              </div>
            </>
          )}
          <div className={`map-layer-button ${menuOpen ? 'active' : ''}`} onClick={toggleMenu} title="Обрати шар карти">
            <LayerSelectorIcon activeLayer={activeLayer} />
          </div>
        </div>

        <div
          className={`map-layer-button ${isElevationVisible ? 'active' : ''}`}
          onClick={toggleElevationVisibility}
          title="Шар висот"
        >
          <ElevationLayerIcon />
        </div>

        <div
          className={`map-layer-button ${targetPoint ? 'active' : ''}`}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          title="Натисніть, щоб позначити ціль. Утримуйте, щоб зняти позначку."
        >
          <MakePointIcon />
        </div>
      </div>
      <LazyMap />
      <Copyright />
    </div>
  );
};
