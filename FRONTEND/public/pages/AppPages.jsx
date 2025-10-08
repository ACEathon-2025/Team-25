import React, { useState } from 'react';
// Assuming the utility components (Navbar, Footer, WeatherCard, etc.) 
// are defined within this single file, as required by the environment.

// --- UTILITY COMPONENTS (Placeholder - In a real app, these would be imported) ---

// Placeholder for content blocks used on multiple pages
const Card = ({ title, children, className = '' }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg ${className}`}>
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{title}</h2>
        {children}
    </div>
);

// Placeholder for Navbar - Simplified for this context
const Navbar = ({ currentPage, setPage }) => {
    const navItems = [
        { name: 'Home', component: 'Home' },
        { name: 'Alerts', component: 'Alerts' },
        { name: 'Analytics', component: 'Analytics' },
        { name: 'Community', component: 'Community' },
        { name: 'About', component: 'About' },
    ];
    return (
        <nav className="p-4 bg-gray-900 shadow-xl text-white">
            <div className="container mx-auto flex flex-wrap justify-between items-center">
                <h1 className="text-xl font-bold text-green-400">SmartFishing 🎣</h1>
                <div className="flex space-x-3 sm:space-x-6 overflow-x-auto py-1">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setPage(item.component)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                currentPage === item.component
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

// Placeholder for Footer
const Footer = () => (
    <footer className="w-full text-center p-3 mt-6 bg-gray-900 text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} SmartFishing | ACEathon 2025 Submission
    </footer>
);

// --- PAGE COMPONENTS ---

/**
 * Home Page: Main Dashboard combining Map, Weather, and Core Prediction (as defined in Dashboard.jsx previously).
 * This page uses the structure from the previous response.
 */
const HomePage = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card title="Predicted Fishing Zone (P-FZ) Map" className="h-64 bg-blue-700 text-white flex items-center justify-center">
                <p className="text-2xl font-bold">Map Placeholder (Optimal Zone Highlighted)</p>
            </Card>
            <Card title="Real-time Weather & Sensor Data" className="bg-blue-800 text-white">
                <p>Temp: 26°C, pH: 8.1, Current: Low. Forecast: Clear.</p>
            </Card>
            <Card title="SOS Emergency System">
                <button className="w-full py-3 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 transition">
                    ACTIVATE SOS SIGNAL
                </button>
            </Card>
        </div>
        <div className="space-y-6">
            <Card title="AI Economic Forecast">
                <p>Expected Catch: 140 kg | Fuel Cost Reduction: 18%</p>
            </Card>
            <Card title="Today's Parameters">
                <p>Water Clarity: 8/10 | Fish Activity Index: 95%</p>
            </Card>
        </div>
    </div>
);

/**
 * Alerts Page: Detailed view of historical and current safety alerts (Addresses Prototype 2).
 */
const AlertsPage = () => {
    const alerts = [
        { type: 'Critical Storm', date: 'Oct 3, 2025', status: 'Resolved', severity: 'High' },
        { type: 'High Current Warning', date: 'Yesterday', status: 'Active', severity: 'Medium' },
        { type: 'Equipment Failure (Self-Report)', date: 'Oct 1, 2025', status: 'Logged', severity: 'Low' },
    ];

    return (
        <div className="space-y-6">
            <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg font-semibold">
                ACTIVE ALERT: High Current Warning (Immediate area). Exercise caution.
            </div>
            <Card title="Alert History & Status">
                <ul className="space-y-3">
                    {alerts.map((alert, index) => (
                        <li key={index} className="flex justify-between items-center py-2 border-b">
                            <div>
                                <span className={`font-bold ${alert.severity === 'High' ? 'text-red-600' : 'text-orange-500'}`}>{alert.type}</span>
                                <p className="text-sm text-gray-500">Date: {alert.date}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                alert.status === 'Active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                                {alert.status}
                            </span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

/**
 * Analytics Page: Performance metrics and historical data (Addresses Prototype 4).
 */
const AnalyticsPage = () => (
    <div className="space-y-6">
        <Card title="Weekly Financial Summary" className="bg-green-50">
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-3xl font-extrabold text-green-600">₹34,500</p>
                    <p className="text-sm text-gray-500">Total Income (This Week)</p>
                </div>
                <div>
                    <p className="text-3xl font-extrabold text-blue-600">18%</p>
                    <p className="text-sm text-gray-500">Fuel Efficiency Gain (YTD)</p>
                </div>
            </div>
        </Card>
        <Card title="Catch Data Over Time">
            <p className="text-gray-500">Placeholder for Recharts/D3 graph showing catch volume vs. water parameters.</p>
        </Card>
        <Card title="Route Optimization Metrics">
            <p className="text-gray-500">Detailed logs on routes taken, time spent, and estimated cost savings per trip.</p>
        </Card>
    </div>
);

/**
 * Community Page: Allows fishermen to share data/sightings (Addresses Impact Boost feature).
 */
const CommunityPage = () => {
    const communityReports = [
        { user: 'UserID: 3a2c...', type: 'Large Debris (Net Hazard)', location: 'Sector 5', date: '2 min ago', color: 'bg-red-500' },
        { user: 'UserID: 9f1e...', type: 'School of Fish Sighting', location: 'Near P-FZ', date: '1 hr ago', color: 'bg-green-500' },
        { user: 'UserID: d7b8...', type: 'Unusual Current', location: 'West Zone', date: '3 hrs ago', color: 'bg-yellow-500' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card title="Community Shared Map (Crowdsourced Safety)">
                    <p className="h-64 bg-gray-200 flex items-center justify-center">Map Placeholder showing user-submitted pins.</p>
                </Card>
                <Card title="Recent Community Reports" className="mt-6">
                    <ul className="space-y-3">
                        {communityReports.map((report, index) => (
                            <li key={index} className="flex justify-between items-center py-2 border-b">
                                <div>
                                    <span className={`font-bold text-white p-1 rounded-md ${report.color}`}>{report.type}</span>
                                    <p className="text-sm text-gray-500">Reported by {report.user} - {report.date}</p>
                                </div>
                                <span className="text-sm text-blue-600 font-semibold">View Location</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <Card title="Submit New Sighting">
                    <form className="space-y-4">
                        <input type="text" placeholder="Sighting Type (e.g., Debris, Net, Fish School)" className="w-full p-2 border rounded-lg" />
                        <select className="w-full p-2 border rounded-lg">
                            <option>Select Location (Current GPS)</option>
                            <option>Mark Unsafe Zone</option>
                            <option>Mark Fish Hotspot</option>
                        </select>
                        <textarea placeholder="Details..." rows="3" className="w-full p-2 border rounded-lg"></textarea>
                        <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                            Submit Report
                        </button>
                    </form>
                </Card>
            </div>
        </div>
    );
};


/**
 * About Page: General information about the project (Standard page for context).
 */
const AboutPage = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
        <Card title="SmartFishing: Project Overview">
            <p className="mb-4 text-gray-700">
                SmartFishing is an **IoT and AI-driven system** designed to enhance the safety, sustainability, and profitability of local fishermen. Built for the ACEathon 2025 Online Phase, our solution focuses on providing affordable, real-time decision support.
            </p>
            <h3 className="text-lg font-bold mt-4">Key Innovation: Predictive Fishing Zone (P-FZ)</h3>
            <p className="text-gray-600">
                Our core AI model analyzes real-time sensor data (Temp, pH, Current) and historical weather patterns to map the optimal fishing coordinates, minimizing fuel waste and maximizing catch probability.
            </p>
            <h3 className="text-lg font-bold mt-4">Team & Tech</h3>
            <p className="text-gray-600">
                Team Name: AquaTech | Hardware: ESP32/Arduino, GPS/pH/Temp Sensors | Software: Python, React, Firebase (Mock).
            </p>
        </Card>
    </div>
);

// --- MAIN APPLICATION ROUTER ---

/**
 * App (Router): Main component to manage page state and routing.
 */
export default function App() {
    const [currentPage, setCurrentPage] = useState('Home');

    const renderPage = () => {
        switch (currentPage) {
            case 'Home':
                return <HomePage />;
            case 'Alerts':
                return <AlertsPage />;
            case 'Analytics':
                return <AnalyticsPage />;
            case 'Community':
                return <CommunityPage />;
            case 'About':
                return <AboutPage />;
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <Navbar currentPage={currentPage} setPage={setCurrentPage} />
            
            <main className="container mx-auto p-4 flex-grow">
                {renderPage()}
            </main>
            
            <Footer />
        </div>
    );
}
