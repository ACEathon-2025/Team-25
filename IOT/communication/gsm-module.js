class GSMModule {
  constructor(deviceId, simNumber) {
    this.deviceId = deviceId;
    this.simNumber = simNumber;
    this.isRegistered = false;
    this.signalStrength = 0;
    this.networkOperator = '';
    this.smsQueue = [];
    this.callStatus = 'idle';
  }

  async initialize() {
    console.log(`Initializing GSM module ${this.deviceId}...`);
    
    try {
      await this.powerOn();
      await this.checkSIM();
      await this.registerNetwork();
      
      this.isRegistered = true;
      console.log(`GSM module ${this.deviceId} initialized successfully`);
      
    } catch (error) {
      console.error(`GSM initialization failed:`, error);
      this.isRegistered = false;
      throw error;
    }
  }

  async powerOn() {
    console.log('Powering on GSM module...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate power-on sequence
    const powerOnSuccess = Math.random() > 0.05; // 95% success rate
    if (!powerOnSuccess) {
      throw new Error('GSM module power-on failed');
    }
  }

  async checkSIM() {
    console.log('Checking SIM card...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!this.simNumber) {
      throw new Error('No SIM card detected');
    }
    
    // Simulate SIM check
    const simValid = Math.random() > 0.02; // 98% valid SIM
    if (!simValid) {
      throw new Error('Invalid or blocked SIM card');
    }
  }

  async registerNetwork() {
    console.log('Registering to cellular network...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Simulate network registration
    const registrationSuccess = Math.random() > 0.1; // 90% success rate
    if (!registrationSuccess) {
      throw new Error('Network registration failed');
    }
    
    this.networkOperator = 'Airtel India';
    this.signalStrength = Math.floor(Math.random() * 30) + 10; // 10-40%
    
    console.log(`Registered to ${this.networkOperator}, signal: ${this.signalStrength}%`);
  }

  async sendSMS(phoneNumber, message) {
    if (!this.isRegistered) {
      throw new Error('GSM module not registered to network');
    }

    if (this.signalStrength < 15) {
      throw new Error('Insufficient signal strength for SMS');
    }

    const sms = {
      id: `sms_${Date.now()}`,
      to: phoneNumber,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    this.smsQueue.push(sms);

    try {
      await this.transmitSMS(sms);
      sms.status = 'sent';
      sms.sentAt = new Date().toISOString();
      
      console.log(`SMS sent to ${phoneNumber}: ${message.substring(0, 50)}...`);
      
      return {
        success: true,
        messageId: sms.id,
        recipient: phoneNumber
      };
      
    } catch (error) {
      sms.status = 'failed';
      sms.error = error.message;
      
      console.error(`SMS failed to ${phoneNumber}:`, error);
      
      throw error;
    }
  }

  async transmitSMS(sms) {
    // Simulate SMS transmission
    console.log(`Transmitting SMS to ${sms.to}...`);
    
    // Simulate transmission time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate occasional failures
    const success = Math.random() > 0.05; // 95% success rate
    if (!success) {
      throw new Error('SMS delivery failed - network error');
    }

    // Simulate delivery report
    const delivered = Math.random() > 0.1; // 90% delivery rate
    sms.delivered = delivered;
    
    if (!delivered) {
      throw new Error('SMS not delivered to recipient');
    }
  }

  async sendEmergencySMS(phoneNumber, emergencyData) {
    const message = this.formatEmergencyMessage(emergencyData);
    return await this.sendSMS(phoneNumber, message);
  }

  formatEmergencyMessage(emergencyData) {
    const location = emergencyData.location;
    const locationUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    
    return `🚨 EMERGENCY ALERT 🚨
Fisherman in distress!
Location: ${locationUrl}
Time: ${new Date().toLocaleString()}
Type: ${emergencyData.alertType}
Message: ${emergencyData.message}

Sent via SmartFishing System`;
  }

  async makeCall(phoneNumber) {
    if (!this.isRegistered) {
      throw new Error('GSM module not registered to network');
    }

    if (this.callStatus !== 'idle') {
      throw new Error('GSM module is busy with another call');
    }

    console.log(`Initiating call to ${phoneNumber}...`);
    this.callStatus = 'dialing';

    try {
      // Simulate call setup
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Simulate call success
      const callConnected = Math.random() > 0.2; // 80% success rate
      if (!callConnected) {
        throw new Error('Call failed to connect');
      }

      this.callStatus = 'connected';
      console.log(`Call connected to ${phoneNumber}`);

      // Simulate call duration (auto-end after 30 seconds for demo)
      setTimeout(() => {
        this.endCall();
      }, 30000);

      return {
        success: true,
        status: 'connected',
        duration: 0
      };

    } catch (error) {
      this.callStatus = 'idle';
      throw error;
    }
  }

  endCall() {
    if (this.callStatus === 'connected') {
      console.log('Call ended');
    }
    this.callStatus = 'idle';
  }

  async checkSignal() {
    // Simulate signal strength variation
    this.signalStrength = Math.floor(Math.random() * 30) + 10;
    
    return {
      strength: this.signalStrength,
      quality: this.getSignalQuality(this.signalStrength),
      operator: this.networkOperator
    };
  }

  getSignalQuality(strength) {
    if (strength >= 25) return 'excellent';
    if (strength >= 20) return 'good';
    if (strength >= 15) return 'fair';
    return 'poor';
  }

  getStatus() {
    return {
      deviceId: this.deviceId,
      registered: this.isRegistered,
      signalStrength: this.signalStrength,
      networkOperator: this.networkOperator,
      callStatus: this.callStatus,
      pendingSMS: this.smsQueue.filter(sms => sms.status === 'sending').length
    };
  }
}

module.exports = GSMModule;
