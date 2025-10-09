const { helpers } = require('../../utils/helpers');

class TemperatureSensor {
  constructor(sensorId, location) {
    this.sensorId = sensorId;
    this.location = location;
    this.isCalibrated = false;
    this.lastReading = null;
    this.healthStatus = 'active';
  }

  // Simulate temperature reading from physical sensor
  async readTemperature() {
    try {
      // Simulate sensor reading with some noise
      const baseTemp = this.getBaseTemperature();
      const noise = (Math.random() - 0.5) * 0.5; // ±0.25°C variation
      const temperature = parseFloat((baseTemp + noise).toFixed(2));

      this.lastReading = {
        sensorId: this.sensorId,
        temperature: temperature,
        timestamp: new Date().toISOString(),
        location: this.location,
        unit: 'celsius',
        accuracy: '±0.5°C'
      };

      // Check sensor health
      await this.checkHealth();

      return this.lastReading;
    } catch (error) {
      console.error(`Temperature sensor ${this.sensorId} error:`, error);
      this.healthStatus = 'error';
      throw new Error(`Temperature reading failed: ${error.message}`);
    }
  }

  // Get base temperature based on location and time (simulated)
  getBaseTemperature() {
    const now = new Date();
    const hour = now.getHours();
    
    // Simulate temperature variations throughout the day
    let baseTemp = 28.0; // Base temperature for Indian coastal waters
    
    // Time-based variations
    if (hour >= 22 || hour <= 5) {
      baseTemp -= 2.0; // Night cooling
    } else if (hour >= 12 && hour <= 16) {
      baseTemp += 1.5; // Afternoon warming
    }
    
    // Seasonal variation (simplified)
    const month = now.getMonth();
    if (month >= 10 || month <= 1) { // Nov to Feb
      baseTemp -= 3.0; // Winter
    } else if (month >= 3 && month <= 5) { // Mar to May
      baseTemp += 2.0; // Summer
    }

    return baseTemp;
  }

  async calibrate() {
    console.log(`Calibrating temperature sensor ${this.sensorId}...`);
    // Simulate calibration process
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.isCalibrated = true;
    console.log(`Temperature sensor ${this.sensorId} calibrated successfully`);
  }

  async checkHealth() {
    // Simulate health check
    const healthScore = Math.random();
    if (healthScore < 0.95) {
      this.healthStatus = 'degraded';
    } else {
      this.healthStatus = 'active';
    }
  }

  getStatus() {
    return {
      sensorId: this.sensorId,
      type: 'temperature',
      health: this.healthStatus,
      calibrated: this.isCalibrated,
      lastReading: this.lastReading,
      location: this.location
    };
  }
}

module.exports = TemperatureSensor;
