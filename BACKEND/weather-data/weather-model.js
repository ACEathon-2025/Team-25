const mongoose = require('mongoose');

// Weather Data Schema
const weatherDataSchema = new mongoose.Schema({
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        name: { type: String }
    },
    temperature: { type: Number, required: true },
    feelsLike: { type: Number },
    humidity: { type: Number },
    pressure: { type: Number },
    windSpeed: { type: Number }, // km/h
    windDirection: { type: Number }, // degrees
    windGust: { type: Number },
    condition: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    cloudCover: { type: Number }, // percentage
    visibility: { type: Number }, // km
    sunrise: { type: Date },
    sunset: { type: Date },
    severity: { 
        type: String, 
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },
    
    // Marine data
    marine: {
        waveHeight: { type: Number }, // meters
        waveDirection: { type: String },
        waterTemperature: { type: Number },
        swellHeight: { type: Number },
        swellPeriod: { type: Number },
        swellDirection: { type: String },
        tide: {
            station: { type: String },
            height: { type: Number },
            state: { type: String },
            nextHighTide: { type: Date },
            nextLowTide: { type: Date },
            range: { type: Number }
        },
        currentSpeed: { type: Number },
        currentDirection: { type: String },
        visibility: { type: Number },
        salinity: { type: Number }
    },
    
    // Fishing conditions assessment
    fishingConditions: {
        score: { type: Number },
        rating: { type: String },
        factors: [{ type: String }],
        recommendation: { type: String }
    },
    
    // Safety assessment
    safetyAssessment: {
        riskLevel: { 
            type: String, 
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        },
        warnings: [{ type: String }],
        safeToFish: { type: Boolean },
        recommendation: { type: String }
    },
    
    // Metadata
    dataSource: { type: String },
    accuracy: { type: Number }, // 0-100
    forecast: { type: Boolean, default: false },
    forecastHours: { type: Number }, // Hours ahead for forecast data
    
    // Timestamps
    recordedAt: { type: Date, required: true },
    expiresAt: { type: Date }, // For automatic cleanup
    
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Forecast Schema
const forecastSchema = new mongoose.Schema({
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        name: { type: String }
    },
    period: {
        start: { type: Date, required: true },
        end: { type: Date, required: true }
    },
    type: {
        type: String,
        enum: ['HOURLY', 'DAILY', 'WEEKLY'],
        required: true
    },
    
    // Forecast data
    data: [{
        timestamp: { type: Date, required: true },
        temperature: { type: Number },
        feelsLike: { type: Number },
        humidity: { type: Number },
        pressure: { type: Number },
        windSpeed: { type: Number },
        windDirection: { type: Number },
        condition: { type: String },
        description: { type: String },
        precipitation: { type: Number }, // percentage
        cloudCover: { type: Number },
        
        // Marine forecast
        marine: {
            waveHeight: { type: Number },
            waveDirection: { type: String },
            waterTemperature: { type: Number },
            swellHeight: { type: Number },
            swellPeriod: { type: Number },
            tide: {
                height: { type: Number },
                state: { type: String }
            }
        },
        
        // Analysis
        fishingScore: { type: Number },
        safetyRisk: { 
            type: String, 
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] 
        }
    }],
    
    // Summary statistics
    summary: {
        minTemperature: { type: Number },
        maxTemperature: { type: Number },
        avgTemperature: { type: Number },
        dominantCondition: { type: String },
        totalPrecipitation: { type: Number },
        maxWindSpeed: { type: Number },
        riskLevel: { 
            type: String, 
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] 
        }
    },
    
    // Metadata
    dataSource: { type: String },
    confidence: { type: Number }, // 0-100
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
}, {
    timestamps: true
});

