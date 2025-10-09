const mongoose = require('mongoose');
const config = require('../config/constants');

class DatabaseConnection {
    constructor() {
        this.isConnected = false;
        this.connection = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
    }

    // Connect to MongoDB
    async connect() {
        try {
            console.log('🔗 Connecting to MongoDB...');

            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 5,
                retryWrites: true,
                w: 'majority'
            };

            // Set strictQuery deprecation warning
            mongoose.set('strictQuery', false);

            // Connect to MongoDB
            this.connection = await mongoose.connect(config.MONGODB_URI, options);

            this.isConnected = true;
            this.retryCount = 0;

            console.log('✅ MongoDB connected successfully');

            // Set up event listeners
            this.setupEventListeners();

            return this.connection;

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            
            // Retry connection
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retrying connection in ${this.retryDelay/1000} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`);
                
                await this.delay(this.retryDelay);
                return this.connect();
            } else {
                console.error('💥 Maximum connection retries reached. Exiting...');
                process.exit(1);
            }
        }
    }

    // Disconnect from MongoDB
    async disconnect() {
        try {
            if (this.isConnected) {
                await mongoose.disconnect();
                this.isConnected = false;
                this.connection = null;
                console.log('🔌 MongoDB disconnected');
            }
        } catch (error) {
            console.error('❌ MongoDB disconnection failed:', error);
            throw error;
        }
    }

    // Setup MongoDB event listeners
    setupEventListeners() {
        mongoose.connection.on('connected', () => {
            console.log('📡 MongoDB connected');
            this.isConnected = true;
        });

        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
            this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 MongoDB disconnected');
            this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
            this.isConnected = true;
        });

        // Close the connection when the Node process ends
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    }

    // Get database statistics
    async getDatabaseStats() {
        try {
            if (!this.isConnected) {
                throw new Error('Database not connected');
            }

            const db = mongoose.connection.db;
            const stats = await db.command({ dbStats: 1 });
            const collections = await db.listCollections().toArray();

            return {
                database: {
                    name: stats.db,
                    collections: stats.collections,
                    objects: stats.objects,
                    dataSize: this.formatBytes(stats.dataSize),
                    storageSize: this.formatBytes(stats.storageSize),
                    indexSize: this.formatBytes(stats.indexSize)
                },
                collections: collections.map(col => col.name),
                connection: this.getConnectionStatus()
            };

        } catch (error) {
            console.error('❌ Failed to get database stats:', error);
            throw error;
        }
    }

    // Format bytes to human readable format
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Health check
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return {
                    status: 'disconnected',
                    message: 'Database not connected'
                };
            }

            // Simple query to check database responsiveness
            await mongoose.connection.db.command({ ping: 1 });

            return {
                status: 'connected',
                message: 'Database is responsive',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Create indexes for better performance
    async createIndexes() {
        try {
            console.log('📊 Creating database indexes...');

            // Get all models
            const models = mongoose.modelNames();
            
            for (const modelName of models) {
                const model = mongoose.model(modelName);
                if (model.createIndexes) {
                    await model.createIndexes();
                    console.log(`✅ Indexes created for ${modelName}`);
                }
            }

            console.log('🎉 All database indexes created successfully');

        } catch (error) {
            console.error('❌ Failed to create indexes:', error);
            throw error;
        }
    }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = databaseConnection;
