// Virtual schematic for the IoT sensor node
class SensorNodeSchematic {
  constructor() {
    this.components = {
      microcontroller: {
        type: 'ESP32',
        pins: {
          power: { '3.3V': 2, 'GND': 4 },
          i2c: { 'SDA': 21, 'SCL': 22 },
          spi: { 'MISO': 19, 'MOSI': 23, 'SCK': 18, 'CS': 5 },
          analog: { 'ADC1': 36, 'ADC2': 39 },
          digital: { 'GPIO': [2, 4, 12, 13, 14, 15, 16, 17, 25, 26, 27, 32, 33] }
        },
        specifications: {
          clockSpeed: '240MHz',
          flashMemory: '4MB',
          ram: '520KB',
          wireless: ['WiFi', 'Bluetooth']
        }
      },

      sensors: {
        temperature: {
          type: 'DS18B20',
          interface: 'OneWire',
          pin: 4,
          specifications: {
            range: '-55°C to +125°C',
            accuracy: '±0.5°C',
            resolution: '9 to 12 bits'
          }
        },

        ph: {
          type: 'Analog pH Sensor',
          interface: 'Analog',
          pin: 36,
          specifications: {
            range: '0-14 pH',
            accuracy: '±0.1 pH',
            responseTime: '< 1 minute'
          },
          calibration: {
            points: [
              { pH: 4.0, voltage: 2.5 },
              { pH: 7.0, voltage: 2.0 },
              { pH: 10.0, voltage: 1.5 }
            ]
          }
        },

        gps: {
          type: 'NEO-6M',
          interface: 'UART',
          pins: { 'TX': 17, 'RX': 16 },
          specifications: {
            accuracy: '2.5m',
            updateRate: '1Hz',
            channels: '50'
          }
        }
      },

      communication: {
        lora: {
          type: 'SX1276',
          interface: 'SPI',
          pins: { 'MISO': 19, 'MOSI': 27, 'SCK': 5, 'NSS': 18, 'RST': 14, 'DIO0': 26 },
          specifications: {
            frequency: '868MHz',
            power: '20dBm',
            range: '10km+'
          }
        },

        gsm: {
          type: 'SIM800L',
          interface: 'UART',
          pins: { 'TX': 25, 'RX': 33 },
          specifications: {
            bands: 'GSM 900/1800MHz',
            gprs: 'Class 12'
          }
        }
      },

      power: {
        battery: {
          type: 'LiPo',
          capacity: '4000mAh',
          voltage: '3.7V',
          charging: {
            ic: 'TP4056',
            current: '1000mA',
            protection: 'DW01A'
          }
        },

        solar: {
          type: 'Monocrystalline',
          specifications: {
            power: '5W',
            voltage: '6V',
            efficiency: '21%'
          },
          charging: {
            controller: 'MPPT',
            efficiency: '95%'
          }
        },

        regulation: {
          '3.3V': {
            ic: 'AMS1117',
            current: '1A',
            dropout: '1.1V'
          }
        }
      },

      interfaces: {
        i2c: {
          devices: ['RTC', 'EEPROM'],
          pullup: '4.7kΩ'
        },

        uart: {
          devices: ['GPS', 'GSM'],
          baudRates: [9600, 115200]
        },

        onewire: {
          devices: ['Temperature Sensor'],
          pullup: '4.7kΩ'
        }
      }
    };

    this.connections = this.generateConnections();
    this.billOfMaterials = this.generateBOM();
  }

