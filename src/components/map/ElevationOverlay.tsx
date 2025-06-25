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

    const maxZoom = this.options.maxZoom;
    const tileZoom = coords.z;
    const isOverzooming = tileZoom > maxZoom;

    const fetchCoords = { ...coords };
    if (isOverzooming) {
      const scale = Math.pow(2, tileZoom - maxZoom);
      fetchCoords.x = Math.floor(coords.x / scale);
      fetchCoords.y = Math.floor(coords.y / scale);
      fetchCoords.z = maxZoom;
    }

    const tileUrl = L.Util.template('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', fetchCoords);

    const image = new Image();
    image.crossOrigin = 'Anonymous';

    image.onload = () => {
      const ctx = tile.getContext('2d', { willReadFrequently: true });
      if (!ctx) { return done(new Error('2d context failed')); }

      const tempCtx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      if (!tempCtx) { return done(new Error('temp 2d context failed')); }
      tempCtx.canvas.width = tileSize.x;
      tempCtx.canvas.height = tileSize.y;

      if (isOverzooming) {
        const scale = Math.pow(2, tileZoom - maxZoom);
        const sWidth = tileSize.x / scale;
        const sHeight = tileSize.y / scale;
        const sx = (coords.x % scale) * sWidth;
        const sy = (coords.y % scale) * sHeight;
        tempCtx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, tileSize.x, tileSize.y);
      } else {
        tempCtx.drawImage(image, 0, 0, tileSize.x, tileSize.y);
      }

      const imageData = tempCtx.getImageData(0, 0, tileSize.x, tileSize.y);
      const pixelData = imageData.data;

      const elevations: number[] = [];
      for (let i = 0; i < pixelData.length; i += 4) {
        elevations.push(decodeElevation(pixelData[i], pixelData[i + 1], pixelData[i + 2]));
      }

      if (elevations.every(e => e <= -10000)) {
        return done(undefined, tile);
      }
      
      const overlayImageData = ctx.createImageData(tileSize.x, tileSize.y);

      for (let i = 0; i < elevations.length; i++) {
        const elevation = elevations[i];
        const pixelIndex = i * 4;

        overlayImageData.data[pixelIndex] = 255;
        overlayImageData.data[pixelIndex + 1] = 255;
        overlayImageData.data[pixelIndex + 2] = 255;

        let alpha = 0;
        if (this.options.elevationStats && elevation > -10000) {
          const { min, max, avg } = this.options.elevationStats;
          const range = max - min;
          if (range > 0) {
            const x = (elevation - avg) / range;
            const k = this.options.k;
            alpha = 1 / (1 + Math.exp(10 * k * x));
          }
        }
        overlayImageData.data[pixelIndex + 3] = Math.round(alpha * this.options.opacity * 255);
      }
      
      ctx.putImageData(overlayImageData, 0, 0);
      done(undefined, tile);
    };
    
    image.onerror = () => {
      done(undefined, tile);
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
