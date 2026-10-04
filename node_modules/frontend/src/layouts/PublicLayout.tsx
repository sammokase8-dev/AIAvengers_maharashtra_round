import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import LanguageSelector from '../components/common/LanguageSelector';

export const PublicLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Navigation Header */}
      <header className="h-18 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 lg:px-12 flex items-center justify-between shadow-2xs">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              CreatorAI
              <span className="text-[10px] px-1.5 py-0.5 font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded">
                STUDIO
              </span>
            </span>
            <span className="text-[11px] text-slate-500 block -mt-0.5 font-mono">
              Creator Operations Platform
            </span>
          </div>
        </NavLink>

        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
          <a href="#workflow" className="hover:text-blue-600 transition-colors">
            {t('landing.workflowTitle')}
          </a>
          <a href="#non-destructive" className="hover:text-blue-600 transition-colors">
            {t('landing.nonDestructiveTitle')}
          </a>
          <a href="#adaptation" className="hover:text-blue-600 transition-colors">
            {t('landing.multiPlatformTitle')}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Global Language Selector */}
          <LanguageSelector compact />

          <NavLink to="/login">
            <Button variant="ghost" size="sm">
              {t('auth.signIn')}
            </Button>
          </NavLink>
          <NavLink to="/dashboard">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              {t('landing.startCreating')}
            </Button>
          </NavLink>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6 lg:px-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              C
            </div>
            <span className="font-semibold text-slate-800">CreatorAI Platform</span>
            <span className="text-slate-300">|</span>
            <span>Commercial Creator Operations Software</span>
          </div>

          <div className="flex items-center gap-6 text-slate-600 font-medium">
            <NavLink to="/dashboard" className="hover:text-blue-600 transition-colors">
              {t('nav.dashboard')}
            </NavLink>
            <NavLink to="/login" className="hover:text-blue-600 transition-colors">
              {t('auth.signIn')}
            </NavLink>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Non-destructive FFmpeg Model
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default PublicLayout;
