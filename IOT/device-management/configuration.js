const { validators } = require('../../utils/validators');

class DeviceConfiguration {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.config = new Map();
    this.defaultConfig = this.getDefaultConfig();
    this.configVersion = '1.0';
    this.lastUpdated = new Date().toISOString();
    this.configHistory = [];
  }

  getDefaultConfig() {
    return {
      // Sensor settings
      sensors: {
        temperature: {
          enabled: true,
          readInterval: 60000, // 1 minute
          calibration: {
            offset: 0,
            factor: 1.0
          }
        },
        ph: {
          enabled: true,
          readInterval: 60000,
          calibration: {
            offset: 0,
            factor: 1.0
          }
        },
        gps: {
          enabled: true,
          updateInterval: 30000, // 30 seconds
          accuracy: 'high',
          powerSave: true
        }
      },

      // Communication settings
      communication: {
        primaryProtocol: 'lora',
        fallbackProtocol: 'gsm',
        emergencyProtocol: 'satellite',
        transmission: {
          retryAttempts: 3,
          timeout: 30000,
          batchSize: 10
        }
      },

      // Power management
      power: {
        defaultProfile: 'normal',
        autoProfileSwitch: true,
        criticalLevel: 15,
        emergencyShutdown: 10
      },

      // Data management
      data: {
        retentionDays: 30,
        maxStorageUsage: 85,
        compression: true,
        encryption: true
      },

      // Alert thresholds
      alerts: {
        temperature: {
          min: 10,
          max: 35,
          criticalMin: 5,
          criticalMax: 40
        },
        ph: {
          min: 6.5,
          max: 8.5,
          criticalMin: 6.0,
          criticalMax: 9.0
        },
        battery: {
          warning: 25,
          critical: 15,
          shutdown: 5
        }
      },

      // System settings
      system: {
        timezone: 'Asia/Kolkata',
        language: 'en',
        autoUpdate: true,
        diagnosticMode: false
      }
    };
  }

  initialize() {
    // Load default configuration
    this.config = new Map(Object.entries(this.defaultConfig));
    console.log(`Configuration initialized for device ${this.deviceId}`);
  }

  get(section, key = null) {
    if (!this.config.has(section)) {
      throw new Error(`Configuration section not found: ${section}`);
    }

    const sectionData = this.config.get(section);

    if (key === null) {
      return sectionData;
    }

    if (!sectionData.hasOwnProperty(key)) {
      throw new Error(`Configuration key not found: ${section}.${key}`);
    }

    return sectionData[key];
  }

  set(section, key, value) {
    if (!this.config.has(section)) {
      throw new Error(`Configuration section not found: ${section}`);
    }

    const sectionData = this.config.get(section);

    // Validate the value before setting
    this.validateConfigValue(section, key, value);

    // Create backup of old value
    const oldValue = sectionData[key];
    
    // Update the value
    sectionData[key] = value;

    // Record the change in history
    this.configHistory.push({
      timestamp: new Date().toISOString(),
      section: section,
      key: key,
      oldValue: oldValue,
      newValue: value,
      version: this.configVersion
    });

    // Keep only last 100 changes
    if (this.configHistory.length > 100) {
      this.configHistory = this.configHistory.slice(-100);
    }

    this.lastUpdated = new Date().toISOString();
    
    console.log(`Configuration updated: ${section}.${key} = ${value}`);

    // Apply the configuration change if needed
    this.applyConfigChange(section, key, value);

    return true;
  }

  validateConfigValue(section, key, value) {
    // Add validation logic for different configuration options
    switch (section) {
      case 'sensors':
        this.validateSensorConfig(key, value);
        break;
      case 'alerts':
        this.validateAlertConfig(key, value);
        break;
      case 'power':
        this.validatePowerConfig(key, value);
        break;
      case 'communication':
        this.validateCommunicationConfig(key, value);
        break;
      default:
        // Basic type validation
        if (value === null || value === undefined) {
          throw new Error(`Invalid value for ${section}.${key}`);
        }
    }
  }

  validateSensorConfig(key, value) {
    if (key === 'readInterval' || key === 'updateInterval') {
      if (typeof value !== 'number' || value < 1000) {
        throw new Error(`Invalid interval value: ${value}. Must be at least 1000ms`);
      }
    }
  }

  validateAlertConfig(key, value) {
    if (typeof value === 'object') {
      // Validate threshold object
      const thresholds = ['min', 'max', 'criticalMin', 'criticalMax'];
      for (const threshold of thresholds) {
        if (value[threshold] !== undefined && typeof value[threshold] !== 'number') {
          throw new Error(`Invalid threshold value for ${threshold}: ${value[threshold]}`);
        }
      }
    }
  }

  validatePowerConfig(key, value) {
    if (key === 'criticalLevel' || key === 'emergencyShutdown') {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        throw new Error(`Invalid battery level: ${value}. Must be between 0-100`);
      }
    }
  }

  validateCommunicationConfig(key, value) {
    const validProtocols = ['lora', 'gsm', 'satellite', 'wifi'];
    
    if (key === 'primaryProtocol' || key === 'fallbackProtocol' || key === 'emergencyProtocol') {
      if (!validProtocols.includes(value)) {
        throw new Error(`Invalid protocol: ${value}. Must be one of: ${validProtocols.join(', ')}`);
      }
    }
  }

  applyConfigChange(section, key, value) {
    // Here you would apply the configuration change to the actual hardware/software
    console.log(`Applying configuration change: ${section}.${key} = ${value}`);
    
    // Example: If sensor interval changed, restart the sensor with new interval
    if (section === 'sensors' && (key === 'readInterval' || key === 'updateInterval')) {
      this.restartSensorWithNewInterval(section, key, value);
    }

    // Example: If alert thresholds changed, update monitoring system
    if (section === 'alerts') {
      this.updateAlertSystem(section, key, value);
    }

    // Example: If power settings changed, apply new power profile
    if (section === 'power') {
      this.applyPowerSettings(section, key, value);
    }
  }

  restartSensorWithNewInterval(section, key, value) {
    console.log(`Restarting sensor with new ${key}: ${value}ms`);
    // Implementation would depend on your sensor management system
  }

  updateAlertSystem(section, key, value) {
    console.log(`Updating alert system with new thresholds for ${key}`);
    // Implementation would update your alert monitoring system
  }

  applyPowerSettings(section, key, value) {
    console.log(`Applying new power setting: ${key} = ${value}`);
    // Implementation would adjust power management
  }

  exportConfig() {
    const configObj = {};
    
    for (const [section, data] of this.config) {
      configObj[section] = { ...data };
    }

    return {
      deviceId: this.deviceId,
      version: this.configVersion,
      lastUpdated: this.lastUpdated,
      configuration: configObj
    };
  }

  importConfig(configData) {
    // Validate the imported configuration
    this.validateImportedConfig(configData);

    // Create backup before import
    const backup = this.exportConfig();

    try {
      // Apply the new configuration
      for (const [section, data] of Object.entries(configData.configuration)) {
        this.config.set(section, data);
      }

      this.configVersion = configData.version || '1.0';
      this.lastUpdated = new Date().toISOString();

      console.log(`Configuration imported successfully for device ${this.deviceId}`);

      return {
        success: true,
        backup: backup,
        newConfig: this.exportConfig()
      };

    } catch (error) {
      // Restore from backup if import fails
      this.config.clear();
      for (const [section, data] of Object.entries(backup.configuration)) {
        this.config.set(section, data);
      }

      throw new Error(`Configuration import failed: ${error.message}. Restored from backup.`);
    }
  }

  validateImportedConfig(configData) {
    if (!configData.configuration) {
      throw new Error('Invalid configuration format: missing configuration object');
    }

    // Add more specific validation as needed
    const requiredSections = ['sensors', 'communication', 'power', 'alerts'];
    
    for (const section of requiredSections) {
      if (!configData.configuration[section]) {
        throw new Error(`Missing required configuration section: ${section}`);
      }
    }
  }

  resetToDefaults() {
    console.log('Resetting configuration to defaults...');
    
    const backup = this.exportConfig();
    
    this.config.clear();
    this.initialize();
    
    return {
      success: true,
      message: 'Configuration reset to defaults',
      backup: backup
    };
  }

  getConfigHistory(limit = 10) {
    return this.configHistory.slice(-limit).reverse(); // Latest first
  }

  getConfigSummary() {
    const summary = {
      deviceId: this.deviceId,
      version: this.configVersion,
      lastUpdated: this.lastUpdated,
      sections: Array.from(this.config.keys()),
      changeHistory: this.configHistory.length
    };

    // Add some key configuration values
    summary.keySettings = {
      primaryProtocol: this.get('communication', 'primaryProtocol'),
      powerProfile: this.get('power', 'defaultProfile'),
      autoUpdate: this.get('system', 'autoUpdate'),
      sensorCount: Object.keys(this.get('sensors')).length
    };

    return summary;
  }

  // Method to generate configuration for specific components
  getComponentConfig(componentName) {
    switch (componentName) {
      case 'temperature-sensor':
        return this.get('sensors', 'temperature');
      case 'ph-sensor':
        return this.get('sensors', 'ph');
      case 'gps-tracker':
        return this.get('sensors', 'gps');
      case 'lora-transmitter':
        return this.get('communication');
      case 'battery-manager':
        return this.get('power');
      default:
        throw new Error(`Unknown component: ${componentName}`);
    }
  }
}

module.exports = DeviceConfiguration;
