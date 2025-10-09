const mongoose = require('mongoose');
const User = require('./models/User');
const Alert = require('./models/Alert');
const FishingZone = require('./models/FishingZone');
const WeatherData = require('./models/WeatherData');
const bcrypt = require('bcryptjs');

class DatabaseSeeder {
    constructor() {
        this.seedData = {
            users: [],
            alerts: [],
            fishingZones: [],
            weatherData: []
        };
    }

    // Main seed method
    async seed() {
        try {
            console.log('🌱 Starting database seeding...');

            // Clear existing data
            await this.clearDatabase();

            // Seed users
            await this.seedUsers();

            // Seed fishing zones
            await this.seedFishingZones();

            // Seed weather data
            await this.seedWeatherData();

            // Seed alerts
            await this.seedAlerts();

            console.log('✅ Database seeding completed successfully');
            return this.getSeedSummary();

        } catch (error) {
            console.error('❌ Database seeding failed:', error);
            throw error;
        }
    }

    // Clear existing data
    async clearDatabase() {
        console.log('🧹 Clearing existing data...');

        await User.deleteMany({});
        await Alert.deleteMany({});
        await FishingZone.deleteMany({});
        await WeatherData.deleteMany({});

        console.log('✅ Database cleared');
    }

    // Seed users
    async seedUsers() {
        console.log('👥 Seeding users...');

        const hashedPassword = await bcrypt.hash('password123', 12);

        const users = [
            {
                username: 'rajesh_kumar',
                email: 'rajesh.kumar@example.com',
                password: hashedPassword,
                phone: '+919876543210',
                profile: {
                    firstName: 'Rajesh',
                    lastName: 'Kumar',
                    dateOfBirth: new Date('1980-05-15'),
                    gender: 'MALE',
                    bio: 'Traditional fisherman with 20 years of experience'
                },
                fishermanProfile: {
                    isFisherman: true,
                    licenseNumber: 'MH-FISH-001',
                    licenseExpiry: new Date('2025-12-31'),
                    yearsOfExperience: 20,
                    fishingMethods: ['NET', 'LINE'],
                    boatDetails: {
                        boatName: 'Sea Explorer',
                        boatType: 'MOTORIZED',
                        registrationNumber: 'MH-15-AB-1234',
                        capacity: 500,
                        length: 8,
                        enginePower: 25
                    },
                    preferredFishingAreas: [
                        {
                            name: 'Mumbai Harbor',
                            coordinates: { lat: 18.975, lng: 72.825 },
                            radius: 15
                        }
                    ],
                    targetSpecies: ['Pomfret', 'Mackerel', 'Bombay Duck'],
                    averageCatch: {
                        daily: 45,
                        weekly: 280,
                        monthly: 1100
                    }
                },
                location: {
                    current: {
                        coordinates: { lat: 19.0760, lng: 72.8777 },
                        timestamp: new Date(),
                        accuracy: 15,
                        speed: 0,
                        heading: 0
                    },
                    homePort: {
                        name: 'Mumbai Fishing Harbor',
                        coordinates: { lat: 18.975, lng: 72.825 }
                    },
                    isOnline: true
                },
                emergencyContacts: [
                    {
                        name: 'Sunita Kumar',
                        relationship: 'Wife',
                        phone: '+919876543211',
                        isPrimary: true
                    },
                    {
                        name: 'Rahul Kumar',
                        relationship: 'Son',
                        phone: '+919876543212'
                    }
                ],
                statistics: {
                    totalFishingTrips: 156,
                    totalCatchWeight: 6850,
                    successfulTrips: 132,
                    emergencyActivations: 2,
                    communityContributions: {
                        posts: 15,
                        safetyReports: 8,
                        catchReports: 45
                    },
                    lastFishingTrip: new Date(),
                    averageTripDuration: 240
                }
            },
            {
                username: 'suresh_patel',
                email: 'suresh.patel@example.com',
                password: hashedPassword,
                phone: '+919876543213',
                profile: {
                    firstName: 'Suresh',
                    lastName: 'Patel',
                    dateOfBirth: new Date('1975-08-22'),
                    gender: 'MALE',
                    bio: 'Experienced fisherman specializing in deep sea fishing'
                },
                fishermanProfile: {
                    isFisherman: true,
                    licenseNumber: 'MH-FISH-002',
                    licenseExpiry: new Date('2025-12-31'),
                    yearsOfExperience: 25,
                    fishingMethods: ['LINE', 'TRAP'],
                    boatDetails: {
                        boatName: 'Ocean Warrior',
                        boatType: 'SPEEDBOAT',
                        registrationNumber: 'MH-15-CD-5678',
                        capacity: 800,
                        length: 12,
                        enginePower: 45
                    },
                    preferredFishingAreas: [
                        {
                            name: 'Arabian Sea',
                            coordinates: { lat: 19.100, lng: 72.900 },
                            radius: 25
                        }
                    ],
                    targetSpecies: ['Tuna', 'Kingfish', 'Seer Fish'],
                    averageCatch: {
                        daily: 65,
                        weekly: 400,
                        monthly: 1600
                    }
                },
                location: {
                    current: {
                        coordinates: { lat: 19.0800, lng: 72.8800 },
                        timestamp: new Date(),
                        accuracy: 20,
                        speed: 8,
                        heading: 45
                    },
                    homePort: {
                        name: 'Versova Fishing Harbor',
                        coordinates: { lat: 19.130, lng: 72.810 }
                    },
                    isOnline: true
                },
                emergencyContacts: [
                    {
                        name: 'Meena Patel',
                        relationship: 'Wife',
                        phone: '+919876543214',
                        isPrimary: true
                    }
                ],
                statistics: {
                    totalFishingTrips: 203,
                    totalCatchWeight: 13200,
                    successfulTrips: 178,
                    emergencyActivations: 1,
                    communityContributions: {
                        posts: 8,
                        safetyReports: 12,
                        catchReports: 67
                    },
                    lastFishingTrip: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    averageTripDuration: 320
                }
            },
            {
                username: 'admin_user',
                email: 'admin@smartfishing.com',
                password: hashedPassword,
                phone: '+919876543215',
                profile: {
                    firstName: 'Admin',
                    lastName: 'User',
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'MALE'
                },
                role: 'ADMIN',
                fishermanProfile: {
                    isFisherman: false
                },
                location: {
                    isOnline: true
                }
            }
        ];

        this.seedData.users = await User.insertMany(users);
        console.log(`✅ Seeded ${this.seedData.users.length} users`);
    }

    // Seed fishing zones
    async seedFishingZones() {
        console.log('🎣 Seeding fishing zones...');

        const fishingZones = [
            {
                name: 'Mumbai Harbor Entrance',
                zoneId: 'ZONE_MH_001',
                description: 'Productive fishing area near harbor entrance with good current',
                location: {
                    type: 'Point',
                    coordinates: [72.8777, 19.0760]
                },
                bounds: {
                    northeast: { lat: 19.0860, lng: 72.8877 },
                    southwest: { lat: 19.0660, lng: 72.8677 }
                },
                radius: 2000,
                depthRange: {
                    min: 8,
                    max: 25,
                    average: 15
                },
                waterTemperature: {
                    current: 26,
                    range: { min: 22, max: 30 }
                },
                oxygenLevel: 7.2,
                salinity: 35,
                currentSpeed: 0.8,
                commonSpecies: [
                    {
                        name: 'Pomfret',
                        abundance: 'HIGH',
                        season: { start: 'October', end: 'March' },
                        averageSize: 35,
                        catchRate: 75
                    },
                    {
                        name: 'Mackerel',
                        abundance: 'HIGH',
                        season: { start: 'June', end: 'September' },
                        averageSize: 25,
                        catchRate: 80
                    }
                ],
                fishingConditions: {
                    bestTime: {
                        timeOfDay: ['EARLY_MORNING', 'EVENING'],
                        tide: 'RISING',
                        season: ['October', 'November', 'December']
                    },
                    recommendedMethods: ['NET', 'LINE'],
                    difficulty: 'EASY',
                    accessibility: 'EASY'
                },
                prediction: {
                    confidence: 85,
                    probability: 0.82,
                    factors: [
                        { name: 'Water Temperature', value: 26, weight: 0.3, impact: 'POSITIVE' },
                        { name: 'Current Speed', value: 0.8, weight: 0.2, impact: 'POSITIVE' },
                        { name: 'Oxygen Level', value: 7.2, weight: 0.25, impact: 'POSITIVE' }
                    ],
                    lastUpdated: new Date(),
                    modelVersion: 'v1.2'
                },
                safety: {
                    hazards: [
                        {
                            type: 'CURRENT',
                            description: 'Strong currents during high tide',
                            severity: 'MEDIUM',
                            location: {
                                coordinates: { lat: 19.0760, lng: 72.8777 },
                                radius: 500
                            }
                        }
                    ],
                    restrictions: ['SIZE_LIMIT'],
                    emergencyContacts: [
                        {
                            name: 'Mumbai Coast Guard',
                            phone: '+911800123456',
                            type: 'COAST_GUARD'
                        }
                    ]
                },
                historicalData: {
                    totalVisits: 156,
                    successRate: 72,
                    averageCatch: 38,
                    lastSuccessfulTrip: new Date(),
                    popularTimes: [
                        { hour: 6, visitCount: 45 },
                        { hour: 17, visitCount: 38 }
                    ]
                },
                ratings: {
                    average: 4.2,
                    count: 23,
                    reviews: [
                        {
                            userId: this.seedData.users[0]._id,
                            rating: 4,
                            comment: 'Great spot for pomfret, especially during rising tide',
                            catchDetails: {
                                species: ['Pomfret', 'Mackerel'],
                                totalWeight: 42,
                                fishingMethod: 'NET'
                            }
                        }
                    ]
                },
                isRecommended: true,
                popularity: 78,
                source: 'AI_PREDICTION',
                tags: ['harbor', 'pomfret', 'mackerel', 'easy-access']
            },
            {
                name: 'Arabian Sea Deep Zone',
                zoneId: 'ZONE_AS_001',
                description: 'Deep sea fishing area with large pelagic species',
                location: {
                    type: 'Point',
                    coordinates: [72.9000, 19.1000]
                },
                bounds: {
                    northeast: { lat: 19.1200, lng: 72.9200 },
                    southwest: { lat: 19.0800, lng: 72.8800 }
                },
                radius: 5000,
                depthRange: {
                    min: 40,
                    max: 120,
                    average: 75
                },
                waterTemperature: {
                    current: 24,
                    range: { min: 20, max: 28 }
                },
                oxygenLevel: 6.8,
                salinity: 36,
                currentSpeed: 1.2,
                commonSpecies: [
                    {
                        name: 'Tuna',
                        abundance: 'MEDIUM',
                        season: { start: 'January', end: 'April' },
                        averageSize: 80,
                        catchRate: 60
                    },
                    {
                        name: 'Kingfish',
                        abundance: 'HIGH',
                        season: { start: 'September', end: 'December' },
                        averageSize: 65,
                        catchRate: 70
                    }
                ],
                fishingConditions: {
                    bestTime: {
                        timeOfDay: ['MORNING', 'AFTERNOON'],
                        tide: 'HIGH',
                        season: ['September', 'October', 'November']
                    },
                    recommendedMethods: ['LINE'],
                    difficulty: 'HARD',
                    accessibility: 'DIFFICULT'
                },
                prediction: {
                    confidence: 72,
                    probability: 0.68,
                    factors: [
                        { name: 'Water Temperature', value: 24, weight: 0.3, impact: 'POSITIVE' },
                        { name: 'Current Speed', value: 1.2, weight: 0.15, impact: 'NEGATIVE' },
                        { name: 'Depth', value: 75, weight: 0.25, impact: 'POSITIVE' }
                    ],
                    lastUpdated: new Date(),
                    modelVersion: 'v1.2'
                },
                safety: {
                    hazards: [
                        {
                            type: 'CURRENT',
                            description: 'Strong offshore currents',
                            severity: 'HIGH',
                            location: {
                                coordinates: { lat: 19.1000, lng: 72.9000 },
                                radius: 2000
                            }
                        }
                    ],
                    restrictions: ['NO_FISHING', 'GEAR_RESTRICTION'],
                    emergencyContacts: [
                        {
                            name: 'Indian Coast Guard',
                            phone: '+911800654321',
                            type: 'COAST_GUARD'
                        }
                    ]
                },
                historicalData: {
                    totalVisits: 89,
                    successRate: 58,
                    averageCatch: 52,
                    lastSuccessfulTrip: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    popularTimes: [
                        { hour: 8, visitCount: 28 },
                        { hour: 12, visitCount: 32 }
                    ]
                },
                ratings: {
                    average: 4.5,
                    count: 15,
                    reviews: [
                        {
                            userId: this.seedData.users[1]._id,
                            rating: 5,
                            comment: 'Excellent for big game fishing, but requires experience',
                            catchDetails: {
                                species: ['Tuna', 'Kingfish'],
                                totalWeight: 85,
                                fishingMethod: 'LINE'
                            }
                        }
                    ]
                },
                isRecommended: true,
                popularity: 65,
                source: 'AI_PREDICTION',
                tags: ['deep-sea', 'tuna', 'kingfish', 'experienced']
            }
        ];

        this.seedData.fishingZones = await FishingZone.insertMany(fishingZones);
        console.log(`✅ Seeded ${this.seedData.fishingZones.length} fishing zones`);
    }

