import { API_BASE_URL } from '../config/api';

export interface Activity {
  id: string;
  title: string;
  description: string;
  country: string;
  category: 'GROUP_THERAPY' | 'MINDFULNESS' | 'SUPPORT_GROUP' | 'WELLNESS_WORKSHOP';
  eventDate: string;
  location: string;
  maxParticipants?: number;
  createdAt: string;
  organizer: {
    id: string;
    username: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  registeredUsers: {
    id: string;
    username: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  }[];
}

export interface CreateActivityData {
  title: string;
  description: string;
  country: string;
  category: 'GROUP_THERAPY' | 'MINDFULNESS' | 'SUPPORT_GROUP' | 'WELLNESS_WORKSHOP';
  eventDate: string;
  location: string;
  maxParticipants?: number;
}

export interface ActivityFilters {
  category?: string;
  hasAvailableSpots?: boolean;
  startDate?: string;
  endDate?: string;
}

class ActivityService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getActivitiesByCountry(country: string, filters?: ActivityFilters): Promise<Activity[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.hasAvailableSpots) params.append('hasAvailableSpots', 'true');
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`${API_BASE_URL}/activities/board/${country}?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  async getActivityById(activityId: string): Promise<Activity> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw error;
    }
  }

  async createActivity(activityData: CreateActivityData): Promise<Activity> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(activityData)
      });

      if (!response.ok) {
        throw new Error('Failed to create activity');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async registerForActivity(activityId: string): Promise<Activity> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}/register`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to register for activity');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error registering for activity:', error);
      throw error;
    }
  }

  async unregisterFromActivity(activityId: string): Promise<Activity> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}/register`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to unregister from activity');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error unregistering from activity:', error);
      throw error;
    }
  }

  async getUserActivities(): Promise<Activity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/user/me`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user activities');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  async getOrganizerActivities(): Promise<Activity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/organizer/me`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizer activities');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching organizer activities:', error);
      throw error;
    }
  }

  async updateActivity(activityId: string, activityData: CreateActivityData): Promise<Activity> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(activityData)
      });

      if (!response.ok) {
        throw new Error('Failed to update activity');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  async deleteActivity(activityId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  async getActivityStats(activityId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}/stats`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity statistics');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching activity statistics:', error);
      throw error;
    }
  }

  getCategoryIcon(category: string): string {
    const icons = {
      GROUP_THERAPY: '👥',
      MINDFULNESS: '🧘',
      SUPPORT_GROUP: '🤝',
      WELLNESS_WORKSHOP: '🌱'
    };
    return icons[category as keyof typeof icons] || '📅';
  }

  getCategoryName(category: string): string {
    const names = {
      GROUP_THERAPY: 'Terapia Grupal',
      MINDFULNESS: 'Mindfulness',
      SUPPORT_GROUP: 'Grupo de Apoyo',
      WELLNESS_WORKSHOP: 'Taller de Bienestar'
    };
    return names[category as keyof typeof names] || category;
  }

  getCategoryColor(category: string): string {
    const colors = {
      GROUP_THERAPY: 'bg-blue-100 text-blue-800',
      MINDFULNESS: 'bg-green-100 text-green-800',
      SUPPORT_GROUP: 'bg-purple-100 text-purple-800',
      WELLNESS_WORKSHOP: 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isActivityFull(activity: Activity): boolean {
    if (!activity.maxParticipants) return false;
    return activity.registeredUsers.length >= activity.maxParticipants;
  }

  getAvailableSpots(activity: Activity): number | null {
    if (!activity.maxParticipants) return null;
    return activity.maxParticipants - activity.registeredUsers.length;
  }

  isUserRegistered(activity: Activity, userId: string): boolean {
    return activity.registeredUsers.some(user => user.id === userId);
  }
}

export const activityService = new ActivityService();