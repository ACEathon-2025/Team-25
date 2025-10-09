const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    // Basic Alert Information
    type: {
        type: String,
        required: [true, 'Alert type is required'],
        enum: {
            values: [
                'SOS_EMERGENCY',
                'WEATHER_ALERT', 
                'SAFETY_HAZARD',
                'COMMUNITY_ALERT',
                'SYSTEM_ALERT',
                'FISHING_ZONE_ALERT',
                'OFFSHORE_ALERT'
            ],
            message: 'Invalid alert type'
        }
    },
    severity: {
        type: String,
        required: [true, 'Alert severity is required'],
        enum: {
            values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            message: 'Severity must be LOW, MEDIUM, HIGH, or CRITICAL'
        },
        default: 'MEDIUM'
    },
    title: {
        type: String,
        required: [true, 'Alert title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Alert description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    // Location Information
    location: {
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
        name: String,
        accuracy: {
            type: Number, // in meters
            min: [0, 'Accuracy cannot be negative']
        }
    },
    radius: {
        type: Number, // in km
        min: [0, 'Radius cannot be negative'],
        default: 50
    },

    // User Information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    userName: {
        type: String,
        required: [true, 'User name is required'],
        trim: true
    },

    // Alert Timing
    triggeredAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiration time is required'],
        validate: {
            validator: function(date) {
                return date > new Date();
            },
            message: 'Expiration time must be in the future'
        }
    },
    resolvedAt: Date,

    // Alert Status
    status: {
        type: String,
        enum: {
            values: ['ACTIVE', 'RESOLVED', 'CANCELLED', 'EXPIRED'],
            message: 'Status must be ACTIVE, RESOLVED, CANCELLED, or EXPIRED'
        },
        default: 'ACTIVE'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },

    // Emergency Specific Fields
    emergencyData: {
        sosType: {
            type: String,
            enum: ['MEDICAL', 'MECHANICAL', 'WEATHER', 'SAFETY', 'OTHER']
        },
        assistanceRequired: {
            type: String,
            enum: ['MEDICAL', 'TOWING', 'FUEL', 'REPAIRS', 'GUIDANCE', 'OTHER']
        },
        message: {
            type: String,
            maxlength: [500, 'Emergency message cannot exceed 500 characters']
        },
        contactNumber: String
    },

    // Weather Alert Specific Fields
    weatherAlertData: {
        condition: String,
        windSpeed: Number, // km/h
        waveHeight: Number, // meters
        temperature: Number, // °C
        precipitation: Number, // percentage
        visibility: Number, // km
        stormDistance: Number // km
    },

    // Safety Hazard Specific Fields
    safetyHazardData: {
        hazardType: {
            type: String,
            enum: ['STRONG_CURRENT', 'ROCKS', 'DEBRIS', 'LOW_VISIBILITY', 'MARINE_LIFE', 'OTHER']
        },
        riskLevel: String,
        recommendedAction: String,
        confirmedBy: [{
            userId: mongoose.Schema.Types.ObjectId,
            userName: String,
            confirmedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },

    // Response Information
    response: {
        acknowledgedBy: [{
            userId: mongoose.Schema.Types.ObjectId,
            userName: String,
            acknowledgedAt: {
                type: Date,
                default: Date.now
            },
            role: String
        }],
        assistanceProvided: [{
            providerId: mongoose.Schema.Types.ObjectId,
            providerName: String,
            assistanceType: String,
            providedAt: {
                type: Date,
                default: Date.now
            },
            notes: String
        }],
        resolutionNotes: {
            type: String,
            maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
        },
        resolvedBy: {
            userId: mongoose.Schema.Types.ObjectId,
            userName: String
        }
    },

    // Notification Tracking
    notifications: {
        smsSent: {
            type: Boolean,
            default: false
        },
        pushSent: {
            type: Boolean,
            default: false
        },
        emailSent: {
            type: Boolean,
            default: false
        },
        authoritiesNotified: {
            type: Boolean,
            default: false
        },
        communityNotified: {
            type: Boolean,
            default: false
        }
    },

    // Metadata
    source: {
        type: String,
        enum: ['USER', 'SYSTEM', 'AUTOMATED', 'EXTERNAL'],
        default: 'USER'
    },
    externalId: String, // ID from external systems
    dataSource: String, // Source of data for automated alerts
    confidence: {
        type: Number, // 0-100
        min: 0,
        max: 100,
        default: 80
    },
    tags: [String],

    // Analytics
    viewCount: {
        type: Number,
        min: 0,
        default: 0
    },
    responseTime: Number, // Time to first response in seconds

}, {
    timestamps: true
});

// Indexes for better query performance
alertSchema.index({ type: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ userId: 1 });
alertSchema.index({ 'location.coordinates': '2dsphere' });
alertSchema.index({ triggeredAt: -1 });
alertSchema.index({ expiresAt: 1 });
alertSchema.index({ status: 1, expiresAt: 1 });

// Virtual for alert duration
alertSchema.virtual('duration').get(function() {
    if (!this.triggeredAt) return 0;
    const resolved = this.resolvedAt || new Date();
    return Math.floor((resolved - this.triggeredAt) / 1000); // in seconds
});

