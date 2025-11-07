import React, { useState, useMemo } from 'react';
import type { PredictedHotspot } from '../types';

const majorGtaCities = [
  'Toronto',
  'Mississauga',
  'Brampton',
  'Markham',
  'Vaughan',
  'Hamilton',
  'Oakville'
];

interface GtaMapProps {
  location: string;
  onLocationChange: (newLocation: string) => void;
  hotspots: PredictedHotspot[];
}

const GtaMap: React.FC<GtaMapProps> = ({ location, onLocationChange, hotspots }) => {
  const [inputValue, setInputValue] = useState('');

  const selectedHotspot = useMemo(
    () => hotspots?.find(h => h.locationQuery === location),
    [hotspots, location]
  );

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onLocationChange(inputValue.trim());
      setInputValue(''); // Clear input after search
    }
  };

  const handleCityClick = (city: string) => {
    onLocationChange(city);
  };

  const zoomLevel = useMemo(() => {
    const lowerCaseLocation = location.toLowerCase();
    const majorCitiesLower = majorGtaCities.map(c => c.toLowerCase());

    if (lowerCaseLocation === 'greater toronto area') {
      return 9;
    }
    if (majorCitiesLower.includes(lowerCaseLocation)) {
      return 12;
    }
    // Assume any other query is a specific address or hotspot
    return 15;
  }, [location]);

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed&z=${zoomLevel}`;
  
  return (
    <section className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 transform hover:scale-[1.01] transition-transform duration-300">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
        Explore Locations
      </h2>
      
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a city or address..."
            className="flex-grow min-w-0 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            aria-label="Search for a location on the map"
          />
          <button
            type="submit"
            className="flex-shrink-0 px-4 sm:px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors duration-200"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Major Cities:</span>
          {majorGtaCities.map(city => (
            <button
              key={city}
              onClick={() => handleCityClick(city)}
              className={`px-3 py-1 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 dark:focus:ring-offset-slate-800 transition-all duration-300 ease-in-out ${
                location === city
                  ? 'bg-teal-500 text-white font-semibold shadow transform scale-105'
                  : 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-slate-600'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border dark:border-slate-600">
        <iframe
          key={location} // Using key to force re-render on query change
          src={mapSrc}
          className="w-full h-96 md:h-[500px]"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${location}`}
        ></iframe>
        {selectedHotspot && (
          // This overlay locks the map and displays the growth hotspot indicator
          <div className="absolute inset-0 flex items-center justify-center bg-transparent" aria-hidden="true">
            <div className="relative w-80 h-80 md:w-96 md:h-96 animate-fade-in">
              {/* Pulsating outer circle */}
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping-slow"></div>
              {/* Static inner circle/border */}
              <div className="absolute inset-0 rounded-full border border-red-500/40"></div>
            </div>
          </div>
        )}
      </div>

      {/* Hotspot information displayed below the map */}
      {selectedHotspot && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 animate-fade-in">
          <h3 className="font-bold text-lg mb-2 text-amber-500 dark:text-amber-400">{selectedHotspot.name}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{selectedHotspot.reason}</p>
        </div>
      )}
    </section>
  );
};

export default GtaMap;