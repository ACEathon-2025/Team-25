class MarineConditions {
    constructor() {
        this.marineDataCache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
        this.tideStations = new Map(); // Mock tide station data
        this.initializeTideStations();
    }

    // Initialize mock tide stations
    initializeTideStations() {
        this.tideStations.set('mumbai', {
            name: 'Mumbai Harbor',
            location: { lat: 18.975, lng: 72.825 },
            timezone: 'Asia/Kolkata',
            tidePattern: 'semi-diurnal'
        });

        this.tideStations.set('chennai', {
            name: 'Chennai Port',
            location: { lat: 13.083, lng: 80.283 },
            timezone: 'Asia/Kolkata',
            tidePattern: 'mixed'
        });

        this.tideStations.set('kolkata', {
            name: 'Kolkata Dock',
            location: { lat: 22.567, lng: 88.367 },
            timezone: 'Asia/Kolkata',
            tidePattern: 'semi-diurnal'
        });
    }

    // Get marine conditions for location
    async getMarineConditions(location) {
        try {
            const cacheKey = `marine_${location.lat}_${location.lng}`;
            const cached = this.getCachedData(cacheKey);
            
            if (cached) {
                return cached;
            }

            console.log(`🌊 Fetching marine conditions for: ${location.lat}, ${location.lng}`);

            const marineData = {
                waveHeight: this.calculateWaveHeight(location),
                waveDirection: this.calculateWaveDirection(location),
                waterTemperature: this.calculateWaterTemperature(location),
                swellHeight: this.calculateSwellHeight(location),
                swellPeriod: this.calculateSwellPeriod(location),
                swellDirection: this.calculateSwellDirection(location),
                tide: await this.getTideData(location),
                currentSpeed: this.calculateCurrentSpeed(location),
                currentDirection: this.calculateCurrentDirection(location),
                visibility: this.calculateWaterVisibility(location),
                salinity: this.calculateSalinity(location),
                timestamp: new Date().toISOString(),
                dataSource: 'Marine Conditions Model'
            };

            // Cache the result
            this.setCachedData(cacheKey, marineData);

            return marineData;

        } catch (error) {
            console.error('❌ Marine conditions fetch failed:', error);
            return this.getMockMarineConditions(location);
        }
    }

    // Get marine forecast
    async getMarineForecast(location, hours = 24) {
        try {
            const cacheKey = `marine_forecast_${location.lat}_${location.lng}_${hours}`;
            const cached = this.getCachedData(cacheKey);
            
            if (cached) {
                return cached;
            }

            console.log(`📈 Generating marine forecast for: ${location.lat}, ${location.lng}`);

            const forecast = {
                location: location,
                hourly: [],
                daily: [],
                timestamp: new Date().toISOString(),
                dataSource: 'Marine Forecast Model'
            };

            // Generate hourly forecast
            for (let i = 0; i < hours; i += 3) {
                const forecastTime = new Date(Date.now() + i * 60 * 60 * 1000);
                
                forecast.hourly.push({
                    time: forecastTime.toISOString(),
                    waveHeight: this.forecastWaveHeight(location, i),
                    waveDirection: this.forecastWaveDirection(location, i),
                    waterTemperature: this.forecastWaterTemperature(location, i),
                    swellHeight: this.forecastSwellHeight(location, i),
                    swellPeriod: this.forecastSwellPeriod(location, i),
                    tide: await this.forecastTide(location, forecastTime)
                });
            }

            // Generate daily summary
            for (let i = 0; i < 3; i++) {
                const dayStart = new Date();
                dayStart.setDate(dayStart.getDate() + i);
                dayStart.setHours(0, 0, 0, 0);

                forecast.daily.push({
                    date: dayStart.toDateString(),
                    maxWaveHeight: this.calculateDailyMaxWaveHeight(forecast.hourly, i),
                    minWaveHeight: this.calculateDailyMinWaveHeight(forecast.hourly, i),
                    avgWaterTemperature: this.calculateDailyAvgTemperature(forecast.hourly, i),
                    tideCycles: await this.getDailyTideCycles(location, dayStart)
                });
            }

            // Cache the result
            this.setCachedData(cacheKey, forecast);

            return forecast;

        } catch (error) {
            console.error('❌ Marine forecast generation failed:', error);
            return this.getMockMarineForecast(location, hours);
        }
    }

    // Calculate wave height based on location and season
    calculateWaveHeight(location) {
        // Mock calculation - in real app, use wave model data
        const baseHeight = 0.5;
        const seasonalFactor = this.getSeasonalFactor();
        const windFactor = this.getWindFactor(location);
        
        return baseHeight + seasonalFactor + windFactor + (Math.random() * 0.5);
    }

    // Calculate wave direction
    calculateWaveDirection(location) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    // Calculate water temperature
    calculateWaterTemperature(location) {
        const baseTemp = 25; // Base temperature for tropical waters
        const seasonalVariation = this.getSeasonalTemperatureVariation();
        const latVariation = (location.lat - 15) * 0.3; // Cooler as we go north
        
        return baseTemp + seasonalVariation + latVariation + (Math.random() * 2 - 1);
    }

    // Calculate swell height
    calculateSwellHeight(location) {
        return this.calculateWaveHeight(location) * 0.8 + (Math.random() * 0.3);
    }

    // Calculate swell period
    calculateSwellPeriod(location) {
        return 8 + Math.random() * 6; // 8-14 seconds
    }

    // Calculate swell direction
    calculateSwellDirection(location) {
        return this.calculateWaveDirection(location);
    }

    // Get tide data
    async getTideData(location) {
        const nearestStation = this.findNearestTideStation(location);
        const now = new Date();
        
        return {
            station: nearestStation.name,
            height: this.calculateTideHeight(nearestStation, now),
            state: this.getTideState(nearestStation, now),
            nextHighTide: this.calculateNextHighTide(nearestStation, now),
            nextLowTide: this.calculateNextLowTide(nearestStation, now),
            range: this.calculateTideRange(nearestStation)
        };
    }

    // Calculate current speed
    calculateCurrentSpeed(location) {
        return 0.2 + Math.random() * 1.0; // 0.2-1.2 m/s
    }

    // Calculate current direction
    calculateCurrentDirection(location) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    // Calculate water visibility
    calculateWaterVisibility(location) {
        return 5 + Math.random() * 10; // 5-15 meters
    }

    // Calculate salinity
    calculateSalinity(location) {
        return 33 + Math.random() * 5; // 33-38 ppt
    }

    // Find nearest tide station
    findNearestTideStation(location) {
        let nearestStation = null;
        let minDistance = Infinity;

        for (const station of this.tideStations.values()) {
            const distance = this.calculateDistance(
                location.lat, location.lng,
                station.location.lat, station.location.lng
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestStation = station;
            }
        }

        return nearestStation || this.tideStations.values().next().value;
    }

    // Calculate distance between coordinates
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Calculate tide height (mock implementation)
    calculateTideHeight(station, time) {
        const hour = time.getHours();
        const minute = time.getMinutes();
        const timeOfDay = hour + minute / 60;

        // Simple sinusoidal tide model
        const tide = Math.sin((timeOfDay * Math.PI) / 12) * 2.0 + 1.0;
        return Math.round(tide * 10) / 10; // Round to 1 decimal
    }

    // Get tide state
    getTideState(station, time) {
        const tideHeight = this.calculateTideHeight(station, time);
        const tideTrend = this.calculateTideTrend(station, time);

        if (tideTrend > 0) return 'rising';
        if (tideTrend < 0) return 'falling';
        
        if (tideHeight > 2.5) return 'high';
        if (tideHeight < 0.5) return 'low';
        return 'mid';
    }

    // Calculate tide trend
    calculateTideTrend(station, time) {
        const currentHeight = this.calculateTideHeight(station, time);
        const futureHeight = this.calculateTideHeight(station, new Date(time.getTime() + 30 * 60 * 1000));
        
        return futureHeight - currentHeight;
    }

    // Calculate next high tide
    calculateNextHighTide(station, currentTime) {
        const nextHigh = new Date(currentTime);
        nextHigh.setHours((currentTime.getHours() + 6) % 24, 0, 0, 0);
        return nextHigh.toISOString();
    }

    // Calculate next low tide
    calculateNextLowTide(station, currentTime) {
        const nextLow = new Date(currentTime);
        nextLow.setHours((currentTime.getHours() + 12) % 24, 0, 0, 0);
        return nextLow.toISOString();
    }

    // Calculate tide range
    calculateTideRange(station) {
        return 3.0; // Mock range in meters
    }

    // Get seasonal factor for waves
    getSeasonalFactor() {
        const month = new Date().getMonth();
        // Higher waves during monsoon (June-September)
        if (month >= 5 && month <= 8) return 1.0;
        // Moderate waves during transition months
        if (month >= 3 && month <= 4) return 0.5;
        if (month >= 9 && month <= 10) return 0.5;
        // Calm waves during winter
        return 0.2;
    }

    // Get wind factor for waves
    getWindFactor(location) {
        // Mock wind factor - in real app, use actual wind data
        return Math.random() * 0.8;
    }

    // Get seasonal temperature variation
    getSeasonalTemperatureVariation() {
        const month = new Date().getMonth();
        // Warmer in summer (March-May)
        if (month >= 2 && month <= 4) return 2.0;
        // Cooler in winter (December-February)
        if (month === 11 || month <= 1) return -2.0;
        return 0.0;
    }

    // Forecast methods (similar to current but with time offset)
    forecastWaveHeight(location, hoursAhead) {
        return this.calculateWaveHeight(location) + (hoursAhead * 0.05);
    }

    forecastWaveDirection(location, hoursAhead) {
        return this.calculateWaveDirection(location);
    }

    forecastWaterTemperature(location, hoursAhead) {
        return this.calculateWaterTemperature(location) + (hoursAhead * 0.1);
    }

    forecastSwellHeight(location, hoursAhead) {
        return this.calculateSwellHeight(location) + (hoursAhead * 0.03);
    }

    forecastSwellPeriod(location, hoursAhead) {
        return this.calculateSwellPeriod(location);
    }

    async forecastTide(location, time) {
        const station = this.findNearestTideStation(location);
        return {
            height: this.calculateTideHeight(station, time),
            state: this.getTideState(station, time)
        };
    }

    // Daily calculation methods
    calculateDailyMaxWaveHeight(hourlyForecast, dayOffset) {
        const dayHours = hourlyForecast.filter(hour => {
            const hourDate = new Date(hour.time);
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + dayOffset);
            return hourDate.toDateString() === targetDate.toDateString();
        });

        return Math.max(...dayHours.map(hour => hour.waveHeight));
    }

    calculateDailyMinWaveHeight(hourlyForecast, dayOffset) {
        const dayHours = hourlyForecast.filter(hour => {
            const hourDate = new Date(hour.time);
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + dayOffset);
            return hourDate.toDateString() === targetDate.toDateString();
        });

        return Math.min(...dayHours.map(hour => hour.waveHeight));
    }

    calculateDailyAvgTemperature(hourlyForecast, dayOffset) {
        const dayHours = hourlyForecast.filter(hour => {
            const hourDate = new Date(hour.time);
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + dayOffset);
            return hourDate.toDateString() === targetDate.toDateString();
        });

        const sum = dayHours.reduce((total, hour) => total + hour.waterTemperature, 0);
        return Math.round((sum / dayHours.length) * 10) / 10;
    }

    async getDailyTideCycles(location, date) {
        const station = this.findNearestTideStation(location);
        return [
            { time: `${date.getHours()}:00`, height: 1.2, state: 'low' },
            { time: `${(date.getHours() + 6) % 24}:00`, height: 3.1, state: 'high' },
            { time: `${(date.getHours() + 12) % 24}:00`, height: 0.8, state: 'low' },
            { time: `${(date.getHours() + 18) % 24}:00`, height: 2.9, state: 'high' }
        ];
    }

    // Cache management
    getCachedData(key) {
        const cached = this.marineDataCache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.marineDataCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Mock data methods
    getMockMarineConditions(location) {
        return {
            waveHeight: 1.2 + Math.random() * 1.0,
            waveDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
            waterTemperature: 26 + Math.random() * 4,
            swellHeight: 1.0 + Math.random() * 0.8,
            swellPeriod: 10 + Math.random() * 4,
            swellDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
            tide: {
                station: 'Mock Station',
                height: 1.5 + Math.random() * 1.5,
                state: ['low', 'rising', 'high', 'falling'][Math.floor(Math.random() * 4)],
                nextHighTide: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                nextLowTide: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
                range: 2.5 + Math.random() * 1.0
            },
            currentSpeed: 0.5 + Math.random() * 0.7,
            currentDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
            visibility: 8 + Math.random() * 7,
            salinity: 35 + Math.random() * 3,
            timestamp: new Date().toISOString(),
            dataSource: 'Mock Marine Data'
        };
    }

    getMockMarineForecast(location, hours) {
        const forecast = {
            location: location,
            hourly: [],
            daily: [],
            timestamp: new Date().toISOString(),
            dataSource: 'Mock Marine Forecast'
        };

        // Generate hourly forecast
        for (let i = 0; i < hours; i += 3) {
            const forecastTime = new Date(Date.now() + i * 60 * 60 * 1000);
            
            forecast.hourly.push({
                time: forecastTime.toISOString(),
                waveHeight: 1.0 + Math.random() * 1.5,
                waveDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
                waterTemperature: 25 + Math.random() * 5,
                swellHeight: 0.8 + Math.random() * 1.2,
                swellPeriod: 8 + Math.random() * 6,
                tide: {
                    height: 1.0 + Math.random() * 2.0,
                    state: ['low', 'rising', 'high', 'falling'][Math.floor(Math.random() * 4)]
                }
            });
        }

        // Generate daily summary
        for (let i = 0; i < 3; i++) {
            forecast.daily.push({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toDateString(),
                maxWaveHeight: 1.5 + Math.random() * 1.5,
                minWaveHeight: 0.5 + Math.random() * 0.8,
                avgWaterTemperature: 26 + Math.random() * 3,
                tideCycles: [
                    { time: '06:00', height: 0.8, state: 'low' },
                    { time: '12:00', height: 2.8, state: 'high' },
                    { time: '18:00', height: 1.2, state: 'low' },
                    { time: '00:00', height: 3.0, state: 'high' }
                ]
            });
        }

        return forecast;
    }

    // Get marine conditions statistics
    getStats() {
        return {
            tideStations: this.tideStations.size,
            cacheSize: this.marineDataCache.size,
            cacheTimeout: this.cacheTimeout
        };
    }
}

module.exports = MarineConditions;
