import React, { useState, useEffect } from 'react';

// --- UTILITY COMPONENTS (Defined within the single file) ---

/**
 * Navbar Component: Displays app title and user ID.
 */
const Navbar = ({ userId }) => {
  const displayId = userId ? `${userId.substring(0, 8)}...` : 'Anonymous';

  return (
    <div className="flex justify-between items-center p-4 bg-gray-900 shadow-lg text-white">
      <h1 className="text-xl font-bold tracking-wider">SmartFishing 🎣</h1>
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">User ID: {displayId}</span>
      </div>
    </div>
  );
};

/**
 * WeatherCard Component: Displays current and forecasted weather data.
 */
const WeatherCard = ({ currentWeather = { temp: '23°', status: 'Rain', icon: '☁️' } }) => {
  const mockForecast = [
    { day: 'Wed', temp: '24°', icon: '☁️' },
    { day: 'Thu', temp: '26°', icon: '⛈️' },
    { day: 'Fri', temp: '22°', icon: '🌧️' },
  ];

  return (
    <div className="bg-blue-800 p-6 rounded-xl shadow-2xl text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="text-6xl">{currentWeather.icon}</div>
        <div className="text-right">
          <div className="text-6xl font-extrabold">{currentWeather.temp}</div>
          <div className="text-xl text-gray-300">{currentWeather.status}</div>
        </div>
      </div>
      <div className="border-t border-blue-700 pt-4 mt-2">
        <h3 className="text-sm uppercase tracking-wider mb-2 text-gray-300">3-Day Forecast</h3>
        <div className="flex justify-between">
          {mockForecast.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-semibold">{item.day}</div>
              <div className="text-2xl my-1">{item.icon}</div>
              <div className="text-lg font-medium">{item.temp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * AlertPanel Component: Displays a critical, attention-grabbing storm alert (Prototype 2).
 */
const AlertPanel = ({ isCritical = false, alertData = { winds: '35 kts', waves: '3.5m', eta: '45 min' } }) => {
  if (!isCritical) return null;

  return (
    <div className="absolute inset-0 bg-red-800/95 z-50 flex flex-col items-center justify-center p-8 rounded-xl shadow-2xl animate-pulse">
      <div className="text-9xl mb-4">⚡</div>
      <h2 className="text-3xl font-extrabold text-white uppercase tracking-widest text-center">
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


/**
 * FishingZoneMap Component: Mocks a map view showing the Predicted Fishing Zone (P-FZ).
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

/**
 * ParameterCard Component: Displays detailed P-FZ prediction factors (Prototype 3).
 */
const ParameterCard = () => {
  const parameters = [
    { label: 'Water Temp', value: 'Ideal (26°C)', status: 'Success', color: 'text-green-500' },
    { label: 'Oxygen Level', value: 'High', status: 'Success', color: 'text-green-500' },
    { label: 'Fish Activity', value: 'Very High', status: 'High', color: 'text-yellow-500' },
    { label: 'Distance from Shore', value: '3.2 km', status: 'N/A', color: 'text-gray-400' },
  ];
  
  const financial = {
    fuelCost: '₹280 (Estimated)',
    expectedCatch: '120-150 kg',
    bestTime: '6:00 AM - 11:00 AM'
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl space-y-4">
      <h2 className="text-xl font-bold text-gray-800">AI Prediction Details</h2>
      <div className="space-y-3">
        {parameters.map((p, index) => (
          <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-600 font-medium">{p.label}:</span>
            <span className={`font-semibold ${p.color}`}>{p.value}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 space-y-2">
        <h3 className="text-lg font-bold text-blue-600">Economic Forecast</h3>
        <p className="text-sm text-gray-700">Fuel Cost: <span className="font-semibold">{financial.fuelCost}</span></p>
        <p className="text-sm text-gray-700">Expected Catch: <span className="font-semibold">{financial.expectedCatch}</span></p>
        <p className="text-sm text-gray-700">Best Time: <span className="font-semibold text-green-600">{financial.bestTime}</span></p>
      </div>
    </div>
  );
};

/**
 * PerformanceMetrics Component: Displays fishing performance analytics (Prototype 4).
 */
const PerformanceMetrics = () => {
  const weeklySummary = [
    { day: 'Mon', catch: 85, income: 8500, success: true },
    { day: 'Tue', catch: 92, income: 9200, success: true },
    { day: 'Wed', catch: 28, income: 2800, success: false }, // Low yield
    { day: 'Thu', catch: 95, income: 9500, success: true },
    { day: 'Fri', catch: 45, income: 4500, success: false }, // Lower yield
  ];

  const analytics = {
    thisWeekIncome: 34500,
    lastWeekIncome: 28900,
    fuelEfficiencyGain: 18,
    totalCatch: 345,
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-4 border-b pb-2">Fishing Performance Dashboard</h2>
      
      <h3 className="text-lg font-bold text-gray-700 mb-2">WEEKLY SUMMARY:</h3>
      <div className="space-y-2">
        {weeklySummary.map((data, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className={`w-1/4 font-semibold ${data.success ? 'text-green-600' : 'text-red-600'}`}>{data.day}</span>
            <span className="w-1/4 text-gray-700">{data.catch} kg</span>
            <span className="w-1/4 text-gray-700">₹{data.income.toLocaleString()}</span>
            <span className="w-1/4 text-right">{data.success ? 'Success' : 'Low Yield'}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
        <h3 className="text-xl font-bold text-blue-600">FINANCIAL ANALYTICS:</h3>
        
        <p className="text-lg font-medium text-gray-700">This Week: <span className="font-bold text-green-600">₹{analytics.thisWeekIncome.toLocaleString()}</span></p>
        <p className="text-sm text-gray-500">Last Week: ₹{analytics.lastWeekIncome.toLocaleString()}</p>

        <div className="text-2xl font-bold mt-4">
          Fuel Efficiency: 
          <span className="text-green-600 ml-2">{analytics.fuelEfficiencyGain}% Gain</span>
        </div>
        
        <p className="text-sm text-gray-700">Total Catch (Week): {analytics.totalCatch} kg</p>
      </div>
    </div>
  );
};

/**
 * SOSButton Component: Handles the emergency signal logic.
 */
const SOSButton = ({ onSosActivate }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null);

  const handleClick = () => {
    if (isSending) return;

    if (isConfirming) {
      // Step 2: Confirmation received, trigger SOS
      setIsSending(true);
      setStatus('Sending signal...');
      
      // Mock API call delay
      setTimeout(() => {
        onSosActivate(); // Execute parent logic (e.g., Firebase write)
        setIsSending(false);
        setIsConfirming(false);
        setStatus('SOS SENT! Help is on the way.');
        // Clear status after 5 seconds
        setTimeout(() => setStatus(null), 5000); 
      }, 1500);
    } else {
      // Step 1: Initial click, ask for confirmation
      setIsConfirming(true);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setStatus(null);
  };

  const buttonText = isSending 
    ? 'Sending...' 
    : isConfirming 
      ? 'CONFIRM SOS' 
      : 'SOS';

  return (
    <div className="p-4 rounded-xl">
      {status && (
        <div className={`mb-3 p-3 text-center rounded-lg font-bold text-white ${status.includes('SENT') ? 'bg-green-600' : 'bg-yellow-600'}`}>
          {status}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={isSending}
        className={`w-full py-4 text-3xl font-extrabold text-white rounded-2xl transition-all duration-300 shadow-xl 
          ${isConfirming ? 'bg-red-700 animate-pulse' : 'bg-red-600 hover:bg-red-700'}
          ${isSending ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {buttonText}
      </button>

      {isConfirming && (
        <button 
          onClick={handleCancel}
          className="w-full mt-2 py-2 text-md text-gray-400 hover:text-gray-200 transition duration-150"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

/**
 * Footer Component: Displays copyright and branding information.
 */
const Footer = () => {
  return (
    <footer className="w-full text-center p-3 mt-6 bg-gray-900 text-gray-500 text-xs">
      &copy; {new Date().getFullYear()} SmartFishing | ACEathon 2025 Submission
    </footer>
  );
};

// --- MAIN APPLICATION COMPONENT ---

/**
 * App Component (formerly Dashboard): The main container assembling all UI elements.
 * NOTE: Changed name to 'App' for required single-file export structure.
 */
const App = () => {
  // Mock state for demonstrating critical alert functionality
  const [isStormCritical, setIsStormCritical] = useState(false);
  // Mock User ID (for display purposes only, real auth would be used)
  const [userId] = useState('tjklslive-12345'); 

  // Function to handle the SOS activation (mock Firebase/API write)
  const handleSosActivation = () => {
    console.log("SOS Signal Activated. Writing emergency status to Firebase...");
    // In a real app, this would write the user's GPS and emergency status
    // to a Firebase/API endpoint for search and rescue monitoring.
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <Navbar userId={userId} />
      
      {/* Main Content Grid */}
      <div className="container mx-auto p-4 flex-grow">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Map and Safety */}
          <div className="lg:col-span-2 space-y-6 relative">
            
            {/* Critical Alert Overlay (Prototype 2) */}
            <AlertPanel isCritical={isStormCritical} />
            
            {/* Map and Weather (Prototype 1) */}
            <FishingZoneMap zoneStatus={'OPTIMAL'} />
            <WeatherCard />

            {/* SOS Button (Always visible) */}
            <SOSButton onSosActivate={handleSosActivation} />

            {/* Simple Button to Toggle Alert State for Demo */}
            <button
              onClick={() => setIsStormCritical(!isStormCritical)}
              className="w-full py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
            >
              {isStormCritical ? 'Dismiss Storm Alert' : 'Trigger Mock Storm Alert (Demo)'}
            </button>
          </div>
          
          {/* Column 2: Details and Analytics */}
          <div className="space-y-6">
            <ParameterCard /> {/* AI Details (Prototype 3) */}
            <PerformanceMetrics /> {/* Analytics (Prototype 4) */}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default App;
export default App;
