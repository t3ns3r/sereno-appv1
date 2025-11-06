import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  HeartIcon, 
  LightBulbIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import SeniorCard from '../UI/SeniorCard';
import { MoodAnalysisResult } from '../../services/moodService';

interface MoodFeedbackProps {
  analysis: MoodAnalysisResult;
  selectedEmotion: {
    emoji: string;
    label: string;
    description: string;
    intensity: number;
  };
  showDetailed?: boolean;
}

const MoodFeedback: React.FC<MoodFeedbackProps> = ({
  analysis,
  selectedEmotion,
  showDetailed = false
}) => {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-700 bg-red-100 border-red-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default: return 'text-green-700 bg-green-100 border-green-300';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'medium': return <ExclamationTriangleIcon className="w-5 h-5" />;
      default: return <CheckCircleIcon className="w-5 h-5" />;
    }
  };

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'Alto - Necesitas apoyo inmediato';
      case 'medium': return 'Medio - Considera buscar apoyo';
      default: return 'Bajo - Estás manejando bien las cosas';
    }
  };

  const getConsistencyText = (consistency: string) => {
    switch (consistency) {
      case 'consistent': return 'Tus emociones y descripción son coherentes';
      case 'inconsistent': return 'Hay algunas diferencias entre tu selección y descripción';
      default: return 'Necesitamos más información para evaluar';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Analysis Summary */}
      <SeniorCard 
        title="Análisis de tu estado de ánimo"
        icon={<HeartIcon className="w-6 h-6 text-primary-500" />}
        variant="gradient"
      >
        <div className="space-y-4">
          {/* Emotion Summary */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
            <span className="text-4xl">{selectedEmotion.emoji}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedEmotion.label}
              </h3>
              <p className="text-sm text-gray-600">
                Intensidad: {selectedEmotion.intensity}/5
              </p>
            </div>
          </div>

          {/* Overall Sentiment */}
          <div className={`p-4 rounded-lg border ${getSentimentColor(analysis.overallSentiment)}`}>
            <h4 className="font-semibold mb-2">Sentimiento general</h4>
            <p className="text-sm">
              {analysis.overallSentiment === 'positive' && 'Tu estado de ánimo general es positivo 😊'}
              {analysis.overallSentiment === 'negative' && 'Tu estado de ánimo general necesita atención 😔'}
              {analysis.overallSentiment === 'neutral' && 'Tu estado de ánimo es neutral 😐'}
            </p>
          </div>

          {/* Risk Level Alert */}
          {analysis.riskLevel !== 'low' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg border flex items-start space-x-3 ${getRiskLevelColor(analysis.riskLevel)}`}
            >
              {getRiskLevelIcon(analysis.riskLevel)}
              <div>
                <h4 className="font-semibold mb-1">Nivel de atención</h4>
                <p className="text-sm">{getRiskLevelText(analysis.riskLevel)}</p>
              </div>
            </motion.div>
          )}
        </div>
      </SeniorCard>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <SeniorCard 
          title="Recomendaciones personalizadas"
          icon={<LightBulbIcon className="w-6 h-6 text-accent-500" />}
          variant="outlined"
        >
          <div className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-accent-50 rounded-lg border border-accent-200"
              >
                <div className="w-6 h-6 bg-accent-400 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700 text-sm">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </SeniorCard>
      )}

      {/* Detailed Analysis (Optional) */}
      {showDetailed && (
        <SeniorCard 
          title="Análisis detallado"
          variant="outlined"
        >
          <div className="space-y-4">
            {/* Key Emotions */}
            {analysis.keyEmotions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Emociones identificadas</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyEmotions.map((emotion, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Consistency Check */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Coherencia emocional</h4>
              <p className="text-sm text-gray-600">
                {getConsistencyText(analysis.emotionConsistency)}
              </p>
            </div>

            {/* Confidence Score */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Confianza del análisis</h4>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.confidenceScore * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(analysis.confidenceScore * 100)}%
                </span>
              </div>
            </div>
          </div>
        </SeniorCard>
      )}

      {/* Follow-up Suggestions */}
      {analysis.followUpSuggestions.length > 0 && (
        <SeniorCard 
          title="Próximos pasos"
          variant="outlined"
        >
          <ul className="space-y-2">
            {analysis.followUpSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                <span className="text-primary-500 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </SeniorCard>
      )}
    </div>
  );
};

export default MoodFeedback;