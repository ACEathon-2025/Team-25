class PHSensor {
  constructor(sensorId, location) {
    this.sensorId = sensorId;
    this.location = location;
    this.isCalibrated = false;
    this.lastReading = null;
    this.healthStatus = 'active';
    this.calibrationPoints = {
      low: 4.0,
      neutral: 7.0,
      high: 10.0
    };
  }

  async readPH() {
    try {
      // Simulate pH reading with environmental factors
      const basePH = this.getBasePH();
      const noise = (Math.random() - 0.5) * 0.1; // ±0.05 pH variation
      const pHValue = parseFloat((basePH + noise).toFixed(2));

      this.lastReading = {
        sensorId: this.sensorId,
        pH: pHValue,
        timestamp: new Date().toISOString(),
        location: this.location,
        accuracy: '±0.1 pH',
        waterType: this.classifyWater(pHValue)
      };

      await this.checkHealth();

      return this.lastReading;
    } catch (error) {
      console.error(`pH sensor ${this.sensorId} error:`, error);
      this.healthStatus = 'error';
      throw new Error(`pH reading failed: ${error.message}`);
    }
  }

  getBasePH() {
    const now = new Date();
    const hour = now.getHours();
    
    let basePH = 7.8; // Typical seawater pH
    
    // Simulate daily pH variations
    if (hour >= 6 && hour <= 18) {
      // Photosynthesis during daylight increases pH slightly
      basePH += 0.3;
    }
    
    // Add some location-based variation
    const locationVariation = (this.location.lat * 0.01) % 0.5;
    basePH += locationVariation;

    return Math.max(6.5, Math.min(8.5, basePH)); // Keep within reasonable bounds
  }

  classifyWater(pHValue) {
    if (pHValue < 6.5) return 'acidic';
    if (pHValue > 8.5) return 'alkaline';
    if (pHValue >= 7.0 && pHValue <= 8.0) return 'optimal_fishing';
    return 'acceptable';
  }

  async calibrate(calibrationPoint = 'neutral') {
    console.log(`Calibrating pH sensor ${this.sensorId} at ${calibrationPoint} point...`);
    
    const targetPH = this.calibrationPoints[calibrationPoint];
    if (!targetPH) {
      throw new Error(`Invalid calibration point: ${calibrationPoint}`);
    }

    // Simulate calibration process
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.isCalibrated = true;
    
    console.log(`pH sensor ${this.sensorId} calibrated at ${targetPH} pH`);
    return { calibrated: true, point: calibrationPoint, value: targetPH };
  }

  async checkHealth() {
    // Check if readings are within expected range
    if (this.lastReading) {
      const pH = this.lastReading.pH;
      if (pH < 4.0 || pH > 11.0) {
        this.healthStatus = 'error';
      } else if (pH < 5.0 || pH > 10.0) {
        this.healthStatus = 'degraded';
      } else {
        this.healthStatus = 'active';
      }
    }
  }

  getStatus() {
    return {
      sensorId: this.sensorId,
      type: 'pH',
      health: this.healthStatus,
      calibrated: this.isCalibrated,
      lastReading: this.lastReading,
      location: this.location
    };
  }
}

module.exports = PHSensor;
