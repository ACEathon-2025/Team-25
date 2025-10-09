class AnomalyDetector {
  constructor() {
    this.models = new Map();
    this.historicalData = new Map();
    this.anomalyThreshold = 0.8;
    this.detectionHistory = [];
    this.config = {
      windowSize: 50,
      sensitivity: 0.7,
      methods: ['statistical', 'machine_learning', 'rule_based']
    };
  }

  // Initialize anomaly detection for a specific metric
  initializeMetric(metricName, config = {}) {
    const metricConfig = {
      method: config.method || 'statistical',
      windowSize: config.windowSize || this.config.windowSize,
      sensitivity: config.sensitivity || this.config.sensitivity,
      rules: config.rules || [],
      ...config
    };

    this.models.set(metricName, {
      config: metricConfig,
      data: [],
      stats: {
        mean: 0,
        stdDev: 0,
        min: Infinity,
        max: -Infinity
      }
    });

    this.historicalData.set(metricName, []);

    console.log(`Anomaly detection initialized for metric: ${metricName}`);
  }

  // Add data point and check for anomalies
  analyzeData(metricName, value, timestamp = new Date().toISOString()) {
    if (!this.models.has(metricName)) {
      throw new Error(`Metric not initialized: ${metricName}`);
    }

    const model = this.models.get(metricName);
    const dataPoint = { value, timestamp };

    // Add to historical data
    this.addHistoricalData(metricName, dataPoint);

    // Update statistics
    this.updateStatistics(metricName);

    // Detect anomalies based on configured method
    const anomalies = this.detectAnomalies(metricName, value, timestamp);

    // Record detection result
    const result = {
      metric: metricName,
      value: value,
      timestamp: timestamp,
      isAnomaly: anomalies.length > 0,
      anomalies: anomalies,
      confidence: this.calculateConfidence(metricName, value)
    };

    this.detectionHistory.push(result);

    // Keep only recent history
    if (this.detectionHistory.length > 1000) {
      this.detectionHistory = this.detectionHistory.slice(-1000);
    }

    return result;
  }

  // Add data to historical storage
  addHistoricalData(metricName, dataPoint) {
    if (!this.historicalData.has(metricName)) {
      this.historicalData.set(metricName, []);
    }

    const data = this.historicalData.get(metricName);
    data.push(dataPoint);

    // Keep only windowSize most recent points
    const model = this.models.get(metricName);
    if (data.length > model.config.windowSize) {
      data.shift();
    }
  }

  // Update statistical measures for a metric
  updateStatistics(metricName) {
    const data = this.historicalData.get(metricName);
    if (data.length === 0) return;

    const values = data.map(d => d.value);
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );
    const min = Math.min(...values);
    const max = Math.max(...values);

    const model = this.models.get(metricName);
    model.stats = { mean, stdDev, min, max };
  }

  // Detect anomalies using multiple methods
  detectAnomalies(metricName, value, timestamp) {
    const model = this.models.get(metricName);
    const anomalies = [];

    // Statistical anomaly detection (Z-score)
    if (model.config.method === 'statistical' || model.config.methods?.includes('statistical')) {
      const statisticalAnomaly = this.detectStatisticalAnomaly(metricName, value);
      if (statisticalAnomaly) {
        anomalies.push({
          method: 'statistical',
          type: statisticalAnomaly.type,
          severity: statisticalAnomaly.severity,
          zScore: statisticalAnomaly.zScore
        });
      }
    }

    // Rule-based anomaly detection
    if (model.config.rules && model.config.rules.length > 0) {
      const ruleAnomalies = this.detectRuleBasedAnomalies(metricName, value, model.config.rules);
      anomalies.push(...ruleAnomalies);
    }

    // Machine learning based detection (simplified)
    if (model.config.method === 'machine_learning' || model.config.methods?.includes('machine_learning')) {
      const mlAnomaly = this.detectMLAnomaly(metricName, value);
      if (mlAnomaly) {
        anomalies.push({
          method: 'machine_learning',
          type: mlAnomaly.type,
          severity: mlAnomaly.severity,
          confidence: mlAnomaly.confidence
        });
      }
    }

    return anomalies;
  }

  // Statistical anomaly detection using Z-score
  detectStatisticalAnomaly(metricName, value) {
    const model = this.models.get(metricName);
    const { mean, stdDev } = model.stats;

    if (stdDev === 0) return null; // No variation in data

    const zScore = Math.abs((value - mean) / stdDev);
    const threshold = 3 - (model.config.sensitivity * 2); // Adjustable threshold

    if (zScore > threshold) {
      return {
        type: value > mean ? 'high_value' : 'low_value',
        severity: this.calculateSeverity(zScore),
        zScore: zScore
      };
    }

    return null;
  }

  // Rule-based anomaly detection
  detectRuleBasedAnomalies(metricName, value, rules) {
    const anomalies = [];

    for (const rule of rules) {
      let isViolated = false;
      let violationType = '';

      switch (rule.type) {
        case 'range':
          if (value < rule.min || value > rule.max) {
            isViolated = true;
            violationType = value < rule.min ? 'below_min' : 'above_max';
          }
          break;

        case 'rate_of_change':
          // This would require historical data analysis
          const rate = this.calculateRateOfChange(metricName);
          if (rate > rule.maxRate) {
            isViolated = true;
            violationType = 'high_rate_of_change';
          }
          break;

        case 'persistence':
          // Check if value has been constant for too long
          if (this.checkPersistence(metricName, value, rule.duration)) {
            isViolated = true;
            violationType = 'value_persistence';
          }
          break;
      }

      if (isViolated) {
        anomalies.push({
          method: 'rule_based',
          type: violationType,
          severity: rule.severity || 'medium',
          rule: rule.name
        });
      }
    }

    return anomalies;
  }

  // Simplified machine learning anomaly detection
  detectMLAnomaly(metricName, value) {
    // This is a simplified version - real implementation would use proper ML models
    const model = this.models.get(metricName);
    const data = this.historicalData.get(metricName);

    if (data.length < 10) return null; // Need sufficient data

    // Simple isolation forest-like approach (simplified)
    const anomalyScore = this.calculateIsolationScore(metricName, value);
    const threshold = 0.7 - (model.config.sensitivity * 0.3);

    if (anomalyScore > threshold) {
      return {
        type: 'isolation_anomaly',
        severity: this.calculateSeverity(anomalyScore),
        confidence: anomalyScore
      };
    }

    return null;
  }

  // Calculate isolation score (simplified)
  calculateIsolationScore(metricName, value) {
    const data = this.historicalData.get(metricName);
    const values = data.map(d => d.value);

    // Simple approach: measure how different the value is from neighbors
    const distances = values.map(v => Math.abs(v - value));
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const maxDistance = Math.max(...distances);

    return avgDistance / maxDistance; // Normalized score
  }

  // Calculate rate of change
  calculateRateOfChange(metricName) {
    const data = this.historicalData.get(metricName);
    if (data.length < 2) return 0;

    const recentValues = data.slice(-5); // Last 5 values
    const changes = [];

    for (let i = 1; i < recentValues.length; i++) {
      const change = Math.abs(recentValues[i].value - recentValues[i-1].value);
      changes.push(change);
    }

    return changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  }

  // Check value persistence
  checkPersistence(metricName, value, duration) {
    const data = this.historicalData.get(metricName);
    const window = data.slice(-duration);

    return window.every(point => Math.abs(point.value - value) < 0.001);
  }

  // Calculate anomaly confidence
  calculateConfidence(metricName, value) {
    const model = this.models.get(metricName);
    const { mean, stdDev } = model.stats;

    if (stdDev === 0) return 0;

    const zScore = Math.abs((value - mean) / stdDev);
    return Math.min(zScore / 3, 1); // Normalize to 0-1
  }

  // Calculate anomaly severity
  calculateSeverity(score) {
    if (score > 2.5) return 'critical';
    if (score > 2.0) return 'high';
    if (score > 1.5) return 'medium';
    return 'low';
  }

  // Batch analyze multiple data points
  analyzeBatch(metricName, dataPoints) {
    const results = [];

    for (const point of dataPoints) {
      const result = this.analyzeData(metricName, point.value, point.timestamp);
      results.push(result);
    }

    return results;
  }

  // Get anomaly statistics
  getAnomalyStats(timeRange = '24h') {
    const cutoffTime = new Date(Date.now() - this.parseTimeRange(timeRange));
    
    const recentAnomalies = this.detectionHistory.filter(
      record => new Date(record.timestamp) >= cutoffTime && record.isAnomaly
    );

    const stats = {
      totalAnomalies: recentAnomalies.length,
      byMetric: {},
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byMethod: {}
    };

    for (const anomaly of recentAnomalies) {
      // Count by metric
      stats.byMetric[anomaly.metric] = (stats.byMetric[anomaly.metric] || 0) + 1;

      // Count by severity
      for (const anomalyDetail of anomaly.anomalies) {
        stats.bySeverity[anomalyDetail.severity]++;
        stats.byMethod[anomalyDetail.method] = (stats.byMethod[anomalyDetail.method] || 0) + 1;
      }
    }

    return stats;
  }

  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default 24 hours
    }
  }

  // Train/retrain models (simplified)
  async trainModels() {
    console.log('Training anomaly detection models...');

    for (const [metricName, model] of this.models) {
      const data = this.historicalData.get(metricName);
      
      if (data.length >= model.config.windowSize) {
        // Update statistics
        this.updateStatistics(metricName);
        
        console.log(`Model trained for ${metricName} with ${data.length} data points`);
      } else {
        console.log(`Insufficient data for ${metricName}: ${data.length}/${model.config.windowSize}`);
      }
    }

    return {
      trained: Array.from(this.models.keys()),
      timestamp: new Date().toISOString()
    };
  }

  // Export model configurations
  exportModels() {
    const modelsConfig = {};

    for (const [metricName, model] of this.models) {
      modelsConfig[metricName] = {
        config: model.config,
        stats: model.stats,
        dataPoints: this.historicalData.get(metricName).length
      };
    }

    return {
      exportTime: new Date().toISOString(),
      totalModels: Object.keys(modelsConfig).length,
      models: modelsConfig,
      anomalyStats: this.getAnomalyStats('7d')
    };
  }

  // Import model configurations
  importModels(config) {
    if (!config.models) {
      throw new Error('Invalid model configuration format');
    }

    // Clear existing models
    this.models.clear();
    this.historicalData.clear();

    // Import new models
    for (const [metricName, modelConfig] of Object.entries(config.models)) {
      this.initializeMetric(metricName, modelConfig.config);
      
      // Update statistics if provided
      if (modelConfig.stats) {
        const model = this.models.get(metricName);
        model.stats = modelConfig.stats;
      }
    }

    console.log(`Imported ${Object.keys(config.models).length} anomaly detection models`);
    return this.exportModels();
  }
}

module.exports = AnomalyDetector;
