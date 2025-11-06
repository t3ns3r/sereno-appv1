import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface MoodAnalysisRequest {
  userId: string;
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
  confidenceScore: number; // 0-1
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  followUpSuggestions: string[];
}

export interface MoodEntryWithAnalysis {
  id: string;
  userId: string;
  selectedEmotion: any;
  textDescription?: string;
  voiceRecordingUrl?: string;
  analysisResult: MoodAnalysisResult;
  createdAt: Date;
}

export class MoodAnalysisService {
  
  async analyzeMoodEntry(data: MoodAnalysisRequest): Promise<MoodEntryWithAnalysis> {
    try {
      // Perform mood analysis
      const analysisResult = await this.performMoodAnalysis(data);
      
      // Save mood entry with analysis
      const moodEntry = await prisma.moodEntry.create({
        data: {
          userId: data.userId,
          selectedEmotion: data.selectedEmotion,
          textDescription: data.textDescription,
          voiceRecordingUrl: data.voiceRecordingUrl,
          analysisResult: analysisResult as any
        }
      });

      return {
        id: moodEntry.id,
        userId: moodEntry.userId,
        selectedEmotion: moodEntry.selectedEmotion,
        textDescription: moodEntry.textDescription,
        voiceRecordingUrl: moodEntry.voiceRecordingUrl,
        analysisResult,
        createdAt: moodEntry.createdAt
      };
    } catch (error) {
      throw new AppError('Error analyzing mood entry', 500, 'MOOD_ANALYSIS_ERROR');
    }
  }

  private async performMoodAnalysis(data: MoodAnalysisRequest): Promise<MoodAnalysisResult> {
    // Basic sentiment analysis based on emotion intensity and text
    const emotionIntensity = data.selectedEmotion.intensity;
    let textSentiment = 'neutral';
    let keyEmotions: string[] = [data.selectedEmotion.label];
    
    // Analyze text description if provided
    if (data.textDescription) {
      textSentiment = this.analyzeTextSentiment(data.textDescription);
      keyEmotions = [...keyEmotions, ...this.extractKeyEmotions(data.textDescription)];
    }

    // Determine overall sentiment
    const overallSentiment = this.determineOverallSentiment(emotionIntensity, textSentiment);
    
    // Check emotion consistency
    const emotionConsistency = this.checkEmotionConsistency(
      data.selectedEmotion,
      textSentiment,
      data.textDescription
    );

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(
      emotionIntensity,
      textSentiment,
      emotionConsistency,
      !!data.textDescription
    );

    // Determine risk level
    const riskLevel = this.assessRiskLevel(emotionIntensity, textSentiment, data.textDescription);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overallSentiment,
      emotionIntensity,
      riskLevel
    );

    // Generate follow-up suggestions
    const followUpSuggestions = this.generateFollowUpSuggestions(
      overallSentiment,
      riskLevel,
      emotionConsistency
    );

