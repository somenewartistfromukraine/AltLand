import React, { Suspense, lazy } from 'react';

const MapContainer = lazy(() => import('./MapContainer').then(module => ({ default: module.MapContainer })));


export const LazyMap: React.FC = () => {
  return (
    <Suspense 
      fallback={
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            textAlign: 'center'
          }}
        >
          <div>Завантаження карти...</div>
          <div style={{ fontSize: '0.8em', marginTop: '8px' }}>Це може зайняти кілька секунд</div>
        </div>
      }
    >
      <MapContainer />
    </Suspense>
  );
};
