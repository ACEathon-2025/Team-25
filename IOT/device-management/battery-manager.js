class BatteryManager {
  constructor(deviceId, capacityMah = 4000) {
    this.deviceId = deviceId;
    this.capacityMah = capacityMah;
    this.currentLevel = 100; // Percentage
    this.voltage = 3.7; // Volts
    this.currentDraw = 0; // mA
    this.temperature = 25; // Celsius
    this.health = 100; // Percentage
    this.cycleCount = 0;
    this.isCharging = false;
    this.chargeState = 'idle';
    this.powerProfiles = new Map();
    this.consumptionLog = [];
  }

  // Initialize with default power profiles
  initialize() {
    this.powerProfiles.set('normal', {
      cpuFrequency: 'normal',
      transmissionPower: 'medium',
      sensorReadInterval: 60000, // 1 minute
      gpsUpdateInterval: 30000   // 30 seconds
    });

    this.powerProfiles.set('powersave', {
      cpuFrequency: 'low',
      transmissionPower: 'low',
      sensorReadInterval: 300000, // 5 minutes
      gpsUpdateInterval: 120000   // 2 minutes
    });

    this.powerProfiles.set('performance', {
      cpuFrequency: 'high',
      transmissionPower: 'high',
      sensorReadInterval: 30000,  // 30 seconds
      gpsUpdateInterval: 10000    // 10 seconds
    });

    this.currentProfile = 'normal';
    console.log(`Battery manager initialized for ${this.deviceId}`);
  }

  // Simulate battery consumption over time
  async simulateConsumption(durationMs) {
    const startLevel = this.currentLevel;
    const consumptionRate = this.calculateConsumptionRate();
    
    // Convert duration to hours for consumption calculation
    const durationHours = durationMs / (1000 * 60 * 60);
    const consumptionMah = consumptionRate * durationHours;
    const consumptionPercent = (consumptionMah / this.capacityMah) * 100;

    this.currentLevel = Math.max(0, this.currentLevel - consumptionPercent);
    
    // Update battery health based on usage patterns
    this.updateBatteryHealth();

    // Log consumption
    this.consumptionLog.push({
      timestamp: new Date().toISOString(),
      durationMs: durationMs,
      consumptionMah: consumptionMah,
      consumptionPercent: consumptionPercent,
      profile: this.currentProfile,
      levelBefore: startLevel,
      levelAfter: this.currentLevel
    });

    // Keep only last 1000 entries
    if (this.consumptionLog.length > 1000) {
      this.consumptionLog = this.consumptionLog.slice(-1000);
    }

    return consumptionMah;
  }

  calculateConsumptionRate() {
    // Base consumption in mA
    let baseConsumption = 50; // Base system consumption

    // Add consumption based on current power profile
    const profile = this.powerProfiles.get(this.currentProfile);
    
    if (profile.cpuFrequency === 'high') baseConsumption += 100;
    else if (profile.cpuFrequency === 'low') baseConsumption += 30;
    else baseConsumption += 60; // normal

    if (profile.transmissionPower === 'high') baseConsumption += 200;
    else if (profile.transmissionPower === 'low') baseConsumption += 50;
    else baseConsumption += 100; // medium

    // Additional consumption for active sensors
    baseConsumption += 20; // Sensor reading
    baseConsumption += 80; // GPS operation

    this.currentDraw = baseConsumption;
    return baseConsumption;
  }

  updateBatteryHealth() {
    // Simulate battery degradation over time and cycles
    const degradationRate = 0.001; // 0.1% degradation per cycle simulation
    
    if (this.currentLevel < 20 || this.currentLevel > 95) {
      // Additional degradation when battery is very low or high
      this.health -= degradationRate * 2;
    } else {
      this.health -= degradationRate;
    }

    // Increment cycle count when completing a discharge-charge cycle
    if (this.currentLevel < 10 && !this.isCharging) {
      this.cycleCount += 0.1; // Partial cycle
    }

    // Ensure health doesn't go below 0
    this.health = Math.max(0, this.health);
  }

  async startCharging() {
    if (this.isCharging) {
      console.log('Device is already charging');
      return;
    }

    console.log('Starting battery charging...');
    this.isCharging = true;
    this.chargeState = 'charging';

    // Simulate charging process
    const chargeInterval = setInterval(() => {
      if (this.currentLevel >= 100) {
        this.stopCharging();
        clearInterval(chargeInterval);
        return;
      }

      // Charging rate: ~10% per minute for simulation
      this.currentLevel = Math.min(100, this.currentLevel + 10);
      this.voltage = 3.7 + (this.currentLevel / 100) * 0.6; // 3.7-4.3V

      console.log(`Charging: ${this.currentLevel}%`);

      // Switch to trickle charge near full capacity
      if (this.currentLevel > 90) {
        this.chargeState = 'trickle_charge';
      }

    }, 1000); // Update every second for simulation
  }

  stopCharging() {
    if (!this.isCharging) {
      console.log('Device is not charging');
      return;
    }

    console.log('Stopping battery charging');
    this.isCharging = false;
    this.chargeState = 'idle';
    
    // Complete cycle if charged from low level
    if (this.cycleCount % 1 > 0.8) {
      this.cycleCount = Math.ceil(this.cycleCount);
    }
  }

  setPowerProfile(profileName) {
    if (!this.powerProfiles.has(profileName)) {
      throw new Error(`Unknown power profile: ${profileName}`);
    }

    this.currentProfile = profileName;
    console.log(`Power profile set to: ${profileName}`);

    return this.powerProfiles.get(profileName);
  }

  autoSelectPowerProfile() {
    if (this.currentLevel < 20) {
      return this.setPowerProfile('powersave');
    } else if (this.currentLevel < 50) {
      return this.setPowerProfile('normal');
    } else {
      return this.setPowerProfile('performance');
    }
  }

  estimateRemainingTime() {
    const consumptionRate = this.calculateConsumptionRate(); // mA
    const remainingCapacity = (this.currentLevel / 100) * this.capacityMah; // mAh
    const remainingHours = remainingCapacity / consumptionRate;

    return {
      hours: Math.floor(remainingHours),
      minutes: Math.floor((remainingHours % 1) * 60),
      consumptionRate: consumptionRate,
      confidence: 'medium'
    };
  }

  getConsumptionStats(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentConsumption = this.consumptionLog.filter(
      entry => new Date(entry.timestamp) >= cutoffTime
    );

    const totalConsumption = recentConsumption.reduce(
      (sum, entry) => sum + entry.consumptionMah, 0
    );

    const averageConsumption = recentConsumption.length > 0 
      ? totalConsumption / recentConsumption.length 
      : 0;

    return {
      periodHours: hours,
      totalConsumptionMah: totalConsumption,
      averageConsumptionMah: averageConsumption,
      dataPoints: recentConsumption.length,
      estimatedRemaining: this.estimateRemainingTime()
    };
  }

  getBatteryStatus() {
    return {
      deviceId: this.deviceId,
      level: this.currentLevel,
      voltage: this.voltage,
      currentDraw: this.currentDraw,
      temperature: this.temperature,
      health: this.health,
      cycleCount: Math.floor(this.cycleCount),
      isCharging: this.isCharging,
      chargeState: this.chargeState,
      powerProfile: this.currentProfile,
      capacity: this.capacityMah,
      status: this.getBatteryStatusLevel()
    };
  }

  getBatteryStatusLevel() {
    if (this.isCharging) return 'charging';
    if (this.currentLevel >= 80) return 'excellent';
    if (this.currentLevel >= 50) return 'good';
    if (this.currentLevel >= 20) return 'fair';
    if (this.currentLevel >= 10) return 'low';
    return 'critical';
  }

  // Emergency power management for critical situations
  emergencyPowerSave() {
    console.log('🔄 ACTIVATING EMERGENCY POWER SAVE MODE');
    
    const emergencyProfile = {
      cpuFrequency: 'minimal',
      transmissionPower: 'minimal',
      sensorReadInterval: 600000, // 10 minutes
      gpsUpdateInterval: 300000,  // 5 minutes
      emergency: true
    };

    this.powerProfiles.set('emergency', emergencyProfile);
    this.setPowerProfile('emergency');

    // Additional power saving measures
    this.currentDraw *= 0.3; // Reduce current draw by 70%

    return {
      activated: true,
      message: 'Emergency power save mode activated',
      estimatedExtension: this.estimateRemainingTime()
    };
  }

  // Calibration function for accurate battery reading
  async calibrateBattery() {
    console.log('Starting battery calibration...');
    
    // Simulate calibration process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Reset to known good state
    this.health = Math.min(100, this.health + 5); // Slight health improvement
    this.cycleCount = Math.floor(this.cycleCount); // Round cycle count
    
    console.log('Battery calibration completed');
    
    return {
      calibrated: true,
      newHealth: this.health,
      newCycleCount: this.cycleCount
    };
  }
}

module.exports = BatteryManager;