    // Seed weather data
    async seedWeatherData() {
        console.log('🌤️ Seeding weather data...');

        const weatherData = [
            {
                location: {
                    type: 'Point',
                    coordinates: [72.8777, 19.0760],
                    name: 'Mumbai Harbor',
                    region: 'West Coast'
                },
                temperature: {
                    current: 26,
                    feelsLike: 28,
                    min: 24,
                    max: 29
                },
                humidity: 75,
                pressure: 1013,
                visibility: 10,
                wind: {
                    speed: 12,
                    direction: 180,
                    gust: 18
                },
                precipitation: {
                    probability: 20,
                    amount: 0,
                    type: 'NONE',
                    lastHour: 0
                },
                clouds: {
                    cover: 30,
                    type: 'SCATTERED',
                    base: 1500
                },
                marine: {
                    waveHeight: 1.2,
                    waveDirection: 165,
                    wavePeriod: 8,
                    swellHeight: 1.0,
                    swellDirection: 170,
                    swellPeriod: 10,
                    waterTemperature: 26,
                    tide: {
                        height: 1.8,
                        state: 'RISING',
                        nextHigh: new Date(Date.now() + 4 * 60 * 60 * 1000),
                        nextLow: new Date(Date.now() + 10 * 60 * 60 * 1000)
                    },
                    current: {
                        speed: 0.6,
                        direction: 175
                    }
                },
                conditions: {
                    main: 'CLOUDS',
                    description: 'scattered clouds',
                    icon: '03d',
                    code: 802
                },
                astronomy: {
                    sunrise: new Date().setHours(6, 30, 0, 0),
                    sunset: new Date().setHours(18, 45, 0, 0),
                    moonPhase: 'WAXING_CRESCENT',
                    moonIllumination: 25
                },
                airQuality: {
                    aqi: 45,
                    pm25: 12,
                    pm10: 25,
                    o3: 45,
                    no2: 18,
                    so2: 8,
                    co: 0.5
                },
                alerts: [
                    {
                        sender: 'India Meteorological Department',
                        event: 'Small Craft Advisory',
                        description: 'Winds expected to increase to 25-30 km/h in the afternoon',
                        severity: 'MEDIUM',
                        start: new Date(),
                        end: new Date(Date.now() + 6 * 60 * 60 * 1000),
                        tags: ['marine', 'wind']
                    }
                ],
                source: {
                    provider: 'OPENWEATHERMAP',
                    confidence: 85
                },
                recordedAt: new Date(),
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
            }
        ];

        // Auto-assess safety and fishing conditions
        weatherData.forEach(data => {
            const weatherDoc = new WeatherData(data);
            weatherDoc.assessSafety();
            weatherDoc.assessFishingConditions();
            return weatherDoc;
        });

        this.seedData.weatherData = await WeatherData.insertMany(weatherData);
        console.log(`✅ Seeded ${this.seedData.weatherData.length} weather records`);
    }

