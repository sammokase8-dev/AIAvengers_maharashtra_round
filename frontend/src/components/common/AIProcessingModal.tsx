import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2, Circle, Sparkles, X } from 'lucide-react';
import Modal from '../ui/Modal';

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

export const AIProcessingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  currentStepIndex: number;
  steps?: ProcessingStep[];
}> = ({
  isOpen,
  onClose,
  title,
  currentStepIndex,
  steps = [
    { id: '1', label: 'Reading script and identifying key assertions', status: 'completed' },
    { id: '2', label: 'Processing audio transcript & speech cadence', status: 'completed' },
    { id: '3', label: 'Matching visual footage & B-roll timestamps', status: 'active' },
    { id: '4', label: 'Preparing non-destructive timeline clips', status: 'pending' },
  ],
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('aiProcessing.title')}
      description="Orchestrating AI workflows across verified models and timeline metadata."
      maxWidth="md"
    >
      <div className="space-y-6 py-2">
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Intelligent Pipeline In-Progress
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Operations remain fully non-destructive and editable upon completion.
            </p>
          </div>
        </div>

        {/* Step-by-step checklist */}
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                    : 'bg-transparent border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      isActive
                        ? 'font-bold text-slate-900'
                        : isCompleted
                        ? 'font-medium text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                  {isCompleted ? 'Done' : isActive ? 'Active' : 'Queued'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 font-mono text-center pt-2 border-t border-slate-100">
          Backend Worker: Hardware Node Cluster • Status: Streaming
        </div>
      </div>
    </Modal>
  );
};
export default AIProcessingModal;