    return {
      overallSentiment,
      emotionConsistency,
      keyEmotions: [...new Set(keyEmotions)], // Remove duplicates
      confidenceScore,
      recommendations,
      riskLevel,
      followUpSuggestions
    };
  }

  private analyzeTextSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Simple keyword-based sentiment analysis
    const positiveWords = [
      'feliz', 'contento', 'alegre', 'bien', 'genial', 'excelente', 'fantástico',
      'amor', 'paz', 'tranquilo', 'relajado', 'optimista', 'esperanza', 'gratitud'
    ];
    
    const negativeWords = [
      'triste', 'deprimido', 'ansioso', 'preocupado', 'estresado', 'agobiado',
      'mal', 'terrible', 'horrible', 'miedo', 'pánico', 'desesperado', 'solo',
      'vacío', 'perdido', 'confundido', 'frustrado', 'enojado', 'irritado'
    ];

    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveScore++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private extractKeyEmotions(text: string): string[] {
    const emotionKeywords = {
      'ansiedad': ['ansioso', 'nervioso', 'preocupado', 'estresado', 'agobiado'],
      'tristeza': ['triste', 'deprimido', 'melancólico', 'desanimado'],
      'alegría': ['feliz', 'contento', 'alegre', 'eufórico'],
      'miedo': ['miedo', 'pánico', 'terror', 'asustado'],
      'ira': ['enojado', 'furioso', 'irritado', 'molesto'],
      'confusión': ['confundido', 'perdido', 'desorientado'],
      'soledad': ['solo', 'aislado', 'abandonado'],
      'esperanza': ['esperanza', 'optimista', 'confiado']
    };

    const lowerText = text.toLowerCase();
    const foundEmotions: string[] = [];

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundEmotions.push(emotion);
      }
    });

    return foundEmotions;
  }

  private determineOverallSentiment(
    emotionIntensity: number,
    textSentiment: string
  ): 'positive' | 'neutral' | 'negative' {
    // Emotion intensity: 1-2 = negative, 3 = neutral, 4-5 = positive
    let emotionSentiment: 'positive' | 'neutral' | 'negative';
    
    if (emotionIntensity <= 2) emotionSentiment = 'negative';
    else if (emotionIntensity >= 4) emotionSentiment = 'positive';
    else emotionSentiment = 'neutral';

    // Combine emotion and text sentiment
    if (emotionSentiment === textSentiment) return emotionSentiment;
    
    // If they differ, prioritize the more extreme sentiment
    if (emotionSentiment === 'negative' || textSentiment === 'negative') return 'negative';
    if (emotionSentiment === 'positive' || textSentiment === 'positive') return 'positive';
    
    return 'neutral';
  }

  private checkEmotionConsistency(
    selectedEmotion: any,
    textSentiment: string,
    textDescription?: string
  ): 'consistent' | 'inconsistent' | 'unclear' {
    if (!textDescription) return 'unclear';

    const emotionIntensity = selectedEmotion.intensity;
    let expectedSentiment: string;

    if (emotionIntensity <= 2) expectedSentiment = 'negative';
    else if (emotionIntensity >= 4) expectedSentiment = 'positive';
    else expectedSentiment = 'neutral';

    if (expectedSentiment === textSentiment) return 'consistent';
    
    // Allow some flexibility for neutral emotions
    if (expectedSentiment === 'neutral') return 'consistent';
    
    return 'inconsistent';
  }

  private calculateConfidenceScore(
    emotionIntensity: number,
    textSentiment: string,
    emotionConsistency: string,
    hasTextDescription: boolean
  ): number {
    let score = 0.5; // Base score

    // Boost confidence if we have text description
    if (hasTextDescription) score += 0.2;

    // Boost confidence for consistent emotions
    if (emotionConsistency === 'consistent') score += 0.2;
    else if (emotionConsistency === 'inconsistent') score -= 0.1;

    // Boost confidence for extreme emotions (very clear sentiment)
    if (emotionIntensity === 1 || emotionIntensity === 5) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private assessRiskLevel(
    emotionIntensity: number,
    textSentiment: string,
    textDescription?: string
  ): 'low' | 'medium' | 'high' {
    // High risk indicators
    const highRiskKeywords = [
      'suicidio', 'matarme', 'no quiero vivir', 'acabar con todo',
      'desesperado', 'sin salida', 'no puedo más'
    ];

    const mediumRiskKeywords = [
      'deprimido', 'muy triste', 'sin esperanza', 'vacío',
      'no sirvo', 'inútil', 'solo', 'abandonado'
    ];

    if (textDescription) {
      const lowerText = textDescription.toLowerCase();
      
      if (highRiskKeywords.some(keyword => lowerText.includes(keyword))) {
        return 'high';
      }
      
      if (mediumRiskKeywords.some(keyword => lowerText.includes(keyword))) {
        return 'medium';
      }
    }

    // Risk based on emotion intensity
    if (emotionIntensity === 1 && textSentiment === 'negative') return 'medium';
    if (emotionIntensity <= 2) return 'medium';
    
    return 'low';
  }

  private generateRecommendations(
    overallSentiment: string,
    emotionIntensity: number,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('Considera contactar inmediatamente con un profesional de salud mental');
      recommendations.push('Usa el botón de pánico si necesitas ayuda urgente');
      recommendations.push('Habla con un SERENO de confianza');
    } else if (riskLevel === 'medium') {
      recommendations.push('Prueba algunos ejercicios de respiración para calmarte');
      recommendations.push('Considera hablar con un SERENO o amigo de confianza');
      recommendations.push('Dedica tiempo a actividades que te relajen');
    }

    if (overallSentiment === 'negative') {
      recommendations.push('Intenta hacer una actividad que disfrutes');
      recommendations.push('Sal a caminar o haz ejercicio ligero');
      recommendations.push('Practica técnicas de mindfulness');
    } else if (overallSentiment === 'positive') {
      recommendations.push('¡Mantén esa energía positiva!');
      recommendations.push('Comparte tu bienestar con otros en la comunidad');
      recommendations.push('Considera ayudar a otros que puedan necesitar apoyo');
    }

    if (emotionIntensity === 3) {
      recommendations.push('Explora qué actividades podrían mejorar tu ánimo');
      recommendations.push('Mantén una rutina saludable de sueño y alimentación');
    }

    return recommendations;
  }

  private generateFollowUpSuggestions(
    overallSentiment: string,
    riskLevel: string,
    emotionConsistency: string
  ): string[] {
    const suggestions: string[] = [];

    if (riskLevel === 'high') {
      suggestions.push('Seguimiento diario recomendado');
      suggestions.push('Contacto con profesional en 24-48 horas');
    } else if (riskLevel === 'medium') {
      suggestions.push('Seguimiento en 2-3 días');
      suggestions.push('Monitorear cambios en el estado de ánimo');
    } else {
      suggestions.push('Seguimiento semanal');
    }

    if (emotionConsistency === 'inconsistent') {
      suggestions.push('Explorar más a fondo los sentimientos mixtos');
      suggestions.push('Considerar una evaluación más detallada');
    }

    if (overallSentiment === 'positive') {
      suggestions.push('Continuar con las actividades que generan bienestar');
    }

    return suggestions;
  }

  async getUserMoodHistory(userId: string, limit: number = 10) {
    const moodEntries = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return moodEntries.map(entry => ({
      id: entry.id,
      selectedEmotion: entry.selectedEmotion,
      textDescription: entry.textDescription,
      analysisResult: entry.analysisResult,
      createdAt: entry.createdAt
    }));
  }

  async getMoodTrends(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate trends
    const trends = {
      averageIntensity: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      riskLevelDistribution: { low: 0, medium: 0, high: 0 },
      totalEntries: moodEntries.length
    };

    if (moodEntries.length > 0) {
      const intensities = moodEntries.map(entry => (entry.selectedEmotion as any).intensity);
      trends.averageIntensity = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;

      moodEntries.forEach(entry => {
        const analysis = entry.analysisResult as any;
        trends.sentimentDistribution[analysis.overallSentiment]++;
        trends.riskLevelDistribution[analysis.riskLevel]++;
      });
    }

    return trends;
  }
}