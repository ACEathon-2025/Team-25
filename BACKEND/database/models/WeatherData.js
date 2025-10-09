const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
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
        },
        name: {
            type: String,
            trim: true
        },
        region: {
            type: String,
            trim: true
        }
    },

    // Basic Weather Data
    temperature: {
        current: {
            type: Number, // in °C
            required: true,
            min: -50,
            max: 60
        },
        feelsLike: {
            type: Number, // in °C
            min: -50,
            max: 60
        },
        min: {
            type: Number, // in °C
            min: -50,
            max: 60
        },
        max: {
            type: Number, // in °C
            min: -50,
            max: 60
        }
    },
    humidity: {
        type: Number, // percentage
        min: 0,
        max: 100,
        required: true
    },
    pressure: {
        type: Number, // in hPa
        min: 800,
        max: 1100,
        required: true
    },
    visibility: {
        type: Number, // in km
        min: 0,
        max: 100
    },

    // Wind Information
    wind: {
        speed: {
            type: Number, // in km/h
            required: true,
            min: 0,
            max: 400
        },
        direction: {
            type: Number, // in degrees
            min: 0,
            max: 360
        },
        gust: {
            type: Number, // in km/h
            min: 0,
            max: 400
        }
    },

    // Precipitation
    precipitation: {
        probability: {
            type: Number, // percentage
            min: 0,
            max: 100
        },
        amount: {
            type: Number, // in mm
            min: 0
        },
        type: {
            type: String,
            enum: ['RAIN', 'SNOW', 'SLEET', 'HAIL', 'NONE']
        },
        lastHour: {
            type: Number, // in mm
            min: 0
        }
    },

    // Cloud Cover
    clouds: {
        cover: {
            type: Number, // percentage
            min: 0,
            max: 100
        },
        type: {
            type: String,
            enum: ['CLEAR', 'FEW', 'SCATTERED', 'BROKEN', 'OVERCAST']
        },
        base: {
            type: Number // in meters
        }
    },

    // Marine Specific Data
    marine: {
        waveHeight: {
            type: Number, // in meters
            min: 0,
            max: 50
        },
        waveDirection: {
            type: Number, // in degrees
            min: 0,
            max: 360
        },
        wavePeriod: {
            type: Number, // in seconds
            min: 0
        },
        swellHeight: {
            type: Number, // in meters
            min: 0,
            max: 50
        },
        swellDirection: {
            type: Number, // in degrees
            min: 0,
            max: 360
        },
        swellPeriod: {
            type: Number, // in seconds
            min: 0
        },
        waterTemperature: {
            type: Number, // in °C
            min: -2,
            max: 40
        },
        tide: {
            height: {
                type: Number, // in meters
                min: -10,
                max: 10
            },
            state: {
                type: String,
                enum: ['LOW', 'RISING', 'HIGH', 'FALLING']
            },
            nextHigh: Date,
            nextLow: Date
        },
        current: {
            speed: {
                type: Number, // in m/s
                min: 0,
                max: 10
            },
            direction: {
                type: Number, // in degrees
                min: 0,
                max: 360
            }
        }
    },

    // Weather Conditions
    conditions: {
        main: {
            type: String,
            required: true,
            enum: [
                'CLEAR', 'CLOUDS', 'RAIN', 'DRIZZLE', 'THUNDERSTORM', 
                'SNOW', 'MIST', 'SMOKE', 'HAZE', 'DUST', 'FOG', 
                'SAND', 'ASH', 'SQUALL', 'TORNADO'
            ]
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        icon: {
            type: String,
            trim: true
        },
        code: {
            type: Number // Weather condition code
        }
    },

    // Sun and Moon Data
    astronomy: {
        sunrise: {
            type: Date,
            required: true
        },
        sunset: {
            type: Date,
            required: true
        },
        moonPhase: {
            type: String,
            enum: [
                'NEW_MOON', 'WAXING_CRESCENT', 'FIRST_QUARTER', 'WAXING_GIBBOUS',
                'FULL_MOON', 'WANING_GIBBOUS', 'LAST_QUARTER', 'WANING_CRESCENT'
            ]
        },
        moonIllumination: {
            type: Number, // percentage
            min: 0,
            max: 100
        }
    },

    // Air Quality
    airQuality: {
        aqi: {
            type: Number, // Air Quality Index
            min: 0,
            max: 500
        },
        pm25: {
            type: Number, // μg/m³
            min: 0
        },
        pm10: {
            type: Number, // μg/m³
            min: 0
        },
        o3: {
            type: Number, // μg/m³
            min: 0
        },
        no2: {
            type: Number, // μg/m³
            min: 0
        },
        so2: {
            type: Number, // μg/m³
            min: 0
        },
        co: {
            type: Number, // mg/m³
            min: 0
        }
    },

    // Alerts and Warnings
    alerts: [{
        sender: String,
        event: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            required: true
        },
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        },
        tags: [String]
    }],

    // Forecast Data (for current record, stores short-term forecast)
    forecast: {
        hourly: [{
            timestamp: {
                type: Date,
                required: true
            },
            temperature: Number,
            feelsLike: Number,
            humidity: Number,
            pressure: Number,
            windSpeed: Number,
            windDirection: Number,
            precipitation: Number,
            conditions: String,
            probability: Number
        }],
        daily: [{
            date: {
                type: Date,
                required: true
            },
            temp: {
                min: Number,
                max: Number,
                day: Number,
                night: Number
            },
            humidity: Number,
            pressure: Number,
            windSpeed: Number,
            precipitation: Number,
            conditions: String,
            sunrise: Date,
            sunset: Date
        }]
    },

    // Safety Assessment
    safety: {
        riskLevel: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default: 'LOW'
        },
        fishingConditions: {
            score: {
                type: Number, // 0-100
                min: 0,
                max: 100
            },
            rating: {
                type: String,
                enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DANGEROUS']
            },
            factors: [{
                name: String,
                impact: {
                    type: String,
                    enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL']
                },
                severity: {
                    type: String,
                    enum: ['LOW', 'MEDIUM', 'HIGH']
                }
            }]
        },
        recommendations: [{
            type: String,
            enum: [
                'SAFE_TO_FISH',
                'EXERCISE_CAUTION', 
                'RETURN_TO_SHORE',
                'AVOID_AREA',
                'MONITOR_CONDITIONS'
            ]
        }]
    },

    // Data Source and Quality
    source: {
        provider: {
            type: String,
            required: true,
            enum: ['OPENWEATHERMAP', 'WEATHERBIT', 'ACCUWEATHER', 'CUSTOM', 'MOCK']
        },
        stationId: String,
        apiVersion: String,
        confidence: {
            type: Number, // 0-100
            min: 0,
            max: 100,
            default: 80
        }
    },

    // Timestamps
    recordedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    forecastFor: {
        type: Date // For forecast data, when this prediction is for
    },
    expiresAt: {
        type: Date,
        required: true,
        default: function() {
            return new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours default
        }
    },

    // Metadata
    isCurrent: {
        type: Boolean,
        default: true
    },
    isForecast: {
        type: Boolean,
        default: false
    },
    dataQuality: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'VERIFIED'],
        default: 'MEDIUM'
    },
    tags: [String]

}, {
    timestamps: true
});

