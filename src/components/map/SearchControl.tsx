import React, { useState } from 'react';
import { useMapStore } from '../../stores/mapStore';

const SearchControl = () => {
  const setSearchLocation = useMapStore((state) => state.setSearchLocation);
  const [query, setQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setSearchLocation({ lat: parseFloat(lat), lon: parseFloat(lon) });
      } else {
        alert('Місце не знайдено');
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert('Помилка пошуку');
    }
  };

  return (
    <form onSubmit={handleSearch} className="search-form">
      <input 
        type="text" 
        placeholder="Пошук..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClick={(e) => e.stopPropagation()} // Prevent map click
        onDoubleClick={(e) => e.stopPropagation()} // Prevent map double click zoom
      />
    </form>
  );
};

export default SearchControl;
