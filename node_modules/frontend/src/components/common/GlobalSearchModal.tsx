import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  FolderOpen,
  Film,
  FileText,
  Scissors,
  Layers,
  Sparkles,
  Clock,
  ArrowRight,
  X,
  Send,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  title: string;
  category: 'projects' | 'assets' | 'scripts' | 'clips' | 'navigation';
  description?: string;
  url: string;
  icon: any;
}

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'AI Engineer Roadmap',
    'Interview B-Roll',
    'Hook retention script',
    'TikTok vertical clip',
  ]);

  const allItems: SearchResultItem[] = [
    {
      id: 'p1',
      title: 'The Modern AI Engineer Roadmap (2026)',
      category: 'projects',
      description: 'Active project in editing stage',
      url: '/workspace',
      icon: Layers,
    },
    {
      id: 'p2',
      title: 'Why Most Creators Fail at Short-Form Repurposing',
      category: 'projects',
      description: 'Review stage project with 3 clips',
      url: '/workspace',
      icon: Layers,
    },
    {
      id: 'a1',
      title: 'A-Roll_Interview_4K.mp4',
      category: 'assets',
      description: 'Raw footage • 680 MB • 4K UHD',
      url: '/assets',
      icon: FolderOpen,
    },
    {
      id: 'a2',
      title: 'B-Roll_Studio_Coding_Setup.mp4',
      category: 'assets',
      description: 'B-roll footage • 320 MB • 1080p',
      url: '/assets',
      icon: FolderOpen,
    },
    {
      id: 's1',
      title: 'Artificial intelligence is changing video ops',
      category: 'scripts',
      description: 'Script segment matched with 94% confidence',
      url: '/script-to-video',
      icon: FileText,
    },
    {
      id: 'c1',
      title: 'Clip: The Uncomfortable Truth About Content Scaling',
      category: 'clips',
      description: '00:32–01:04 • 9:16 Vertical • Score 94',
      url: '/clips',
      icon: Scissors,
    },
    {
      id: 'c2',
      title: 'Clip: Why Prompt Engineering Is Not Programming',
      category: 'clips',
      description: '02:10–02:47 • 9:16 Vertical • Score 89',
      url: '/clips',
      icon: Scissors,
    },
    {
      id: 'n1',
      title: 'AI Studio (Script & Hook Generator)',
      category: 'navigation',
      description: 'Generate ideas, hooks, screenplays, and CTAs',
      url: '/ai-studio',
      icon: Sparkles,
    },
    {
      id: 'n2',
      title: 'Timeline Video Editor',
      category: 'navigation',
      description: 'Non-destructive multitrack timeline editor',
      url: '/editor',
      icon: Film,
    },
    {
      id: 'n3',
      title: 'Multi-Platform Adaptation Suite',
      category: 'navigation',
      description: 'Adapt copy and framing for 7 networks',
      url: '/adaptation',
      icon: Send,
    },
  ];

  // Filter items
  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (url: string, term?: string) => {
    if (term && !recentSearches.includes(term)) {
      setRecentSearches((prev) => [term, ...prev.slice(0, 4)]);
    }
    navigate(url);
    onClose();
    setQuery('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle handled outside
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-up">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search')}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Content body */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            /* Recent Searches & Suggested Categories */
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t('common.recentSearches')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200/80 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {t('common.quickNavigation')}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleSelect('/ai-studio')}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium text-slate-700">{t('nav.aiStudio')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleSelect('/editor')}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium text-slate-700">{t('nav.videoEditor')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleSelect('/clips')}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium text-slate-700">{t('nav.clipGenerator')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleSelect('/calendar')}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-left flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium text-slate-700">{t('nav.calendar')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            /* Empty State */
            <div className="py-8 text-center text-slate-500 text-xs">
              {t('common.noSearchResults')} "{query}".
            </div>
          ) : (
            /* Results List */
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.url, item.title)}
                    className="w-full py-3 px-2 flex items-center justify-between text-left hover:bg-slate-50 rounded-lg transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0 ml-3">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>{t('common.closeHelp')}</span>
          <span>CreatorAI Global Index</span>
        </div>
      </div>
    </div>
  );
};
export default GlobalSearchModal;
