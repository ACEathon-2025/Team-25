import React from 'react';

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

export default Footer;
