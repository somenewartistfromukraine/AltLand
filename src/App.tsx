import React, { useState } from 'react';
import { LazyMap } from './components/map/LazyMap';
import { useMapStore } from './stores/mapStore';
import { ChooseMapIcon, SatelliteIcon, OSMIcon } from './components/map/MapIcons';

function App() {
  const { activeLayer, setActiveLayer } = useMapStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [menuY, setMenuY] = useState(0);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleLayerSelect = (layer: 'satellite' | 'osm') => {
    setActiveLayer(layer);
    setMenuOpen(false);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#f0f0f0'
    }}>
      <LazyMap />
      <div className="map-layer-selector">
        <div 
          className="map-layer-button" 
          onClick={toggleMenu}
          style={{ position: 'relative' }}
        >
          <div className="icon">{activeLayer === 'satellite' ? '🌍' : '🗺️'}</div>
          <div className="map-layer-menu" style={{ display: menuOpen ? 'block' : 'none' }}>
            <div 
              className={`map-layer-item ${activeLayer === 'satellite' ? 'active' : ''}`} 
              onClick={() => handleLayerSelect('satellite')}
              title="Satellite"
            >
              <div className="text">Satellite</div>
              <div className="icon">🌍</div>
            </div>
            <div 
              className={`map-layer-item ${activeLayer === 'osm' ? 'active' : ''}`} 
              onClick={() => handleLayerSelect('osm')}
              title="Map"
            >
              <div className="text">Map</div>
              <div className="icon">🗺️</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
