const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Authentication & Basic Info
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },

    // Profile Information
    profile: {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters']
        },
        dateOfBirth: {
            type: Date,
            validate: {
                validator: function(date) {
                    return date < new Date();
                },
                message: 'Date of birth must be in the past'
            }
        },
        gender: {
            type: String,
            enum: {
                values: ['MALE', 'FEMALE', 'OTHER'],
                message: 'Gender must be MALE, FEMALE, or OTHER'
            },
            default: 'MALE'
        },
        avatar: {
            type: String, // URL to profile picture
            default: null
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
            default: ''
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
            sparse: true,
            unique: true
        },
        licenseExpiry: {
            type: Date
        },
        yearsOfExperience: {
            type: Number,
            min: [0, 'Experience cannot be negative'],
            default: 0
        },
        fishingMethods: [{
            type: String,
            enum: ['NET', 'LINE', 'TRAP', 'SPEAR', 'DIVING', 'OTHER']
        }],
        boatDetails: {
            boatName: {
                type: String,
                trim: true
            },
            boatType: {
                type: String,
                enum: ['TRADITIONAL', 'MOTORIZED', 'SPEEDBOAT', 'OTHER']
            },
            registrationNumber: {
                type: String,
                trim: true
            },
            capacity: {
                type: Number, // in kg
                min: [0, 'Capacity cannot be negative']
            },
            length: {
                type: Number, // in meters
                min: [0, 'Length cannot be negative']
            },
            enginePower: {
                type: Number, // in HP
                min: [0, 'Engine power cannot be negative']
            }
        },
        preferredFishingAreas: [{
            name: {
                type: String,
                required: true
            },
            coordinates: {
                lat: {
                    type: Number,
                    required: true,
                    min: -90,
                    max: 90
                },
                lng: {
                    type: Number,
                    required: true,
                    min: -180,
                    max: 180
                }
            },
            radius: {
                type: Number, // in km
                min: [0, 'Radius cannot be negative'],
                default: 10
            }
        }],
        targetSpecies: [{
            type: String,
            trim: true
        }],
        averageCatch: {
            daily: {
                type: Number, // kg per day
                min: [0, 'Daily catch cannot be negative'],
                default: 0
            },
            weekly: {
                type: Number, // kg per week
                min: [0, 'Weekly catch cannot be negative'],
                default: 0
            },
            monthly: {
                type: Number, // kg per month
                min: [0, 'Monthly catch cannot be negative'],
                default: 0
            }
        }
    },

    // Location & Tracking
    location: {
        current: {
            coordinates: {
                lat: {
                    type: Number,
                    min: -90,
                    max: 90
                },
                lng: {
                    type: Number,
                    min: -180,
                    max: 180
                }
            },
            timestamp: Date,
            accuracy: {
                type: Number, // in meters
                min: [0, 'Accuracy cannot be negative']
            },
            speed: {
                type: Number, // in km/h
                min: [0, 'Speed cannot be negative']
            },
            heading: {
                type: Number, // in degrees
                min: [0, 'Heading cannot be negative'],
                max: [360, 'Heading cannot exceed 360']
            }
        },
        homePort: {
            name: String,
            coordinates: {
                lat: {
                    type: Number,
                    min: -90,
                    max: 90
                },
                lng: {
                    type: Number,
                    min: -180,
                    max: 180
                }
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
            required: [true, 'Contact name is required'],
            trim: true
        },
        relationship: {
            type: String,
            required: [true, 'Relationship is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Contact phone is required'],
            match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
        },
        email: {
            type: String,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
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
            min: [1, 'Max offshore distance must be at least 1km'],
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
            min: [0, 'Total trips cannot be negative'],
            default: 0
        },
        totalCatchWeight: {
            type: Number, // in kg
            min: [0, 'Total catch cannot be negative'],
            default: 0
        },
        successfulTrips: {
            type: Number,
            min: [0, 'Successful trips cannot be negative'],
            default: 0
        },
        emergencyActivations: {
            type: Number,
            min: [0, 'Emergency activations cannot be negative'],
            default: 0
        },
        communityContributions: {
            posts: {
                type: Number,
                min: [0, 'Posts count cannot be negative'],
                default: 0
            },
            safetyReports: {
                type: Number,
                min: [0, 'Safety reports count cannot be negative'],
                default: 0
            },
            catchReports: {
                type: Number,
                min: [0, 'Catch reports count cannot be negative'],
                default: 0
            }
        },
        lastFishingTrip: Date,
        averageTripDuration: {
            type: Number, // in minutes
            min: [0, 'Average duration cannot be negative'],
            default: 0
        },
        favoriteFishingZones: [{
            zoneId: {
                type: String,
                required: true
            },
            visits: {
                type: Number,
                min: [1, 'Visits must be at least 1'],
                default: 1
            },
            lastVisit: {
                type: Date,
                default: Date.now
            }
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
            min: [0, 'Login attempts cannot be negative'],
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
    },
    toObject: {
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
userSchema.index({ 'fishermanProfile.isFisherman': 1 });
userSchema.index({ 'location.isOnline': 1 });
userSchema.index({ createdAt: -1 });

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
        this.auth.loginAttempts = 1;
        this.auth.lockUntil = undefined;
        return this.save();
    }
    
    // Otherwise, increment
    this.auth.loginAttempts += 1;
    
    // Lock the account if we've reached max attempts and it's not already locked
    if (this.auth.loginAttempts >= 5 && !this.isLocked()) {
        this.auth.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    }
    
    return this.save();
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    this.auth.loginAttempts = 0;
    this.auth.lockUntil = undefined;
    return this.save();
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
        this.statistics.lastFishingTrip = new Date();
    }
    
    return this.save();
};

// Static method to find nearby fishermen
userSchema.statics.findNearbyFishermen = function(coordinates, maxDistance = 50000) {
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
