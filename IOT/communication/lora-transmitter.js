class LoRaTransmitter {
  constructor(deviceId, config = {}) {
    this.deviceId = deviceId;
    this.config = {
      frequency: 868e6, // EU LoRa frequency
      bandwidth: 125e3,
      spreadingFactor: 7,
      codingRate: 5,
      txPower: 14,
      ...config
    };
    this.isConnected = false;
    this.transmissionQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  async initialize() {
    console.log(`Initializing LoRa transmitter ${this.deviceId}...`);
    
    try {
      // Simulate hardware initialization
      await this.connectToModule();
      await this.configureModule();
      
      this.isConnected = true;
      console.log(`LoRa transmitter ${this.deviceId} initialized successfully`);
      
      // Start processing queue
      this.processQueue();
      
    } catch (error) {
      console.error(`LoRa initialization failed:`, error);
      this.isConnected = false;
      throw error;
    }
  }

  async connectToModule() {
    // Simulate connection to LoRa module
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = Math.random() > 0.1; // 90% success rate
    if (!success) {
      throw new Error('Failed to connect to LoRa module');
    }
  }

  async configureModule() {
    console.log('Configuring LoRa module parameters...');
    
    // Simulate configuration commands
    const commands = [
      `AT+CFG=${this.config.frequency}`,
      `AT+BW=${this.config.bandwidth}`,
      `AT+SF=${this.config.spreadingFactor}`,
      `AT+CR=${this.config.codingRate}`,
      `AT+PWR=${this.config.txPower}`
    ];

    for (const command of commands) {
      await this.sendCommand(command);
    }
  }

  async sendCommand(command) {
    // Simulate sending AT command to module
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional command failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Command failed: ${command}`);
    }
    
    return `OK: ${command}`;
  }

  async transmit(data) {
    if (!this.isConnected) {
      throw new Error('LoRa transmitter not connected');
    }

    const transmission = {
      id: `tx_${Date.now()}`,
      data: data,
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'queued'
    };

    this.transmissionQueue.push(transmission);
    console.log(`Data queued for transmission: ${transmission.id}`);

    // Wait for transmission to complete
    return await this.waitForTransmission(transmission.id);
  }

  async processQueue() {
    setInterval(async () => {
      if (this.transmissionQueue.length === 0 || !this.isConnected) return;

      const transmission = this.transmissionQueue[0];
      
      try {
        transmission.status = 'transmitting';
        await this.sendData(transmission.data);
        
        transmission.status = 'success';
        transmission.completedAt = new Date().toISOString();
        
        // Remove successful transmission
        this.transmissionQueue.shift();
        
        console.log(`Transmission successful: ${transmission.id}`);
        
      } catch (error) {
        transmission.retries++;
        transmission.lastError = error.message;
        
        if (transmission.retries >= this.maxRetries) {
          transmission.status = 'failed';
          this.transmissionQueue.shift();
          console.error(`Transmission failed after ${this.maxRetries} retries: ${transmission.id}`);
        } else {
          transmission.status = 'retrying';
          console.log(`Transmission failed, retrying (${transmission.retries}/${this.maxRetries}): ${transmission.id}`);
        }
      }
    }, 1000); // Process every second
  }

  async sendData(data) {
    // Simulate LoRa data transmission
    const packet = this.encodeData(data);
    
    console.log(`Transmitting LoRa packet: ${packet.length} bytes`);
    
    // Simulate transmission time based on data size and LoRa settings
    const airTime = this.calculateAirTime(packet.length);
    await new Promise(resolve => setTimeout(resolve, airTime));

    // Simulate transmission success (90% success rate)
    const success = Math.random() > 0.1;
    if (!success) {
      throw new Error('LoRa transmission failed - no acknowledgement');
    }

    return {
      packetSize: packet.length,
      airTime: airTime,
      rssi: -Math.floor(Math.random() * 30 + 70), // -70 to -100 dBm
      snr: Math.random() * 10 - 5 // -5 to +5 dB
    };
  }

  encodeData(data) {
    // Simple JSON encoding for simulation
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString);
  }

  calculateAirTime(packetLength) {
    // Simplified LoRa air time calculation
    const symbolTime = Math.pow(2, this.config.spreadingFactor) / this.config.bandwidth;
    const preambleSymbols = 8;
    const payloadSymbols = Math.ceil(
      Math.max(
        Math.ceil((8 * packetLength - 4 * this.config.spreadingFactor + 28 + 16) / 
        (4 * (this.config.spreadingFactor - 2 * this.config.codingRate))) * 
        (this.config.codingRate + 4), 0
      )
    );
    
    const totalSymbols = preambleSymbols + payloadSymbols + 4.25;
    return totalSymbols * symbolTime * 1000; // Convert to milliseconds
  }

  async waitForTransmission(transmissionId) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const transmission = this.transmissionQueue.find(t => t.id === transmissionId);
        
        if (!transmission) {
          clearInterval(checkInterval);
          resolve({ status: 'completed', message: 'Transmission processed' });
          return;
        }

        if (transmission.status === 'success') {
          clearInterval(checkInterval);
          resolve({
            status: 'success',
            transmissionId: transmission.id,
            completedAt: transmission.completedAt
          });
        } else if (transmission.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(`Transmission failed: ${transmission.lastError}`));
        }
      }, 100);
    });
  }

  getStatus() {
    return {
      deviceId: this.deviceId,
      connected: this.isConnected,
      queueLength: this.transmissionQueue.length,
      config: this.config
    };
  }
}

module.exports = LoRaTransmitter;
