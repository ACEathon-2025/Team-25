const validators = {
    // Validate sensor data
    validateSensorData: (data) => {
        const errors = [];
        
        if (!data.temperature || data.temperature < -10 || data.temperature > 50) {
            errors.push('Temperature must be between -10°C and 50°C');
        }
        
        if (!data.pH || data.pH < 0 || data.pH > 14) {
            errors.push('pH must be between 0 and 14');
        }
        
        if (!data.oxygen || data.oxygen < 0 || data.oxygen > 20) {
            errors.push('Oxygen level must be between 0 and 20 mg/L');
        }
        
        if (!data.location || !data.location.lat || !data.location.lng) {
            errors.push('Valid location coordinates are required');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // Validate coordinates
    validateCoordinates: (lat, lng) => {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    },

    // Validate phone number for SMS alerts
    validatePhoneNumber: (phone) => {
        const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers
        return phoneRegex.test(phone.replace(/\D/g, ''));
    },

    // Validate emergency alert data
    validateEmergencyAlert: (alertData) => {
        const errors = [];
        
        if (!alertData.userId) errors.push('User ID is required');
        if (!alertData.location) errors.push('Location is required');
        if (!alertData.alertType) errors.push('Alert type is required');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // Validate fishing zone prediction input
    validatePredictionInput: (inputData) => {
        const errors = [];
        
        if (!inputData.weatherConditions) errors.push('Weather conditions required');
        if (!inputData.waterTemperature) errors.push('Water temperature required');
        if (!inputData.location) errors.push('Location data required');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

module.exports = validators;
