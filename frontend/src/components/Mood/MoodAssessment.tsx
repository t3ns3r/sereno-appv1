import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import EmotionalFaces, { EmotionalFace } from './EmotionalFaces';
import VoiceRecorder from './VoiceRecorder';
import SeniorButton from '../UI/SeniorButton';
import SeniorCard from '../UI/SeniorCard';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';
import useSerenito from '../../hooks/useSerenito';

export interface MoodAssessmentData {
  selectedEmotion: EmotionalFace;
  textDescription?: string;
  voiceRecording?: Blob;
  timestamp: Date;
}

interface MoodAssessmentProps {
  onComplete: (data: MoodAssessmentData) => void;
  onCancel?: () => void;
}

type AssessmentStep = 'emotion' | 'description' | 'voice' | 'review';

const MoodAssessment: React.FC<MoodAssessmentProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('emotion');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalFace | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [voiceRecording, setVoiceRecording] = useState<Blob | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'voice' | null>(null);
  
  const { expression, message, showMessage, interact } = useSerenito();

  const handleEmotionSelect = (face: EmotionalFace) => {
    setSelectedEmotion(face);
    
    // SERENITO responds based on emotion intensity
    if (face.intensity <= 2) {
      interact('show-concern');
    } else if (face.intensity >= 4) {
      interact('encourage');
    } else {
      interact('custom', `Entiendo que te sientes ${face.label.toLowerCase()}. Cuéntame más sobre ello.`);
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'emotion':
        if (selectedEmotion) {
          setCurrentStep('description');
          interact('custom', '¿Te gustaría contarme más detalles sobre cómo te sientes?');
        }
        break;
      case 'description':
        setCurrentStep('review');
        break;
      case 'voice':
        setCurrentStep('review');
        break;
      case 'review':
        if (selectedEmotion) {
          onComplete({
            selectedEmotion,
            textDescription: textDescription || undefined,
            voiceRecording: voiceRecording || undefined,
            timestamp: new Date()
          });
          interact('task-complete');
        }
        break;
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case 'description':
        setCurrentStep('emotion');
        break;
      case 'voice':
        setCurrentStep('description');
        break;
      case 'review':
        setCurrentStep(inputMethod === 'voice' ? 'voice' : 'description');
        break;
    }
  };

  const handleInputMethodSelect = (method: 'text' | 'voice') => {
    setInputMethod(method);
    if (method === 'voice') {
      setCurrentStep('voice');
      interact('custom', 'Perfecto, vamos a grabar tu voz. Habla con naturalidad.');
    }
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    setVoiceRecording(audioBlob);
    interact('task-complete');
  };

  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'emotion':
        return (
          <motion.div
            key="emotion"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                ¿Cómo te sientes ahora?
              </h2>
              <p className="text-gray-600">
                Selecciona la carita que mejor represente tu estado de ánimo actual
              </p>
            </div>

            <EmotionalFaces
              selectedFace={selectedEmotion?.id}
              onFaceSelect={handleEmotionSelect}
              size="large"
              layout="grid"
            />

            {selectedEmotion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 bg-primary-50 rounded-senior border border-primary-200"
              >
                <p className="text-lg font-semibold text-primary-700">
                  {selectedEmotion.label}
                </p>
                <p className="text-sm text-primary-600">
                  {selectedEmotion.description}
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      case 'description':
        return (
          <motion.div
            key="description"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Cuéntame más detalles
              </h2>
              <p className="text-gray-600">
                ¿Cómo prefieres compartir más sobre cómo te sientes?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SeniorButton
                variant={inputMethod === 'text' ? 'primary' : 'outline'}
                size="large"
                fullWidth
                onClick={() => handleInputMethodSelect('text')}
                icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
              >
                Escribir texto
              </SeniorButton>

              <SeniorButton
                variant={inputMethod === 'voice' ? 'primary' : 'outline'}
                size="large"
                fullWidth
                onClick={() => handleInputMethodSelect('voice')}
                icon={<MicrophoneIcon className="w-6 h-6" />}
              >
                Grabar mi voz
              </SeniorButton>
            </div>

            {inputMethod === 'text' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <textarea
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder="Describe cómo te sientes, qué te preocupa, o cómo ha sido tu día..."
                  className="
                    w-full min-h-[120px] p-4 
                    text-lg border-2 border-gray-300 
                    rounded-senior resize-none
                    focus:border-primary-500 focus:ring-0
                  "
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500">
                  {textDescription.length}/500 caracteres
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 'voice':
        return (
          <motion.div
            key="voice"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Graba tu mensaje de voz
              </h2>
              <p className="text-gray-600">
                Habla con naturalidad sobre cómo te sientes
              </p>
            </div>

            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              maxDuration={120}
            />
          </motion.div>
        );

      case 'review':
        return (
          <motion.div
            key="review"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Resumen de tu evaluación
              </h2>
              <p className="text-gray-600">
                Revisa la información antes de guardar
              </p>
            </div>

            <SeniorCard title="Estado de ánimo seleccionado" variant="outlined">
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{selectedEmotion?.emoji}</span>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {selectedEmotion?.label}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedEmotion?.description}
                  </p>
                </div>
              </div>
            </SeniorCard>

            {textDescription && (
              <SeniorCard title="Descripción adicional" variant="outlined">
                <p className="text-gray-700">{textDescription}</p>
              </SeniorCard>
            )}

            {voiceRecording && (
              <SeniorCard title="Mensaje de voz" variant="outlined">
                <p className="text-gray-700">
                  ✅ Grabación de voz incluida ({Math.round(voiceRecording.size / 1024)} KB)
                </p>
              </SeniorCard>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* SERENITO Guide */}
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression={expression}
          size="large"
          message={message}
          showMessage={showMessage}
          className="mb-4"
        />
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2">
          {['emotion', 'description', 'review'].map((step, index) => (
            <div
              key={step}
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${currentStep === step || 
                  (['description', 'voice'].includes(currentStep) && step === 'description') ||
                  (currentStep === 'review' && index <= 2)
                  ? 'bg-primary-500' 
                  : 'bg-gray-300'
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <SeniorCard padding="large" className="mb-8">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </SeniorCard>

      {/* Navigation Buttons */}
      <div className="flex justify-between space-x-4">
        <SeniorButton
          variant="outline"
          onClick={currentStep === 'emotion' ? onCancel : handlePreviousStep}
        >
          {currentStep === 'emotion' ? 'Cancelar' : 'Anterior'}
        </SeniorButton>

        <SeniorButton
          variant="primary"
          onClick={handleNextStep}
          disabled={
            (currentStep === 'emotion' && !selectedEmotion) ||
            (currentStep === 'description' && !inputMethod) ||
            (currentStep === 'description' && inputMethod === 'text' && !textDescription.trim())
          }
        >
          {currentStep === 'review' ? 'Guardar evaluación' : 'Siguiente'}
        </SeniorButton>
      </div>
    </div>
  );
};

export default MoodAssessment;