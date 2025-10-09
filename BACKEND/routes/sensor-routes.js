const express = require('express');
const router = express.Router();
const { errorHandler } = require('../utils/error-handler');
const { validators } = require('../utils/validators');
const { helpers } = require('../utils/helpers');

// Mock database (replace with actual MongoDB models)
let sensorData = [];

// POST /api/sensors/data - Receive sensor data from IoT devices
router.post('/data', errorHandler.catchAsync(async (req, res) => {
    const rawData = req.body;
    
    // Validate sensor data
    const validation = validators.validateSensorData(rawData);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            errors: validation.errors
        });
    }
    
    // Format and store data
    const formattedData = helpers.formatSensorData(rawData);
    formattedData.id = helpers.generateAlertId();
    formattedData.receivedAt = new Date().toISOString();
    
    sensorData.push(formattedData);
    
    // Check for anomalies (simplified)
    const anomalies = checkForAnomalies(formattedData);
    
    res.status(201).json({
        success: true,
        message: 'Sensor data received successfully',
        data: formattedData,
        anomalies: anomalies
    });
}));

// GET /api/sensors/data - Get all sensor data (with filtering)
router.get('/data', errorHandler.catchAsync(async (req, res) => {
    const { deviceId, startDate, endDate, limit = 100 } = req.query;
    
    let filteredData = [...sensorData];
    
    // Filter by device ID
    if (deviceId) {
        filteredData = filteredData.filter(data => data.deviceId === deviceId);
    }
    
    // Filter by date range
    if (startDate) {
        filteredData = filteredData.filter(data => new Date(data.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
        filteredData = filteredData.filter(data => new Date(data.timestamp) <= new Date(endDate));
    }
    
    // Apply limit
    filteredData = filteredData.slice(-limit);
    
    res.json({
        success: true,
        count: filteredData.length,
        data: filteredData.reverse() // Latest first
    });
}));

// GET /api/sensors/data/latest - Get latest sensor readings
router.get('/data/latest', errorHandler.catchAsync(async (req, res) => {
    const { deviceId } = req.query;
    
    let latestData;
    if (deviceId) {
        const deviceData = sensorData.filter(data => data.deviceId === deviceId);
        latestData = deviceData[deviceData.length - 1];
    } else {
        latestData = sensorData[sensorData.length - 1];
    }
    
    if (!latestData) {
        return res.status(404).json({
            success: false,
            error: 'No sensor data found'
        });
    }
    
    res.json({
        success: true,
        data: latestData
    });
}));

// GET /api/sensors/devices - Get all registered devices
router.get('/devices', errorHandler.catchAsync(async (req, res) => {
    const devices = [...new Set(sensorData.map(data => data.deviceId))];
    
    const deviceStats = devices.map(deviceId => {
        const deviceData = sensorData.filter(data => data.deviceId === deviceId);
        const latest = deviceData[deviceData.length - 1];
        
        return {
            deviceId,
            lastSeen: latest?.timestamp,
            totalReadings: deviceData.length,
            currentStatus: latest ? 'online' : 'offline'
        };
    });
    
    res.json({
        success: true,
        devices: deviceStats
    });
}));

// Helper function to check for data anomalies
function checkForAnomalies(data) {
    const anomalies = [];
    
    // Temperature anomalies
    if (data.temperature > 35) {
        anomalies.push({
            type: 'HIGH_TEMPERATURE',
            message: 'Water temperature is unusually high',
            severity: 'warning'
        });
    }
    
    if (data.temperature < 10) {
        anomalies.push({
            type: 'LOW_TEMPERATURE',
            message: 'Water temperature is unusually low',
            severity: 'warning'
        });
    }
    
    // pH anomalies
    if (data.pH < 6.5 || data.pH > 8.5) {
        anomalies.push({
            type: 'UNSAFE_PH',
            message: 'pH level is outside safe range for fishing',
            severity: 'danger'
        });
    }
    
    // Oxygen level anomalies
    if (data.oxygen < 5) {
        anomalies.push({
            type: 'LOW_OXYGEN',
            message: 'Oxygen level is critically low',
            severity: 'danger'
        });
    }
    
    return anomalies;
}

module.exports = router;
