import React from 'react';

/**
 * FishingZoneMap Component: Mocks a map view showing the Predicted Fishing Zone (P-FZ).
 * @param {string} zoneStatus - The current status (e.g., 'OPTIMAL', 'GOOD', 'POOR').
 */
const FishingZoneMap = ({ zoneStatus = 'OPTIMAL' }) => {
  const zoneColor = zoneStatus === 'OPTIMAL' ? 'bg-green-600' : 'bg-yellow-600';

  return (
    <div className="relative h-64 w-full bg-blue-700 rounded-xl overflow-hidden shadow-2xl">
      {/* Mock Water/Land Map */}
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(to top right, #004d40 0%, #00acc1 100%)' }}></div>
      
      {/* Mock P-FZ (Predicted Fishing Zone) Area */}
      <div className={`absolute bottom-0 right-0 h-4/5 w-3/4 opacity-90 p-4 rounded-tl-[50px] ${zoneColor} flex flex-col justify-center items-center`} style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white mb-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="text-xl font-bold text-white">Fishing Zone</span>
        <span className="text-sm text-white/80 mt-1">Status: {zoneStatus}</span>
      </div>

      <div className="absolute top-2 left-3 p-1 text-sm bg-gray-900/50 text-white rounded-md">
        GPS: 12.97° N, 77.59° E
      </div>
    </div>
  );
};

export default FishingZoneMap;
