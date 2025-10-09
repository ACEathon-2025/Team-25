const express = require('express');
const router = express.Router();
const { errorHandler } = require('../utils/error-handler');
const { validators } = require('../utils/validators');
const { geolocation } = require('../utils/geolocation');

// Mock database for fishing zones and predictions
let fishingZones = [
    {
        id: 'zone_001',
        name: 'North Fishing Ground',
        center: { lat: 19.0760, lng: 72.8777 },
        radius: 5, // km
        confidence: 0.85,
        fishDensity: 'high',
        recommended: true,
        weatherConditions: 'calm',
        waterTemperature: 28.5,
        createdAt: new Date().toISOString()
    }
];

let predictionHistory = [];

// GET /api/zones/predict - Get predicted fishing zones
router.get('/predict', errorHandler.catchAsync(async (req, res) => {
    const { lat, lng, radius = 50 } = req.query; // radius in km
    
    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            error: 'Latitude and longitude are required'
        });
    }
    
    const userLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
    };
    
    // Validate coordinates
    if (!validators.validateCoordinates(userLocation.lat, userLocation.lng)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid coordinates provided'
        });
    }
    
    // Simulate AI prediction (replace with actual ML model)
    const predictedZones = await predictFishingZones(userLocation, parseFloat(radius));
    
    // Log prediction for model improvement
    predictionHistory.push({
        location: userLocation,
        timestamp: new Date().toISOString(),
        zonesFound: predictedZones.length
    });
    
    res.json({
        success: true,
        userLocation: userLocation,
        searchRadius: radius,
        zones: predictedZones,
        recommendations: generateRecommendations(predictedZones)
    });
}));

// GET /api/zones/safe - Get safe fishing zones
router.get('/safe', errorHandler.catchAsync(async (req, res) => {
    const { lat, lng } = req.query;
    
    let safeZones = [...fishingZones].filter(zone => zone.recommended === true);
    
    // If user location provided, calculate distances
    if (lat && lng) {
        const userLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
        
        safeZones = safeZones.map(zone => {
            const distance = geolocation.calculateDistance(
                userLocation.lat, userLocation.lng,
                zone.center.lat, zone.center.lng
            );
            
            return {
                ...zone,
                distanceFromUser: parseFloat(distance.toFixed(2)),
                bearing: geolocation.calculateBearing(
                    userLocation.lat, userLocation.lng,
                    zone.center.lat, zone.center.lng
                )
            };
        });
        
        // Sort by distance
        safeZones.sort((a, b) => a.distanceFromUser - b.distanceFromUser);
    }
    
    res.json({
        success: true,
        count: safeZones.length,
        zones: safeZones
    });
}));

// POST /api/zones/report - Report new fishing zone or hazard
router.post('/report', errorHandler.catchAsync(async (req, res) => {
    const { type, location, description, evidence, reporterId } = req.body;
    
    if (!type || !location) {
        return res.status(400).json({
            success: false,
            error: 'Type and location are required'
        });
    }
    
    const report = {
        id: 'report_' + Date.now(),
        type: type, // good_fishing, hazard, weather_update
        location: location,
        description: description,
        evidence: evidence, // photos, videos
        reporterId: reporterId,
        timestamp: new Date().toISOString(),
        status: 'pending_review',
        verified: false
    };
    
    // If it's a good fishing zone report, add to zones after validation
    if (type === 'good_fishing') {
        const newZone = {
            id: 'zone_' + Date.now(),
            name: `Reported Zone ${fishingZones.length + 1}`,
            center: location,
            radius: 3,
            confidence: 0.7, // Lower confidence for user-reported zones
            fishDensity: 'medium',
            recommended: true,
            userReported: true,
            reportId: report.id,
            createdAt: new Date().toISOString()
        };
        
        fishingZones.push(newZone);
        report.status = 'added_to_zones';
    }
    
    res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        report: report,
        zoneAdded: type === 'good_fishing'
    });
}));

