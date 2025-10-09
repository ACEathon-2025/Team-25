const mongoose = require('mongoose');

const fishingZoneSchema = new mongoose.Schema({
    // Zone Identification
    name: {
        type: String,
        required: [true, 'Zone name is required'],
        trim: true,
        maxlength: [100, 'Zone name cannot exceed 100 characters']
    },
    zoneId: {
        type: String,
        required: [true, 'Zone ID is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    // Location Information
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            validate: {
                validator: function(coords) {
                    return coords.length === 2 &&
                           coords[0] >= -180 && coords[0] <= 180 &&
                           coords[1] >= -90 && coords[1] <= 90;
                },
                message: 'Invalid coordinates format. Must be [longitude, latitude]'
            }
        }
    },
    bounds: {
        northeast: {
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
        southwest: {
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
        }
    },
    radius: {
        type: Number, // in meters
        required: true,
        min: [100, 'Radius must be at least 100 meters']
    },

    // Zone Characteristics
    depthRange: {
        min: {
            type: Number, // in meters
            required: true,
            min: [0, 'Minimum depth cannot be negative']
        },
        max: {
            type: Number, // in meters
            required: true,
            min: [0, 'Maximum depth cannot be negative']
        },
        average: {
            type: Number, // in meters
            min: [0, 'Average depth cannot be negative']
        }
    },
    waterTemperature: {
        current: {
            type: Number, // in °C
            min: [-2, 'Water temperature cannot be below -2°C'],
            max: [40, 'Water temperature cannot exceed 40°C']
        },
        range: {
            min: {
                type: Number,
                min: [-2, 'Minimum temperature cannot be below -2°C']
            },
            max: {
                type: Number,
                max: [40, 'Maximum temperature cannot exceed 40°C']
            }
        }
    },
    oxygenLevel: {
        type: Number, // in mg/L
        min: [0, 'Oxygen level cannot be negative'],
        max: [20, 'Oxygen level cannot exceed 20 mg/L']
    },
    salinity: {
        type: Number, // in ppt
        min: [0, 'Salinity cannot be negative'],
        max: [50, 'Salinity cannot exceed 50 ppt']
    },
    currentSpeed: {
        type: Number, // in m/s
        min: [0, 'Current speed cannot be negative'],
        max: [10, 'Current speed cannot exceed 10 m/s']
    },

    // Fish Species Information
    commonSpecies: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        scientificName: String,
        abundance: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
            default: 'MEDIUM'
        },
        season: {
            start: String, // e.g., "January"
            end: String    // e.g., "March"
        },
        averageSize: Number, // in cm
        catchRate: {
            type: Number, // percentage
            min: 0,
            max: 100
        }
    }],
    endangeredSpecies: [{
        name: String,
        protectionLevel: {
            type: String,
            enum: ['PROTECTED', 'ENDANGERED', 'CRITICAL']
        },
        restrictions: [String]
    }],

    // Fishing Conditions
    fishingConditions: {
        bestTime: {
            timeOfDay: [{
                type: String,
                enum: ['EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT']
            }],
            tide: {
                type: String,
                enum: ['LOW', 'RISING', 'HIGH', 'FALLING', 'ANY']
            },
            season: [String]
        },
        recommendedMethods: [{
            type: String,
            enum: ['NET', 'LINE', 'TRAP', 'SPEAR', 'DIVING', 'OTHER']
        }],
        difficulty: {
            type: String,
            enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
            default: 'MEDIUM'
        },
        accessibility: {
            type: String,
            enum: ['EASY', 'MODERATE', 'DIFFICULT', 'RESTRICTED'],
            default: 'MODERATE'
        }
    },

    // AI Prediction Data
    prediction: {
        confidence: {
            type: Number, // 0-100
            min: 0,
            max: 100,
            default: 0
        },
        probability: {
            type: Number, // 0-1
            min: 0,
            max: 1,
            default: 0
        },
        factors: [{
            name: String,
            value: Number,
            weight: Number,
            impact: {
                type: String,
                enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL']
            }
        }],
        lastUpdated: Date,
        modelVersion: String
    },

    // Safety Information
    safety: {
        hazards: [{
            type: {
                type: String,
                enum: ['CURRENT', 'ROCKS', 'TRAFFIC', 'WEATHER', 'MARINE_LIFE', 'OTHER']
            },
            description: String,
            severity: {
                type: String,
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            },
            location: {
                coordinates: {
                    lat: Number,
                    lng: Number
                },
                radius: Number
            }
        }],
        restrictions: [{
            type: String,
            enum: ['NO_FISHING', 'SEASONAL', 'SIZE_LIMIT', 'CATCH_LIMIT', 'GEAR_RESTRICTION']
        }],
        emergencyContacts: [{
            name: String,
            phone: String,
            type: {
                type: String,
                enum: ['COAST_GUARD', 'HARBOR_MASTER', 'LOCAL_AUTHORITY', 'OTHER']
            }
        }]
    },

    // Historical Performance
    historicalData: {
        totalVisits: {
            type: Number,
            min: 0,
            default: 0
        },
        successRate: {
            type: Number, // percentage
            min: 0,
            max: 100,
            default: 0
        },
        averageCatch: {
            type: Number, // kg per trip
            min: 0,
            default: 0
        },
        lastSuccessfulTrip: Date,
        popularTimes: [{
            hour: {
                type: Number,
                min: 0,
                max: 23
            },
            visitCount: {
                type: Number,
                min: 0
            }
        }]
    },

    // User Ratings and Reviews
    ratings: {
        average: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        count: {
            type: Number,
            min: 0,
            default: 0
        },
        reviews: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: {
                type: Number,
                min: 1,
                max: 5,
                required: true
            },
            comment: {
                type: String,
                maxlength: [500, 'Review comment cannot exceed 500 characters']
            },
            catchDetails: {
                species: [String],
                totalWeight: Number,
                fishingMethod: String
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },

    // Zone Status
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'RESTRICTED', 'SEASONAL'],
        default: 'ACTIVE'
    },
    isRecommended: {
        type: Boolean,
        default: false
    },
    popularity: {
        type: Number, // 0-100
        min: 0,
        max: 100,
        default: 0
    },

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    source: {
        type: String,
        enum: ['AI_PREDICTION', 'USER_SUBMISSION', 'OFFICIAL_DATA', 'COMMUNITY'],
        default: 'AI_PREDICTION'
    },
    tags: [String],
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }

}, {
    timestamps: true
});

