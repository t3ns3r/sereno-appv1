import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FakeCallInterface from '../components/FakeCall/FakeCallInterface';
import FakeCallSettings from '../components/FakeCall/FakeCallSettings';
import { useFakeCall } from '../hooks/useFakeCall';

// Mock hooks
vi.mock('../hooks/useFakeCall');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock SERENITO component
vi.mock('../components/SERENITO/SerenitoCharacter', () => ({
  default: ({ message, expression }: any) => (
    <div data-testid="serenito-character">
      <span data-testid="serenito-expression">{expression}</span>
      <span data-testid="serenito-message">{message}</span>
    </div>
  )
}));

const mockUseFakeCall = useFakeCall as any;

describe('Fake Call System Frontend Tests', () => {
  const mockAnswerCall = vi.fn();
  const mockUpdateSettings = vi.fn();
  const mockTriggerCall = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockUseFakeCall.mockReturnValue({
      answerCall: mockAnswerCall,
      updateSettings: mockUpdateSettings,
      triggerCall: mockTriggerCall,
      settings: {
        enabled: true,
        frequency: 'RANDOM',
        timeRange: {
          start: '09:00',
          end: '21:00'
        }
      },
      history: [],
      isLoading: false,
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Fake Call Interface', () => {
    const mockCall = {
      id: 'test-call-id',
      scheduledTime: new Date().toISOString(),
      answered: false,
      redirectAction: 'mood_check' as const
    };

    it('should render fake call interface with realistic phone UI', () => {
      render(
        <BrowserRouter>
          <FakeCallInterface call={mockCall} />
        </BrowserRouter>
      );

      // Check for phone call UI elements
      expect(screen.getByText('SERENITO te está llamando')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contestar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument();
    });

    it('should show SERENITO as the caller', () => {
      render(
        <BrowserRouter>
          <FakeCallInterface call={mockCall} />
        </BrowserRouter>
      );

      expect(screen.getByText('SERENITO te está llamando')).toBeInTheDocument();
      expect(screen.getByTestId('serenito-character')).toBeInTheDocument();
      expect(screen.getByTestId('serenito-expression')).toHaveTextContent('friendly');
    });

    it('should have large, senior-friendly answer and reject buttons', () => {
      render(
        <BrowserRouter>
          <FakeCallInterface call={mockCall} />
        </BrowserRouter>
      );

      const answerButton = screen.getByRole('button', { name: /contestar/i });
      const rejectButton = screen.getByRole('button', { name: /rechazar/i });

      // Check for senior-friendly button classes
      expect(answerButton).toHaveClass('w-20', 'h-20'); // Large size
      expect(rejectButton).toHaveClass('w-20', 'h-20');
      
      // Check for high contrast colors
      expect(answerButton).toHaveClass('bg-green-500');
      expect(rejectButton).toHaveClass('bg-red-500');
    });

    it('should answer call and redirect to appropriate feature', async () => {
      mockAnswerCall.mockResolvedValue({
        success: true,
        redirectUrl: '/mood-assessment'
      });

      render(
        <BrowserRouter>
          <FakeCallInterface call={mockCall} />
        </BrowserRouter>
      );

      const answerButton = screen.getByRole('button', { name: /contestar/i });
      fireEvent.click(answerButton);

      await waitFor(() => {
        expect(mockAnswerCall).toHaveBeenCalledWith(mockCall.id);
      });
    });

    it('should show different redirect messages based on action', () => {
      const breathingCall = {
        ...mockCall,
        redirectAction: 'breathing_exercise' as const
      };

      render(
        <BrowserRouter>
          <FakeCallInterface call={breathingCall} />
        </BrowserRouter>
      );

      expect(screen.getByText(/ejercicio de respiración/i)).toBeInTheDocument();
    });

    it('should handle call rejection gracefully', async () => {
      render(
        <BrowserRouter>
          <FakeCallInterface call={mockCall} />
        </BrowserRouter>
      );

      const rejectButton = screen.getByRole('button', { name: /rechazar/i });
      fireEvent.click(rejectButton);

      // Should close the call interface without calling answer
      expect(mockAnswerCall).not.toHaveBeenCalled();
    });

    it('should show loading state when answering call', async () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        isLoading: true
      });

      render(
        <BrowserRouter>
          <FakeCallInterface call={mockCall} />
        </BrowserRouter>
      );

      expect(screen.getByText('Conectando...')).toBeInTheDocument();
    });

    it('should display call duration timer', async () => {
      render(
        <BrowserRouter>
          <FakeCallInterface call={mockCall} />
        </BrowserRouter>
      );

      // Should show a timer or duration indicator
      expect(screen.getByText(/00:00/)).toBeInTheDocument();
    });

    it('should have realistic phone call animations', () => {
      render(
        <BrowserRouter>
          <FakeCallInterface call={mockCall} />
        </BrowserRouter>
      );

      // Check for phone call animation elements
      const callInterface = screen.getByTestId('fake-call-interface');
      expect(callInterface).toHaveClass('animate-pulse'); // Incoming call animation
    });
  });

  describe('Fake Call Settings', () => {
    it('should render settings form with all configuration options', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      // Check for all setting controls
      expect(screen.getByLabelText(/activar llamadas falsas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/frecuencia/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hora de inicio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hora de fin/i)).toBeInTheDocument();
    });

    it('should display current settings values', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const enabledToggle = screen.getByLabelText(/activar llamadas falsas/i) as HTMLInputElement;
      const frequencySelect = screen.getByLabelText(/frecuencia/i) as HTMLSelectElement;

      expect(enabledToggle.checked).toBe(true);
      expect(frequencySelect.value).toBe('RANDOM');
    });

    it('should have senior-friendly form controls', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      // Check for large, clear form elements
      const enabledToggle = screen.getByLabelText(/activar llamadas falsas/i);
      const frequencySelect = screen.getByLabelText(/frecuencia/i);

      expect(enabledToggle).toHaveClass('w-6', 'h-6'); // Large toggle
      expect(frequencySelect).toHaveClass('text-lg', 'p-3'); // Large select
    });

    it('should update enabled setting', async () => {
      mockUpdateSettings.mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const enabledToggle = screen.getByLabelText(/activar llamadas falsas/i);
      fireEvent.click(enabledToggle);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          enabled: false,
          frequency: 'RANDOM',
          timeRange: {
            start: '09:00',
            end: '21:00'
          }
        });
      });
    });

    it('should update frequency setting', async () => {
      mockUpdateSettings.mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const frequencySelect = screen.getByLabelText(/frecuencia/i);
      fireEvent.change(frequencySelect, { target: { value: 'DAILY' } });

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          enabled: true,
          frequency: 'DAILY',
          timeRange: {
            start: '09:00',
            end: '21:00'
          }
        });
      });
    });

    it('should update time range settings', async () => {
      mockUpdateSettings.mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const startTimeInput = screen.getByLabelText(/hora de inicio/i);
      const endTimeInput = screen.getByLabelText(/hora de fin/i);

      fireEvent.change(startTimeInput, { target: { value: '10:00' } });
      fireEvent.change(endTimeInput, { target: { value: '20:00' } });

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          enabled: true,
          frequency: 'RANDOM',
          timeRange: {
            start: '10:00',
            end: '20:00'
          }
        });
      });
    });

    it('should validate time range input', async () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const startTimeInput = screen.getByLabelText(/hora de inicio/i);
      const endTimeInput = screen.getByLabelText(/hora de fin/i);

      // Set invalid range (start after end)
      fireEvent.change(startTimeInput, { target: { value: '22:00' } });
      fireEvent.change(endTimeInput, { target: { value: '08:00' } });

      await waitFor(() => {
        expect(screen.getByText(/la hora de inicio debe ser anterior/i)).toBeInTheDocument();
      });

      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('should show frequency descriptions', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      // Check for helpful descriptions
      expect(screen.getByText(/diario: una llamada por día/i)).toBeInTheDocument();
      expect(screen.getByText(/semanal: una llamada por semana/i)).toBeInTheDocument();
      expect(screen.getByText(/aleatorio: llamadas en intervalos variables/i)).toBeInTheDocument();
    });

    it('should show SERENITO guidance for settings', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByTestId('serenito-character')).toBeInTheDocument();
      expect(screen.getByTestId('serenito-message')).toHaveTextContent(/configurar las llamadas/i);
    });

    it('should handle settings update errors', async () => {
      mockUpdateSettings.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const enabledToggle = screen.getByLabelText(/activar llamadas falsas/i);
      fireEvent.click(enabledToggle);

      await waitFor(() => {
        expect(screen.getByText(/error al actualizar configuración/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during settings update', async () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        isLoading: true
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByText(/guardando configuración/i)).toBeInTheDocument();
    });
  });

  describe('Call Scheduling Functionality', () => {
    it('should trigger manual fake call', async () => {
      mockTriggerCall.mockResolvedValue({
        success: true,
        call: {
          id: 'new-call-id',
          scheduledTime: new Date().toISOString(),
          redirectAction: 'mood_check'
        }
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const triggerButton = screen.getByRole('button', { name: /probar llamada ahora/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(mockTriggerCall).toHaveBeenCalledWith('mood_check');
      });
    });

    it('should allow selecting redirect action for manual call', async () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const actionSelect = screen.getByLabelText(/acción de redirección/i);
      fireEvent.change(actionSelect, { target: { value: 'breathing_exercise' } });

      const triggerButton = screen.getByRole('button', { name: /probar llamada ahora/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(mockTriggerCall).toHaveBeenCalledWith('breathing_exercise');
      });
    });

    it('should show next scheduled call time', () => {
      const nextCallTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        nextScheduledCall: nextCallTime.toISOString()
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByText(/próxima llamada programada/i)).toBeInTheDocument();
      expect(screen.getByText(nextCallTime.toLocaleTimeString())).toBeInTheDocument();
    });

    it('should disable manual trigger when fake calls are disabled', () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        settings: {
          enabled: false,
          frequency: 'RANDOM',
          timeRange: {
            start: '09:00',
            end: '21:00'
          }
        }
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const triggerButton = screen.getByRole('button', { name: /probar llamada ahora/i });
      expect(triggerButton).toBeDisabled();
    });
  });

  describe('Call History', () => {
    const mockHistory = [
      {
        id: 'call-1',
        scheduledTime: '2024-01-01T10:00:00Z',
        answered: true,
        redirectAction: 'mood_check' as const
      },
      {
        id: 'call-2',
        scheduledTime: '2024-01-02T14:00:00Z',
        answered: false,
        redirectAction: 'breathing_exercise' as const
      },
      {
        id: 'call-3',
        scheduledTime: '2024-01-03T16:00:00Z',
        answered: true,
        redirectAction: 'daily_tracking' as const
      }
    ];

    it('should display call history', () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        history: mockHistory
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByText(/historial de llamadas/i)).toBeInTheDocument();
      expect(screen.getByText('3 llamadas recientes')).toBeInTheDocument();
    });

    it('should show call status icons', () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        history: mockHistory
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      // Check for answered and missed call indicators
      expect(screen.getAllByTestId('answered-call-icon')).toHaveLength(2);
      expect(screen.getAllByTestId('missed-call-icon')).toHaveLength(1);
    });

    it('should show call times in user-friendly format', () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        history: mockHistory
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      // Should show relative times like "hace 2 días"
      expect(screen.getByText(/hace \d+ día/)).toBeInTheDocument();
    });

    it('should show redirect action for each call', () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        history: mockHistory
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByText(/evaluación de ánimo/i)).toBeInTheDocument();
      expect(screen.getByText(/ejercicio de respiración/i)).toBeInTheDocument();
      expect(screen.getByText(/seguimiento diario/i)).toBeInTheDocument();
    });

    it('should show empty state when no history exists', () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        history: []
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByText(/no hay llamadas recientes/i)).toBeInTheDocument();
      expect(screen.getByTestId('serenito-message')).toHaveTextContent(/cuando recibas llamadas/i);
    });
  });

  describe('User Configuration Options', () => {
    it('should provide clear frequency options', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const frequencySelect = screen.getByLabelText(/frecuencia/i);
      
      // Check all frequency options are available
      expect(screen.getByText('Diario')).toBeInTheDocument();
      expect(screen.getByText('Semanal')).toBeInTheDocument();
      expect(screen.getByText('Aleatorio')).toBeInTheDocument();
    });

    it('should validate time format input', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const startTimeInput = screen.getByLabelText(/hora de inicio/i);
      
      // Test invalid time format
      fireEvent.change(startTimeInput, { target: { value: '25:00' } });
      fireEvent.blur(startTimeInput);

      expect(screen.getByText(/formato de hora inválido/i)).toBeInTheDocument();
    });

    it('should show time range recommendations', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByText(/recomendamos entre 9:00 y 21:00/i)).toBeInTheDocument();
    });

    it('should allow disabling fake calls completely', async () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const enabledToggle = screen.getByLabelText(/activar llamadas falsas/i);
      fireEvent.click(enabledToggle);

      await waitFor(() => {
        expect(screen.getByText(/las llamadas falsas están desactivadas/i)).toBeInTheDocument();
      });
    });

    it('should show configuration impact on user experience', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      // Should explain what each setting does
      expect(screen.getByText(/las llamadas te ayudarán a mantener/i)).toBeInTheDocument();
      expect(screen.getByText(/frecuencia más alta = más recordatorios/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility and Senior-Friendly Features', () => {
    it('should have proper ARIA labels', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const enabledToggle = screen.getByLabelText(/activar llamadas falsas/i);
      const frequencySelect = screen.getByLabelText(/frecuencia/i);

      expect(enabledToggle).toHaveAttribute('aria-describedby');
      expect(frequencySelect).toHaveAttribute('aria-describedby');
    });

    it('should have large, clear text', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const mainHeading = screen.getByRole('heading', { name: /configuración de llamadas/i });
      expect(mainHeading).toHaveClass('text-2xl'); // Large heading
    });

    it('should have high contrast colors', () => {
      render(
        <BrowserRouter>
          <FakeCallInterface call={{
            id: 'test',
            scheduledTime: new Date().toISOString(),
            answered: false,
            redirectAction: 'mood_check'
          }} />
        </BrowserRouter>
      );

      const answerButton = screen.getByRole('button', { name: /contestar/i });
      const rejectButton = screen.getByRole('button', { name: /rechazar/i });

      expect(answerButton).toHaveClass('bg-green-500', 'text-white');
      expect(rejectButton).toHaveClass('bg-red-500', 'text-white');
    });

    it('should support keyboard navigation', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const enabledToggle = screen.getByLabelText(/activar llamadas falsas/i);
      const frequencySelect = screen.getByLabelText(/frecuencia/i);

      // Check for focus management
      expect(enabledToggle).toHaveAttribute('tabIndex');
      expect(frequencySelect).toHaveAttribute('tabIndex');
    });

    it('should provide clear error messages', async () => {
      mockUpdateSettings.mockRejectedValue(new Error('Validation failed'));

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      const enabledToggle = screen.getByLabelText(/activar llamadas falsas/i);
      fireEvent.click(enabledToggle);

      await waitFor(() => {
        const errorMessage = screen.getByText(/error al actualizar configuración/i);
        expect(errorMessage).toHaveClass('text-red-600'); // Clear error styling
      });
    });
  });

  describe('Integration with SERENITO', () => {
    it('should show SERENITO during fake call', () => {
      render(
        <BrowserRouter>
          <FakeCallInterface call={{
            id: 'test',
            scheduledTime: new Date().toISOString(),
            answered: false,
            redirectAction: 'mood_check'
          }} />
        </BrowserRouter>
      );

      expect(screen.getByTestId('serenito-character')).toBeInTheDocument();
      expect(screen.getByTestId('serenito-expression')).toHaveTextContent('friendly');
    });

    it('should show SERENITO guidance in settings', () => {
      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByTestId('serenito-character')).toBeInTheDocument();
      expect(screen.getByTestId('serenito-message')).toHaveTextContent(/configurar las llamadas/i);
    });

    it('should update SERENITO expression based on context', async () => {
      mockUseFakeCall.mockReturnValue({
        ...mockUseFakeCall(),
        isLoading: true
      });

      render(
        <BrowserRouter>
          <FakeCallSettings />
        </BrowserRouter>
      );

      expect(screen.getByTestId('serenito-expression')).toHaveTextContent('encouraging');
    });
  });
});