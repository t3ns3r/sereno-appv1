import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  Cog6ToothIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';
import SeniorButton from '../UI/SeniorButton';
import SeniorCard from '../UI/SeniorCard';
import useSerenito from '../../hooks/useSerenito';

export interface BreathingConfiguration {
  inhaleTime: number;    // seconds
  holdTime: number;      // seconds  
  exhaleTime: number;    // seconds
  cycles: number;        // number of complete cycles
  name: string;          // configuration name
}

export const defaultConfigurations: BreathingConfiguration[] = [
  {
    name: "Relajación Básica",
    inhaleTime: 4,
    holdTime: 6,
    exhaleTime: 5,
    cycles: 8
  },
  {
    name: "Calma Rápida",
    inhaleTime: 3,
    holdTime: 3,
    exhaleTime: 6,
    cycles: 6
  },
  {
    name: "Respiración Profunda",
    inhaleTime: 6,
    holdTime: 4,
    exhaleTime: 8,
    cycles: 5
  },
  {
    name: "Anti-Ansiedad",
    inhaleTime: 4,
    holdTime: 7,
    exhaleTime: 8,
    cycles: 10
  }
];

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest';
type ExerciseState = 'setup' | 'ready' | 'active' | 'paused' | 'completed';

interface BreathingExerciseProps {
  onComplete?: (duration: number, cycles: number) => void;
  onCancel?: () => void;
  initialConfig?: BreathingConfiguration;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  onComplete,
  onCancel,
  initialConfig = defaultConfigurations[0]
}) => {
  const [config, setConfig] = useState<BreathingConfiguration>(initialConfig);
  const [state, setState] = useState<ExerciseState>('setup');
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const phaseStartRef = useRef<number>(0);

  const { expression, message, showMessage, interact, setExpression } = useSerenito();

  // Calculate total exercise duration
  const calculateTotalDuration = (cfg: BreathingConfiguration) => {
    return (cfg.inhaleTime + cfg.holdTime + cfg.exhaleTime) * cfg.cycles;
  };

  useEffect(() => {
    setTotalDuration(calculateTotalDuration(config));
  }, [config]);

  // Get current phase duration
  const getCurrentPhaseDuration = () => {
    switch (currentPhase) {
      case 'inhale': return config.inhaleTime;
      case 'hold': return config.holdTime;
      case 'exhale': return config.exhaleTime;
      case 'rest': return 2; // 2 seconds rest between cycles
      default: return 0;
    }
  };

  // Get phase instruction text
  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'inhale': return 'Inhala lentamente...';
      case 'hold': return 'Mantén la respiración...';
      case 'exhale': return 'Exhala suavemente...';
      case 'rest': return 'Descansa un momento...';
      default: return '';
    }
  };

  // Get SERENITO expression for current phase
  const getSerenitoExpression = () => {
    if (state === 'completed') return 'celebrating';
    if (state === 'paused') return 'calm';
    return 'breathing';
  };

  // Start the breathing exercise
  const startExercise = () => {
    setState('ready');
    setCurrentCycle(0);
    setCurrentPhase('inhale');
    setPhaseProgress(0);
    
    interact('breathing-start');
    
    // 3-second countdown before starting
    setTimeout(() => {
      setState('active');
      startTimeRef.current = Date.now();
      phaseStartRef.current = Date.now();
      startPhaseTimer();
    }, 3000);
  };

  // Start phase timer
  const startPhaseTimer = () => {
    const phaseDuration = getCurrentPhaseDuration() * 1000; // Convert to milliseconds
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - phaseStartRef.current;
      const progress = Math.min(elapsed / phaseDuration, 1);
      
      setPhaseProgress(progress);
      
      if (progress >= 1) {
        nextPhase();
      }
    }, 50); // Update every 50ms for smooth animation
  };

  // Move to next phase
  const nextPhase = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let nextPhase: BreathingPhase;
    let nextCycle = currentCycle;

    switch (currentPhase) {
      case 'inhale':
        nextPhase = 'hold';
        break;
      case 'hold':
        nextPhase = 'exhale';
        break;
      case 'exhale':
        nextCycle = currentCycle + 1;
        if (nextCycle >= config.cycles) {
          completeExercise();
          return;
        }
        nextPhase = currentCycle < config.cycles - 1 ? 'rest' : 'inhale';
        break;
      case 'rest':
        nextPhase = 'inhale';
        break;
      default:
        nextPhase = 'inhale';
    }

    setCurrentPhase(nextPhase);
    setCurrentCycle(nextCycle);
    setPhaseProgress(0);
    phaseStartRef.current = Date.now();
    
    if (state === 'active') {
      startPhaseTimer();
    }
  };

  // Pause exercise
  const pauseExercise = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState('paused');
    setExpression('calm');
  };

  // Resume exercise
  const resumeExercise = () => {
    setState('active');
    phaseStartRef.current = Date.now() - (phaseProgress * getCurrentPhaseDuration() * 1000);
    startPhaseTimer();
    setExpression('breathing');
  };

  // Stop exercise
  const stopExercise = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState('setup');
    setCurrentCycle(0);
    setCurrentPhase('inhale');
    setPhaseProgress(0);
    setExpression('calm');
  };

  // Complete exercise
  const completeExercise = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    setState('completed');
    
    interact('task-complete');
    
    if (onComplete) {
      onComplete(duration, config.cycles);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Breathing circle scale based on phase
  const getCircleScale = () => {
    if (state !== 'active') return 1;
    
    switch (currentPhase) {
      case 'inhale':
        return 1 + (phaseProgress * 0.3); // Grow to 1.3x
      case 'hold':
        return 1.3; // Stay expanded
      case 'exhale':
        return 1.3 - (phaseProgress * 0.3); // Shrink back to 1x
      case 'rest':
        return 1; // Normal size
      default:
        return 1;
    }
  };

  const renderSetupScreen = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Ejercicios de Respiración
        </h2>
        <p className="text-gray-600">
          Encuentra tu calma interior con SERENITO
        </p>
      </div>

      {/* Configuration Selection */}
      <SeniorCard title="Selecciona tu ejercicio" variant="outlined">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {defaultConfigurations.map((cfg, index) => (
            <button
              key={index}
              onClick={() => setConfig(cfg)}
              className={`
                p-4 rounded-senior border-2 text-left transition-all duration-200
                ${config.name === cfg.name 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-300'
                }
              `}
            >
              <h3 className="font-semibold text-gray-800 mb-1">{cfg.name}</h3>
              <p className="text-sm text-gray-600">
                {cfg.inhaleTime}-{cfg.holdTime}-{cfg.exhaleTime} • {cfg.cycles} ciclos
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ~{Math.round(calculateTotalDuration(cfg) / 60)} minutos
              </p>
            </button>
          ))}
        </div>
      </SeniorCard>

      {/* Current Configuration Details */}
      <SeniorCard title={config.name} variant="gradient">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">{config.inhaleTime}s</div>
            <div className="text-sm text-gray-600">Inhalar</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary-600">{config.holdTime}s</div>
            <div className="text-sm text-gray-600">Mantener</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-600">{config.exhaleTime}s</div>
            <div className="text-sm text-gray-600">Exhalar</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-gray-700">
            <strong>{config.cycles} ciclos</strong> • Duración aproximada: <strong>{Math.round(totalDuration / 60)} minutos</strong>
          </p>
        </div>
      </SeniorCard>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SeniorButton
          variant="primary"
          size="large"
          fullWidth
          onClick={startExercise}
          icon={<PlayIcon className="w-6 h-6" />}
        >
          Comenzar Ejercicio
        </SeniorButton>
        
        <SeniorButton
          variant="outline"
          size="large"
          onClick={onCancel}
        >
          Personalizar
        </SeniorButton>
      </div>
    </div>
  );

  const renderActiveScreen = () => (
    <div className="space-y-8 text-center">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="text-sm text-gray-600">
          Ciclo {currentCycle + 1} de {config.cycles}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCycle + phaseProgress) / config.cycles) * 100}%` }}
          />
        </div>
      </div>

      {/* Breathing Circle */}
      <div className="flex justify-center">
        <motion.div
          className="breathing-circle border-4 border-primary-500 bg-primary-50"
          animate={{ scale: getCircleScale() }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🫁</div>
            <div className="text-lg font-semibold text-primary-700">
              {getPhaseInstruction()}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Phase Timer */}
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-800">
          {Math.ceil(getCurrentPhaseDuration() * (1 - phaseProgress))}
        </div>
        <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto">
          <div
            className="h-2 bg-secondary-400 rounded-full transition-all duration-100"
            style={{ width: `${phaseProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-4">
        {state === 'active' ? (
          <SeniorButton
            variant="secondary"
            onClick={pauseExercise}
            icon={<PauseIcon className="w-6 h-6" />}
          >
            Pausar
          </SeniorButton>
        ) : (
          <SeniorButton
            variant="primary"
            onClick={resumeExercise}
            icon={<PlayIcon className="w-6 h-6" />}
          >
            Continuar
          </SeniorButton>
        )}
        
        <SeniorButton
          variant="outline"
          onClick={stopExercise}
          icon={<StopIcon className="w-6 h-6" />}
        >
          Detener
        </SeniorButton>
      </div>
    </div>
  );

  const renderCompletedScreen = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-800">
          ¡Ejercicio Completado!
        </h2>
        <p className="text-gray-600">
          Has completado {config.cycles} ciclos de respiración
        </p>
      </div>

      <SeniorCard variant="gradient">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">{config.cycles}</div>
            <div className="text-sm text-gray-600">Ciclos completados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary-600">
              {Math.round(totalDuration / 60)}min
            </div>
            <div className="text-sm text-gray-600">Tiempo total</div>
          </div>
        </div>
      </SeniorCard>

      <div className="flex flex-col sm:flex-row gap-4">
        <SeniorButton
          variant="primary"
          fullWidth
          onClick={() => setState('setup')}
        >
          Nuevo Ejercicio
        </SeniorButton>
        
        <SeniorButton
          variant="outline"
          fullWidth
          onClick={onCancel}
        >
          Finalizar
        </SeniorButton>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* SERENITO Guide */}
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression={getSerenitoExpression()}
          size="xl"
          message={message}
          showMessage={showMessage}
          className="mb-4"
        />
      </div>

      {/* Main Content */}
      <SeniorCard padding="large">
        <AnimatePresence mode="wait">
          {state === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderSetupScreen()}
            </motion.div>
          )}
          
          {state === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-6"
            >
              <h2 className="text-3xl font-bold text-gray-800">
                Prepárate...
              </h2>
              <div className="text-6xl">3</div>
              <p className="text-gray-600">
                El ejercicio comenzará en un momento
              </p>
            </motion.div>
          )}
          
          {(state === 'active' || state === 'paused') && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderActiveScreen()}
            </motion.div>
          )}
          
          {state === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
            >
              {renderCompletedScreen()}
            </motion.div>
          )}
        </AnimatePresence>
      </SeniorCard>
    </div>
  );
};

export default BreathingExercise;