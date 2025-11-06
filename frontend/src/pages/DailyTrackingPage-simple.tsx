import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import useSerenito from '../hooks/useSerenito';
import SeniorButton from '../components/UI/SeniorButton';

interface DailyMetric {
  id: string;
  name: string;
  icon: string;
  question: string;
  scale: { value: number; label: string; color: string }[];
}

const dailyMetrics: DailyMetric[] = [
  {
    id: 'mood',
    name: 'Estado de Ánimo',
    icon: '😊',
    question: '¿Cómo ha sido tu estado de ánimo hoy?',
    scale: [
      { value: 1, label: 'Muy mal', color: 'bg-red-500' },
      { value: 2, label: 'Mal', color: 'bg-orange-500' },
      { value: 3, label: 'Regular', color: 'bg-yellow-500' },
      { value: 4, label: 'Bien', color: 'bg-green-400' },
      { value: 5, label: 'Muy bien', color: 'bg-green-500' },
    ]
  },
  {
    id: 'energy',
    name: 'Nivel de Energía',
    icon: '⚡',
    question: '¿Cómo ha sido tu nivel de energía?',
    scale: [
      { value: 1, label: 'Sin energía', color: 'bg-gray-500' },
      { value: 2, label: 'Poca energía', color: 'bg-orange-400' },
      { value: 3, label: 'Normal', color: 'bg-yellow-400' },
      { value: 4, label: 'Energético', color: 'bg-blue-400' },
      { value: 5, label: 'Muy energético', color: 'bg-purple-500' },
    ]
  },
  {
    id: 'sleep',
    name: 'Calidad del Sueño',
    icon: '😴',
    question: '¿Cómo dormiste anoche?',
    scale: [
      { value: 1, label: 'Muy mal', color: 'bg-red-500' },
      { value: 2, label: 'Mal', color: 'bg-orange-500' },
      { value: 3, label: 'Regular', color: 'bg-yellow-500' },
      { value: 4, label: 'Bien', color: 'bg-green-400' },
      { value: 5, label: 'Excelente', color: 'bg-green-500' },
    ]
  },
  {
    id: 'anxiety',
    name: 'Nivel de Ansiedad',
    icon: '😰',
    question: '¿Cómo ha sido tu ansiedad hoy?',
    scale: [
      { value: 1, label: 'Muy alta', color: 'bg-red-600' },
      { value: 2, label: 'Alta', color: 'bg-red-400' },
      { value: 3, label: 'Moderada', color: 'bg-yellow-500' },
      { value: 4, label: 'Baja', color: 'bg-green-400' },
      { value: 5, label: 'Muy baja', color: 'bg-green-500' },
    ]
  }
];

const DailyTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentMetric, setCurrentMetric] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const { interact, expression, message, showMessage } = useSerenito();

  const handleResponse = (metricId: string, value: number) => {
    const newResponses = { ...responses, [metricId]: value };
    setResponses(newResponses);

    // SERENITO reacts based on the response
    if (metricId === 'mood' || metricId === 'anxiety') {
      if (value <= 2) {
        interact('show-concern');
      } else if (value >= 4) {
        interact('encourage');
      }
    }

    // Move to next metric or complete
    if (currentMetric < dailyMetrics.length - 1) {
      setTimeout(() => setCurrentMetric(currentMetric + 1), 1000);
    } else {
      setTimeout(() => {
        setIsCompleted(true);
        interact('task-complete');
      }, 1000);
    }
  };

  const resetTracking = () => {
    setResponses({});
    setCurrentMetric(0);
    setIsCompleted(false);
  };

  const getAverageScore = () => {
    const values = Object.values(responses);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const getRecommendation = () => {
    const avg = getAverageScore();
    if (avg <= 2.5) {
      return {
        type: 'concern',
        message: 'Parece que has tenido un día difícil. Considera hacer algunos ejercicios de respiración o contactar con un SERENO.',
        color: 'bg-red-50 border-red-200 text-red-800'
      };
    } else if (avg >= 4) {
      return {
        type: 'positive',
        message: '¡Qué bueno que hayas tenido un buen día! Mantén esa energía positiva.',
        color: 'bg-green-50 border-green-200 text-green-800'
      };
    } else {
      return {
        type: 'neutral',
        message: 'Has tenido un día normal. Recuerda que cada día es una oportunidad para cuidar tu bienestar.',
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      };
    }
  };

  if (isCompleted) {
    const recommendation = getRecommendation();
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <SerenitoCharacter
            expression="celebrating"
            size="xl"
            message="¡Excelente! Has completado tu seguimiento diario."
            showMessage={true}
            className="mb-6"
          />
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Seguimiento completado!
          </h1>
          <p className="text-gray-600">
            Gracias por compartir cómo ha sido tu día
          </p>
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Resumen de tu día
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {dailyMetrics.map((metric) => {
              const response = responses[metric.id];
              const scaleItem = metric.scale.find(s => s.value === response);
              
              return (
                <div key={metric.id} className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl mb-2">{metric.icon}</div>
                  <div className="font-medium text-gray-800 mb-1">{metric.name}</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-white text-sm ${scaleItem?.color}`}>
                    {scaleItem?.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`rounded-xl p-4 border ${recommendation.color}`}>
            <p className="font-medium mb-2">💡 Recomendación personalizada:</p>
            <p>{recommendation.message}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <SeniorButton
            variant="primary"
            fullWidth
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </SeniorButton>
          
          <SeniorButton
            variant="outline"
            fullWidth
            onClick={resetTracking}
          >
            Nuevo seguimiento
          </SeniorButton>
        </div>
      </div>
    );
  }

  const metric = dailyMetrics[currentMetric];
  const progress = ((currentMetric + 1) / dailyMetrics.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression={expression}
          size="lg"
          message={message}
          showMessage={showMessage}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📊 Seguimiento Diario
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Pregunta {currentMetric + 1} de {dailyMetrics.length}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{metric.icon}</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {metric.name}
          </h2>
          <p className="text-lg text-gray-600">
            {metric.question}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {metric.scale.map((option) => (
            <button
              key={option.value}
              onClick={() => handleResponse(metric.id, option.value)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-300 text-center
                ${option.color} text-white hover:scale-105 hover:shadow-lg
                focus:outline-none focus:ring-4 focus:ring-blue-200
              `}
            >
              <div className="font-bold text-lg mb-1">{option.value}</div>
              <div className="text-sm">{option.label}</div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <SeniorButton
            variant="outline"
            onClick={() => navigate('/')}
          >
            Cancelar
          </SeniorButton>
        </div>
      </div>
    </div>
  );
};

export default DailyTrackingPage;