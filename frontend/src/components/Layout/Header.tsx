import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { LanguageSelector } from '../UI/LanguageSelector';
import { useTranslation } from '../../i18n';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-sereno-gradient rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">SERENO</h1>
              <p className="text-sm text-gray-600">{t('nav.home')} - {t('common.loading')}</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <LanguageSelector variant="header" showLabel={false} />
            {/* User Info */}
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              onClick={() => navigate('/profile')}
            >
              <UserCircleIcon className="w-8 h-8 text-gray-600" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">
                  {user?.profile?.firstName || user?.username || 'Usuario'}
                </p>
                <p className="text-xs text-gray-600">{t('nav.profile')}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              title={t('auth.logout')}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;