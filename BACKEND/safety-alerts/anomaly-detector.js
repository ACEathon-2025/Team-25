const axios = require('axios');

class WeatherMonitor {
    constructor() {
        this.weatherApiKey = process.env.OPENWEATHER_API_KEY;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.weatherCache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }

    // Assess weather threat for a location
    async assessWeatherThreat(location, currentWeather = null) {
        try {
            console.log(`🌤️ Assessing weather threat for location:`, location);

            // Get current weather data if not provided
            if (!currentWeather) {
                currentWeather = await this.getCurrentWeather(location);
            }

            // Get forecast for next 6 hours
            const forecast = await this.getWeatherForecast(location);
            
            // Analyze threats
            const threats = this.analyzeWeatherThreats(currentWeather, forecast);
            const overallSeverity = this.calculateOverallSeverity(threats);
            
            return {
                location: location,
                currentWeather: currentWeather,
                forecast: forecast.hourly.slice(0, 6), // Next 6 hours
                threats: threats,
                severity: overallSeverity,
                recommendation: this.generateWeatherRecommendation(threats, overallSeverity),
                timestamp: new Date().toISOString(),
                safeToFish: overallSeverity === 'LOW'
            };

        } catch (error) {
            console.error('❌ Weather threat assessment failed:', error);
            throw error;
        }
    }

    // Get current weather from API
    async getCurrentWeather(location) {
        const cacheKey = `current_${location.lat}_${location.lng}`;
        const cached = this.weatherCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }

