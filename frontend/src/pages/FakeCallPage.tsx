import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FakeCallInterface } from '../components/FakeCall/FakeCallInterface';
import { useTranslation } from '../i18n';

export const FakeCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [callAnswered, setCallAnswered] = useState(false);

  const handleAnswer = () => {
    setCallAnswered(true);
    // Redirect to mood assessment after a brief delay
    setTimeout(() => {
      navigate('/mood-assessment');
    }, 2000);
  };

  const handleDecline = () => {
    // Return to home page
    navigate('/');
  };

  return (
    <FakeCallInterface
      onAnswer={handleAnswer}
      onDecline={handleDecline}
      callerName="SERENITO"
    />
  );
};