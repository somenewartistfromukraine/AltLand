import React, { useState, useRef } from 'react';
import { LazyMap } from './components/map/LazyMap';
import { useMapStore } from './stores/mapStore';
import { LayerSelectorIcon, SatelliteIcon, OSMIcon, ElevationLayerIcon, MakePointIcon } from './components/map/MapIcons';
import './App.css';

function App() {
    const { activeLayer, setActiveLayer, isElevationVisible, toggleElevationVisibility, targetPoint, setTargetPoint, center } = useMapStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    // Set a timer to clear the target on long press
    longPressTimer.current = setTimeout(() => {
      setTargetPoint(null);
      longPressTimer.current = null; // Timer has fired, so clear it
    }, 500); // 500ms for long press
  };

  const handlePressEnd = () => {
    // If the timer is still active, it means it was a short press
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
    <div className="app-root">
      <LazyMap />
      <div className="map-controls">
        <div className="layer-selector-container">
          <div className={`map-layer-menu ${menuOpen ? 'open' : ''}`}>
            <div
              className={`map-layer-button ${activeLayer === 'satellite' ? 'active' : ''}`}
              onClick={() => handleLayerSelect('satellite')}
              title="Супутник"
            >
              <SatelliteIcon />
            </div>
            <div
              className={`map-layer-button ${activeLayer === 'osm' ? 'active' : ''}`}
              onClick={() => handleLayerSelect('osm')}
              title="Мапа"
            >
              <OSMIcon />
            </div>
          </div>
          <div
            className={`map-layer-button ${menuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            title="Вибрати шар мапи"
          >
            <LayerSelectorIcon activeLayer={activeLayer} />
          </div>
        </div>
        <div
          className={`map-layer-button ${isElevationVisible ? 'active' : ''}`}
          onClick={toggleElevationVisibility}
          title="Показати/сховати шар висот"
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
    </div>
  );
}

export default App;
