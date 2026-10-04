import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRealtimeJobs } from '../../context/RealtimeJobsContext';
import { Activity, CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';
import Badge from '../ui/Badge';

export const RealtimeJobsDrawer: React.FC = () => {
  const { t } = useTranslation();
  const { activeJobs, completedJobs, dismissJob, retryJob, isConnected } = useRealtimeJobs();
  const [isExpanded, setIsExpanded] = useState(false);

  const totalCount = activeJobs.length + completedJobs.length;
  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-sm w-full">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between p-3.5 bg-slate-50 cursor-pointer select-none hover:bg-slate-100/70 transition-colors border-b border-slate-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Activity className={`w-4 h-4 ${activeJobs.length > 0 ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
              <span
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={isConnected ? 'WebSocket Connected' : 'WebSocket Reconnecting...'}
              />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {activeJobs.length > 0 ? `${activeJobs.length} ${activeJobs.length > 1 ? t('common.activeProcesses') : t('common.activeProcess')}` : t('common.bgOperations')}
            </span>
            {activeJobs.length > 0 && (
              <Badge variant="primary" size="sm" dot>
                {t('common.running')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700">
            <span className="text-[10px] font-mono opacity-70">WS {isConnected ? 'Online' : 'Offline'}</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded list */}
        {isExpanded && (
          <div className="p-3 max-h-72 overflow-y-auto divide-y divide-slate-100 space-y-2.5 bg-white">
            {/* Active Jobs */}
            {activeJobs.map((job) => (
              <div key={job.id} className="pt-2.5 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{job.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{job.message || 'Processing on worker nodes...'}</p>
                  </div>
                  <Badge variant={job.status === 'processing' ? 'primary' : 'warning'} size="sm">
                    {job.status}
                  </Badge>
                </div>
                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, Math.min(100, job.progress))}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{job.progress}%</span>
                </div>
              </div>
            ))}

            {/* Completed / Failed Jobs */}
            {completedJobs.map((job) => (
              <div key={job.id} className="pt-2.5 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {job.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{job.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {job.status === 'completed' ? t('common.finished') : t('common.errorInQueue')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {job.status === 'failed' && (
                    <button
                      onClick={() => retryJob(job.id)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title={t('common.retryTask')}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => dismissJob(job.id)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title={t('common.dismiss')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default RealtimeJobsDrawer;
