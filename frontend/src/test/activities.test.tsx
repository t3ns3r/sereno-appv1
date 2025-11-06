import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ActivityBoardPage from '../pages/ActivityBoardPage';
import ActivityCard from '../components/Activities/ActivityCard';
import CreateActivityForm from '../components/Activities/CreateActivityForm';
import OrganizerDashboard from '../components/Activities/OrganizerDashboard';
import { activityService } from '../services/activityService';

// Mock the services
vi.mock('../services/activityService');
vi.mock('../hooks/useAuth');
vi.mock('../hooks/useSerenito');

const mockActivity = {
  id: '1',
  title: 'Test Activity',
  description: 'Test activity description',
  country: 'ES',
  category: 'SUPPORT_GROUP' as const,
  eventDate: '2024-12-31T10:00:00Z',
  location: 'Test Location',
  maxParticipants: 10,
  createdAt: '2023-01-01T00:00:00Z',
  organizer: {
    id: 'organizer1',
    username: 'testorganizer',
    profile: {
      firstName: 'Test',
      lastName: 'Organizer'
    }
  },
  registeredUsers: []
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

describe('Activity Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ActivityCard', () => {
    it('renders activity card with basic information', () => {
      const mockOnClick = vi.fn();
      
      render(
        <ActivityCard 
          activity={mockActivity} 
          onActivityClick={mockOnClick}
        />
      );

      expect(screen.getByText('Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Test activity description')).toBeInTheDocument();
      expect(screen.getByText('Grupo de Apoyo')).toBeInTheDocument();
      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });

    it('calls onActivityClick when clicked', () => {
      const mockOnClick = vi.fn();
      
      render(
        <ActivityCard 
          activity={mockActivity} 
          onActivityClick={mockOnClick}
        />
      );

      fireEvent.click(screen.getByText('Test Activity'));
      expect(mockOnClick).toHaveBeenCalledWith(mockActivity);
    });

    it('shows registration button for future activities', () => {
      const futureActivity = {
        ...mockActivity,
        eventDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
      };

      render(
        <ActivityCard 
          activity={futureActivity} 
          onActivityClick={vi.fn()}
          onRegisterClick={vi.fn()}
        />
      );

      expect(screen.getByText('Registrarse')).toBeInTheDocument();
    });

    it('shows "Finalizado" for past activities', () => {
      const pastActivity = {
        ...mockActivity,
        eventDate: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };

      render(
        <ActivityCard 
          activity={pastActivity} 
          onActivityClick={vi.fn()}
        />
      );

      expect(screen.getByText('Finalizado')).toBeInTheDocument();
    });

    it('shows "Completo" when activity is full', () => {
      const fullActivity = {
        ...mockActivity,
        registeredUsers: Array(10).fill(null).map((_, i) => ({
          id: `user${i}`,
          username: `user${i}`,
          profile: { firstName: `User${i}` }
        })),
        eventDate: new Date(Date.now() + 86400000).toISOString()
      };

      render(
        <ActivityCard 
          activity={fullActivity} 
          onActivityClick={vi.fn()}
        />
      );

      expect(screen.getByText('Completo')).toBeInTheDocument();
      expect(screen.getByText('Actividad completa')).toBeInTheDocument();
    });

    it('shows registered status when user is registered', () => {
      const registeredActivity = {
        ...mockActivity,
        registeredUsers: [{
          id: 'user1',
          username: 'user1',
          profile: { firstName: 'User1' }
        }],
        eventDate: new Date(Date.now() + 86400000).toISOString()
      };

      render(
        <ActivityCard 
          activity={registeredActivity} 
          onActivityClick={vi.fn()}
          onRegisterClick={vi.fn()}
        />
      );

      expect(screen.getByText('✓ Registrado')).toBeInTheDocument();
      expect(screen.getByText('Cancelar registro')).toBeInTheDocument();
    });
  });

  describe('CreateActivityForm', () => {
    it('renders form with all required fields', () => {
      render(
        <CreateActivityForm 
          onActivityCreated={vi.fn()} 
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/Título de la Actividad/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Categoría/)).toBeInTheDocument();
      expect(screen.getByLabelText(/País/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fecha y Hora del Evento/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ubicación/)).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      const mockOnCancel = vi.fn();
      
      render(
        <CreateActivityForm 
          onActivityCreated={vi.fn()} 
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('Cancelar'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('validates required fields before submission', async () => {
      const mockOnActivityCreated = vi.fn();
      
      render(
        <CreateActivityForm 
          onActivityCreated={mockOnActivityCreated} 
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Crear Actividad'));

      await waitFor(() => {
        expect(screen.getByText('El título es requerido')).toBeInTheDocument();
      });

      expect(mockOnActivityCreated).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      const mockCreateActivity = vi.mocked(activityService.createActivity);
      mockCreateActivity.mockResolvedValue(mockActivity);
      
      const mockOnActivityCreated = vi.fn();
      
      render(
        <CreateActivityForm 
          onActivityCreated={mockOnActivityCreated} 
          onCancel={vi.fn()}
        />
      );

      // Fill form
      fireEvent.change(screen.getByLabelText(/Título de la Actividad/), {
        target: { value: 'Test Activity' }
      });
      fireEvent.change(screen.getByLabelText(/Descripción/), {
        target: { value: 'Test description' }
      });
      fireEvent.change(screen.getByLabelText(/País/), {
        target: { value: 'ES' }
      });
      fireEvent.change(screen.getByLabelText(/Fecha y Hora del Evento/), {
        target: { value: '2024-12-31T10:00' }
      });
      fireEvent.change(screen.getByLabelText(/Ubicación/), {
        target: { value: 'Test Location' }
      });

      fireEvent.click(screen.getByText('Crear Actividad'));

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalled();
        expect(mockOnActivityCreated).toHaveBeenCalled();
      });
    });
  });

  describe('ActivityBoardPage', () => {
    beforeEach(() => {
      vi.mocked(activityService.getActivitiesByCountry).mockResolvedValue([mockActivity]);
    });

    it('renders page title and description', async () => {
      render(<ActivityBoardPage />);

      expect(screen.getByText('Pizarra de Actividades')).toBeInTheDocument();
      expect(screen.getByText(/Conecta con tu comunidad local/)).toBeInTheDocument();
    });

    it('loads and displays activities', async () => {
      render(<ActivityBoardPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      expect(activityService.getActivitiesByCountry).toHaveBeenCalledWith('ES', {});
    });

    it('shows filters toggle button', () => {
      render(<ActivityBoardPage />);

      expect(screen.getByText('Filtros')).toBeInTheDocument();
    });

    it('handles activity registration', async () => {
      const mockRegisterForActivity = vi.mocked(activityService.registerForActivity);
      mockRegisterForActivity.mockResolvedValue({
        ...mockActivity,
        registeredUsers: [{
          id: 'user1',
          username: 'user1',
          profile: { firstName: 'User1' }
        }]
      });

      const futureActivity = {
        ...mockActivity,
        eventDate: new Date(Date.now() + 86400000).toISOString()
      };

      vi.mocked(activityService.getActivitiesByCountry).mockResolvedValue([futureActivity]);

      render(<ActivityBoardPage />);

      await waitFor(() => {
        expect(screen.getByText('Registrarse')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(mockRegisterForActivity).toHaveBeenCalledWith('1');
      });
    });

    it('shows loading state', () => {
      vi.mocked(activityService.getActivitiesByCountry).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ActivityBoardPage />);

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('shows error state when activities fail to load', async () => {
      vi.mocked(activityService.getActivitiesByCountry).mockRejectedValue(
        new Error('Failed to load activities')
      );

      render(<ActivityBoardPage />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Error al cargar las actividades')).toBeInTheDocument();
      });
    });

    it('shows empty state when no activities are available', async () => {
      vi.mocked(activityService.getActivitiesByCountry).mockResolvedValue([]);

      render(<ActivityBoardPage />);

      await waitFor(() => {
        expect(screen.getByText('No hay actividades disponibles')).toBeInTheDocument();
      });
    });
  });

  describe('OrganizerDashboard', () => {
    beforeEach(() => {
      vi.mocked(activityService.getOrganizerActivities).mockResolvedValue([mockActivity]);
    });

    it('renders dashboard title and stats', async () => {
      render(<OrganizerDashboard />);

      expect(screen.getByText('Panel de Organizador')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Total Actividades')).toBeInTheDocument();
        expect(screen.getByText('Próximas')).toBeInTheDocument();
        expect(screen.getByText('Completadas')).toBeInTheDocument();
        expect(screen.getByText('Participantes')).toBeInTheDocument();
      });
    });

    it('shows create activity button', () => {
      render(<OrganizerDashboard />);

      expect(screen.getByText('Crear Nueva Actividad')).toBeInTheDocument();
    });

    it('opens create form when button is clicked', () => {
      render(<OrganizerDashboard />);

      fireEvent.click(screen.getByText('Crear Nueva Actividad'));

      expect(screen.getByText('Crear Nueva Actividad')).toBeInTheDocument();
      expect(screen.getByLabelText(/Título de la Actividad/)).toBeInTheDocument();
    });

    it('loads and displays organizer activities', async () => {
      render(<OrganizerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      expect(activityService.getOrganizerActivities).toHaveBeenCalled();
    });

    it('shows empty state when no activities exist', async () => {
      vi.mocked(activityService.getOrganizerActivities).mockResolvedValue([]);

      render(<OrganizerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No tienes actividades creadas')).toBeInTheDocument();
        expect(screen.getByText('Crear Primera Actividad')).toBeInTheDocument();
      });
    });

    it('handles activity deletion', async () => {
      const mockDeleteActivity = vi.mocked(activityService.deleteActivity);
      mockDeleteActivity.mockResolvedValue();

      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);

      render(<OrganizerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButton = screen.getByTitle('Eliminar actividad');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteActivity).toHaveBeenCalledWith('1');
      });

      // Restore window.confirm
      window.confirm = originalConfirm;
    });
  });
});