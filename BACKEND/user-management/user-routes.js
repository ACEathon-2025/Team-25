const express = require('express');
const router = express.Router();
const UserService = require('./user-service');
const LocationTracker = require('./location-tracker');
const CommunityFeatures = require('./community-features');

const userService = new UserService();
const locationTracker = new LocationTracker();
const communityFeatures = new CommunityFeatures();

// User registration
router.post('/register', async (req, res) => {
    try {
        const { name, phone, email, password, boatInfo, emergencyContacts } = req.body;
        
        const result = await userService.registerUser({
            name,
            phone,
            email,
            password,
            boatInfo,
            emergencyContacts
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ User registration failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        const result = await userService.loginUser(phone, password);

        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });

    } catch (error) {
        console.error('❌ User login failed:', error);
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userProfile = await userService.getUserProfile(userId);

        res.json({
            success: true,
            data: userProfile
        });

    } catch (error) {
        console.error('❌ Profile fetch failed:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        
        const updatedProfile = await userService.updateUserProfile(userId, updates);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        });

    } catch (error) {
        console.error('❌ Profile update failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Update user location
router.post('/location/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { location, timestamp, status } = req.body;
        
        const result = await locationTracker.updateUserLocation(userId, location, timestamp, status);

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ Location update failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get user location history
router.get('/location/:userId/history', async (req, res) => {
    try {
        const { userId } = req.params;
        const { hours = 24 } = req.query;
        
        const history = await locationTracker.getLocationHistory(userId, parseInt(hours));

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('❌ Location history fetch failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get nearby fishermen
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query;
        
        const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
        const nearbyUsers = await communityFeatures.getNearbyFishermen(location, parseFloat(radius));

        res.json({
            success: true,
            data: nearbyUsers
        });

    } catch (error) {
        console.error('❌ Nearby users fetch failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Share fishing spot
router.post('/share-spot', async (req, res) => {
    try {
        const { userId, location, description, fishSpecies, catchAmount } = req.body;
        
        const result = await communityFeatures.shareFishingSpot(userId, location, {
            description,
            fishSpecies,
            catchAmount
        });

        res.json({
            success: true,
            message: 'Fishing spot shared successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ Fishing spot share failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get shared spots
router.get('/shared-spots', async (req, res) => {
    try {
        const { lat, lng, radius = 20, limit = 10 } = req.query;
        const location = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
        
        const spots = await communityFeatures.getSharedFishingSpots(location, parseFloat(radius), parseInt(limit));

        res.json({
            success: true,
            data: spots
        });

    } catch (error) {
        console.error('❌ Shared spots fetch failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Send message to community
router.post('/message', async (req, res) => {
    try {
        const { userId, message, location, urgency } = req.body;
        
        const result = await communityFeatures.sendCommunityMessage(userId, message, location, urgency);

        res.json({
            success: true,
            message: 'Message sent to community',
            data: result
        });

    } catch (error) {
        console.error('❌ Community message failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get community messages
router.get('/messages', async (req, res) => {
    try {
        const { lat, lng, radius = 50, limit = 20 } = req.query;
        const location = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
        
        const messages = await communityFeatures.getCommunityMessages(location, parseFloat(radius), parseInt(limit));

        res.json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('❌ Community messages fetch failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get user statistics
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const stats = await userService.getUserStatistics(userId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ User stats fetch failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Update emergency contacts
router.put('/emergency-contacts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { emergencyContacts } = req.body;
        
        const result = await userService.updateEmergencyContacts(userId, emergencyContacts);

        res.json({
            success: true,
            message: 'Emergency contacts updated successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ Emergency contacts update failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get user activity feed
router.get('/activity/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;
        
        const activity = await userService.getUserActivity(userId, parseInt(limit));

        res.json({
            success: true,
            data: activity
        });

    } catch (error) {
        console.error('❌ User activity fetch failed:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Health check for user management
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'User Management API is healthy',
        timestamp: new Date().toISOString(),
        services: {
            userService: 'Operational',
            locationTracker: 'Operational',
            communityFeatures: 'Operational'
        }
    });
});

module.exports = router;
