import React, { useState } from 'react';
import ProgressBar from './ProgressBar';
import SeniorButton from '../UI/SeniorButton';
import MentalHealthQuestionnaire from '../Assessment/MentalHealthQuestionnaire';
import RewardSystem from '../Rewards/RewardSystem';
import { anxietyQuestions, depressionQuestions } from '../../data/mentalHealthQuestions';

interface MentalHealthData {
  anxiety: { score: number; level: string; lastUpdate: string };
  depression: { score: number; level: string; lastUpdate: string };
  totalPoints: number;
  streak: number;
}

const MentalHealthTracker: React.FC = () => {
  const [showQuestionnaire, setShowQuestionnaire] = useState<'anxiety' | 'depression' | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [data, setData] = useState<MentalHealthData>({
    anxiety: { score: 8, level: 'Leve', lastUpdate: '2025-01-05' },
    depression: { score: 12, level: 'Moderado', lastUpdate: '2025-01-04' },
    totalPoints: 150,
    streak: 3
  });

  const handleQuestionnaireComplete = (
    type: 'anxiety' | 'depression',
    score: number,
    level: string,
    answers: Record<string, number>
  ) => {
    const newData = {
      ...data,
      [type]: {
        score,
        level,
        lastUpdate: new Date().toISOString().split('T')[0]
      },
      totalPoints: data.totalPoints + 25, // Points for completing assessment
      streak: data.streak + 1
    };
    
    setData(newData);
    setShowQuestionnaire(null);
    
    // Show rewards
    setTimeout(() => setShowRewards(true), 500);
  };

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'Mínimo': return 'success';
      case 'Leve': return 'info';
      case 'Moderado': return 'warning';
      case 'Severo': return 'error';
      default: return 'primary';
    }
  };

  const getProgressValue = (score: number, maxScore: number = 24) => {
    return 100 - (score / maxScore) * 100; // Inverted: lower score = better progress
  };

  const canTakeAssessment = (lastUpdate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return lastUpdate !== today;
  };

  const rewards = [
    {
      id: '1',
      title: 'Evaluación Completada',
      description: 'Has completado tu evaluación semanal',
      icon: '📋',
      points: 25,
      type: 'daily' as const
    },
    {
      id: '2',
      title: 'Constancia',
      description: `${data.streak} días consecutivos registrando tu estado`,
      icon: '🔥',
      points: data.streak * 5,
      type: 'achievement' as const
    }
  ];

  if (showRewards) {
    return (
      <RewardSystem
        rewards={rewards}
        totalPoints={data.totalPoints}
        onClose={() => setShowRewards(false)}
      />
    );
  }

  if (showQuestionnaire) {
    return (
      <MentalHealthQuestionnaire
        questions={showQuestionnaire === 'anxiety' ? anxietyQuestions : depressionQuestions}
        title={showQuestionnaire === 'anxiety' ? 'Evaluación de Ansiedad' : 'Evaluación de Depresión'}
        type={showQuestionnaire}
        onComplete={(score, level, answers) => 
          handleQuestionnaireComplete(showQuestionnaire, score, level, answers)
        }
        onCancel={() => setShowQuestionnaire(null)}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          📊 Seguimiento de Bienestar
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-orange-500">🔥</span>
          <span>{data.streak} días</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-6 mb-6">
        {/* Anxiety Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">😰 Nivel de Ansiedad</span>
            <span className={`text-sm px-2 py-1 rounded-full ${
              data.anxiety.level === 'Mínimo' ? 'bg-green-100 text-green-700' :
              data.anxiety.level === 'Leve' ? 'bg-blue-100 text-blue-700' :
              data.anxiety.level === 'Moderado' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {data.anxiety.level}
            </span>
          </div>
          <ProgressBar
            progress={getProgressValue(data.anxiety.score)}
            label=""
            color={getProgressColor(data.anxiety.level)}
            showPercentage={false}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Última evaluación: {data.anxiety.lastUpdate}</span>
            <span>Mejor ↑</span>
          </div>
        </div>

        {/* Depression Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">😔 Nivel de Depresión</span>
            <span className={`text-sm px-2 py-1 rounded-full ${
              data.depression.level === 'Mínimo' ? 'bg-green-100 text-green-700' :
              data.depression.level === 'Leve' ? 'bg-blue-100 text-blue-700' :
              data.depression.level === 'Moderado' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {data.depression.level}
            </span>
          </div>
          <ProgressBar
            progress={getProgressValue(data.depression.score)}
            label=""
            color={getProgressColor(data.depression.level)}
            showPercentage={false}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Última evaluación: {data.depression.lastUpdate}</span>
            <span>Mejor ↑</span>
          </div>
        </div>

        {/* Mindfulness/Mood Meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">🧘‍♀️ Mindfulness Diario</span>
            <span className="text-sm text-gray-600">75%</span>
          </div>
          <ProgressBar
            progress={75}
            label=""
            color="info"
            showPercentage={false}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Práctica regular de mindfulness</span>
            <span>Excelente ✨</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SeniorButton
          variant={canTakeAssessment(data.anxiety.lastUpdate) ? "primary" : "secondary"}
          fullWidth
          onClick={() => setShowQuestionnaire('anxiety')}
          disabled={!canTakeAssessment(data.anxiety.lastUpdate)}
        >
          {canTakeAssessment(data.anxiety.lastUpdate) ? '📋 Evaluar Ansiedad' : '✅ Ansiedad Evaluada Hoy'}
        </SeniorButton>
        
        <SeniorButton
          variant={canTakeAssessment(data.depression.lastUpdate) ? "primary" : "secondary"}
          fullWidth
          onClick={() => setShowQuestionnaire('depression')}
          disabled={!canTakeAssessment(data.depression.lastUpdate)}
        >
          {canTakeAssessment(data.depression.lastUpdate) ? '📋 Evaluar Depresión' : '✅ Depresión Evaluada Hoy'}
        </SeniorButton>
      </div>

      {/* Points Display */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-full">
          <span className="text-yellow-300">⭐</span>
          <span className="font-medium">{data.totalPoints} Puntos de Bienestar</span>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthTracker;