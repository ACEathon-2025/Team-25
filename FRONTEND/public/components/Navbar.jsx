import React from 'react';

/**
 * Navbar Component: Displays app title and current user status.
 * @param {string} userId - The user's unique ID for display.
 */
const Navbar = ({ userId }) => {
  // Truncate userId for cleaner display, but still show enough for identification
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

// Placeholder for export in a multi-file setup
export default Navbar;
