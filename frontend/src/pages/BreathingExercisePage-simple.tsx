import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import useSerenito from '../hooks/useSerenito';
import SeniorButton from '../components/UI/SeniorButton';

interface BreathingPhase {
  name: string;
  duration: number;
  instruction: string;
  color: string;
}

const breathingPatterns = {
  basic: {
    name: 'Respiración Básica',
    description: 'Perfecta para principiantes',
    phases: [
      { name: 'Inhalar', duration: 4, instruction: 'Inhala lentamente por la nariz', color: 'bg-blue-400' },
      { name: 'Mantener', duration: 2, instruction: 'Mantén el aire', color: 'bg-purple-400' },
      { name: 'Exhalar', duration: 6, instruction: 'Exhala lentamente por la boca', color: 'bg-green-400' },
    ]
  },
  calm: {
    name: 'Respiración Calmante',
    description: 'Para reducir la ansiedad',
    phases: [
      { name: 'Inhalar', duration: 4, instruction: 'Inhala profundamente', color: 'bg-blue-500' },
      { name: 'Mantener', duration: 4, instruction: 'Mantén y relájate', color: 'bg-purple-500' },
      { name: 'Exhalar', duration: 8, instruction: 'Exhala muy lentamente', color: 'bg-green-500' },
    ]
  },
  energy: {
    name: 'Respiración Energizante',
    description: 'Para aumentar la energía',
    phases: [
      { name: 'Inhalar', duration: 6, instruction: 'Inhala con energía', color: 'bg-orange-400' },
      { name: 'Mantener', duration: 2, instruction: 'Mantén brevemente', color: 'bg-red-400' },
      { name: 'Exhalar', duration: 4, instruction: 'Exhala con fuerza', color: 'bg-yellow-400' },
    ]
  }
};

const BreathingExercisePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPattern, setSelectedPattern] = useState<keyof typeof breathingPatterns | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalCycles] = useState(5);
  const { interact, expression } = useSerenito();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && selectedPattern && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && selectedPattern && timeLeft === 0) {
      // Move to next phase
      const pattern = breathingPatterns[selectedPattern];
      const nextPhase = (currentPhase + 1) % pattern.phases.length;
      
      if (nextPhase === 0) {
        // Completed a full cycle
        const newCycleCount = cycleCount + 1;
        setCycleCount(newCycleCount);
        
        if (newCycleCount >= totalCycles) {
          // Exercise completed
          setIsActive(false);
          interact('task-complete');
          return;
        }
      }
      
      setCurrentPhase(nextPhase);
      setTimeLeft(pattern.phases[nextPhase].duration);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, currentPhase, cycleCount, selectedPattern, totalCycles, interact]);

  const startExercise = (patternKey: keyof typeof breathingPatterns) => {
    setSelectedPattern(patternKey);
    setCurrentPhase(0);
    setTimeLeft(breathingPatterns[patternKey].phases[0].duration);
    setCycleCount(0);
    setIsActive(true);
    interact('breathing-start');
  };

  const stopExercise = () => {
    setIsActive(false);
    setSelectedPattern(null);
    setCycleCount(0);
  };

  const pauseResume = () => {
    setIsActive(!isActive);
  };

  if (isActive && selectedPattern) {
    const pattern = breathingPatterns[selectedPattern];
    const currentPhaseData = pattern.phases[currentPhase];
    const progress = ((currentPhaseData.duration - timeLeft) / currentPhaseData.duration) * 100;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <SerenitoCharacter
            expression="breathing"
            size="xl"
            message={currentPhaseData.instruction}
            showMessage={true}
            className="mb-6"
          />
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {pattern.name}
          </h1>
          <p className="text-gray-600">
            Ciclo {cycleCount + 1} de {totalCycles}
          </p>
        </div>

        {/* Breathing Circle */}
        <div className="relative mb-8">
          <div className={`
            w-64 h-64 mx-auto rounded-full transition-all duration-1000 ease-in-out flex items-center justify-center
            ${currentPhaseData.color}
            ${currentPhase === 0 ? 'scale-110' : currentPhase === 1 ? 'scale-100' : 'scale-90'}
          `}>
            <div className="text-center text-white">
              <div className="text-3xl font-bold mb-2">{timeLeft}</div>
              <div className="text-lg">{currentPhaseData.name}</div>
            </div>
          </div>
          
          {/* Progress Ring */}
          <div className="absolute inset-0 w-64 h-64 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="white"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${progress * 2.83} 283`}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <p className="text-xl text-gray-700 mb-4">
            {currentPhaseData.instruction}
          </p>
          <div className="text-sm text-gray-500">
            Sigue el ritmo de SERENITO y respira tranquilamente
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <SeniorButton
            variant="outline"
            fullWidth
            onClick={pauseResume}
          >
            {isActive ? 'Pausar' : 'Continuar'}
          </SeniorButton>
          
          <SeniorButton
            variant="secondary"
            fullWidth
            onClick={stopExercise}
          >
            Terminar
          </SeniorButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression={expression}
          size="lg"
          message="Vamos a respirar juntos. Elige el ejercicio que prefieras."
          showMessage={true}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🫁 Ejercicios de Respiración
        </h1>
        <p className="text-lg text-gray-600">
          Relájate y encuentra tu calma interior
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(breathingPatterns).map(([key, pattern]) => (
          <div key={key} className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {pattern.name}
            </h3>
            <p className="text-gray-600 mb-4">
              {pattern.description}
            </p>
            
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">Patrón:</div>
              <div className="flex justify-center space-x-2">
                {pattern.phases.map((phase, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-8 h-8 rounded-full ${phase.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {phase.duration}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {phase.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <SeniorButton
              variant="primary"
              fullWidth
              onClick={() => startExercise(key as keyof typeof breathingPatterns)}
            >
              Comenzar
            </SeniorButton>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          💡 Consejos para respirar mejor
        </h3>
        <div className="text-blue-700 space-y-2">
          <p>• Encuentra un lugar cómodo y tranquilo</p>
          <p>• Mantén la espalda recta pero relajada</p>
          <p>• Concéntrate en el movimiento de tu respiración</p>
          <p>• No te preocupes si tu mente se distrae, es normal</p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <SeniorButton
          variant="outline"
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </SeniorButton>
      </div>
    </div>
  );
};

export default BreathingExercisePage;