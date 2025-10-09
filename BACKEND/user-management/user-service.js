const bcrypt = require('bcryptjs');
const { User, UserStats } = require('./user-model');

class UserService {
    constructor() {
        this.users = new Map(); // In-memory storage for demo
        this.sessions = new Map();
        this.initializeSampleUsers();
    }

    // Initialize sample users for demo
    initializeSampleUsers() {
        const sampleUsers = [
            {
                userId: 'user_001',
                name: 'Rajesh Kumar',
                phone: '+919876543210',
                email: 'rajesh@fisherman.com',
                password: this.hashPassword('password123'),
                boatInfo: {
                    name: 'Sea Explorer',
                    type: 'Traditional Fishing Boat',
                    registration: 'MH-2023-F001',
                    capacity: 8
                },
                emergencyContacts: [
                    { name: 'Wife - Priya', phone: '+919876543211', relationship: 'Spouse' },
                    { name: 'Brother - Sanjay', phone: '+919876543212', relationship: 'Sibling' }
                ],
                fishingExperience: 15, // years
                preferredFishingZones: ['Mumbai Coast', 'Alibaug Waters'],
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                status: 'active'
            },
            {
                userId: 'user_002',
                name: 'Suresh Patel',
                phone: '+919876543213',
                email: 'suresh@fisherman.com',
                password: this.hashPassword('password123'),
                boatInfo: {
                    name: 'Ocean Warrior',
                    type: 'Mechanized Fishing Vessel',
                    registration: 'MH-2023-F002',
                    capacity: 12
                },
                emergencyContacts: [
                    { name: 'Son - Rohan', phone: '+919876543214', relationship: 'Child' },
                    { name: 'Fishing Partner - Amit', phone: '+919876543215', relationship: 'Partner' }
                ],
                fishingExperience: 22,
                preferredFishingZones: ['Uran Coast', 'Elephanta Island'],
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                status: 'active'
            }
        ];

        sampleUsers.forEach(user => {
            this.users.set(user.userId, user);
        });
    }

    // Register new user
    async registerUser(userData) {
        try {
            console.log('👤 Registering new user:', userData.name);

            // Validate required fields
            if (!userData.name || !userData.phone || !userData.password) {
                throw new Error('Name, phone, and password are required');
            }

            // Check if user already exists
            const existingUser = Array.from(this.users.values()).find(
                user => user.phone === userData.phone
            );

            if (existingUser) {
                throw new Error('User with this phone number already exists');
            }

            // Generate user ID
            const userId = this.generateUserId();
            
            // Hash password
            const hashedPassword = this.hashPassword(userData.password);

            // Create user object
            const newUser = {
                userId,
                name: userData.name,
                phone: userData.phone,
                email: userData.email,
                password: hashedPassword,
                boatInfo: userData.boatInfo || {},
                emergencyContacts: userData.emergencyContacts || [],
                fishingExperience: userData.fishingExperience || 0,
                preferredFishingZones: userData.preferredFishingZones || [],
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                status: 'active',
                profileComplete: false
            };

            // Store user
            this.users.set(userId, newUser);

            // Initialize user statistics
            await this.initializeUserStats(userId);

            console.log('✅ User registered successfully:', userId);
            
            return {
                userId,
                name: newUser.name,
                phone: newUser.phone,
                message: 'Registration successful'
            };

        } catch (error) {
            console.error('❌ User registration failed:', error);
            throw error;
        }
    }

    // User login
    async loginUser(phone, password) {
        try {
            console.log('🔐 User login attempt:', phone);

            // Find user by phone
            const user = Array.from(this.users.values()).find(
                u => u.phone === phone
            );

            if (!user) {
                throw new Error('User not found');
            }

            // Verify password
            const isPasswordValid = this.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid password');
            }

            // Check if user is active
            if (user.status !== 'active') {
                throw new Error('User account is not active');
            }

            // Update last active
            user.lastActive = new Date().toISOString();
            this.users.set(user.userId, user);

            // Generate session token
            const sessionToken = this.generateSessionToken();
            this.sessions.set(sessionToken, {
                userId: user.userId,
                loginTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            });

            console.log('✅ User login successful:', user.userId);

            return {
                sessionToken,
                user: {
                    userId: user.userId,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    boatInfo: user.boatInfo
                },
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

        } catch (error) {
            console.error('❌ User login failed:', error);
            throw error;
        }
    }

