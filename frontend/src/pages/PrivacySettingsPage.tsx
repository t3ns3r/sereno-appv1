import React from 'react';
import { useNavigate } from 'react-router-dom';
import PrivacySettings from '../components/Privacy/PrivacySettings';
import SeniorButton from '../components/UI/SeniorButton';

const PrivacySettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-start to-background-end">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <SeniorButton
            onClick={() => navigate('/profile')}
            className="bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            ← Volver al Perfil
          </SeniorButton>
        </div>

        {/* Privacy Settings Component */}
        <PrivacySettings />
      </div>
    </div>
  );
};

export default PrivacySettingsPage;