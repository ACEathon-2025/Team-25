const express = require('express');
const router = express.Router();
const { errorHandler } = require('../utils/error-handler');
const { validators } = require('../utils/validators');
const { helpers } = require('../utils/helpers');

// Mock user database
let users = [
    {
        id: 'user_001',
        name: 'Raj Kumar',
        phone: '+919876543210',
        email: 'raj.kumar@example.com',
        location: { lat: 19.0760, lng: 72.8777 },
        village: 'Mumbai Fishing Village',
        language: 'en',
        preferences: {
            alerts: true,
            smsAlerts: true,
            weatherUpdates: true,
            fishingTips: true
        },
        emergencyContacts: [
            { name: 'Coast Guard', phone: '+911234567890' },
            { name: 'Local Police', phone: '+911234567891' }
        ],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
    }
];

// GET /api/users/profile - Get user profile
router.get('/profile', errorHandler.catchAsync(async (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'User ID is required'
        });
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    res.json({
        success: true,
        user: user
    });
}));

// POST /api/users/register - Register new user
router.post('/register', errorHandler.catchAsync(async (req, res) => {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.name || !userData.phone) {
        return res.status(400).json({
            success: false,
            error: 'Name and phone number are required'
        });
    }
    
    // Validate phone number
    if (!validators.validatePhoneNumber(userData.phone)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid phone number format'
        });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.phone === userData.phone);
    if (existingUser) {
        return res.status(409).json({
            success: false,
            error: 'User with this phone number already exists'
        });
    }
    
    // Create new user
    const newUser = {
        id: 'user_' + Date.now(),
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        location: userData.location || { lat: 0, lng: 0 },
        village: userData.village || 'Unknown',
        language: userData.language || 'en',
        preferences: {
            alerts: true,
            smsAlerts: true,
            weatherUpdates: true,
            fishingTips: true,
            ...userData.preferences
        },
        emergencyContacts: userData.emergencyContacts || [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
    };
    
    users.push(newUser);
    
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: newUser
    });
}));

// PUT /api/users/profile - Update user profile
router.put('/profile', errorHandler.catchAsync(async (req, res) => {
    const { userId, updates } = req.body;
    
    if (!userId || !updates) {
        return res.status(400).json({
            success: false,
            error: 'User ID and updates are required'
        });
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    // Update user fields
    users[userIndex] = {
        ...users[userIndex],
        ...updates,
        lastActive: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: users[userIndex]
    });
}));

// PUT /api/users/preferences - Update user preferences
router.put('/preferences', errorHandler.catchAsync(async (req, res) => {
    const { userId, preferences } = req.body;
    
    if (!userId || !preferences) {
        return res.status(400).json({
            success: false,
            error: 'User ID and preferences are required'
        });
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    // Update preferences
    users[userIndex].preferences = {
        ...users[userIndex].preferences,
        ...preferences
    };
    
    users[userIndex].lastActive = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: users[userIndex].preferences
    });
}));

// POST /api/users/emergency-contacts - Add emergency contact
router.post('/emergency-contacts', errorHandler.catchAsync(async (req, res) => {
    const { userId, contact } = req.body;
    
    if (!userId || !contact || !contact.name || !contact.phone) {
        return res.status(400).json({
            success: false,
            error: 'User ID and contact details (name, phone) are required'
        });
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    // Validate phone number
    if (!validators.validatePhoneNumber(contact.phone)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid phone number format for emergency contact'
        });
    }
    
    // Add emergency contact
    users[userIndex].emergencyContacts.push(contact);
    users[userIndex].lastActive = new Date().toISOString();
    
    res.status(201).json({
        success: true,
        message: 'Emergency contact added successfully',
        emergencyContacts: users[userIndex].emergencyContacts
    });
}));

// GET /api/users/stats - Get user statistics
router.get('/stats', errorHandler.catchAsync(async (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'User ID is required'
        });
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    // Simulate user statistics (replace with actual data)
    const userStats = {
        totalTrips: 15,
        successfulTrips: 12,
        totalCatch: 450, // kg
        averageCatch: 30, // kg per trip
        safetyScore: 85, // percentage
        alertsReceived: 8,
        emergenciesReported: 1,
        zoneSuggestions: 3
    };
    
    res.json({
        success: true,
        stats: userStats
    });
}));

// POST /api/users/location - Update user location
router.post('/location', errorHandler.catchAsync(async (req, res) => {
    const { userId, location } = req.body;
    
    if (!userId || !location) {
        return res.status(400).json({
            success: false,
            error: 'User ID and location are required'
        });
    }
    
    // Validate coordinates
    if (!validators.validateCoordinates(location.lat, location.lng)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid coordinates provided'
        });
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    // Update location
    users[userIndex].location = location;
    users[userIndex].lastActive = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'Location updated successfully',
        location: location
    });
}));

module.exports = router;
