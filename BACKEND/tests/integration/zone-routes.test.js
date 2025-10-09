const request = require('supertest');
const express = require('express');
const zoneRoutes = require('../../routes/zone-routes');

const app = express();
app.use(express.json());
app.use('/api/zones', zoneRoutes);

describe('Zone Routes Integration', () => {
  describe('GET /api/zones/predict', () => {
    test('should predict fishing zones with valid coordinates', async () => {
      const response = await request(app)
        .get('/api/zones/predict?lat=19.0760&lng=72.8777&radius=50')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.userLocation.lat).toBe(19.0760);
      expect(response.body.userLocation.lng).toBe(72.8777);
      expect(response.body.zones).toBeInstanceOf(Array);
      expect(response.body.recommendations).toBeDefined();
    });

    test('should reject request without coordinates', async () => {
      const response = await request(app)
        .get('/api/zones/predict')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/zones/predict?lat=91&lng=181')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/zones/safe', () => {
    test('should retrieve safe fishing zones', async () => {
      const response = await request(app)
        .get('/api/zones/safe')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.zones).toBeInstanceOf(Array);
      expect(response.body.zones[0].recommended).toBe(true);
    });

    test('should calculate distances when user location provided', async () => {
      const response = await request(app)
        .get('/api/zones/safe?lat=19.0760&lng=72.8777')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.zones[0].distanceFromUser).toBeDefined();
      expect(response.body.zones[0].bearing).toBeDefined();
    });
  });

  describe('POST /api/zones/report', () => {
    test('should accept fishing zone report', async () => {
      const reportData = {
        type: 'good_fishing',
        location: { lat: 19.0760, lng: 72.8777 },
        description: 'Great fishing spot with high catch',
        reporterId: 'user_001'
      };

      const response = await request(app)
        .post('/api/zones/report')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.zoneAdded).toBe(true);
      expect(response.body.report.status).toBe('added_to_zones');
    });

    test('should accept hazard reports', async () => {
      const hazardReport = {
        type: 'hazard',
        location: { lat: 19.0760, lng: 72.8777 },
        description: 'Floating debris in area',
        reporterId: 'user_001'
      };

      const response = await request(app)
        .post('/api/zones/report')
        .send(hazardReport)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.zoneAdded).toBe(false);
    });

    test('should reject reports without required fields', async () => {
      const incompleteReport = {
        description: 'Missing type and location'
      };

      const response = await request(app)
        .post('/api/zones/report')
        .send(incompleteReport)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/zones/weather', () => {
    test('should return weather data for location', async () => {
      const response = await request(app)
        .get('/api/zones/weather?lat=19.0760&lng=72.8777')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.weather.location.lat).toBe(19.0760);
      expect(response.body.weather.temperature).toBeDefined();
      expect(response.body.weather.safetyLevel).toBeDefined();
      expect(response.body.weather.recommendations).toBeInstanceOf(Array);
    });

    test('should reject request without coordinates', async () => {
      const response = await request(app)
        .get('/api/zones/weather')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
