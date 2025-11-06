import React, { useState } from 'react';
import DiaryCalendar from './DiaryCalendar';
import EmotionSelector from './EmotionSelector';
import AchievementsForm from './AchievementsForm';
import ReflectionForm from './ReflectionForm';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';

interface DiaryEntry {
  date: string;
  emotion?: string;
  hasEntry: boolean;
  achievements?: Array<{
    type: 'big' | 'medium' | 'small';
    description: string;
  }>;
  worries?: string;
  gratitude?: string;
}

interface DiaryInterfaceProps {
  onClose: () => void;
}

type DiaryStep = 'calendar' | 'emotion' | 'achievements' | 'reflection' | 'complete';

const DiaryInterface: React.FC<DiaryInterfaceProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<DiaryStep>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Array<{
    type: 'big' | 'medium' | 'small';
    description: string;
  }>>([]);
  const [reflectionData, setReflectionData] = useState({
    worries: '',
    gratitude: ''
  });

  // Mock data for calendar - in real app this would come from backend
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([
    { date: '2025-01-03', hasEntry: true, emotion: 'happy' },
    { date: '2025-01-04', hasEntry: true, emotion: 'calm' },
    { date: '2025-01-05', hasEntry: true, emotion: 'excited' }
  ]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    
    // Check if entry exists for this date
    const existingEntry = diaryEntries.find(entry => entry.date === date);
    if (existingEntry) {
      // Load existing data
      setSelectedEmotion(existingEntry.emotion || null);
      setAchievements(existingEntry.achievements || []);
      setReflectionData({
        worries: existingEntry.worries || '',
        gratitude: existingEntry.gratitude || ''
      });
    } else {
      // Reset for new entry
      setSelectedEmotion(null);
      setAchievements([]);
      setReflectionData({ worries: '', gratitude: '' });
    }
    
    setCurrentStep('emotion');
  };

  const handleSaveDiary = () => {
    if (!selectedDate || !selectedEmotion) return;

    const newEntry: DiaryEntry = {
      date: selectedDate,
      emotion: selectedEmotion,
      hasEntry: true,
      achievements,
      worries: reflectionData.worries,
      gratitude: reflectionData.gratitude
    };

    // Update or add entry
    setDiaryEntries(prev => {
      const filtered = prev.filter(entry => entry.date !== selectedDate);
      return [...filtered, newEntry];
    });

    setCurrentStep('complete');
  };

  const resetDiary = () => {
    setCurrentStep('calendar');
    setSelectedDate(null);
    setSelectedEmotion(null);
    setAchievements([]);
    setReflectionData({ worries: '', gratitude: '' });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'calendar':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <SerenitoCharacter
                expression="encouraging"
                size="lg"
                message="¡Hola! Bienvenido a tu diario personal. Selecciona un día para registrar cómo te sientes."
                showMessage={true}
                className="mb-6"
              />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Mi Diario Personal
              </h1>
              <p className="text-gray-600">
                Selecciona un día para registrar tus emociones y reflexiones
              </p>
            </div>
            
            <DiaryCalendar
              entries={diaryEntries}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
            
            <div className="text-center">
              <button
                onClick={onClose}
                className="py-2 px-6 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cerrar Diario
              </button>
            </div>
          </div>
        );

      case 'emotion':
        return (
          <EmotionSelector
            selectedEmotion={selectedEmotion}
            onEmotionSelect={setSelectedEmotion}
            onNext={() => setCurrentStep('achievements')}
            onCancel={() => setCurrentStep('calendar')}
          />
        );

      case 'achievements':
        return (
          <AchievementsForm
            achievements={achievements}
            onAchievementsChange={setAchievements}
            onNext={() => setCurrentStep('reflection')}
            onBack={() => setCurrentStep('emotion')}
          />
        );

      case 'reflection':
        return (
          <ReflectionForm
            reflectionData={reflectionData}
            onReflectionChange={setReflectionData}
            onSave={handleSaveDiary}
            onBack={() => setCurrentStep('achievements')}
          />
        );

      case 'complete':
        return (
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg text-center">
            <SerenitoCharacter
              expression="happy"
              size="lg"
              message="¡Excelente! Has completado tu entrada del diario. Me siento orgulloso de que te tomes el tiempo para reflexionar sobre tu día."
              showMessage={true}
              className="mb-6"
            />
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ¡Entrada Guardada! 🎉
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">
                Tu entrada del {selectedDate} ha sido guardada
              </h3>
              <div className="text-green-700 text-sm space-y-1">
                <p>• Emoción registrada: {selectedEmotion}</p>
                <p>• Logros: {achievements.length} registrados</p>
                <p>• Reflexiones: {reflectionData.worries || reflectionData.gratitude ? 'Completadas' : 'Ninguna'}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={resetDiary}
                className="w-full py-3 px-6 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
              >
                📅 Registrar Otro Día
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cerrar Diario
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default DiaryInterface;