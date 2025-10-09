const { helpers, validators, geolocation } = require('../../utils');
const { AppError } = require('../../utils/error-handler');

describe('Utility Helpers', () => {
  describe('formatSensorData', () => {
    test('should format raw sensor data correctly', () => {
      const rawData = {
        temp: '25.5',
        ph: '7.2',
        oxygen: '8.5',
        lat: '19.0760',
        lng: '72.8777',
        deviceId: 'sensor_001'
      };

      const formatted = helpers.formatSensorData(rawData);

      expect(formatted.temperature).toBe(25.5);
      expect(formatted.pH).toBe(7.2);
      expect(formatted.oxygen).toBe(8.5);
      expect(formatted.location.lat).toBe(19.0760);
      expect(formatted.deviceId).toBe('sensor_001');
      expect(formatted.timestamp).toBeDefined();
    });

    test('should handle missing values with defaults', () => {
      const rawData = {
        lat: '19.0760',
        lng: '72.8777'
      };

      const formatted = helpers.formatSensorData(rawData);

      expect(formatted.temperature).toBe(0);
      expect(formatted.pH).toBe(7.0);
      expect(formatted.oxygen).toBe(0);
      expect(formatted.deviceId).toBe('unknown');
    });
  });

  describe('calculateDistance', () => {
    test('should calculate distance between two points correctly', () => {
      // Mumbai to Pune approximate distance
      const distance = helpers.calculateDistance(19.0760, 72.8777, 18.5204, 73.8567);
      expect(distance).toBeCloseTo(120, -1); // ~120 km with tolerance
    });

    test('should return 0 for same coordinates', () => {
      const distance = helpers.calculateDistance(19.0760, 72.8777, 19.0760, 72.8777);
      expect(distance).toBe(0);
    });
  });

  describe('generateAlertId', () => {
    test('should generate unique alert IDs', () => {
      const id1 = helpers.generateAlertId();
      const id2 = helpers.generateAlertId();

      expect(id1).toMatch(/^ALT_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^ALT_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('isWithinSafeRange', () => {
    test('should return true for values within range', () => {
      expect(helpers.isWithinSafeRange(25, 20, 30)).toBe(true);
      expect(helpers.isWithinSafeRange(20, 20, 30)).toBe(true);
      expect(helpers.isWithinSafeRange(30, 20, 30)).toBe(true);
    });

    test('should return false for values outside range', () => {
      expect(helpers.isWithinSafeRange(15, 20, 30)).toBe(false);
      expect(helpers.isWithinSafeRange(35, 20, 30)).toBe(false);
    });
  });
});

describe('Utility Validators', () => {
  describe('validateSensorData', () => {
    test('should validate correct sensor data', () => {
      const validData = {
        temperature: 25.5,
        pH: 7.2,
        oxygen: 8.5,
        location: { lat: 19.0760, lng: 72.8777 }
      };

      const result = validators.validateSensorData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid sensor data', () => {
      const invalidData = {
        temperature: 100, // Too high
        pH: 15, // Out of range
        oxygen: -5, // Negative
        location: { lat: 91, lng: 181 } // Invalid coordinates
      };

      const result = validators.validateSensorData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });
  });

  describe('validatePhoneNumber', () => {
    test('should validate Indian phone numbers', () => {
      expect(validators.validatePhoneNumber('9876543210')).toBe(true);
      expect(validators.validatePhoneNumber('+919876543210')).toBe(true);
      expect(validators.validatePhoneNumber('1234567890')).toBe(false); // Invalid prefix
      expect(validators.validatePhoneNumber('987654321')).toBe(false); // Too short
    });
  });

  describe('validateCoordinates', () => {
    test('should validate geographic coordinates', () => {
      expect(validators.validateCoordinates(19.0760, 72.8777)).toBe(true);
      expect(validators.validateCoordinates(-90, -180)).toBe(true);
      expect(validators.validateCoordinates(91, 181)).toBe(false); // Out of range
      expect(validators.validateCoordinates('invalid', 'data')).toBe(false);
    });
  });
});

describe('Geolocation Utilities', () => {
  describe('calculateSafeZone', () => {
    test('should calculate safe zone boundaries', () => {
      const safeZone = geolocation.calculateSafeZone(19.0760, 72.8777, 5);

      expect(safeZone.center.lat).toBe(19.0760);
      expect(safeZone.center.lng).toBe(72.8777);
      expect(safeZone.radius).toBe(5);
      expect(safeZone.north).toBeGreaterThan(19.0760);
      expect(safeZone.south).toBeLessThan(19.0760);
    });
  });

  describe('isInSafeZone', () => {
    test('should check if point is within safe zone', () => {
      const safeZone = geolocation.calculateSafeZone(19.0760, 72.8777, 5);
      
      // Point inside safe zone
      expect(geolocation.isInSafeZone(19.0760, 72.8777, safeZone)).toBe(true);
      
      // Point outside safe zone
      expect(geolocation.isInSafeZone(19.2000, 73.0000, safeZone)).toBe(false);
    });
  });

  describe('findNearestSafeZone', () => {
    test('should find nearest safe zone', () => {
      const safeZones = [
        geolocation.calculateSafeZone(19.0760, 72.8777, 5),
        geolocation.calculateSafeZone(18.5204, 73.8567, 5)
      ];

      const result = geolocation.findNearestSafeZone(19.0000, 72.9000, safeZones);
      
      expect(result.zone.center.lat).toBe(19.0760);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.bearing).toBeDefined();
    });
  });
});