  generateConnections() {
    return [
      {
        from: 'Battery+',
        to: 'Power Regulation',
        description: 'Main power input',
        wire: '22AWG',
        current: '2A max'
      },
      {
        from: 'Solar Panel+',
        to: 'MPPT Controller IN+',
        description: 'Solar input',
        wire: '20AWG',
        current: '1A max'
      },
      {
        from: 'MPPT OUT+',
        to: 'Battery+',
        description: 'Charging current',
        wire: '22AWG',
        current: '1A max'
      },
      {
        from: '3.3V Regulator',
        to: 'ESP32 VIN',
        description: 'Microcontroller power',
        wire: '24AWG',
        current: '500mA'
      },
      {
        from: 'ESP32 GPIO4',
        to: 'DS18B20 DATA',
        description: 'Temperature data',
        wire: '28AWG',
        pullup: '4.7kΩ'
      },
      {
        from: 'ESP32 ADC1',
        to: 'pH Sensor OUTPUT',
        description: 'pH analog reading',
        wire: '28AWG',
        voltage: '0-3.3V'
      },
      {
        from: 'ESP32 GPIO16',
        to: 'GPS RX',
        description: 'GPS data receive',
        wire: '28AWG'
      },
      {
        from: 'ESP32 GPIO17',
        to: 'GPS TX',
        description: 'GPS data transmit',
        wire: '28AWG'
      },
      {
        from: 'ESP32 SPI',
        to: 'LoRa Module SPI',
        description: 'LoRa communication',
        wires: ['MISO', 'MOSI', 'SCK', 'CS'],
        length: '< 10cm'
      }
    ];
  }

  generateBOM() {
    return {
      microcontroller: [
        { part: 'ESP32-WROOM-32', quantity: 1, supplier: 'Espressif', cost: 5.00 }
      ],
      sensors: [
        { part: 'DS18B20 Temperature Sensor', quantity: 1, supplier: 'Maxim Integrated', cost: 3.50 },
        { part: 'Analog pH Sensor Kit', quantity: 1, supplier: 'DFRobot', cost: 15.00 },
        { part: 'NEO-6M GPS Module', quantity: 1, supplier: 'u-blox', cost: 12.00 }
      ],
      communication: [
        { part: 'SX1276 LoRa Module', quantity: 1, supplier: 'Semtech', cost: 8.00 },
        { part: 'SIM800L GSM Module', quantity: 1, supplier: 'SIMCom', cost: 10.00 }
      ],
      power: [
        { part: '4000mAh LiPo Battery', quantity: 1, supplier: 'Various', cost: 12.00 },
        { part: '5W Solar Panel', quantity: 1, supplier: 'Various', cost: 8.00 },
        { part: 'TP4056 Charging Module', quantity: 1, supplier: 'Various', cost: 1.50 },
        { part: 'AMS1117 3.3V Regulator', quantity: 1, supplier: 'Advanced Monolithic', cost: 0.50 }
      ],
      passive: [
        { part: '4.7kΩ Resistor (0805)', quantity: 10, supplier: 'Various', cost: 0.10 },
        { part: '10μF Capacitor (0805)', quantity: 10, supplier: 'Various', cost: 0.15 },
        { part: '100nF Capacitor (0805)', quantity: 10, supplier: 'Various', cost: 0.08 }
      ],
      pcb: [
        { part: '2-layer PCB 80x60mm', quantity: 1, supplier: 'JLCPCB', cost: 2.00 }
      ],
      enclosure: [
        { part: 'Waterproof IP67 Box', quantity: 1, supplier: 'Various', cost: 5.00 }
      ]
    };
  }

  getPowerConsumption() {
    return {
      sleep: {
        current: '100μA',
        duration: '23 hours',
        energy: '2.3mAh'
      },
      active: {
        current: '80mA',
        duration: '1 hour',
        energy: '80mAh'
      },
      transmission: {
        current: '120mA',
        duration: '10 minutes',
        energy: '20mAh'
      },
      dailyTotal: {
        energy: '102.3mAh',
        batteryLife: '39 days'
      },
      withSolar: {
        dailyHarvest: '250mAh',
        batteryLife: 'Infinite'
      }
    };
  }

  getPinMapping() {
    const mapping = {};
    
    // Microcontroller pins
    Object.entries(this.components.microcontroller.pins).forEach(([interface, pins]) => {
      if (Array.isArray(pins)) {
        pins.forEach(pin => {
          mapping[pin] = { interface, purpose: 'General I/O' };
        });
      } else {
        Object.entries(pins).forEach(([purpose, pin]) => {
          mapping[pin] = { interface, purpose };
        });
      }
    });

    // Sensor pins
    Object.entries(this.components.sensors).forEach(([sensor, config]) => {
      if (config.pin) {
        mapping[config.pin] = { 
          interface: config.interface, 
          purpose: `${sensor} sensor`,
          device: config.type
        };
      }
    });

    // Communication pins
    Object.entries(this.components.communication).forEach(([module, config]) => {
      Object.entries(config.pins).forEach(([signal, pin]) => {
        mapping[pin] = {
          interface: config.interface,
          purpose: `${module} ${signal}`,
          device: config.type
        };
      });
    });

    return mapping;
  }

