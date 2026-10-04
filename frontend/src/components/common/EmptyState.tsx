import React from 'react';
import { useTranslation } from 'react-i18next';
import { LucideIcon, FolderSearch, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  isLoading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  isLoading,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white shadow-2xs max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center gap-3 mt-6">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction} isLoading={isLoading}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <Button variant="secondary" size="md" onClick={onSecondaryAction}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title,
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-red-200 bg-red-50/50 max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mb-3 shadow-2xs">
        <RefreshCw className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-red-800">{title || t('common.error')}</h3>
      <p className="text-xs text-red-600/90 mt-1 max-w-xs">{message || t('common.failedToLoad')}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4 border-red-300 text-red-700 hover:bg-red-50">
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
