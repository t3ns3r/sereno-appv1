import { useState, useEffect } from 'react';
import { fakeCallService } from '../services/fakeCallService';

interface FakeCallState {
  isCallActive: boolean;
  callId: string | null;
  redirectAction: 'mood_check' | 'breathing_exercise' | 'daily_tracking' | null;
}

export const useFakeCall = () => {
  const [callState, setCallState] = useState<FakeCallState>({
    isCallActive: false,
    callId: null,
    redirectAction: null
  });

  const [settings, setSettings] = useState(fakeCallService.getSettings());

  useEffect(() => {
    const handleFakeCall = (event: CustomEvent) => {
      const { callId, redirectAction } = event.detail;
      setCallState({
        isCallActive: true,
        callId,
        redirectAction
      });
    };

    // Listen for fake call events
    window.addEventListener('fakeCallTriggered', handleFakeCall as EventListener);

    return () => {
      window.removeEventListener('fakeCallTriggered', handleFakeCall as EventListener);
    };
  }, []);

  const answerCall = () => {
    setCallState(prev => ({
      ...prev,
      isCallActive: false
    }));
    return callState.redirectAction;
  };

  const declineCall = () => {
    setCallState({
      isCallActive: false,
      callId: null,
      redirectAction: null
    });
  };

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    fakeCallService.updateSettings(updatedSettings);
  };

  const triggerTestCall = () => {
    fakeCallService.triggerManualCall();
  };

  const getNextScheduledCall = () => {
    return fakeCallService.getNextScheduledCall();
  };

  const getCallHistory = () => {
    return fakeCallService.getCallHistory();
  };

  return {
    // State
    isCallActive: callState.isCallActive,
    callId: callState.callId,
    redirectAction: callState.redirectAction,
    settings,

    // Actions
    answerCall,
    declineCall,
    updateSettings,
    triggerTestCall,
    getNextScheduledCall,
    getCallHistory
  };
};