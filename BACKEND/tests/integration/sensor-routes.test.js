const request = require('supertest');
const express = require('express');
const sensorRoutes = require('../../routes/sensor-routes');

const app = express();
app.use(express.json());
app.use('/api/sensors', sensorRoutes);

describe('Sensor Routes Integration', () => {
  describe('POST /api/sensors/data', () => {
    test('should accept valid sensor data', async () => {
      const sensorData = {
        temp: '25.5',
        ph: '7.2',
        oxygen: '8.5',
        lat: '19.0760',
        lng: '72.8777',
        deviceId: 'sensor_001'
      };

      const response = await request(app)
        .post('/api/sensors/data')
        .send(sensorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.temperature).toBe(25.5);
      expect(response.body.data.deviceId).toBe('sensor_001');
    });

    test('should reject invalid sensor data', async () => {
      const invalidData = {
        temp: '100', // Too high
        ph: '15', // Out of range
        lat: '19.0760',
        lng: '72.8777'
      };

      const response = await request(app)
        .post('/api/sensors/data')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should detect anomalies in sensor data', async () => {
      const anomalousData = {
        temp: '40', // High temperature
        ph: '4.5', // Acidic pH
        oxygen: '2', // Low oxygen
        lat: '19.0760',
        lng: '72.8777',
        deviceId: 'sensor_001'
      };

      const response = await request(app)
        .post('/api/sensors/data')
        .send(anomalousData)
        .expect(201);

      expect(response.body.anomalies).toHaveLength(3);
      expect(response.body.anomalies[0].type).toBe('HIGH_TEMPERATURE');
    });
  });

  describe('GET /api/sensors/data', () => {
    beforeEach(async () => {
      // Add some test data
      await request(app)
        .post('/api/sensors/data')
        .send({
          temp: '25.5',
          ph: '7.2',
          oxygen: '8.5',
          lat: '19.0760',
          lng: '72.8777',
          deviceId: 'sensor_001'
        });
    });

    test('should retrieve sensor data', async () => {
      const response = await request(app)
        .get('/api/sensors/data')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('should filter data by device ID', async () => {
      const response = await request(app)
        .get('/api/sensors/data?deviceId=sensor_001')
        .expect(200);

      expect(response.body.data.every(item => item.deviceId === 'sensor_001')).toBe(true);
    });

    test('should limit results', async () => {
      const response = await request(app)
        .get('/api/sensors/data?limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/sensors/data/latest', () => {
    test('should get latest sensor reading', async () => {
      const response = await request(app)
        .get('/api/sensors/data/latest')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should return 404 when no data exists', async () => {
      // Clear data for this test
      const emptyApp = express();
      emptyApp.use(express.json());
      emptyApp.use('/api/sensors', sensorRoutes);

      const response = await request(emptyApp)
        .get('/api/sensors/data/latest')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sensors/devices', () => {
    test('should list all registered devices', async () => {
      const response = await request(app)
        .get('/api/sensors/devices')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.devices).toBeInstanceOf(Array);
      expect(response.body.devices[0].deviceId).toBe('sensor_001');
      expect(response.body.devices[0].currentStatus).toBe('online');
    });
  });
});
