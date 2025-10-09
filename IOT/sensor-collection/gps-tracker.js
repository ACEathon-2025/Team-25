const { geolocation } = require('../../utils/geolocation');

class GPSTracker {
  constructor(deviceId, initialPosition = null) {
    this.deviceId = deviceId;
    this.currentPosition = initialPosition;
    this.satellitesConnected = 0;
    this.accuracy = 0;
    this.lastUpdate = null;
    this.isOnline = false;
    this.positionHistory = [];
  }

  async getCurrentPosition() {
    try {
      // Simulate GPS position acquisition
      await this.acquireSatellites();
      
      if (!this.currentPosition) {
        // Default to Mumbai coastal area if no initial position
        this.currentPosition = {
          lat: 19.0760 + (Math.random() - 0.5) * 0.01,
          lng: 72.8777 + (Math.random() - 0.5) * 0.01,
          accuracy: 2.5, // meters
          altitude: 0,
          speed: 0, // knots
          heading: 0, // degrees
          timestamp: new Date().toISOString()
        };
      } else {
        // Simulate movement for demo purposes
        this.simulateMovement();
      }

      this.lastUpdate = new Date().toISOString();
      this.positionHistory.push({ ...this.currentPosition });

      // Keep only last 100 positions
      if (this.positionHistory.length > 100) {
        this.positionHistory = this.positionHistory.slice(-100);
      }

      return this.currentPosition;

    } catch (error) {
      console.error(`GPS tracker ${this.deviceId} error:`, error);
      this.isOnline = false;
      throw new Error(`GPS position acquisition failed: ${error.message}`);
    }
  }

  async acquireSatellites() {
    // Simulate satellite acquisition
    this.satellitesConnected = Math.floor(Math.random() * 8) + 4; // 4-12 satellites
    this.accuracy = 1.5 + (Math.random() * 3); // 1.5-4.5 meters accuracy
    this.isOnline = this.satellitesConnected >= 4;
    
    if (!this.isOnline) {
      throw new Error('Insufficient satellite connectivity');
    }
  }

  simulateMovement() {
    // Add small random movement for demo
    const movement = {
      lat: (Math.random() - 0.5) * 0.0001, // ~11 meters
      lng: (Math.random() - 0.5) * 0.0001, // ~11 meters
      speed: Math.random() * 5, // 0-5 knots
      heading: Math.random() * 360 // 0-359 degrees
    };

    this.currentPosition.lat += movement.lat;
    this.currentPosition.lng += movement.lng;
    this.currentPosition.speed = movement.speed;
    this.currentPosition.heading = movement.heading;
    this.currentPosition.accuracy = this.accuracy;
    this.currentPosition.timestamp = new Date().toISOString();
  }

  calculateDistanceTraveled() {
    if (this.positionHistory.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < this.positionHistory.length; i++) {
      const prev = this.positionHistory[i - 1];
      const curr = this.positionHistory[i];
      
      const distance = geolocation.calculateDistance(
        prev.lat, prev.lng,
        curr.lat, curr.lng
      );
      
      totalDistance += distance;
    }

    return parseFloat(totalDistance.toFixed(2)); // km
  }

  getCurrentSpeed() {
    return this.currentPosition ? this.currentPosition.speed : 0;
  }

  isInSafeZone(safeZone) {
    if (!this.currentPosition || !safeZone) return false;
    
    return geolocation.isInSafeZone(
      this.currentPosition.lat,
      this.currentPosition.lng,
      safeZone
    );
  }

  getStatus() {
    return {
      deviceId: this.deviceId,
      online: this.isOnline,
      satellites: this.satellitesConnected,
      accuracy: this.accuracy,
      currentPosition: this.currentPosition,
      lastUpdate: this.lastUpdate,
      distanceTraveled: this.calculateDistanceTraveled(),
      positionHistoryCount: this.positionHistory.length
    };
  }
}

module.exports = GPSTracker;
