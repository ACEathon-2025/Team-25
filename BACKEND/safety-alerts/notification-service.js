const twilio = require('twilio');

class NotificationService {
    constructor() {
        // Initialize Twilio client (SMS notifications)
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        
        this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        
        // Mock user database (in real app, use actual database)
        this.userContacts = new Map();
        this.initializeMockContacts();
    }

    // Initialize mock user contacts for demo
    initializeMockContacts() {
        this.userContacts.set('user_001', {
            name: 'Rajesh Kumar',
            phone: '+919876543210',
            emergencyContacts: [
                { name: 'Wife', phone: '+919876543211' },
                { name: 'Brother', phone: '+919876543212' }
            ],
            boatName: 'Sea Explorer'
        });

        this.userContacts.set('user_002', {
            name: 'Suresh Patel',
            phone: '+919876543213',
            emergencyContacts: [
                { name: 'Son', phone: '+919876543214' },
                { name: 'Fishing Partner', phone: '+919876543215' }
            ],
            boatName: 'Ocean Warrior'
        });
    }

    // Notify Coast Guard about emergency
    async notifyCoastGuard(userId, location, message) {
        try {
            const user = this.userContacts.get(userId);
            const locationStr = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
            
            const smsBody = `🚨 MARINE EMERGENCY ALERT 🚨
            
Fisherman: ${user?.name || 'Unknown'}
Boat: ${user?.boatName || 'Unknown'}
Location: ${locationStr}
Message: ${message}
Time: ${new Date().toLocaleString()}
Emergency ID: EMG_${Date.now()}

IMMEDIATE ASSISTANCE REQUIRED`;

            // In real implementation, send to actual Coast Guard number
            console.log('📞 NOTIFYING COAST GUARD:');
            console.log(smsBody);

            // Mock SMS sending (comment out in production)
            if (process.env.NODE_ENV !== 'production') {
                await this.sendSMS(this.emergencyContacts.COAST_GUARD, smsBody);
            }

            return {
                success: true,
                recipient: 'Coast Guard',
                message: 'Coast Guard notified successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Coast Guard notification failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Alert nearby boats about emergency
    async alertNearbyBoats(location, emergencyUserId) {
        try {
            // In real implementation, query database for boats within 10km radius
            const nearbyBoats = this.findNearbyBoats(location, 10);
            
            const emergencyUser = this.userContacts.get(emergencyUserId);
            const locationStr = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

            const smsBody = `🚨 URGENT: Nearby Fisherman Needs Help 🚨

Fisherman ${emergencyUser?.name || 'Unknown'} needs assistance.
Location: ${locationStr}
Time: ${new Date().toLocaleString()}

If you are nearby, please respond and provide assistance.
Contact Coast Guard if you cannot help directly.`;

            let successfulAlerts = 0;
            let failedAlerts = 0;

            // Send alerts to nearby boats
            for (const boat of nearbyBoats) {
                try {
                    if (boat.userId !== emergencyUserId) { // Don't alert the emergency user
                        await this.sendSMS(boat.phone, smsBody);
                        successfulAlerts++;
                    }
                } catch (error) {
                    console.error(`❌ Failed to alert boat ${boat.userId}:`, error);
                    failedAlerts++;
                }
            }

            return {
                success: true,
                alertsSent: successfulAlerts,
                alertsFailed: failedAlerts,
                totalNearbyBoats: nearbyBoats.length,
                message: `Alerted ${successfulAlerts} nearby boats`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Nearby boats alert failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Notify family/emergency contacts
    async notifyFamilyContacts(userId, emergencyMessage) {
        try {
            const user = this.userContacts.get(userId);
            
            if (!user || !user.emergencyContacts) {
                throw new Error('User or emergency contacts not found');
            }

            const smsBody = `🚨 EMERGENCY NOTIFICATION 🚨

Your family member ${user.name} has activated an emergency alert.

Message: ${emergencyMessage}
Time: ${new Date().toLocaleString()}
Boat: ${user.boatName}

Coast Guard and nearby boats have been notified. 
Please stay calm and wait for updates.`;

            let successfulNotifications = 0;
            let failedNotifications = 0;

            for (const contact of user.emergencyContacts) {
                try {
                    await this.sendSMS(contact.phone, smsBody);
                    successfulNotifications++;
                } catch (error) {
                    console.error(`❌ Failed to notify ${contact.name}:`, error);
                    failedNotifications++;
                }
            }

            return {
                success: true,
                contactsNotified: successfulNotifications,
                contactsFailed: failedNotifications,
                message: `Notified ${successfulNotifications} emergency contacts`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Family notification failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Send weather alert to user
    async sendWeatherAlert(userId, weatherAlert) {
        try {
            const user = this.userContacts.get(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            const smsBody = `🌪️ WEATHER ALERT 🌪️

Severity: ${weatherAlert.severity}
Alert: ${weatherAlert.description}
Recommendation: ${weatherAlert.recommendation}
Time: ${new Date().toLocaleString()}

Please take appropriate safety measures.`;

            await this.sendSMS(user.phone, smsBody);

            return {
                success: true,
                recipient: user.name,
                alertType: 'WEATHER',
                severity: weatherAlert.severity,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Weather alert notification failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Send safety warning
    async sendSafetyWarning(userId, warningData) {
        try {
            const user = this.userContacts.get(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            const smsBody = `⚠️ SAFETY WARNING ⚠️

Type: ${warningData.type}
Description: ${warningData.description}
Action Required: ${warningData.action}
Time: ${new Date().toLocaleString()}

Please review and take necessary precautions.`;

            await this.sendSMS(user.phone, smsBody);

            return {
                success: true,
                recipient: user.name,
                warningType: warningData.type,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Safety warning notification failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Send emergency resolution notification
    async sendEmergencyResolution(userId, emergencyId, resolutionData) {
        try {
            const user = this.userContacts.get(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            const smsBody = `✅ EMERGENCY RESOLVED ✅

Emergency ID: ${emergencyId}
Resolution: ${resolutionData.reason || 'Emergency successfully handled'}
Time: ${new Date().toLocaleString()}

The emergency situation has been resolved. 
Thank you for your cooperation.`;

            // Notify user
            await this.sendSMS(user.phone, smsBody);

            // Notify emergency contacts
            for (const contact of user.emergencyContacts) {
                await this.sendSMS(contact.phone, smsBody);
            }

            return {
                success: true,
                emergencyId,
                resolutionNotified: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Emergency resolution notification failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Send alert resolution notification
    async sendAlertResolution(alert, resolutionData) {
        try {
            if (!alert.userId) return { success: true, message: 'No user to notify' };

            const user = this.userContacts.get(alert.userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            const smsBody = `✅ ALERT RESOLVED ✅

Alert Type: ${alert.type}
Severity: ${alert.severity}
Resolution: ${resolutionData.reason || 'Alert condition cleared'}
Time: ${new Date().toLocaleString()}

The alert has been resolved and normal operations can resume.`;

            await this.sendSMS(user.phone, smsBody);

            return {
                success: true,
                alertId: alert.alertId,
                userNotified: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Alert resolution notification failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Send SMS using Twilio
    async sendSMS(to, body) {
        try {
            // In production, uncomment to send actual SMS
            if (process.env.NODE_ENV === 'production' && this.twilioClient) {
                await this.twilioClient.messages.create({
                    body: body,
                    from: this.twilioPhoneNumber,
                    to: to
                });
            }

            console.log(`📱 SMS sent to ${to}:`, body.substring(0, 100) + '...');
            
            return {
                success: true,
                to: to,
                messageId: `msg_${Date.now()}`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ SMS sending failed:', error);
            throw error;
        }
    }

    // Find nearby boats (mock implementation)
    findNearbyBoats(centerLocation, radiusKm) {
        // Mock data - in real app, query database
        const allBoats = [
            { userId: 'user_002', name: 'Suresh Patel', phone: '+919876543213', location: { lat: 19.0760, lng: 72.8777 } },
            { userId: 'user_003', name: 'Amit Sharma', phone: '+919876543216', location: { lat: 19.0800, lng: 72.8800 } },
            { userId: 'user_004', name: 'Vikram Singh', phone: '+919876543217', location: { lat: 19.0700, lng: 72.8700 } }
        ];

        return allBoats.filter(boat => {
            const distance = this.calculateDistance(
                centerLocation.lat, centerLocation.lng,
                boat.location.lat, boat.location.lng
            );
            return distance <= radiusKm;
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

    // Emergency contacts
    emergencyContacts = {
        COAST_GUARD: '+911800123456',
        LOCAL_AUTHORITIES: '+911800654321',
        NEAREST_HOSPITAL: '+911800111222'
    };

    // Get notification statistics
    getNotificationStats() {
        // In real implementation, track actual notification metrics
        return {
            totalUsers: this.userContacts.size,
            emergencyContacts: Array.from(this.userContacts.values()).reduce(
                (total, user) => total + (user.emergencyContacts?.length || 0), 0
            ),
            features: ['SMS', 'Emergency Alerts', 'Weather Warnings', 'Safety Notifications']
        };
    }
}

module.exports = NotificationService;
