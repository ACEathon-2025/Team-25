const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// In production, you would use Twilio or another SMS service
// For this example, we'll create a mock SMS service

class SmsNotificationService {
    constructor() {
        this.provider = process.env.SMS_PROVIDER || 'mock';
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
    }

    // Process pending SMS notifications
    async processSmsQueue() {
        try {
            console.log('📱 Processing SMS queue...');

            // Get pending SMS messages (limit to 10 at a time)
            const smsQuery = await db.collection('smsQueue')
                .where('status', '==', 'PENDING')
                .orderBy('createdAt', 'asc')
                .limit(10)
                .get();

            if (smsQuery.empty) {
                console.log('📱 No pending SMS messages');
                return { processed: 0, successful: 0, failed: 0 };
            }

            const processingPromises = smsQuery.docs.map(doc => 
                this.processSmsMessage(doc)
            );

            const results = await Promise.allSettled(processingPromises);
            
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

            console.log(`📱 SMS queue processed: ${successful} successful, ${failed} failed`);
            
            return {
                processed: smsQuery.size,
                successful: successful,
                failed: failed
            };

        } catch (error) {
            console.error('❌ SMS queue processing failed:', error);
            throw error;
        }
    }

    // Process individual SMS message
    async processSmsMessage(smsDoc) {
        const smsId = smsDoc.id;
        const smsData = smsDoc.data();

        try {
            console.log(`📱 Sending SMS ${smsId} to ${smsData.to}`);

            // Send SMS using configured provider
            const result = await this.sendSms(
                smsData.to,
                smsData.message,
                smsData.priority
            );

            // Update SMS status to SENT
            await smsDoc.ref.update({
                status: 'SENT',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                provider: this.provider,
                messageId: result.messageId
            });

            // Log successful delivery
            await db.collection('smsDeliveryLogs').add({
                smsId: smsId,
                to: smsData.to,
                status: 'DELIVERED',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                provider: this.provider,
                messageLength: smsData.message.length
            });

            console.log(`✅ SMS ${smsId} sent successfully`);
            return { success: true, smsId: smsId };

        } catch (error) {
            console.error(`❌ SMS ${smsId} failed:`, error);

            // Update retry count and status
            const retryCount = (smsData.retryCount || 0) + 1;
            const shouldRetry = retryCount < this.maxRetries;

            await smsDoc.ref.update({
                status: shouldRetry ? 'RETRY' : 'FAILED',
                retryCount: retryCount,
                lastError: error.message,
                lastAttempt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Log failed delivery
            await db.collection('smsDeliveryLogs').add({
                smsId: smsId,
                to: smsData.to,
                status: 'FAILED',
                error: error.message,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                retryCount: retryCount
            });

            return { success: false, smsId: smsId, error: error.message };
        }
    }

    // Send SMS using configured provider
    async sendSms(to, message, priority = 'NORMAL') {
        try {
            // In production, integrate with actual SMS provider like Twilio
            switch (this.provider) {
                case 'twilio':
                    return await this.sendViaTwilio(to, message);
                case 'aws-sns':
                    return await this.sendViaAwsSns(to, message);
                case 'mock':
                default:
                    return await this.sendViaMock(to, message, priority);
            }
        } catch (error) {
            console.error('SMS sending failed:', error);
            throw error;
        }
    }

    // Mock SMS provider for development
    async sendViaMock(to, message, priority) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate occasional failures for testing
        if (Math.random() < 0.1) { // 10% failure rate for testing
            throw new Error('Mock SMS provider simulated failure');
        }

        console.log(`📱 [MOCK SMS] To: ${to}`);
        console.log(`📱 [MOCK SMS] Message: ${message.substring(0, 100)}...`);
        console.log(`📱 [MOCK SMS] Priority: ${priority}`);

        return {
            success: true,
            messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            provider: 'mock'
        };
    }

    // Twilio SMS provider (placeholder)
    async sendViaTwilio(to, message) {
        // This would be implemented with actual Twilio SDK
        // const client = require('twilio')(accountSid, authToken);
        // const result = await client.messages.create({
        //     body: message,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: to
        // });
        
        throw new Error('Twilio SMS provider not implemented');
    }

    // AWS SNS SMS provider (placeholder)
    async sendViaAwsSns(to, message) {
        // This would be implemented with AWS SDK
        // const AWS = require('aws-sdk');
        // const sns = new AWS.SNS();
        // const result = await sns.publish({
        //     Message: message,
        //     PhoneNumber: to
        // }).promise();
        
        throw new Error('AWS SNS SMS provider not implemented');
    }

    // Send emergency SMS
    async sendEmergencySms(userId, emergencyData) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                throw new Error('User not found');
            }

