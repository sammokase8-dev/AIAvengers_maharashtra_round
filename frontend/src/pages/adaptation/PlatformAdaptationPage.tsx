import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  Film,
  Type,
  Hash,
  MessageSquare,
  Image as ImageIcon,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Monitor,
  Square,
  Sliders,
} from 'lucide-react';
import { platformApi } from '../../services/platformApi';
import { creatorApi } from '../../services/creatorApi';
import { PlatformAdaptationConfig, PlatformType } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useRealtimeJobs } from '../../context/RealtimeJobsContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { NavLink } from 'react-router-dom';

const PLATFORM_LIST: Array<{ id: PlatformType; name: string; defaultRatio: string }> = [
  { id: 'youtube', name: 'YouTube Long', defaultRatio: '16:9' },
  { id: 'youtube_shorts', name: 'YouTube Shorts', defaultRatio: '9:16' },
  { id: 'instagram_reels', name: 'Instagram Reels', defaultRatio: '9:16' },
  { id: 'instagram_post', name: 'Instagram Post', defaultRatio: '1:1' },
  { id: 'tiktok', name: 'TikTok', defaultRatio: '9:16' },
  { id: 'linkedin', name: 'LinkedIn', defaultRatio: '1:1' },
  { id: 'x', name: 'X (Twitter)', defaultRatio: '16:9' },
];

