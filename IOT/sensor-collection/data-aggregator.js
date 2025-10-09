const { helpers, validators } = require('../../utils');

class DataAggregator {
  constructor() {
    this.sensors = new Map();
    this.aggregatedData = [];
    this.transmissionQueue = [];
    this.aggregationInterval = 60000; // 1 minute
    this.maxBatchSize = 50;
  }

  registerSensor(sensor) {
    this.sensors.set(sensor.sensorId, sensor);
    console.log(`Sensor registered: ${sensor.sensorId}`);
  }

  async startAggregation() {
    console.log('Starting sensor data aggregation...');
    
    setInterval(async () => {
      await this.collectAndAggregate();
    }, this.aggregationInterval);

    // Initial collection
    await this.collectAndAggregate();
  }

  async collectAndAggregate() {
    const sensorReadings = [];
    const collectionTime = new Date().toISOString();

    // Collect data from all registered sensors
    for (const [sensorId, sensor] of this.sensors) {
      try {
        let reading;
        
        if (sensor.readTemperature) {
          reading = await sensor.readTemperature();
        } else if (sensor.readPH) {
          reading = await sensor.readPH();
        } else if (sensor.getCurrentPosition) {
          reading = await sensor.getCurrentPosition();
        }

        if (reading) {
          sensorReadings.push({
            ...reading,
            collectionTime: collectionTime,
            aggregated: true
          });
        }
      } catch (error) {
        console.error(`Failed to read from sensor ${sensorId}:`, error);
        
        // Record failed reading for diagnostics
        sensorReadings.push({
          sensorId: sensorId,
          error: error.message,
          collectionTime: collectionTime,
          status: 'failed'
        });
      }
    }

    // Aggregate readings
    const aggregatedBatch = this.aggregateReadings(sensorReadings);
    
    if (aggregatedBatch) {
      this.aggregatedData.push(aggregatedBatch);
      this.transmissionQueue.push(aggregatedBatch);

      // Keep only recent data
      if (this.aggregatedData.length > this.maxBatchSize) {
        this.aggregatedData = this.aggregatedData.slice(-this.maxBatchSize);
      }

      console.log(`Aggregated ${sensorReadings.length} sensor readings into batch`);
    }

    return aggregatedBatch;
  }

  aggregateReadings(readings) {
    if (readings.length === 0) return null;

    const validReadings = readings.filter(r => !r.error);
    const failedReadings = readings.filter(r => r.error);

    // Group by sensor type and calculate averages
    const temperatureReadings = validReadings.filter(r => r.temperature !== undefined);
    const phReadings = validReadings.filter(r => r.pH !== undefined);
    const gpsReadings = validReadings.filter(r => r.lat !== undefined);

    const aggregation = {
      batchId: helpers.generateAlertId(),
      timestamp: new Date().toISOString(),
      summary: {
        totalSensors: readings.length,
        successfulReadings: validReadings.length,
        failedReadings: failedReadings.length,
        successRate: (validReadings.length / readings.length) * 100
      },
      data: {
        temperature: this.aggregateTemperatureData(temperatureReadings),
        pH: this.aggregatePHData(phReadings),
        location: this.aggregateLocationData(gpsReadings)
      },
      anomalies: this.detectAnomalies(validReadings),
      failedSensors: failedReadings.map(r => ({
        sensorId: r.sensorId,
        error: r.error
      }))
    };

    return aggregation;
  }

  aggregateTemperatureData(readings) {
    if (readings.length === 0) return null;

    const temperatures = readings.map(r => r.temperature);
    const averageTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

    return {
      average: parseFloat(averageTemp.toFixed(2)),
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      unit: 'celsius',
      sensorCount: readings.length
    };
  }

  aggregatePHData(readings) {
    if (readings.length === 0) return null;

    const pHValues = readings.map(r => r.pH);
    const averagePH = pHValues.reduce((a, b) => a + b, 0) / pHValues.length;

    return {
      average: parseFloat(averagePH.toFixed(2)),
      min: Math.min(...pHValues),
      max: Math.max(...pHValues),
      sensorCount: readings.length,
      waterQuality: this.assessWaterQuality(averagePH)
    };
  }

  aggregateLocationData(readings) {
    if (readings.length === 0) return null;

    // Use the most recent GPS reading as reference
    const latestReading = readings[readings.length - 1];
    
    return {
      latitude: latestReading.lat,
      longitude: latestReading.lng,
      accuracy: latestReading.accuracy,
      speed: latestReading.speed,
      heading: latestReading.heading,
      timestamp: latestReading.timestamp
    };
  }

  assessWaterQuality(pH) {
    if (pH >= 7.0 && pH <= 8.0) return 'excellent';
    if (pH >= 6.5 && pH <= 8.5) return 'good';
    if (pH >= 6.0 && pH <= 9.0) return 'fair';
    return 'poor';
  }

  detectAnomalies(readings) {
    const anomalies = [];

    readings.forEach(reading => {
      // Temperature anomalies
      if (reading.temperature > 35) {
        anomalies.push({
          sensorId: reading.sensorId,
          type: 'HIGH_TEMPERATURE',
          value: reading.temperature,
          threshold: 35,
          severity: 'high'
        });
      }

      if (reading.temperature < 10) {
        anomalies.push({
          sensorId: reading.sensorId,
          type: 'LOW_TEMPERATURE',
          value: reading.temperature,
          threshold: 10,
          severity: 'high'
        });
      }

      // pH anomalies
      if (reading.pH < 6.5 || reading.pH > 8.5) {
        anomalies.push({
          sensorId: reading.sensorId,
          type: 'UNSAFE_PH',
          value: reading.pH,
          threshold: '6.5-8.5',
          severity: 'medium'
        });
      }
    });

    return anomalies;
  }

  getNextTransmissionBatch() {
    return this.transmissionQueue.shift();
  }

  getAggregationStats() {
    return {
      totalBatches: this.aggregatedData.length,
      queuedTransmissions: this.transmissionQueue.length,
      registeredSensors: this.sensors.size,
      lastAggregation: this.aggregatedData[this.aggregatedData.length - 1]?.timestamp
    };
  }
}

module.exports = DataAggregator;
