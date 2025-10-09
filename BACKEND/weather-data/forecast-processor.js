class ForecastProcessor {
    constructor() {
        this.forecastModels = new Map();
        this.historicalData = [];
        this.accuracyThreshold = 0.7; // 70% accuracy threshold
    }

    // Process and analyze weather forecast
    async processForecast(forecastData, historicalPatterns = []) {
        try {
            console.log('🔮 Processing weather forecast analysis...');

            const analysis = {
                confidence: this.calculateForecastConfidence(forecastData),
                trends: this.analyzeWeatherTrends(forecastData),
                risks: this.identifyWeatherRisks(forecastData),
                recommendations: this.generateForecastRecommendations(forecastData),
                bestFishingTimes: this.findBestFishingTimes(forecastData),
                timestamp: new Date().toISOString()
            };

            // Enhance with historical pattern matching
            if (historicalPatterns.length > 0) {
                analysis.patternMatching = this.matchHistoricalPatterns(forecastData, historicalPatterns);
            }

            return analysis;

        } catch (error) {
            console.error('❌ Forecast processing failed:', error);
            throw error;
        }
    }

    // Calculate forecast confidence score
    calculateForecastConfidence(forecast) {
        let confidence = 100;

        // Reduce confidence for rapidly changing conditions
        const conditionChanges = this.countConditionChanges(forecast.hourly);
        if (conditionChanges > 3) {
            confidence -= 15;
        }

        // Reduce confidence for extreme weather predictions
        const extremeConditions = forecast.hourly.filter(hour => 
            hour.windSpeed > 30 || 
            hour.precipitation > 80
        ).length;
        
        if (extremeConditions > 2) {
            confidence -= 20;
        }

        // Reduce confidence for inconsistent temperature patterns
        const tempConsistency = this.assessTemperatureConsistency(forecast.hourly);
        confidence += tempConsistency;

        return Math.max(0, Math.min(100, confidence));
    }

    // Count condition changes in hourly forecast
    countConditionChanges(hourlyForecast) {
        let changes = 0;
        let lastCondition = hourlyForecast[0]?.condition;

        for (let i = 1; i < hourlyForecast.length; i++) {
            if (hourlyForecast[i].condition !== lastCondition) {
                changes++;
                lastCondition = hourlyForecast[i].condition;
            }
        }

        return changes;
    }

    // Assess temperature consistency
    assessTemperatureConsistency(hourlyForecast) {
        if (hourlyForecast.length < 2) return 0;

        const temps = hourlyForecast.map(hour => hour.temperature);
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        
        // Calculate standard deviation
        const squareDiffs = temps.map(temp => Math.pow(temp - avgTemp, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        // Higher score for more consistent temperatures
        return Math.max(-20, 20 - stdDev);
    }

    // Analyze weather trends
    analyzeWeatherTrends(forecast) {
        const trends = {
            temperature: this.analyzeTemperatureTrend(forecast.hourly),
            wind: this.analyzeWindTrend(forecast.hourly),
            precipitation: this.analyzePrecipitationTrend(forecast.hourly),
            pressure: this.analyzePressureTrend(forecast.hourly)
        };

        trends.overall = this.calculateOverallTrend(trends);

        return trends;
    }

    // Analyze temperature trend
    analyzeTemperatureTrend(hourlyForecast) {
        if (hourlyForecast.length < 4) return 'stable';

        const firstHalf = hourlyForecast.slice(0, 4);
        const secondHalf = hourlyForecast.slice(-4);
        
        const firstAvg = firstHalf.reduce((sum, hour) => sum + hour.temperature, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, hour) => sum + hour.temperature, 0) / secondHalf.length;

        const diff = secondAvg - firstAvg;

        if (Math.abs(diff) < 2) return 'stable';
        return diff > 0 ? 'rising' : 'falling';
    }

    // Analyze wind trend
    analyzeWindTrend(hourlyForecast) {
        if (hourlyForecast.length < 4) return 'stable';

        const windSpeeds = hourlyForecast.map(hour => hour.windSpeed);
        const trend = this.calculateLinearTrend(windSpeeds);

        if (Math.abs(trend) < 0.5) return 'stable';
        return trend > 0 ? 'increasing' : 'decreasing';
    }

    // Analyze precipitation trend
    analyzePrecipitationTrend(hourlyForecast) {
        const precipitationHours = hourlyForecast.filter(hour => hour.precipitation > 30);
        
        if (precipitationHours.length === 0) return 'dry';
        if (precipitationHours.length <= 2) return 'light_rain';
        if (precipitationHours.length <= 4) return 'moderate_rain';
        return 'heavy_rain';
    }

    // Analyze pressure trend (mock - would need pressure data)
    analyzePressureTrend(hourlyForecast) {
        // Mock pressure analysis based on other factors
        const risingConditions = ['Clear', 'Clouds'];
        const fallingConditions = ['Rain', 'Thunderstorm'];
        
        const conditionCounts = hourlyForecast.reduce((counts, hour) => {
            if (risingConditions.includes(hour.condition)) counts.rising++;
            if (fallingConditions.includes(hour.condition)) counts.falling++;
            return counts;
        }, { rising: 0, falling: 0 });

        if (conditionCounts.rising > conditionCounts.falling) return 'rising';
        if (conditionCounts.falling > conditionCounts.rising) return 'falling';
        return 'stable';
    }

    // Calculate overall trend
    calculateOverallTrend(trends) {
        const trendScores = {
            'rising': 1,
            'increasing': 1,
            'falling': -1,
            'decreasing': -1,
            'stable': 0,
            'dry': 0,
            'light_rain': -0.5,
            'moderate_rain': -1,
            'heavy_rain': -2
        };

        const score = Object.values(trends).reduce((sum, trend) => {
            return sum + (trendScores[trend] || 0);
        }, 0);

        if (score > 1) return 'improving';
        if (score < -1) return 'deteriorating';
        return 'stable';
    }

    // Calculate linear trend
    calculateLinearTrend(data) {
        const n = data.length;
        const x = Array.from({ length: n }, (_, i) => i);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = data.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    // Identify weather risks
    identifyWeatherRisks(forecast) {
        const risks = [];

        // Check for high winds
        const highWindHours = forecast.hourly.filter(hour => hour.windSpeed > 25);
        if (highWindHours.length > 0) {
            risks.push({
                type: 'HIGH_WINDS',
                severity: highWindHours.some(hour => hour.windSpeed > 35) ? 'HIGH' : 'MEDIUM',
                description: `High winds expected in ${highWindHours.length} hours`,
                affectedHours: highWindHours.length,
                peakWind: Math.max(...highWindHours.map(hour => hour.windSpeed))
            });
        }

        // Check for heavy precipitation
        const heavyRainHours = forecast.hourly.filter(hour => hour.precipitation > 70);
        if (heavyRainHours.length > 0) {
            risks.push({
                type: 'HEAVY_RAIN',
                severity: 'MEDIUM',
                description: `Heavy rain expected in ${heavyRainHours.length} hours`,
                affectedHours: heavyRainHours.length,
                maxPrecipitation: Math.max(...heavyRainHours.map(hour => hour.precipitation))
            });
        }

        // Check for thunderstorms
        const stormHours = forecast.hourly.filter(hour => 
            hour.condition.toLowerCase().includes('thunderstorm')
        );
        if (stormHours.length > 0) {
            risks.push({
                type: 'THUNDERSTORMS',
                severity: 'HIGH',
                description: `Thunderstorms expected in ${stormHours.length} hours`,
                affectedHours: stormHours.length,
                recommendation: 'Avoid fishing during thunderstorms'
            });
        }

        // Check for rapid condition changes
        const conditionChanges = this.countConditionChanges(forecast.hourly);
        if (conditionChanges > 4) {
            risks.push({
                type: 'RAPID_CHANGES',
                severity: 'MEDIUM',
                description: 'Rapid weather changes expected',
                changeCount: conditionChanges,
                recommendation: 'Monitor conditions closely'
            });
        }

        return risks;
    }

    // Generate forecast recommendations
    generateForecastRecommendations(forecast) {
        const recommendations = [];
        const risks = this.identifyWeatherRisks(forecast);

        // Base recommendation on overall conditions
        const goodHours = forecast.hourly.filter(hour => 
            hour.windSpeed <= 20 && 
            hour.precipitation <= 30 &&
            !hour.condition.toLowerCase().includes('thunderstorm')
        ).length;

        const totalHours = forecast.hourly.length;
        const goodPercentage = (goodHours / totalHours) * 100;

        if (goodPercentage >= 70) {
            recommendations.push({
                type: 'OVERALL',
                priority: 'LOW',
                message: 'Favorable conditions expected throughout the day',
                action: 'Plan full fishing trip'
            });
        } else if (goodPercentage >= 40) {
            recommendations.push({
                type: 'OVERALL',
                priority: 'MEDIUM',
                message: 'Mixed conditions expected',
                action: 'Plan trip around better weather windows'
            });
        } else {
            recommendations.push({
                type: 'OVERALL',
                priority: 'HIGH',
                message: 'Challenging conditions expected',
                action: 'Consider postponing trip or fish close to shore'
            });
        }

        // Add risk-specific recommendations
        risks.forEach(risk => {
            recommendations.push({
                type: 'RISK_MITIGATION',
                priority: risk.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
                message: risk.description,
                action: risk.recommendation || 'Take appropriate precautions'
            });
        });

        // Add timing recommendations
        const bestTimes = this.findBestFishingTimes(forecast);
        if (bestTimes.length > 0) {
            recommendations.push({
                type: 'TIMING',
                priority: 'LOW',
                message: `Best fishing conditions expected ${bestTimes[0].period}`,
                action: `Plan to fish during ${bestTimes[0].timeRange}`
            });
        }

        return recommendations;
    }

    // Find best fishing times
    findBestFishingTimes(forecast) {
        const bestTimes = [];

        // Score each 3-hour block
        for (let i = 0; i < forecast.hourly.length - 1; i += 3) {
            const block = forecast.hourly.slice(i, i + 3);
            const score = this.calculateFishingBlockScore(block);
            
            if (score >= 70) {
                const startTime = new Date(block[0].time);
                const endTime = new Date(block[block.length - 1].time);
                
                bestTimes.push({
                    timeRange: `${startTime.getHours()}:00 - ${endTime.getHours()}:00`,
                    score: score,
                    period: this.getTimePeriod(startTime),
                    conditions: this.summarizeBlockConditions(block)
                });
            }
        }

        // Sort by score descending
        return bestTimes.sort((a, b) => b.score - a.score);
    }

    // Calculate fishing score for a time block
    calculateFishingBlockScore(block) {
        let score = 100;

        block.forEach(hour => {
            // Deduct for high winds
            if (hour.windSpeed > 25) score -= 20;
            else if (hour.windSpeed > 20) score -= 10;

            // Deduct for precipitation
            if (hour.precipitation > 70) score -= 25;
            else if (hour.precipitation > 40) score -= 15;
            else if (hour.precipitation > 20) score -= 5;

            // Deduct for storms
            if (hour.condition.toLowerCase().includes('thunderstorm')) score -= 30;
        });

        return Math.max(0, score / block.length);
    }

    // Get time period description
    getTimePeriod(time) {
        const hour = time.getHours();
        
        if (hour >= 4 && hour < 8) return 'early morning';
        if (hour >= 8 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 16) return 'afternoon';
        if (hour >= 16 && hour < 20) return 'evening';
        return 'night';
    }

    // Summarize block conditions
    summarizeBlockConditions(block) {
        const conditions = block.map(hour => hour.condition);
        const uniqueConditions = [...new Set(conditions)];
        
        return uniqueConditions.length === 1 ? 
            uniqueConditions[0] : 
            'Mixed conditions';
    }

    // Match historical patterns
    matchHistoricalPatterns(forecast, historicalPatterns) {
        const matches = [];
        
        historicalPatterns.forEach(pattern => {
            const similarity = this.calculatePatternSimilarity(forecast, pattern);
            
            if (similarity > this.accuracyThreshold) {
                matches.push({
                    patternId: pattern.id,
                    similarity: similarity,
                    outcome: pattern.outcome,
                    confidence: pattern.accuracy
                });
            }
        });

        return {
            matches: matches,
            bestMatch: matches.length > 0 ? 
                matches.reduce((best, match) => 
                    match.similarity > best.similarity ? match : best
                ) : null
        };
    }

    // Calculate pattern similarity (simplified)
    calculatePatternSimilarity(forecast, pattern) {
        // This would compare temperature, wind, pressure patterns
        // For now, return a mock similarity score
        return 0.6 + Math.random() * 0.3;
    }

    // Store historical forecast for learning
    storeHistoricalForecast(forecast, actualConditions) {
        const historicalRecord = {
            id: `hist_${Date.now()}`,
            forecast: forecast,
            actual: actualConditions,
            accuracy: this.calculateForecastAccuracy(forecast, actualConditions),
            timestamp: new Date().toISOString()
        };

        this.historicalData.push(historicalRecord);
        
        // Keep only last 1000 records
        if (this.historicalData.length > 1000) {
            this.historicalData = this.historicalData.slice(-1000);
        }

        return historicalRecord;
    }

    // Calculate forecast accuracy
    calculateForecastAccuracy(forecast, actual) {
        // Simplified accuracy calculation
        let score = 100;

        // Compare temperature
        const tempDiff = Math.abs(forecast.hourly[0]?.temperature - actual.temperature);
        score -= tempDiff * 2;

        // Compare condition
        if (forecast.hourly[0]?.condition !== actual.condition) {
            score -= 20;
        }

        // Compare wind speed
        const windDiff = Math.abs(forecast.hourly[0]?.windSpeed - actual.windSpeed);
        score -= windDiff;

        return Math.max(0, score);
    }

    // Get forecast processor statistics
    getStats() {
        return {
            historicalRecords: this.historicalData.length,
            accuracyThreshold: this.accuracyThreshold,
            averageAccuracy: this.calculateAverageAccuracy()
        };
    }

    // Calculate average accuracy
    calculateAverageAccuracy() {
        if (this.historicalData.length === 0) return 0;
        
        const totalAccuracy = this.historicalData.reduce((sum, record) => 
            sum + record.accuracy, 0
        );
        
        return totalAccuracy / this.historicalData.length;
    }
}

module.exports = ForecastProcessor;
