import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore-mock';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import MoodAssessmentPageSimple from './pages/MoodAssessmentPage-simple';
import BreathingExercisePageSimple from './pages/BreathingExercisePage-simple';
import DailyTrackingPageSimple from './pages/DailyTrackingPage-simple';
import ActivityBoardPageSimple from './pages/ActivityBoardPage-simple';
import EducationalContentPageSimple from './pages/EducationalContentPage-simple';

// Componente de carga
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-lg text-gray-600">Cargando SERENO...</p>
    </div>
  </div>
);

// Componente de página no encontrada
const NotFoundPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-700 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-8">Página no encontrada</p>
      <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
        Volver al inicio
      </a>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rutas protegidas */}
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
        
        {/* Páginas funcionales */}
        <Route path="/mood-assessment" element={
          <ProtectedRoute>
            <Layout>
              <MoodAssessmentPageSimple />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/breathing-exercise" element={
          <ProtectedRoute>
            <Layout>
              <BreathingExercisePageSimple />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/daily-tracking" element={
          <ProtectedRoute>
            <Layout>
              <DailyTrackingPageSimple />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/activities" element={
          <ProtectedRoute>
            <Layout>
              <ActivityBoardPageSimple />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/education" element={
          <ProtectedRoute>
            <Layout>
              <EducationalContentPageSimple />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/emergency" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-8 text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">🚨 Emergencia</h1>
                <p className="text-lg text-gray-600 mb-6">Si necesitas ayuda inmediata, contacta:</p>
                <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                  <p className="font-bold text-xl text-red-600 mb-2">📞 Línea de Crisis</p>
                  <p className="text-2xl font-bold">024</p>
                  <p className="text-sm text-gray-500 mt-2">Disponible 24/7</p>
                </div>
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Ruta de fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;