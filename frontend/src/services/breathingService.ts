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

export interface BreathingConfiguration {
  name: string;
  inhaleTime: number;
  holdTime: number;
  exhaleTime: number;
  cycles: number;
  description?: string;
}

export interface BreathingExerciseData {
  configuration: BreathingConfiguration;
  duration: number; // in seconds
}

export interface BreathingExerciseResult {
  id: string;
  userId: string;
  configuration: BreathingConfiguration;
  duration: number;
  completedAt: string;
  benefits: string[];
  recommendations: string[];
}

export interface BreathingStats {
  totalSessions: number;
  totalDuration: number; // in minutes
  averageSessionDuration: number; // in minutes
  favoriteConfiguration: string;
  weeklyProgress: {
    week: string;
    sessions: number;
    duration: number;
  }[];
  streakDays: number;
}

export interface BreathingHistory {
  id: string;
  configuration: BreathingConfiguration;
  duration: number;
  completedAt: string;
}

export class BreathingService {
  
  async recordBreathingExercise(data: BreathingExerciseData): Promise<BreathingExerciseResult> {
    try {
      const response = await apiClient.post('/breathing/exercise', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error recording breathing exercise:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al guardar el ejercicio de respiración'
      );
    }
  }

  async getBreathingHistory(limit: number = 10): Promise<BreathingHistory[]> {
    try {
      const response = await apiClient.get(`/breathing/history?limit=${limit}`);
      return response.data.data.exercises;
    } catch (error: any) {
      console.error('Error fetching breathing history:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al obtener el historial de respiración'
      );
    }
  }

