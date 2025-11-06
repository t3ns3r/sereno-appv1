import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import SocialAuthButtons from '../components/Auth/SocialAuthButtons';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    country: 'ES',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement actual API call in later tasks
      console.log('Register attempt:', formData);
      
      // Simulate successful registration
      const mockUser = {
        id: '1',
        email: formData.email,
        username: formData.username,
        country: formData.country,
        role: 'USER',
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        }
      };
      
      const mockToken = 'mock-jwt-token';
      
      setAuth(mockUser, mockToken);
      navigate('/');
    } catch (err) {
      setError('Error al crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSocialAuth = async (provider: string) => {
    setError('');
    setLoading(true);

    try {
      // TODO: Implement actual social auth in later tasks
      console.log(`Social auth with ${provider}`);
      
      // Simulate successful social registration
      const mockUser = {
        id: '1',
        email: `user@${provider}.com`,
        username: `${provider}_user`,
        country: 'ES',
        role: 'USER',
        profile: {
          firstName: 'Usuario',
          lastName: provider.charAt(0).toUpperCase() + provider.slice(1),
        }
      };
      
      const mockToken = `mock-${provider}-token`;
      
      setAuth(mockUser, mockToken);
      navigate('/');
    } catch (err) {
      setError(`Error al registrarse con ${provider}. Inténtalo de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-gentle-entrance">
          <div className="w-20 h-20 bg-sereno-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Únete a SERENO</h1>
          <p className="text-gray-600">Crea tu cuenta para comenzar</p>
        </div>

        <div className="card-senior animate-gentle-entrance" style={{ animationDelay: '200ms' }}>
          {/* Social Auth Buttons */}
          <div className="mb-6">
            <SocialAuthButtons mode="register" onSocialAuth={handleSocialAuth} />
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O registrarse con email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-emergency-50 border border-emergency-200 text-emergency-700 px-4 py-3 rounded-senior">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-senior w-full"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-senior w-full"
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-senior w-full"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-senior w-full"
                placeholder="usuario123"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                País *
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="input-senior w-full"
              >
                <option value="ES">España</option>
                <option value="MX">México</option>
                <option value="AR">Argentina</option>
                <option value="CO">Colombia</option>
                <option value="PE">Perú</option>
                <option value="CL">Chile</option>
                <option value="US">Estados Unidos</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-senior w-full"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input-senior w-full"
                placeholder="Repite tu contraseña"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary"
            >
              Crear Cuenta
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;