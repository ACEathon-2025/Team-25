const { helpers } = require('../../utils');

class ProtocolHandler {
  constructor() {
    this.supportedProtocols = ['lora', 'gsm', 'satellite', 'wifi'];
    this.activeTransports = new Map();
    this.messageRouter = new Map();
    this.fallbackOrder = ['wifi', 'gsm', 'lora', 'satellite'];
    this.transmissionLog = [];
  }

  registerTransport(protocol, transportInstance) {
    if (!this.supportedProtocols.includes(protocol)) {
      throw new Error(`Unsupported protocol: ${protocol}`);
    }

    this.activeTransports.set(protocol, transportInstance);
    console.log(`Registered ${protocol} transport`);
  }

  async sendData(data, options = {}) {
    const {
      priority = 'normal',
      requiredProtocol = null,
      maxRetries = 3,
      timeout = 30000
    } = options;

    const transmissionId = helpers.generateAlertId();
    const startTime = Date.now();

    const transmissionRecord = {
      id: transmissionId,
      data: data,
      priority: priority,
      timestamp: new Date().toISOString(),
      attempts: [],
      status: 'pending'
    };

    this.transmissionLog.push(transmissionRecord);

    try {
      let result;
      
      if (requiredProtocol) {
        // Use specified protocol
        result = await this.sendViaProtocol(requiredProtocol, data, transmissionRecord);
      } else {
        // Auto-select best protocol
        result = await this.sendViaBestProtocol(data, priority, transmissionRecord);
      }

      transmissionRecord.status = 'success';
      transmissionRecord.completedAt = new Date().toISOString();
      transmissionRecord.result = result;

      console.log(`Transmission ${transmissionId} completed via ${result.protocol}`);
      
      return {
        success: true,
        transmissionId: transmissionId,
        protocol: result.protocol,
        details: result
      };

    } catch (error) {
      transmissionRecord.status = 'failed';
      transmissionRecord.error = error.message;

      console.error(`Transmission ${transmissionId} failed:`, error);
      
      throw new Error(`All transmission attempts failed: ${error.message}`);
    }
  }

  async sendViaBestProtocol(data, priority, transmissionRecord) {
    const availableProtocols = this.getAvailableProtocols();
    
    if (availableProtocols.length === 0) {
      throw new Error('No communication protocols available');
    }

    // Sort protocols by priority and cost
    const prioritizedProtocols = this.prioritizeProtocols(availableProtocols, priority);

    for (const protocol of prioritizedProtocols) {
      try {
        const result = await this.sendViaProtocol(protocol, data, transmissionRecord);
        return { ...result, protocol: protocol };
      } catch (error) {
        console.log(`Protocol ${protocol} failed: ${error.message}`);
        // Continue to next protocol
      }
    }

    throw new Error('All available protocols failed');
  }

  async sendViaProtocol(protocol, data, transmissionRecord) {
    const transport = this.activeTransports.get(protocol);
    
    if (!transport) {
      throw new Error(`Transport not available for protocol: ${protocol}`);
    }

    const attempt = {
      protocol: protocol,
      timestamp: new Date().toISOString(),
      status: 'attempting'
    };

    transmissionRecord.attempts.push(attempt);

    try {
      let result;
      
      switch (protocol) {
        case 'lora':
          result = await transport.transmit(data);
          break;
        case 'gsm':
          // For GSM, we might send as SMS for small data
          if (this.shouldSendAsSMS(data)) {
            const smsData = this.formatDataForSMS(data);
            result = await transport.sendSMS(this.getDefaultRecipient(), smsData);
          } else {
            // For larger data, use GPRS (simulated)
            result = await this.sendViaGPRS(transport, data);
          }
          break;
        case 'satellite':
          result = await transport.sendMessage(data);
          break;
        case 'wifi':
          result = await this.sendViaWifi(transport, data);
          break;
        default:
          throw new Error(`Unhandled protocol: ${protocol}`);
      }

      attempt.status = 'success';
      attempt.result = result;

      return result;

    } catch (error) {
      attempt.status = 'failed';
      attempt.error = error.message;
      throw error;
    }
  }

