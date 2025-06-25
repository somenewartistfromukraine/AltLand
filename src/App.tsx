import React, { useState } from 'react';
import { LazyMap } from './components/map/LazyMap';
import { useMapStore } from './stores/mapStore';
import { LayerSelectorIcon, SatelliteIcon, OSMIcon } from './components/map/MapIcons';
import './App.css';

function App() {
  const { activeLayer, setActiveLayer } = useMapStore();
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
      <div className="map-layer-selector">
        <div 
          className="map-layer-button" 
          onClick={toggleMenu}
        >
          <div className="icon"><LayerSelectorIcon activeLayer={activeLayer} /></div>
          <div className={`map-layer-menu ${menuOpen ? 'open' : ''}`}>
            <div 
              className={`map-layer-item ${activeLayer === 'satellite' ? 'active' : ''}`} 
              onClick={() => handleLayerSelect('satellite')}
              title="Satellite"
            >
              <div className="text">Satellite</div>
              <div className="icon"><SatelliteIcon /></div>
            </div>
            <div 
              className={`map-layer-item ${activeLayer === 'osm' ? 'active' : ''}`} 
              onClick={() => handleLayerSelect('osm')}
              title="Map"
            >
              <div className="text">Map</div>
              <div className="icon"><OSMIcon /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
