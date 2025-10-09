const { helpers } = require('../../utils');

class DeviceMonitor {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.components = new Map();
    this.healthMetrics = new Map();
    this.alertThresholds = {
      cpuUsage: 80,
      memoryUsage: 85,
      temperature: 70,
      batteryLevel: 15,
      storageUsage: 90
    };
    this.monitoringInterval = null;
    this.healthStatus = 'unknown';
  }

  registerComponent(componentName, componentInstance) {
    this.components.set(componentName, componentInstance);
    console.log(`Registered component for monitoring: ${componentName}`);
  }

  startMonitoring(interval = 60000) { // 1 minute default
    console.log(`Starting device monitoring for ${this.deviceId}...`);
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkHealth();
      this.generateAlerts();
    }, interval);

    // Initial collection
    this.collectMetrics();
    
    console.log(`Device monitoring started with ${interval}ms interval`);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Device monitoring stopped');
    }
  }

  async collectMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      system: await this.getSystemMetrics(),
      components: {},
      network: await this.getNetworkMetrics(),
      power: await this.getPowerMetrics()
    };

    // Collect component-specific metrics
    for (const [name, component] of this.components) {
      try {
        if (typeof component.getStatus === 'function') {
          metrics.components[name] = await component.getStatus();
        }
      } catch (error) {
        console.error(`Failed to get metrics for component ${name}:`, error);
        metrics.components[name] = { error: error.message };
      }
    }

    this.healthMetrics.set(metrics.timestamp, metrics);
    
    // Keep only last 1000 metrics
    if (this.healthMetrics.size > 1000) {
      const oldestKey = Array.from(this.healthMetrics.keys())[0];
      this.healthMetrics.delete(oldestKey);
    }

    return metrics;
  }

  async getSystemMetrics() {
    // Simulate system metrics
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      storageUsage: Math.random() * 100,
      uptime: Math.floor(Math.random() * 86400), // Up to 24 hours
      temperature: 30 + Math.random() * 40, // 30-70°C
      loadAverage: [Math.random(), Math.random(), Math.random()]
    };
  }

  async getNetworkMetrics() {
    // Simulate network metrics
    return {
      connectivity: Math.random() > 0.1, // 90% connected
      signalStrength: Math.random() * 100,
      latency: Math.random() * 1000, // 0-1000ms
      packetsSent: Math.floor(Math.random() * 1000),
      packetsReceived: Math.floor(Math.random() * 1000)
    };
  }

  async getPowerMetrics() {
    // Simulate power metrics
    return {
      batteryLevel: Math.random() * 100,
      isCharging: Math.random() > 0.7, // 30% charging
      voltage: 3.7 + Math.random() * 0.6, // 3.7-4.3V
      currentDraw: 100 + Math.random() * 500 // 100-600mA
    };
  }

  checkHealth() {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) return;

    const issues = [];
    let overallHealth = 'healthy';

    // Check system health
    if (latestMetrics.system.cpuUsage > this.alertThresholds.cpuUsage) {
      issues.push({
        component: 'system',
        metric: 'cpuUsage',
        value: latestMetrics.system.cpuUsage,
        threshold: this.alertThresholds.cpuUsage,
        severity: 'warning'
      });
      overallHealth = 'degraded';
    }

    if (latestMetrics.system.memoryUsage > this.alertThresholds.memoryUsage) {
      issues.push({
        component: 'system',
        metric: 'memoryUsage',
        value: latestMetrics.system.memoryUsage,
        threshold: this.alertThresholds.memoryUsage,
        severity: 'warning'
      });
      overallHealth = 'degraded';
    }

    if (latestMetrics.system.temperature > this.alertThresholds.temperature) {
      issues.push({
        component: 'system',
        metric: 'temperature',
        value: latestMetrics.system.temperature,
        threshold: this.alertThresholds.temperature,
        severity: 'critical'
      });
      overallHealth = 'critical';
    }

    // Check power health
    if (latestMetrics.power.batteryLevel < this.alertThresholds.batteryLevel) {
      issues.push({
        component: 'power',
        metric: 'batteryLevel',
        value: latestMetrics.power.batteryLevel,
        threshold: this.alertThresholds.batteryLevel,
        severity: 'critical'
      });
      overallHealth = 'critical';
    }

    // Check component health
    for (const [name, component] of this.components) {
      const componentStatus = latestMetrics.components[name];
      if (componentStatus && componentStatus.health) {
        if (componentStatus.health === 'error') {
          issues.push({
            component: name,
            metric: 'health',
            value: componentStatus.health,
            threshold: 'active',
            severity: 'critical'
          });
          overallHealth = 'critical';
        } else if (componentStatus.health === 'degraded') {
          issues.push({
            component: name,
            metric: 'health',
            value: componentStatus.health,
            threshold: 'active',
            severity: 'warning'
          });
          if (overallHealth !== 'critical') overallHealth = 'degraded';
        }
      }
    }

    this.healthStatus = overallHealth;
    
    return {
      status: overallHealth,
      issues: issues,
      timestamp: latestMetrics.timestamp
    };
  }

  generateAlerts() {
    const healthCheck = this.checkHealth();
    if (!healthCheck) return;

    const criticalIssues = healthCheck.issues.filter(issue => issue.severity === 'critical');
    const warningIssues = healthCheck.issues.filter(issue => issue.severity === 'warning');

    // Generate alerts for critical issues
    criticalIssues.forEach(issue => {
      const alert = {
        id: helpers.generateAlertId(),
        type: 'DEVICE_HEALTH_CRITICAL',
        component: issue.component,
        metric: issue.metric,
        value: issue.value,
        threshold: issue.threshold,
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId,
        message: `Critical health issue: ${issue.component} ${issue.metric} at ${issue.value}`
      };

      this.emitAlert(alert);
    });

    // Log warnings
    if (warningIssues.length > 0) {
      console.warn('Device health warnings:', warningIssues);
    }
  }

  emitAlert(alert) {
    // In real implementation, this would send to alert system
    console.log('🚨 DEVICE HEALTH ALERT:', alert);
    
    // Could integrate with your existing alert system
    // this.alertSystem.sendAlert(alert);
  }

  getLatestMetrics() {
    const keys = Array.from(this.healthMetrics.keys());
    if (keys.length === 0) return null;
    
    const latestKey = keys[keys.length - 1];
    return this.healthMetrics.get(latestKey);
  }

  getHealthHistory(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const history = [];

    for (const [timestamp, metrics] of this.healthMetrics) {
      if (new Date(timestamp) >= cutoffTime) {
        history.push({
          timestamp: timestamp,
          health: this.calculateHealthScore(metrics)
        });
      }
    }

    return history;
  }

  calculateHealthScore(metrics) {
    let score = 100;

    // Deduct points for issues
    if (metrics.system.cpuUsage > 80) score -= 20;
    if (metrics.system.memoryUsage > 85) score -= 15;
    if (metrics.system.temperature > 70) score -= 30;
    if (metrics.power.batteryLevel < 20) score -= 25;
    if (!metrics.network.connectivity) score -= 10;

    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }

  getDiagnosticsReport() {
    const latestMetrics = this.getLatestMetrics();
    const healthCheck = this.checkHealth();

    return {
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
      overallHealth: this.healthStatus,
      healthScore: latestMetrics ? this.calculateHealthScore(latestMetrics) : 0,
      currentIssues: healthCheck ? healthCheck.issues : [],
      metricsCollected: this.healthMetrics.size,
      componentsMonitored: Array.from(this.components.keys()),
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const latestMetrics = this.getLatestMetrics();

    if (!latestMetrics) return recommendations;

    if (latestMetrics.power.batteryLevel < 30) {
      recommendations.push('Battery level low - connect to power source');
    }

    if (latestMetrics.system.cpuUsage > 70) {
      recommendations.push('High CPU usage - consider optimizing processes');
    }

    if (latestMetrics.system.memoryUsage > 80) {
      recommendations.push('High memory usage - consider freeing up resources');
    }

    if (latestMetrics.system.temperature > 60) {
      recommendations.push('Device temperature high - ensure proper ventilation');
    }

    return recommendations;
  }

  setAlertThreshold(metric, threshold) {
    if (this.alertThresholds.hasOwnProperty(metric)) {
      this.alertThresholds[metric] = threshold;
      console.log(`Alert threshold for ${metric} set to ${threshold}`);
    } else {
      throw new Error(`Unknown metric: ${metric}`);
    }
  }

  getStatus() {
    return {
      deviceId: this.deviceId,
      monitoring: !!this.monitoringInterval,
      healthStatus: this.healthStatus,
      metricsCount: this.healthMetrics.size,
      componentsCount: this.components.size,
      lastUpdate: this.getLatestMetrics()?.timestamp
    };
  }
}

module.exports = DeviceMonitor;
