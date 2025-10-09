const axios = require('axios');
const MarineConditions = require('./marine-conditions');

class WeatherService {
    constructor() {
        this.weatherApiKey = process.env.OPENWEATHER_API_KEY || 'demo_key';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.weatherCache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        this.marineConditions = new MarineConditions();
        
        // Weather condition mappings
        this.conditionSeverity = {
            'clear': 'LOW',
            'clouds': 'LOW',
            'drizzle': 'LOW',
            'rain': 'MEDIUM',
            'thunderstorm': 'HIGH',
            'snow': 'MEDIUM',
            'mist': 'LOW',
            'smoke': 'MEDIUM',
            'haze': 'LOW',
            'dust': 'MEDIUM',
            'fog': 'MEDIUM',
            'sand': 'HIGH',
            'ash': 'HIGH',
            'squall': 'HIGH',
            'tornado': 'CRITICAL'
        };
    }

    // Get current weather for location
    async getCurrentWeather(location) {
        try {
            const cacheKey = `current_${location.lat}_${location.lng}`;
            const cached = this.getCachedData(cacheKey);
            
            if (cached) {
                console.log('📊 Using cached weather data');
                return cached;
            }

            console.log(`🌤️ Fetching current weather for: ${location.lat}, ${location.lng}`);
            
            let weatherData;
            
            if (this.weatherApiKey === 'demo_key') {
                // Use mock data for demo
                weatherData = this.getMockCurrentWeather(location);
            } else {
                // Fetch from OpenWeatherMap API
                weatherData = await this.fetchCurrentWeather(location);
            }

            // Enhance with marine conditions
            const enhancedData = await this.enhanceWithMarineData(weatherData, location);
            
            // Cache the result
            this.setCachedData(cacheKey, enhancedData);
            
            return enhancedData;

        } catch (error) {
            console.error('❌ Current weather fetch failed:', error);
            // Return mock data as fallback
            return this.getMockCurrentWeather(location);
        }
    }

    // Get weather forecast
    async getWeatherForecast(location, days = 3) {
        try {
            const cacheKey = `forecast_${location.lat}_${location.lng}_${days}`;
            const cached = this.getCachedData(cacheKey);
            
            if (cached) {
                console.log('📊 Using cached forecast data');
                return cached;
            }

            console.log(`📈 Fetching ${days}-day forecast for: ${location.lat}, ${location.lng}`);
            
            let forecastData;
            
            if (this.weatherApiKey === 'demo_key') {
                // Use mock data for demo
                forecastData = this.getMockForecast(location, days);
            } else {
                // Fetch from OpenWeatherMap API
                forecastData = await this.fetchForecast(location, days);
            }

            // Enhance forecast with marine data
            const enhancedForecast = await this.enhanceForecastWithMarineData(forecastData, location);
            
            // Cache the result
            this.setCachedData(cacheKey, enhancedForecast);
            
            return enhancedForecast;

        } catch (error) {
            console.error('❌ Weather forecast fetch failed:', error);
            return this.getMockForecast(location, days);
        }
    }

    // Get severe weather alerts
    async getWeatherAlerts(location) {
        try {
            const cacheKey = `alerts_${location.lat}_${location.lng}`;
            const cached = this.getCachedData(cacheKey);
            
            if (cached) {
                return cached;
            }

            console.log(`⚠️ Checking weather alerts for: ${location.lat}, ${location.lng}`);
            
            let alertsData;
            
            if (this.weatherApiKey === 'demo_key') {
                // Use mock alerts for demo
                alertsData = this.getMockAlerts(location);
            } else {
                // Fetch from OpenWeatherMap API (One Call API with alerts)
                alertsData = await this.fetchAlerts(location);
            }

            // Cache the result
            this.setCachedData(cacheKey, alertsData);
            
            return alertsData;

        } catch (error) {
            console.error('❌ Weather alerts fetch failed:', error);
            return this.getMockAlerts(location);
        }
    }

    // Fetch current weather from OpenWeatherMap API
    async fetchCurrentWeather(location) {
        const response = await axios.get(`${this.baseUrl}/weather`, {
            params: {
                lat: location.lat,
                lon: location.lng,
                appid: this.weatherApiKey,
                units: 'metric'
            },
            timeout: 10000
        });

        return this.transformWeatherData(response.data);
    }

    // Fetch forecast from OpenWeatherMap API
    async fetchForecast(location, days) {
        const response = await axios.get(`${this.baseUrl}/forecast`, {
            params: {
                lat: location.lat,
                lon: location.lng,
                appid: this.weatherApiKey,
                units: 'metric'
            },
            timeout: 10000
        });

        return this.transformForecastData(response.data, days);
    }

