class SatelliteComms {
  constructor(deviceId, satelliteSystem = 'iridium') {
    this.deviceId = deviceId;
    this.satelliteSystem = satelliteSystem;
    this.isConnected = false;
    this.satellitesInView = 0;
    this.messageQueue = [];
    this.transmissionCost = 0;
  }

  async initialize() {
    console.log(`Initializing ${this.satelliteSystem} satellite communicator...`);
    
    try {
      await this.acquireSatellites();
      await this.establishLink();
      
      this.isConnected = true;
      console.log(`Satellite communicator ${this.deviceId} initialized successfully`);
      
    } catch (error) {
      console.error(`Satellite initialization failed:`, error);
      this.isConnected = false;
      throw error;
    }
  }

  async acquireSatellites() {
    console.log('Acquiring satellite signals...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Longer acquisition time
    
    this.satellitesInView = Math.floor(Math.random() * 3) + 1; // 1-3 satellites
    
    if (this.satellitesInView === 0) {
      throw new Error('No satellites in view');
    }
    
    console.log(`Acquired ${this.satellitesInView} satellite(s)`);
  }

  async establishLink() {
    console.log('Establishing satellite link...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const linkEstablished = Math.random() > 0.2; // 80% success rate
    if (!linkEstablished) {
      throw new Error('Failed to establish satellite link');
    }
    
    console.log('Satellite link established');
  }

  async sendMessage(message, priority = 'normal') {
    if (!this.isConnected) {
      throw new Error('Satellite communicator not connected');
    }

    const satelliteMessage = {
      id: `sat_${Date.now()}`,
      message: message,
      priority: priority,
      timestamp: new Date().toISOString(),
      size: JSON.stringify(message).length,
      status: 'queued',
      retries: 0
    };

    this.messageQueue.push(satelliteMessage);

    try {
      const result = await this.transmitViaSatellite(satelliteMessage);
      satelliteMessage.status = 'sent';
      satelliteMessage.sentAt = new Date().toISOString();
      satelliteMessage.cost = this.calculateCost(satelliteMessage.size);
      
      this.transmissionCost += satelliteMessage.cost;
      
      console.log(`Satellite message sent (${satelliteMessage.size} bytes, $${satelliteMessage.cost})`);
      
      return {
        success: true,
        messageId: satelliteMessage.id,
        size: satelliteMessage.size,
        cost: satelliteMessage.cost
      };
      
    } catch (error) {
      satelliteMessage.retries++;
      satelliteMessage.lastError = error.message;
      
      if (satelliteMessage.retries >= 2) { // Limited retries due to cost
        satelliteMessage.status = 'failed';
        throw new Error(`Satellite transmission failed after ${satelliteMessage.retries} retries`);
      } else {
        satelliteMessage.status = 'retrying';
        console.log(`Satellite transmission failed, retrying...`);
        return await this.sendMessage(message, priority); // Retry
      }
    }
  }

  async transmitViaSatellite(message) {
    console.log(`Transmitting via ${this.satelliteSystem} satellite...`);
    
    // Simulate satellite transmission time (slower than terrestrial)
    const transmissionTime = 5000 + (Math.random() * 10000); // 5-15 seconds
    await new Promise(resolve => setTimeout(resolve, transmissionTime));

    // Simulate transmission success (higher reliability than GSM in remote areas)
    const success = Math.random() > 0.1; // 90% success rate
    if (!success) {
      throw new Error('Satellite transmission failed - link interruption');
    }

    // Simulate signal quality metrics
    return {
      system: this.satelliteSystem,
      transmissionTime: transmissionTime,
      signalQuality: 'good',
      satellitesUsed: 1
    };
  }

  calculateCost(messageSize) {
    // Simulate cost calculation based on message size and system
    const baseCost = this.satelliteSystem === 'iridium' ? 0.15 : 0.10; // USD per message
    const sizeCost = (messageSize / 1024) * 0.05; // USD per KB
    
    return parseFloat((baseCost + sizeCost).toFixed(2));
  }

  async sendEmergencyBeacon(emergencyData) {
    const beaconMessage = this.formatEmergencyBeacon(emergencyData);
    
    console.log('🚨 TRANSMITTING EMERGENCY BEACON 🚨');
    
    try {
      const result = await this.sendMessage(beaconMessage, 'emergency');
      
      // Emergency beacons are typically free or prioritized
      result.cost = 0;
      result.priority = 'highest';
      
      console.log('Emergency beacon transmitted successfully');
      return result;
      
    } catch (error) {
      console.error('EMERGENCY BEACON TRANSMISSION FAILED:', error);
      throw error;
    }
  }

  formatEmergencyBeacon(emergencyData) {
    const location = emergencyData.location;
    
    return {
      type: 'EMERGENCY_BEACON',
      protocol: 'COSPAS-SARSAT',
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
      coordinates: {
        latitude: location.lat,
        longitude: location.lng
      },
      emergency: {
        type: emergencyData.alertType,
        message: emergencyData.message,
        vessel: 'Fishing Boat',
        personsOnBoard: 1 // Default, should be configured
      },
      metadata: {
        system: this.satelliteSystem,
        battery: this.getBatteryLevel(),
        gps_accuracy: 'high'
      }
    };
  }

  getBatteryLevel() {
    return Math.floor(Math.random() * 40) + 60; // 60-100%
  }

  async getStatus() {
    const signalStrength = this.satellitesInView > 0 ? 'good' : 'poor';
    
    return {
      deviceId: this.deviceId,
      connected: this.isConnected,
      satelliteSystem: this.satelliteSystem,
      satellitesInView: this.satellitesInView,
      signalStrength: signalStrength,
      pendingMessages: this.messageQueue.filter(msg => msg.status === 'queued').length,
      totalCost: parseFloat(this.transmissionCost.toFixed(2)),
      lastTransmission: this.messageQueue[this.messageQueue.length - 1]?.timestamp
    };
  }

  async resetConnection() {
    console.log('Resetting satellite connection...');
    this.isConnected = false;
    this.satellitesInView = 0;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.initialize();
  }
}

module.exports = SatelliteComms;