        try {
            const response = await axios.get(`${this.baseUrl}/weather`, {
                params: {
                    lat: location.lat,
                    lon: location.lng,
                    appid: this.weatherApiKey,
                    units: 'metric'
                }
            });

            const weatherData = this.transformWeatherData(response.data);
            
            // Cache the result
            this.weatherCache.set(cacheKey, {
                data: weatherData,
                timestamp: Date.now()
            });

            return weatherData;

        } catch (error) {
            console.error('❌ Weather API error:', error.response?.data || error.message);
            
            // Return mock data if API fails (for demo purposes)
            return this.getMockWeatherData(location);
        }
    }

    // Get weather forecast
    async getWeatherForecast(location) {
        const cacheKey = `forecast_${location.lat}_${location.lng}`;
        const cached = this.weatherCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }

        try {
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    lat: location.lat,
                    lon: location.lng,
                    appid: this.weatherApiKey,
                    units: 'metric'
                }
            });

            const forecastData = this.transformForecastData(response.data);
            
            // Cache the result
            this.weatherCache.set(cacheKey, {
                data: forecastData,
                timestamp: Date.now()
            });

            return forecastData;

        } catch (error) {
            console.error('❌ Forecast API error:', error.response?.data || error.message);
            return this.getMockForecastData(location);
        }
    }

    // Analyze weather threats
    analyzeWeatherThreats(currentWeather, forecast) {
        const threats = [];

        // Check wind speed
        if (currentWeather.windSpeed > 25) {
            threats.push({
                type: 'HIGH_WINDS',
                severity: currentWeather.windSpeed > 35 ? 'HIGH' : 'MEDIUM',
                value: currentWeather.windSpeed,
                unit: 'km/h',
                description: `High wind speed: ${currentWeather.windSpeed} km/h`,
                recommendation: 'Consider returning to shore if winds increase'
            });
        }

        // Check wave height
        if (currentWeather.waveHeight > 2.0) {
            threats.push({
                type: 'HIGH_WAVES',
                severity: currentWeather.waveHeight > 3.0 ? 'HIGH' : 'MEDIUM',
                value: currentWeather.waveHeight,
                unit: 'meters',
                description: `High waves: ${currentWeather.waveHeight}m`,
                recommendation: 'Exercise caution, waves may be dangerous'
            });
        }

        // Check for storms in forecast
        const stormThreat = this.checkStormInForecast(forecast);
        if (stormThreat) {
            threats.push(stormThreat);
        }

        // Check visibility
        if (currentWeather.visibility < 2) {
            threats.push({
                type: 'LOW_VISIBILITY',
                severity: 'MEDIUM',
                value: currentWeather.visibility,
                unit: 'km',
                description: `Low visibility: ${currentWeather.visibility}km`,
                recommendation: 'Use navigation lights and radar if available'
            });
        }

        // Check lightning
        if (currentWeather.hasLightning) {
            threats.push({
                type: 'LIGHTNING',
                severity: 'HIGH',
                description: 'Lightning activity detected',
                recommendation: 'Return to shore immediately'
            });
        }

        return threats;
    }

    // Check for storms in forecast
    checkStormInForecast(forecast) {
        const stormConditions = ['thunderstorm', 'tornado', 'hurricane', 'squall'];
        
        const upcomingStorm = forecast.hourly.find(hour => {
            return stormConditions.some(condition => 
                hour.condition.toLowerCase().includes(condition)
            );
        });

        if (upcomingStorm) {
            return {
                type: 'STORM_WARNING',
                severity: 'HIGH',
                description: `Storm expected at ${new Date(upcomingStorm.timestamp).toLocaleTimeString()}`,
                recommendation: 'Return to shore immediately and seek shelter',
                expectedTime: upcomingStorm.timestamp
            };
        }

        return null;
    }

    // Calculate overall severity
    calculateOverallSeverity(threats) {
        if (threats.length === 0) return 'LOW';

        const severityLevels = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'CRITICAL': 3 };
        let maxSeverity = 'LOW';

        threats.forEach(threat => {
            if (severityLevels[threat.severity] > severityLevels[maxSeverity]) {
                maxSeverity = threat.severity;
            }
        });

        return maxSeverity;
    }

    // Generate weather recommendation
    generateWeatherRecommendation(threats, overallSeverity) {
        const recommendations = {
            'LOW': 'Weather conditions are favorable for fishing. Normal precautions advised.',
            'MEDIUM': 'Exercise caution. Monitor weather conditions closely.',
            'HIGH': 'Consider returning to shore. Weather conditions are deteriorating.',
            'CRITICAL': 'Return to shore immediately. Dangerous weather conditions.'
        };

        let recommendation = recommendations[overallSeverity];

        // Add specific threat recommendations
        if (threats.some(t => t.type === 'LIGHTNING')) {
            recommendation += ' Lightning detected - seek shelter immediately.';
        }

        if (threats.some(t => t.type === 'STORM_WARNING')) {
            recommendation += ' Storm approaching - take immediate action.';
        }

        return recommendation;
    }

    // Transform API weather data
    transformWeatherData(apiData) {
        return {
            temperature: apiData.main.temp,
            feelsLike: apiData.main.feels_like,
            humidity: apiData.main.humidity,
            pressure: apiData.main.pressure,
            windSpeed: apiData.wind.speed * 3.6, // Convert m/s to km/h
            windDirection: apiData.wind.deg,
            condition: apiData.weather[0].description,
            visibility: apiData.visibility / 1000, // Convert to km
            cloudCover: apiData.clouds.all,
            waveHeight: this.estimateWaveHeight(apiData.wind.speed),
            hasLightning: apiData.weather.some(w => w.main === 'Thunderstorm'),
            timestamp: new Date().toISOString()
        };
    }

    // Transform forecast data
    transformForecastData(apiData) {
        return {
            hourly: apiData.list.slice(0, 8).map(item => ({
                timestamp: new Date(item.dt * 1000).toISOString(),
                temperature: item.main.temp,
                condition: item.weather[0].description,
                windSpeed: item.wind.speed * 3.6,
                precipitation: item.pop * 100, // Probability of precipitation
                humidity: item.main.humidity
            })),
            daily: apiData.list.filter((_, index) => index % 8 === 0).slice(0, 3) // 3 days
        };
    }

    // Estimate wave height based on wind speed
    estimateWaveHeight(windSpeedMs) {
        const windSpeedKmh = windSpeedMs * 3.6;
        
        if (windSpeedKmh < 10) return 0.1 + (Math.random() * 0.3);
        if (windSpeedKmh < 20) return 0.5 + (Math.random() * 0.5);
        if (windSpeedKmh < 30) return 1.0 + (Math.random() * 0.8);
        if (windSpeedKmh < 40) return 1.8 + (Math.random() * 0.7);
        return 2.5 + (Math.random() * 1.5);
    }

    // Mock weather data for demo
    getMockWeatherData(location) {
        return {
            temperature: 25 + (Math.random() * 10),
            humidity: 60 + (Math.random() * 30),
            pressure: 1010 + (Math.random() * 20),
            windSpeed: 5 + (Math.random() * 25),
            condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain'][Math.floor(Math.random() * 4)],
            visibility: 5 + (Math.random() * 15),
            waveHeight: 0.5 + (Math.random() * 2.5),
            hasLightning: Math.random() > 0.9,
            timestamp: new Date().toISOString()
        };
    }

    // Mock forecast data for demo
    getMockForecastData(location) {
        const hourly = [];
        for (let i = 0; i < 8; i++) {
            hourly.push({
                timestamp: new Date(Date.now() + (i * 60 * 60 * 1000)).toISOString(),
                temperature: 24 + (Math.random() * 8),
                condition: ['Clear', 'Cloudy', 'Rain', 'Storm'][Math.floor(Math.random() * 4)],
                windSpeed: 5 + (Math.random() * 30),
                precipitation: Math.random() * 100
            });
        }

        return { hourly };
    }

    // Clear weather cache
    clearCache() {
        this.weatherCache.clear();
        console.log('🗑️ Weather cache cleared');
    }
}

module.exports = WeatherMonitor;
