class LocationTracker {
    constructor() {
        this.userLocations = new Map();
        this.locationHistory = new Map();
        this.locationUpdateInterval = 30000; // 30 seconds
        this.maxHistorySize = 1000; // per user
    }

    // Update user location
    async updateUserLocation(userId, location, timestamp = null, status = 'active') {
        try {
            console.log(`📍 Updating location for user ${userId}:`, location);

            // Validate location data
            if (!this.isValidLocation(location)) {
                throw new Error('Invalid location data');
            }

            const updateTime = timestamp || new Date().toISOString();
            
            // Update current location
            this.userLocations.set(userId, {
                userId,
                location,
                timestamp: updateTime,
                status,
                batteryLevel: Math.floor(Math.random() * 100) + 1, // Mock battery
                signalStrength: 'good'
            });

            // Add to history
            await this.addToHistory(userId, location, updateTime, status);

            console.log(`✅ Location updated for user ${userId}`);

            return {
                success: true,
                userId,
                location,
                timestamp: updateTime,
                status
            };

        } catch (error) {
            console.error('❌ Location update failed:', error);
            throw error;
        }
    }

    // Get current user location
    async getCurrentLocation(userId) {
        try {
            const location = this.userLocations.get(userId);
            
            if (!location) {
                throw new Error('Location not found for user');
            }

            return location;

        } catch (error) {
            console.error('❌ Current location fetch failed:', error);
            throw error;
        }
    }

    // Get location history
    async getLocationHistory(userId, hours = 24) {
        try {
            const userHistory = this.locationHistory.get(userId) || [];
            
            if (userHistory.length === 0) {
                return [];
            }

            const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            
            const filteredHistory = userHistory.filter(entry => 
                new Date(entry.timestamp) >= cutoffTime
            );

            return {
                userId,
                totalPoints: filteredHistory.length,
                timeRange: `${hours} hours`,
                locations: filteredHistory
            };

        } catch (error) {
            console.error('❌ Location history fetch failed:', error);
            throw error;
        }
    }

    // Get nearby users
    async getNearbyUsers(centerLocation, radiusKm = 10, minAccuracy = 100) {
        try {
            const nearbyUsers = [];
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            for (const [userId, location] of this.userLocations.entries()) {
                // Check if location is recent
                const locationTime = new Date(location.timestamp);
                if (locationTime < fiveMinutesAgo) {
                    continue; // Skip stale locations
                }

                // Calculate distance
                const distance = this.calculateDistance(
                    centerLocation.lat, centerLocation.lng,
                    location.location.lat, location.location.lng
                );

                if (distance <= radiusKm) {
                    nearbyUsers.push({
                        userId,
                        name: await this.getUserName(userId),
                        distance: Math.round(distance * 10) / 10, // 1 decimal place
                        location: location.location,
                        timestamp: location.timestamp,
                        status: location.status,
                        lastSeen: this.getTimeAgo(location.timestamp)
                    });
                }
            }

            // Sort by distance
            return nearbyUsers.sort((a, b) => a.distance - b.distance);

        } catch (error) {
            console.error('❌ Nearby users fetch failed:', error);
            throw error;
        }
    }

    // Track user movement patterns
    async analyzeMovementPatterns(userId, hours = 24) {
        try {
            const history = await this.getLocationHistory(userId, hours);
            
            if (history.locations.length < 2) {
                return { message: 'Insufficient location data for analysis' };
            }

            const locations = history.locations;
            
            // Calculate total distance traveled
            let totalDistance = 0;
            let maxSpeed = 0;
            const speeds = [];

            for (let i = 1; i < locations.length; i++) {
                const prev = locations[i - 1];
                const curr = locations[i];
                
                const distance = this.calculateDistance(
                    prev.location.lat, prev.location.lng,
                    curr.location.lat, curr.location.lng
                );
                
                const timeDiff = (new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60); // hours
                const speed = timeDiff > 0 ? distance / timeDiff : 0; // km/h
                
                totalDistance += distance;
                speeds.push(speed);
                maxSpeed = Math.max(maxSpeed, speed);
            }

            const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

            // Detect common fishing areas
            const fishingAreas = this.detectFishingAreas(locations);
            
            // Detect unusual movements
            const unusualMovements = this.detectUnusualMovements(locations, avgSpeed);

            return {
                analysisPeriod: `${hours} hours`,
                totalDistance: Math.round(totalDistance * 100) / 100,
                averageSpeed: Math.round(avgSpeed * 100) / 100,
                maximumSpeed: Math.round(maxSpeed * 100) / 100,
                locationPoints: locations.length,
                fishingAreas,
                unusualMovements,
                movementSummary: this.getMovementSummary(avgSpeed, totalDistance)
            };

        } catch (error) {
            console.error('❌ Movement pattern analysis failed:', error);
            throw error;
        }
    }

