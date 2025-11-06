import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EducationalContentPage from '../pages/EducationalContentPage';
import ContentCard from '../components/Educational/ContentCard';
import ContentViewer from '../components/Educational/ContentViewer';
import { educationalContentService } from '../services/educationalContentService';

// Mock the services
vi.mock('../services/educationalContentService');
vi.mock('../hooks/useAuth');
vi.mock('../hooks/useSerenito');

const mockContent = {
  id: '1',
  title: 'Test Content',
  description: 'Test description',
  content: 'This is test content',
  category: 'ARTICLE' as const,
  mentalHealthConditions: ['ansiedad'],
  difficulty: 'BEGINNER' as const,
  duration: 15,
  tags: ['test', 'content'],
  isPublished: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  author: {
    username: 'testauthor',
    profile: {
      firstName: 'Test',
      lastName: 'Author'
    }
  },
  progress: []
};

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user1', country: 'ES' }
  })
}));

vi.mock('../hooks/useSerenito', () => ({
  useSerenito: () => ({
    showSerenito: vi.fn()
  })
}));

describe('Educational Content Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ContentCard', () => {
    it('renders content card with basic information', () => {
      const mockOnClick = vi.fn();
      
      render(
        <ContentCard 
          content={mockContent} 
          onContentClick={mockOnClick}
        />
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('BEGINNER')).toBeInTheDocument();
      expect(screen.getByText('15 min')).toBeInTheDocument();
    });

    it('calls onContentClick when clicked', () => {
      const mockOnClick = vi.fn();
      
      render(
        <ContentCard 
          content={mockContent} 
          onContentClick={mockOnClick}
        />
      );

      fireEvent.click(screen.getByText('Test Content'));
      expect(mockOnClick).toHaveBeenCalledWith(mockContent);
    });

    it('displays progress bar when user has progress', () => {
      const contentWithProgress = {
        ...mockContent,
        progress: [{
          id: 'progress1',
          userId: 'user1',
          contentId: '1',
          completed: false,
          progress: 0.5,
          timeSpent: 300,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }]
      };

      render(
        <ContentCard 
          content={contentWithProgress} 
          onContentClick={vi.fn()}
        />
      );

      expect(screen.getByText('Progreso')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows completed status when content is finished', () => {
      const completedContent = {
        ...mockContent,
        progress: [{
          id: 'progress1',
          userId: 'user1',
          contentId: '1',
          completed: true,
          progress: 1.0,
          timeSpent: 600,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }]
      };

      render(
        <ContentCard 
          content={completedContent} 
          onContentClick={vi.fn()}
        />
      );

      expect(screen.getByText('Completado')).toBeInTheDocument();
    });
  });

  describe('ContentViewer', () => {
    it('renders content viewer with content details', () => {
      const mockOnClose = vi.fn();
      
      render(
        <ContentViewer 
          content={mockContent} 
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const mockOnClose = vi.fn();
      
      render(
        <ContentViewer 
          content={mockContent} 
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('×'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows mark as completed button for unfinished content', () => {
      render(
        <ContentViewer 
          content={mockContent} 
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Marcar como completado')).toBeInTheDocument();
    });

    it('shows completed status for finished content', () => {
      const completedContent = {
        ...mockContent,
        progress: [{
          id: 'progress1',
          userId: 'user1',
          contentId: '1',
          completed: true,
          progress: 1.0,
          timeSpent: 600,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }]
      };

      render(
        <ContentViewer 
          content={completedContent} 
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Completado')).toBeInTheDocument();
    });
  });

  describe('EducationalContentPage', () => {
    beforeEach(() => {
      vi.mocked(educationalContentService.getAllContent).mockResolvedValue([mockContent]);
    });

    it('renders page title and description', async () => {
      render(<EducationalContentPage />);

      expect(screen.getByText('Contenido Educativo')).toBeInTheDocument();
      expect(screen.getByText('Aprende sobre salud mental y bienestar')).toBeInTheDocument();
    });

    it('loads and displays educational content', async () => {
      render(<EducationalContentPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });

      expect(educationalContentService.getAllContent).toHaveBeenCalled();
    });

    it('filters content by mental health condition', async () => {
      render(<EducationalContentPage />);

      const conditionSelect = screen.getByLabelText('Condición de salud mental');
      fireEvent.change(conditionSelect, { target: { value: 'ansiedad' } });

      await waitFor(() => {
        expect(educationalContentService.getAllContent).toHaveBeenCalledWith({ condition: 'ansiedad' });
      });
    });

    it('filters content by category', async () => {
      render(<EducationalContentPage />);

      const categorySelect = screen.getByLabelText('Tipo de contenido');
      fireEvent.change(categorySelect, { target: { value: 'ARTICLE' } });

      await waitFor(() => {
        expect(educationalContentService.getAllContent).toHaveBeenCalledWith({ category: 'ARTICLE' });
      });
    });

    it('shows loading state', () => {
      vi.mocked(educationalContentService.getAllContent).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<EducationalContentPage />);

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('shows error state when content fails to load', async () => {
      vi.mocked(educationalContentService.getAllContent).mockRejectedValue(
        new Error('Failed to load content')
      );

      render(<EducationalContentPage />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Error al cargar el contenido educativo')).toBeInTheDocument();
      });
    });

    it('shows empty state when no content is available', async () => {
      vi.mocked(educationalContentService.getAllContent).mockResolvedValue([]);

      render(<EducationalContentPage />);

      await waitFor(() => {
        expect(screen.getByText('No hay contenido disponible')).toBeInTheDocument();
      });
    });

    it('opens content viewer when content is clicked', async () => {
      render(<EducationalContentPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Test Content'));

      // Content viewer should open with the content
      expect(screen.getAllByText('Test Content')).toHaveLength(2); // One in card, one in viewer
    });
  });

  describe('Educational Content Service Integration', () => {
    it('updates progress when content is read', async () => {
      const mockUpdateProgress = vi.mocked(educationalContentService.updateProgress);
      mockUpdateProgress.mockResolvedValue({
        id: 'progress1',
        userId: 'user1',
        contentId: '1',
        completed: false,
        progress: 0.5,
        timeSpent: 300,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      });

      const mockOnProgressUpdate = vi.fn();

      render(
        <ContentViewer 
          content={mockContent} 
          onClose={vi.fn()}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Simulate marking as completed
      fireEvent.click(screen.getByText('Marcar como completado'));

      await waitFor(() => {
        expect(mockUpdateProgress).toHaveBeenCalledWith('1', {
          progress: 1.0,
          timeSpent: expect.any(Number),
          completed: true
        });
      });
    });
  });
});