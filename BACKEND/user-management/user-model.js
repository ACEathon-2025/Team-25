const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
    // Basic Information
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    // Personal Information
    profile: {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        dateOfBirth: {
            type: Date
        },
        gender: {
            type: String,
            enum: ['MALE', 'FEMALE', 'OTHER'],
            default: 'MALE'
        },
        avatar: {
            type: String, // URL to profile picture
            default: null
        },
        bio: {
            type: String,
            maxlength: 500
        }
    },

    // Fisherman Specific Information
    fishermanProfile: {
        isFisherman: {
            type: Boolean,
            default: false
        },
        licenseNumber: {
            type: String,
            sparse: true
        },
        licenseExpiry: {
            type: Date
        },
        yearsOfExperience: {
            type: Number,
            min: 0,
            default: 0
        },
        fishingMethods: [{
            type: String,
            enum: ['NET', 'LINE', 'TRAP', 'SPEAR', 'DIVING', 'OTHER']
        }],
        boatDetails: {
            boatName: String,
            boatType: {
                type: String,
                enum: ['TRADITIONAL', 'MOTORIZED', 'SPEEDBOAT', 'OTHER']
            },
            registrationNumber: String,
            capacity: Number, // in kg
            length: Number, // in meters
            enginePower: Number // in HP
        },
        preferredFishingAreas: [{
            name: String,
            coordinates: {
                lat: Number,
                lng: Number
            },
            radius: Number // in km
        }],
        targetSpecies: [String],
        averageCatch: {
            daily: Number, // kg per day
            weekly: Number, // kg per week
            monthly: Number // kg per month
        }
    },

    // Location & Tracking
    location: {
        current: {
            coordinates: {
                lat: Number,
                lng: Number
            },
            timestamp: Date,
            accuracy: Number, // in meters
            speed: Number, // in km/h
            heading: Number // in degrees
        },
        homePort: {
            name: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        lastUpdated: Date,
        isOnline: {
            type: Boolean,
            default: false
        }
    },

    // Emergency Contacts
    emergencyContacts: [{
        name: {
            type: String,
            required: true
        },
        relationship: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],

    // Safety Settings
    safetySettings: {
        sosAutoTrigger: {
            enabled: {
                type: Boolean,
                default: true
            },
            conditions: [{
                type: String,
                enum: ['NO_MOVEMENT', 'OFFSHORE', 'NIGHT', 'STORM']
            }]
        },
        weatherAlerts: {
            enabled: {
                type: Boolean,
                default: true
            },
            severity: {
                type: String,
                enum: ['ALL', 'HIGH', 'CRITICAL'],
                default: 'HIGH'
            }
        },
        locationSharing: {
            enabled: {
                type: Boolean,
                default: true
            },
            withCommunity: {
                type: Boolean,
                default: true
            },
            withAuthorities: {
                type: Boolean,
                default: true
            }
        },
        maxOffshoreDistance: {
            type: Number, // in km
            default: 20
        },
        nightFishingAllowed: {
            type: Boolean,
            default: false
        }
    },

    // Communication Preferences
    communication: {
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'hi', 'ta', 'te', 'ml', 'kn', 'mr', 'bn']
        },
        notifications: {
            sms: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                weatherAlerts: {
                    type: Boolean,
                    default: true
                },
                safetyAlerts: {
                    type: Boolean,
                    default: true
                },
                communityUpdates: {
                    type: Boolean,
                    default: false
                }
            },
            push: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                fishingZones: {
                    type: Boolean,
                    default: true
                },
                catchReports: {
                    type: Boolean,
                    default: true
                }
            },
            voice: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                emergencyOnly: {
                    type: Boolean,
                    default: true
                }
            }
        }
    },

    // Statistics & Analytics
    statistics: {
        totalFishingTrips: {
            type: Number,
            default: 0
        },
        totalCatchWeight: {
            type: Number,
            default: 0
        },
        successfulTrips: {
            type: Number,
            default: 0
        },
        emergencyActivations: {
            type: Number,
            default: 0
        },
        communityContributions: {
            posts: {
                type: Number,
                default: 0
            },
            safetyReports: {
                type: Number,
                default: 0
            },
            catchReports: {
                type: Number,
                default: 0
            }
        },
        lastFishingTrip: Date,
        averageTripDuration: Number, // in minutes
        favoriteFishingZones: [{
            zoneId: String,
            visits: Number,
            lastVisit: Date
        }]
    },

    // Subscription & Payments
    subscription: {
        plan: {
            type: String,
            enum: ['FREE', 'BASIC', 'PREMIUM'],
            default: 'FREE'
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
            default: 'ACTIVE'
        },
        startDate: Date,
        endDate: Date,
        autoRenew: {
            type: Boolean,
            default: false
        },
        paymentMethod: {
            type: String,
            enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']
        }
    },

    // Security & Authentication
    auth: {
        lastLogin: Date,
        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: Date,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        emailVerified: {
            type: Boolean,
            default: false
        },
        phoneVerified: {
            type: Boolean,
            default: false
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false
        }
    },

    // System Fields
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'],
        default: 'ACTIVE'
    },
    role: {
        type: String,
        enum: ['FISHERMAN', 'ADMIN', 'SUPPORT', 'VIEWER'],
        default: 'FISHERMAN'
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceId: String,
        appVersion: String
    }

}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.auth;
            return ret;
        }
    }
});

// Indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'location.current.coordinates': '2dsphere' });
userSchema.index({ 'fishermanProfile.licenseNumber': 1 }, { sparse: true });
userSchema.index({ status: 1 });
userSchema.index({ 'subscription.plan': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for age
userSchema.virtual('age').get(function() {
    if (!this.profile.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.profile.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
    if (this.isModified('location.current')) {
        this.location.lastUpdated = new Date();
    }
    next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
    return !!(this.auth.lockUntil && this.auth.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.auth.lockUntil && this.auth.lockUntil < Date.now()) {
        return this.updateOne({
            'auth.loginAttempts': 1,
            'auth.lockUntil': null
        });
    }
    
    // Otherwise, increment
    const updates = { $inc: { 'auth.loginAttempts': 1 } };
    
    // Lock the account if we've reached max attempts and it's not already locked
    if (this.auth.loginAttempts + 1 >= 5 && !this.isLocked()) {
        updates.$set = { 'auth.lockUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Instance method to check if user is offshore
userSchema.methods.isOffshore = function() {
    if (!this.location.homePort || !this.location.current) return false;
    
    const homePort = this.location.homePort.coordinates;
    const current = this.location.current.coordinates;
    
    const R = 6371; // Earth's radius in km
    const dLat = (current.lat - homePort.lat) * Math.PI / 180;
    const dLng = (current.lng - homePort.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(homePort.lat * Math.PI / 180) * Math.cos(current.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance > this.safetySettings.maxOffshoreDistance;
};

// Instance method to update location
userSchema.methods.updateLocation = async function(locationData) {
    this.location.current = {
        coordinates: {
            lat: locationData.lat,
            lng: locationData.lng
        },
        timestamp: new Date(),
        accuracy: locationData.accuracy || 10,
        speed: locationData.speed || 0,
        heading: locationData.heading || 0
    };
    
    this.location.lastUpdated = new Date();
    this.location.isOnline = true;
    
    return this.save();
};

// Instance method to add emergency contact
userSchema.methods.addEmergencyContact = async function(contactData) {
    const contact = {
        name: contactData.name,
        relationship: contactData.relationship,
        phone: contactData.phone,
        email: contactData.email,
        isPrimary: contactData.isPrimary || false
    };
    
    // If this is primary, unset others as primary
    if (contact.isPrimary) {
        this.emergencyContacts.forEach(c => c.isPrimary = false);
    }
    
    this.emergencyContacts.push(contact);
    return this.save();
};

// Instance method to get primary emergency contact
userSchema.methods.getPrimaryEmergencyContact = function() {
    return this.emergencyContacts.find(contact => contact.isPrimary) || this.emergencyContacts[0];
};

// Instance method to update statistics
userSchema.methods.updateStatistics = async function(statType, value = 1) {
    const statPaths = {
        'fishing_trip': 'statistics.totalFishingTrips',
        'catch_weight': 'statistics.totalCatchWeight',
        'successful_trip': 'statistics.successfulTrips',
        'emergency': 'statistics.emergencyActivations',
        'community_post': 'statistics.communityContributions.posts',
        'safety_report': 'statistics.communityContributions.safetyReports',
        'catch_report': 'statistics.communityContributions.catchReports'
    };
    
    const update = {};
    update[statPaths[statType]] = value;
    
    if (statType === 'fishing_trip') {
        update['statistics.lastFishingTrip'] = new Date();
    }
    
    return this.updateOne({ $inc: update });
};

// Static method to find nearby fishermen
userSchema.statics.findNearbyFishermen = function(coordinates, maxDistance = 50000) { // 50km default
    return this.find({
        'location.current.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: maxDistance
            }
        },
        'location.isOnline': true,
        'status': 'ACTIVE',
        'fishermanProfile.isFisherman': true
    }).select('username profile location fishermanProfile.boatDetails statistics');
};

// Static method to find by license number
userSchema.statics.findByLicense = function(licenseNumber) {
    return this.findOne({
        'fishermanProfile.licenseNumber': licenseNumber,
        'status': 'ACTIVE'
    });
};

// Static method to get community statistics
userSchema.statics.getCommunityStats = async function() {
    const stats = await this.aggregate([
        {
            $match: {
                status: 'ACTIVE',
                'fishermanProfile.isFisherman': true
            }
        },
        {
            $group: {
                _id: null,
                totalFishermen: { $sum: 1 },
                totalExperience: { $sum: '$fishermanProfile.yearsOfExperience' },
                totalCatch: { $sum: '$statistics.totalCatchWeight' },
                totalTrips: { $sum: '$statistics.totalFishingTrips' },
                avgExperience: { $avg: '$fishermanProfile.yearsOfExperience' },
                onlineCount: {
                    $sum: {
                        $cond: ['$location.isOnline', 1, 0]
                    }
                }
            }
        }
    ]);
    
    return stats[0] || {
        totalFishermen: 0,
        totalExperience: 0,
        totalCatch: 0,
        totalTrips: 0,
        avgExperience: 0,
        onlineCount: 0
    };
};

// Static method to find inactive users
userSchema.statics.findInactiveUsers = function(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.find({
        'location.lastUpdated': { $lt: cutoffDate },
        'status': 'ACTIVE'
    });
};

// Create and export model
const User = mongoose.model('User', userSchema);

module.exports = User;
