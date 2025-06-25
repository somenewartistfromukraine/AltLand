import L from 'leaflet';
import { useMap } from 'react-leaflet';
import React, { useEffect, useRef } from 'react';
import { decodeElevation, ElevationStats } from '../../services/terrainService';

// Define the custom layer
const ElevationLayer = L.GridLayer.extend({
  options: {
    k: 1.0,
    opacity: 0.7,
    maxZoom: 15, // AWS tiles are available up to zoom 15
    elevationStats: null as ElevationStats | null,
  },

  createTile: function (coords: L.Coords, done: L.DoneCallback) {
    const tile = document.createElement('canvas');
    const tileSize = this.getTileSize();
    tile.width = tileSize.x;
    tile.height = tileSize.y;

    const tileUrl = L.Util.template('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', coords);
    
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.onload = () => {
      const ctx = tile.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = tile.width;
      tempCanvas.height = tile.height;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!tempCtx) return;
      tempCtx.drawImage(image, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tile.width, tile.height);
      const pixelData = imageData.data;

      const elevations: number[] = [];
      for (let i = 0; i < pixelData.length; i += 4) {
        elevations.push(decodeElevation(pixelData[i], pixelData[i + 1], pixelData[i + 2]));
      }

      const validElevations = elevations.filter(e => e > -10000);
      if (validElevations.length === 0) {
        done(undefined, tile); // Return empty tile if no data
        return;
      }
      


      const overlayImageData = ctx.createImageData(tile.width, tile.height);
      const overlayPixelData = overlayImageData.data;

      for (let i = 0; i < elevations.length; i++) {
        const elevation = elevations[i];
        const pixelIndex = i * 4;

        overlayPixelData[pixelIndex] = 255;     // R
        overlayPixelData[pixelIndex + 1] = 255; // G
        overlayPixelData[pixelIndex + 2] = 255; // B

        if (this.options.elevationStats) {
          const { min, max, avg } = this.options.elevationStats;
          const range = max - min;
          if (range > 0) {
            const x = (elevation - avg) / range;
            const k = this.options.k;
            const alpha = 1 / (1 + Math.exp(10 * k * x));
            overlayPixelData[pixelIndex + 3] = Math.round(alpha * 255);
          } else {
            overlayPixelData[pixelIndex + 3] = 0; // Fully transparent if flat
          }
        } else {
          overlayPixelData[pixelIndex + 3] = 0; // No stats, fully transparent
        }
      }
      
      ctx.putImageData(overlayImageData, 0, 0);
      done(undefined, tile);
    };
    
    image.onerror = () => {
      done(undefined, tile); // Return empty tile on error
    };

    image.src = tileUrl;

    return tile;
  },

  setK: function(k: number) {
    this.options.k = k;
    this.redraw();
    return this;
  },

  setElevationStats: function(stats: ElevationStats | null) {
    this.options.elevationStats = stats;
    this.redraw();
    return this;
  }
});

// React component wrapper
interface ElevationOverlayProps {
  k: number;
  elevationStats: ElevationStats | null;
}

const ElevationOverlay: React.FC<ElevationOverlayProps> = ({ k, elevationStats }) => {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    layerRef.current = new (ElevationLayer as any)();
    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) {
        layerRef.current.remove();
      }
    };
  }, [map]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setK(k);
    }
  }, [k]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setElevationStats(elevationStats);
    }
  }, [elevationStats]);

  return null; // This component only adds a layer to the map
};

export default ElevationOverlay;
