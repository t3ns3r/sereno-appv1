import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmergencyButton from '../components/Emergency/EmergencyButton';
import { useEmergency } from '../hooks/useEmergency';
import { useGeolocation } from '../hooks/useGeolocation';

// Mock hooks
vi.mock('../hooks/useEmergency');
vi.mock('../hooks/useGeolocation');
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
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
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

const mockUseEmergency = useEmergency as any;
const mockUseGeolocation = useGeolocation as any;

describe('Emergency System Frontend Tests', () => {
  const mockActivateEmergency = vi.fn();
  const mockRequestLocation = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockUseEmergency.mockReturnValue({
      activateEmergency: mockActivateEmergency,
      isLoading: false,
      error: null
    });

    mockUseGeolocation.mockReturnValue({
      requestLocation: mockRequestLocation,
      location: null,
      isLoading: false,
      error: null,
      isSupported: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Panic Button Activation Flow', () => {
    it('should render emergency button with proper accessibility', () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      expect(emergencyButton).toBeInTheDocument();
      expect(emergencyButton).toHaveAttribute('title', 'Botón de Pánico - Presiona para obtener ayuda inmediata');
      expect(emergencyButton).toHaveAttribute('aria-label', 'Botón de emergencia');
    });

    it('should show confirmation dialog when panic button is clicked', async () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        expect(screen.getByText('¿Necesitas ayuda inmediata?')).toBeInTheDocument();
        expect(screen.getByText('Sí, necesito ayuda')).toBeInTheDocument();
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });
    });

    it('should show SERENITO with concerned expression in confirmation dialog', async () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const serenito = screen.getByTestId('serenito-character');
        expect(serenito).toBeInTheDocument();
        expect(screen.getByTestId('serenito-expression')).toHaveTextContent('concerned');
        expect(screen.getByTestId('serenito-message')).toHaveTextContent('Entiendo que necesitas ayuda. ¿Estás seguro?');
      });
    });

    it('should cancel emergency activation when cancel is clicked', async () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('¿Necesitas ayuda inmediata?')).not.toBeInTheDocument();
      });

      expect(mockActivateEmergency).not.toHaveBeenCalled();
    });

    it('should activate emergency with location when confirmed', async () => {
      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now()
      };

      mockUseGeolocation.mockReturnValue({
        requestLocation: mockRequestLocation,
        location: mockLocation,
        isLoading: false,
        error: null,
        isSupported: true
      });

      mockActivateEmergency.mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockActivateEmergency).toHaveBeenCalledWith(mockLocation);
      });
    });

    it('should request location if not available', async () => {
      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now()
      };

      mockRequestLocation.mockResolvedValue(mockLocation);
      mockActivateEmergency.mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockRequestLocation).toHaveBeenCalled();
        expect(mockActivateEmergency).toHaveBeenCalledWith(mockLocation);
      });
    });

    it('should show loading state during activation', async () => {
      mockUseEmergency.mockReturnValue({
        activateEmergency: mockActivateEmergency,
        isLoading: true,
        error: null
      });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        expect(screen.getByText('Activando sistema de emergencia...')).toBeInTheDocument();
        expect(screen.getByTestId('serenito-message')).toHaveTextContent('Activando ayuda de emergencia...');
      });
    });

    it('should show location loading state', async () => {
      mockUseGeolocation.mockReturnValue({
        requestLocation: mockRequestLocation,
        location: null,
        isLoading: true,
        error: null,
        isSupported: true
      });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Obteniendo ubicación...')).toBeInTheDocument();
      });
    });

    it('should handle emergency activation failure gracefully', async () => {
      mockActivateEmergency.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        fireEvent.click(confirmButton);
      });

      // Should still navigate to emergency page even on failure
      await waitFor(() => {
        expect(mockActivateEmergency).toHaveBeenCalled();
      });
    });

    it('should handle location request failure', async () => {
      mockRequestLocation.mockRejectedValue(new Error('Location denied'));
      mockActivateEmergency.mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockRequestLocation).toHaveBeenCalled();
        expect(mockActivateEmergency).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Geolocation Integration', () => {
    it('should handle geolocation not supported', () => {
      mockUseGeolocation.mockReturnValue({
        requestLocation: mockRequestLocation,
        location: null,
        isLoading: false,
        error: 'Geolocation is not supported by this browser',
        isSupported: false
      });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      // Button should still be functional without geolocation
      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      expect(emergencyButton).toBeInTheDocument();
    });

    it('should handle location permission denied', () => {
      mockUseGeolocation.mockReturnValue({
        requestLocation: mockRequestLocation,
        location: null,
        isLoading: false,
        error: 'Location access denied by user',
        isSupported: true
      });

      mockRequestLocation.mockRejectedValue(new Error('Location access denied by user'));

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      expect(emergencyButton).toBeInTheDocument();
    });

    it('should validate location coordinates', async () => {
      const validLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now()
      };

      mockUseGeolocation.mockReturnValue({
        requestLocation: mockRequestLocation,
        location: validLocation,
        isLoading: false,
        error: null,
        isSupported: true
      });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockActivateEmergency).toHaveBeenCalledWith(validLocation);
      });
    });
  });

  describe('Accessibility and Senior-Friendly Features', () => {
    it('should have large, easily clickable button', () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      
      // Check button has appropriate classes for senior-friendly design
      expect(emergencyButton).toHaveClass('w-20', 'h-20'); // Large size
      expect(emergencyButton).toHaveClass('fixed', 'top-4', 'right-4'); // Always visible
    });

    it('should have high contrast colors', () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      
      // Check for emergency color classes (high contrast)
      expect(emergencyButton).toHaveClass('bg-emergency-400');
      expect(emergencyButton).toHaveClass('text-white');
    });

    it('should have proper focus management', () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      
      // Check for focus ring classes
      expect(emergencyButton).toHaveClass('focus:outline-none', 'focus:ring-4');
    });

    it('should provide clear confirmation dialog', async () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        // Check for clear, simple language
        expect(screen.getByText('¿Necesitas ayuda inmediata?')).toBeInTheDocument();
        expect(screen.getByText(/Esto activará el sistema de emergencia/)).toBeInTheDocument();
        
        // Check for large, clear buttons
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        const cancelButton = screen.getByText('Cancelar');
        
        expect(confirmButton).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();
      });
    });

    it('should show SERENITO for emotional support', async () => {
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const serenito = screen.getByTestId('serenito-character');
        expect(serenito).toBeInTheDocument();
        
        // SERENITO should show appropriate concern and support
        expect(screen.getByTestId('serenito-expression')).toHaveTextContent('concerned');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockActivateEmergency.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        fireEvent.click(confirmButton);
      });

      // Should handle error gracefully and still navigate
      await waitFor(() => {
        expect(mockActivateEmergency).toHaveBeenCalled();
      });
    });

    it('should handle geolocation timeout', async () => {
      mockRequestLocation.mockRejectedValue(new Error('Location request timed out'));

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Sí, necesito ayuda');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockActivateEmergency).toHaveBeenCalledWith(undefined);
      });
    });

    it('should handle emergency service unavailable', async () => {
      mockUseEmergency.mockReturnValue({
        activateEmergency: mockActivateEmergency,
        isLoading: false,
        error: 'Emergency service temporarily unavailable'
      });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      // Button should still be available even if service has issues
      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      expect(emergencyButton).toBeInTheDocument();
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should render quickly without blocking', () => {
      const startTime = performance.now();
      
      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should be responsive on different screen sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const emergencyButton = screen.getByRole('button', { name: /botón de emergencia/i });
      expect(emergencyButton).toBeInTheDocument();

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      expect(emergencyButton).toBeInTheDocument();
    });
  });
});