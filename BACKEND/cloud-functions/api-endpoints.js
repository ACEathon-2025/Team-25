const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: No token provided'
            });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid token'
        });
    }
};

// User Management Endpoints

// Get user profile
app.get('/user/profile', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: userDoc.data()
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user profile'
        });
    }
});

// Update user profile
app.put('/user/profile', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData.userId;
        delete updateData.email;
        delete updateData.createdAt;

        await db.collection('users').doc(userId).update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});

// Weather Endpoints

// Get current weather for location
app.get('/weather/current', authenticate, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const coordinates = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };

        // Get latest weather data for location
        const weatherQuery = await db.collection('weatherData')
            .where('coordinates', '==', coordinates)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (weatherQuery.empty) {
            return res.status(404).json({
                success: false,
                error: 'No weather data available for this location'
            });
        }

        const weatherData = weatherQuery.docs[0].data();

        res.json({
            success: true,
            weather: weatherData.data,
            location: coordinates,
            timestamp: weatherData.timestamp
        });

    } catch (error) {
        console.error('Get weather error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get weather data'
        });
    }
});

// Alert Endpoints

// Get active alerts for location
app.get('/alerts/active', authenticate, async (req, res) => {
    try {
        const { lat, lng, radius = 50 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const coordinates = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };

        const now = admin.firestore.Timestamp.now();

        // Query for active alerts near location
        const alertsQuery = await db.collection('alerts')
            .where('status', '==', 'ACTIVE')
            .where('expiresAt', '>', now)
            .get();

        // Filter alerts by distance (client-side filtering for simplicity)
        const nearbyAlerts = alertsQuery.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(alert => {
                if (!alert.location) return false;
                
                const distance = calculateDistance(
                    coordinates.lat, coordinates.lng,
                    alert.location.lat, alert.location.lng
                );
                
                return distance <= radius;
            })
            .sort((a, b) => {
                // Sort by severity and timestamp
                const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return (severityOrder[b.severity] - severityOrder[a.severity]) || 
                       (b.timestamp - a.timestamp);
            });

        res.json({
            success: true,
            alerts: nearbyAlerts,
            total: nearbyAlerts.length,
            location: coordinates,
            radius: radius
        });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get alerts'
        });
    }
});

// Create new alert
app.post('/alerts', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;
        const alertData = req.body;

        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const alert = {
            id: alertId,
            userId: userId,
            type: alertData.type,
            title: alertData.title,
            description: alertData.description,
            location: alertData.location,
            severity: alertData.severity || 'MEDIUM',
            status: 'ACTIVE',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: alertData.expiresAt || 
                new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours default
        };

        await db.collection('alerts').doc(alertId).set(alert);

        // Notify nearby users (in real app, implement push notifications)
        await notifyNearbyUsers(alert);

        res.json({
            success: true,
            alertId: alertId,
            alert: alert,
            message: 'Alert created successfully'
        });

    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create alert'
        });
    }
});

// Community Endpoints

// Get community posts
app.get('/community/posts', authenticate, async (req, res) => {
    try {
        const { lat, lng, radius = 50, category = 'ALL', limit = 20 } = req.query;
        
        const coordinates = lat && lng ? {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        } : null;

        let postsQuery = db.collection('communityPosts')
            .where('status', '==', 'ACTIVE')
            .where('expiresAt', '>', admin.firestore.FieldValue.serverTimestamp())
            .orderBy('timestamp', 'desc')
            .limit(parseInt(limit));

        // If category specified, filter by category
        if (category !== 'ALL') {
            postsQuery = postsQuery.where('category', '==', category);
        }

        const postsSnapshot = await postsQuery.get();

        let posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter by location if provided
        if (coordinates) {
            posts = posts.filter(post => {
                if (!post.location) return false;
                
                const distance = calculateDistance(
                    coordinates.lat, coordinates.lng,
                    post.location.lat, post.location.lng
                );
                
                return distance <= radius;
            });
        }

        res.json({
            success: true,
            posts: posts,
            total: posts.length,
            location: coordinates,
            radius: radius
        });

    } catch (error) {
        console.error('Get community posts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get community posts'
        });
    }
});