  async getBreathingStats(days: number = 30): Promise<BreathingStats> {
    try {
      const response = await apiClient.get(`/breathing/stats?days=${days}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching breathing stats:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al obtener las estadísticas de respiración'
      );
    }
  }

  async getBreathingConfigurations(): Promise<{
    popular: { name: string; usage: number; avgDuration: number }[];
    default: BreathingConfiguration[];
  }> {
    try {
      const response = await apiClient.get('/breathing/configurations');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching breathing configurations:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al obtener las configuraciones de respiración'
      );
    }
  }

  async validateConfiguration(configuration: BreathingConfiguration): Promise<{
    configuration: BreathingConfiguration;
    estimatedDuration: number;
    estimatedMinutes: number;
    difficulty: string;
    benefits: string[];
  }> {
    try {
      const response = await apiClient.post('/breathing/validate', { configuration });
      return response.data.data;
    } catch (error: any) {
      console.error('Error validating configuration:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Error al validar la configuración'
      );
    }
  }

  // Local utility functions
  calculateDuration(config: BreathingConfiguration): number {
    return (config.inhaleTime + config.holdTime + config.exhaleTime) * config.cycles;
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}min`;
    } else {
      return `${minutes}min ${remainingSeconds}s`;
    }
  }

  getDifficultyLevel(config: BreathingConfiguration): 'Principiante' | 'Intermedio' | 'Avanzado' {
    const totalTime = config.inhaleTime + config.holdTime + config.exhaleTime;
    const totalDuration = this.calculateDuration(config);
    
    if (totalTime <= 10 && config.cycles <= 5) return 'Principiante';
    if (totalTime <= 15 && config.cycles <= 10) return 'Intermedio';
    return 'Avanzado';
  }

  getConfigurationBenefits(config: BreathingConfiguration): string[] {
    const benefits: string[] = ['Reducción del estrés y la ansiedad'];
    
    if (config.holdTime >= 4) {
      benefits.push('Mejora de la capacidad pulmonar');
      benefits.push('Mayor control respiratorio');
    }
    
    if (config.exhaleTime > config.inhaleTime) {
      benefits.push('Activación del sistema nervioso parasimpático');
      benefits.push('Reducción de la frecuencia cardíaca');
    }
    
    if (config.cycles >= 8) {
      benefits.push('Meditación profunda');
      benefits.push('Mayor conciencia corporal');
    }
    
    const totalTime = config.inhaleTime + config.holdTime + config.exhaleTime;
    if (totalTime >= 12) {
      benefits.push('Práctica de mindfulness');
    }
    
    return benefits;
  }

  getRecommendedConfigurations(): BreathingConfiguration[] {
    return [
      {
        name: "Relajación para Principiantes",
        inhaleTime: 3,
        holdTime: 3,
        exhaleTime: 3,
        cycles: 5,
        description: "Perfecta para comenzar tu práctica de respiración"
      },
      {
        name: "Relajación Básica",
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 5,
        cycles: 8,
        description: "Configuración equilibrada para uso diario"
      },
      {
        name: "Calma Rápida",
        inhaleTime: 3,
        holdTime: 3,
        exhaleTime: 6,
        cycles: 6,
        description: "Ideal para momentos de estrés agudo"
      },
      {
        name: "Técnica 4-7-8 (Anti-ansiedad)",
        inhaleTime: 4,
        holdTime: 7,
        exhaleTime: 8,
        cycles: 8,
        description: "Técnica específica para reducir la ansiedad"
      },
      {
        name: "Respiración Cuadrada",
        inhaleTime: 4,
        holdTime: 4,
        exhaleTime: 4,
        cycles: 10,
        description: "Patrón simétrico para equilibrio mental"
      },
      {
        name: "Respiración Profunda",
        inhaleTime: 6,
        holdTime: 4,
        exhaleTime: 8,
        cycles: 5,
        description: "Para relajación profunda y meditación"
      },
      {
        name: "Respiración Energizante",
        inhaleTime: 6,
        holdTime: 2,
        exhaleTime: 4,
        cycles: 12,
        description: "Para aumentar la energía y el enfoque"
      },
      {
        name: "Respiración Nocturna",
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 8,
        cycles: 6,
        description: "Perfecta para prepararse para dormir"
      }
    ];
  }

  getConfigurationForMood(mood: 'anxious' | 'stressed' | 'tired' | 'energetic' | 'neutral'): BreathingConfiguration {
    const configurations = this.getRecommendedConfigurations();
    
    switch (mood) {
      case 'anxious':
        return configurations.find(c => c.name.includes('4-7-8')) || configurations[3];
      case 'stressed':
        return configurations.find(c => c.name.includes('Calma Rápida')) || configurations[2];
      case 'tired':
        return configurations.find(c => c.name.includes('Energizante')) || configurations[6];
      case 'energetic':
        return configurations.find(c => c.name.includes('Profunda')) || configurations[5];
      default:
        return configurations[1]; // Relajación Básica
    }
  }

  // Generate insights based on breathing history
  generateInsights(history: BreathingHistory[]): {
    consistency: 'excellent' | 'good' | 'needs_improvement';
    favoriteTime: string;
    progressTrend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  } {
    if (history.length === 0) {
      return {
        consistency: 'needs_improvement',
        favoriteTime: 'unknown',
        progressTrend: 'stable',
        recommendations: [
          'Comienza con sesiones cortas de 5 minutos',
          'Establece un horario fijo para practicar',
          'Prueba diferentes configuraciones para encontrar tu favorita'
        ]
      };
    }

    // Analyze consistency (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentExercises = history.filter(ex => new Date(ex.completedAt) >= lastWeek);
    
    let consistency: 'excellent' | 'good' | 'needs_improvement';
    if (recentExercises.length >= 5) consistency = 'excellent';
    else if (recentExercises.length >= 3) consistency = 'good';
    else consistency = 'needs_improvement';

    // Analyze favorite time
    const timeFrequency: { [key: string]: number } = {};
    history.forEach(ex => {
      const hour = new Date(ex.completedAt).getHours();
      let timeSlot: string;
      
      if (hour >= 6 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
      else if (hour >= 18 && hour < 22) timeSlot = 'evening';
      else timeSlot = 'night';
      
      timeFrequency[timeSlot] = (timeFrequency[timeSlot] || 0) + 1;
    });
    
    const favoriteTime = Object.entries(timeFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

    // Analyze progress trend
    const midPoint = Math.floor(history.length / 2);
    const recentHalf = history.slice(0, midPoint);
    const olderHalf = history.slice(midPoint);
    
    const recentAvgDuration = recentHalf.length > 0 
      ? recentHalf.reduce((sum, ex) => sum + ex.duration, 0) / recentHalf.length
      : 0;
    const olderAvgDuration = olderHalf.length > 0
      ? olderHalf.reduce((sum, ex) => sum + ex.duration, 0) / olderHalf.length
      : 0;
    
    let progressTrend: 'improving' | 'stable' | 'declining';
    const trendDiff = recentAvgDuration - olderAvgDuration;
    
    if (trendDiff > 60) progressTrend = 'improving'; // 1+ minute improvement
    else if (trendDiff < -60) progressTrend = 'declining';
    else progressTrend = 'stable';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (consistency === 'needs_improvement') {
      recommendations.push('Intenta practicar más regularmente');
      recommendations.push('Incluso 5 minutos diarios pueden hacer la diferencia');
    } else if (consistency === 'excellent') {
      recommendations.push('¡Excelente consistencia! Sigue así');
      recommendations.push('Considera probar configuraciones más avanzadas');
    }
    
    if (progressTrend === 'improving') {
      recommendations.push('Tu duración de práctica está mejorando');
    } else if (progressTrend === 'declining') {
      recommendations.push('Intenta mantener sesiones más largas');
    }
    
    const avgDuration = history.reduce((sum, ex) => sum + ex.duration, 0) / history.length;
    if (avgDuration < 300) { // Less than 5 minutes
      recommendations.push('Intenta extender gradualmente tus sesiones');
    }

    return {
      consistency,
      favoriteTime,
      progressTrend,
      recommendations: recommendations.slice(0, 3)
    };
  }
}

export const breathingService = new BreathingService();