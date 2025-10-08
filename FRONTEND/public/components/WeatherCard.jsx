import React from 'react';

// Mock data structure matching prototype1.jpg
const mockForecast = [
  { day: 'Wed', temp: '24°', icon: '☁️' },
  { day: 'Thu', temp: '26°', icon: '⛈️' },
  { day: 'Fri', temp: '22°', icon: '🌧️' },
];

/**
 * WeatherCard Component: Displays current and forecasted weather data.
 * @param {object} currentWeather - Current weather conditions.
 */
const WeatherCard = ({ currentWeather = { temp: '23°', status: 'Rain', icon: '☁️' } }) => {
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

export default WeatherCard;
