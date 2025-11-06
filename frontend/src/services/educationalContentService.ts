import { API_BASE_URL } from '../config/api';

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'ARTICLE' | 'EXERCISE' | 'VIDEO' | 'AUDIO' | 'INTERACTIVE' | 'WORKSHEET';
  mentalHealthConditions: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: number;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  progress?: ContentProgress[];
}

export interface ContentProgress {
  id: string;
  userId: string;
  contentId: string;
  completed: boolean;
  progress: number;
  timeSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentData {
  title: string;
  description: string;
  content: string;
  category: 'ARTICLE' | 'EXERCISE' | 'VIDEO' | 'AUDIO' | 'INTERACTIVE' | 'WORKSHEET';
  mentalHealthConditions: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: number;
  tags: string[];
}

export interface UpdateProgressData {
  progress: number;
  timeSpent: number;
  completed?: boolean;
}

class EducationalContentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllContent(filters?: { condition?: string; category?: string }): Promise<EducationalContent[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.condition) params.append('condition', filters.condition);
      if (filters?.category) params.append('category', filters.category);

      const response = await fetch(`${API_BASE_URL}/educational-content?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch educational content');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching educational content:', error);
      throw error;
    }
  }

  async getContentById(contentId: string): Promise<EducationalContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/educational-content/${contentId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch educational content');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching educational content:', error);
      throw error;
    }
  }

  async createContent(contentData: CreateContentData): Promise<EducationalContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/educational-content`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(contentData)
      });

      if (!response.ok) {
        throw new Error('Failed to create educational content');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating educational content:', error);
      throw error;
    }
  }

  async updateProgress(contentId: string, progressData: UpdateProgressData): Promise<ContentProgress> {
    try {
      const response = await fetch(`${API_BASE_URL}/educational-content/${contentId}/progress`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        throw new Error('Failed to update content progress');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating content progress:', error);
      throw error;
    }
  }

  async getUserProgress(): Promise<ContentProgress[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/educational-content/progress/me`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  async publishContent(contentId: string): Promise<EducationalContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/educational-content/${contentId}/publish`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to publish content');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error publishing content:', error);
      throw error;
    }
  }

  async getContentStats(contentId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/educational-content/${contentId}/stats`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content statistics');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching content statistics:', error);
      throw error;
    }
  }

  getCategoryIcon(category: string): string {
    const icons = {
      ARTICLE: '📄',
      EXERCISE: '🧘',
      VIDEO: '🎥',
      AUDIO: '🎧',
      INTERACTIVE: '🎮',
      WORKSHEET: '📝'
    };
    return icons[category as keyof typeof icons] || '📚';
  }

  getDifficultyColor(difficulty: string): string {
    const colors = {
      BEGINNER: 'bg-green-100 text-green-800',
      INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
      ADVANCED: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return 'Duración variable';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

export const educationalContentService = new EducationalContentService();