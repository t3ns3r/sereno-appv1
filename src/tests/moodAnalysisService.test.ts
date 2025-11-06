import { MoodAnalysisService } from '../services/moodAnalysisService';
import { prisma } from '../config/database';

describe('MoodAnalysisService', () => {
  let moodAnalysisService: MoodAnalysisService;
  let testUserId: string;

  beforeAll(() => {
    moodAnalysisService = new MoodAnalysisService();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.moodEntry.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'moodtest@example.com',
        username: 'moodtestuser',
        password: 'hashedpassword',
        country: 'ES',
        profile: {
          create: {
            firstName: 'Mood',
            lastName: 'Test'
          }
        }
      }
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.moodEntry.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('analyzeMoodEntry', () => {
    it('should analyze a positive mood entry correctly', async () => {
      const moodData = {
        userId: testUserId,
        selectedEmotion: {
          id: 'very-happy',
          emoji: '😄',
          label: 'Muy feliz',
          description: 'Me siento excelente y lleno de energía',
          intensity: 5
        },
        textDescription: 'Hoy me siento fantástico, lleno de energía y muy optimista sobre el futuro.'
      };

      const result = await moodAnalysisService.analyzeMoodEntry(moodData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.selectedEmotion.intensity).toBe(5);
      expect(result.analysisResult.overallSentiment).toBe('positive');
      expect(result.analysisResult.riskLevel).toBe('low');
      expect(result.analysisResult.confidenceScore).toBeGreaterThan(0.5);
      expect(result.analysisResult.recommendations).toContain('¡Mantén esa energía positiva!');
    });

    it('should analyze a negative mood entry correctly', async () => {
      const moodData = {
        userId: testUserId,
        selectedEmotion: {
          id: 'very-sad',
          emoji: '😢',
          label: 'Muy triste',
          description: 'Me siento muy mal, con mucha tristeza',
          intensity: 1
        },
        textDescription: 'Me siento muy deprimido y sin esperanza. Todo parece muy difícil.'
      };

      const result = await moodAnalysisService.analyzeMoodEntry(moodData);

      expect(result.analysisResult.overallSentiment).toBe('negative');
      expect(result.analysisResult.riskLevel).toBe('medium');
      expect(result.analysisResult.keyEmotions).toContain('tristeza');
      expect(result.analysisResult.recommendations).toContain('Prueba algunos ejercicios de respiración para calmarte');
    });

    it('should detect high risk keywords', async () => {
      const moodData = {
        userId: testUserId,
        selectedEmotion: {
          id: 'very-sad',
          emoji: '😢',
          label: 'Muy triste',
          description: 'Me siento muy mal',
          intensity: 1
        },
        textDescription: 'No puedo más, me siento desesperado y sin salida.'
      };

      const result = await moodAnalysisService.analyzeMoodEntry(moodData);

      expect(result.analysisResult.riskLevel).toBe('high');
      expect(result.analysisResult.recommendations).toContain('Considera contactar inmediatamente con un profesional de salud mental');
    });

    it('should handle neutral emotions correctly', async () => {
      const moodData = {
        userId: testUserId,
        selectedEmotion: {
          id: 'neutral',
          emoji: '😐',
          label: 'Neutral',
          description: 'Me siento normal, ni bien ni mal',
          intensity: 3
        },
        textDescription: 'Hoy es un día normal, sin grandes emociones.'
      };

      const result = await moodAnalysisService.analyzeMoodEntry(moodData);

      expect(result.analysisResult.overallSentiment).toBe('neutral');
      expect(result.analysisResult.riskLevel).toBe('low');
      expect(result.analysisResult.emotionConsistency).toBe('consistent');
    });

    it('should detect emotion inconsistency', async () => {
      const moodData = {
        userId: testUserId,
        selectedEmotion: {
          id: 'very-happy',
          emoji: '😄',
          label: 'Muy feliz',
          description: 'Me siento excelente',
          intensity: 5
        },
        textDescription: 'Me siento muy triste y deprimido hoy.'
      };

      const result = await moodAnalysisService.analyzeMoodEntry(moodData);

      expect(result.analysisResult.emotionConsistency).toBe('inconsistent');
      expect(result.analysisResult.confidenceScore).toBeLessThan(0.7);
    });

    it('should work without text description', async () => {
      const moodData = {
        userId: testUserId,
        selectedEmotion: {
          id: 'happy',
          emoji: '😊',
          label: 'Contento',
          description: 'Me siento bien y positivo',
          intensity: 4
        }
      };

      const result = await moodAnalysisService.analyzeMoodEntry(moodData);

      expect(result.analysisResult.overallSentiment).toBe('positive');
      expect(result.analysisResult.emotionConsistency).toBe('unclear');
      expect(result.analysisResult.keyEmotions).toContain('Contento');
    });
  });

  describe('getUserMoodHistory', () => {
    beforeEach(async () => {
      // Create test mood entries
      const moodEntries = [
        {
          userId: testUserId,
          selectedEmotion: { id: 'happy', intensity: 4, label: 'Contento' },
          textDescription: 'Buen día',
          analysisResult: { overallSentiment: 'positive', riskLevel: 'low' }
        },
        {
          userId: testUserId,
          selectedEmotion: { id: 'sad', intensity: 2, label: 'Triste' },
          textDescription: 'Día difícil',
          analysisResult: { overallSentiment: 'negative', riskLevel: 'medium' }
        }
      ];

      for (const entry of moodEntries) {
        await prisma.moodEntry.create({ data: entry as any });
      }
    });

    it('should retrieve user mood history', async () => {
      const history = await moodAnalysisService.getUserMoodHistory(testUserId, 10);

      expect(history).toHaveLength(2);
      expect(history[0].userId).toBe(testUserId);
      expect(history[0].selectedEmotion).toBeDefined();
      expect(history[0].analysisResult).toBeDefined();
    });

    it('should limit results correctly', async () => {
      const history = await moodAnalysisService.getUserMoodHistory(testUserId, 1);

      expect(history).toHaveLength(1);
    });

    it('should return empty array for user with no entries', async () => {
      // Create another user
      const anotherUser = await prisma.user.create({
        data: {
          email: 'another@example.com',
          username: 'anotheruser',
          password: 'password',
          country: 'ES'
        }
      });

      const history = await moodAnalysisService.getUserMoodHistory(anotherUser.id);

      expect(history).toHaveLength(0);
    });
  });

  describe('getMoodTrends', () => {
    beforeEach(async () => {
      // Create test mood entries with different dates
      const now = new Date();
      const moodEntries = [
        {
          userId: testUserId,
          selectedEmotion: { id: 'happy', intensity: 4, label: 'Contento' },
          analysisResult: { overallSentiment: 'positive', riskLevel: 'low' },
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          userId: testUserId,
          selectedEmotion: { id: 'sad', intensity: 2, label: 'Triste' },
          analysisResult: { overallSentiment: 'negative', riskLevel: 'medium' },
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        {
          userId: testUserId,
          selectedEmotion: { id: 'neutral', intensity: 3, label: 'Neutral' },
          analysisResult: { overallSentiment: 'neutral', riskLevel: 'low' },
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      ];

      for (const entry of moodEntries) {
        await prisma.moodEntry.create({ data: entry as any });
      }
    });

    it('should calculate mood trends correctly', async () => {
      const trends = await moodAnalysisService.getMoodTrends(testUserId, 30);

      expect(trends.totalEntries).toBe(3);
      expect(trends.averageIntensity).toBe(3); // (4 + 2 + 3) / 3
      expect(trends.sentimentDistribution.positive).toBe(1);
      expect(trends.sentimentDistribution.negative).toBe(1);
      expect(trends.sentimentDistribution.neutral).toBe(1);
      expect(trends.riskLevelDistribution.low).toBe(2);
      expect(trends.riskLevelDistribution.medium).toBe(1);
      expect(trends.riskLevelDistribution.high).toBe(0);
    });

    it('should handle empty results', async () => {
      const trends = await moodAnalysisService.getMoodTrends(testUserId, 1); // Only 1 day, should be empty

      expect(trends.totalEntries).toBe(1); // Only the entry from 1 day ago
      expect(trends.averageIntensity).toBe(4);
    });
  });
});