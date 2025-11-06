import { useState, useEffect, useCallback } from 'react';
import { dailyTrackingService, DailyTrackingEntry, TrackingStats, CreateTrackingEntryData } from '../services/dailyTrackingService';

export const useDailyTracking = () => {
  const [todayEntry, setTodayEntry] = useState<DailyTrackingEntry | null>(null);
  const [trackingStats, setTrackingStats] = useState<TrackingStats | null>(null);
  const [entries, setEntries] = useState<DailyTrackingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTodayEntry = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dailyTrackingService.getTodayEntry();
      setTodayEntry(result.entry);
    } catch (err) {
      setError('Error al cargar el registro de hoy');
      console.error('Error loading today entry:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTrackingStats = useCallback(async (days?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await dailyTrackingService.getStats(days);
      setTrackingStats(stats);
    } catch (err) {
      setError('Error al cargar las estadísticas');
      console.error('Error loading stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getEntries = useCallback(async (startDate?: string, endDate?: string, limit?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const entriesData = await dailyTrackingService.getEntries(startDate, endDate, limit);
      setEntries(entriesData);
      return entriesData;
    } catch (err) {
      setError('Error al cargar las entradas');
      console.error('Error loading entries:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOrUpdateEntry = useCallback(async (data: CreateTrackingEntryData) => {
    try {
      setIsLoading(true);
      setError(null);
      const entry = await dailyTrackingService.createEntry(data);
      setTodayEntry(entry);
      return entry;
    } catch (err) {
      setError('Error al guardar el registro');
      console.error('Error creating/updating entry:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load today's entry on mount
  useEffect(() => {
    loadTodayEntry();
  }, [loadTodayEntry]);

  return {
    todayEntry,
    trackingStats,
    entries,
    isLoading,
    error,
    loadTodayEntry,
    getTrackingStats,
    getEntries,
    createOrUpdateEntry,
  };
};