    // Seed alerts
    async seedAlerts() {
        console.log('🚨 Seeding alerts...');

        const alerts = [
            {
                type: 'SAFETY_HAZARD',
                severity: 'MEDIUM',
                title: 'Strong Currents Reported',
                description: 'Fishermen report unusually strong currents near harbor entrance. Exercise caution.',
                location: {
                    coordinates: { lat: 19.0765, lng: 72.8780 },
                    accuracy: 50
                },
                radius: 5,
                userId: this.seedData.users[0]._id,
                userName: 'Rajesh Kumar',
                triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000),
                status: 'ACTIVE',
                priority: 'MEDIUM',
                safetyHazardData: {
                    hazardType: 'CURRENT',
                    riskLevel: 'MEDIUM',
                    recommendedAction: 'Avoid area during peak current times',
                    confirmedBy: [
                        {
                            userId: this.seedData.users[1]._id,
                            userName: 'Suresh Patel',
                            confirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
                        }
                    ]
                },
                source: 'USER',
                confidence: 80,
                tags: ['current', 'safety', 'harbor']
            },
            {
                type: 'WEATHER_ALERT',
                severity: 'HIGH',
                title: 'Thunderstorm Warning',
                description: 'Thunderstorms expected in the area within the next 3 hours. Return to shore immediately.',
                location: {
                    coordinates: { lat: 19.1000, lng: 72.9000 },
                    accuracy: 10000
                },
                radius: 50,
                userId: this.seedData.users[2]._id, // Admin user
                userName: 'Admin User',
                triggeredAt: new Date(),
                expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
                status: 'ACTIVE',
                priority: 'HIGH',
                weatherAlertData: {
                    condition: 'THUNDERSTORM',
                    windSpeed: 35,
                    waveHeight: 2.8,
                    temperature: 24,
                    precipitation: 80,
                    visibility: 2,
                    stormDistance: 25
                },
                response: {
                    acknowledgedBy: [
                        {
                            userId: this.seedData.users[0]._id,
                            userName: 'Rajesh Kumar',
                            acknowledgedAt: new Date(),
                            role: 'FISHERMAN'
                        }
                    ]
                },
                source: 'SYSTEM',
                confidence: 90,
                tags: ['weather', 'thunderstorm', 'safety']
            }
        ];

        this.seedData.alerts = await Alert.insertMany(alerts);
        console.log(`✅ Seeded ${this.seedData.alerts.length} alerts`);
    }

    // Get seed summary
    getSeedSummary() {
        return {
            users: this.seedData.users.length,
            alerts: this.seedData.alerts.length,
            fishingZones: this.seedData.fishingZones.length,
            weatherData: this.seedData.weatherData.length,
            sampleData: {
                users: this.seedData.users.map(u => ({
                    username: u.username,
                    role: u.role,
                    isFisherman: u.fishermanProfile.isFisherman
                })),
                fishingZones: this.seedData.fishingZones.map(z => ({
                    name: z.name,
                    zoneId: z.zoneId,
                    isRecommended: z.isRecommended
                }))
            }
        };
    }

    // Method to add more test data
    async addTestData() {
        console.log('🧪 Adding additional test data...');

        // Add more test data as needed
        // This method can be extended for specific testing scenarios

        console.log('✅ Test data added');
    }
}

module.exports = DatabaseSeeder;
