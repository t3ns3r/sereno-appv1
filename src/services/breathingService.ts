import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface BreathingExerciseRequest {
  userId: string;
  configuration: {
    name: string;
    inhaleTime: number;
    holdTime: number;
    exhaleTime: number;
    cycles: number;
  };
  duration: number; // in seconds
  completedAt?: Date;
}

export interface BreathingExerciseResponse {
  id: string;
  userId: string;
  configuration: any;
  duration: number;
  completedAt: Date;
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

export class BreathingService {

  async recordBreathingExercise(data: BreathingExerciseRequest): Promise<BreathingExerciseResponse> {
    try {
      // Validate configuration
      this.validateConfiguration(data.configuration);

      // Create breathing exercise record
      const exercise = await prisma.breathingExercise.create({
        data: {
          userId: data.userId,
          configuration: data.configuration,
          duration: data.duration,
          completedAt: data.completedAt || new Date()
        }
      });

      // Generate benefits and recommendations
      const benefits = this.generateBenefits(data.configuration, data.duration);
      const recommendations = this.generateRecommendations(data.userId, data.configuration);

      return {
        id: exercise.id,
        userId: exercise.userId,
        configuration: exercise.configuration,
        duration: exercise.duration,
        completedAt: exercise.completedAt,
        benefits,
        recommendations: await recommendations
      };
    } catch (error) {
      throw new AppError('Error recording breathing exercise', 500, 'BREATHING_RECORD_ERROR');
    }
  }

  private validateConfiguration(config: any): void {
    if (!config.name || typeof config.name !== 'string') {
      throw new AppError('Configuration name is required', 400, 'INVALID_CONFIG');
    }
    
    if (!config.inhaleTime || config.inhaleTime < 1 || config.inhaleTime > 15) {
      throw new AppError('Inhale time must be between 1 and 15 seconds', 400, 'INVALID_CONFIG');
    }
    
    if (config.holdTime < 0 || config.holdTime > 20) {
      throw new AppError('Hold time must be between 0 and 20 seconds', 400, 'INVALID_CONFIG');
    }
    
    if (!config.exhaleTime || config.exhaleTime < 1 || config.exhaleTime > 20) {
      throw new AppError('Exhale time must be between 1 and 20 seconds', 400, 'INVALID_CONFIG');
    }
    
    if (!config.cycles || config.cycles < 1 || config.cycles > 20) {
      throw new AppError('Cycles must be between 1 and 20', 400, 'INVALID_CONFIG');
    }
  }

  private generateBenefits(config: any, duration: number): string[] {
    const benefits: string[] = [];
    
    // Base benefits for all breathing exercises
    benefits.push('Reducción del estrés y la ansiedad');
    benefits.push('Mejora de la concentración');
    
    // Duration-based benefits
    if (duration >= 300) { // 5+ minutes
      benefits.push('Relajación profunda del sistema nervioso');
      benefits.push('Mejora de la calidad del sueño');
    }
    
    if (duration >= 600) { // 10+ minutes
      benefits.push('Reducción significativa de la presión arterial');
      benefits.push('Fortalecimiento del sistema inmunológico');
    }

    // Configuration-specific benefits
    const totalCycleTime = config.inhaleTime + config.holdTime + config.exhaleTime;
    
    if (config.holdTime >= 4) {
      benefits.push('Mejora de la capacidad pulmonar');
      benefits.push('Mayor control sobre la respiración');
    }
    
    if (config.exhaleTime > config.inhaleTime) {
      benefits.push('Activación del sistema nervioso parasimpático');
      benefits.push('Reducción de la frecuencia cardíaca');
    }
    
    if (totalCycleTime >= 12) {
      benefits.push('Meditación activa y mindfulness');
      benefits.push('Mayor conciencia corporal');
    }

    return benefits;
  }

