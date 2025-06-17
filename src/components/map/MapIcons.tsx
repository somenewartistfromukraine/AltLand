import React from 'react';

// Main button icon (shows current layer)
export const LayerSelectorIcon = ({ activeLayer }: { activeLayer: 'satellite' | 'osm' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <path d={activeLayer === 'satellite' 
      ? "M8 8a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"  // Satellite icon
      : "M12.5 16H3.5a1.5 1.5 0 0 1-1.5-1.5V3.5A1.5 1.5 0 0 1 3.5 2h9a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 12.5 16zM3.5 14h9V12H3.5v2zm0-4h9V8H3.5v2zm0-4h9V2H3.5v2z"}  // OSM icon
      fill="#fff"/>
  </svg>
);

// Menu item icons
export const SatelliteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <path d="M8 8a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#fff"/>
  </svg>
);

export const OSMIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <path d="M12.5 16H3.5a1.5 1.5 0 0 1-1.5-1.5V3.5A1.5 1.5 0 0 1 3.5 2h9a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 12.5 16zM3.5 14h9V12H3.5v2zm0-4h9V8H3.5v2zm0-4h9V2H3.5v2z" fill="#fff"/>
  </svg>
);

// ChooseMap button icon
export const ChooseMapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <path d="M8 16a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm-2.5-4.5a1 1 0 0 1 0-2h5a1 1 0 0 1 0 2h-5zm0-4a1 1 0 0 1 0-2h5a1 1 0 0 1 0 2h-5z" fill="#fff"/>
  </svg>
);
