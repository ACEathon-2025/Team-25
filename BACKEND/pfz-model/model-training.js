const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

class PFZModelTrainer {
    constructor() {
        this.model = null;
        this.trainingData = null;
        this.modelPath = path.join(__dirname, 'models', 'pfz-model-v1.h5');
    }

    // Load training data from JSON files
    async loadTrainingData() {
        try {
            const catchData = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'training-data', 'historical-catch-data.json'), 'utf8')
            );
            const weatherData = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'training-data', 'weather-patterns.json'), 'utf8')
            );
            const oceanData = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'training-data', 'ocean-currents.json'), 'utf8')
            );

            this.trainingData = this.preprocessData(catchData, weatherData, oceanData);
            console.log('✅ Training data loaded successfully');
            return this.trainingData;
        } catch (error) {
            console.error('❌ Error loading training data:', error);
            throw error;
        }
    }

    // Preprocess and merge data from different sources
    preprocessData(catchData, weatherData, oceanData) {
        const processedData = [];
        
        catchData.forEach(catchRecord => {
            const matchingWeather = weatherData.find(w => 
                w.date === catchRecord.date && w.location === catchRecord.location
            );
            const matchingOcean = oceanData.find(o => 
                o.date === catchRecord.date && o.region === catchRecord.region
            );

            if (matchingWeather && matchingOcean) {
                processedData.push({
                    features: [
                        matchingWeather.temperature,
                        matchingWeather.windSpeed,
                        matchingWeather.waveHeight,
                        matchingOcean.currentSpeed,
                        matchingOcean.waterTemperature,
                        matchingOcean.salinity,
                        catchRecord.depth,
                        this.getSeason(catchRecord.date)
                    ],
                    label: catchRecord.catchAmount > 50 ? 1 : 0 // 1 = Good catch, 0 = Poor catch
                });
            }
        });

        console.log(`📊 Processed ${processedData.length} training samples`);
        return processedData;
    }

    getSeason(dateString) {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        if (month >= 3 && month <= 5) return 0; // Spring
        if (month >= 6 && month <= 8) return 1; // Summer
        if (month >= 9 && month <= 11) return 2; // Autumn
        return 3; // Winter
    }

    // Create and compile the ML model
    createModel() {
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [8],
                    units: 64,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 1,
                    activation: 'sigmoid'
                })
            ]
        });

        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        console.log('🤖 ML Model created successfully');
        return this.model;
    }

    // Train the model
    async trainModel(epochs = 100) {
        if (!this.trainingData || !this.model) {
            throw new Error('Training data or model not initialized');
        }

        const features = this.trainingData.map(d => d.features);
        const labels = this.trainingData.map(d => d.label);

        const featureTensor = tf.tensor2d(features);
        const labelTensor = tf.tensor1d(labels);

        console.log('🚀 Starting model training...');

        const history = await this.model.fit(featureTensor, labelTensor, {
            epochs: epochs,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                }
            }
        });

        // Clean up tensors
        featureTensor.dispose();
        labelTensor.dispose();

        console.log('✅ Model training completed');
        return history;
    }

    // Save the trained model
    async saveModel() {
        if (!this.model) {
            throw new Error('No model to save');
        }

        // Ensure models directory exists
        const modelsDir = path.join(__dirname, 'models');
        if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true });
        }

        await this.model.save(`file://${this.modelPath}`);
        console.log(`💾 Model saved to: ${this.modelPath}`);
    }

    // Main training pipeline
    async runTrainingPipeline() {
        try {
            await this.loadTrainingData();
            this.createModel();
            await this.trainModel();
            await this.saveModel();
            console.log('🎉 Training pipeline completed successfully!');
        } catch (error) {
            console.error('💥 Training pipeline failed:', error);
            throw error;
        }
    }
}

module.exports = PFZModelTrainer;

// Run training if this file is executed directly
if (require.main === module) {
    const trainer = new PFZModelTrainer();
    trainer.runTrainingPipeline();
}