// Indexes for geospatial queries
fishingZoneSchema.index({ 'location': '2dsphere' });
fishingZoneSchema.index({ zoneId: 1 });
fishingZoneSchema.index({ status: 1 });
fishingZoneSchema.index({ 'prediction.confidence': -1 });
fishingZoneSchema.index({ 'ratings.average': -1 });
fishingZoneSchema.index({ popularity: -1 });
fishingZoneSchema.index({ isRecommended: 1 });

// Virtual for zone area (approximate)
fishingZoneSchema.virtual('area').get(function() {
    // Calculate approximate area in square km
    const area = Math.PI * Math.pow(this.radius / 1000, 2);
    return Math.round(area * 100) / 100;
});

// Virtual for depth range description
fishingZoneSchema.virtual('depthDescription').get(function() {
    if (this.depthRange.min === this.depthRange.max) {
        return `${this.depthRange.min}m`;
    }
    return `${this.depthRange.min}-${this.depthRange.max}m`;
});

// Instance method to update prediction
fishingZoneSchema.methods.updatePrediction = async function(confidence, probability, factors = []) {
    this.prediction.confidence = confidence;
    this.prediction.probability = probability;
    this.prediction.factors = factors;
    this.prediction.lastUpdated = new Date();
    
    return this.save();
};

// Instance method to add rating
fishingZoneSchema.methods.addRating = async function(userId, rating, comment = '', catchDetails = {}) {
    // Add new review
    this.ratings.reviews.push({
        userId: userId,
        rating: rating,
        comment: comment,
        catchDetails: catchDetails
    });

    // Recalculate average rating
    const totalRatings = this.ratings.reviews.length;
    const sumRatings = this.ratings.reviews.reduce((sum, review) => sum + review.rating, 0);
    
    this.ratings.average = sumRatings / totalRatings;
    this.ratings.count = totalRatings;

    // Update popularity based on ratings and visits
    this.popularity = Math.min(100, (this.ratings.average * 10) + (this.historicalData.totalVisits * 0.1));

    return this.save();
};

