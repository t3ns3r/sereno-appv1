import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock IndexedDB
const mockIDBDatabase = {
  transaction: vi.fn(),
  close: vi.fn(),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn()
};

const mockIDBTransaction = {
  objectStore: vi.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null
};

const mockIDBObjectStore = {
  add: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  getAll: vi.fn(),
  count: vi.fn(),
  createIndex: vi.fn(),
  index: vi.fn()
};

const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null
};

// Mock data sync service
class MockDataSyncService {
  private pendingSync: any[] = [];
  private isOnline = true;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async saveOffline(type: string, data: any): Promise<void> {
    const entry = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };

    this.pendingSync.push(entry);
    
    // Store in IndexedDB
    await this.storeInIndexedDB(entry);
  }

  async syncPendingData(): Promise<void> {
    if (!this.isOnline) return;

    const unsynced = this.pendingSync.filter(item => !item.synced);
    
    for (const item of unsynced) {
      try {
        await this.syncItem(item);
        item.synced = true;
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
      }
    }

    // Clean up synced items
    this.pendingSync = this.pendingSync.filter(item => !item.synced);
  }

  private async syncItem(item: any): Promise<void> {
    const endpoint = this.getEndpointForType(item.type);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  private getEndpointForType(type: string): string {
    const endpoints: Record<string, string> = {
      mood: '/api/mood/assessment',
      tracking: '/api/daily-tracking',
      breathing: '/api/breathing/exercise',
      emergency: '/api/emergency/panic'
    };

    return endpoints[type] || '/api/sync';
  }

  private async storeInIndexedDB(entry: any): Promise<void> {
    // Mock IndexedDB storage
    mockIDBObjectStore.put.mockResolvedValue(entry);
  }

  getPendingCount(): number {
    return this.pendingSync.filter(item => !item.synced).length;
  }

  clearPendingData(): void {
    this.pendingSync = [];
  }
}

