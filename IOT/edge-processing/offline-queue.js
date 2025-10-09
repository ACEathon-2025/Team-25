const { helpers } = require('../../utils');

class OfflineQueue {
  constructor(storageKey = 'smartfishing_offline_queue') {
    this.storageKey = storageKey;
    this.queue = [];
    this.maxQueueSize = 1000;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    this.isProcessing = false;
    this.stats = {
      totalQueued: 0,
      successfullySent: 0,
      failedPermanently: 0,
      currentlyQueued: 0
    };

    // Load existing queue from storage
    this.loadFromStorage();
  }

  // Add item to offline queue
  async add(item, priority = 'normal') {
    const queueItem = {
      id: helpers.generateAlertId(),
      data: item,
      priority: priority,
      timestamp: new Date().toISOString(),
      attempts: 0,
      status: 'queued',
      lastAttempt: null,
      nextRetry: null
    };

    // Check if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      // Remove lowest priority items if queue is full
      this.makeSpaceForNewItem(priority);
    }

    this.queue.push(queueItem);
    this.stats.totalQueued++;
    this.stats.currentlyQueued++;

    // Sort by priority and timestamp
    this.sortQueue();

    // Save to persistent storage
    this.saveToStorage();

    console.log(`Item queued offline: ${queueItem.id} (Priority: ${priority})`);

