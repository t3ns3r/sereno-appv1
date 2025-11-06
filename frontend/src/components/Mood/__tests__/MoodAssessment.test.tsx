import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import MoodAssessment from '../MoodAssessment';

// Mock the hooks and components
vi.mock('../../hooks/useSerenito', () => ({
  default: () => ({
    expression: 'calm',
    message: 'Test message',
    showMessage: false,
    interact: vi.fn()
  })
}));

vi.mock('../VoiceRecorder', () => ({
  default: ({ onRecordingComplete }: any) => (
    <div data-testid="voice-recorder">
      <button 
        onClick={() => onRecordingComplete(new Blob(['test'], { type: 'audio/webm' }))}
        data-testid="mock-record-button"
      >
        Mock Record
      </button>
    </div>
  )
}));

describe('MoodAssessment', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders emotion selection step initially', () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('¿Cómo te sientes ahora?')).toBeInTheDocument();
    expect(screen.getByText('Selecciona la carita que mejor represente tu estado de ánimo actual')).toBeInTheDocument();
  });

  it('allows emotion selection and shows emotion details', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Click on a happy face (assuming it exists in EmotionalFaces)
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);

    // Should show selected emotion details
    await waitFor(() => {
      expect(screen.getByText('Contento')).toBeInTheDocument();
    });
  });

  it('progresses to description step after emotion selection', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Select emotion
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);

    // Click next
    const nextButton = screen.getByText('Siguiente');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Cuéntame más detalles')).toBeInTheDocument();
      expect(screen.getByText('¿Cómo prefieres compartir más sobre cómo te sientes?')).toBeInTheDocument();
    });
  });

  it('allows text input method selection', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Navigate to description step
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      expect(screen.getByText('Escribir texto')).toBeInTheDocument();
    });

    // Select text input
    fireEvent.click(screen.getByText('Escribir texto'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Describe cómo te sientes/)).toBeInTheDocument();
    });
  });

  it('allows voice input method selection', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Navigate to description step
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      expect(screen.getByText('Grabar mi voz')).toBeInTheDocument();
    });

    // Select voice input
    fireEvent.click(screen.getByText('Grabar mi voz'));

    await waitFor(() => {
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    });
  });

  it('validates text input before allowing progression', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Navigate to text input
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Escribir texto'));
    });

    // Try to proceed without text
    const nextButton = screen.getByText('Siguiente');
    expect(nextButton).toBeDisabled();

    // Add text
    const textarea = screen.getByPlaceholderText(/Describe cómo te sientes/);
    fireEvent.change(textarea, { target: { value: 'Me siento muy bien hoy' } });

    // Now should be able to proceed
    expect(nextButton).not.toBeDisabled();
  });

  it('shows character count for text input', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Navigate to text input
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Escribir texto'));
    });

    const textarea = screen.getByPlaceholderText(/Describe cómo te sientes/);
    fireEvent.change(textarea, { target: { value: 'Test message' } });

    expect(screen.getByText('12/500 caracteres')).toBeInTheDocument();
  });

  it('progresses to review step after voice recording', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Navigate to voice input
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Grabar mi voz'));
    });

    // Complete voice recording
    const mockRecordButton = screen.getByTestId('mock-record-button');
    fireEvent.click(mockRecordButton);

    await waitFor(() => {
      expect(screen.getByText('Resumen de tu evaluación')).toBeInTheDocument();
    });
  });

  it('shows review summary with all selected data', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Complete full flow with text
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Escribir texto'));
    });

    const textarea = screen.getByPlaceholderText(/Describe cómo te sientes/);
    fireEvent.change(textarea, { target: { value: 'Me siento muy bien hoy' } });
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      expect(screen.getByText('Resumen de tu evaluación')).toBeInTheDocument();
      expect(screen.getByText('Estado de ánimo seleccionado')).toBeInTheDocument();
      expect(screen.getByText('Descripción adicional')).toBeInTheDocument();
      expect(screen.getByText('Me siento muy bien hoy')).toBeInTheDocument();
    });
  });

  it('completes assessment and calls onComplete with correct data', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Complete full flow
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Escribir texto'));
    });

    const textarea = screen.getByPlaceholderText(/Describe cómo te sientes/);
    fireEvent.change(textarea, { target: { value: 'Me siento muy bien hoy' } });
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Guardar evaluación'));
    });

    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedEmotion: expect.objectContaining({
          id: 'happy',
          label: 'Contento'
        }),
        textDescription: 'Me siento muy bien hoy',
        timestamp: expect.any(Date)
      })
    );
  });

  it('allows navigation back to previous steps', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Navigate forward
    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);
    fireEvent.click(screen.getByText('Siguiente'));

    // Go back
    fireEvent.click(screen.getByText('Anterior'));

    await waitFor(() => {
      expect(screen.getByText('¿Cómo te sientes ahora?')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel is clicked on first step', () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables next button when no emotion is selected', () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    const nextButton = screen.getByText('Siguiente');
    expect(nextButton).toBeDisabled();
  });

  it('shows progress indicators correctly', async () => {
    render(
      <MoodAssessment 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Check initial progress (should have 3 dots)
    const progressDots = screen.getAllByRole('generic').filter(el => 
      el.className.includes('w-3 h-3 rounded-full')
    );
    expect(progressDots).toHaveLength(3);

    // First dot should be active (primary color)
    expect(progressDots[0]).toHaveClass('bg-primary-500');
    expect(progressDots[1]).toHaveClass('bg-gray-300');
    expect(progressDots[2]).toHaveClass('bg-gray-300');
  });
});