    // Get user profile
    async getUserProfile(userId) {
        try {
            const user = this.users.get(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Get user statistics
            const stats = await this.getUserStatistics(userId);

            // Return profile without sensitive data
            return {
                userId: user.userId,
                name: user.name,
                phone: user.phone,
                email: user.email,
                boatInfo: user.boatInfo,
                emergencyContacts: user.emergencyContacts,
                fishingExperience: user.fishingExperience,
                preferredFishingZones: user.preferredFishingZones,
                createdAt: user.createdAt,
                lastActive: user.lastActive,
                status: user.status,
                statistics: stats
            };

        } catch (error) {
            console.error('❌ User profile fetch failed:', error);
            throw error;
        }
    }

    // Update user profile
    async updateUserProfile(userId, updates) {
        try {
            const user = this.users.get(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Allowed fields for update
            const allowedUpdates = [
                'name', 'email', 'boatInfo', 'fishingExperience', 
                'preferredFishingZones', 'emergencyContacts'
            ];

            // Apply updates
            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined) {
                    user[field] = updates[field];
                }
            });

            user.lastActive = new Date().toISOString();
            this.users.set(userId, user);

            console.log('✅ User profile updated:', userId);

            return await this.getUserProfile(userId);

        } catch (error) {
            console.error('❌ User profile update failed:', error);
            throw error;
        }
    }

    // Update emergency contacts
    async updateEmergencyContacts(userId, emergencyContacts) {
        try {
            const user = this.users.get(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Validate emergency contacts
            if (!Array.isArray(emergencyContacts)) {
                throw new Error('Emergency contacts must be an array');
            }

            user.emergencyContacts = emergencyContacts;
            user.lastActive = new Date().toISOString();
            this.users.set(userId, user);

            console.log('✅ Emergency contacts updated for user:', userId);

            return {
                success: true,
                emergencyContacts: user.emergencyContacts
            };

        } catch (error) {
            console.error('❌ Emergency contacts update failed:', error);
            throw error;
        }
    }

    // Get user statistics
    async getUserStatistics(userId) {
        try {
            // In real implementation, this would query the database
            // For demo, return mock statistics
            return {
                totalTrips: Math.floor(Math.random() * 100) + 10,
                totalCatch: Math.floor(Math.random() * 5000) + 500, // kg
                averageCatch: Math.floor(Math.random() * 50) + 10, // kg per trip
                favoriteSpecies: ['Pomfret', 'Mackerel', 'Bombay Duck'],
                successRate: Math.floor(Math.random() * 30) + 60, // percentage
                hoursAtSea: Math.floor(Math.random() * 2000) + 500,
                emergencyActivations: Math.floor(Math.random() * 5),
                communityContributions: Math.floor(Math.random() * 50) + 5
            };

        } catch (error) {
            console.error('❌ User statistics fetch failed:', error);
            return {};
        }
    }

    // Get user activity feed
    async getUserActivity(userId, limit = 10) {
        try {
            // Mock activity data - in real app, this would come from database
            const activities = [
                {
                    type: 'FISHING_TRIP',
                    description: 'Started fishing trip at Mumbai Coast',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    location: { lat: 19.0760, lng: 72.8777 },
                    details: { catch: '25 kg', duration: '3 hours' }
                },
                {
                    type: 'SPOT_SHARED',
                    description: 'Shared fishing spot with community',
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                    location: { lat: 19.0800, lng: 72.8800 },
                    details: { species: 'Pomfret', rating: 4 }
                },
                {
                    type: 'WEATHER_ALERT',
                    description: 'Received storm warning alert',
                    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                    details: { severity: 'HIGH', action: 'Returned to shore' }
                },
                {
                    type: 'PROFILE_UPDATE',
                    description: 'Updated emergency contacts',
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    details: { contactsAdded: 2 }
                }
            ];

            return activities.slice(0, limit);

        } catch (error) {
            console.error('❌ User activity fetch failed:', error);
            return [];
        }
    }

    // Verify session token
    async verifySession(token) {
        try {
            const session = this.sessions.get(token);
            
            if (!session) {
                return { valid: false, reason: 'Session not found' };
            }

            if (new Date() > session.expiresAt) {
                this.sessions.delete(token);
                return { valid: false, reason: 'Session expired' };
            }

            const user = this.users.get(session.userId);
            if (!user || user.status !== 'active') {
                return { valid: false, reason: 'User not active' };
            }

            return {
                valid: true,
                userId: session.userId,
                user: user
            };

        } catch (error) {
            console.error('❌ Session verification failed:', error);
            return { valid: false, reason: 'Verification error' };
        }
    }

    // Initialize user statistics
    async initializeUserStats(userId) {
        // In real implementation, create stats record in database
        console.log('📊 Initializing user statistics for:', userId);
        return true;
    }

    // Utility methods
    hashPassword(password) {
        // In real implementation, use bcrypt
        // For demo, simple hash
        return Buffer.from(password).toString('base64');
    }

    verifyPassword(password, hashedPassword) {
        return Buffer.from(password).toString('base64') === hashedPassword;
    }

    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSessionToken() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    }

    // Get all users (for admin purposes)
    async getAllUsers() {
        return Array.from(this.users.values()).map(user => ({
            userId: user.userId,
            name: user.name,
            phone: user.phone,
            status: user.status,
            lastActive: user.lastActive
        }));
    }

    // Get service statistics
    getServiceStats() {
        return {
            totalUsers: this.users.size,
            activeSessions: this.sessions.size,
            userStatus: {
                active: Array.from(this.users.values()).filter(u => u.status === 'active').length,
                inactive: Array.from(this.users.values()).filter(u => u.status !== 'active').length
            }
        };
    }
}

module.exports = UserService;