            const user = userDoc.data();
            const emergencyContacts = user.emergencyContacts || [];

            if (emergencyContacts.length === 0) {
                console.log(`⚠️ No emergency contacts for user ${userId}`);
                return { sent: 0 };
            }

            const smsPromises = emergencyContacts.map(contact => {
                const message = this.generateEmergencyMessage(emergencyData, user, contact);
                
                return db.collection('smsQueue').add({
                    to: contact.phone,
                    message: message,
                    priority: 'CRITICAL',
                    status: 'PENDING',
                    type: 'EMERGENCY',
                    userId: userId,
                    emergencyId: emergencyData.emergencyId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            await Promise.all(smsPromises);

            console.log(`🚨 Emergency SMS queued for ${smsPromises.length} contacts`);
            return { sent: smsPromises.length };

        } catch (error) {
            console.error('Send emergency SMS failed:', error);
            throw error;
        }
    }

    // Send weather alert SMS
    async sendWeatherAlertSms(userId, weatherAlert) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                throw new Error('User not found');
            }

            const user = userDoc.data();

            // Check user's notification preferences
            if (!user.communication?.notifications?.sms?.weatherAlerts) {
                console.log(`ℹ️ Weather SMS alerts disabled for user ${userId}`);
                return { sent: false, reason: 'disabled' };
            }

            const message = this.generateWeatherAlertMessage(weatherAlert, user);

            await db.collection('smsQueue').add({
                to: user.phone,
                message: message,
                priority: weatherAlert.severity === 'CRITICAL' ? 'HIGH' : 'NORMAL',
                status: 'PENDING',
                type: 'WEATHER_ALERT',
                userId: userId,
                alertId: weatherAlert.id,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`🌤️ Weather alert SMS queued for user ${userId}`);
            return { sent: true };

        } catch (error) {
            console.error('Send weather alert SMS failed:', error);
            throw error;
        }
    }