// Indexes for optimal query performance
weatherDataSchema.index({ 'location': '2dsphere' });
weatherDataSchema.index({ recordedAt: -1 });
weatherDataSchema.index({ expiresAt: 1 });
weatherDataSchema.index({ isCurrent: 1 });
weatherDataSchema.index({ 'location.coordinates': '2dsphere', recordedAt: -1 });
weatherDataSchema.index({ 'marine.waterTemperature': 1 });
weatherDataSchema.index({ 'safety.riskLevel': 1 });

// Virtual for isExpired
weatherDataSchema.virtual('isExpired').get(function() {
    return new Date() > this.expiresAt;
});

// Virtual for weather summary
weatherDataSchema.virtual('summary').get(function() {
    return {
        temperature: this.temperature.current,
        conditions: this.conditions.main,
        windSpeed: this.wind.speed,
        safety: this.safety.riskLevel,
        fishingScore: this.safety.fishingConditions.score
    };
});

// Pre-save middleware to update safety assessment
weatherDataSchema.pre('save', function(next) {
    if (this.isModified('wind') || this.isModified('marine') || this.isModified('conditions')) {
        this.assessSafety();
        this.assessFishingConditions();
    }
    next();
});

// Instance method to assess safety conditions
weatherDataSchema.methods.assessSafety = function() {
    let riskLevel = 'LOW';
    const factors = [];

    // Wind risk assessment
    if (this.wind.speed > 35) {
        riskLevel = 'HIGH';
        factors.push({
            name: 'High Winds',
            impact: 'NEGATIVE',
            severity: 'HIGH'
        });
    } else if (this.wind.speed > 25) {
        riskLevel = 'MEDIUM';
        factors.push({
            name: 'Moderate Winds',
            impact: 'NEGATIVE',
            severity: 'MEDIUM'
        });
    }

    // Wave risk assessment
    if (this.marine.waveHeight > 3.0) {
        riskLevel = 'HIGH';
        factors.push({
            name: 'High Waves',
            impact: 'NEGATIVE',
            severity: 'HIGH'
        });
    } else if (this.marine.waveHeight > 2.0) {
        riskLevel = Math.max(riskLevel, 'MEDIUM');
        factors.push({
            name: 'Moderate Waves',
            impact: 'NEGATIVE',
            severity: 'MEDIUM'
        });
    }

    // Storm risk assessment
    if (this.conditions.main === 'THUNDERSTORM') {
        riskLevel = 'CRITICAL';
        factors.push({
            name: 'Thunderstorm',
            impact: 'NEGATIVE',
            severity: 'HIGH'
        });
    } else if (this.conditions.main === 'RAIN' && this.precipitation.amount > 20) {
        riskLevel = Math.max(riskLevel, 'MEDIUM');
        factors.push({
            name: 'Heavy Rain',
            impact: 'NEGATIVE',
            severity: 'MEDIUM'
        });
    }

    // Visibility risk
    if (this.visibility < 1) {
        riskLevel = Math.max(riskLevel, 'MEDIUM');
        factors.push({
            name: 'Low Visibility',
            impact: 'NEGATIVE',
            severity: 'MEDIUM'
        });
    }

    this.safety.riskLevel = riskLevel;
    this.safety.fishingConditions.factors = factors;
};

