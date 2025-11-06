import { MoodService } from '../moodService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock auth store
jest.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ token: 'mock-token' })
  }
}));

describe('MoodService', () => {
  let moodService: MoodService;

  beforeEach(() => {
    moodService = new MoodService();
    jest.clearAllMocks();
  });

  describe('submitMoodAssessment', () => {
    const mockMoodData = {
      selectedEmotion: {
        id: 'happy',
        emoji: '😊',
        label: 'Contento',
        description: 'Me siento bien',
        intensity: 4
      },
      textDescription: 'Buen día'
    };

    const mockResponse = {
      data: {
        data: {
          id: 'mood-entry-1',
          userId: 'user-1',
          selectedEmotion: mockMoodData.selectedEmotion,
          textDescription: mockMoodData.textDescription,
          analysisResult: {
            overallSentiment: 'positive',
            riskLevel: 'low',
            recommendations: ['Mantén esa energía positiva']
          },
          createdAt: '2023-01-01T00:00:00Z'
        }
      }
    };

    it('should submit mood assessment successfully', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await moodService.submitMoodAssessment(mockMoodData);

      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          data: {
            error: {
              message: 'Validation failed'
            }
          }
        }
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(errorResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      await expect(moodService.submitMoodAssessment(mockMoodData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('getMoodInsights', () => {
    it('should calculate insights correctly for improving trend', () => {
      const mockEntries = [
        {
          id: '1',
          userId: 'user-1',
          selectedEmotion: { intensity: 4, label: 'Contento' },
          analysisResult: { riskLevel: 'low' },
          createdAt: '2023-01-03T00:00:00Z'
        },
        {
          id: '2',
          userId: 'user-1',
          selectedEmotion: { intensity: 2, label: 'Triste' },
          analysisResult: { riskLevel: 'medium' },
          createdAt: '2023-01-02T00:00:00Z'
        }
      ] as any;

      const insights = moodService.getMoodInsights(mockEntries);

      expect(insights.recentTrend).toBe('improving');
      expect(insights.averageIntensity).toBe(3);
      expect(insights.mostCommonEmotion).toBeDefined();
      expect(insights.riskAlert).toBe(false);
    });

    it('should detect risk alerts', () => {
      const mockEntries = [
        {
          id: '1',
          userId: 'user-1',
          selectedEmotion: { intensity: 1, label: 'Muy triste' },
          analysisResult: { riskLevel: 'high' },
          createdAt: '2023-01-01T00:00:00Z'
        }
      ] as any;

      const insights = moodService.getMoodInsights(mockEntries);

      expect(insights.riskAlert).toBe(true);
    });

    it('should handle empty entries', () => {
      const insights = moodService.getMoodInsights([]);

      expect(insights.recentTrend).toBe('stable');
      expect(insights.averageIntensity).toBe(3);
      expect(insights.mostCommonEmotion).toBe('neutral');
      expect(insights.riskAlert).toBe(false);
    });
  });

  describe('generatePersonalizedRecommendations', () => {
    it('should generate recommendations for declining trend', () => {
      const mockEntries = [
        {
          id: '1',
          userId: 'user-1',
          selectedEmotion: { intensity: 2, label: 'Triste' },
          analysisResult: { riskLevel: 'medium' },
          createdAt: '2023-01-03T00:00:00Z'
        },
        {
          id: '2',
          userId: 'user-1',
          selectedEmotion: { intensity: 4, label: 'Contento' },
          analysisResult: { riskLevel: 'low' },
          createdAt: '2023-01-01T00:00:00Z'
        }
      ] as any;

      const recommendations = moodService.generatePersonalizedRecommendations(mockEntries);

      expect(recommendations).toContain('Prueba ejercicios de respiración para reducir el estrés');
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should generate recommendations for high risk', () => {
      const mockEntries = [
        {
          id: '1',
          userId: 'user-1',
          selectedEmotion: { intensity: 1, label: 'Muy triste' },
          analysisResult: { riskLevel: 'high' },
          createdAt: '2023-01-01T00:00:00Z'
        }
      ] as any;

      const recommendations = moodService.generatePersonalizedRecommendations(mockEntries);

      expect(recommendations).toContain('Considera hablar con un profesional de salud mental');
    });

    it('should generate default recommendations for empty entries', () => {
      const recommendations = moodService.generatePersonalizedRecommendations([]);

      expect(recommendations).toContain('Comienza registrando tu estado de ánimo diariamente');
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});