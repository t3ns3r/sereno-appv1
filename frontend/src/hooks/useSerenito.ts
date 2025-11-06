import { useState, useCallback, useEffect } from 'react';
import { SerenitoExpression } from '../components/SERENITO/SerenitoCharacter';

interface SerenitoMessage {
  text: string;
  expression: SerenitoExpression;
  duration?: number;
}

interface SerenitoState {
  expression: SerenitoExpression;
  message: string;
  showMessage: boolean;
  isInteracting: boolean;
}

const useSerenito = () => {
  const [state, setState] = useState<SerenitoState>({
    expression: 'calm',
    message: '',
    showMessage: false,
    isInteracting: false
  });

  // Predefined messages for different contexts
  const messages = {
    welcome: [
      { text: "¡Hola! Soy SERENITO, tu compañero de bienestar. Estoy aquí para acompañarte.", expression: 'welcoming' as SerenitoExpression },
      { text: "Bienvenido de vuelta. ¿Cómo te sientes hoy?", expression: 'happy' as SerenitoExpression },
      { text: "Me alegra verte. Juntos podemos cuidar tu bienestar mental.", expression: 'calm' as SerenitoExpression }
    ],
    encouragement: [
      { text: "Recuerda: cada pequeño paso cuenta. ¡Tú puedes!", expression: 'encouraging' as SerenitoExpression },
      { text: "Estás haciendo un gran trabajo cuidando tu salud mental.", expression: 'happy' as SerenitoExpression },
      { text: "Respira profundo. Estoy aquí contigo.", expression: 'calm' as SerenitoExpression }
    ],
    moodAssessment: [
      { text: "Cuéntame, ¿cómo te sientes en este momento?", expression: 'thinking' as SerenitoExpression },
      { text: "No hay respuestas correctas o incorrectas. Solo sé honesto contigo mismo.", expression: 'calm' as SerenitoExpression },
      { text: "Tus emociones son válidas. Hablemos de ellas.", expression: 'encouraging' as SerenitoExpression }
    ],
    breathing: [
      { text: "Vamos a respirar juntos. Sigue mi ritmo.", expression: 'breathing' as SerenitoExpression },
      { text: "Inhala... mantén... exhala. Muy bien.", expression: 'calm' as SerenitoExpression },
      { text: "Siente cómo tu cuerpo se relaja con cada respiración.", expression: 'breathing' as SerenitoExpression }
    ],
    celebration: [
      { text: "¡Excelente trabajo! Me siento orgulloso de ti.", expression: 'celebrating' as SerenitoExpression },
      { text: "¡Lo lograste! Cada paso es una victoria.", expression: 'happy' as SerenitoExpression },
      { text: "¡Fantástico! Sigues creciendo y mejorando.", expression: 'celebrating' as SerenitoExpression }
    ],
    concern: [
      { text: "Noto que podrías necesitar apoyo extra. Estoy aquí para ti.", expression: 'concerned' as SerenitoExpression },
      { text: "Es normal tener días difíciles. No estás solo.", expression: 'calm' as SerenitoExpression },
      { text: "¿Te gustaría hablar sobre lo que sientes?", expression: 'concerned' as SerenitoExpression }
    ],
    emergency: [
      { text: "Entiendo que necesitas ayuda. Vamos a buscar apoyo juntos.", expression: 'concerned' as SerenitoExpression },
      { text: "Tu seguridad es lo más importante. Estoy contigo.", expression: 'encouraging' as SerenitoExpression }
    ]
  };

  const showMessage = useCallback((messageData: SerenitoMessage) => {
    setState(prev => ({
      ...prev,
      expression: messageData.expression,
      message: messageData.text,
      showMessage: true,
      isInteracting: true
    }));

    // Auto-hide message after duration
    const duration = messageData.duration || 4000;
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        showMessage: false,
        isInteracting: false
      }));
    }, duration);
  }, []);

  const showRandomMessage = useCallback((category: keyof typeof messages) => {
    const categoryMessages = messages[category];
    const randomMessage = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
    showMessage(randomMessage);
  }, [showMessage]);

  const setExpression = useCallback((expression: SerenitoExpression) => {
    setState(prev => ({
      ...prev,
      expression
    }));
  }, []);

  const hideMessage = useCallback(() => {
    setState(prev => ({
      ...prev,
      showMessage: false,
      isInteracting: false
    }));
  }, []);

  // Context-aware interactions
  const interact = useCallback((context: string, customMessage?: string) => {
    switch (context) {
      case 'welcome':
        showRandomMessage('welcome');
        break;
      case 'mood-start':
        showRandomMessage('moodAssessment');
        break;
      case 'breathing-start':
        showRandomMessage('breathing');
        break;
      case 'task-complete':
        showRandomMessage('celebration');
        break;
      case 'show-concern':
        showRandomMessage('concern');
        break;
      case 'emergency':
        showRandomMessage('emergency');
        break;
      case 'encourage':
        showRandomMessage('encouragement');
        break;
      case 'custom':
        if (customMessage) {
          showMessage({ text: customMessage, expression: 'calm' });
        }
        break;
      default:
        showRandomMessage('encouragement');
    }
  }, [showRandomMessage, showMessage]);

  // Auto-welcome on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      interact('welcome');
    }, 1000);

    return () => clearTimeout(timer);
  }, [interact]);

  return {
    expression: state.expression,
    message: state.message,
    showMessage: state.showMessage,
    isInteracting: state.isInteracting,
    interact,
    setExpression,
    hideMessage
  };
};

export { useSerenito };
export default useSerenito;