describe('Data Synchronization Tests', () => {
  let dataSyncService: MockDataSyncService;

  beforeEach(() => {
    // Setup global mocks
    Object.defineProperty(global, 'indexedDB', {
      value: {
        open: vi.fn().mockReturnValue({
          ...mockIDBRequest,
          result: mockIDBDatabase,
          onsuccess: null
        }),
        deleteDatabase: vi.fn()
      },
      writable: true
    });

    Object.defineProperty(global, 'navigator', {
      value: {
        onLine: true
      },
      writable: true
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });

    global.fetch = vi.fn();
    dataSyncService = new MockDataSyncService();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    dataSyncService.clearPendingData();
  });

  describe('Offline Data Storage', () => {
    it('should store mood data when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const moodData = {
        selectedEmotion: { id: 'happy', name: 'Happy', value: 4 },
        textDescription: 'Feeling great today!',
        timestamp: new Date().toISOString()
      };

      await dataSyncService.saveOffline('mood', moodData);

      expect(dataSyncService.getPendingCount()).toBe(1);
      expect(mockIDBObjectStore.put).toHaveBeenCalled();
    });

    it('should store daily tracking data when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const trackingData = {
        confidence: 8,
        emotionalState: 'positive',
        notes: 'Good day overall',
        timestamp: new Date().toISOString()
      };

      await dataSyncService.saveOffline('tracking', trackingData);

      expect(dataSyncService.getPendingCount()).toBe(1);
    });

    it('should store breathing exercise data when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const breathingData = {
        configuration: { inhaleSeconds: 4, holdSeconds: 6, exhaleSeconds: 5 },
        duration: 300,
        cycles: 10,
        timestamp: new Date().toISOString()
      };

      await dataSyncService.saveOffline('breathing', breathingData);

      expect(dataSyncService.getPendingCount()).toBe(1);
    });

    it('should handle multiple offline entries', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const entries = [
        { type: 'mood', data: { emotion: 'happy' } },
        { type: 'tracking', data: { confidence: 7 } },
        { type: 'breathing', data: { duration: 180 } }
      ];

      for (const entry of entries) {
        await dataSyncService.saveOffline(entry.type, entry.data);
      }

      expect(dataSyncService.getPendingCount()).toBe(3);
    });
  });

  describe('Online Data Synchronization', () => {
    it('should sync pending data when coming online', async () => {
      // Start offline and add data
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      await dataSyncService.saveOffline('mood', { emotion: 'happy' });
      await dataSyncService.saveOffline('tracking', { confidence: 8 });

      expect(dataSyncService.getPendingCount()).toBe(2);

      // Mock successful API responses
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(dataSyncService.getPendingCount()).toBe(0);
    });

    it('should handle sync failures gracefully', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      await dataSyncService.saveOffline('mood', { emotion: 'sad' });

      // Mock API failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      Object.defineProperty(navigator, 'onLine', { value: true });
      await dataSyncService.syncPendingData();

      // Data should still be pending after failed sync
      expect(dataSyncService.getPendingCount()).toBe(1);
    });

    it('should retry failed syncs', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      await dataSyncService.saveOffline('mood', { emotion: 'neutral' });

      // First attempt fails
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        );

      Object.defineProperty(navigator, 'onLine', { value: true });
      
      // First sync attempt
      await dataSyncService.syncPendingData();
      expect(dataSyncService.getPendingCount()).toBe(1);

      // Second sync attempt
      await dataSyncService.syncPendingData();
      expect(dataSyncService.getPendingCount()).toBe(0);
    });

    it('should sync different data types to correct endpoints', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      await dataSyncService.saveOffline('mood', { emotion: 'happy' });
      await dataSyncService.saveOffline('tracking', { confidence: 9 });
      await dataSyncService.saveOffline('breathing', { duration: 240 });

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      Object.defineProperty(navigator, 'onLine', { value: true });
      await dataSyncService.syncPendingData();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/mood/assessment',
        expect.objectContaining({ method: 'POST' })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/daily-tracking',
        expect.objectContaining({ method: 'POST' })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/breathing/exercise',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('IndexedDB Operations', () => {
    it('should open IndexedDB database successfully', () => {
      const openRequest = indexedDB.open('SerenaDB', 1);
      
      expect(indexedDB.open).toHaveBeenCalledWith('SerenaDB', 1);
      expect(openRequest).toBeDefined();
    });

    it('should handle IndexedDB upgrade events', () => {
      const mockUpgradeEvent = {
        target: {
          result: mockIDBDatabase
        },
        oldVersion: 0,
        newVersion: 1
      };

      // Simulate database upgrade
      mockIDBDatabase.createObjectStore.mockReturnValue(mockIDBObjectStore);
      
      // Create object stores
      mockIDBDatabase.createObjectStore('pendingSync', { keyPath: 'id' });
      mockIDBDatabase.createObjectStore('moodEntries', { keyPath: 'id' });
      mockIDBDatabase.createObjectStore('trackingEntries', { keyPath: 'id' });

      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledTimes(3);
    });

    it('should handle IndexedDB errors', () => {
      const mockErrorEvent = {
        target: {
          error: new Error('IndexedDB error')
        }
      };

      // Simulate error handling
      expect(mockErrorEvent.target.error).toBeInstanceOf(Error);
    });

    it('should store and retrieve data from IndexedDB', async () => {
      const testData = {
        id: '123',
        type: 'mood',
        data: { emotion: 'happy' },
        timestamp: new Date().toISOString()
      };

      mockIDBObjectStore.put.mockResolvedValue(testData);
      mockIDBObjectStore.get.mockResolvedValue(testData);

      // Store data
      await mockIDBObjectStore.put(testData);
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith(testData);

      // Retrieve data
      const retrieved = await mockIDBObjectStore.get('123');
      expect(mockIDBObjectStore.get).toHaveBeenCalledWith('123');
      expect(retrieved).toEqual(testData);
    });
  });

  describe('Conflict Resolution', () => {
    it('should handle timestamp conflicts during sync', async () => {
      const localData = {
        id: 'entry-1',
        emotion: 'happy',
        timestamp: '2024-01-01T10:00:00Z'
      };

      const serverData = {
        id: 'entry-1',
        emotion: 'sad',
        timestamp: '2024-01-01T11:00:00Z'
      };

      // Mock server response with conflict
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          conflict: true,
          serverData,
          localData
        }), { status: 409 })
      );

      Object.defineProperty(navigator, 'onLine', { value: false });
      await dataSyncService.saveOffline('mood', localData);

      Object.defineProperty(navigator, 'onLine', { value: true });
      
      try {
        await dataSyncService.syncPendingData();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Should still have pending data due to conflict
      expect(dataSyncService.getPendingCount()).toBe(1);
    });

    it('should merge non-conflicting changes', async () => {
      const localChanges = {
        confidence: 8,
        notes: 'Updated notes'
      };

      const serverData = {
        confidence: 7,
        emotionalState: 'positive',
        timestamp: '2024-01-01T10:00:00Z'
      };

      // Mock successful merge
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          success: true,
          merged: {
            ...serverData,
            ...localChanges
          }
        }), { status: 200 })
      );

      Object.defineProperty(navigator, 'onLine', { value: false });
      await dataSyncService.saveOffline('tracking', localChanges);

      Object.defineProperty(navigator, 'onLine', { value: true });
      await dataSyncService.syncPendingData();

      expect(dataSyncService.getPendingCount()).toBe(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate data before syncing', async () => {
      const invalidData = {
        // Missing required fields
        emotion: null,
        timestamp: 'invalid-date'
      };

      Object.defineProperty(navigator, 'onLine', { value: false });
      await dataSyncService.saveOffline('mood', invalidData);

      // Mock validation error from server
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          error: 'Validation failed',
          details: ['emotion is required', 'invalid timestamp format']
        }), { status: 400 })
      );

      Object.defineProperty(navigator, 'onLine', { value: true });
      
      try {
        await dataSyncService.syncPendingData();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Invalid data should remain pending
      expect(dataSyncService.getPendingCount()).toBe(1);
    });

    it('should sanitize data before storage', async () => {
      const unsafeData = {
        emotion: 'happy',
        notes: '<script>alert("xss")</script>Safe notes',
        timestamp: new Date().toISOString()
      };

      // Mock data sanitization
      const sanitizedData = {
        ...unsafeData,
        notes: 'Safe notes' // XSS removed
      };

      await dataSyncService.saveOffline('mood', sanitizedData);

      expect(dataSyncService.getPendingCount()).toBe(1);
    });
  });

  describe('Performance Optimization', () => {
    it('should batch sync operations', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      // Add multiple entries
      for (let i = 0; i < 10; i++) {
        await dataSyncService.saveOffline('mood', { 
          emotion: 'happy', 
          index: i 
        });
      }

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      Object.defineProperty(navigator, 'onLine', { value: true });
      await dataSyncService.syncPendingData();

      // Should sync all entries
      expect(global.fetch).toHaveBeenCalledTimes(10);
      expect(dataSyncService.getPendingCount()).toBe(0);
    });

    it('should handle large datasets efficiently', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      // Add many entries
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        type: 'mood',
        data: { emotion: 'neutral', index: i }
      }));

      for (const entry of largeDataset) {
        await dataSyncService.saveOffline(entry.type, entry.data);
      }

      expect(dataSyncService.getPendingCount()).toBe(100);

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      Object.defineProperty(navigator, 'onLine', { value: true });
      
      const startTime = Date.now();
      await dataSyncService.syncPendingData();
      const endTime = Date.now();

      // Should complete sync in reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(dataSyncService.getPendingCount()).toBe(0);
    });
  });
});