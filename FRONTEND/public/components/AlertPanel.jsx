import React from 'react';

/**
 * AlertPanel Component: Displays a critical, attention-grabbing storm alert.
 * @param {boolean} isCritical - If true, displays the severe alert overlay.
 * @param {object} alertData - Storm details like wind speed and ETA.
 */
const AlertPanel = ({ isCritical = false, alertData = { winds: '35 kts', waves: '3.5m', eta: '45 min' } }) => {
  if (!isCritical) return null;

  return (
    <div className="absolute inset-0 bg-red-800/95 z-50 flex flex-col items-center justify-center p-8 rounded-xl shadow-2xl animate-pulse">
      <div className="text-9xl mb-4">⚡</div>
      <h2 className="text-3xl font-extrabold text-white uppercase tracking-widest">
        CRITICAL WEATHER WARNING
      </h2>
      <p className="text-xl text-yellow-300 mt-2">RETURN TO SHORE NOW!</p>
      
      <div className="mt-6 text-white text-center space-y-2">
        <p className="text-lg">Winds: <span className="font-bold">{alertData.winds} (High Risk)</span></p>
        <p className="text-lg">Waves: <span className="font-bold">{alertData.waves} (Dangerous)</span></p>
        <p className="text-lg">Storm ETA: <span className="font-bold">{alertData.eta}</span></p>
      </div>

      <button className="mt-8 px-6 py-3 bg-white text-red-800 font-bold rounded-full shadow-lg hover:bg-gray-200">
        Navigate to Nearest Safe Harbor
      </button>
    </div>
  );
};

export default AlertPanel;
