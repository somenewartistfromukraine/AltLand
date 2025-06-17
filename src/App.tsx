import { MapContainer } from './components/map/MapContainer';
import { useMapStore } from './stores/mapStore';
import { useEffect } from 'react';

function App() {
  const { activeLayer, setActiveLayer } = useMapStore();

  useEffect(() => {
    // Initialize map state
    setActiveLayer('satellite');
  }, [setActiveLayer]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 flex justify-between items-center border-b">
            <h1 className="text-xl font-semibold">Map Viewer</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveLayer('satellite')}
                className={`px-4 py-2 rounded ${
                  activeLayer === 'satellite' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setActiveLayer('osm')}
                className={`px-4 py-2 rounded ${
                  activeLayer === 'osm' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                OSM
              </button>
            </div>
          </div>
          <div className="h-[600px]">
            <MapContainer />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