  private async generateRecommendations(userId: string, config: any): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Get user's recent breathing exercises
    const recentExercises = await prisma.breathingExercise.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10
    });

    // Analyze patterns and generate recommendations
    if (recentExercises.length === 0) {
      recommendations.push('¡Excelente! Has comenzado tu práctica de respiración');
      recommendations.push('Intenta hacer ejercicios de respiración diariamente');
      recommendations.push('Comienza con sesiones cortas y aumenta gradualmente');
    } else {
      // Check frequency
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const weeklyExercises = recentExercises.filter(ex => ex.completedAt >= lastWeek);
      
      if (weeklyExercises.length >= 5) {
        recommendations.push('¡Fantástico! Mantienes una práctica constante');
        recommendations.push('Considera probar configuraciones más avanzadas');
      } else if (weeklyExercises.length >= 2) {
        recommendations.push('Buen progreso, intenta ser más constante');
        recommendations.push('Establece un horario fijo para tus ejercicios');
      } else {
        recommendations.push('Intenta practicar más regularmente');
        recommendations.push('Incluso 5 minutos diarios pueden hacer la diferencia');
      }

      // Analyze preferred configurations
      const configNames = recentExercises.map(ex => (ex.configuration as any).name);
      const mostUsed = this.getMostFrequent(configNames);
      
      if (mostUsed && mostUsed !== config.name) {
        recommendations.push(`Parece que prefieres "${mostUsed}"`);
        recommendations.push('Experimenta con diferentes técnicas para mayor beneficio');
      }

      // Duration recommendations
      const avgDuration = recentExercises.reduce((sum, ex) => sum + ex.duration, 0) / recentExercises.length;
      
      if (avgDuration < 300) { // Less than 5 minutes
        recommendations.push('Intenta extender tus sesiones gradualmente');
        recommendations.push('Sesiones más largas proporcionan mayores beneficios');
      } else if (avgDuration > 900) { // More than 15 minutes
        recommendations.push('¡Excelente duración de práctica!');
        recommendations.push('Considera enseñar a otros o explorar meditación avanzada');
      }
    }

    // Time-based recommendations
    const currentHour = new Date().getHours();
    
    if (currentHour >= 6 && currentHour <= 9) {
      recommendations.push('Perfecto momento para energizar tu día');
      recommendations.push('Los ejercicios matutinos mejoran el enfoque');
    } else if (currentHour >= 18 && currentHour <= 22) {
      recommendations.push('Ideal para relajarte después del día');
      recommendations.push('Esto te ayudará a dormir mejor');
    } else if (currentHour >= 22 || currentHour <= 5) {
      recommendations.push('Excelente para prepararte para el descanso');
      recommendations.push('Evita ejercicios muy energizantes a esta hora');
    }

    return recommendations.slice(0, 4); // Return max 4 recommendations
  }

  private getMostFrequent(arr: string[]): string | null {
    if (arr.length === 0) return null;
    
    const frequency: { [key: string]: number } = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  async getUserBreathingStats(userId: string, days: number = 30): Promise<BreathingStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const exercises = await prisma.breathingExercise.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate
        }
      },
      orderBy: { completedAt: 'asc' }
    });

    const totalSessions = exercises.length;
    const totalDuration = Math.round(exercises.reduce((sum, ex) => sum + ex.duration, 0) / 60); // Convert to minutes
    const averageSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    // Find favorite configuration
    const configNames = exercises.map(ex => (ex.configuration as any).name);
    const favoriteConfiguration = this.getMostFrequent(configNames) || 'Ninguna';

    // Calculate weekly progress
    const weeklyProgress = this.calculateWeeklyProgress(exercises);

    // Calculate streak
    const streakDays = await this.calculateStreakDays(userId);

    return {
      totalSessions,
      totalDuration,
      averageSessionDuration,
      favoriteConfiguration,
      weeklyProgress,
      streakDays
    };
  }

  private calculateWeeklyProgress(exercises: any[]): { week: string; sessions: number; duration: number; }[] {
    const weeks: { [key: string]: { sessions: number; duration: number } } = {};
    
    exercises.forEach(exercise => {
      const date = new Date(exercise.completedAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { sessions: 0, duration: 0 };
      }
      
      weeks[weekKey].sessions++;
      weeks[weekKey].duration += Math.round(exercise.duration / 60); // Convert to minutes
    });

    return Object.entries(weeks)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-4); // Last 4 weeks
  }

  private async calculateStreakDays(userId: string): Promise<number> {
    const exercises = await prisma.breathingExercise.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 30 // Check last 30 days
    });

    if (exercises.length === 0) return 0;

    // Group exercises by date
    const exercisesByDate: { [key: string]: boolean } = {};
    exercises.forEach(exercise => {
      const date = exercise.completedAt.toISOString().split('T')[0];
      exercisesByDate[date] = true;
    });

    // Calculate consecutive days from today backwards
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      if (exercisesByDate[dateKey]) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today) if no exercise yet
        break;
      }
    }

    return streak;
  }

  async getBreathingHistory(userId: string, limit: number = 10) {
    const exercises = await prisma.breathingExercise.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: limit
    });

    return exercises.map(exercise => ({
      id: exercise.id,
      configuration: exercise.configuration,
      duration: exercise.duration,
      completedAt: exercise.completedAt
    }));
  }

  async getPopularConfigurations(): Promise<{ name: string; usage: number; avgDuration: number }[]> {
    const exercises = await prisma.breathingExercise.findMany({
      select: {
        configuration: true,
        duration: true
      }
    });

    const configStats: { [key: string]: { count: number; totalDuration: number } } = {};
    
    exercises.forEach(exercise => {
      const name = (exercise.configuration as any).name;
      if (!configStats[name]) {
        configStats[name] = { count: 0, totalDuration: 0 };
      }
      configStats[name].count++;
      configStats[name].totalDuration += exercise.duration;
    });

    return Object.entries(configStats)
      .map(([name, stats]) => ({
        name,
        usage: stats.count,
        avgDuration: Math.round(stats.totalDuration / stats.count / 60) // Convert to minutes
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }
}