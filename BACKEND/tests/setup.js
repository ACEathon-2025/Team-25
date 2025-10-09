// Test setup file
require('dotenv').config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(10000);

// Global test hooks
beforeAll(() => {
  console.log('Starting test suite...');
});

afterAll(() => {
  console.log('Test suite completed.');
});

// Global test utilities
global.testUser = {
  id: 'test_user_001',
  name: 'Test Fisherman',
  phone: '+919876543210',
  location: { lat: 19.0760, lng: 72.8777 }
};

global.testSensorData = {
  temp: '25.5',
  ph: '7.2',
  oxygen: '8.5',
  lat: '19.0760',
  lng: '72.8777',
  deviceId: 'test_sensor_001'
};

global.testEmergencyAlert = {
  userId: 'test_user_001',
  location: { lat: 19.0760, lng: 72.8777 },
  alertType: 'SOS_EMERGENCY',
  message: 'Test emergency alert'
};