    // Send community alert SMS
    async sendCommunityAlertSms(userIds, communityAlert) {
        try {
            if (!userIds || userIds.length === 0) {
                console.log('ℹ️ No users to send community alert to');
                return { sent: 0 };
            }

            // Get users in batches to avoid too many reads
            const batchSize = 10;
            let totalSent = 0;

            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                
                const userPromises = batch.map(userId => 
                    db.collection('users').doc(userId).get()
                );

                const userSnapshots = await Promise.all(userPromises);

                const smsPromises = userSnapshots
                    .filter(snapshot => snapshot.exists)
                    .map(snapshot => {
                        const user = snapshot.data();
                        
                        // Check if user wants community SMS
                        if (!user.communication?.notifications?.sms?.communityUpdates) {
                            return null;
                        }

                        const message = this.generateCommunityAlertMessage(communityAlert, user);

                        return db.collection('smsQueue').add({
                            to: user.phone,
                            message: message,
                            priority: 'NORMAL',
                            status: 'PENDING',
                            type: 'COMMUNITY_ALERT',
                            userId: user.userId,
                            alertId: communityAlert.id,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .filter(Boolean);

                await Promise.all(smsPromises);
                totalSent += smsPromises.length;
            }

            console.log(`📢 Community alert SMS queued for ${totalSent} users`);
            return { sent: totalSent };

        } catch (error) {
            console.error('Send community alert SMS failed:', error);
            throw error;
        }
    }

    // Generate emergency message
    generateEmergencyMessage(emergencyData, user, contact) {
        const userName = `${user.profile?.firstName} ${user.profile?.lastName}`;
        const locationStr = emergencyData.location ? 
            `Location: ${emergencyData.location.lat.toFixed(4)}, ${emergencyData.location.lng.toFixed(4)}` : 
            'Location: Unknown';

        return `🚨 EMERGENCY ALERT 🚨

Dear ${contact.name},

${userName} has activated an emergency alert.

${emergencyData.message || 'Emergency assistance needed'}

${locationStr}
Time: ${new Date().toLocaleString()}
Contact: ${user.phone}

Please take appropriate action and contact authorities if needed.

- SmartFishing Safety System`;
    }

    // Generate weather alert message
    generateWeatherAlertMessage(weatherAlert, user) {
        return `🌪️ WEATHER ALERT 🌪️

Hello ${user.profile?.firstName},

${weatherAlert.title}

${weatherAlert.description}

Severity: ${weatherAlert.severity}
Recommendation: ${weatherAlert.recommendation}

Time: ${new Date().toLocaleString()}

Please take necessary safety precautions.

- SmartFishing Weather Service`;
    }

    // Generate community alert message
    generateCommunityAlertMessage(communityAlert, user) {
        return `📢 COMMUNITY ALERT 📢

Hello ${user.profile?.firstName},

${communityAlert.title}

${communityAlert.message}

From: ${communityAlert.userName || 'Community Member'}
Time: ${new Date(communityAlert.timestamp).toLocaleString()}

- SmartFishing Community`;
    }

    // Get SMS statistics
    async getSmsStatistics(days = 7) {
        try {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const smsQuery = await db.collection('smsQueue')
                .where('createdAt', '>=', startDate)
                .get();

            const logsQuery = await db.collection('smsDeliveryLogs')
                .where('timestamp', '>=', startDate)
                .get();

            const smsData = smsQuery.docs.map(doc => doc.data());
            const logData = logsQuery.docs.map(doc => doc.data());

            const stats = {
                total: smsData.length,
                byStatus: this.groupByStatus(smsData),
                byType: this.groupByType(smsData),
                byPriority: this.groupByPriority(smsData),
                deliveryRate: this.calculateDeliveryRate(logData),
                period: `${days} days`
            };

            return stats;

        } catch (error) {
            console.error('Get SMS statistics failed:', error);
            throw error;
        }
    }

    // Group SMS by status
    groupByStatus(smsData) {
        return smsData.reduce((acc, sms) => {
            acc[sms.status] = (acc[sms.status] || 0) + 1;
            return acc;
        }, {});
    }

    // Group SMS by type
    groupByType(smsData) {
        return smsData.reduce((acc, sms) => {
            acc[sms.type || 'UNKNOWN'] = (acc[sms.type || 'UNKNOWN'] || 0) + 1;
            return acc;
        }, {});
    }

    // Group SMS by priority
    groupByPriority(smsData) {
        return smsData.reduce((acc, sms) => {
            acc[sms.priority] = (acc[sms.priority] || 0) + 1;
            return acc;
        }, {});
    }

    // Calculate delivery rate
    calculateDeliveryRate(logData) {
        const delivered = logData.filter(log => log.status === 'DELIVERED').length;
        const total = logData.length;
        
        return total > 0 ? (delivered / total) * 100 : 0;
    }
}

// Firebase Cloud Functions

// Process SMS queue every minute
exports.processSmsQueue = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async (context) => {
        const smsService = new SmsNotificationService();
        return await smsService.processSmsQueue();
    });

// HTTP endpoint to send emergency SMS
exports.sendEmergencySms = functions.https.onCall(async (data, context) => {
    // Validate authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated', 
            'Authentication required'
        );
    }

    try {
        const { userId, emergencyData } = data;
        
        if (!userId || !emergencyData) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'UserId and emergencyData are required'
            );
        }

        const smsService = new SmsNotificationService();
        const result = await smsService.sendEmergencySms(userId, emergencyData);

        return {
            success: true,
            ...result
        };

    } catch (error) {
        console.error('Emergency SMS HTTP function failed:', error);
        throw new functions.https.HttpsError(
            'internal',
            error.message
        );
    }
});

// HTTP endpoint to get SMS statistics
exports.getSmsStatistics = functions.https.onCall(async (data, context) => {
    // Validate authentication (admin only)
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated', 
            'Authentication required'
        );
    }

    try {
        const { days = 7 } = data;
        
        const smsService = new SmsNotificationService();
        const stats = await smsService.getSmsStatistics(days);

        return {
            success: true,
            statistics: stats
        };

    } catch (error) {
        console.error('SMS statistics HTTP function failed:', error);
        throw new functions.https.HttpsError(
            'internal',
            error.message
        );
    }
});

module.exports = SmsNotificationService;
