export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  
  // Educational Content
  EDUCATIONAL_CONTENT: '/educational-content',
  
  // Activities
  ACTIVITIES: '/activities',
  ACTIVITY_BOARD: '/activities/board',
  
  // Mood
  MOOD: '/mood',
  
  // Breathing
  BREATHING: '/breathing',
  
  // Emergency
  EMERGENCY: '/emergency',
  
  // Daily Tracking
  DAILY_TRACKING: '/daily-tracking',
  
  // Notifications
  NOTIFICATIONS: '/notifications'
} as const;