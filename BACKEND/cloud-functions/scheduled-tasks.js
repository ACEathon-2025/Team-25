const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

class ScheduledTasks {
    constructor() {
        this.tasks = new Map();
        this.weatherApiKey = process.env.OPENWEATHER_API_KEY;
    }

    // Scheduled task to update weather data
    async updateWeatherData() {
        try {
            console.log('🌤️ Starting scheduled weather data update...');

            // Get all active fishing locations from users
            const usersSnapshot = await db.collection('users')
                .where('status', '==', 'ACTIVE')
                .where('location.isOnline', '==', true)
                .get();

            const locations = [];
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                if (user.location && user.location.current) {
                    locations.push({
                        userId: doc.id,
                        coordinates: user.location.current.coordinates
                    });
                }
            });

            console.log(`📍 Updating weather for ${locations.length} active locations`);

            // Update weather for each unique location
            const uniqueLocations = this.getUniqueLocations(locations);
            const weatherUpdates = [];

            for (const location of uniqueLocations) {
                try {
                    const weatherData = await this.fetchWeatherData(location.coordinates);
                    
                    // Store weather data
                    await db.collection('weatherData').add({
                        coordinates: location.coordinates,
                        data: weatherData,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        users: location.userIds
                    });

                    weatherUpdates.push({
                        location: location.coordinates,
                        success: true
                    });

                } catch (error) {
                    console.error(`❌ Weather update failed for location:`, location.coordinates, error);
                    weatherUpdates.push({
                        location: location.coordinates,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Log task completion
            await db.collection('taskLogs').add({
                task: 'weather_update',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                locationsProcessed: uniqueLocations.length,
                successfulUpdates: weatherUpdates.filter(u => u.success).length,
                failedUpdates: weatherUpdates.filter(u => !u.success).length,
                details: weatherUpdates
            });

            console.log('✅ Weather data update completed');
            return {
                success: true,
                totalLocations: uniqueLocations.length,
                successful: weatherUpdates.filter(u => u.success).length,
                failed: weatherUpdates.filter(u => !u.success).length
            };

        } catch (error) {
            console.error('❌ Scheduled weather update failed:', error);
            throw error;
        }
    }

    // Get unique locations from user data
    getUniqueLocations(locations) {
        const locationMap = new Map();
        
        locations.forEach(location => {
            const key = `${location.coordinates.lat.toFixed(4)}_${location.coordinates.lng.toFixed(4)}`;
            
            if (!locationMap.has(key)) {
                locationMap.set(key, {
                    coordinates: location.coordinates,
                    userIds: [location.userId]
                });
            } else {
                locationMap.get(key).userIds.push(location.userId);
            }
        });

        return Array.from(locationMap.values());
    }

    // Fetch weather data from API
    async fetchWeatherData(coordinates) {
        try {
            const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    lat: coordinates.lat,
                    lon: coordinates.lng,
                    appid: this.weatherApiKey,
                    units: 'metric'
                },
                timeout: 10000
            });

            return {
                temperature: response.data.main.temp,
                feelsLike: response.data.main.feels_like,
                humidity: response.data.main.humidity,
                pressure: response.data.main.pressure,
                windSpeed: response.data.wind.speed * 3.6, // Convert to km/h
                windDirection: response.data.wind.deg,
                condition: response.data.weather[0].main,
                description: response.data.weather[0].description,
                visibility: response.data.visibility / 1000, // Convert to km
                cloudCover: response.data.clouds.all
            };

        } catch (error) {
            console.error('❌ Weather API error:', error.response?.data || error.message);
            throw new Error('Failed to fetch weather data');
        }
    }

    // Scheduled task to check for expired data
    async cleanupExpiredData() {
        try {
            console.log('🧹 Starting data cleanup task...');

            const now = admin.firestore.Timestamp.now();
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            let cleanupStats = {
                weatherData: 0,
                oldAlerts: 0,
                taskLogs: 0,
                userSessions: 0
            };

            // Clean up old weather data (older than 1 day)
            const weatherQuery = db.collection('weatherData')
                .where('timestamp', '<', oneDayAgo);
            
            const weatherSnapshot = await weatherQuery.get();
            const weatherDeletes = weatherSnapshot.docs.map(doc => doc.ref.delete());
            cleanupStats.weatherData = weatherSnapshot.size;

            // Clean up expired alerts
            const alertsQuery = db.collection('alerts')
                .where('expiresAt', '<', now);
            
            const alertsSnapshot = await alertsQuery.get();
            const alertDeletes = alertsSnapshot.docs.map(doc => doc.ref.delete());
            cleanupStats.oldAlerts = alertsSnapshot.size;

            // Clean up old task logs (older than 1 week)
            const logsQuery = db.collection('taskLogs')
                .where('timestamp', '<', oneWeekAgo);
            
            const logsSnapshot = await logsQuery.get();
            const logDeletes = logsSnapshot.docs.map(doc => doc.ref.delete());
            cleanupStats.taskLogs = logsSnapshot.size;

            // Clean up old user sessions
            const sessionsQuery = db.collection('userSessions')
                .where('lastActivity', '<', oneDayAgo);
            
            const sessionsSnapshot = await sessionsQuery.get();
            const sessionDeletes = sessionsSnapshot.docs.map(doc => doc.ref.delete());
            cleanupStats.userSessions = sessionsSnapshot.size;

            // Execute all deletions
            await Promise.all([
                ...weatherDeletes,
                ...alertDeletes,
                ...logDeletes,
                ...sessionDeletes
            ]);

            // Log cleanup task
            await db.collection('taskLogs').add({
                task: 'data_cleanup',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                stats: cleanupStats,
                message: 'Data cleanup completed successfully'
            });

            console.log('✅ Data cleanup completed:', cleanupStats);
            return {
                success: true,
                stats: cleanupStats
            };

        } catch (error) {
            console.error('❌ Data cleanup failed:', error);
            throw error;
        }
    }

    // Scheduled task to send daily fishing reports
    async sendDailyFishingReports() {
        try {
            console.log('📊 Generating daily fishing reports...');

            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const today = new Date();

            // Get all active fishermen
            const fishermenSnapshot = await db.collection('users')
                .where('fishermanProfile.isFisherman', '==', true)
                .where('status', '==', 'ACTIVE')
                .get();

            const reportPromises = [];

            fishermenSnapshot.forEach(doc => {
                reportPromises.push(this.generateUserFishingReport(doc.id, yesterday, today));
            });

            const reports = await Promise.allSettled(reportPromises);

            const successfulReports = reports.filter(r => r.status === 'fulfilled').length;
            const failedReports = reports.filter(r => r.status === 'rejected').length;

            // Log report generation
            await db.collection('taskLogs').add({
                task: 'daily_fishing_reports',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                totalUsers: fishermenSnapshot.size,
                successfulReports,
                failedReports,
                date: today.toISOString().split('T')[0]
            });

            console.log(`✅ Daily fishing reports sent: ${successfulReports} successful, ${failedReports} failed`);
            return {
                success: true,
                totalUsers: fishermenSnapshot.size,
                successfulReports,
                failedReports
            };

        } catch (error) {
            console.error('❌ Daily fishing reports failed:', error);
            throw error;
        }
    }

    // Generate fishing report for a single user
    async generateUserFishingReport(userId, startDate, endDate) {
        try {
            // Get user's catch data for the period
            const catchQuery = db.collection('catchReports')
                .where('userId', '==', userId)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate);

            const catchSnapshot = await catchQuery.get();
            
            // Get weather conditions during fishing trips
            const weatherQuery = db.collection('weatherData')
                .where('users', 'array-contains', userId)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate);

            const weatherSnapshot = await weatherQuery.get();

            // Calculate report statistics
            const totalCatch = catchSnapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().totalWeight || 0);
            }, 0);

            const avgWaterTemp = weatherSnapshot.docs.reduce((sum, doc, index, array) => {
                const weatherData = doc.data().data;
                return sum + (weatherData.waterTemperature || 0) / array.length;
            }, 0);

            const report = {
                userId: userId,
                period: {
                    start: startDate,
                    end: endDate
                },
                statistics: {
                    totalTrips: catchSnapshot.size,
                    totalCatch: totalCatch,
                    averageCatch: catchSnapshot.size > 0 ? totalCatch / catchSnapshot.size : 0,
                    bestConditions: this.analyzeBestConditions(catchSnapshot, weatherSnapshot),
                    weatherPatterns: this.analyzeWeatherPatterns(weatherSnapshot)
                },
                recommendations: this.generateFishingRecommendations(catchSnapshot, weatherSnapshot),
                generatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Store the report
            await db.collection('fishingReports').add(report);

            return report;

        } catch (error) {
            console.error(`❌ Fishing report generation failed for user ${userId}:`, error);
            throw error;
        }
    }

    // Analyze best fishing conditions from historical data
    analyzeBestConditions(catchSnapshot, weatherSnapshot) {
        if (catchSnapshot.size === 0) return {};

        const successfulCatches = catchSnapshot.docs.filter(doc => doc.data().totalWeight > 20);
        
        if (successfulCatches.length === 0) return {};

        // Simple analysis - in real app, use more sophisticated ML
        return {
            bestTime: '06:00-10:00', // Mock data
            bestTide: 'rising',
            optimalWaterTemp: '26-28°C',
            successRate: (successfulCatches.length / catchSnapshot.size) * 100
        };
    }

    // Analyze weather patterns
    analyzeWeatherPatterns(weatherSnapshot) {
        if (weatherSnapshot.size === 0) return {};

        const conditions = weatherSnapshot.docs.map(doc => doc.data().data.condition);
        const temperatures = weatherSnapshot.docs.map(doc => doc.data().data.temperature);

        return {
            dominantCondition: this.getMostFrequent(conditions),
            avgTemperature: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
            temperatureRange: {
                min: Math.min(...temperatures),
                max: Math.max(...temperatures)
            }
        };
    }

    // Generate fishing recommendations
    generateFishingRecommendations(catchSnapshot, weatherSnapshot) {
        const recommendations = [];

        if (catchSnapshot.size === 0) {
            recommendations.push('Try fishing during early morning hours for better results');
            recommendations.push('Monitor weather conditions before planning your trip');
            return recommendations;
        }

        const recentPerformance = catchSnapshot.docs[catchSnapshot.size - 1].data().totalWeight;
        
        if (recentPerformance < 10) {
            recommendations.push('Consider trying different fishing locations');
            recommendations.push('Check tide schedules for optimal fishing times');
        }

        if (recentPerformance > 50) {
            recommendations.push('Great results! Consider sharing your techniques with the community');
        }

        recommendations.push('Stay updated with real-time weather alerts for safety');

        return recommendations;
    }

    // Get most frequent element in array
    getMostFrequent(arr) {
        const frequency = {};
        arr.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        
        return Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        );
    }

    // Scheduled task to check system health
    async checkSystemHealth() {
        try {
            console.log('🏥 Performing system health check...');

            const healthChecks = {
                database: await this.checkDatabaseHealth(),
                weatherApi: await this.checkWeatherApiHealth(),
                storage: await this.checkStorageHealth(),
                smsService: await this.checkSmsServiceHealth()
            };

            const allHealthy = Object.values(healthChecks).every(check => check.healthy);
            const overallStatus = allHealthy ? 'HEALTHY' : 'DEGRADED';

            // Store health check results
            await db.collection('systemHealth').add({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: overallStatus,
                checks: healthChecks,
                message: allHealthy ? 'All systems operational' : 'Some services are experiencing issues'
            });

            // Send alert if system is degraded
            if (!allHealthy) {
                await this.sendSystemAlert(healthChecks);
            }

            console.log(`✅ System health check completed: ${overallStatus}`);
            return {
                success: true,
                status: overallStatus,
                checks: healthChecks
            };

        } catch (error) {
            console.error('❌ System health check failed:', error);
            throw error;
        }
    }

    // Check database health
    async checkDatabaseHealth() {
        try {
            const startTime = Date.now();
            await db.collection('healthCheck').doc('ping').set({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                check: 'database_connectivity'
            });
            const responseTime = Date.now() - startTime;

            return {
                healthy: true,
                responseTime: responseTime,
                message: 'Database connection stable'
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                message: 'Database connection failed'
            };
        }
    }

    // Check weather API health
    async checkWeatherApiHealth() {
        try {
            const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    lat: 19.0760,
                    lon: 72.8777,
                    appid: this.weatherApiKey
                },
                timeout: 5000
            });

            return {
                healthy: response.status === 200,
                responseTime: response.duration,
                message: 'Weather API responsive'
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                message: 'Weather API unavailable'
            };
        }
    }

    // Check storage health
    async checkStorageHealth() {
        try {
            const startTime = Date.now();
            const file = bucket.file('health-check.txt');
            await file.save('Health check', {
                metadata: {
                    contentType: 'text/plain'
                }
            });
            const responseTime = Date.now() - startTime;

            // Clean up test file
            await file.delete();

            return {
                healthy: true,
                responseTime: responseTime,
                message: 'Cloud Storage accessible'
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                message: 'Cloud Storage inaccessible'
            };
        }
    }

    // Check SMS service health
    async checkSmsServiceHealth() {
        // Mock check - in real implementation, test Twilio or other SMS service
        return {
            healthy: true,
            message: 'SMS service operational'
        };
    }

    // Send system alert for degraded services
    async sendSystemAlert(healthChecks) {
        const degradedServices = Object.entries(healthChecks)
            .filter(([_, check]) => !check.healthy)
            .map(([service, _]) => service);

        const alert = {
            type: 'SYSTEM_DEGRADED',
            severity: 'HIGH',
            title: 'System Health Alert',
            message: `Degraded services: ${degradedServices.join(', ')}`,
            affectedServices: degradedServices,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            requiresAttention: true
        };

        await db.collection('systemAlerts').add(alert);

        // Notify administrators (in real app, send email/push notification)
        console.log('🚨 System alert:', alert);
    }
}

// Firebase Cloud Functions exports
exports.scheduledWeatherUpdate = functions.pubsub
    .schedule('every 30 minutes')
    .onRun(async (context) => {
        const tasks = new ScheduledTasks();
        return await tasks.updateWeatherData();
    });

exports.scheduledDataCleanup = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        const tasks = new ScheduledTasks();
        return await tasks.cleanupExpiredData();
    });

exports.scheduledFishingReports = functions.pubsub
    .schedule('0 6 * * *') // 6 AM daily
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        const tasks = new ScheduledTasks();
        return await tasks.sendDailyFishingReports();
    });

exports.scheduledHealthCheck = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
        const tasks = new ScheduledTasks();
        return await tasks.checkSystemHealth();
    });

module.exports = ScheduledTasks;
