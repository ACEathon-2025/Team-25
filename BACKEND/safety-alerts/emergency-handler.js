const NotificationService = require('./notification-service');

class EmergencyHandler {
    constructor() {
        this.notificationService = new NotificationService();
        this.activeEmergencies = new Map();
        this.emergencyContacts = {
            COAST_GUARD: '+911800123456',
            LOCAL_AUTHORITIES: '+911800654321',
            NEAREST_HOSPITAL: '+911800111222'
        };
    }

    // Process SOS emergency
    async processSOS(userId, location, message = 'Emergency assistance needed') {
        try {
            console.log(`🚨 Processing SOS emergency for user ${userId}`, location);

            const emergencyId = this.generateEmergencyId();
            const emergencyData = {
                emergencyId,
                userId,
                location,
                message,
                timestamp: new Date().toISOString(),
                status: 'ACTIVE',
                assistanceRequired: true
            };

            // Store emergency
            this.activeEmergencies.set(emergencyId, emergencyData);

            // Execute emergency response actions
            const response = await this.executeEmergencyResponse(emergencyData);

            // Update emergency data with response
            emergencyData.response = response;
            this.activeEmergencies.set(emergencyId, emergencyData);

            return {
                emergencyId,
                status: 'RESPONSE_INITIATED',
                actionsTaken: response.actions,
                timestamp: new Date().toISOString(),
                message: 'Emergency response activated successfully'
            };

        } catch (error) {
            console.error('❌ SOS processing failed:', error);
            throw error;
        }
    }

