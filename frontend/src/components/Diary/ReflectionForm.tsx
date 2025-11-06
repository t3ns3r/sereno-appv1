import React from 'react';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';

interface ReflectionData {
  worries: string;
  gratitude: string;
}

interface ReflectionFormProps {
  reflectionData: ReflectionData;
  onReflectionChange: (data: ReflectionData) => void;
  onSave: () => void;
  onBack: () => void;
}

const ReflectionForm: React.FC<ReflectionFormProps> = ({
  reflectionData,
  onReflectionChange,
  onSave,
  onBack
}) => {
  const getSerenitoMessage = () => {
    const hasWorries = reflectionData.worries.trim().length > 0;
    const hasGratitude = reflectionData.gratitude.trim().length > 0;
    
    if (hasWorries && hasGratitude) {
      return "Me alegra que puedas expresar tanto tus preocupaciones como tu gratitud. Esto muestra gran autoconocimiento.";
    } else if (hasWorries) {
      return "Entiendo tus preocupaciones. Escribir sobre ellas puede ayudarte a procesarlas mejor.";
    } else if (hasGratitude) {
      return "¡Qué hermoso leer sobre tu gratitud! La gratitud es una fuente poderosa de bienestar.";
    } else {
      return "Este es un espacio seguro para reflexionar. Puedes compartir tus preocupaciones y también aquello por lo que te sientes agradecido.";
    }
  };

  const updateWorries = (value: string) => {
    onReflectionChange({ ...reflectionData, worries: value });
  };

  const updateGratitude = (value: string) => {
    onReflectionChange({ ...reflectionData, gratitude: value });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression="supportive"
          size="lg"
          message={getSerenitoMessage()}
          showMessage={true}
          className="mb-6"
        />
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Momento de Reflexión
        </h2>
        <p className="text-gray-600">
          Un espacio para desahogarte y practicar la gratitud
        </p>
      </div>

      {/* Worries Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">💭</span>
          <h3 className="text-lg font-semibold text-gray-800">
            ¿Qué te preocupa hoy?
          </h3>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
          <p className="text-orange-800 text-sm">
            <strong>Espacio de desahogo:</strong> Escribe libremente sobre lo que te inquieta. 
            No hay juicios aquí, solo comprensión.
          </p>
        </div>
        
        <textarea
          value={reflectionData.worries}
          onChange={(e) => updateWorries(e.target.value)}
          placeholder="Puedes escribir sobre cualquier cosa que te preocupe: trabajo, relaciones, salud, el futuro... Este es tu espacio seguro para expresarte."
          className="w-full h-32 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          maxLength={1000}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {reflectionData.worries.length}/1000 caracteres
        </div>
      </div>

      {/* Gratitude Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">🙏</span>
          <h3 className="text-lg font-semibold text-gray-800">
            ¿Por qué te sientes agradecido/a?
          </h3>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-green-800 text-sm">
            <strong>Práctica de gratitud:</strong> Reconocer lo bueno en tu vida, 
            por pequeño que sea, puede mejorar significativamente tu bienestar.
          </p>
        </div>
        
        <textarea
          value={reflectionData.gratitude}
          onChange={(e) => updateGratitude(e.target.value)}
          placeholder="Puede ser algo simple como 'el café de esta mañana', 'una llamada de un amigo', 'tener salud', 'un momento de paz'... Todo cuenta."
          className="w-full h-32 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          maxLength={1000}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {reflectionData.gratitude.length}/1000 caracteres
        </div>
      </div>

      {/* Reflection Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Tips para reflexionar:</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• No hay respuestas correctas o incorrectas</li>
          <li>• Sé honesto contigo mismo</li>
          <li>• Incluso en días difíciles, trata de encontrar algo pequeño por lo que agradecer</li>
          <li>• Escribir tus pensamientos puede ayudarte a procesarlos mejor</li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          ← Volver
        </button>
        
        <button
          onClick={onSave}
          className="flex-1 py-3 px-6 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          💾 Guardar Entrada
        </button>
      </div>
    </div>
  );
};

export default ReflectionForm;