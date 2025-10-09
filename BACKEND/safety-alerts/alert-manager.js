const EmergencyHandler = require('./emergency-handler');
const WeatherMonitor = require('./weather-monitor');
const AnomalyDetector = require('./anomaly-detector');
const NotificationService = require('./notification-service');

class AlertManager {
    constructor() {
        this.emergencyHandler = new EmergencyHandler();
        this.weatherMonitor = new WeatherMonitor();
        this.anomalyDetector = new AnomalyDetector();
        this.notificationService = new NotificationService();
        
        this.activeAlerts = new Map();
        this.alertHistory = [];
        this.alertThresholds = {
            WEATHER: {
                WIND_SPEED: 25, // km/h
                WAVE_HEIGHT: 2.5, // meters
                STORM_DISTANCE: 50, // km
                LIGHTNING_COUNT: 5 // strikes per hour
            },
            SAFETY: {
                SOS_ACTIVATION: true,
                NO_MOVEMENT: 30, // minutes
                OFFSHORE_DISTANCE: 20 // km from shore
            }
        };
    }

    // Main alert processing pipeline
    async processAlert(alertData) {
        try {
            console.log(`🚨 Processing alert: ${alertData.type}`, alertData);

            // Validate alert data
            if (!this.validateAlertData(alertData)) {
                throw new Error('Invalid alert data');
            }

            let alertResult;

            // Route to appropriate handler based on alert type
            switch (alertData.type) {
                case 'SOS_EMERGENCY':
                    alertResult = await this.handleSOSEmergency(alertData);
                    break;
                
                case 'WEATHER_ALERT':
                    alertResult = await this.handleWeatherAlert(alertData);
                    break;
                
                case 'ANOMALY_DETECTED':
                    alertResult = await this.handleAnomalyAlert(alertData);
                    break;
                
                case 'SAFETY_WARNING':
                    alertResult = await this.handleSafetyWarning(alertData);
                    break;
                
                default:
                    throw new Error(`Unknown alert type: ${alertData.type}`);
            }

            // Store alert in history
            this.storeAlertHistory(alertResult);

            return alertResult;

        } catch (error) {
            console.error('❌ Alert processing failed:', error);
            throw error;
        }
    }

    // Handle SOS emergency alerts
    async handleSOSEmergency(alertData) {
        const emergencyResult = await this.emergencyHandler.processSOS(
            alertData.userId,
            alertData.location,
            alertData.message
        );

        const alert = {
            alertId: this.generateAlertId('SOS'),
            type: 'SOS_EMERGENCY',
            severity: 'CRITICAL',
            userId: alertData.userId,
            location: alertData.location,
            timestamp: new Date().toISOString(),
            status: 'ACTIVE',
            emergencyData: emergencyResult,
            actionsTaken: emergencyResult.actions
        };

        this.activeAlerts.set(alert.alertId, alert);
        return alert;
    }

    // Handle weather-related alerts
    async handleWeatherAlert(alertData) {
        const weatherAssessment = await this.weatherMonitor.assessWeatherThreat(
            alertData.location,
            alertData.weatherData
        );

        const alert = {
            alertId: this.generateAlertId('WEATHER'),
            type: 'WEATHER_ALERT',
            severity: weatherAssessment.severity,
            location: alertData.location,
            timestamp: new Date().toISOString(),
            status: 'ACTIVE',
            weatherData: weatherAssessment,
            recommendedAction: weatherAssessment.recommendation
        };

        this.activeAlerts.set(alert.alertId, alert);
        return alert;
    }

    // Handle anomaly detection alerts
    async handleAnomalyAlert(alertData) {
        const anomalyAnalysis = await this.anomalyDetector.analyzeAnomaly(
            alertData.sensorData,
            alertData.patterns
        );

        const alert = {
            alertId: this.generateAlertId('ANOMALY'),
            type: 'ANOMALY_DETECTED',
            severity: anomalyAnalysis.severity,
            userId: alertData.userId,
            location: alertData.location,
            timestamp: new Date().toISOString(),
            status: 'ACTIVE',
            anomalyData: anomalyAnalysis,
            confidence: anomalyAnalysis.confidence
        };

        this.activeAlerts.set(alert.alertId, alert);
        return alert;
    }