    // Execute emergency response actions
    async executeEmergencyResponse(emergencyData) {
        const actions = [];

        try {
            // 1. Notify Coast Guard
            const coastGuardResult = await this.notificationService.notifyCoastGuard(
                emergencyData.userId,
                emergencyData.location,
                emergencyData.message
            );
            actions.push({
                action: 'NOTIFY_COAST_GUARD',
                status: coastGuardResult.success ? 'SUCCESS' : 'FAILED',
                timestamp: new Date().toISOString(),
                details: coastGuardResult
            });

            // 2. Alert nearby boats
            const nearbyBoatsResult = await this.notificationService.alertNearbyBoats(
                emergencyData.location,
                emergencyData.userId
            );
            actions.push({
                action: 'ALERT_NEARBY_BOATS',
                status: nearbyBoatsResult.success ? 'SUCCESS' : 'FAILED',
                timestamp: new Date().toISOString(),
                details: nearbyBoatsResult
            });

            // 3. Notify family/emergency contacts
            const familyResult = await this.notificationService.notifyFamilyContacts(
                emergencyData.userId,
                emergencyData.message
            );
            actions.push({
                action: 'NOTIFY_FAMILY',
                status: familyResult.success ? 'SUCCESS' : 'FAILED',
                timestamp: new Date().toISOString(),
                details: familyResult
            });

            // 4. Start location tracking
            const trackingResult = this.startEmergencyTracking(emergencyData.emergencyId, emergencyData.location);
            actions.push({
                action: 'START_TRACKING',
                status: 'SUCCESS',
                timestamp: new Date().toISOString(),
                details: trackingResult
            });

            return {
                success: true,
                actions: actions,
                emergencyId: emergencyData.emergencyId,
                responseTime: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Emergency response execution failed:', error);
            
            actions.push({
                action: 'EMERGENCY_RESPONSE',
                status: 'FAILED',
                timestamp: new Date().toISOString(),
                error: error.message
            });

            return {
                success: false,
                actions: actions,
                error: error.message
            };
        }
    }

    // Start emergency location tracking
    startEmergencyTracking(emergencyId, initialLocation) {
        console.log(`📍 Starting emergency tracking for ${emergencyId}`);
        
        // In real implementation, this would set up continuous location updates
        const trackingInterval = setInterval(() => {
            this.updateEmergencyLocation(emergencyId);
        }, 30000); // Update every 30 seconds

        // Store tracking data
        const trackingData = {
            emergencyId,
            initialLocation,
            trackingInterval,
            locationHistory: [{
                location: initialLocation,
                timestamp: new Date().toISOString()
            }],
            lastUpdate: new Date().toISOString()
        };

        this.activeEmergencies.get(emergencyId).tracking = trackingData;

        return {
            trackingStarted: true,
            updateInterval: '30 seconds',
            emergencyId
        };
    }

    // Update emergency location (mock implementation)
    updateEmergencyLocation(emergencyId) {
        const emergency = this.activeEmergencies.get(emergencyId);
        
        if (!emergency || !emergency.tracking) {
            return;
        }

        // Simulate location update (in real app, get from GPS)
        const newLocation = {
            lat: emergency.location.lat + (Math.random() * 0.001 - 0.0005),
            lng: emergency.location.lng + (Math.random() * 0.001 - 0.0005)
        };

        emergency.tracking.locationHistory.push({
            location: newLocation,
            timestamp: new Date().toISOString()
        });

        emergency.tracking.lastUpdate = new Date().toISOString();
        emergency.location = newLocation; // Update current location

        console.log(`📍 Updated location for emergency ${emergencyId}:`, newLocation);
    }

    // Resolve emergency
    async resolveEmergency(emergencyId, resolutionData = {}) {
        const emergency = this.activeEmergencies.get(emergencyId);
        
        if (!emergency) {
            throw new Error(`Emergency ${emergencyId} not found`);
        }

        try {
            // Stop tracking
            if (emergency.tracking && emergency.tracking.trackingInterval) {
                clearInterval(emergency.tracking.trackingInterval);
            }

            // Update emergency status
            emergency.status = 'RESOLVED';
            emergency.resolvedAt = new Date().toISOString();
            emergency.resolutionData = resolutionData;

            // Send resolution notifications
            await this.notificationService.sendEmergencyResolution(
                emergency.userId,
                emergencyId,
                resolutionData
            );

            // Remove from active emergencies (keep in history)
            this.activeEmergencies.delete(emergencyId);

            console.log(`✅ Emergency ${emergencyId} resolved`);

            return {
                success: true,
                emergencyId,
                resolvedAt: emergency.resolvedAt,
                resolution: resolutionData
            };

        } catch (error) {
            console.error('❌ Emergency resolution failed:', error);
            throw error;
        }
    }

    // Get active emergencies
    getActiveEmergencies() {
        return Array.from(this.activeEmergencies.values());
    }

    // Get emergency details
    getEmergencyDetails(emergencyId) {
        const emergency = this.activeEmergencies.get(emergencyId);
        
        if (!emergency) {
            throw new Error(`Emergency ${emergencyId} not found`);
        }

        return emergency;
    }

    // Update emergency status
    updateEmergencyStatus(emergencyId, status, notes = '') {
        const emergency = this.activeEmergencies.get(emergencyId);
        
        if (!emergency) {
            throw new Error(`Emergency ${emergencyId} not found`);
        }

        emergency.status = status;
        emergency.statusNotes = notes;
        emergency.lastUpdated = new Date().toISOString();

        this.activeEmergencies.set(emergencyId, emergency);

        return {
            success: true,
            emergencyId,
            status,
            updatedAt: emergency.lastUpdated
        };
    }

    // Generate unique emergency ID
    generateEmergencyId() {
        return `EMG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get emergency statistics
    getEmergencyStats() {
        const activeEmergencies = this.getActiveEmergencies();
        
        return {
            totalActive: activeEmergencies.length,
            byStatus: this.groupEmergenciesByStatus(activeEmergencies),
            responseTimes: this.calculateResponseTimes(activeEmergencies)
        };
    }

    groupEmergenciesByStatus(emergencies) {
        return emergencies.reduce((acc, emergency) => {
            acc[emergency.status] = (acc[emergency.status] || 0) + 1;
            return acc;
        }, {});
    }

    calculateResponseTimes(emergencies) {
        if (emergencies.length === 0) return { average: 0, fastest: 0, slowest: 0 };

        const responseTimes = emergencies.map(emergency => {
            const startTime = new Date(emergency.timestamp);
            const firstResponse = emergency.response?.actions?.[0]?.timestamp;
            
            if (firstResponse) {
                return (new Date(firstResponse) - startTime) / 1000; // seconds
            }
            
            return 0;
        }).filter(time => time > 0);

        if (responseTimes.length === 0) return { average: 0, fastest: 0, slowest: 0 };

        return {
            average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
            fastest: Math.min(...responseTimes),
            slowest: Math.max(...responseTimes)
        };
    }

    // Clean up old emergencies (auto-resolve after 24 hours)
    cleanupOldEmergencies(maxAgeHours = 24) {
        const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
        
        for (const [emergencyId, emergency] of this.activeEmergencies.entries()) {
            const emergencyTime = new Date(emergency.timestamp).getTime();
            if (emergencyTime < cutoffTime) {
                this.resolveEmergency(emergencyId, { 
                    reason: 'Auto-resolved due to timeout',
                    autoResolved: true 
                });
            }
        }
    }
}

module.exports = EmergencyHandler;
