import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore-mock';
import useSerenito from '../hooks/useSerenito';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import MainNavigation from '../components/Navigation/MainNavigation';
import SeniorCard from '../components/UI/SeniorCard';
import MentalHealthTracker from '../components/Progress/MentalHealthTracker';
import { useTranslation } from '../i18n';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { expression, message, showMessage, interact } = useSerenito();
  const { t } = useTranslation();



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  const getUserName = () => {
    return user?.profile?.firstName || user?.username || 'Usuario';
  };

  const handleNavigation = (path: string) => {
    // Show encouraging message before navigation
    interact('encourage');
    setTimeout(() => navigate(path), 1500);
  };

  const handleSerenitoClick = () => {
    interact('encourage');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Section with SERENITO */}
      <div className="text-center mb-8 animate-gentle-entrance">
        <SerenitoCharacter
          expression={expression}
          size="xl"
          message={message}
          showMessage={showMessage}
          onClick={handleSerenitoClick}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {getGreeting()}, {getUserName()}
        </h1>
        <p className="text-lg text-gray-600">
          {t('home.subtitle')}
        </p>
      </div>

      {/* Mental Health Tracker */}
      <div className="mb-8 animate-gentle-entrance" style={{ animationDelay: '300ms' }}>
        <MentalHealthTracker />
      </div>

      {/* Navigation Grid */}
      <div className="mb-8">
        <MainNavigation
          layout="grid"
          showHome={false}
          onNavigate={handleNavigation}
        />
      </div>

      {/* Daily Motivation */}
      <SeniorCard
        title={t('home.dailyThought')}
        variant="gradient"
        className="text-center animate-gentle-entrance"
        style={{ animationDelay: '600ms' } as React.CSSProperties}
      >
        <p className="text-gray-600 italic mb-4">
          "{t('home.quote')}"
        </p>
        <div className="text-sm text-gray-500">
          - {t('home.quoteAuthor')}
        </div>
      </SeniorCard>
    </div>
  );
};

export default HomePage;