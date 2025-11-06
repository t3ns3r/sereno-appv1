import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useFakeCall } from './hooks/useFakeCall';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginPageDemoEnhanced from './pages/LoginPage-demo-enhanced';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import MoodAssessmentPage from './pages/MoodAssessmentPage';
import BreathingExercisePage from './pages/BreathingExercisePage';
import EmergencyPage from './pages/EmergencyPage';
import ActivityBoardPage from './pages/ActivityBoardPage';
import DailyTrackingPage from './pages/DailyTrackingPage';
import EducationalContentPage from './pages/EducationalContentPage';
import FakeCallPage from './pages/FakeCallPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { FakeCallInterface } from './components/FakeCall/FakeCallInterface';
import { InstallPrompt } from './components/PWA/InstallPrompt';
import { OfflineIndicator } from './components/PWA/OfflineIndicator';

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isCallActive, answerCall, declineCall, redirectAction } = useFakeCall();
  const navigate = useNavigate();

  const handleAnswerCall = () => {
    const action = answerCall();
    
    // Redirect based on the call's intended action
    switch (action) {
      case 'mood_check':
        navigate('/mood-assessment');
        break;
      case 'breathing_exercise':
        navigate('/breathing-exercise');
        break;
      case 'daily_tracking':
        navigate('/daily-tracking');
        break;
      default:
        navigate('/');
    }
  };

  const handleDeclineCall = () => {
    declineCall();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sky-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando SERENO...</p>
        </div>
      </div>
    );
  }

  // Show fake call interface if a call is active
  if (isCallActive) {
    return (
      <FakeCallInterface
        onAnswer={handleAnswerCall}
        onDecline={handleDeclineCall}
        callerName="SERENITO"
      />
    );
  }

  return (
    <div className="min-h-screen bg-sky-gradient">
      {/* PWA Components */}
      <OfflineIndicator />
      <InstallPrompt />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPageDemoEnhanced />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <HomePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/privacy-settings" element={
          <ProtectedRoute>
            <Layout>
              <PrivacySettingsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/mood-assessment" element={
          <ProtectedRoute>
            <Layout>
              <MoodAssessmentPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/breathing-exercise" element={
          <ProtectedRoute>
            <Layout>
              <BreathingExercisePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/emergency" element={
          <ProtectedRoute>
            <Layout>
              <EmergencyPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/activities" element={
          <ProtectedRoute>
            <Layout>
              <ActivityBoardPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/daily-tracking" element={
          <ProtectedRoute>
            <Layout>
              <DailyTrackingPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/education" element={
          <ProtectedRoute>
            <Layout>
              <EducationalContentPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/fake-call" element={
          <ProtectedRoute>
            <FakeCallPage />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={
          <div className="min-h-screen bg-sky-gradient flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-700 mb-4">404</h1>
              <p className="text-lg text-gray-600 mb-8">Página no encontrada</p>
              <a href="/" className="btn-primary">
                Volver al inicio
              </a>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;