// Instance method to record visit
fishingZoneSchema.methods.recordVisit = async function(successful = false, catchWeight = 0) {
    this.historicalData.totalVisits += 1;

    if (successful) {
        // Update success rate
        const successfulTrips = this.ratings.reviews.filter(review => 
            review.catchDetails && review.catchDetails.totalWeight > 0
        ).length + (successful ? 1 : 0);
        
        this.historicalData.successRate = (successfulTrips / this.historicalData.totalVisits) * 100;

        // Update average catch
        const totalCatch = this.ratings.reviews.reduce((sum, review) => 
            sum + (review.catchDetails?.totalWeight || 0), 0
        ) + catchWeight;
        
        this.historicalData.averageCatch = totalCatch / successfulTrips;

        if (successful) {
            this.historicalData.lastSuccessfulTrip = new Date();
        }
    }

    // Update popularity
    this.popularity = Math.min(100, this.popularity + 1);

    return this.save();
};

// Instance method to add hazard
fishingZoneSchema.methods.addHazard = async function(hazardType, description, severity, location = null) {
    this.safety.hazards.push({
        type: hazardType,
        description: description,
        severity: severity,
        location: location
    });

    return this.save();
};

// Static method to find zones near location
fishingZoneSchema.statics.findNearbyZones = function(coordinates, maxDistance = 50000, limit = 20) {
    return this.find({
        'location': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: maxDistance
            }
        },
        status: 'ACTIVE'
    })
    .sort({ 'prediction.confidence': -1, popularity: -1 })
    .limit(limit);
};

// Static method to find recommended zones
fishingZoneSchema.statics.findRecommendedZones = function(coordinates, maxDistance = 50000, limit = 10) {
    return this.find({
        'location': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: maxDistance
            }
        },
        status: 'ACTIVE',
        isRecommended: true,
        'prediction.confidence': { $gte: 70 }
    })
    .sort({ 'prediction.confidence': -1, 'ratings.average': -1 })
    .limit(limit);
};

// Static method to get zone statistics
fishingZoneSchema.statics.getZoneStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalZones: { $sum: 1 },
                activeZones: {
                    $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
                },
                recommendedZones: {
                    $sum: { $cond: ['$isRecommended', 1, 0] }
                },
                avgConfidence: { $avg: '$prediction.confidence' },
                avgRating: { $avg: '$ratings.average' },
                totalVisits: { $sum: '$historicalData.totalVisits' },
                totalSuccessfulTrips: {
                    $sum: {
                        $multiply: [
                            '$historicalData.totalVisits',
                            { $divide: ['$historicalData.successRate', 100] }
                        ]
                    }
                }
            }
        }
    ]);

    return stats[0] || {
        totalZones: 0,
        activeZones: 0,
        recommendedZones: 0,
        avgConfidence: 0,
        avgRating: 0,
        totalVisits: 0,
        totalSuccessfulTrips: 0
    };
};

// Static method to update all zone predictions
fishingZoneSchema.statics.updateAllPredictions = async function(predictionData) {
    // This would typically be called by the AI prediction service
    const bulkOps = predictionData.map(prediction => ({
        updateOne: {
            filter: { zoneId: prediction.zoneId },
            update: {
                $set: {
                    'prediction.confidence': prediction.confidence,
                    'prediction.probability': prediction.probability,
                    'prediction.factors': prediction.factors,
                    'prediction.lastUpdated': new Date(),
                    'prediction.modelVersion': prediction.modelVersion
                }
            }
        }
    }));

    if (bulkOps.length > 0) {
        await this.bulkWrite(bulkOps);
    }

    return { updated: bulkOps.length };
};

const FishingZone = mongoose.model('FishingZone', fishingZoneSchema);

module.exports = FishingZone;