    return queueItem.id;
  }

  // Make space in queue by removing low priority items
  makeSpaceForNewItem(newPriority) {
    const priorityOrder = { 'high': 3, 'medium': 2, 'normal': 1, 'low': 0 };
    const newPriorityScore = priorityOrder[newPriority];

    // Find items with lower priority than the new item
    const lowerPriorityItems = this.queue.filter(item => 
      priorityOrder[item.priority] < newPriorityScore
    );

    if (lowerPriorityItems.length > 0) {
      // Remove the oldest lower priority item
      const oldestLowerPriority = lowerPriorityItems.reduce((oldest, current) => 
        new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
      );

      const index = this.queue.findIndex(item => item.id === oldestLowerPriority.id);
      if (index !== -1) {
        this.queue.splice(index, 1);
        this.stats.currentlyQueued--;
        console.log(`Removed low priority item to make space: ${oldestLowerPriority.id}`);
        return;
      }
    }

    // If no lower priority items, remove the oldest item regardless of priority
    if (this.queue.length > 0) {
      const oldestItem = this.queue.reduce((oldest, current) => 
        new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
      );
      
      const index = this.queue.findIndex(item => item.id === oldestItem.id);
      if (index !== -1) {
        this.queue.splice(index, 1);
        this.stats.currentlyQueued--;
        console.log(`Removed oldest item to make space: ${oldestItem.id}`);
      }
    }
  }

  // Sort queue by priority and timestamp
  sortQueue() {
    const priorityOrder = { 'high': 3, 'medium': 2, 'normal': 1, 'low': 0 };
    
    this.queue.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }

  // Process the offline queue
  async processQueue(sendFunction) {
    if (this.isProcessing) {
      console.log('Queue processing already in progress');
      return;
    }

    if (this.queue.length === 0) {
      console.log('Offline queue is empty');
      return;
    }

    this.isProcessing = true;
    console.log(`Starting to process offline queue with ${this.queue.length} items`);

    let successCount = 0;
    let failureCount = 0;

    // Process items in order
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      
      // Skip items that are waiting for retry
      if (item.nextRetry && new Date(item.nextRetry) > new Date()) {
        continue;
      }

      try {
        console.log(`Processing queued item: ${item.id} (Attempt ${item.attempts + 1})`);
        
        // Use the provided send function to transmit the data
        await sendFunction(item.data);
        
        // Mark as successfully sent
        item.status = 'sent';
        item.sentAt = new Date().toISOString();
        successCount++;
        this.stats.successfullySent++;
        this.stats.currentlyQueued--;

        console.log(`Successfully sent queued item: ${item.id}`);

      } catch (error) {
        item.attempts++;
        item.lastAttempt = new Date().toISOString();
        item.lastError = error.message;

        if (item.attempts >= this.retryAttempts) {
          // Max retries exceeded
          item.status = 'failed';
          item.nextRetry = null;
          failureCount++;
          this.stats.failedPermanently++;
          this.stats.currentlyQueued--;

          console.error(`Permanently failed to send queued item: ${item.id}`, error);
        } else {
          // Schedule retry
          const retryDelay = this.retryDelay * Math.pow(2, item.attempts - 1); // Exponential backoff
          item.nextRetry = new Date(Date.now() + retryDelay).toISOString();
          item.status = 'retrying';

          console.log(`Scheduled retry for item ${item.id} in ${retryDelay}ms`);
        }
      }

      // Small delay between processing items to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clean up sent and failed items
    this.queue = this.queue.filter(item => 
      item.status === 'queued' || item.status === 'retrying'
    );

    // Save updated queue to storage
    this.saveToStorage();

    this.isProcessing = false;

    console.log(`Queue processing completed. Success: ${successCount}, Failures: ${failureCount}, Remaining: ${this.queue.length}`);

    return {
      successCount,
      failureCount,
      remaining: this.queue.length
    };
  }

  // Get items that are ready for retry
  getReadyForRetry() {
    const now = new Date();
    return this.queue.filter(item => 
      item.status === 'retrying' && 
      item.nextRetry && 
      new Date(item.nextRetry) <= now
    );
  }

  // Get queue status
  getStatus() {
    const statusCounts = {
      queued: 0,
      retrying: 0,
      sent: 0,
      failed: 0
    };

    this.queue.forEach(item => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });

    return {
      totalItems: this.queue.length,
      statusCounts: statusCounts,
      stats: { ...this.stats },
      isProcessing: this.isProcessing,
      storageKey: this.storageKey,
      maxQueueSize: this.maxQueueSize
    };
  }

  // Get items by priority
  getItemsByPriority(priority = null) {
    if (priority) {
      return this.queue.filter(item => item.priority === priority);
    }
    return [...this.queue];
  }

  // Remove specific item from queue
  removeItem(itemId) {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      const removedItem = this.queue.splice(index, 1)[0];
      this.stats.currentlyQueued--;
      this.saveToStorage();
      console.log(`Removed item from queue: ${itemId}`);
      return removedItem;
    }
    return null;
  }

  // Clear the entire queue
  clearQueue() {
    const clearedCount = this.queue.length;
    this.queue = [];
    this.stats.currentlyQueued = 0;
    this.saveToStorage();
    console.log(`Cleared entire queue: ${clearedCount} items removed`);
    return clearedCount;
  }

  // Update queue configuration
  updateConfig(newConfig) {
    if (newConfig.maxQueueSize !== undefined) {
      this.maxQueueSize = newConfig.maxQueueSize;
      // Remove excess items if new size is smaller
      if (this.queue.length > this.maxQueueSize) {
        this.queue = this.queue.slice(0, this.maxQueueSize);
        this.stats.currentlyQueued = this.queue.length;
      }
    }

    if (newConfig.retryAttempts !== undefined) {
      this.retryAttempts = newConfig.retryAttempts;
    }

    if (newConfig.retryDelay !== undefined) {
      this.retryDelay = newConfig.retryDelay;
    }

    this.saveToStorage();
    console.log('Queue configuration updated');
  }

  // Save queue to persistent storage (localStorage simulation)
  saveToStorage() {
    try {
      const storageData = {
        queue: this.queue,
        stats: this.stats,
        timestamp: new Date().toISOString()
      };

      // In a real implementation, this would use async storage
      // For simulation, we'll use a simple approach
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(storageData));
      }

      // Also log to console for demonstration
      console.log(`Queue saved to storage: ${this.queue.length} items`);
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  // Load queue from persistent storage
  loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const storageData = JSON.parse(stored);
          this.queue = storageData.queue || [];
          this.stats = storageData.stats || this.stats;
          this.stats.currentlyQueued = this.queue.length;
          
          console.log(`Queue loaded from storage: ${this.queue.length} items`);
        }
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
      // Initialize with empty queue if loading fails
      this.queue = [];
      this.stats.currentlyQueued = 0;
    }
  }

  // Export queue data for backup/analysis
  exportQueue() {
    return {
      exportTime: new Date().toISOString(),
      queue: this.queue,
      stats: { ...this.stats },
      config: {
        maxQueueSize: this.maxQueueSize,
        retryAttempts: this.retryAttempts,
        retryDelay: this.retryDelay,
        storageKey: this.storageKey
      }
    };
  }

  // Import queue data
  importQueue(importData) {
    if (!importData.queue || !Array.isArray(importData.queue)) {
      throw new Error('Invalid queue import data');
    }

    // Create backup of current queue
    const backup = this.exportQueue();

    try {
      this.queue = importData.queue;
      this.stats = importData.stats || this.stats;
      this.stats.currentlyQueued = this.queue.length;

      if (importData.config) {
        this.updateConfig(importData.config);
      }

      this.saveToStorage();

      console.log(`Queue imported successfully: ${this.queue.length} items`);

      return {
        success: true,
        importedItems: this.queue.length,
        backup: backup
      };

    } catch (error) {
      // Restore from backup if import fails
      this.queue = backup.queue;
      this.stats = backup.stats;
      this.saveToStorage();

      throw new Error(`Queue import failed: ${error.message}. Restored from backup.`);
    }
  }

  // Get queue analytics
  getAnalytics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentItems = this.queue.filter(item => 
      new Date(item.timestamp) >= oneHourAgo
    );

    const priorityDistribution = {};
    const typeDistribution = {};

    this.queue.forEach(item => {
      // Priority distribution
      priorityDistribution[item.priority] = (priorityDistribution[item.priority] || 0) + 1;

      // Type distribution (based on data structure)
      const itemType = this.detectItemType(item.data);
      typeDistribution[itemType] = (typeDistribution[itemType] || 0) + 1;
    });

    return {
      totalItems: this.queue.length,
      recentItems: recentItems.length,
      priorityDistribution: priorityDistribution,
      typeDistribution: typeDistribution,
      averageAge: this.calculateAverageAge(),
      retryStatistics: this.calculateRetryStats()
    };
  }

  // Detect type of queued item
  detectItemType(data) {
    if (data.temperature !== undefined) return 'sensor_data';
    if (data.alertType !== undefined) return 'alert';
    if (data.message !== undefined) return 'message';
    if (data.location !== undefined) return 'location';
    return 'unknown';
  }

  // Calculate average age of queued items
  calculateAverageAge() {
    if (this.queue.length === 0) return 0;

    const now = new Date();
    const totalAge = this.queue.reduce((sum, item) => {
      const age = now - new Date(item.timestamp);
      return sum + age;
    }, 0);

    return totalAge / this.queue.length / (1000 * 60); // Convert to minutes
  }

  // Calculate retry statistics
  calculateRetryStats() {
    const retryStats = {
      totalRetries: 0,
      averageRetries: 0,
      maxRetries: 0,
      itemsWithRetries: 0
    };

    this.queue.forEach(item => {
      if (item.attempts > 0) {
        retryStats.totalRetries += item.attempts;
        retryStats.itemsWithRetries++;
        retryStats.maxRetries = Math.max(retryStats.maxRetries, item.attempts);
      }
    });

    if (retryStats.itemsWithRetries > 0) {
      retryStats.averageRetries = retryStats.totalRetries / retryStats.itemsWithRetries;
    }

    return retryStats;
  }
}

module.exports = OfflineQueue;
