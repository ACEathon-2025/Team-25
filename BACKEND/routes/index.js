const express = require('express');
const router = express.Router();

// Import all route modules
const sensorRoutes = require('./sensor-routes');
const alertRoutes = require('./alert-routes');
const zoneRoutes = require('./zone-routes');
const userRoutes = require('./user-routes');

// Use route modules
router.use('/sensors', sensorRoutes);
router.use('/alerts', alertRoutes);
router.use('/zones', zoneRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'SmartFishing API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to SmartFishing API',
        endpoints: {
            sensors: '/api/sensors',
            alerts: '/api/alerts',
            zones: '/api/zones',
            users: '/api/users'
        },
        documentation: 'https://github.com/your-repo/smartfishing/docs'
    });
});

module.exports = router;
