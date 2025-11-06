import React, { useState } from 'react';
import { MentalHealthQuestion, calculateLevel, getSerenitoMessage } from '../../data/mentalHealthQuestions';
import SeniorButton from '../UI/SeniorButton';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';

interface MentalHealthQuestionnaireProps {
  questions: MentalHealthQuestion[];
  title: string;
  type: 'anxiety' | 'depression';
  onComplete: (score: number, level: string, answers: Record<string, number>) => void;
  onCancel: () => void;
}

const MentalHealthQuestionnaire: React.FC<MentalHealthQuestionnaireProps> = ({
  questions,
  title,
  type,
  onComplete,
  onCancel
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (questionId: string, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Calculate final score and show result
        const totalScore = Object.values(newAnswers).reduce((sum, val) => sum + val, 0);
        const maxScore = questions.length * 3; // Max 3 points per question
        const result = calculateLevel(totalScore, maxScore);
        
        setShowResult(true);
        setTimeout(() => {
          onComplete(totalScore, result.level, newAnswers);
        }, 3000);
      }
    }, 500);
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResult) {
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    const maxScore = questions.length * 3;
    const result = calculateLevel(totalScore, maxScore);
    const serenitoResponse = getSerenitoMessage(
      type === 'anxiety' ? result.level : 'Mínimo',
      type === 'depression' ? result.level : 'Mínimo'
    );

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <SerenitoCharacter
            expression={serenitoResponse.expression}
            size="lg"
            message={serenitoResponse.message}
            showMessage={true}
            className="mb-6"
          />
          
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Evaluación Completada
          </h3>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-semibold mb-2">Resultado de {title}</h4>
            <div className={`text-3xl font-bold mb-2 ${
              result.color === 'success' ? 'text-green-600' :
              result.color === 'info' ? 'text-blue-600' :
              result.color === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {result.level}
            </div>
            <p className="text-gray-600">{result.description}</p>
            <div className="mt-4 text-sm text-gray-500">
              Puntuación: {totalScore}/{maxScore}
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Guardando tu progreso y preparando recompensas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 text-center">
          Pregunta {currentQuestion + 1} de {questions.length}
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-800 mb-6 leading-relaxed">
          {currentQ.text}
        </h4>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQ.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(currentQ.id, option.value)}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 group-hover:text-primary-700">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </div>
                </div>
                <div className="text-2xl text-gray-400 group-hover:text-primary-500">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <SeniorButton
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </SeniorButton>
        
        <div className="text-sm text-gray-500 flex items-center">
          Selecciona una opción para continuar
        </div>
      </div>
    </div>
  );
};

export default MentalHealthQuestionnaire;