  getAvailableProtocols() {
    const available = [];
    
    for (const [protocol, transport] of this.activeTransports) {
      if (this.isProtocolAvailable(protocol, transport)) {
        available.push(protocol);
      }
    }
    
    return available;
  }

  isProtocolAvailable(protocol, transport) {
    switch (protocol) {
      case 'lora':
        return transport.isConnected;
      case 'gsm':
        return transport.isRegistered && transport.signalStrength >= 15;
      case 'satellite':
        return transport.isConnected;
      case 'wifi':
        return transport.isConnected; // Assuming wifi transport has isConnected
      default:
        return false;
    }
  }

  prioritizeProtocols(availableProtocols, priority) {
    // Sort protocols based on priority and characteristics
    const protocolScores = availableProtocols.map(protocol => {
      let score = 0;
      
      switch (protocol) {
        case 'wifi':
          score = priority === 'high' ? 90 : 80; // Fast and free
          break;
        case 'gsm':
          score = priority === 'high' ? 70 : 60; // Reliable but cost
          break;
        case 'lora':
          score = priority === 'high' ? 50 : 70; // Free but slow
          break;
        case 'satellite':
          score = priority === 'high' ? 100 : 40; // Expensive but global
          break;
      }
      
      return { protocol, score };
    });

    // Sort by score descending
    protocolScores.sort((a, b) => b.score - a.score);
    
    return protocolScores.map(item => item.protocol);
  }

  shouldSendAsSMS(data) {
    const dataSize = JSON.stringify(data).length;
    return dataSize <= 160; // Standard SMS character limit
  }

  formatDataForSMS(data) {
    if (typeof data === 'string') {
      return data.substring(0, 160);
    }
    
    // For object data, create a concise summary
    if (data.alertType === 'SOS_EMERGENCY') {
      return `EMERGENCY: ${data.message || 'Help needed'}. Location: ${data.location.lat},${data.location.lng}`;
    }
    
    return JSON.stringify(data).substring(0, 160);
  }

  getDefaultRecipient() {
    // Should be configured based on application
    return '+911234567890'; // Default emergency number
  }

  async sendViaGPRS(gsmTransport, data) {
    // Simulate GPRS data transmission
    console.log('Sending data via GPRS...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      method: 'gprs',
      size: JSON.stringify(data).length,
      success: true
    };
  }

  async sendViaWifi(wifiTransport, data) {
    // Simulate WiFi transmission
    console.log('Sending data via WiFi...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      method: 'wifi',
      size: JSON.stringify(data).length,
      success: true
    };
  }

  async sendEmergencyData(emergencyData) {
    console.log('🆘 HANDLING EMERGENCY TRANSMISSION 🆘');
    
    // Emergency transmissions try all protocols simultaneously
    const protocols = this.getAvailableProtocols();
    const promises = [];
    
    for (const protocol of protocols) {
      promises.push(
        this.sendViaProtocol(protocol, emergencyData, {
          protocol: protocol,
          timestamp: new Date().toISOString(),
          status: 'emergency_attempt'
        }).catch(error => ({
          protocol: protocol,
          success: false,
          error: error.message
        }))
      );
    }

    const results = await Promise.all(promises);
    
    const successful = results.filter(r => r.success);
    
    if (successful.length === 0) {
      throw new Error('No emergency transmission succeeded');
    }

    return {
      success: true,
      attempts: results.length,
      successful: successful.length,
      protocolsUsed: successful.map(s => s.protocol)
    };
  }

  getTransmissionStats() {
    const total = this.transmissionLog.length;
    const successful = this.transmissionLog.filter(t => t.status === 'success').length;
    const failed = this.transmissionLog.filter(t => t.status === 'failed').length;
    
    const protocolUsage = {};
    this.transmissionLog.forEach(transmission => {
      transmission.attempts.forEach(attempt => {
        if (!protocolUsage[attempt.protocol]) {
          protocolUsage[attempt.protocol] = { attempts: 0, success: 0 };
        }
        protocolUsage[attempt.protocol].attempts++;
        if (attempt.status === 'success') {
          protocolUsage[attempt.protocol].success++;
        }
      });
    });

    return {
      totalTransmissions: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      protocolUsage: protocolUsage,
      recentTransmissions: this.transmissionLog.slice(-10)
    };
  }
}

module.exports = ProtocolHandler;
