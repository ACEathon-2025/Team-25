// frontend/src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

// CSS Styles
const styles = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Montserrat', 'Open Sans', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
               'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #0077b6 0%, #03045e 100%);
  color: #333;
  min-height: 100vh;
  padding: 20px;
}

.app {
  max-width: 400px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  overflow: hidden;
  min-height: 90vh;
}

/* Header */
.header {
  background: linear-gradient(135deg, #0077b6 0%, #03045e 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
}

.header p {
  font-size: 14px;
  opacity: 0.9;
}

/* Weather Card */
.weather-card {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.weather-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.temperature {
  font-size: 48px;
  font-weight: 700;
  color: #0077b6;
}

.weather-info {
  text-align: right;
}

.weather-condition {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.weather-details {
  font-size: 14px;
  color: #666;
}

.weather-forecast {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.forecast-day {
  text-align: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 10px;
}

/* Fishing Zones */
.zones-card {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.zones-card h3 {
  margin-bottom: 15px;
  color: #0077b6;
  display: flex;
  align-items: center;
  gap: 10px;
}

.zone-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin: 8px 0;
  border-radius: 10px;
  background: #f8f9fa;
}

.zone-high {
  background: #d4edda;
  border-left: 4px solid #28a745;
}

.zone-medium {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.zone-low {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.zone-probability {
  font-weight: 700;
  font-size: 16px;
}

/* SOS Button */
.sos-section {
  padding: 20px;
  text-align: center;
}

.sos-button {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 20px 40px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
  transition: all 0.3s ease;
  width: 100%;
  margin: 10px 0;
}

.sos-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(220, 53, 69, 0.6);
}

.sos-button:active {
  transform: translateY(0);
}

.safety-note {
  font-size: 12px;
  color: #666;
  margin-top: 10px;
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-in-out;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  body {
    padding: 10px;
  }
  
  .app {
    max-width: 100%;
    min-height: 95vh;
  }
}
`;

// Main App Component
const SmartFishingApp = () => {
  const handleSOS = () => {
    alert('🚨 Emergency alert sent! Authorities have been notified with your location.\n\nCoast Guard: Notified\nNearby Boats: Alerted\nFamily: Informed');
  };

  const handleZoneNavigate = (zone) => {
    alert(`🎣 Navigating to ${zone.name}\nDistance: ${zone.distance}\nEstimated catch: ${zone.catch}`);
  };

  // Sample data
  const weatherData = {
    current: { temp: 23, condition: 'Rain', humidity: '85%', wind: '12 km/h' },
    forecast: [
      { day: 'Tue', temp: 25 },
      { day: 'Wed', temp: 24 },
      { day: 'Thu', temp: 26 },
      { day: 'Fri', temp: 22 }
    ]
  };

  const fishingZones = [
    { id: 1, name: 'Zone A', probability: 92, distance: '3.2 km', catch: '120-150 kg', level: 'high' },
    { id: 2, name: 'Zone B', probability: 78, distance: '2.1 km', catch: '80-100 kg', level: 'medium' },
    { id: 3, name: 'Zone C', probability: 45, distance: '4.5 km', catch: '40-60 kg', level: 'low' }
  ];

  return (
    <div className="app fade-in">
      {/* Header */}
      <div className="header">
        <h1>SmartFishing 🎣</h1>
        <p>Safe, Smart & Sustainable Fishing</p>
      </div>

      {/* Weather Section */}
      <div className="weather-card">
        <div className="weather-current">
          <div className="temperature">{weatherData.current.temp}°</div>
          <div className="weather-info">
            <div className="weather-condition">{weatherData.current.condition}</div>
            <div className="weather-details">
              Humidity: {weatherData.current.humidity} • Wind: {weatherData.current.wind}
            </div>
          </div>
        </div>
        <div className="weather-forecast">
          {weatherData.forecast.map((day, index) => (
            <div key={index} className="forecast-day">
              <div>{day.day}</div>
              <div style={{ fontWeight: '700', color: '#0077b6' }}>{day.temp}°</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fishing Zones */}
      <div className="zones-card">
        <h3>🤖 AI FISHING ZONES</h3>
        {fishingZones.map(zone => (
          <div 
            key={zone.id} 
            className={`zone-item zone-${zone.level}`}
            onClick={() => handleZoneNavigate(zone)}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <strong>{zone.name}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {zone.distance} • {zone.catch}
              </div>
            </div>
            <div className="zone-probability">{zone.probability}%</div>
          </div>
        ))}
      </div>

      {/* SOS Button */}
      <div className="sos-section">
        <button className="sos-button pulse" onClick={handleSOS}>
          🚨 EMERGENCY SOS
        </button>
        <div className="safety-note">
          Hold for 3 seconds in real emergency
        </div>
      </div>
    </div>
  );
};

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SmartFishingApp />);
