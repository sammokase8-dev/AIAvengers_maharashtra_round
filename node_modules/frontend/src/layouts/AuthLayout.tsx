import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import LanguageSelector from '../components/common/LanguageSelector';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 antialiased selection:bg-blue-600 selection:text-white relative">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector compact />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <NavLink to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
              CreatorAI
              <span className="text-[10px] px-1.5 py-0.5 font-mono font-medium bg-slate-200 text-slate-700 rounded">
                STUDIO
              </span>
            </span>
          </NavLink>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            Professional Content Operations Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8">
          <Outlet />
        </div>

        {/* Security / Notice */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured via CreatorAI Centralized Service Layer</span>
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
