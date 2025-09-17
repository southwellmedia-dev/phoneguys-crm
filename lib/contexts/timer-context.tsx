"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export interface ActiveTimer {
  ticketId: string;
  ticketNumber?: string;
  customerName?: string;
  startTime: string;
  elapsedSeconds: number;
}

export interface TimerContextType {
  activeTimer: ActiveTimer | null;
  isLoading: boolean;
  error: string | null;
  startTimer: (ticketId: string, ticketNumber?: string, customerName?: string) => Promise<boolean>;
  stopTimer: (notes: string) => Promise<boolean>;
  pauseTimer: () => Promise<boolean>;
  resumeTimer: (ticketId: string) => Promise<boolean>;
  refreshTimer: () => Promise<void>;
  recoverTimer: (ticketId: string) => Promise<boolean>;
  clearError: () => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

const TIMER_STORAGE_KEY = 'phoneguys_active_timer';
const TIMER_UPDATE_INTERVAL = 1000; // 1 second
const API_REFRESH_INTERVAL = 30000; // 30 seconds

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Save timer to localStorage
  const saveTimerToStorage = useCallback((timer: ActiveTimer | null) => {
    try {
      if (timer) {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
          ...timer,
          savedAt: new Date().toISOString()
        }));
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save timer to localStorage:', error);
    }
  }, []);

  // Load timer from localStorage
  const loadTimerFromStorage = useCallback((): ActiveTimer | null => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!stored) return null;

      const { savedAt, ...timer } = JSON.parse(stored);
      
      // Validate timer data structure
      if (!timer.ticketId || !timer.startTime) {
        console.warn('Invalid timer data in localStorage, clearing');
        localStorage.removeItem(TIMER_STORAGE_KEY);
        return null;
      }

      const now = new Date();
      const savedTime = new Date(savedAt);
      const additionalSeconds = Math.floor((now.getTime() - savedTime.getTime()) / 1000);
      
      // Sanity check - if timer was saved more than 24 hours ago, it's probably stale
      if (additionalSeconds > 86400) {
        console.warn('Timer data is more than 24 hours old, clearing');
        localStorage.removeItem(TIMER_STORAGE_KEY);
        return null;
      }

      return {
        ...timer,
        elapsedSeconds: (timer.elapsedSeconds || 0) + additionalSeconds
      };
    } catch (error) {
      console.error('Failed to load timer from localStorage:', error);
      localStorage.removeItem(TIMER_STORAGE_KEY);
      return null;
    }
  }, []);

  // API call helper
  const callTimerAPI = useCallback(async (ticketId: string, action: 'start' | 'stop' | 'pause' | 'resume', notes?: string) => {
    const response = await fetch(`/api/orders/${ticketId}/timer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, notes }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to ${action} timer`);
    }

    return response.json();
  }, []);

  // Get timer status from API
  const getTimerStatus = useCallback(async (ticketId: string) => {
    const response = await fetch(`/api/orders/${ticketId}/timer`);
    if (!response.ok) {
      throw new Error('Failed to get timer status');
    }
    return response.json();
  }, []);

  // Get ticket info for timer display
  const getTicketInfo = useCallback(async (ticketId: string) => {
    const response = await fetch(`/api/orders/${ticketId}`);
    if (!response.ok) {
      throw new Error('Failed to get ticket info');
    }
    const data = await response.json();
    return {
      ticketNumber: data.data?.ticket_number,
      // Use 'customers' field name (plural)
      customerName: data.data?.customers?.name
    };
  }, []);

  // Start timer
  const startTimer = useCallback(async (
    ticketId: string, 
    ticketNumber?: string, 
    customerName?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // If there's already an active timer, we need to stop it first
      if (activeTimer && activeTimer.ticketId !== ticketId) {
        setError('You have an active timer running. Please stop it first.');
        setIsLoading(false);
        return false;
      }

      // Start timer via API
      const result = await callTimerAPI(ticketId, 'start');
      
      console.log('Timer start result:', result); // Debug log
      
      if (result.success) {
        // Get ticket info if not provided
        let ticketInfo = { ticketNumber, customerName };
        if (!ticketNumber || !customerName) {
          try {
            const fetchedInfo = await getTicketInfo(ticketId);
            ticketInfo = {
              ticketNumber: ticketNumber || fetchedInfo.ticketNumber,
              customerName: customerName || fetchedInfo.customerName
            };
          } catch (error) {
            console.warn('Failed to get ticket info, using defaults:', error);
            // Continue with whatever info we have
          }
        }

        const newTimer: ActiveTimer = {
          ticketId,
          ticketNumber: ticketInfo.ticketNumber || ticketNumber,
          customerName: ticketInfo.customerName || customerName,
          startTime: result.startTime || new Date().toISOString(),
          elapsedSeconds: 0
        };

        setActiveTimer(newTimer);
        saveTimerToStorage(newTimer);
        return true;
      }

      setError(result.message || 'Failed to start timer');
      return false;
    } catch (error: any) {
      setError(error.message || 'Failed to start timer');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [activeTimer, callTimerAPI, getTicketInfo, saveTimerToStorage]);

  // Stop timer
  const stopTimer = useCallback(async (notes: string): Promise<boolean> => {
    if (!activeTimer) {
      setError('No active timer to stop');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await callTimerAPI(activeTimer.ticketId, 'stop', notes);
      
      if (result.success) {
        setActiveTimer(null);
        saveTimerToStorage(null);
        return true;
      }

      setError(result.message || 'Failed to stop timer');
      return false;
    } catch (error: any) {
      setError(error.message || 'Failed to stop timer');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [activeTimer, callTimerAPI, saveTimerToStorage]);

  // Pause timer
  const pauseTimer = useCallback(async (): Promise<boolean> => {
    if (!activeTimer) {
      setError('No active timer to pause');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await callTimerAPI(activeTimer.ticketId, 'pause');
      
      if (result.success) {
        // Store the paused timer info for later resumption
        const pausedTimer = {
          ...activeTimer,
          isPaused: true,
          pausedAt: new Date().toISOString()
        };
        saveTimerToStorage(pausedTimer);
        setActiveTimer(null);
        return true;
      }

      setError(result.message || 'Failed to pause timer');
      return false;
    } catch (error: any) {
      setError(error.message || 'Failed to pause timer');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [activeTimer, callTimerAPI, saveTimerToStorage]);

  // Resume timer
  const resumeTimer = useCallback(async (ticketId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await callTimerAPI(ticketId, 'resume');
      
      if (result.success) {
        // Get ticket info for display
        const ticketInfo = await getTicketInfo(ticketId);
        
        const resumedTimer: ActiveTimer = {
          ticketId,
          ticketNumber: ticketInfo.ticketNumber,
          customerName: ticketInfo.customerName,
          startTime: result.timer?.start_time || new Date().toISOString(),
          elapsedSeconds: result.timer?.elapsed_seconds || 0
        };

        setActiveTimer(resumedTimer);
        saveTimerToStorage(resumedTimer);
        return true;
      }

      setError(result.message || 'Failed to resume timer');
      return false;
    } catch (error: any) {
      setError(error.message || 'Failed to resume timer');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callTimerAPI, getTicketInfo, saveTimerToStorage]);

  // Refresh timer from server
  const refreshTimer = useCallback(async (): Promise<void> => {
    if (!activeTimer) return;

    try {
      const status = await getTimerStatus(activeTimer.ticketId);
      
      if (!status.data.isTimerActive) {
        // Timer is no longer active on server
        setActiveTimer(null);
        saveTimerToStorage(null);
      }
    } catch (error) {
      console.error('Failed to refresh timer status:', error);
      // Don't show error to user for background refresh
    }
  }, [activeTimer, getTimerStatus, saveTimerToStorage]);

  // Recover timer from database
  const recoverTimer = useCallback(async (ticketId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get timer status from database
      const status = await getTimerStatus(ticketId);
      
      if (!status.data || !status.data.isTimerActive) {
        setError('No active timer found for this ticket');
        return false;
      }

      // Get ticket info for display
      const ticketInfo = await getTicketInfo(ticketId);
      
      // Calculate elapsed seconds from start time
      const startTime = new Date(status.data.timerStartedAt);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

      const recoveredTimer: ActiveTimer = {
        ticketId,
        ticketNumber: ticketInfo.ticketNumber,
        customerName: ticketInfo.customerName,
        startTime: status.data.timerStartedAt,
        elapsedSeconds
      };

      setActiveTimer(recoveredTimer);
      saveTimerToStorage(recoveredTimer);
      
      console.log('Timer recovered from database');
      return true;
    } catch (error: any) {
      setError(error.message || 'Failed to recover timer');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getTimerStatus, getTicketInfo, saveTimerToStorage]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize timer from localStorage on mount and validate it
  useEffect(() => {
    const initializeTimer = async () => {
      const storedTimer = loadTimerFromStorage();
      if (!storedTimer) return;

      try {
        // Validate that the timer still exists in the database
        const status = await getTimerStatus(storedTimer.ticketId);
        
        if (status.data && status.data.isTimerActive) {
          // Timer is valid, restore it
          setActiveTimer(storedTimer);
          console.log('Timer restored from local storage');
        } else {
          // Timer no longer active in database
          console.log('Timer no longer active in database, clearing local storage');
          localStorage.removeItem(TIMER_STORAGE_KEY);
          setActiveTimer(null);
          
          // Set an error so user knows what happened
          if (status.data && !status.data.isTimerActive) {
            setError('Timer was stopped externally. Local timer cleared.');
          }
        }
      } catch (error) {
        // If we can't verify the timer, try to keep it running locally
        // This handles temporary network issues
        console.warn('Could not verify timer status, keeping local timer:', error);
        setActiveTimer(storedTimer);
        setError('Unable to verify timer status. Timer running locally.');
      }
    };

    initializeTimer();
  }, [loadTimerFromStorage, getTimerStatus]);

  // Update timer every second
  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return null;
        
        const updated = {
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1
        };
        
        saveTimerToStorage(updated);
        return updated;
      });
    }, TIMER_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [activeTimer, saveTimerToStorage]);

  // Refresh timer status from server periodically
  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      refreshTimer();
    }, API_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [activeTimer, refreshTimer]);

  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TIMER_STORAGE_KEY) {
        const newTimer = loadTimerFromStorage();
        setActiveTimer(newTimer);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadTimerFromStorage]);

  const value: TimerContextType = {
    activeTimer,
    isLoading,
    error,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    refreshTimer,
    recoverTimer,
    clearError
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};