// Instance method to assess fishing conditions
weatherDataSchema.methods.assessFishingConditions = function() {
    let score = 100;
    const factors = [];

    // Temperature factor (ideal: 20-28°C)
    if (this.marine.waterTemperature < 15 || this.marine.waterTemperature > 32) {
        score -= 20;
        factors.push({
            name: 'Extreme Water Temperature',
            impact: 'NEGATIVE',
            severity: 'HIGH'
        });
    }

    // Wind factor (ideal: < 20 km/h)
    if (this.wind.speed > 25) {
        score -= 25;
        factors.push({
            name: 'High Winds',
            impact: 'NEGATIVE',
            severity: 'HIGH'
        });
    }

    // Wave factor (ideal: < 1.5m)
    if (this.marine.waveHeight > 2.0) {
        score -= 20;
        factors.push({
            name: 'Rough Seas',
            impact: 'NEGATIVE',
            severity: 'HIGH'
        });
    }

    // Precipitation factor
    if (this.precipitation.amount > 10) {
        score -= 15;
        factors.push({
            name: 'Heavy Precipitation',
            impact: 'NEGATIVE',
            severity: 'MEDIUM'
        });
    }

    // Storm factor
    if (this.conditions.main === 'THUNDERSTORM') {
        score -= 40;
        factors.push({
            name: 'Storm Conditions',
            impact: 'NEGATIVE',
            severity: 'HIGH'
        });
    }

    // Positive factors
    if (this.marine.waterTemperature >= 22 && this.marine.waterTemperature <= 28) {
        score += 10;
        factors.push({
            name: 'Optimal Water Temperature',
            impact: 'POSITIVE',
            severity: 'MEDIUM'
        });
    }

    if (this.wind.speed <= 15) {
        score += 5;
        factors.push({
            name: 'Calm Winds',
            impact: 'POSITIVE',
            severity: 'LOW'
        });
    }

    score = Math.max(0, Math.min(100, score));

    // Determine rating
    let rating;
    if (score >= 80) rating = 'EXCELLENT';
    else if (score >= 60) rating = 'GOOD';
    else if (score >= 40) rating = 'FAIR';
    else if (score >= 20) rating = 'POOR';
    else rating = 'DANGEROUS';

    this.safety.fishingConditions.score = score;
    this.safety.fishingConditions.rating = rating;

    // Set recommendations based on safety and fishing conditions
    this.safety.recommendations = this.generateRecommendations(score, this.safety.riskLevel);
};

