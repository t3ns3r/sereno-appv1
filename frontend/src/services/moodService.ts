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

export interface MoodAssessmentData {
  selectedEmotion: {
    id: string;
    emoji: string;
    label: string;
    description: string;
    intensity: number;
  };
  textDescription?: string;
  voiceRecordingUrl?: string;
}

export interface MoodAnalysisResult {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  emotionConsistency: 'consistent' | 'inconsistent' | 'unclear';
  keyEmotions: string[];
  confidenceScore: number;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  followUpSuggestions: string[];
}

export interface MoodEntry {
  id: string;
  userId: string;
  selectedEmotion: any;
  textDescription?: string;
  voiceRecordingUrl?: string;
  analysisResult: MoodAnalysisResult;
  createdAt: string;
}

export interface MoodTrends {
  averageIntensity: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  riskLevelDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  totalEntries: number;
}

export class MoodService {
  
  async submitMoodAssessment(data: MoodAssessmentData): Promise<MoodEntry> {
    try {
      const response = await apiClient.post('/mood/assessment', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error submitting mood assessment:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al enviar la evaluación de ánimo'
      );
    }
  }

  async getMoodHistory(limit: number = 10): Promise<MoodEntry[]> {
    try {
      const response = await apiClient.get(`/mood/history?limit=${limit}`);
      return response.data.data.entries;
    } catch (error: any) {
      console.error('Error fetching mood history:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al obtener el historial de ánimo'
      );
    }
  }

  async getMoodTrends(days: number = 30): Promise<MoodTrends> {
    try {
      const response = await apiClient.get(`/mood/trends?days=${days}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching mood trends:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al obtener las tendencias de ánimo'
      );
    }
  }

  async analyzeMood(data: MoodAssessmentData): Promise<MoodAnalysisResult> {
    try {
      const response = await apiClient.post('/mood/analyze', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error analyzing mood:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al analizar el estado de ánimo'
      );
    }
  }

  // Upload voice recording (placeholder for future implementation)
  async uploadVoiceRecording(audioBlob: Blob): Promise<string> {
    try {
      // TODO: Implement actual file upload to cloud storage
      // For now, return a mock URL
      const mockUrl = `voice-recording-${Date.now()}.webm`;
      console.log('Voice recording would be uploaded:', audioBlob);
      return mockUrl;
    } catch (error) {
      console.error('Error uploading voice recording:', error);
      throw new Error('Error al subir la grabación de voz');
    }
  }

  // Get mood insights based on recent entries
  getMoodInsights(entries: MoodEntry[]): {
    recentTrend: 'improving' | 'stable' | 'declining';
    averageIntensity: number;
    mostCommonEmotion: string;
    riskAlert: boolean;
  } {
    if (entries.length === 0) {
      return {
        recentTrend: 'stable',
        averageIntensity: 3,
        mostCommonEmotion: 'neutral',
        riskAlert: false
      };
    }

    // Calculate average intensity
    const intensities = entries.map(entry => entry.selectedEmotion.intensity);
    const averageIntensity = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;

    // Determine trend (compare first half vs second half)
    const midPoint = Math.floor(entries.length / 2);
    const recentEntries = entries.slice(0, midPoint);
    const olderEntries = entries.slice(midPoint);

    const recentAvg = recentEntries.length > 0 
      ? recentEntries.reduce((sum, entry) => sum + entry.selectedEmotion.intensity, 0) / recentEntries.length
      : averageIntensity;
    
    const olderAvg = olderEntries.length > 0
      ? olderEntries.reduce((sum, entry) => sum + entry.selectedEmotion.intensity, 0) / olderEntries.length
      : averageIntensity;

    let recentTrend: 'improving' | 'stable' | 'declining';
    const trendDiff = recentAvg - olderAvg;
    
    if (trendDiff > 0.5) recentTrend = 'improving';
    else if (trendDiff < -0.5) recentTrend = 'declining';
    else recentTrend = 'stable';

    // Find most common emotion
    const emotionCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      const emotion = entry.selectedEmotion.label;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    const mostCommonEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    // Check for risk alerts
    const riskAlert = entries.some(entry => 
      entry.analysisResult.riskLevel === 'high' || 
      (entry.analysisResult.riskLevel === 'medium' && entry.selectedEmotion.intensity <= 2)
    );

    return {
      recentTrend,
      averageIntensity,
      mostCommonEmotion,
      riskAlert
    };
  }

  // Generate personalized recommendations based on mood patterns
  generatePersonalizedRecommendations(entries: MoodEntry[]): string[] {
    if (entries.length === 0) {
      return [
        'Comienza registrando tu estado de ánimo diariamente',
        'Explora los ejercicios de respiración disponibles',
        'Únete a actividades de la comunidad'
      ];
    }

    const insights = this.getMoodInsights(entries);
    const recommendations: string[] = [];

    if (insights.riskAlert) {
      recommendations.push('Considera hablar con un profesional de salud mental');
      recommendations.push('Usa el sistema de apoyo de SERENOS cuando lo necesites');
    }

    if (insights.recentTrend === 'declining') {
      recommendations.push('Prueba ejercicios de respiración para reducir el estrés');
      recommendations.push('Mantén una rutina de sueño regular');
      recommendations.push('Considera actividades físicas ligeras como caminar');
    } else if (insights.recentTrend === 'improving') {
      recommendations.push('¡Sigue así! Mantén las actividades que te están ayudando');
      recommendations.push('Comparte tu progreso con la comunidad');
    }

    if (insights.averageIntensity < 3) {
      recommendations.push('Explora contenido educativo sobre manejo del estrés');
      recommendations.push('Participa en actividades grupales de bienestar');
    }

    // Add general recommendations if we don't have enough specific ones
    if (recommendations.length < 3) {
      recommendations.push('Mantén un registro regular de tu estado de ánimo');
      recommendations.push('Practica técnicas de mindfulness');
      recommendations.push('Conecta con otros miembros de la comunidad');
    }

    return recommendations.slice(0, 5); // Return max 5 recommendations
  }
}

export const moodService = new MoodService();