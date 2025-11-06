import { BreathingService } from '../breathingService';
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

describe('BreathingService', () => {
  let breathingService: BreathingService;

  beforeEach(() => {
    breathingService = new BreathingService();
    jest.clearAllMocks();
  });

  describe('recordBreathingExercise', () => {
    const mockExerciseData = {
      configuration: {
        name: 'Test Breathing',
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 5,
        cycles: 8
      },
      duration: 300
    };

    const mockResponse = {
      data: {
        data: {
          id: 'exercise-1',
          userId: 'user-1',
          configuration: mockExerciseData.configuration,
          duration: mockExerciseData.duration,
          completedAt: '2023-01-01T00:00:00Z',
          benefits: ['Reducción del estrés', 'Mejora de la concentración'],
          recommendations: ['Practica diariamente', 'Intenta sesiones más largas']
        }
      }
    };

    it('should record breathing exercise successfully', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const result = await breathingService.recordBreathingExercise(mockExerciseData);

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

      await expect(breathingService.recordBreathingExercise(mockExerciseData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration correctly', () => {
      const config = {
        name: 'Test',
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 5,
        cycles: 8
      };

      const duration = breathingService.calculateDuration(config);
      expect(duration).toBe(120); // (4 + 6 + 5) * 8 = 120 seconds
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(breathingService.formatDuration(45)).toBe('45s');
    });

    it('should format minutes only', () => {
      expect(breathingService.formatDuration(120)).toBe('2min');
    });

    it('should format minutes and seconds', () => {
      expect(breathingService.formatDuration(135)).toBe('2min 15s');
    });
  });

  describe('getDifficultyLevel', () => {
    it('should classify as Principiante', () => {
      const config = {
        name: 'Easy',
        inhaleTime: 3,
        holdTime: 3,
        exhaleTime: 3,
        cycles: 5
      };

      expect(breathingService.getDifficultyLevel(config)).toBe('Principiante');
    });

    it('should classify as Intermedio', () => {
      const config = {
        name: 'Medium',
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 5,
        cycles: 8
      };

      expect(breathingService.getDifficultyLevel(config)).toBe('Intermedio');
    });

    it('should classify as Avanzado', () => {
      const config = {
        name: 'Hard',
        inhaleTime: 6,
        holdTime: 8,
        exhaleTime: 10,
        cycles: 15
      };

      expect(breathingService.getDifficultyLevel(config)).toBe('Avanzado');
    });
  });

  describe('getConfigurationBenefits', () => {
    it('should include base benefits', () => {
      const config = {
        name: 'Basic',
        inhaleTime: 4,
        holdTime: 2,
        exhaleTime: 4,
        cycles: 5
      };

      const benefits = breathingService.getConfigurationBenefits(config);
      expect(benefits).toContain('Reducción del estrés y la ansiedad');
    });

    it('should include hold time benefits', () => {
      const config = {
        name: 'With Hold',
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 4,
        cycles: 5
      };

      const benefits = breathingService.getConfigurationBenefits(config);
      expect(benefits).toContain('Mejora de la capacidad pulmonar');
      expect(benefits).toContain('Mayor control respiratorio');
    });

    it('should include exhale-focused benefits', () => {
      const config = {
        name: 'Exhale Focus',
        inhaleTime: 4,
        holdTime: 2,
        exhaleTime: 8,
        cycles: 5
      };

      const benefits = breathingService.getConfigurationBenefits(config);
      expect(benefits).toContain('Activación del sistema nervioso parasimpático');
      expect(benefits).toContain('Reducción de la frecuencia cardíaca');
    });

    it('should include meditation benefits for many cycles', () => {
      const config = {
        name: 'Many Cycles',
        inhaleTime: 4,
        holdTime: 4,
        exhaleTime: 4,
        cycles: 10
      };

      const benefits = breathingService.getConfigurationBenefits(config);
      expect(benefits).toContain('Meditación profunda');
      expect(benefits).toContain('Mayor conciencia corporal');
    });
  });

  describe('getConfigurationForMood', () => {
    it('should return anti-anxiety config for anxious mood', () => {
      const config = breathingService.getConfigurationForMood('anxious');
      expect(config.name).toContain('4-7-8');
    });

    it('should return quick calm for stressed mood', () => {
      const config = breathingService.getConfigurationForMood('stressed');
      expect(config.name).toContain('Calma Rápida');
    });

    it('should return energizing config for tired mood', () => {
      const config = breathingService.getConfigurationForMood('tired');
      expect(config.name).toContain('Energizante');
    });

    it('should return basic config for neutral mood', () => {
      const config = breathingService.getConfigurationForMood('neutral');
      expect(config.name).toBe('Relajación Básica');
    });
  });

  describe('generateInsights', () => {
    it('should handle empty history', () => {
      const insights = breathingService.generateInsights([]);
      
      expect(insights.consistency).toBe('needs_improvement');
      expect(insights.favoriteTime).toBe('unknown');
      expect(insights.progressTrend).toBe('stable');
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should analyze consistency correctly', () => {
      const mockHistory = Array.from({ length: 6 }, (_, i) => ({
        id: `${i}`,
        configuration: { name: 'Test', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
        duration: 300,
        completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      }));

      const insights = breathingService.generateInsights(mockHistory);
      expect(insights.consistency).toBe('excellent');
    });

    it('should detect favorite time', () => {
      const mockHistory = [
        {
          id: '1',
          configuration: { name: 'Morning', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
          duration: 300,
          completedAt: new Date(2023, 0, 1, 8, 0).toISOString() // 8 AM
        },
        {
          id: '2',
          configuration: { name: 'Morning2', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
          duration: 300,
          completedAt: new Date(2023, 0, 2, 9, 0).toISOString() // 9 AM
        }
      ];

      const insights = breathingService.generateInsights(mockHistory);
      expect(insights.favoriteTime).toBe('morning');
    });

    it('should detect improving trend', () => {
      const mockHistory = [
        {
          id: '1',
          configuration: { name: 'Recent', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
          duration: 400, // Recent: longer
          completedAt: new Date().toISOString()
        },
        {
          id: '2',
          configuration: { name: 'Old', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
          duration: 200, // Older: shorter
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const insights = breathingService.generateInsights(mockHistory);
      expect(insights.progressTrend).toBe('improving');
    });
  });
});