// Virtual for isExpired
alertSchema.virtual('isExpired').get(function() {
    return new Date() > this.expiresAt;
});

// Virtual for isActive
alertSchema.virtual('isActive').get(function() {
    return this.status === 'ACTIVE' && !this.isExpired;
});

// Pre-save middleware to update status if expired
alertSchema.pre('save', function(next) {
    if (this.isExpired && this.status === 'ACTIVE') {
        this.status = 'EXPIRED';
        this.resolvedAt = new Date();
    }
    next();
});

// Instance method to acknowledge alert
alertSchema.methods.acknowledge = async function(userId, userName, role = 'USER') {
    const existingAck = this.response.acknowledgedBy.find(
        ack => ack.userId.toString() === userId.toString()
    );

    if (!existingAck) {
        this.response.acknowledgedBy.push({
            userId: userId,
            userName: userName,
            role: role,
            acknowledgedAt: new Date()
        });

        // Calculate response time if this is the first acknowledgment
        if (this.response.acknowledgedBy.length === 1) {
            this.responseTime = Math.floor((new Date() - this.triggeredAt) / 1000);
        }

        return this.save();
    }

    return this;
};

// Instance method to provide assistance
alertSchema.methods.provideAssistance = async function(providerId, providerName, assistanceType, notes = '') {
    this.response.assistanceProvided.push({
        providerId: providerId,
        providerName: providerName,
        assistanceType: assistanceType,
        notes: notes,
        providedAt: new Date()
    });

    return this.save();
};

// Instance method to resolve alert
alertSchema.methods.resolve = async function(resolvedByUserId, resolvedByUserName, notes = '') {
    this.status = 'RESOLVED';
    this.resolvedAt = new Date();
    this.response.resolvedBy = {
        userId: resolvedByUserId,
        userName: resolvedByUserName
    };
    this.response.resolutionNotes = notes;

    return this.save();
};

// Instance method to confirm safety hazard
alertSchema.methods.confirmHazard = async function(userId, userName) {
    if (this.type !== 'SAFETY_HAZARD') {
        throw new Error('Can only confirm safety hazard alerts');
    }

    const existingConfirmation = this.safetyHazardData.confirmedBy.find(
        conf => conf.userId.toString() === userId.toString()
    );

    if (!existingConfirmation) {
        this.safetyHazardData.confirmedBy.push({
            userId: userId,
            userName: userName,
            confirmedAt: new Date()
        });

        // Increase confidence with more confirmations
        this.confidence = Math.min(100, this.confidence + 10);

        return this.save();
    }

    return this;
};

// Static method to find active alerts for location
alertSchema.statics.findActiveAlerts = function(coordinates, maxDistance = 50000) {
    return this.find({
        'location.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: maxDistance
            }
        },
        status: 'ACTIVE',
        expiresAt: { $gt: new Date() }
    }).sort({ severity: -1, triggeredAt: -1 });
};

// Static method to find expired alerts
alertSchema.statics.findExpiredAlerts = function() {
    return this.find({
        status: 'ACTIVE',
        expiresAt: { $lte: new Date() }
    });
};

// Static method to get alert statistics
alertSchema.statics.getAlertStats = async function(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await this.aggregate([
        {
            $match: {
                triggeredAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalAlerts: { $sum: 1 },
                byType: {
                    $push: {
                        type: '$type',
                        severity: '$severity'
                    }
                },
                bySeverity: {
                    $push: '$severity'
                },
                avgResponseTime: { $avg: '$responseTime' },
                resolvedCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0]
                    }
                }
            }
        },
        {
            $project: {
                totalAlerts: 1,
                typeBreakdown: {
                    $arrayToObject: {
                        $map: {
                            input: '$byType',
                            as: 'alert',
                            in: {
                                k: '$$alert.type',
                                v: {
                                    $sum: {
                                        $cond: [{ $eq: ['$$alert.type', '$$alert.type'] }, 1, 0]
                                    }
                                }
                            }
                        }
                    }
                },
                severityBreakdown: {
                    $arrayToObject: {
                        $map: {
                            input: '$bySeverity',
                            as: 'sev',
                            in: {
                                k: '$$sev',
                                v: {
                                    $sum: {
                                        $cond: [{ $eq: ['$$sev', '$$sev'] }, 1, 0]
                                    }
                                }
                            }
                        }
                    }
                },
                avgResponseTime: { $round: ['$avgResponseTime', 2] },
                resolutionRate: {
                    $round: [
                        {
                            $multiply: [
                                { $divide: ['$resolvedCount', '$totalAlerts'] },
                                100
                            ]
                        },
                        2
                    ]
                }
            }
        }
    ]);

    return stats[0] || {
        totalAlerts: 0,
        typeBreakdown: {},
        severityBreakdown: {},
        avgResponseTime: 0,
        resolutionRate: 0
    };
};

// Static method to cleanup expired alerts
alertSchema.statics.cleanupExpiredAlerts = async function() {
    const result = await this.updateMany(
        {
            status: 'ACTIVE',
            expiresAt: { $lte: new Date() }
        },
        {
            $set: {
                status: 'EXPIRED',
                resolvedAt: new Date()
            }
        }
    );

    return result;
};

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