    // Detect fishing areas from location patterns
    detectFishingAreas(locations) {
        const areas = [];
        const clusterThreshold = 0.5; // km
        
        // Simple clustering algorithm
        for (let i = 0; i < locations.length; i++) {
            const cluster = [locations[i]];
            
            for (let j = i + 1; j < locations.length; j++) {
                const distance = this.calculateDistance(
                    locations[i].location.lat, locations[i].location.lng,
                    locations[j].location.lat, locations[j].location.lng
                );
                
                if (distance <= clusterThreshold) {
                    cluster.push(locations[j]);
                }
            }
            
            if (cluster.length >= 3) { // Minimum points for a fishing area
                const center = this.calculateClusterCenter(cluster);
                const duration = this.calculateClusterDuration(cluster);
                
                areas.push({
                    center,
                    pointCount: cluster.length,
                    duration: Math.round(duration / 60) + ' minutes', // Convert to minutes
                    confidence: Math.min(100, cluster.length * 20) // Simple confidence score
                });
            }
        }
        
        return areas.slice(0, 5); // Return top 5 areas
    }

    // Detect unusual movements
    detectUnusualMovements(locations, avgSpeed) {
        const unusual = [];
        const speedThreshold = avgSpeed * 2; // Twice average speed
        const distanceThreshold = 5; // km from normal area

        for (let i = 1; i < locations.length; i++) {
            const prev = locations[i - 1];
            const curr = locations[i];
            
            const distance = this.calculateDistance(
                prev.location.lat, prev.location.lng,
                curr.location.lat, curr.location.lng
            );
            
            const timeDiff = (new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60);
            const speed = timeDiff > 0 ? distance / timeDiff : 0;

            // Check for high speed
            if (speed > speedThreshold && speed > 10) { // Minimum 10 km/h
                unusual.push({
                    type: 'HIGH_SPEED',
                    timestamp: curr.timestamp,
                    speed: Math.round(speed * 100) / 100,
                    threshold: Math.round(speedThreshold * 100) / 100,
                    description: `Unusually high speed detected: ${Math.round(speed)} km/h`
                });
            }

            // Check for long distance movement
            if (distance > distanceThreshold) {
                unusual.push({
                    type: 'LONG_DISTANCE',
                    timestamp: curr.timestamp,
                    distance: Math.round(distance * 100) / 100,
                    threshold: distanceThreshold,
                    description: `Long distance movement: ${Math.round(distance)} km`
                });
            }
        }

        return unusual;
    }

    // Utility methods
    isValidLocation(location) {
        return (
            location &&
            typeof location.lat === 'number' &&
            typeof location.lng === 'number' &&
            location.lat >= -90 && location.lat <= 90 &&
            location.lng >= -180 && location.lng <= 180
        );
    }

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

    async getUserName(userId) {
        // In real implementation, fetch from user service
        // For demo, return mock names
        const names = ['Rajesh Kumar', 'Suresh Patel', 'Amit Sharma', 'Vikram Singh'];
        return names[Math.floor(Math.random() * names.length)] || 'Unknown Fisherman';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    }

    addToHistory(userId, location, timestamp, status) {
        if (!this.locationHistory.has(userId)) {
            this.locationHistory.set(userId, []);
        }

        const history = this.locationHistory.get(userId);
        history.push({ location, timestamp, status });

        // Keep history size limited
        if (history.length > this.maxHistorySize) {
            history.splice(0, history.length - this.maxHistorySize);
        }
    }

    calculateClusterCenter(cluster) {
        const avgLat = cluster.reduce((sum, point) => sum + point.location.lat, 0) / cluster.length;
        const avgLng = cluster.reduce((sum, point) => sum + point.location.lng, 0) / cluster.length;
        
        return {
            lat: Math.round(avgLat * 1000000) / 1000000, // 6 decimal places
            lng: Math.round(avgLng * 1000000) / 1000000
        };
    }

    calculateClusterDuration(cluster) {
        const startTime = new Date(cluster[0].timestamp);
        const endTime = new Date(cluster[cluster.length - 1].timestamp);
        return (endTime - startTime) / 1000; // seconds
    }

    getMovementSummary(avgSpeed, totalDistance) {
        if (avgSpeed < 2) return 'Stationary or slow movement - likely fishing';
        if (avgSpeed < 10) return 'Moderate movement - traveling between spots';
        if (avgSpeed < 20) return 'Fast movement - returning to shore or moving quickly';
        return 'Very fast movement - check for emergency';
    }

    // Get tracker statistics
    getTrackerStats() {
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
        
        const activeUsers = Array.from(this.userLocations.values()).filter(
            location => new Date(location.timestamp) >= fifteenMinutesAgo
        ).length;

        return {
            totalTrackedUsers: this.userLocations.size,
            activeUsers,
            totalLocationPoints: Array.from(this.locationHistory.values()).reduce(
                (total, history) => total + history.length, 0
            ),
            updateInterval: this.locationUpdateInterval
        };
    }

    // Clean up old location data
    cleanupOldData(maxAgeHours = 24) {
        const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
        let cleanedCount = 0;

        // Clean user locations
        for (const [userId, location] of this.userLocations.entries()) {
            if (new Date(location.timestamp) < cutoffTime) {
                this.userLocations.delete(userId);
                cleanedCount++;
            }
        }

        // Clean location history
        for (const [userId, history] of this.locationHistory.entries()) {
            const filteredHistory = history.filter(entry => 
                new Date(entry.timestamp) >= cutoffTime
            );
            
            if (filteredHistory.length === 0) {
                this.locationHistory.delete(userId);
            } else {
                this.locationHistory.set(userId, filteredHistory);
            }
        }

        console.log(`🧹 Cleaned up ${cleanedCount} old location records`);
        return cleanedCount;
    }
}

module.exports = LocationTracker;
