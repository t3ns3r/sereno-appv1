import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MoodFeedback from '../MoodFeedback';
import { MoodAnalysisResult } from '../../../services/moodService';

describe('MoodFeedback', () => {
  const mockSelectedEmotion = {
    emoji: '😊',
    label: 'Contento',
    description: 'Me siento bien y positivo',
    intensity: 4
  };

  const mockPositiveAnalysis: MoodAnalysisResult = {
    overallSentiment: 'positive',
    emotionConsistency: 'consistent',
    keyEmotions: ['alegría', 'optimismo'],
    confidenceScore: 0.85,
    recommendations: [
      '¡Mantén esa energía positiva!',
      'Comparte tu bienestar con otros en la comunidad'
    ],
    riskLevel: 'low',
    followUpSuggestions: [
      'Seguimiento semanal',
      'Continuar con las actividades que generan bienestar'
    ]
  };

  const mockNegativeAnalysis: MoodAnalysisResult = {
    overallSentiment: 'negative',
    emotionConsistency: 'consistent',
    keyEmotions: ['tristeza', 'ansiedad'],
    confidenceScore: 0.75,
    recommendations: [
      'Prueba algunos ejercicios de respiración para calmarte',
      'Considera hablar con un SERENO o amigo de confianza'
    ],
    riskLevel: 'medium',
    followUpSuggestions: [
      'Seguimiento en 2-3 días',
      'Monitorear cambios en el estado de ánimo'
    ]
  };

  const mockHighRiskAnalysis: MoodAnalysisResult = {
    overallSentiment: 'negative',
    emotionConsistency: 'consistent',
    keyEmotions: ['desesperación', 'tristeza'],
    confidenceScore: 0.90,
    recommendations: [
      'Considera contactar inmediatamente con un profesional de salud mental',
      'Usa el botón de pánico si necesitas ayuda urgente'
    ],
    riskLevel: 'high',
    followUpSuggestions: [
      'Seguimiento diario recomendado',
      'Contacto con profesional en 24-48 horas'
    ]
  };

  it('renders mood analysis summary correctly', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    expect(screen.getByText('Análisis de tu estado de ánimo')).toBeInTheDocument();
    expect(screen.getByText('Contento')).toBeInTheDocument();
    expect(screen.getByText('Intensidad: 4/5')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
  });

  it('displays positive sentiment correctly', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    expect(screen.getByText('Sentimiento general')).toBeInTheDocument();
    expect(screen.getByText('Tu estado de ánimo general es positivo 😊')).toBeInTheDocument();
  });

  it('displays negative sentiment correctly', () => {
    render(
      <MoodFeedback 
        analysis={mockNegativeAnalysis}
        selectedEmotion={{
          ...mockSelectedEmotion,
          emoji: '😢',
          label: 'Triste',
          intensity: 2
        }}
      />
    );

    expect(screen.getByText('Tu estado de ánimo general necesita atención 😔')).toBeInTheDocument();
  });

  it('shows risk level alert for medium and high risk', () => {
    render(
      <MoodFeedback 
        analysis={mockNegativeAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    expect(screen.getByText('Nivel de atención')).toBeInTheDocument();
    expect(screen.getByText('Medio - Considera buscar apoyo')).toBeInTheDocument();
  });

  it('shows high risk alert with appropriate styling', () => {
    render(
      <MoodFeedback 
        analysis={mockHighRiskAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    expect(screen.getByText('Alto - Necesitas apoyo inmediato')).toBeInTheDocument();
  });

  it('does not show risk alert for low risk', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    expect(screen.queryByText('Nivel de atención')).not.toBeInTheDocument();
  });

  it('displays recommendations correctly', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    expect(screen.getByText('Recomendaciones personalizadas')).toBeInTheDocument();
    expect(screen.getByText('¡Mantén esa energía positiva!')).toBeInTheDocument();
    expect(screen.getByText('Comparte tu bienestar con otros en la comunidad')).toBeInTheDocument();
  });

  it('numbers recommendations correctly', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    const recommendationNumbers = screen.getAllByText(/^[1-2]$/);
    expect(recommendationNumbers).toHaveLength(2);
    expect(recommendationNumbers[0]).toHaveTextContent('1');
    expect(recommendationNumbers[1]).toHaveTextContent('2');
  });

  it('shows detailed analysis when showDetailed is true', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
        showDetailed={true}
      />
    );

    expect(screen.getByText('Análisis detallado')).toBeInTheDocument();
    expect(screen.getByText('Emociones identificadas')).toBeInTheDocument();
    expect(screen.getByText('Coherencia emocional')).toBeInTheDocument();
    expect(screen.getByText('Confianza del análisis')).toBeInTheDocument();
  });

  it('displays key emotions as tags', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
        showDetailed={true}
      />
    );

    expect(screen.getByText('alegría')).toBeInTheDocument();
    expect(screen.getByText('optimismo')).toBeInTheDocument();
  });

  it('shows confidence score as percentage and progress bar', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
        showDetailed={true}
      />
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays emotion consistency messages correctly', () => {
    const consistentAnalysis = { ...mockPositiveAnalysis, emotionConsistency: 'consistent' as const };
    const { rerender } = render(
      <MoodFeedback 
        analysis={consistentAnalysis}
        selectedEmotion={mockSelectedEmotion}
        showDetailed={true}
      />
    );

    expect(screen.getByText('Tus emociones y descripción son coherentes')).toBeInTheDocument();

    const inconsistentAnalysis = { ...mockPositiveAnalysis, emotionConsistency: 'inconsistent' as const };
    rerender(
      <MoodFeedback 
        analysis={inconsistentAnalysis}
        selectedEmotion={mockSelectedEmotion}
        showDetailed={true}
      />
    );

    expect(screen.getByText('Hay algunas diferencias entre tu selección y descripción')).toBeInTheDocument();

    const unclearAnalysis = { ...mockPositiveAnalysis, emotionConsistency: 'unclear' as const };
    rerender(
      <MoodFeedback 
        analysis={unclearAnalysis}
        selectedEmotion={mockSelectedEmotion}
        showDetailed={true}
      />
    );

    expect(screen.getByText('Necesitamos más información para evaluar')).toBeInTheDocument();
  });

  it('shows follow-up suggestions', () => {
    render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    expect(screen.getByText('Próximos pasos')).toBeInTheDocument();
    expect(screen.getByText('Seguimiento semanal')).toBeInTheDocument();
    expect(screen.getByText('Continuar con las actividades que generan bienestar')).toBeInTheDocument();
  });

  it('does not show sections when data is empty', () => {
    const emptyAnalysis: MoodAnalysisResult = {
      overallSentiment: 'neutral',
      emotionConsistency: 'unclear',
      keyEmotions: [],
      confidenceScore: 0.5,
      recommendations: [],
      riskLevel: 'low',
      followUpSuggestions: []
    };

    render(
      <MoodFeedback 
        analysis={emptyAnalysis}
        selectedEmotion={mockSelectedEmotion}
        showDetailed={true}
      />
    );

    expect(screen.queryByText('Recomendaciones personalizadas')).not.toBeInTheDocument();
    expect(screen.queryByText('Próximos pasos')).not.toBeInTheDocument();
    expect(screen.queryByText('Emociones identificadas')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for different sentiments', () => {
    const { rerender } = render(
      <MoodFeedback 
        analysis={mockPositiveAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    // Check positive sentiment styling
    const positiveElement = screen.getByText('Tu estado de ánimo general es positivo 😊').closest('div');
    expect(positiveElement).toHaveClass('text-green-600', 'bg-green-50', 'border-green-200');

    // Check negative sentiment styling
    rerender(
      <MoodFeedback 
        analysis={mockNegativeAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    const negativeElement = screen.getByText('Tu estado de ánimo general necesita atención 😔').closest('div');
    expect(negativeElement).toHaveClass('text-red-600', 'bg-red-50', 'border-red-200');
  });

  it('applies correct CSS classes for different risk levels', () => {
    render(
      <MoodFeedback 
        analysis={mockHighRiskAnalysis}
        selectedEmotion={mockSelectedEmotion}
      />
    );

    const riskElement = screen.getByText('Alto - Necesitas apoyo inmediato').closest('div');
    expect(riskElement).toHaveClass('text-red-700', 'bg-red-100', 'border-red-300');
  });
});