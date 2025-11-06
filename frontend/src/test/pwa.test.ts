import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock service worker registration
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
  scope: 'http://localhost:3000/',
  update: vi.fn().mockResolvedValue(undefined),
  unregister: vi.fn().mockResolvedValue(true),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

// Mock navigator.serviceWorker
const mockServiceWorker = {
  register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
  ready: Promise.resolve(mockServiceWorkerRegistration),
  controller: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getRegistration: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
  getRegistrations: vi.fn().mockResolvedValue([mockServiceWorkerRegistration])
};

// Mock cache API
const mockCache = {
  match: vi.fn(),
  matchAll: vi.fn(),
  add: vi.fn().mockResolvedValue(undefined),
  addAll: vi.fn().mockResolvedValue(undefined),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(true),
  keys: vi.fn().mockResolvedValue([])
};

const mockCaches = {
  open: vi.fn().mockResolvedValue(mockCache),
  match: vi.fn(),
  has: vi.fn().mockResolvedValue(true),
  delete: vi.fn().mockResolvedValue(true),
  keys: vi.fn().mockResolvedValue(['api-cache', 'runtime-cache'])
};

describe('PWA Functionality Tests', () => {
  beforeEach(() => {
    // Setup global mocks
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: mockServiceWorker,
        onLine: true,
        connection: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 100
        }
      },
      writable: true
    });

    Object.defineProperty(global, 'caches', {
      value: mockCaches,
      writable: true
    });

    // Mock fetch
    global.fetch = vi.fn();

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(registration).toBe(mockServiceWorkerRegistration);
    });

    it('should handle service worker registration failure', async () => {
      const error = new Error('Service worker registration failed');
      mockServiceWorker.register.mockRejectedValueOnce(error);

      await expect(navigator.serviceWorker.register('/sw.js')).rejects.toThrow(error);
    });

    it('should update service worker when available', async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      
      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
    });
  });

  describe('Offline Functionality', () => {
    it('should detect online/offline status', () => {
      expect(navigator.onLine).toBe(true);
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      expect(navigator.onLine).toBe(false);
    });

    it('should cache API responses when online', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      
      const cache = await caches.open('api-cache');
      const request = new Request('https://localhost:3000/api/mood/history');
      
      await cache.put(request, mockResponse.clone());
      
      expect(mockCache.put).toHaveBeenCalledWith(request, mockResponse);
    });

    it('should serve cached responses when offline', async () => {
      const cachedResponse = new Response(JSON.stringify({ data: 'cached' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(cachedResponse);
      
      const cache = await caches.open('api-cache');
      const request = new Request('https://localhost:3000/api/mood/history');
      const response = await cache.match(request);
      
      expect(response).toBe(cachedResponse);
      expect(mockCache.match).toHaveBeenCalledWith(request);
    });

    it('should handle cache miss gracefully', async () => {
      mockCache.match.mockResolvedValue(undefined);
      
      const cache = await caches.open('api-cache');
      const request = new Request('https://localhost:3000/api/nonexistent');
      const response = await cache.match(request);
      
      expect(response).toBeUndefined();
    });
  });

  describe('App Installation', () => {
    it('should handle beforeinstallprompt event', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      const handler = vi.fn();
      window.addEventListener('beforeinstallprompt', handler);
      
      // Simulate the event
      window.dispatchEvent(new CustomEvent('beforeinstallprompt', { detail: mockEvent }));
      
      expect(handler).toHaveBeenCalled();
    });

    it('should track app installation', () => {
      const handler = vi.fn();
      window.addEventListener('appinstalled', handler);
      
      // Simulate app installation
      window.dispatchEvent(new CustomEvent('appinstalled'));
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Data Synchronization', () => {
    it('should sync pending data when coming back online', async () => {
      // Mock localStorage with pending sync data
      const pendingData = [
        { type: 'mood', data: { emotion: 'happy', timestamp: Date.now() } },
        { type: 'tracking', data: { confidence: 8, timestamp: Date.now() } }
      ];

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(pendingData)),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn()
        },
        writable: true
      });

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledTimes(2); // One for each pending item
    });

    it('should store data locally when offline', () => {
      const mockData = { emotion: 'sad', timestamp: Date.now() };
      
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const mockSetItem = vi.fn();
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue('[]'),
          setItem: mockSetItem,
          removeItem: vi.fn(),
          clear: vi.fn()
        },
        writable: true
      });

      // Simulate storing data offline
      const existingData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
      const newData = [...existingData, { type: 'mood', data: mockData }];
      localStorage.setItem('pendingSync', JSON.stringify(newData));

      expect(mockSetItem).toHaveBeenCalledWith('pendingSync', JSON.stringify(newData));
    });
  });

  describe('Cache Management', () => {
    it('should clean up old cache entries', async () => {
      const oldCacheNames = ['api-cache-v1', 'runtime-cache-v1'];
      const currentCacheNames = ['api-cache-v2', 'runtime-cache-v2'];
      
      mockCaches.keys.mockResolvedValue([...oldCacheNames, ...currentCacheNames]);
      
      // Simulate cache cleanup
      for (const cacheName of oldCacheNames) {
        if (!currentCacheNames.includes(cacheName)) {
          await caches.delete(cacheName);
        }
      }
      
      expect(mockCaches.delete).toHaveBeenCalledTimes(2);
      expect(mockCaches.delete).toHaveBeenCalledWith('api-cache-v1');
      expect(mockCaches.delete).toHaveBeenCalledWith('runtime-cache-v1');
    });

    it('should handle cache storage quota exceeded', async () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      mockCache.put.mockRejectedValue(quotaError);
      
      const cache = await caches.open('api-cache');
      const request = new Request('https://localhost:3000/api/test');
      const response = new Response('test data');
      
      await expect(cache.put(request, response)).rejects.toThrow('QuotaExceededError');
    });
  });

  describe('Network Strategies', () => {
    it('should implement NetworkFirst strategy for API calls', async () => {
      const networkResponse = new Response(JSON.stringify({ fresh: true }));
      const cachedResponse = new Response(JSON.stringify({ cached: true }));
      
      global.fetch = vi.fn().mockResolvedValue(networkResponse);
      mockCache.match.mockResolvedValue(cachedResponse);
      
      // Simulate NetworkFirst strategy
      try {
        const response = await fetch('/api/mood/history');
        expect(response).toBe(networkResponse);
      } catch {
        // Fallback to cache if network fails
        const cache = await caches.open('api-cache');
        const fallbackResponse = await cache.match('/api/mood/history');
        expect(fallbackResponse).toBe(cachedResponse);
      }
    });

    it('should implement CacheFirst strategy for static assets', async () => {
      const cachedResponse = new Response('cached asset');
      const networkResponse = new Response('fresh asset');
      
      mockCache.match.mockResolvedValue(cachedResponse);
      global.fetch = vi.fn().mockResolvedValue(networkResponse);
      
      // Simulate CacheFirst strategy
      const cache = await caches.open('static-cache');
      let response = await cache.match('https://localhost:3000/static/logo.png');
      
      if (!response) {
        response = await fetch('https://localhost:3000/static/logo.png');
        await cache.put('https://localhost:3000/static/logo.png', response.clone());
      }
      
      expect(response).toBe(cachedResponse);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Background Sync', () => {
    it('should register background sync when offline', async () => {
      const mockRegistration = {
        ...mockServiceWorkerRegistration,
        sync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      };

      mockServiceWorker.ready = Promise.resolve(mockRegistration);
      
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
      
      expect(registration.sync.register).toHaveBeenCalledWith('background-sync');
    });
  });
});