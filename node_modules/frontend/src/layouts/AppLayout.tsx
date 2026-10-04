import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Film,
  Scissors,
  Share2,
  Calendar,
  Send,
  BarChart3,
  BrainCircuit,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  ExternalLink,
  Layers,
  FileCode2,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtimeJobs } from '../context/RealtimeJobsContext';
import RealtimeJobsDrawer from '../components/common/RealtimeJobsDrawer';
import LanguageSelector from '../components/common/LanguageSelector';
import GlobalSearchModal from '../components/common/GlobalSearchModal';
import OnboardingModal from '../components/common/OnboardingModal';
import { API_BASE_URL } from '../api/client';

export const AppLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { activeJobs } = useRealtimeJobs();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('nav.aiStudio'), path: '/ai-studio', icon: Sparkles, badge: 'AI' },
    { label: t('nav.workspace'), path: '/workspace', icon: Layers },
    { label: t('nav.scriptToVideo'), path: '/script-to-video', icon: FileCode2 },
    { label: t('nav.videoEditor'), path: '/editor', icon: Film },
    { label: t('nav.clipGenerator'), path: '/clips', icon: Scissors, badge: 'Auto' },
    { label: t('nav.assets'), path: '/assets', icon: FolderOpen },
    { label: t('nav.adaptation'), path: '/adaptation', icon: Share2 },
    { label: t('nav.calendar'), path: '/calendar', icon: Calendar },
    { label: t('nav.publishing'), path: '/publishing', icon: Send },
    { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
    { label: t('nav.intelligence'), path: '/intelligence', icon: BrainCircuit, badge: 'Insights' },
    { label: t('nav.settings'), path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Application Header */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Clean Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                CreatorAI
                <span className="text-[10px] px-1.5 py-0.2 font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded">
                  STUDIO
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wide -mt-0.5">
                Operations Platform
              </span>
            </div>
          </NavLink>
        </div>

        {/* Global Search Bar (Center) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 transition-colors cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('common.search')}</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Language Selector, Notifications, Onboarding, User Profile */}
        <div className="flex items-center gap-3">
          {/* Active background jobs indicator */}
          {activeJobs.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              <span>{activeJobs.length} Processing</span>
            </div>
          )}

          {/* Multi-language Selector (EN | हिन्दी | मराठी) */}
          <LanguageSelector compact />

          {/* Quick Onboarding Setup button */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Calibrate Creator Workspace Settings"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium">{t('common.onboarding')}</span>
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 animate-scale-up">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">{t('common.notifications')}</span>
                  <span className="text-[10px] text-blue-600 font-mono font-medium">3 unread</span>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <p className="font-semibold text-slate-800">Clip Generation Complete</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">3 viral clips extracted from your interview.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-800">Instagram Scheduled</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Your reel is queued for tomorrow at 18:00.</p>
                  </div>
                </div>
                <NavLink
                  to="/calendar"
                  onClick={() => setShowNotifications(false)}
                  className="block text-center text-xs text-blue-600 hover:text-blue-700 font-medium pt-2 border-t border-slate-100"
                >
                  View calendar queue &rarr;
                </NavLink>
              </div>
            )}
          </div>

          {/* User Profile / Menu */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
              }
              alt={user?.name || 'Creator'}
              className="w-7.5 h-7.5 rounded-full border border-slate-300 object-cover"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'Alex Rivera'}</span>
              <span className="text-[10px] text-slate-500 leading-tight">{user?.channelName || 'AI Studio'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title={t('common.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Clean, Compact Professional Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-60 bg-white border-r border-slate-200 pt-16 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Navigation Links */}
          <div className="p-3 space-y-0.5 overflow-y-auto flex-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {t('common.operations')}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Footer of Sidebar */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>API: Active</span>
              <NavLink to="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-sans">
                {t('common.docs')} <ExternalLink className="w-3 h-3" />
              </NavLink>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Real-time background job progress indicator */}
      <RealtimeJobsDrawer />

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Onboarding Wizard Modal */}
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </div>
  );
};
export default AppLayout;