    // Fetch weather alerts
    async fetchAlerts(location) {
        try {
            // Using One Call API for alerts (requires paid plan)
            const response = await axios.get(`${this.baseUrl}/onecall`, {
                params: {
                    lat: location.lat,
                    lon: location.lng,
                    appid: this.weatherApiKey,
                    exclude: 'minutely,hourly',
                    units: 'metric'
                },
                timeout: 10000
            });

            return this.transformAlertData(response.data.alerts || []);
        } catch (error) {
            // If One Call API fails, return empty alerts
            console.log('⚠️ Alerts API not available, returning empty alerts');
            return this.transformAlertData([]);
        }
    }

    // Transform API weather data to our format
    transformWeatherData(apiData) {
        const weather = {
            location: {
                lat: apiData.coord.lat,
                lng: apiData.coord.lon,
                name: apiData.name
            },
            temperature: Math.round(apiData.main.temp),
            feelsLike: Math.round(apiData.main.feels_like),
            humidity: apiData.main.humidity,
            pressure: apiData.main.pressure,
            windSpeed: Math.round(apiData.wind.speed * 3.6), // Convert m/s to km/h
            windDirection: apiData.wind.deg || 0,
            windGust: apiData.wind.gust ? Math.round(apiData.wind.gust * 3.6) : null,
            condition: apiData.weather[0].main,
            description: apiData.weather[0].description,
            icon: apiData.weather[0].icon,
            cloudCover: apiData.clouds.all,
            visibility: apiData.visibility / 1000, // Convert to km
            sunrise: new Date(apiData.sys.sunrise * 1000).toISOString(),
            sunset: new Date(apiData.sys.sunset * 1000).toISOString(),
            severity: this.conditionSeverity[apiData.weather[0].main.toLowerCase()] || 'LOW',
            timestamp: new Date().toISOString(),
            dataSource: 'OpenWeatherMap'
        };

        return weather;
    }

    // Transform forecast data
    transformForecastData(apiData, days) {
        const forecast = {
            location: {
                lat: apiData.city.coord.lat,
                lng: apiData.city.coord.lon,
                name: apiData.city.name
            },
            daily: [],
            hourly: [],
            timestamp: new Date().toISOString(),
            dataSource: 'OpenWeatherMap'
        };

        // Group by day for daily forecast
        const dailyForecasts = {};
        apiData.list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = [];
            }
            dailyForecasts[date].push(item);
        });

        // Create daily summaries
        Object.keys(dailyForecasts).slice(0, days).forEach(date => {
            const dayData = dailyForecasts[date];
            const dayForecast = this.createDailyForecast(dayData, date);
            forecast.daily.push(dayForecast);
        });

        // Create hourly forecast (next 24 hours)
        apiData.list.slice(0, 8).forEach(item => { // 3-hour intervals for 24 hours
            forecast.hourly.push(this.createHourlyForecast(item));
        });

        return forecast;
    }

    // Create daily forecast summary
    createDailyForecast(dayData, date) {
        const temps = dayData.map(item => item.main.temp);
        const conditions = dayData.map(item => item.weather[0].main);
        
        return {
            date: date,
            high: Math.round(Math.max(...temps)),
            low: Math.round(Math.min(...temps)),
            condition: this.getMostFrequentCondition(conditions),
            precipitation: Math.max(...dayData.map(item => item.pop * 100)), // % chance
            humidity: Math.round(dayData.reduce((sum, item) => sum + item.main.humidity, 0) / dayData.length),
            windSpeed: Math.round(dayData.reduce((sum, item) => sum + item.wind.speed, 0) / dayData.length * 3.6),
            severity: this.conditionSeverity[this.getMostFrequentCondition(conditions).toLowerCase()] || 'LOW'
        };
    }

    // Create hourly forecast
    createHourlyForecast(item) {
        return {
            time: new Date(item.dt * 1000).toISOString(),
            temperature: Math.round(item.main.temp),
            condition: item.weather[0].main,
            description: item.weather[0].description,
            precipitation: item.pop * 100, // % chance
            humidity: item.main.humidity,
            windSpeed: Math.round(item.wind.speed * 3.6),
            windDirection: item.wind.deg,
            pressure: item.main.pressure
        };
    }

    // Transform alert data
    transformAlertData(alerts) {
        return {
            hasAlerts: alerts.length > 0,
            alerts: alerts.map(alert => ({
                event: alert.event,
                description: alert.description,
                start: new Date(alert.start * 1000).toISOString(),
                end: new Date(alert.end * 1000).toISOString(),
                severity: this.classifyAlertSeverity(alert.event),
                source: alert.sender_name,
                tags: alert.tags || []
            })),
            timestamp: new Date().toISOString()
        };
    }

    // Classify alert severity
    classifyAlertSeverity(event) {
        const eventLower = event.toLowerCase();
        
        if (eventLower.includes('hurricane') || eventLower.includes('tornado')) {
            return 'CRITICAL';
        } else if (eventLower.includes('storm') || eventLower.includes('warning')) {
            return 'HIGH';
        } else if (eventLower.includes('advisory') || eventLower.includes('watch')) {
            return 'MEDIUM';
        } else {
            return 'LOW';
        }
    }

    // Enhance weather data with marine conditions
    async enhanceWithMarineData(weatherData, location) {
        const marineData = await this.marineConditions.getMarineConditions(location);
        
        return {
            ...weatherData,
            marine: {
                waveHeight: marineData.waveHeight,
                waveDirection: marineData.waveDirection,
                waterTemperature: marineData.waterTemperature,
                swellHeight: marineData.swellHeight,
                swellPeriod: marineData.swellPeriod,
                tide: marineData.tide
            },
            fishingConditions: this.assessFishingConditions(weatherData, marineData),
            safetyAssessment: this.assessSafetyConditions(weatherData, marineData)
        };
    }

    // Enhance forecast with marine data
    async enhanceForecastWithMarineData(forecastData, location) {
        const marineForecast = await this.marineConditions.getMarineForecast(location);
        
        return {
            ...forecastData,
            marineForecast: marineForecast,
            daily: forecastData.daily.map((day, index) => ({
                ...day,
                marine: marineForecast.daily[index] || {},
                fishingScore: this.calculateFishingScore(day, marineForecast.daily[index])
            }))
        };
    }

    // Assess fishing conditions
    assessFishingConditions(weather, marine) {
        let score = 100;
        let factors = [];

        // Temperature factor (ideal: 20-28°C)
        if (weather.temperature < 15 || weather.temperature > 32) {
            score -= 20;
            factors.push('Extreme temperature');
        }

        // Wind factor (ideal: < 20 km/h)
        if (weather.windSpeed > 25) {
            score -= 25;
            factors.push('High winds');
        }

        // Wave factor (ideal: < 1.5m)
        if (marine.waveHeight > 2.0) {
            score -= 20;
            factors.push('Rough seas');
        }

        // Precipitation factor
        if (weather.condition.toLowerCase().includes('rain')) {
            score -= 15;
            factors.push('Rainy conditions');
        }

        // Storm factor
        if (weather.severity === 'HIGH' || weather.severity === 'CRITICAL') {
            score -= 40;
            factors.push('Storm conditions');
        }

        return {
            score: Math.max(0, score),
            rating: this.getFishingRating(score),
            factors: factors,
            recommendation: this.getFishingRecommendation(score)
        };
    }

    // Assess safety conditions
    assessSafetyConditions(weather, marine) {
        let riskLevel = 'LOW';
        let warnings = [];

        // Wind risk
        if (weather.windSpeed > 35) {
            riskLevel = 'HIGH';
            warnings.push('Dangerous wind speeds');
        } else if (weather.windSpeed > 25) {
            riskLevel = 'MEDIUM';
            warnings.push('High wind speeds');
        }

        // Wave risk
        if (marine.waveHeight > 3.0) {
            riskLevel = 'HIGH';
            warnings.push('Dangerous wave heights');
        } else if (marine.waveHeight > 2.0) {
            riskLevel = Math.max(riskLevel, 'MEDIUM');
            warnings.push('High waves');
        }

        // Storm risk
        if (weather.severity === 'CRITICAL') {
            riskLevel = 'CRITICAL';
            warnings.push('Severe storm conditions');
        } else if (weather.severity === 'HIGH') {
            riskLevel = Math.max(riskLevel, 'HIGH');
            warnings.push('Storm conditions');
        }

        // Visibility risk
        if (weather.visibility < 1) {
            riskLevel = Math.max(riskLevel, 'MEDIUM');
            warnings.push('Low visibility');
        }

        return {
            riskLevel,
            warnings,
            safeToFish: riskLevel === 'LOW',
            recommendation: this.getSafetyRecommendation(riskLevel)
        };
    }

    // Calculate fishing score for forecast
    calculateFishingScore(weather, marine) {
        let score = 100;

        if (weather.windSpeed > 20) score -= 20;
        if (weather.precipitation > 50) score -= 15;
        if (weather.severity !== 'LOW') score -= 30;
        if (marine && marine.waveHeight > 1.5) score -= 15;

        return Math.max(0, score);
    }

    // Get fishing rating from score
    getFishingRating(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        if (score >= 20) return 'Poor';
        return 'Very Poor';
    }

    // Get fishing recommendation
    getFishingRecommendation(score) {
        if (score >= 80) return 'Ideal fishing conditions. Good luck!';
        if (score >= 60) return 'Good fishing conditions. Normal precautions advised.';
        if (score >= 40) return 'Fair conditions. Exercise caution.';
        if (score >= 20) return 'Poor conditions. Consider postponing trip.';
        return 'Dangerous conditions. Do not go fishing.';
    }

    // Get safety recommendation
    getSafetyRecommendation(riskLevel) {
        const recommendations = {
            'LOW': 'Safe conditions. Normal safety precautions.',
            'MEDIUM': 'Moderate risk. Exercise caution and monitor conditions.',
            'HIGH': 'High risk. Consider returning to shore.',
            'CRITICAL': 'Critical risk. Return to shore immediately.'
        };
        return recommendations[riskLevel] || 'Unknown risk level.';
    }

    // Get most frequent condition
    getMostFrequentCondition(conditions) {
        const frequency = {};
        conditions.forEach(condition => {
            frequency[condition] = (frequency[condition] || 0) + 1;
        });
        
        return Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        );
    }

    // Cache management
    getCachedData(key) {
        const cached = this.weatherCache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.weatherCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Clear cache
    clearCache() {
        this.weatherCache.clear();
        console.log('🗑️ Weather cache cleared');
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.weatherCache.size,
            keys: Array.from(this.weatherCache.keys())
        };
    }

    // Mock data for demo
    getMockCurrentWeather(location) {
        const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        return {
            location: location,
            temperature: 20 + Math.floor(Math.random() * 15),
            feelsLike: 18 + Math.floor(Math.random() * 18),
            humidity: 40 + Math.floor(Math.random() * 50),
            pressure: 1000 + Math.floor(Math.random() * 30),
            windSpeed: 5 + Math.floor(Math.random() * 25),
            windDirection: Math.floor(Math.random() * 360),
            condition: randomCondition,
            description: `${randomCondition.toLowerCase()} conditions`,
            cloudCover: Math.floor(Math.random() * 100),
            visibility: 2 + Math.random() * 18,
            severity: this.conditionSeverity[randomCondition.toLowerCase()] || 'LOW',
            timestamp: new Date().toISOString(),
            dataSource: 'Mock Data'
        };
    }

    getMockForecast(location, days) {
        const forecast = {
            location: location,
            daily: [],
            hourly: [],
            timestamp: new Date().toISOString(),
            dataSource: 'Mock Data'
        };

        // Generate daily forecast
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecast.daily.push({
                date: date.toDateString(),
                high: 22 + Math.floor(Math.random() * 12),
                low: 18 + Math.floor(Math.random() * 8),
                condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                precipitation: Math.floor(Math.random() * 100),
                humidity: 50 + Math.floor(Math.random() * 40),
                windSpeed: 5 + Math.floor(Math.random() * 20),
                severity: 'LOW'
            });
        }

        // Generate hourly forecast
        for (let i = 0; i < 24; i += 3) {
            const time = new Date();
            time.setHours(time.getHours() + i);
            
            forecast.hourly.push({
                time: time.toISOString(),
                temperature: 20 + Math.floor(Math.random() * 10),
                condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                precipitation: Math.floor(Math.random() * 100),
                humidity: 50 + Math.floor(Math.random() * 40),
                windSpeed: 5 + Math.floor(Math.random() * 15)
            });
        }

        return forecast;
    }

    getMockAlerts(location) {
        const hasAlerts = Math.random() > 0.7; // 30% chance of alerts
        
        if (!hasAlerts) {
            return {
                hasAlerts: false,
                alerts: [],
                timestamp: new Date().toISOString()
            };
        }

        const alertTypes = [
            'Small Craft Advisory',
            'Gale Warning',
            'Storm Warning',
            'Thunderstorm Watch'
        ];

        return {
            hasAlerts: true,
            alerts: [{
                event: alertTypes[Math.floor(Math.random() * alertTypes.length)],
                description: 'Marine weather alert for the coastal area',
                start: new Date().toISOString(),
                end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
                severity: 'MEDIUM',
                source: 'Mock Weather Service',
                tags: ['marine', 'warning']
            }],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = WeatherService;
