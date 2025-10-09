class DataCompression {
  constructor() {
    this.compressionMethods = new Map();
    this.compressionStats = {
      totalCompressed: 0,
      totalBytesBefore: 0,
      totalBytesAfter: 0,
      totalTime: 0
    };
    this.initializeMethods();
  }

  initializeMethods() {
    // Register available compression methods
    this.compressionMethods.set('gzip', {
      name: 'gzip',
      ratio: 0.7,
      speed: 'medium',
      supported: true
    });

    this.compressionMethods.set('lz4', {
      name: 'lz4',
      ratio: 0.8,
      speed: 'fast',
      supported: true
    });

    this.compressionMethods.set('simple', {
      name: 'simple',
      ratio: 0.9,
      speed: 'very_fast',
      supported: true
    });

    this.compressionMethods.set('none', {
      name: 'none',
      ratio: 1.0,
      speed: 'instant',
      supported: true
    });
  }

  // Compress data using specified method
  async compress(data, method = 'simple', options = {}) {
    const startTime = Date.now();

    if (!this.compressionMethods.has(method)) {
      throw new Error(`Unsupported compression method: ${method}`);
    }

    const compressionMethod = this.compressionMethods.get(method);

    let compressedData;
    let originalSize;
    let compressedSize;

    try {
      // Convert data to buffer for compression
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      originalSize = Buffer.byteLength(dataString, 'utf8');

      // Apply compression based on method
      switch (method) {
        case 'simple':
          compressedData = this.simpleCompress(dataString);
          break;
        case 'gzip':
          compressedData = await this.gzipCompress(dataString);
          break;
        case 'lz4':
          compressedData = await this.lz4Compress(dataString);
          break;
        case 'none':
          compressedData = dataString;
          break;
        default:
          throw new Error(`Unknown compression method: ${method}`);
      }

      compressedSize = Buffer.byteLength(compressedData, 'utf8');
      const endTime = Date.now();

      // Update statistics
      this.updateStats(originalSize, compressedSize, endTime - startTime);

      const result = {
        method: method,
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: compressedSize / originalSize,
        savings: originalSize - compressedSize,
        timeMs: endTime - startTime,
        data: compressedData
      };

      console.log(`Compressed ${originalSize} bytes to ${compressedSize} bytes (${((1 - result.compressionRatio) * 100).toFixed(1)}% savings) using ${method}`);

      return result;

    } catch (error) {
      console.error(`Compression failed with method ${method}:`, error);
      throw error;
    }
  }

  // Decompress data
  async decompress(compressedData, method, originalSize = null) {
    const startTime = Date.now();

    if (!this.compressionMethods.has(method)) {
      throw new Error(`Unsupported compression method: ${method}`);
    }

    let decompressedData;

    try {
      switch (method) {
        case 'simple':
          decompressedData = this.simpleDecompress(compressedData);
          break;
        case 'gzip':
          decompressedData = await this.gzipDecompress(compressedData);
          break;
        case 'lz4':
          decompressedData = await this.lz4Decompress(compressedData);
          break;
        case 'none':
          decompressedData = compressedData;
          break;
        default:
          throw new Error(`Unknown compression method: ${method}`);
      }

      const endTime = Date.now();
      const decompressedSize = Buffer.byteLength(decompressedData, 'utf8');

      const result = {
        method: method,
        decompressedSize: decompressedSize,
        timeMs: endTime - startTime,
        data: decompressedData
      };

      // Try to parse as JSON if it looks like JSON
      try {
        result.data = JSON.parse(decompressedData);
      } catch {
        // Keep as string if not JSON
      }

      console.log(`Decompressed data using ${method} in ${result.timeMs}ms`);

      return result;

    } catch (error) {
      console.error(`Decompression failed with method ${method}:`, error);
      throw error;
    }
  }

  // Simple compression (remove whitespace, shorten keys)
  simpleCompress(data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    try {
      // Parse and stringify without whitespace
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed);
    } catch {
      // If not JSON, return as is
      return data;
    }
  }

  // Simple decompression
  simpleDecompress(data) {
    return data; // No transformation needed for simple compression
  }

  // GZIP compression (simulated)
  async gzipCompress(data) {
    // In a real implementation, this would use zlib.gzip
    // For simulation, we'll use a simple approach
    console.log('Simulating GZIP compression...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate GZIP compression ratio
    const compressedSize = Math.floor(data.length * 0.7);
    return Buffer.alloc(compressedSize).toString(); // Simulated compressed data
  }

  // GZIP decompression (simulated)
  async gzipDecompress(data) {
    console.log('Simulating GZIP decompression...');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // In real implementation, this would decompress actual GZIP data
    // For simulation, return a string representation
    return `decompressed_${data}`;
  }

  // LZ4 compression (simulated)
  async lz4Compress(data) {
    console.log('Simulating LZ4 compression...');
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate LZ4 compression ratio
    const compressedSize = Math.floor(data.length * 0.8);
    return Buffer.alloc(compressedSize).toString(); // Simulated compressed data
  }

  // LZ4 decompression (simulated)
  async lz4Decompress(data) {
    console.log('Simulating LZ4 decompression...');
    await new Promise(resolve => setTimeout(resolve, 25));
    
    // In real implementation, this would decompress actual LZ4 data
    return `decompressed_${data}`;
  }

  // Update compression statistics
  updateStats(originalSize, compressedSize, timeMs) {
    this.compressionStats.totalCompressed++;
    this.compressionStats.totalBytesBefore += originalSize;
    this.compressionStats.totalBytesAfter += compressedSize;
    this.compressionStats.totalTime += timeMs;
  }

  // Get compression statistics
  getStats() {
    const totalSavings = this.compressionStats.totalBytesBefore - this.compressionStats.totalBytesAfter;
    const averageRatio = this.compressionStats.totalBytesBefore > 0 
      ? this.compressionStats.totalBytesAfter / this.compressionStats.totalBytesBefore 
      : 0;

    return {
      ...this.compressionStats,
      totalSavings: totalSavings,
      averageCompressionRatio: averageRatio,
      averageTimePerOperation: this.compressionStats.totalCompressed > 0 
        ? this.compressionStats.totalTime / this.compressionStats.totalCompressed 
        : 0,
      efficiency: ((1 - averageRatio) * 100).toFixed(1) + '%'
    };
  }

  // Choose best compression method based on data characteristics
  recommendCompressionMethod(data, constraints = {}) {
    const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    const availableMethods = Array.from(this.compressionMethods.values())
      .filter(method => method.supported);

    const recommendations = [];

    for (const method of availableMethods) {
      const estimatedSize = Math.floor(dataSize * method.ratio);
      const estimatedTime = this.estimateCompressionTime(dataSize, method.speed);

      const score = this.calculateMethodScore(method, estimatedSize, estimatedTime, constraints);

      recommendations.push({
        method: method.name,
        estimatedSize: estimatedSize,
        estimatedTime: estimatedTime,
        compressionRatio: method.ratio,
        score: score,
        suitable: this.isMethodSuitable(method, constraints)
      });
    }

    // Sort by score (descending)
    recommendations.sort((a, b) => b.score - a.score);

    return {
      dataSize: dataSize,
      recommendations: recommendations,
      bestMethod: recommendations[0]
    };
  }

  // Estimate compression time based on data size and method speed
  estimateCompressionTime(dataSize, speed) {
    const baseTime = dataSize / 1000; // Base time in ms per KB

    switch (speed) {
      case 'very_fast': return baseTime * 0.1;
      case 'fast': return baseTime * 0.5;
      case 'medium': return baseTime * 1;
      case 'slow': return baseTime * 2;
      default: return baseTime;
    }
  }

  // Calculate score for compression method
  calculateMethodScore(method, estimatedSize, estimatedTime, constraints) {
    let score = 0;

    // Size efficiency (higher ratio = lower score)
    score += (1 - method.ratio) * 50;

    // Speed efficiency
    const speedScores = {
      'very_fast': 30,
      'fast': 25,
      'medium': 20,
      'slow': 10
    };
    score += speedScores[method.speed] || 15;

    // Apply constraints
    if (constraints.maxSize && estimatedSize > constraints.maxSize) {
      score -= 100; // Heavy penalty for exceeding size constraint
    }

    if (constraints.maxTime && estimatedTime > constraints.maxTime) {
      score -= 100; // Heavy penalty for exceeding time constraint
    }

    return Math.max(0, score);
  }

  // Check if method is suitable for given constraints
  isMethodSuitable(method, constraints) {
    if (constraints.requiredSpeed && method.speed !== constraints.requiredSpeed) {
      return false;
    }

    if (constraints.minRatio && method.ratio > constraints.minRatio) {
      return false;
    }

    return true;
  }

  // Compress sensor data efficiently
  async compressSensorData(sensorData, options = {}) {
    const defaultOptions = {
      removeRedundant: true,
      shortenKeys: true,
      precision: 2,
      method: 'auto'
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Pre-process data for better compression
    let processedData = this.preprocessSensorData(sensorData, finalOptions);

    // Choose compression method
    let method = finalOptions.method;
    if (method === 'auto') {
      const recommendation = this.recommendCompressionMethod(processedData, {
        maxSize: finalOptions.maxSize,
        maxTime: finalOptions.maxTime
      });
      method = recommendation.bestMethod.method;
    }

    // Compress the data
    const compressionResult = await this.compress(processedData, method);

    return {
      ...compressionResult,
      originalData: sensorData,
      processedData: processedData,
      options: finalOptions
    };
  }

  // Preprocess sensor data for better compression
  preprocessSensorData(data, options) {
    let processed = Array.isArray(data) ? [...data] : { ...data };

    if (options.removeRedundant) {
      processed = this.removeRedundantData(processed);
    }

    if (options.shortenKeys) {
      processed = this.shortenKeys(processed);
    }

    if (options.precision !== undefined) {
      processed = this.reducePrecision(processed, options.precision);
    }

    return processed;
  }

  // Remove redundant data fields
  removeRedundantData(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.removeRedundantData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const cleaned = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Keep only non-null, non-undefined values
        if (value !== null && value !== undefined) {
          cleaned[key] = this.removeRedundantData(value);
        }
      }
      
      return cleaned;
    }

    return data;
  }

  // Shorten keys to reduce JSON size
  shortenKeys(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.shortenKeys(item));
    }

    if (typeof data === 'object' && data !== null) {
      const shortened = {};
      const keyMap = {
        'temperature': 't',
        'ph': 'p',
        'oxygen': 'o',
        'timestamp': 'ts',
        'location': 'loc',
        'latitude': 'lat',
        'longitude': 'lng',
        'deviceId': 'dev'
      };

      for (const [key, value] of Object.entries(data)) {
        const shortKey = keyMap[key] || key;
        shortened[shortKey] = this.shortenKeys(value);
      }
      
      return shortened;
    }

    return data;
  }

  // Reduce numerical precision to save space
  reducePrecision(data, decimalPlaces) {
    if (Array.isArray(data)) {
      return data.map(item => this.reducePrecision(item, decimalPlaces));
    }

    if (typeof data === 'object' && data !== null) {
      const processed = {};
      
      for (const [key, value] of Object.entries(data)) {
        processed[key] = this.reducePrecision(value, decimalPlaces);
      }
      
      return processed;
    }

    if (typeof data === 'number') {
      return parseFloat(data.toFixed(decimalPlaces));
    }

    return data;
  }

  // Batch compression for multiple data points
  async compressBatch(dataArray, method = 'simple') {
    const results = {
      total: dataArray.length,
      compressed: [],
      stats: {
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        totalTime: 0
      }
    };

    for (const data of dataArray) {
      try {
        const result = await this.compress(data, method);
        results.compressed.push(result);
        
        results.stats.totalOriginalSize += result.originalSize;
        results.stats.totalCompressedSize += result.compressedSize;
        results.stats.totalTime += result.timeMs;
      } catch (error) {
        console.error('Batch compression failed for one item:', error);
        // Continue with other items
      }
    }

    results.stats.averageRatio = results.stats.totalOriginalSize > 0 
      ? results.stats.totalCompressedSize / results.stats.totalOriginalSize 
      : 0;

    results.stats.totalSavings = results.stats.totalOriginalSize - results.stats.totalCompressedSize;

    return results;
  }

  // Get available compression methods
  getAvailableMethods() {
    return Array.from(this.compressionMethods.values())
      .filter(method => method.supported)
      .map(method => ({
        name: method.name,
        ratio: method.ratio,
        speed: method.speed,
        description: this.getMethodDescription(method.name)
      }));
  }

  // Get method description
  getMethodDescription(method) {
    const descriptions = {
      'gzip': 'Good balance of compression and speed',
      'lz4': 'Very fast with moderate compression',
      'simple': 'Fastest, minimal compression (JSON optimization)',
      'none': 'No compression'
    };

    return descriptions[method] || 'Unknown method';
  }
}

module.exports = DataCompression;
