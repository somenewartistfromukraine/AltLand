import React, { useState, useEffect, useRef } from 'react';
import { useMapStore } from '../store/mapStore';

// Define a type for the search results from Nominatim
interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

const SearchControl = () => {
  const setSearchLocation = useMapStore((state) => state.setSearchLocation);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.length > 2) { // Only search if query is long enough
      debounceTimeout.current = setTimeout(async () => {
        try {
                    const ukraineViewbox = '22.13,52.37,40.22,44.38'; // Bounding box for Ukraine
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=uk&viewbox=${ukraineViewbox}&bounded=0`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data: NominatimResult[] = await response.json();
          setResults(data);
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
        }
      }, 300); // 300ms debounce delay
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query]);

  const handleSelectResult = (result: NominatimResult) => {
    setSearchLocation({ lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
    setQuery('');
    setResults([]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelectResult(results[0]);
    }
  };

  return (
    <div className="search-control-wrapper">
      <form onSubmit={handleFormSubmit} className="search-form" autoComplete="off">
        <input 
          type="text" 
          placeholder="Пошук..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        />
      </form>
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((result) => (
            <li 
              key={result.place_id} 
              onClick={() => handleSelectResult(result)}
              className="search-result-item"
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchControl;