// Instance method to generate recommendations
weatherDataSchema.methods.generateRecommendations = function(fishingScore, riskLevel) {
    const recommendations = [];

    if (riskLevel === 'CRITICAL') {
        recommendations.push('AVOID_AREA');
    } else if (riskLevel === 'HIGH') {
        recommendations.push('RETURN_TO_SHORE');
    } else if (fishingScore >= 70) {
        recommendations.push('SAFE_TO_FISH');
    } else if (fishingScore >= 40) {
        recommendations.push('EXERCISE_CAUTION');
    } else {
        recommendations.push('MONITOR_CONDITIONS');
    }

    return recommendations;
};

// Static method to find current weather for location
weatherDataSchema.statics.findCurrentWeather = function(coordinates, maxDistance = 50000) {
    return this.findOne({
        'location': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat]
                },
                $maxDistance: maxDistance
            }
        },
        isCurrent: true,
        expiresAt: { $gt: new Date() }
    }).sort({ recordedAt: -1 });
};

// Static method to find weather history for location
weatherDataSchema.statics.findWeatherHistory = function(coordinates, hours = 24, maxDistance = 50000) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

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
        recordedAt: { $gte: startTime },
        isCurrent: true
    }).sort({ recordedAt: -1 });
};

// Static method to cleanup expired weather data
weatherDataSchema.statics.cleanupExpiredData = async function() {
    const result = await this.deleteMany({
        expiresAt: { $lte: new Date() }
    });

    return result;
};

// Static method to get weather statistics
weatherDataSchema.statics.getWeatherStats = async function(days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await this.aggregate([
        {
            $match: {
                recordedAt: { $gte: startDate },
                isCurrent: true
            }
        },
        {
            $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                avgTemperature: { $avg: '$temperature.current' },
                avgWindSpeed: { $avg: '$wind.speed' },
                avgWaveHeight: { $avg: '$marine.waveHeight' },
                riskLevels: {
                    $push: '$safety.riskLevel'
                },
                fishingScores: {
                    $push: '$safety.fishingConditions.score'
                }
            }
        },
        {
            $project: {
                totalRecords: 1,
                avgTemperature: { $round: ['$avgTemperature', 2] },
                avgWindSpeed: { $round: ['$avgWindSpeed', 2] },
                avgWaveHeight: { $round: ['$avgWaveHeight', 2] },
                riskDistribution: {
                    $arrayToObject: {
                        $map: {
                            input: '$riskLevels',
                            as: 'risk',
                            in: {
                                k: '$$risk',
                                v: {
                                    $sum: {
                                        $cond: [{ $eq: ['$$risk', '$$risk'] }, 1, 0]
                                    }
                                }
                            }
                        }
                    }
                },
                avgFishingScore: {
                    $round: [{ $avg: '$fishingScores' }, 2]
                }
            }
        }
    ]);

    return stats[0] || {
        totalRecords: 0,
        avgTemperature: 0,
        avgWindSpeed: 0,
        avgWaveHeight: 0,
        riskDistribution: {},
        avgFishingScore: 0
    };
};

const WeatherData = mongoose.model('WeatherData', weatherDataSchema);

module.exports = WeatherData;