export const PlatformAdaptationPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, info, error: toastError } = useToast();
  const { trackJob } = useRealtimeJobs();

  const [activePlatform, setActivePlatform] = useState<PlatformType>('youtube');
  const [newTag, setNewTag] = useState('');

  // Fetch adaptations
  const { data: adaptations = [], isLoading: isAdaptationsLoading } = useQuery({
    queryKey: ['platform-adaptations'],
    queryFn: () => platformApi.getAdaptations(),
  });

  // Fetch creator connected accounts
  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: () => creatorApi.getProfile(),
  });

  const currentAdaptation =
    adaptations.find((a) => a.platform === activePlatform) || adaptations[0];

  const isConnected =
    creatorProfile?.connections.find((c) => c.platform === activePlatform)?.connected ?? false;

  const updateMutation = useMutation({
    mutationFn: ({
      platform,
      updates,
    }: {
      platform: PlatformType;
      updates: Partial<PlatformAdaptationConfig>;
    }) => platformApi.updateAdaptation(platform, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-adaptations'] });
      success('Platform adaptation saved.');
    },
  });

  const handleExportVariant = async () => {
    try {
      const job = await platformApi.exportPlatformVariant('prj_01', activePlatform);
      trackJob(job);
      success(`Dispatched ${activePlatform.toUpperCase()} export to backend rendering queue.`);
    } catch (err: any) {
      toastError(err.message || 'Export failed');
    }
  };

  const handleAddHashtag = () => {
    if (!newTag.trim() || !currentAdaptation) return;
    const formatted = newTag.startsWith('#') ? newTag : `#${newTag}`;
    const updatedTags = [...currentAdaptation.hashtags, formatted];
    updateMutation.mutate({
      platform: activePlatform,
      updates: { hashtags: updatedTags },
    });
    setNewTag('');
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    if (!currentAdaptation) return;
    const updatedTags = currentAdaptation.hashtags.filter((t) => t !== tagToRemove);
    updateMutation.mutate({
      platform: activePlatform,
      updates: { hashtags: updatedTags },
    });
  };

  if (isAdaptationsLoading || !currentAdaptation) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <Share2 className="w-3.5 h-3.5" />
            <span>Multi-Channel Optimization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('adaptation.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t('adaptation.subtitle')}
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={handleExportVariant}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          {t('adaptation.exportVariant')} ({activePlatform.toUpperCase()})
        </Button>
      </div>

      {/* Platform Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {PLATFORM_LIST.map((plat) => {
          const isSelected = activePlatform === plat.id;
          const conn = creatorProfile?.connections.find((c) => c.platform === plat.id);
          const connected = conn?.connected;

          return (
            <button
              key={plat.id}
              onClick={() => setActivePlatform(plat.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-500 shadow-sm text-blue-950 font-semibold ring-2 ring-blue-500/10'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold truncate">{plat.name}</span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    connected ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title={connected ? t('adaptation.connected') : t('adaptation.notConnected')}
                />
              </div>
              <div className="text-[10px] font-medium text-slate-500">{plat.defaultRatio}</div>
            </button>
          );
        })}
      </div>

      {/* Connection Notice Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
          isConnected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isConnected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span className="font-medium">
            {isConnected
              ? `${activePlatform.toUpperCase()} channel authenticated and ready for direct publishing.`
              : `${activePlatform.toUpperCase()} is not connected. Connect account to enable direct scheduled publishing.`}
          </span>
        </div>
        {!isConnected && (
          <NavLink to="/settings">
            <Button variant="secondary" size="sm" className="shrink-0">
              {t('common.connectAccount')}
            </Button>
          </NavLink>
        )}
      </div>

      {/* Main Form & Live Preview (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Customization Controls */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" /> Platform Specific Rules
          </h2>

          {/* Aspect Ratio & Max Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                {t('adaptation.aspectRatioLabel')}
              </label>
              <select
                value={currentAdaptation.aspectRatio}
                onChange={(e) =>
                  updateMutation.mutate({
                    platform: activePlatform,
                    updates: { aspectRatio: e.target.value as any },
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="16:9">16:9 Landscape (YouTube / Desktop)</option>
                <option value="9:16">9:16 Vertical (Reels / TikTok / Shorts)</option>
                <option value="1:1">1:1 Square (Instagram Post / LinkedIn)</option>
                <option value="4:5">4:5 Portrait (Social Feed)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                {t('adaptation.captionStyleLabel')}
              </label>
              <select
                value={currentAdaptation.captionStyle}
                onChange={(e) =>
                  updateMutation.mutate({
                    platform: activePlatform,
                    updates: { captionStyle: e.target.value as any },
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bold_punchy">Bold Punchy (Kinetic Pop)</option>
                <option value="karaoke_glow">Karaoke Glow (Active Word)</option>
                <option value="minimal">Minimal Clean (Bottom Third)</option>
                <option value="subtitles_only">Standard Subtitles Only</option>
              </select>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-semibold text-slate-700">{t('adaptation.titleLabel')}</label>
              <span className="text-[11px] font-medium text-slate-500">
                {currentAdaptation.title.length}/100 chars
              </span>
            </div>
            <Input
              value={currentAdaptation.title}
              onChange={(e) =>
                updateMutation.mutate({
                  platform: activePlatform,
                  updates: { title: e.target.value },
                })
              }
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              {t('adaptation.descriptionLabel')}
            </label>
            <Textarea
              rows={4}
              value={currentAdaptation.description}
              onChange={(e) =>
                updateMutation.mutate({
                  platform: activePlatform,
                  updates: { description: e.target.value },
                })
              }
            />
          </div>

          {/* Hashtag Manager */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              {t('adaptation.hashtagsLabel')}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <Input
                placeholder={t('common.addTagPlaceholder')}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
              />
              <Button variant="secondary" size="md" onClick={handleAddHashtag}>
                {t('common.create')}
              </Button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {currentAdaptation.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveHashtag(tag)}
                    className="text-slate-400 hover:text-rose-600 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              {t('adaptation.ctaLabel')}
            </label>
            <Input
              value={currentAdaptation.ctaText}
              onChange={(e) =>
                updateMutation.mutate({
                  platform: activePlatform,
                  updates: { ctaText: e.target.value },
                })
              }
            />
          </div>
        </div>

        {/* Right Column (5 Cols): Live Preview Mockup */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {activePlatform.toUpperCase()} Preview Card
              </span>
              <Badge variant="primary" size="sm">{currentAdaptation.aspectRatio}</Badge>
            </div>

            {/* Video preview simulation */}
            <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative aspect-video flex items-center justify-center shadow-inner">
              <img
                src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80"
                alt="Mockup"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="bg-black/90 text-yellow-300 font-extrabold text-xs px-2.5 py-1 rounded border border-yellow-400/20">
                  [{currentAdaptation.captionStyle.toUpperCase()} SUBTITLES]
                </span>
              </div>
            </div>

            {/* Simulated Post Details */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 leading-snug">{currentAdaptation.title}</h4>
              <p className="text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line text-[11px]">
                {currentAdaptation.description}
              </p>
              <div className="text-blue-600 text-[11px] font-medium">
                {currentAdaptation.hashtags.join(' ')}
              </div>
              <div className="text-emerald-700 font-semibold text-[11px] pt-1">
                CTA: {currentAdaptation.ctaText}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Encoding: Hardware FFmpeg GPU</span>
            <span className="text-emerald-600 font-medium">Ready to Export</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PlatformAdaptationPage;