// GET /api/zones/weather - Get weather conditions for zones
router.get('/weather', errorHandler.catchAsync(async (req, res) => {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            error: 'Latitude and longitude are required'
        });
    }
    
    // Simulate weather data (replace with actual weather API)
    const weatherData = {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        temperature: 28.5,
        humidity: 75,
        windSpeed: 12,
        windDirection: 'NE',
        weatherCondition: 'partly_cloudy',
        precipitation: 10, // percentage
        waveHeight: 1.2, // meters
        visibility: 8, // km
        lastUpdated: new Date().toISOString()
    };
    
    // Add safety recommendations based on weather
    weatherData.safetyLevel = calculateSafetyLevel(weatherData);
    weatherData.recommendations = generateWeatherRecommendations(weatherData);
    
    res.json({
        success: true,
        weather: weatherData
    });
}));

// Helper function to predict fishing zones (simulated AI)
async function predictFishingZones(userLocation, radius) {
    // This would be replaced with actual ML model inference
    // For now, we simulate based on some logic
    
    const simulatedZones = [];
    const zoneCount = Math.floor(Math.random() * 3) + 2; // 2-4 zones
    
    for (let i = 0; i < zoneCount; i++) {
        // Generate random zones within radius
        const angle = (i * 2 * Math.PI) / zoneCount;
        const distance = (Math.random() * radius * 0.8) + (radius * 0.2);
        
        const zoneLat = userLocation.lat + (distance / 111) * Math.cos(angle);
        const zoneLng = userLocation.lng + (distance / (111 * Math.cos(userLocation.lat * Math.PI / 180))) * Math.sin(angle);
        
        const confidence = 0.6 + (Math.random() * 0.3); // 0.6-0.9
        const fishDensity = confidence > 0.8 ? 'high' : confidence > 0.7 ? 'medium' : 'low';
        
        simulatedZones.push({
            id: `pred_${Date.now()}_${i}`,
            center: { lat: parseFloat(zoneLat.toFixed(6)), lng: parseFloat(zoneLng.toFixed(6)) },
            radius: 2 + (Math.random() * 3), // 2-5 km
            confidence: parseFloat(confidence.toFixed(2)),
            fishDensity: fishDensity,
            distanceFromUser: parseFloat(distance.toFixed(2)),
            estimatedCatch: Math.floor(confidence * 100),
            recommended: confidence > 0.7
        });
    }
    
    // Sort by confidence
    return simulatedZones.sort((a, b) => b.confidence - a.confidence);
}

// Helper function to generate recommendations
function generateRecommendations(zones) {
    const highConfidenceZones = zones.filter(zone => zone.confidence > 0.8);
    
    if (highConfidenceZones.length > 0) {
        return {
            fishing: 'excellent',
            message: 'Great fishing conditions detected!',
            bestZones: highConfidenceZones.slice(0, 2)
        };
    }
    
    const mediumZones = zones.filter(zone => zone.confidence > 0.6);
    if (mediumZones.length > 0) {
        return {
            fishing: 'good',
            message: 'Good fishing opportunities available',
            bestZones: mediumZones.slice(0, 2)
        };
    }
    
    return {
        fishing: 'poor',
        message: 'Limited fishing opportunities. Consider waiting for better conditions.',
        bestZones: []
    };
}

// Helper function to calculate safety level
function calculateSafetyLevel(weather) {
    if (weather.waveHeight > 3 || weather.windSpeed > 25 || weather.visibility < 2) {
        return 'danger';
    } else if (weather.waveHeight > 1.5 || weather.windSpeed > 15 || weather.visibility < 5) {
        return 'warning';
    } else {
        return 'safe';
    }
}

// Helper function to generate weather recommendations
function generateWeatherRecommendations(weather) {
    const recommendations = [];
    
    if (weather.safetyLevel === 'danger') {
        recommendations.push('⚠️ Avoid fishing today - dangerous conditions');
    } else if (weather.safetyLevel === 'warning') {
        recommendations.push('⚠️ Exercise caution - check conditions frequently');
    } else {
        recommendations.push('✅ Safe conditions for fishing');
    }
    
    if (weather.windSpeed > 15) {
        recommendations.push('💨 High winds expected - secure your equipment');
    }
    
    if (weather.precipitation > 50) {
        recommendations.push('🌧️ Rain expected - wear appropriate gear');
    }
    
    if (weather.visibility < 5) {
        recommendations.push('🌫️ Low visibility - use navigation aids');
    }
    
    return recommendations;
}

module.exports = router;
