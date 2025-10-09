const { helpers, validators } = require('../../utils');

class DataFilter {
  constructor() {
    this.filters = new Map();
    this.filteredData = [];
    this.stats = {
      totalProcessed: 0,
      filteredOut: 0,
      passedThrough: 0
    };
  }

  // Add a filter with specific criteria
  addFilter(name, criteria) {
    const filter = {
      name: name,
      criteria: criteria,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    this.filters.set(name, filter);
    console.log(`Filter added: ${name}`);
  }

  // Remove a filter
  removeFilter(name) {
    if (this.filters.has(name)) {
      this.filters.delete(name);
      console.log(`Filter removed: ${name}`);
      return true;
    }
    return false;
  }

  // Enable/disable a filter
  setFilterState(name, enabled) {
    const filter = this.filters.get(name);
    if (filter) {
      filter.enabled = enabled;
      console.log(`Filter ${name} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  // Process data through all active filters
  process(data) {
    this.stats.totalProcessed++;

    let shouldTransmit = true;
    const filterResults = [];

    // Apply each active filter
    for (const [name, filter] of this.filters) {
      if (!filter.enabled) continue;

      const result = this.applyFilter(data, filter.criteria);
      filterResults.push({
        filter: name,
        passed: result.passed,
        reason: result.reason
      });

      if (!result.passed) {
        shouldTransmit = false;
        // Don't break, we want to collect all filter results
      }
    }

    const processedData = {
      ...data,
      _metadata: {
        filtered: !shouldTransmit,
        filterResults: filterResults,
        processedAt: new Date().toISOString()
      }
    };

    if (shouldTransmit) {
      this.stats.passedThrough++;
    } else {
      this.stats.filteredOut++;
      this.filteredData.push(processedData);
      
      // Keep only recent filtered data
      if (this.filteredData.length > 1000) {
        this.filteredData = this.filteredData.slice(-1000);
      }
    }

    return {
      transmit: shouldTransmit,
      data: processedData,
      filterResults: filterResults
    };
  }

  // Apply a single filter to data
  applyFilter(data, criteria) {
    try {
      // Range-based filtering
      if (criteria.range) {
        for (const [field, range] of Object.entries(criteria.range)) {
          if (data[field] !== undefined) {
            const value = data[field];
            if (range.min !== undefined && value < range.min) {
              return { passed: false, reason: `${field} below minimum (${value} < ${range.min})` };
            }
            if (range.max !== undefined && value > range.max) {
              return { passed: false, reason: `${field} above maximum (${value} > ${range.max})` };
            }
          }
        }
      }

      // Value-based filtering
      if (criteria.values) {
        for (const [field, allowedValues] of Object.entries(criteria.values)) {
          if (data[field] !== undefined && !allowedValues.includes(data[field])) {
            return { passed: false, reason: `${field} value not in allowed set` };
          }
        }
      }

      // Custom function filtering
      if (criteria.custom && typeof criteria.custom === 'function') {
        const customResult = criteria.custom(data);
        if (!customResult.passed) {
          return customResult;
        }
      }

      // Anomaly detection filtering
      if (criteria.anomalyDetection) {
        const anomalyResult = this.detectAnomalies(data, criteria.anomalyDetection);
        if (!anomalyResult.passed) {
          return anomalyResult;
        }
      }

      return { passed: true, reason: 'All filters passed' };

    } catch (error) {
      console.error('Filter application error:', error);
      return { passed: false, reason: `Filter error: ${error.message}` };
    }
  }

  // Detect anomalies in data
  detectAnomalies(data, config) {
    const anomalies = [];

    // Spike detection
    if (config.spikeDetection) {
      for (const field of config.spikeDetection.fields || []) {
        if (data[field] !== undefined) {
          // Simple spike detection based on recent history
          const isSpike = this.checkForSpike(field, data[field], config.spikeDetection);
          if (isSpike) {
            anomalies.push(`${field} spike detected`);
          }
        }
      }
    }

    // Rate of change detection
    if (config.rateOfChange) {
      for (const field of config.rateOfChange.fields || []) {
        if (data[field] !== undefined) {
          const rateExceeded = this.checkRateOfChange(field, data[field], config.rateOfChange);
          if (rateExceeded) {
            anomalies.push(`${field} rate of change exceeded`);
          }
        }
      }
    }

    if (anomalies.length > 0) {
      return {
        passed: false,
        reason: `Anomalies detected: ${anomalies.join(', ')}`
      };
    }

    return { passed: true, reason: 'No anomalies detected' };
  }

  // Check for sudden spikes in data
  checkForSpike(field, currentValue, config) {
    // This would typically use historical data
    // For simulation, we use a simple threshold approach
    const threshold = config.threshold || 3; // Standard deviations
    
    // Simulate spike detection
    return Math.random() < 0.05; // 5% chance of spike for demo
  }

  // Check rate of change
  checkRateOfChange(field, currentValue, config) {
    // This would compare with previous values
    // For simulation, simple random check
    const maxRate = config.maxRate || 10; // Maximum change per minute
    
    // Simulate rate check
    return Math.random() < 0.03; // 3% chance of rate exceedance for demo
  }

  // Batch process multiple data points
  processBatch(dataArray) {
    const results = {
      transmitted: [],
      filtered: [],
      summary: {
        total: dataArray.length,
        transmitted: 0,
        filtered: 0
      }
    };

    for (const data of dataArray) {
      const result = this.process(data);
      
      if (result.transmit) {
        results.transmitted.push(result.data);
        results.summary.transmitted++;
      } else {
        results.filtered.push(result.data);
        results.summary.filtered++;
      }
    }

    return results;
  }

  // Get filtered data for analysis
  getFilteredData(criteria = {}) {
    let data = [...this.filteredData];

    // Apply time filter
    if (criteria.startTime) {
      data = data.filter(item => 
        new Date(item._metadata.processedAt) >= new Date(criteria.startTime)
      );
    }

    if (criteria.endTime) {
      data = data.filter(item => 
        new Date(item._metadata.processedAt) <= new Date(criteria.endTime)
      );
    }

    // Apply reason filter
    if (criteria.reason) {
      data = data.filter(item =>
        item._metadata.filterResults.some(result => 
          result.reason.includes(criteria.reason)
        )
      );
    }

    return data;
  }

  // Generate filter statistics
  getStats() {
    const filterStats = {};
    
    for (const [name, filter] of this.filters) {
      filterStats[name] = {
        enabled: filter.enabled,
        createdAt: filter.createdAt
      };
    }

    return {
      ...this.stats,
      activeFilters: this.filters.size,
      filterStats: filterStats,
      filteredDataCount: this.filteredData.length
    };
  }

  // Optimize filters based on historical data
  optimizeFilters() {
    console.log('Optimizing filters based on historical data...');
    
    // Analyze filtered data to suggest filter improvements
    const optimizationSuggestions = [];

    // Example: If many data points are filtered for the same reason,
    // suggest adjusting the filter thresholds
    const reasonCounts = {};
    this.filteredData.forEach(item => {
      item._metadata.filterResults.forEach(result => {
        if (!result.passed) {
          reasonCounts[result.reason] = (reasonCounts[result.reason] || 0) + 1;
        }
      });
    });

    for (const [reason, count] of Object.entries(reasonCounts)) {
      if (count > this.filteredData.length * 0.1) { // If >10% of filtered data
        optimizationSuggestions.push({
          type: 'threshold_adjustment',
          reason: reason,
          count: count,
          suggestion: `Consider adjusting filter thresholds for: ${reason}`
        });
      }
    }

    return {
      optimized: optimizationSuggestions.length > 0,
      suggestions: optimizationSuggestions,
      analyzedDataPoints: this.filteredData.length
    };
  }

  // Export filter configuration
  exportFilters() {
    const filtersArray = [];
    
    for (const [name, filter] of this.filters) {
      filtersArray.push({
        name: name,
        criteria: filter.criteria,
        enabled: filter.enabled
      });
    }

    return {
      exportTime: new Date().toISOString(),
      totalFilters: filtersArray.length,
      filters: filtersArray,
      stats: this.getStats()
    };
  }

  // Import filter configuration
  importFilters(config) {
    if (!config.filters || !Array.isArray(config.filters)) {
      throw new Error('Invalid filter configuration format');
    }

    // Clear existing filters
    this.filters.clear();

    // Import new filters
    config.filters.forEach(filterConfig => {
      this.addFilter(filterConfig.name, filterConfig.criteria);
      this.setFilterState(filterConfig.name, filterConfig.enabled);
    });

    console.log(`Imported ${config.filters.length} filters`);
    return this.getStats();
  }
}

module.exports = DataFilter;
