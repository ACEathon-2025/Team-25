const InferenceEngine = require('./inference-engine');
const axios = require('axios');

class ZonePredictor {
    constructor() {
        this.inferenceEngine = new InferenceEngine();
        this.predictionCache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    }

    // Main prediction function
    async predictFishingZones(userLocation, radiusKm = 20) {
        try {
            console.log(`🎯 Predicting fishing zones around ${userLocation.lat}, ${userLocation.lng}`);

            // Generate potential fishing spots around user location
            const potentialSpots = this.generatePotentialSpots(userLocation, radiusKm);
            
            // Get weather and ocean data for all spots
            const spotsWithData = await this.enrichSpotsWithData(potentialSpots);
            
            // Make predictions for each spot
            const predictions = await this.inferenceEngine.predictMultipleZones(spotsWithData);
            
            // Cache results
            this.cachePrediction(userLocation, predictions);
            
            // Filter and format results
            return this.formatPredictions(predictions);
        } catch (error) {
            console.error('❌ Zone prediction failed:', error);
            throw new Error(`Zone prediction failed: ${error.message}`);
        }
    }

    // Generate grid of potential fishing spots
    generatePotentialSpots(center, radiusKm, gridSize = 5) {
        const spots = [];
        const earthRadiusKm = 6371;
        const latDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI);
        const lngDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI) / Math.cos(center.lat * Math.PI / 180);

        for (let i = -gridSize; i <= gridSize; i++) {
            for (let j = -gridSize; j <= gridSize; j++) {
                const lat = center.lat + (i * latDelta) / gridSize;
                const lng = center.lng + (j * lngDelta) / gridSize;
                
                // Calculate distance from center
                const distance = this.calculateDistance(center.lat, center.lng, lat, lng);
                
                if (distance <= radiusKm) {
                    spots.push({
                        coordinates: { lat, lng },
                        distance: Math.round(distance * 10) / 10,
                        depth: this.estimateDepth(lat, lng) // Mock depth estimation
                    });
                }
            }
        }

        console.log(`📍 Generated ${spots.length} potential fishing spots`);
        return spots;
    }

    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Mock depth estimation (in real app, use bathymetry data)
    estimateDepth(lat, lng) {
        // Simple mock: deeper as we move away from shore coordinates
        const shoreLat = 19.0760; // Mumbai
        const shoreLng = 72.8777;
        const distanceFromShore = this.calculateDistance(lat, lng, shoreLat, shoreLng);
        
        return Math.min(100, Math.max(5, distanceFromShore * 2));
    }

    // Enrich spots with weather and ocean data
    async enrichSpotsWithData(spots) {
        const enrichedSpots = [];
        
        for (const spot of spots) {
            try {
                const weatherData = await this.fetchWeatherData(spot.coordinates);
                const oceanData = await this.fetchOceanData(spot.coordinates);
                
                enrichedSpots.push({
                    ...spot,
                    weather: weatherData,
                    ocean: oceanData
                });
            } catch (error) {
                console.error(`❌ Failed to fetch data for spot ${spot.coordinates}:`, error);
            }
        }

        return enrichedSpots;
    }

    // Mock weather data fetch (integrate with OpenWeatherMap API)
    async fetchWeatherData(coordinates) {
        // In real implementation, call OpenWeatherMap API
        return {
            temperature: 25 + (Math.random() * 10 - 5), // 20-30°C
            windSpeed: 5 + (Math.random() * 15), // 5-20 km/h
            waveHeight: 0.5 + (Math.random() * 2), // 0.5-2.5m
            humidity: 60 + (Math.random() * 30) // 60-90%
        };
    }

    // Mock ocean data fetch (integrate with marine API)
    async fetchOceanData(coordinates) {
        // In real implementation, call marine data API
        return {
            currentSpeed: 0.2 + (Math.random() * 1.5), // 0.2-1.7 m/s
            waterTemperature: 22 + (Math.random() * 10), // 22-32°C
            salinity: 33 + (Math.random() * 5), // 33-38 ppt
            tide: ['low', 'high', 'rising', 'falling'][Math.floor(Math.random() * 4)]
        };
    }

    // Format predictions for API response
    formatPredictions(predictions) {
        const recommendedZones = predictions.filter(p => p.prediction.recommended);
        
        return {
            timestamp: new Date().toISOString(),
            totalZonesAnalyzed: predictions.length,
            recommendedZones: recommendedZones.length,
            zones: predictions.map(p => ({
                zoneId: p.zoneId,
                coordinates: p.location,
                confidence: p.prediction.confidence,
                quality: p.prediction.quality,
                distance: p.distance,
                depth: p.depth,
                recommendation: this.generateRecommendation(p.prediction, p.distance)
            })),
            bestZone: recommendedZones.length > 0 ? recommendedZones[0] : null
        };
    }

    // Generate human-readable recommendation
    generateRecommendation(prediction, distance) {
        if (prediction.confidence >= 80) {
            return `Excellent fishing spot! ${prediction.confidence}% chance of good catch.`;
        } else if (prediction.confidence >= 60) {
            return `Good fishing area. ${prediction.confidence}% confidence. ${Math.round(distance)}km away.`;
        } else {
            return `Fair conditions. Consider other zones for better results.`;
        }
    }

    // Cache management
    cachePrediction(location, predictions) {
        const cacheKey = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
        this.predictionCache.set(cacheKey, {
            predictions,
            timestamp: Date.now()
        });

        // Clean old cache entries
        this.cleanCache();
    }

    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.predictionCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.predictionCache.delete(key);
            }
        }
    }

    // Get cached prediction
    getCachedPrediction(location) {
        const cacheKey = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
        const cached = this.predictionCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.predictions;
        }
        
        return null;
    }

    // Submit user feedback to improve model
    async submitFeedback(zoneId, actualCatch, accuracyRating) {
        // In real implementation, store feedback for model retraining
        console.log(`📝 Feedback received for ${zoneId}: Catch=${actualCatch}kg, Rating=${accuracyRating}/5`);
        
        return {
            success: true,
            message: 'Feedback recorded for model improvement',
            zoneId,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ZonePredictor;
