import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore-mock';
import SocialAuthButtons from '../components/Auth/SocialAuthButtons';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading, mockLogin, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    email: 'demo@sereno.com',
    password: 'demo123',
  });
  const [error, setError] = useState('');
  const [showAutoLogin, setShowAutoLogin] = useState(true);

  // Auto-login después de 2 segundos para demo
  useEffect(() => {
    if (!isAuthenticated && showAutoLogin) {
      const timer = setTimeout(() => {
        mockLogin();
        navigate('/');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, showAutoLogin, mockLogin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAutoLogin(false);
    setError('');
    setLoading(true);

    try {
      // Usar el mock login del store
      mockLogin();
      navigate('/');
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = () => {
    setShowAutoLogin(false);
    mockLogin();
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSocialAuth = async (provider: string) => {
    setShowAutoLogin(false);
    setError('');
    setLoading(true);

    try {
      // TODO: Implement actual social auth in later tasks
      console.log(`Social login with ${provider}`);
      
      // Simulate successful social login
      mockLogin();
      navigate('/');
    } catch (err) {
      setError(`Error al iniciar sesión con ${provider}. Inténtalo de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-gentle-entrance">
          <div className="w-20 h-20 bg-sereno-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SERENO</h1>
          <p className="text-gray-600">Bienvenido de vuelta</p>
        </div>

        {/* Demo Login */}
        <div className="card-senior animate-gentle-entrance" style={{ animationDelay: '200ms' }}>
          {showAutoLogin ? (
            <div className="text-center space-y-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Iniciando sesión automáticamente...
                </h3>
                <p className="text-gray-600 mb-4">
                  Accediendo como usuario demo
                </p>
                <button
                  onClick={handleManualLogin}
                  className="btn-primary"
                >
                  Entrar ahora
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Social Auth Buttons */}
              <div className="mb-6">
                <SocialAuthButtons mode="login" onSocialAuth={handleSocialAuth} />
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">O iniciar sesión con email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-emergency-50 border border-emergency-200 text-emergency-700 px-4 py-3 rounded-senior">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-senior">
                <p className="font-medium">Aplicación Demo</p>
                <p className="text-sm">Credenciales precargadas para demostración</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-senior w-full"
                  placeholder="demo@sereno.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-senior w-full"
                  placeholder="demo123"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                Iniciar Sesión Demo
              </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Esta es una versión de demostración de SERENO
            </p>
          </div>
        </div>

        {/* SERENITO Welcome */}
        <div className="text-center mt-6 animate-gentle-entrance" style={{ animationDelay: '400ms' }}>
          <div className="w-16 h-16 bg-secondary-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl">🧘‍♀️</span>
          </div>
          <p className="text-gray-600 text-sm">
            "Hola, soy SERENITO. Estoy aquí para acompañarte en tu bienestar mental."
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;