const request = require('supertest');
const express = require('express');
const alertRoutes = require('../../routes/alert-routes');

const app = express();
app.use(express.json());
app.use('/api/alerts', alertRoutes);

describe('Alert Routes Integration', () => {
  describe('POST /api/alerts/emergency', () => {
    test('should create emergency alert', async () => {
      const emergencyData = {
        userId: 'user_001',
        location: { lat: 19.0760, lng: 72.8777 },
        alertType: 'SOS_EMERGENCY',
        message: 'Boat engine failure, need assistance!'
      };

      const response = await request(app)
        .post('/api/alerts/emergency')
        .send(emergencyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.alert.type).toBe('SOS_EMERGENCY');
      expect(response.body.alert.priority).toBe('critical');
      expect(response.body.alert.status).toBe('active');
    });

    test('should reject incomplete emergency data', async () => {
      const incompleteData = {
        userId: 'user_001'
        // Missing location and alertType
      };

      const response = await request(app)
        .post('/api/alerts/emergency')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/alerts/weather', () => {
    test('should create weather alert', async () => {
      const weatherAlert = {
        location: { lat: 19.0760, lng: 72.8777 },
        weatherType: 'storm',
        severity: 'high',
        message: 'Cyclone warning in your area'
      };

      const response = await request(app)
        .post('/api/alerts/weather')
        .send(weatherAlert)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.alert.type).toBe('WEATHER_ALERT');
      expect(response.body.alert.weatherType).toBe('storm');
    });
  });

  describe('GET /api/alerts', () => {
    beforeEach(async () => {
      // Create test alerts
      await request(app)
        .post('/api/alerts/emergency')
        .send({
          userId: 'user_001',
          location: { lat: 19.0760, lng: 72.8777 },
          alertType: 'SOS_EMERGENCY'
        });
    });

    test('should retrieve all alerts', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.alerts).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('should filter alerts by type', async () => {
      const response = await request(app)
        .get('/api/alerts?type=SOS_EMERGENCY')
        .expect(200);

      expect(response.body.alerts.every(alert => alert.type === 'SOS_EMERGENCY')).toBe(true);
    });

    test('should filter alerts by status', async () => {
      const response = await request(app)
        .get('/api/alerts?status=active')
        .expect(200);

      expect(response.body.alerts.every(alert => alert.status === 'active')).toBe(true);
    });
  });

  describe('PUT /api/alerts/:alertId/status', () => {
    let alertId;

    beforeEach(async () => {
      // Create an alert first
      const response = await request(app)
        .post('/api/alerts/emergency')
        .send({
          userId: 'user_001',
          location: { lat: 19.0760, lng: 72.8777 },
          alertType: 'SOS_EMERGENCY'
        });

      alertId = response.body.alert.id;
    });

    test('should update alert status', async () => {
      const response = await request(app)
        .put(`/api/alerts/${alertId}/status`)
        .send({ status: 'resolved' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.alert.status).toBe('resolved');
      expect(response.body.alert.resolvedAt).toBeDefined();
    });

    test('should reject invalid status', async () => {
      const response = await request(app)
        .put(`/api/alerts/${alertId}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .put('/api/alerts/nonexistent_id/status')
        .send({ status: 'resolved' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/alerts/active', () => {
    test('should retrieve only active alerts', async () => {
      const response = await request(app)
        .get('/api/alerts/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.alerts.every(alert => alert.status === 'active')).toBe(true);
    });
  });
});
