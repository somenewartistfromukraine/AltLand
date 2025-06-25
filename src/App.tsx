import React, { useState } from 'react';
import { LazyMap } from './components/map/LazyMap';
import { useMapStore } from './stores/mapStore';
import { LayerSelectorIcon, SatelliteIcon, OSMIcon, ElevationLayerIcon } from './components/map/MapIcons';
import './App.css';

function App() {
  const { activeLayer, setActiveLayer, isElevationVisible, toggleElevationVisibility } = useMapStore();
  const [menuOpen, setMenuOpen] = useState(false);

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
      </div>
    </div>
  );
}

export default App;
