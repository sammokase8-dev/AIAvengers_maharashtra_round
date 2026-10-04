import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-2xs">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
    <Skeleton className="h-32 w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);

export const SkeletonStatCard: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 shadow-2xs">
    <div className="flex justify-between items-center">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-20" />
  </div>
);

export const SkeletonTableRow: React.FC = () => (
  <div className="flex items-center justify-between py-4 px-5 border-b border-slate-100">
    <div className="flex items-center gap-3 w-1/3">
      <Skeleton className="h-10 w-16 rounded-md shrink-0" />
      <div className="space-y-1.5 w-full">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-3.5 w-20" />
    <Skeleton className="h-6 w-20 rounded-full" />
    <Skeleton className="h-8 w-16 rounded-lg" />
  </div>
);
export default Skeleton;
