import React, { useState } from 'react';

/**
 * SOSButton Component: Handles the emergency signal logic.
 * @param {function} onSosActivate - Callback function when SOS is triggered.
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

export default SOSButton;
