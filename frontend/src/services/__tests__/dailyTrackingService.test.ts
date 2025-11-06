import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dailyTrackingService } from '../dailyTrackingService';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ token: 'mock-token' })
  }
}));

describe('DailyTrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup axios mock
    mockedAxios.create = vi.fn().mockReturnValue({
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        }
      }
    } as any);
  });

  describe('createEntry', () => {
    const mockTrackingData = {
      confidenceLevel: 7,
      emotionalState: {
        primary: 'feliz',
        intensity: 8
      },
      notes: 'Buen día hoy'
    };

    const mockResponse = {
      data: {
        data: {
          id: 'tracking-entry-1',
          userId: 'user-1',
          confidenceLevel: 7,
          emotionalState: {
            primary: 'feliz',
            intensity: 8
          },
          notes: 'Buen día hoy',
          date: '2023-01-01T00:00:00Z',
          createdAt: '2023-01-01T00:00:00Z'
        }
      }
    };

    it('should create a daily tracking entry successfully', async () => {
      const mockApiClient = {
        post: vi.fn().mockResolvedValue(mockResponse)
      };
      
      // Mock the axios.create to return our mock client
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      const result = await dailyTrackingService.createEntry(mockTrackingData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/daily-tracking/entry', mockTrackingData);
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle API errors gracefully', async () => {
      const mockApiClient = {
        post: vi.fn().mockRejectedValue(new Error('Network error'))
      };
      
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      await expect(dailyTrackingService.createEntry(mockTrackingData))
        .rejects.toThrow('Network error');
    });
  });

  describe('getEntries', () => {
    const mockEntries = [
      {
        id: 'entry-1',
        userId: 'user-1',
        confidenceLevel: 7,
        emotionalState: { primary: 'feliz', intensity: 8 },
        notes: 'Día 1',
        date: '2023-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      },
      {
        id: 'entry-2',
        userId: 'user-1',
        confidenceLevel: 5,
        emotionalState: { primary: 'neutral', intensity: 5 },
        notes: 'Día 2',
        date: '2023-01-02T00:00:00Z',
        createdAt: '2023-01-02T00:00:00Z'
      }
    ];

    const mockResponse = {
      data: {
        data: mockEntries
      }
    };

    it('should fetch entries without parameters', async () => {
      const mockApiClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      const result = await dailyTrackingService.getEntries();

      expect(mockApiClient.get).toHaveBeenCalledWith('/daily-tracking/entries?');
      expect(result).toEqual(mockEntries);
    });

    it('should fetch entries with date range and limit', async () => {
      const mockApiClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const limit = 10;

      await dailyTrackingService.getEntries(startDate, endDate, limit);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/daily-tracking/entries?startDate=${startDate}&endDate=${endDate}&limit=${limit}`
      );
    });
  });

  describe('getStats', () => {
    const mockStats = {
      totalEntries: 10,
      avgConfidence: 7.2,
      currentStreak: 5,
      longestStreak: 8,
      emotionalTrends: {
        feliz: 4,
        neutral: 3,
        triste: 2,
        ansioso: 1
      },
      entries: [
        {
          date: '2023-01-01T00:00:00Z',
          confidenceLevel: 7,
          emotionalState: { primary: 'feliz' }
        }
      ]
    };

    const mockResponse = {
      data: {
        data: mockStats
      }
    };

    it('should fetch stats with default days', async () => {
      const mockApiClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      const result = await dailyTrackingService.getStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/daily-tracking/stats');
      expect(result).toEqual(mockStats);
    });

    it('should fetch stats with custom days parameter', async () => {
      const mockApiClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      const days = 7;
      await dailyTrackingService.getStats(days);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/daily-tracking/stats?days=${days}`);
    });
  });

  describe('getTodayEntry', () => {
    it('should return today\'s entry when it exists', async () => {
      const mockTodayEntry = {
        id: 'today-entry',
        userId: 'user-1',
        confidenceLevel: 8,
        emotionalState: { primary: 'feliz', intensity: 9 },
        notes: 'Excelente día',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const mockResponse = {
        data: {
          data: mockTodayEntry,
          hasTrackedToday: true
        }
      };

      const mockApiClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      const result = await dailyTrackingService.getTodayEntry();

      expect(mockApiClient.get).toHaveBeenCalledWith('/daily-tracking/today');
      expect(result.entry).toEqual(mockTodayEntry);
      expect(result.hasTrackedToday).toBe(true);
    });

    it('should return null when no entry exists for today', async () => {
      const mockResponse = {
        data: {
          data: null,
          hasTrackedToday: false
        }
      };

      const mockApiClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      const result = await dailyTrackingService.getTodayEntry();

      expect(result.entry).toBeNull();
      expect(result.hasTrackedToday).toBe(false);
    });
  });

  describe('updateEntry', () => {
    it('should update an entry (same as create)', async () => {
      const mockTrackingData = {
        confidenceLevel: 9,
        emotionalState: {
          primary: 'muy_feliz',
          intensity: 10
        },
        notes: 'Día actualizado'
      };

      const mockResponse = {
        data: {
          data: {
            id: 'updated-entry',
            ...mockTrackingData,
            userId: 'user-1',
            date: '2023-01-01T00:00:00Z',
            createdAt: '2023-01-01T00:00:00Z'
          }
        }
      };

      const mockApiClient = {
        post: vi.fn().mockResolvedValue(mockResponse)
      };
      
      mockedAxios.create.mockReturnValue(mockApiClient as any);

      const result = await dailyTrackingService.updateEntry(mockTrackingData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/daily-tracking/entry', mockTrackingData);
      expect(result.confidenceLevel).toBe(9);
      expect(result.notes).toBe('Día actualizado');
    });
  });
});