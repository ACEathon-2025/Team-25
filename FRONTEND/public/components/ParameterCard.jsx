import React from 'react';

/**
 * ParameterCard Component: Displays detailed P-FZ prediction factors.
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

export default ParameterCard;
