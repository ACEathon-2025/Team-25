const helpers = {
    // Format sensor data to consistent structure
    formatSensorData: (rawData) => {
        return {
            temperature: parseFloat(rawData.temp) || 0,
            pH: parseFloat(rawData.ph) || 7.0,
            oxygen: parseFloat(rawData.oxygen) || 0,
            timestamp: rawData.timestamp || new Date().toISOString(),
            location: {
                lat: parseFloat(rawData.lat),
                lng: parseFloat(rawData.lng)
            },
            deviceId: rawData.deviceId || 'unknown'
        };
    },

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    // Generate unique alert ID
    generateAlertId: () => {
        return 'ALT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Format date for display
    formatDate: (date) => {
        return new Date(date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    },

    // Check if data is within safe thresholds
    isWithinSafeRange: (value, min, max) => {
        return value >= min && value <= max;
    },

    // Debounce function for API calls
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

module.exports = helpers;
