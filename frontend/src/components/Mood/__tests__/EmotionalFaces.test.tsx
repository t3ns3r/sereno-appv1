import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EmotionalFaces, { emotionalFaces } from '../EmotionalFaces';

describe('EmotionalFaces', () => {
  const mockOnFaceSelect = vi.fn();

  beforeEach(() => {
    mockOnFaceSelect.mockClear();
  });

  it('renders all emotional faces', () => {
    render(
      <EmotionalFaces
        onFaceSelect={mockOnFaceSelect}
      />
    );

    // Check that all emotional faces are rendered
    emotionalFaces.forEach(face => {
      const button = screen.getByTitle(new RegExp(face.label));
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(face.emoji);
    });
  });

  it('calls onFaceSelect when a face is clicked', () => {
    render(
      <EmotionalFaces
        onFaceSelect={mockOnFaceSelect}
      />
    );

    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);

    expect(mockOnFaceSelect).toHaveBeenCalledTimes(1);
    expect(mockOnFaceSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'happy',
        label: 'Contento'
      })
    );
  });

  it('highlights selected face', () => {
    render(
      <EmotionalFaces
        selectedFace="happy"
        onFaceSelect={mockOnFaceSelect}
      />
    );

    const happyFace = screen.getByTitle(/Contento/);
    expect(happyFace).toHaveClass('border-green-400', 'bg-green-50');
  });

  it('disables all faces when disabled prop is true', () => {
    render(
      <EmotionalFaces
        onFaceSelect={mockOnFaceSelect}
        disabled={true}
      />
    );

    emotionalFaces.forEach(face => {
      const button = screen.getByTitle(new RegExp(face.label));
      expect(button).toBeDisabled();
    });
  });

  it('does not call onFaceSelect when disabled', () => {
    render(
      <EmotionalFaces
        onFaceSelect={mockOnFaceSelect}
        disabled={true}
      />
    );

    const happyFace = screen.getByTitle(/Contento/);
    fireEvent.click(happyFace);

    expect(mockOnFaceSelect).not.toHaveBeenCalled();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <EmotionalFaces
        onFaceSelect={mockOnFaceSelect}
        size="small"
      />
    );

    let happyFace = screen.getByTitle(/Contento/);
    expect(happyFace).toHaveClass('w-12', 'h-12');

    rerender(
      <EmotionalFaces
        onFaceSelect={mockOnFaceSelect}
        size="large"
      />
    );

    happyFace = screen.getByTitle(/Contento/);
    expect(happyFace).toHaveClass('w-20', 'h-20');
  });

  it('has proper accessibility attributes', () => {
    render(
      <EmotionalFaces
        onFaceSelect={mockOnFaceSelect}
      />
    );

    emotionalFaces.forEach(face => {
      const button = screen.getByTitle(new RegExp(face.label));
      expect(button).toHaveAttribute('aria-label', `Seleccionar estado de ánimo: ${face.label}`);
      expect(button).toHaveAttribute('title', `${face.label}: ${face.description}`);
    });
  });
});