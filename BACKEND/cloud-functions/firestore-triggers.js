const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// Trigger when a new user is created
exports.onUserCreated = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snapshot, context) => {
        try {
            const user = snapshot.data();
            const userId = context.params.userId;

            console.log(`👤 New user created: ${userId}`);

            // Initialize user statistics
            await db.collection('userStatistics').doc(userId).set({
                userId: userId,
                totalTrips: 0,
                totalCatch: 0,
                successfulTrips: 0,
                emergencyActivations: 0,
                communityPosts: 0,
                safetyReports: 0,
                catchReports: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            // Send welcome notification
            await db.collection('userNotifications').add({
                userId: userId,
                type: 'WELCOME',
                title: 'Welcome to SmartFishing!',
                message: 'Thank you for joining our community of safe and smart fishermen.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                read: false
            });

            // Log user registration
            await db.collection('auditLogs').add({
                action: 'USER_REGISTERED',
                userId: userId,
                userEmail: user.email,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                metadata: {
                    fisherman: user.fishermanProfile?.isFisherman || false
                }
            });

            console.log(`✅ User ${userId} initialized successfully`);

        } catch (error) {
            console.error('❌ User creation trigger failed:', error);
            throw error;
        }
    });

// Trigger when a user's location is updated
exports.onLocationUpdated = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        try {
            const before = change.before.data();
            const after = change.after.data();
            const userId = context.params.userId;

            // Check if location was updated
            const beforeLocation = before.location?.current;
            const afterLocation = after.location?.current;

            if (!beforeLocation || !afterLocation) return null;

            const locationChanged = 
                beforeLocation.coordinates?.lat !== afterLocation.coordinates?.lat ||
                beforeLocation.coordinates?.lng !== afterLocation.coordinates?.lng;

            if (!locationChanged) return null;

            console.log(`📍 Location updated for user ${userId}`);

            // Store location history
            await db.collection('locationHistory').add({
                userId: userId,
                coordinates: afterLocation.coordinates,
                accuracy: afterLocation.accuracy,
                speed: afterLocation.speed,
                heading: afterLocation.heading,
                timestamp: afterLocation.timestamp,
                source: afterLocation.source
            });

            // Check if user went offshore
            const isOffshore = await checkOffshoreStatus(userId, after);
            if (isOffshore) {
                await handleOffshoreUser(userId, after);
            }

            // Update user's online status
            await change.after.ref.update({
                'location.isOnline': true,
                'location.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('❌ Location update trigger failed:', error);
            throw error;
        }
    });

// Check if user is offshore
async function checkOffshoreStatus(userId, userData) {
    try {
        const homePort = userData.location?.homePort;
        const currentLocation = userData.location?.current;

        if (!homePort || !currentLocation) return false;

        const distance = calculateDistance(
            homePort.coordinates.lat, homePort.coordinates.lng,
            currentLocation.coordinates.lat, currentLocation.coordinates.lng
        );

        const maxOffshoreDistance = userData.safetySettings?.maxOffshoreDistance || 20;
        
        return distance > maxOffshoreDistance;

    } catch (error) {
        console.error('Check offshore status error:', error);
        return false;
    }
}

// Handle offshore user
async function handleOffshoreUser(userId, userData) {
    try {
        const currentLocation = userData.location.current;

        // Check if we already have an active offshore alert for this user
        const existingAlert = await db.collection('alerts')
            .where('userId', '==', userId)
            .where('type', '==', 'OFFSHORE')
            .where('status', '==', 'ACTIVE')
            .get();

        if (!existingAlert.empty) return;

        // Create offshore alert
        const alertId = `offshore_${userId}_${Date.now()}`;

        await db.collection('alerts').doc(alertId).set({
            id: alertId,
            userId: userId,
            type: 'OFFSHORE',
            title: 'Fisherman Went Offshore',
            description: `${userData.profile?.firstName} has gone beyond the safe offshore distance.`,
            location: currentLocation.coordinates,
            severity: 'MEDIUM',
            status: 'ACTIVE',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
        });

        // Notify emergency contacts
        await notifyEmergencyContacts(userId, userData, 'OFFSHORE');

        console.log(`🌊 Offshore alert created for user ${userId}`);

    } catch (error) {
        console.error('Handle offshore user error:', error);
    }
}

// Trigger when an SOS alert is created
exports.onSOSCreated = functions.firestore
    .document('alerts/{alertId}')
    .onCreate(async (snapshot, context) => {
        try {
            const alert = snapshot.data();
            const alertId = context.params.alertId;

            if (alert.type !== 'SOS') return null;

            console.log(`🚨 SOS alert created: ${alertId}`);

            // Get user details
            const userDoc = await db.collection('users').doc(alert.userId).get();
            if (!userDoc.exists) return null;

            const user = userDoc.data();

            // Notify emergency contacts
            await notifyEmergencyContacts(alert.userId, user, 'SOS');

            // Notify nearby fishermen
            await notifyNearbyFishermen(alert, user);

            // Notify authorities
            await notifyAuthorities(alert, user);

            // Update user statistics
            await db.collection('userStatistics').doc(alert.userId).update({
                emergencyActivations: admin.firestore.FieldValue.increment(1),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            // Log SOS event
            await db.collection('auditLogs').add({
                action: 'SOS_ACTIVATED',
                userId: alert.userId,
                alertId: alertId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                location: alert.location,
                severity: alert.severity
            });

            console.log(`✅ SOS alert ${alertId} processed successfully`);

        } catch (error) {
            console.error('❌ SOS trigger failed:', error);
            throw error;
        }
    });

// Notify emergency contacts
async function notifyEmergencyContacts(userId, userData, alertType) {
    try {
        const emergencyContacts = userData.emergencyContacts || [];
        
        if (emergencyContacts.length === 0) {
            console.log(`⚠️ No emergency contacts found for user ${userId}`);
            return;
        }

        const notificationPromises = emergencyContacts.map(contact => {
            return db.collection('smsQueue').add({
                to: contact.phone,
                message: generateEmergencyMessage(alertType, userData, contact),
                priority: 'HIGH',
                status: 'PENDING',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await Promise.all(notificationPromises);
        console.log(`📞 Notified ${emergencyContacts.length} emergency contacts for user ${userId}`);

    } catch (error) {
        console.error('Notify emergency contacts error:', error);
    }
}

// Notify nearby fishermen
async function notifyNearbyFishermen(alert, user) {
    try {
        if (!alert.location) return;

        // Get fishermen within 20km
        const fishermenSnapshot = await db.collection('users')
            .where('fishermanProfile.isFisherman', '==', true)
            .where('status', '==', 'ACTIVE')
            .where('location.isOnline', '==', true)
            .get();

        const notifications = [];

        fishermenSnapshot.forEach(doc => {
            const fisherman = doc.data();
            
            if (fisherman.userId === alert.userId) return; // Skip the user in distress

            if (fisherman.location?.current) {
                const distance = calculateDistance(
                    alert.location.lat, alert.location.lng,
                    fisherman.location.current.lat, fisherman.location.current.lng
                );

                if (distance <= 20) { // 20km radius
                    notifications.push(
                        db.collection('userNotifications').add({
                            userId: doc.id,
                            type: 'EMERGENCY_NEARBY',
                            title: 'Emergency Nearby',
                            message: `${user.profile?.firstName} needs assistance nearby.`,
                            alertId: alert.id,
                            location: alert.location,
                            distance: Math.round(distance),
                            timestamp: admin.firestore.FieldValue.serverTimestamp(),
                            priority: 'HIGH'
                        })
                    );
                }
            }
        });

        await Promise.all(notifications);
        console.log(`📢 Notified ${notifications.length} nearby fishermen about emergency`);

    } catch (error) {
        console.error('Notify nearby fishermen error:', error);
    }
}

// Notify authorities
async function notifyAuthorities(alert, user) {
    try {
        // In real implementation, integrate with coast guard/authorities API
        // For now, log the event and add to SMS queue

        const authorityMessage = `🚨 MARINE EMERGENCY 🚨
Fisherman: ${user.profile?.firstName} ${user.profile?.lastName}
Location: ${alert.location.lat}, ${alert.location.lng}
Time: ${new Date().toLocaleString()}
Emergency: ${alert.description}`;

        await db.collection('smsQueue').add({
            to: '+911800123456', // Mock coast guard number
            message: authorityMessage,
            priority: 'CRITICAL',
            status: 'PENDING',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('📞 Notified authorities about emergency');

    } catch (error) {
        console.error('Notify authorities error:', error);
    }
}

// Trigger when a catch report is created
exports.onCatchReportCreated = functions.firestore
    .document('catchReports/{reportId}')
    .onCreate(async (snapshot, context) => {
        try {
            const catchReport = snapshot.data();
            const reportId = context.params.reportId;

            console.log(`🎣 Catch report created: ${reportId}`);

            // Update user statistics
            await db.collection('userStatistics').doc(catchReport.userId).update({
                catchReports: admin.firestore.FieldValue.increment(1),
                totalCatch: admin.firestore.FieldValue.increment(catchReport.totalWeight || 0),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update community analytics
            await updateCommunityAnalytics(catchReport);

            // Check for fishing patterns
            await analyzeFishingPatterns(catchReport);

            console.log(`✅ Catch report ${reportId} processed successfully`);

        } catch (error) {
            console.error('❌ Catch report trigger failed:', error);
            throw error;
        }
    });

// Update community analytics
async function updateCommunityAnalytics(catchReport) {
    try {
        const today = new Date().toISOString().split('T')[0];

        const analyticsRef = db.collection('communityAnalytics').doc(today);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(analyticsRef);

            if (doc.exists) {
                const data = doc.data();
                transaction.update(analyticsRef, {
                    totalCatches: data.totalCatches + 1,
                    totalWeight: data.totalWeight + (catchReport.totalWeight || 0),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                transaction.set(analyticsRef, {
                    date: today,
                    totalCatches: 1,
                    totalWeight: catchReport.totalWeight || 0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        });

    } catch (error) {
        console.error('Update community analytics error:', error);
    }
}

// Analyze fishing patterns
async function analyzeFishingPatterns(catchReport) {
    try {
        // Get recent catch reports for this user
        const recentCatches = await db.collection('catchReports')
            .where('userId', '==', catchReport.userId)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        if (recentCatches.size < 3) return; // Need more data for pattern analysis

        const catches = recentCatches.docs.map(doc => doc.data());

        // Simple pattern analysis (in real app, use ML)
        const successfulTrips = catches.filter(c => (c.totalWeight || 0) > 20).length;
        const successRate = (successfulTrips / catches.length) * 100;

        // Update user's fishing patterns if significant
        if (catches.length >= 5) {
            await db.collection('userFishingPatterns').doc(catchReport.userId).set({
                userId: catchReport.userId,
                successRate: successRate,
                averageCatch: catches.reduce((sum, c) => sum + (c.totalWeight || 0), 0) / catches.length,
                commonSpecies: getCommonSpecies(catches),
                preferredLocations: getPreferredLocations(catches),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

    } catch (error) {
        console.error('Analyze fishing patterns error:', error);
    }
}

// Get common species from catches
function getCommonSpecies(catches) {
    const speciesCount = {};
    
    catches.forEach(catchReport => {
        catchReport.species?.forEach(species => {
            speciesCount[species] = (speciesCount[species] || 0) + 1;
        });
    });

    return Object.entries(speciesCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([species]) => species);
}

// Get preferred locations from catches
function getPreferredLocations(catches) {
    const locationCount = {};
    
    catches.forEach(catchReport => {
        if (catchReport.location) {
            const key = `${catchReport.location.lat.toFixed(4)},${catchReport.location.lng.toFixed(4)}`;
            locationCount[key] = (locationCount[key] || 0) + 1;
        }
    });

    return Object.entries(locationCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([location]) => {
            const [lat, lng] = location.split(',').map(Number);
            return { lat, lng };
        });
}

// Generate emergency message
function generateEmergencyMessage(alertType, userData, contact) {
    const userName = `${userData.profile?.firstName} ${userData.profile?.lastName}`;
    
    const messages = {
        'SOS': `🚨 EMERGENCY ALERT 🚨
${userName} has activated SOS emergency.
Please contact them immediately at ${userData.phone}.
Location shared via SmartFishing app.`,

        'OFFSHORE': `⚠️ SAFETY ALERT ⚠️
${userName} has gone beyond safe offshore distance.
Current location shared via SmartFishing app.
Please check on their safety.`
    };

    return messages[alertType] || `Alert for ${userName}. Please check SmartFishing app for details.`;
}

// Calculate distance between coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = {
    onUserCreated: exports.onUserCreated,
    onLocationUpdated: exports.onLocationUpdated,
    onSOSCreated: exports.onSOSCreated,
    onCatchReportCreated: exports.onCatchReportCreated
};
