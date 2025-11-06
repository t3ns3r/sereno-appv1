import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = '/api/v1';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DailyTrackingEntry {
  id: string;
  userId: string;
  confidenceLevel: number;
  emotionalState: any; // Flexible object for different emotion structures
  notes?: string;
  date: string;
  createdAt: string;
}

export interface TrackingStats {
  totalEntries: number;
  avgConfidence: number;
  currentStreak: number;
  longestStreak: number;
  emotionalTrends: { [key: string]: number };
  entries: Array<{
    date: string;
    confidenceLevel: number;
    emotionalState: any;
  }>;
}

export interface CreateTrackingEntryData {
  confidenceLevel: number;
  emotionalState: any; // Flexible object for different emotion structures
  notes?: string;
  date?: string;
}

class DailyTrackingService {
  async getEntries(startDate?: string, endDate?: string, limit?: number): Promise<DailyTrackingEntry[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());

    const response = await apiClient.get(`/daily-tracking/entries?${params.toString()}`);
    return response.data.data;
  }

  async createEntry(data: CreateTrackingEntryData): Promise<DailyTrackingEntry> {
    const response = await apiClient.post('/daily-tracking/entry', data);
    return response.data.data;
  }

  async updateEntry(data: CreateTrackingEntryData): Promise<DailyTrackingEntry> {
    const response = await apiClient.post('/daily-tracking/entry', data);
    return response.data.data;
  }

  async getStats(days?: number): Promise<TrackingStats> {
    const params = days ? `?days=${days}` : '';
    const response = await apiClient.get(`/daily-tracking/stats${params}`);
    return response.data.data;
  }

  async getTodayEntry(): Promise<{ entry: DailyTrackingEntry | null; hasTrackedToday: boolean }> {
    const response = await apiClient.get('/daily-tracking/today');
    return {
      entry: response.data.data,
      hasTrackedToday: response.data.hasTrackedToday
    };
  }
}

export const dailyTrackingService = new DailyTrackingService();