// Create community post
app.post('/community/posts', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;
        const postData = req.body;

        const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const post = {
            id: postId,
            userId: userId,
            type: postData.type || 'GENERAL',
            title: postData.title,
            content: postData.content,
            location: postData.location,
            category: postData.category || 'GENERAL',
            likes: 0,
            comments: [],
            status: 'ACTIVE',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: postData.expiresAt || 
                new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
        };

        await db.collection('communityPosts').doc(postId).set(post);

        res.json({
            success: true,
            postId: postId,
            post: post,
            message: 'Post created successfully'
        });

    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create post'
        });
    }
});

// Analytics Endpoints

// Get user statistics
app.get('/analytics/user', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;

        // Get user's catch reports
        const catchQuery = await db.collection('catchReports')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const catchReports = catchQuery.docs.map(doc => doc.data());

        // Calculate statistics
        const totalCatch = catchReports.reduce((sum, report) => sum + (report.totalWeight || 0), 0);
        const totalTrips = catchReports.length;
        const avgCatch = totalTrips > 0 ? totalCatch / totalTrips : 0;

        // Get most caught species
        const speciesCount = {};
        catchReports.forEach(report => {
            report.species?.forEach(species => {
                speciesCount[species] = (speciesCount[species] || 0) + 1;
            });
        });

        const topSpecies = Object.entries(speciesCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([species, count]) => ({ species, count }));

        res.json({
            success: true,
            statistics: {
                totalTrips,
                totalCatch,
                averageCatch: Math.round(avgCatch * 100) / 100,
                topSpecies,
                recentActivity: catchReports.slice(0, 10)
            }
        });

    } catch (error) {
        console.error('Get user analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user analytics'
        });
    }
});

// Get community statistics
app.get('/analytics/community', authenticate, async (req, res) => {
    try {
        const { lat, lng, radius = 50 } = req.query;

        const coordinates = lat && lng ? {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        } : null;

        // Get community stats (simplified - in real app, use aggregation queries)
        const [
            usersSnapshot,
            postsSnapshot,
            catchesSnapshot,
            alertsSnapshot
        ] = await Promise.all([
            db.collection('users')
                .where('status', '==', 'ACTIVE')
                .where('fishermanProfile.isFisherman', '==', true)
                .get(),
            db.collection('communityPosts')
                .where('status', '==', 'ACTIVE')
                .get(),
            db.collection('catchReports')
                .where('timestamp', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                .get(),
            db.collection('alerts')
                .where('status', '==', 'ACTIVE')
                .get()
        ]);

        res.json({
            success: true,
            statistics: {
                totalFishermen: usersSnapshot.size,
                activePosts: postsSnapshot.size,
                recentCatches: catchesSnapshot.size,
                activeAlerts: alertsSnapshot.size,
                location: coordinates,
                radius: radius
            }
        });

    } catch (error) {
        console.error('Get community analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get community analytics'
        });
    }
});

// Utility Functions

// Calculate distance between coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (l2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Notify nearby users about alert
async function notifyNearbyUsers(alert) {
    try {
        if (!alert.location) return;

        // Get users within 50km of alert location
        const usersSnapshot = await db.collection('users')
            .where('status', '==', 'ACTIVE')
            .where('location.isOnline', '==', true)
            .get();

        const notifications = usersSnapshot.docs.map(doc => {
            const user = doc.data();
            
            if (!user.location?.current) return null;

            const distance = calculateDistance(
                alert.location.lat, alert.location.lng,
                user.location.current.lat, user.location.current.lng
            );

            if (distance <= 50) {
                return db.collection('userNotifications').add({
                    userId: doc.id,
                    type: 'ALERT',
                    title: alert.title,
                    message: alert.description,
                    alertId: alert.id,
                    severity: alert.severity,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
            }

            return null;
        }).filter(Boolean);

        await Promise.all(notifications);
        
        console.log(`📢 Notified ${notifications.length} users about alert ${alert.id}`);

    } catch (error) {
        console.error('Notify nearby users error:', error);
    }
}

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Basic health check
        await db.collection('healthCheck').doc('ping').set({
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'SmartFishing API'
        });

    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Export the Express app as Firebase Cloud Function
exports.api = functions.https.onRequest(app);

module.exports = app;
