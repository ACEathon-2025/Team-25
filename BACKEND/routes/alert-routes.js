const express = require('express');
const router = express.Router();
const { errorHandler } = require('../utils/error-handler');
const { validators } = require('../utils/validators');
const { helpers } = require('../utils/helpers');

// Mock database
let alerts = [];
let users = [
    {
        id: 'user_001',
        name: 'Fisherman Raj',
        phone: '+919876543210',
        location: { lat: 19.0760, lng: 72.8777 },
        language: 'en'
    }
];

// POST /api/alerts/emergency - Trigger emergency/SOS alert
router.post('/emergency', errorHandler.catchAsync(async (req, res) => {
    const alertData = req.body;
    
    // Validate emergency alert
    const validation = validators.validateEmergencyAlert(alertData);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            errors: validation.errors
        });
    }
    
    // Create emergency alert
    const emergencyAlert = {
        id: helpers.generateAlertId(),
        type: 'SOS_EMERGENCY',
        userId: alertData.userId,
        location: alertData.location,
        timestamp: new Date().toISOString(),
        status: 'active',
        priority: 'critical',
        message: alertData.message || 'Emergency assistance required!'
    };
    
    alerts.push(emergencyAlert);
    
    // Notify emergency contacts (simulated)
    await notifyEmergencyContacts(emergencyAlert);
    
    res.status(201).json({
        success: true,
        message: 'Emergency alert activated. Help is on the way!',
        alert: emergencyAlert
    });
}));

// GET /api/alerts - Get all alerts (with filtering)
router.get('/', errorHandler.catchAsync(async (req, res) => {
    const { type, status, priority, startDate, endDate } = req.query;
    
    let filteredAlerts = [...alerts];
    
    // Apply filters
    if (type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    if (status) {
        filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }
    
    if (priority) {
        filteredAlerts = filteredAlerts.filter(alert => alert.priority === priority);
    }
    
    if (startDate) {
        filteredAlerts = filteredAlerts.filter(alert => 
            new Date(alert.timestamp) >= new Date(startDate)
        );
    }
    
    if (endDate) {
        filteredAlerts = filteredAlerts.filter(alert => 
            new Date(alert.timestamp) <= new Date(endDate)
        );
    }
    
    res.json({
        success: true,
        count: filteredAlerts.length,
        alerts: filteredAlerts.reverse() // Latest first
    });
}));

// GET /api/alerts/active - Get active alerts
router.get('/active', errorHandler.catchAsync(async (req, res) => {
    const activeAlerts = alerts.filter(alert => alert.status === 'active');
    
    res.json({
        success: true,
        count: activeAlerts.length,
        alerts: activeAlerts
    });
}));

// PUT /api/alerts/:alertId/status - Update alert status
router.put('/:alertId/status', errorHandler.catchAsync(async (req, res) => {
    const { alertId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['active', 'resolved', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid status. Must be: active, resolved, or cancelled'
        });
    }
    
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Alert not found'
        });
    }
    
    alerts[alertIndex].status = status;
    alerts[alertIndex].resolvedAt = status === 'resolved' ? new Date().toISOString() : undefined;
    
    res.json({
        success: true,
        message: `Alert ${status} successfully`,
        alert: alerts[alertIndex]
    });
}));

// POST /api/alerts/weather - Create weather alert
router.post('/weather', errorHandler.catchAsync(async (req, res) => {
    const { location, weatherType, severity, message } = req.body;
    
    const weatherAlert = {
        id: helpers.generateAlertId(),
        type: 'WEATHER_ALERT',
        weatherType: weatherType, // storm, heavy_rain, etc.
        location: location,
        severity: severity, // low, medium, high
        message: message,
        timestamp: new Date().toISOString(),
        status: 'active',
        priority: severity === 'high' ? 'high' : 'medium'
    };
    
    alerts.push(weatherAlert);
    
    // Notify users in affected area (simulated)
    await notifyUsersInArea(location, weatherAlert);
    
    res.status(201).json({
        success: true,
        message: 'Weather alert created and notifications sent',
        alert: weatherAlert
    });
}));

// Helper function to notify emergency contacts
async function notifyEmergencyContacts(alert) {
    console.log(`🚨 EMERGENCY ALERT: ${alert.message}`);
    console.log(`📍 Location: ${JSON.stringify(alert.location)}`);
    console.log(`📞 Notifying emergency contacts...`);
    
    // In real implementation, this would:
    // 1. Send SMS to coast guard/emergency services
    // 2. Notify nearby fishermen
    // 3. Send push notifications to admin dashboard
    
    return true;
}

// Helper function to notify users in affected area
async function notifyUsersInArea(location, alert) {
    console.log(`🌧️ WEATHER ALERT: ${alert.message}`);
    console.log(`📍 Affected area: ${JSON.stringify(location)}`);
    console.log(`📱 Notifying users in area...`);
    
    // In real implementation, this would:
    // 1. Find all users within the affected area
    // 2. Send SMS alerts to their phones
    // 3. Send push notifications via app
    
    return true;
}

module.exports = router;
