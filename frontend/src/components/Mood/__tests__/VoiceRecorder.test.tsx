import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import VoiceRecorder from '../VoiceRecorder';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as any,
  onstop: null as any,
  state: 'inactive'
};

const mockStream = {
  getTracks: () => [{ stop: vi.fn() }]
};

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn()
  }
});

// Mock MediaRecorder constructor
(global as any).MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder);

// Mock URL.createObjectURL
(global as any).URL = {
  createObjectURL: vi.fn(() => 'mock-audio-url'),
  revokeObjectURL: vi.fn()
};

describe('VoiceRecorder', () => {
  const mockOnRecordingComplete = vi.fn();
  const mockOnRecordingStart = vi.fn();
  const mockOnRecordingStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMediaRecorder.start.mockClear();
    mockMediaRecorder.stop.mockClear();
    (navigator.mediaDevices.getUserMedia as any).mockResolvedValue(mockStream);
  });

  it('renders record button initially', () => {
    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    expect(screen.getByText('Grabar mi voz')).toBeInTheDocument();
  });

  it('shows permission request when microphone access is denied', async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(new Error('Permission denied'));

    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    await waitFor(() => {
      expect(screen.getByText('Permisos de micrófono requeridos')).toBeInTheDocument();
      expect(screen.getByText('Permitir acceso')).toBeInTheDocument();
    });
  });

  it('starts recording when record button is clicked', async () => {
    render(
      <VoiceRecorder 
        onRecordingComplete={mockOnRecordingComplete}
        onRecordingStart={mockOnRecordingStart}
      />
    );

    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
      expect(mockOnRecordingStart).toHaveBeenCalled();
    });
  });

  it('shows stop button and timer when recording', async () => {
    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    await waitFor(() => {
      expect(screen.getByText('Detener grabación')).toBeInTheDocument();
      expect(screen.getByText(/0:00/)).toBeInTheDocument();
    });
  });

  it('stops recording when stop button is clicked', async () => {
    render(
      <VoiceRecorder 
        onRecordingComplete={mockOnRecordingComplete}
        onRecordingStop={mockOnRecordingStop}
      />
    );

    // Start recording
    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    await waitFor(() => {
      const stopButton = screen.getByText('Detener grabación');
      fireEvent.click(stopButton);
    });

    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(mockOnRecordingStop).toHaveBeenCalled();
  });

  it('shows playback controls after recording is complete', async () => {
    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    // Start recording
    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    // Simulate recording completion
    await waitFor(() => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Reproducir')).toBeInTheDocument();
      expect(screen.getByText('Borrar')).toBeInTheDocument();
    });
  });

  it('calls onRecordingComplete with audio blob when recording stops', async () => {
    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    // Start recording
    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    // Simulate recording completion
    await waitFor(() => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    expect(mockOnRecordingComplete).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('respects maxDuration and stops recording automatically', async () => {
    vi.useFakeTimers();
    
    render(
      <VoiceRecorder 
        onRecordingComplete={mockOnRecordingComplete}
        maxDuration={5}
      />
    );

    // Start recording
    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    // Fast-forward time to exceed maxDuration
    vi.advanceTimersByTime(6000);

    await waitFor(() => {
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('shows correct time format during recording', async () => {
    vi.useFakeTimers();
    
    render(
      <VoiceRecorder 
        onRecordingComplete={mockOnRecordingComplete}
        maxDuration={120}
      />
    );

    // Start recording
    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    // Advance time
    vi.advanceTimersByTime(65000); // 1 minute 5 seconds

    await waitFor(() => {
      expect(screen.getByText('1:05 / 2:00')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('deletes recording when delete button is clicked', async () => {
    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    // Complete a recording first
    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    await waitFor(() => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    // Click delete
    const deleteButton = screen.getByText('Borrar');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Grabar mi voz')).toBeInTheDocument();
      expect(screen.queryByText('Reproducir')).not.toBeInTheDocument();
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-audio-url');
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <VoiceRecorder 
        onRecordingComplete={mockOnRecordingComplete}
        disabled={true}
      />
    );

    const recordButton = screen.getByText('Grabar mi voz');
    expect(recordButton).toBeDisabled();
  });

  it('shows helpful instructions when not recording', () => {
    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    expect(screen.getByText(/Consejo:/)).toBeInTheDocument();
    expect(screen.getByText(/Habla con naturalidad sobre cómo te sientes/)).toBeInTheDocument();
  });

  it('handles recording errors gracefully', async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(new Error('Recording error'));

    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    await waitFor(() => {
      expect(screen.getByText(/Error al iniciar la grabación/)).toBeInTheDocument();
    });
  });

  it('plays and pauses audio correctly', async () => {
    const mockAudio = {
      play: jest.fn(),
      pause: jest.fn(),
      onended: null as any,
      onpause: null as any
    };

    // Mock audio element creation
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockAudio });

    render(
      <VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />
    );

    // Complete a recording first
    const recordButton = screen.getByText('Grabar mi voz');
    fireEvent.click(recordButton);

    await waitFor(() => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    // Play audio
    const playButton = screen.getByText('Reproducir');
    fireEvent.click(playButton);

    expect(mockAudio.play).toHaveBeenCalled();

    // Should show pause button
    await waitFor(() => {
      const pauseButton = screen.getByText('Pausar');
      fireEvent.click(pauseButton);
    });

    expect(mockAudio.pause).toHaveBeenCalled();
  });
});