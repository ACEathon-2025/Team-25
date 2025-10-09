const request = require('supertest');
const express = require('express');
const sensorRoutes = require('../../routes/sensor-routes');
const alertRoutes = require('../../routes/alert-routes');

const app = express();
app.use(express.json());
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);

describe('Performance Tests', () => {
  describe('Sensor Data Endpoint Performance', () => {
    test('should handle multiple concurrent sensor data submissions', async () => {
      const requests = [];
      const numRequests = 10;

      // Create multiple concurrent requests
      for (let i = 0; i < numRequests; i++) {
        const sensorData = {
          temp: (20 + Math.random() * 10).toFixed(1),
          ph: (6.5 + Math.random() * 2).toFixed(1),
          oxygen: (5 + Math.random() * 5).toFixed(1),
          lat: (19.0760 + (Math.random() - 0.5) * 0.1).toFixed(6),
          lng: (72.8777 + (Math.random() - 0.5) * 0.1).toFixed(6),
          deviceId: `sensor_${i}`
        };

        requests.push(
          request(app)
            .post('/api/sensors/data')
            .send(sensorData)
            .expect(201)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Should complete within reasonable time (e.g., 2 seconds for 10 requests)
      expect(totalTime).toBeLessThan(2000);
      
      console.log(`Processed ${numRequests} sensor data submissions in ${totalTime}ms`);
    });
  });

  describe('Alert System Performance', () => {
    test('should handle emergency alert creation under load', async () => {
      const requests = [];
      const numAlerts = 5;

      for (let i = 0; i < numAlerts; i++) {
        const alertData = {
          userId: `user_${i}`,
          location: {
            lat: 19.0760 + (Math.random() - 0.5) * 0.1,
            lng: 72.8777 + (Math.random() - 0.5) * 0.1
          },
          alertType: 'SOS_EMERGENCY',
          message: `Emergency test ${i}`
        };

        requests.push(
          request(app)
            .post('/api/alerts/emergency')
            .send(alertData)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // Check all alerts were created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      console.log(`Created ${numAlerts} emergency alerts in ${totalTime}ms`);
      
      // Alert creation should be fast even under load
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Data Retrieval Performance', () => {
    beforeEach(async () => {
      // Pre-populate with test data
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post('/api/sensors/data')
          .send({
            temp: '25.5',
            ph: '7.2',
            oxygen: '8.5',
            lat: '19.0760',
            lng: '72.8777',
            deviceId: `load_test_sensor`
          });
      }
    });

    test('should retrieve large datasets efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/sensors/data?limit=50')
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(50);
      
      console.log(`Retrieved ${response.body.data.length} records in ${queryTime}ms`);
      
      // Data retrieval should be fast
      expect(queryTime).toBeLessThan(500);
    });

    test('should handle filtered queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/sensors/data?deviceId=load_test_sensor&limit=10')
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(item => item.deviceId === 'load_test_sensor')).toBe(true);
      
      console.log(`Filtered query completed in ${queryTime}ms`);
      expect(queryTime).toBeLessThan(300);
    });
  });
});
