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
            console.error('❌ Emergency response