    // Handle general safety warnings
    async handleSafetyWarning(alertData) {
        const alert = {
            alertId: this.generateAlertId('SAFETY'),
            type: 'SAFETY_WARNING',
            severity: alertData.severity || 'MEDIUM',
            userId: alertData.userId,
            location: alertData.location,
            timestamp: new Date().toISOString(),
            status: 'ACTIVE',
            warningType: alertData.warningType,
            description: alertData.description,
            recommendedAction: alertData.action
        };

        this.activeAlerts.set(alert.alertId, alert);
        return alert;
    }

    // Validate incoming alert data
    validateAlertData(alertData) {
        const requiredFields = {
            'SOS_EMERGENCY': ['userId', 'location', 'type'],
            'WEATHER_ALERT': ['location', 'weatherData', 'type'],
            'ANOMALY_DETECTED': ['sensorData', 'location', 'type'],
            'SAFETY_WARNING': ['warningType', 'location', 'type']
        };

        const fields = requiredFields[alertData.type];
        if (!fields) return false;

        return fields.every(field => alertData[field] !== undefined);
    }

    // Generate unique alert ID
    generateAlertId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Store alert in history
    storeAlertHistory(alert) {
        this.alertHistory.push({
            ...alert,
            archivedAt: new Date().toISOString()
        });

        // Keep only last 1000 alerts in memory
        if (this.alertHistory.length > 1000) {
            this.alertHistory = this.alertHistory.slice(-1000);
        }
    }

    // Get active alerts for a location
    getActiveAlerts(location, radiusKm = 50) {
        const alerts = Array.from(this.activeAlerts.values());
        
        return alerts.filter(alert => {
            if (alert.status !== 'ACTIVE') return false;
            
            if (location && alert.location) {
                const distance = this.calculateDistance(
                    location.lat, location.lng,
                    alert.location.lat, alert.location.lng
                );
                return distance <= radiusKm;
            }
            
            return true;
        });
    }

    // Calculate distance between coordinates
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

    // Resolve an alert
    async resolveAlert(alertId, resolutionData = {}) {
        const alert = this.activeAlerts.get(alertId);
        
        if (!alert) {
            throw new Error(`Alert ${alertId} not found`);
        }

        alert.status = 'RESOLVED';
        alert.resolvedAt = new Date().toISOString();
        alert.resolutionData = resolutionData;

        this.activeAlerts.delete(alertId);
        
        // Send resolution notification
        await this.notificationService.sendAlertResolution(alert, resolutionData);

        console.log(`✅ Alert ${alertId} resolved`);
        return alert;
    }

    // Get alert statistics
    getAlertStats() {
        const activeAlerts = Array.from(this.activeAlerts.values());
        
        return {
            totalActive: activeAlerts.length,
            totalHistorical: this.alertHistory.length,
            byType: this.groupAlertsByType(activeAlerts),
            bySeverity: this.groupAlertsBySeverity(activeAlerts),
            recentActivity: this.alertHistory.slice(-10)
        };
    }

    groupAlertsByType(alerts) {
        return alerts.reduce((acc, alert) => {
            acc[alert.type] = (acc[alert.type] || 0) + 1;
            return acc;
        }, {});
    }

    groupAlertsBySeverity(alerts) {
        return alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});
    }

    // Clean up old alerts
    cleanupOldAlerts(maxAgeHours = 24) {
        const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
        
        for (const [alertId, alert] of this.activeAlerts.entries()) {
            const alertTime = new Date(alert.timestamp).getTime();
            if (alertTime < cutoffTime) {
                this.resolveAlert(alertId, { reason: 'Auto-resolved due to age' });
            }
        }
    }
}

module.exports = AlertManager;