// Weather Alert Schema
const weatherAlertSchema = new mongoose.Schema({
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        name: { type: String }
    },
    event: { type: String, required: true },
    description: { type: String, required: true },
    severity: { 
        type: String, 
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        required: true
    },
    category: {
        type: String,
        enum: ['WEATHER', 'MARINE', 'SAFETY', 'FISHING'],
        required: true
    },
    
    // Alert timing
    effectiveFrom: { type: Date, required: true },
    effectiveUntil: { type: Date, required: true },
    issuedAt: { type: Date, default: Date.now },
    
    // Affected areas
    radius: { type: Number }, // km from location
    affectedRegions: [{ type: String }],
    
    // Instructions and recommendations
    instructions: { type: String },
    recommendation: { type: String },
    priority: { 
        type: String, 
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    
    // Metadata
    source: { type: String },
    externalId: { type: String }, // ID from external API
    isActive: { type: Boolean, default: true },
    
    // Acknowledgment tracking
    acknowledgedBy: [{
        userId: { type: String },
        acknowledgedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Historical Weather Pattern Schema
const weatherPatternSchema = new mongoose.Schema({
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        name: { type: String }
    },
    season: {
        type: String,
        enum: ['WINTER', 'SPRING', 'SUMMER', 'AUTUMN', 'MONSOON'],
        required: true
    },
    year: { type: Number },
    
    // Pattern characteristics
    avgTemperature: { type: Number },
    avgHumidity: { type: Number },
    avgWindSpeed: { type: Number },
    dominantWindDirection: { type: String },
    commonConditions: [{ type: String }],
    precipitationDays: { type: Number },
    
    // Marine patterns
    marinePatterns: {
        avgWaveHeight: { type: Number },
        commonSwellDirection: { type: String },
        avgWaterTemperature: { type: Number },
        tidePattern: { type: String }
    },
    
    // Fishing patterns
    fishingPatterns: {
        bestMonths: [{ type: String }],
        bestConditions: [{ type: String }],
        avgCatchRate: { type: Number },
        commonSpecies: [{ type: String }]
    },
    
    // Safety patterns
    riskPatterns: {
        highRiskMonths: [{ type: String }],
        commonHazards: [{ type: String }],
        safetyRecommendations: { type: String }
    },
    
    // Metadata
    dataPoints: { type: Number }, // Number of data points used
    confidence: { type: Number }, // 0-100
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes for better query performance
weatherDataSchema.index({ location: '2dsphere' });
weatherDataSchema.index({ recordedAt: -1 });
weatherDataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

forecastSchema.index({ location: '2dsphere' });
forecastSchema.index({ 'period.start': 1, 'period.end': 1 });
forecastSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

weatherAlertSchema.index({ location: '2dsphere' });
weatherAlertSchema.index({ effectiveFrom: 1, effectiveUntil: 1 });
weatherAlertSchema.index({ isActive: 1 });

weatherPatternSchema.index({ location: '2dsphere' });
weatherPatternSchema.index({ season: 1, year: 1 });

// Static methods for WeatherData
weatherDataSchema.statics.findByLocation = function(lat, lng, maxDistance = 50000) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: maxDistance
            }
        }
    }).sort({ recordedAt: -1 }).limit(10);
};

weatherDataSchema.statics.findRecent = function(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({ recordedAt: { $gte: cutoff } }).sort({ recordedAt: -1 });
};

weatherDataSchema.statics.findByCondition = function(condition) {
    return this.find({ condition: new RegExp(condition, 'i') }).sort({ recordedAt: -1 });
};

// Static methods for Forecast
forecastSchema.statics.findActiveByLocation = function(lat, lng) {
    const now = new Date();
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: 50000
            }
        },
        'period.start': { $lte: now },
        'period.end': { $gte: now },
        expiresAt: { $gt: now }
    }).sort({ generatedAt: -1 });
};

// Static methods for WeatherAlert
weatherAlertSchema.statics.findActiveAlerts = function(lat, lng, radius = 50000) {
    const now = new Date();
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: radius
            }
        },
        effectiveFrom: { $lte: now },
        effectiveUntil: { $gte: now },
        isActive: true
    }).sort({ severity: -1, effectiveFrom: 1 });
};

weatherAlertSchema.statics.acknowledgeAlert = function(alertId, userId) {
    return this.findByIdAndUpdate(
        alertId,
        {
            $addToSet: {
                acknowledgedBy: {
                    userId: userId,
                    acknowledgedAt: new Date()
                }
            }
        },
        { new: true }
    );
};

// Instance methods for WeatherData
weatherDataSchema.methods.isSafeForFishing = function() {
    return this.safetyAssessment?.safeToFish === true;
};

weatherDataSchema.methods.getFishingRecommendation = function() {
    return this.fishingConditions?.recommendation || 'Conditions not assessed';
};

weatherDataSchema.methods.getRiskLevel = function() {
    return this.safetyAssessment?.riskLevel || 'LOW';
};

// Instance methods for Forecast
forecastSchema.methods.getBestFishingTimes = function() {
    return this.data
        .filter(entry => entry.fishingScore >= 70)
        .sort((a, b) => b.fishingScore - a.fishingScore)
        .slice(0, 3);
};

forecastSchema.methods.hasHighRiskPeriods = function() {
    return this.data.some(entry => entry.safetyRisk === 'HIGH' || entry.safetyRisk === 'CRITICAL');
};

// Virtual for WeatherData
weatherDataSchema.virtual('isCurrent').get(function() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.recordedAt > oneHourAgo;
});

// Pre-save middleware for WeatherData
weatherDataSchema.pre('save', function(next) {
    // Set expiration for forecast data (24 hours) or current data (6 hours)
    if (this.forecast) {
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
        this.expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    }
    next();
});

// Pre-save middleware for Forecast
forecastSchema.pre('save', function(next) {
    // Set expiration to the end of forecast period
    this.expiresAt = this.period.end;
    next();
});

// Create models
const WeatherData = mongoose.model('WeatherData', weatherDataSchema);
const Forecast = mongoose.model('Forecast', forecastSchema);
const WeatherAlert = mongoose.model('WeatherAlert', weatherAlertSchema);
const WeatherPattern = mongoose.model('WeatherPattern', weatherPatternSchema);

module.exports = {
    WeatherData,
    Forecast,
    WeatherAlert,
    WeatherPattern
};
