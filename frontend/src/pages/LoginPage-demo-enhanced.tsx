import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore-mock';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import SeniorButton from '../components/UI/SeniorButton';
import SocialAuthButtons from '../components/Auth/SocialAuthButtons';

const LoginPageDemoEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { mockLogin } = useAuthStore();

  const handleDemoLogin = () => {
    mockLogin();
    navigate('/');
  };

  const handleSocialAuth = (provider: string) => {
    console.log(`Demo social login with ${provider}`);
    mockLogin();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <SerenitoCharacter
            expression="welcoming"
            size="xl"
            message="¡Bienvenido a SERENO! Elige cómo quieres acceder a tu bienestar mental."
            showMessage={true}
            className="mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido a SERENO
          </h1>
          <p className="text-lg text-gray-600">
            Tu compañero de salud mental
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Accede a tu cuenta
            </h2>
          </div>

          {/* Social Auth Options */}
          <div className="space-y-4 mb-6">
            <SocialAuthButtons mode="login" onSocialAuth={handleSocialAuth} />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O accede como demo</span>
            </div>
          </div>

          {/* Demo Access */}
          <div className="space-y-4">
            <SeniorButton
              variant="primary"
              fullWidth
              onClick={handleDemoLogin}
            >
              🚀 Acceso Demo Rápido
            </SeniorButton>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Versión de demostración - Explora todas las funcionalidades
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-semibold text-blue-800 mb-2">
              ✨ Lo que encontrarás en SERENO:
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 🧠 Evaluación de estado de ánimo personalizada</li>
              <li>• 🫁 Ejercicios de respiración guiados</li>
              <li>• 📊 Seguimiento diario de tu bienestar</li>
              <li>• 👥 Actividades comunitarias</li>
              <li>• 📚 Contenido educativo especializado</li>
              <li>• 🤖 SERENITO - Tu compañero virtual</li>
            </ul>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Primera vez en SERENO?{' '}
              <button 
                onClick={() => navigate('/register')}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Crear cuenta nueva
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            SERENO v1.0 - Cuidando tu salud mental
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPageDemoEnhanced;