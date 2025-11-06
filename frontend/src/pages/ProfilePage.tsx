import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8 animate-gentle-entrance">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal</p>
      </div>

      <div className="card-senior animate-gentle-entrance" style={{ animationDelay: '200ms' }}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-sereno-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">
              {user?.profile?.firstName?.[0] || user?.username?.[0] || 'U'}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            {user?.profile?.firstName} {user?.profile?.lastName}
          </h2>
          <p className="text-gray-600">@{user?.username}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <div className="input-senior w-full bg-gray-50 text-gray-600">
              {user?.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <div className="input-senior w-full bg-gray-50 text-gray-600">
              {user?.country}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <div className="input-senior w-full bg-gray-50 text-gray-600">
              {user?.role === 'USER' ? 'Usuario' : user?.role}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button className="w-full btn-primary">
            Editar Perfil
          </button>
          <button 
            onClick={() => navigate('/privacy-settings')}
            className="w-full btn-senior bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Configuración de Privacidad
          </button>
        </div>
      </div>

      {/* SERENITO Encouragement */}
      <div className="card-senior mt-6 text-center animate-gentle-entrance" style={{ animationDelay: '400ms' }}>
        <div className="w-16 h-16 bg-secondary-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-xl">🧘‍♀️</span>
        </div>
        <p className="text-gray-600">
          "Mantener tu perfil actualizado me ayuda a brindarte un mejor apoyo personalizado."
        </p>
        <p className="text-sm text-gray-500 mt-2">- SERENITO</p>
      </div>
    </div>
  );
};

export default ProfilePage;