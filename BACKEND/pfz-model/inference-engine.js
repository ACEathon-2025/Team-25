const tf = require('@tensorflow/tfjs-node');
const path = require('path');

class InferenceEngine {
    constructor() {
        this.model = null;
        this.modelPath = path.join(__dirname, 'models', 'pfz-model-v1.h5');
        this.isLoaded = false;
    }

    // Load the trained model
    async loadModel() {
        try {
            if (this.isLoaded) return this.model;
            
            console.log('🔄 Loading trained model...');
            this.model = await tf.loadLayersModel(`file://${this.modelPath}`);
            this.isLoaded = true;
            console.log('✅ Model loaded successfully');
            return this.model;
        } catch (error) {
            console.error('❌ Error loading model:', error);
            throw new Error('Failed to load ML model');
        }
    }

    // Preprocess input data for prediction
    preprocessInput(weatherData, oceanData, locationData) {
        const features = [
            weatherData.temperature || 25,
            weatherData.windSpeed || 10,
            weatherData.waveHeight || 1.2,
            oceanData.currentSpeed || 0.5,
            oceanData.waterTemperature || 26,
            oceanData.salinity || 35,
            locationData.depth || 15,
            this.getCurrentSeason()
        ];

        // Normalize features (assuming known ranges from training)
        const normalizedFeatures = this.normalizeFeatures(features);
        return tf.tensor2d([normalizedFeatures]);
    }

    normalizeFeatures(features) {
        // Simple min-max normalization based on expected ranges
        const ranges = [
            [10, 40],   // temperature
            [0, 50],    // windSpeed
            [0, 5],     // waveHeight
            [0, 3],     // currentSpeed
            [15, 35],   // waterTemperature
            [30, 40],   // salinity
            [5, 100],   // depth
            [0, 3]      // season
        ];

        return features.map((feature, index) => {
            const [min, max] = ranges[index];
            return (feature - min) / (max - min);
        });
    }

    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 0; // Spring
        if (month >= 6 && month <= 8) return 1; // Summer
        if (month >= 9 && month <= 11) return 2; // Autumn
        return 3; // Winter
    }

    // Make prediction for fishing zone
    async predictZone(weatherData, oceanData, locationData) {
        try {
            await this.loadModel();
            
            const inputTensor = this.preprocessInput(weatherData, oceanData, locationData);
            const prediction = this.model.predict(inputTensor);
            const probability = (await prediction.data())[0];
            
            // Clean up tensors
            inputTensor.dispose();
            prediction.dispose();

            // Convert probability to confidence score
            const confidence = Math.round(probability * 100);
            const zoneQuality = this.interpretPrediction(probability);

            return {
                confidence: confidence,
                quality: zoneQuality,
                probability: probability,
                recommended: confidence > 60,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Prediction error:', error);
            throw new Error('Failed to make prediction');
        }
    }

    interpretPrediction(probability) {
        if (probability >= 0.8) return 'excellent';
        if (probability >= 0.6) return 'good';
        if (probability >= 0.4) return 'fair';
        return 'poor';
    }

    // Batch prediction for multiple locations
    async predictMultipleZones(locationsData) {
        const predictions = [];
        
        for (const location of locationsData) {
            try {
                const prediction = await this.predictZone(
                    location.weather, 
                    location.ocean, 
                    location
                );
                predictions.push({
                    location: location.coordinates,
                    prediction: prediction,
                    zoneId: this.generateZoneId(location.coordinates)
                });
            } catch (error) {
                console.error(`❌ Prediction failed for location ${location.coordinates}:`, error);
            }
        }

        // Sort by confidence score
        return predictions.sort((a, b) => b.prediction.confidence - a.prediction.confidence);
    }

    generateZoneId(coordinates) {
        const { lat, lng } = coordinates;
        return `ZONE_${Math.round(lat * 100)}_${Math.round(lng * 100)}`;
    }

    // Get model information
    getModelInfo() {
        if (!this.model) {
            return { loaded: false };
        }

        return {
            loaded: true,
            layers: this.model.layers.length,
            inputShape: this.model.inputs[0].shape,
            outputShape: this.model.outputs[0].shape
        };
    }
}

module.exports = InferenceEngine;