  generateSchematicDiagram() {
    return {
      title: 'SmartFishing IoT Sensor Node Schematic',
      version: '1.0',
      date: new Date().toISOString().split('T')[0],
      sections: {
        power: {
          components: ['Battery', 'Solar Panel', 'Charging Circuit', 'Voltage Regulators'],
          connections: this.connections.filter(conn => 
            conn.from.includes('Battery') || conn.from.includes('Solar') || conn.to.includes('Power')
          )
        },
        processing: {
          components: ['ESP32', 'RTC', 'EEPROM'],
          connections: this.connections.filter(conn => 
            conn.from.includes('ESP32') || conn.to.includes('ESP32')
          )
        },
        sensing: {
          components: ['Temperature Sensor', 'pH Sensor', 'GPS'],
          connections: this.connections.filter(conn => 
            conn.description.includes('Temperature') || 
            conn.description.includes('pH') || 
            conn.description.includes('GPS')
          )
        },
        communication: {
          components: ['LoRa Module', 'GSM Module'],
          connections: this.connections.filter(conn => 
            conn.description.includes('LoRa') || conn.description.includes('GSM')
          )
        }
      },
      notes: [
        'All resistors are 4.7kΩ unless specified',
        'Use decoupling capacitors near each IC',
        'Keep analog sensor wires short and shielded',
        'GPS antenna should have clear sky view',
        'Solar panel should face south (northern hemisphere)'
      ]
    };
  }

  getCostBreakdown() {
    const bom = this.billOfMaterials;
    let totalCost = 0;
    const categories = {};

    Object.entries(bom).forEach(([category, items]) => {
      categories[category] = {
        items: items.length,
        cost: items.reduce((sum, item) => sum + (item.cost * item.quantity), 0)
      };
      totalCost += categories[category].cost;
    });

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      categories: categories,
      unitCost: totalCost,
      manufacturing: {
        pcbAssembly: 5.00,
        testing: 2.00,
        packaging: 1.00
      },
      totalWithManufacturing: totalCost + 8.00
    };
  }

  validateDesign() {
    const issues = [];
    const warnings = [];

    // Check for pin conflicts
    const pinUsage = {};
    const pinMapping = this.getPinMapping();

    Object.entries(pinMapping).forEach(([pin, usage]) => {
      if (!pinUsage[pin]) {
        pinUsage[pin] = [];
      }
      pinUsage[pin].push(usage);
    });

    Object.entries(pinUsage).forEach(([pin, usages]) => {
      if (usages.length > 1) {
        issues.push(`Pin conflict on GPIO${pin}: ${usages.map(u => u.purpose).join(', ')}`);
      }
    });

    // Check power requirements
    const power = this.getPowerConsumption();
    if (power.dailyTotal.energy > 4000) {
      warnings.push('Daily energy consumption exceeds battery capacity');
    }

    // Check interface compatibility
    if (this.components.sensors.temperature.interface === 'OneWire' && 
        !this.components.microcontroller.pins.digital.includes(4)) {
      issues.push('Temperature sensor requires OneWire support on digital pin');
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      pinConflicts: Object.entries(pinUsage).filter(([pin, usages]) => usages.length > 1).length,
      estimatedBatteryLife: power.dailyTotal.batteryLife
    };
  }

  exportSchematic() {
    return {
      schematic: this.generateSchematicDiagram(),
      bom: this.billOfMaterials,
      pinMapping: this.getPinMapping(),
      powerAnalysis: this.getPowerConsumption(),
      costAnalysis: this.getCostBreakdown(),
      validation: this.validateDesign(),
      metadata: {
        designedFor: 'SmartFishing IoT Sensor Node',
        version: '1.0',
        designDate: new Date().toISOString(),
        designer: 'ACEathon Team'
      }
    };
  }
}

module.exports = SensorNodeSchematic;
