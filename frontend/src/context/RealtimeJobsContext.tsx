import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RealTimeJob } from '../types';
import wsClient from '../services/websocket';
import notificationsApi from '../services/notificationsApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeJobsContextType {
  activeJobs: RealTimeJob[];
  completedJobs: RealTimeJob[];
  trackJob: (job: RealTimeJob) => void;
  updateJob: (jobId: string, updates: Partial<RealTimeJob>) => void;
  dismissJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  isConnected: boolean;
}

const RealtimeJobsContext = createContext<RealtimeJobsContextType | undefined>(undefined);

export const RealtimeJobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<RealTimeJob[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribeStatus = wsClient.subscribeStatus(setIsConnected);
    wsClient.connect(user?.id || 'usr_demo_01');

    // Fetch initial active jobs
    notificationsApi.getActiveJobs().then((initial) => {
      if (initial && initial.length > 0) {
        setJobs((current) => {
          const currentIds = new Set(current.map((job) => job.id));
          return [...current, ...initial.filter((job) => !currentIds.has(job.id))];
        });
      }
    }).catch((error: unknown) => {
      console.error('Unable to load active backend jobs', error);
    });

    const unsubscribe = wsClient.subscribe((updatedJob) => {
      setJobs((prev) => {
        const existingIdx = prev.findIndex((j) => j.id === updatedJob.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = updatedJob;
          return next;
        }
        return [updatedJob, ...prev];
      });
      if (updatedJob.status === 'completed') {
        void queryClient.invalidateQueries({ queryKey: ['generated-clips'] });
        void queryClient.invalidateQueries({ queryKey: ['assets'] });
        void queryClient.invalidateQueries({ queryKey: ['transcript'] });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeStatus();
      wsClient.disconnect();
    };
  }, [queryClient, user?.id]);

  const trackJob = useCallback((job: RealTimeJob) => {
    setJobs((prev) => {
      const idx = prev.findIndex((j) => j.id === job.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = job;
        return copy;
      }
      return [job, ...prev];
    });
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<RealTimeJob>) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : j
      )
    );
  }, []);

  const dismissJob = useCallback(async (jobId: string) => {
    try {
      await notificationsApi.dismissJob(jobId);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Unable to dismiss backend job';
      toastError(message);
    }
  }, [toastError]);

  const retryJob = useCallback(async (jobId: string) => {
    try {
      const updatedJob = await notificationsApi.retryJob(jobId);
      setJobs((prev) => prev.map((job) => (job.id === jobId ? updatedJob : job)));
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Unable to retry backend job';
      toastError(message);
    }
  }, [toastError]);

  const activeJobs = jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
  const completedJobs = jobs.filter((j) => j.status === 'completed' || j.status === 'failed');

  return (
    <RealtimeJobsContext.Provider
      value={{
        activeJobs,
        completedJobs,
        trackJob,
        updateJob,
        dismissJob,
        retryJob,
        isConnected,
      }}
    >
      {children}
    </RealtimeJobsContext.Provider>
  );
};

export const useRealtimeJobs = (): RealtimeJobsContextType => {
  const context = useContext(RealtimeJobsContext);
  if (!context) {
    throw new Error('useRealtimeJobs must be used within RealtimeJobsProvider');
  }
  return context;
};
