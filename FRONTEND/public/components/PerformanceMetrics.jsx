import React from 'react';

/**
 * PerformanceMetrics Component: Displays fishing performance analytics and financial summary.
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
            <span className="w-1/4 text-right">{data.success ? 'Success' : 'Danger'}</span>
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

export default PerformanceMetrics;
