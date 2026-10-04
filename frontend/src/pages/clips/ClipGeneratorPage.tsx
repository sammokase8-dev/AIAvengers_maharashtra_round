import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Scissors,
  Sparkles,
  Play,
  Check,
  X,
  RotateCw,
  Film,
  FileText,
  Share2,
  Clock,
  TrendingUp,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { clipsApi } from '../../services/clipsApi';
import { assetsApi } from '../../services/assetsApi';
import { videoApi } from '../../services/videoApi';
import { GeneratedClip } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useRealtimeJobs } from '../../context/RealtimeJobsContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { SkeletonCard } from '../../components/common/SkeletonLoader';

export const ClipGeneratorPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { success, info, error: toastError } = useToast();
  const { trackJob } = useRealtimeJobs();

  // Generator inputs
  const [selectedAssetId, setSelectedAssetId] = useState('ast_vid_01');
  const [scriptContext, setScriptContext] = useState(
    'Highlight the contrast between traditional 8-hour editing pipelines and modern programmatic creator operations.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [previewClip, setPreviewClip] = useState<GeneratedClip | null>(null);

  // Queries
  const { data: clips = [], isLoading: isClipsLoading } = useQuery({
    queryKey: ['generated-clips'],
    queryFn: () => clipsApi.getClips(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', 'video'],
    queryFn: () => assetsApi.getAssets({ type: 'video' }),
  });

  const { data: transcript } = useQuery({
    queryKey: ['transcript', selectedAssetId],
    queryFn: () => videoApi.getTranscript(selectedAssetId),
    refetchInterval: (query) => query.state.data ? false : 5000,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ clipId, status }: { clipId: string; status: 'accepted' | 'rejected' }) =>
      clipsApi.updateClipStatus(clipId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['generated-clips'] });
      success(`Clip marked as ${status}`);
    },
  });

  const regenerateHookMutation = useMutation({
    mutationFn: (clipId: string) => clipsApi.regenerateClipHook(clipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-clips'] });
      info('AI regenerated new hook variation');
    },
  });

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    try {
      const job = await clipsApi.startClipGeneration({
        sourceAssetId: selectedAssetId,
        scriptText: scriptContext,
        maxClips: 3,
      });
      trackJob(job);
      success('Clip generation task initiated on backend cluster.');
      queryClient.invalidateQueries({ queryKey: ['generated-clips'] });
    } catch (err: any) {
      toastError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    try {
      const job = await videoApi.transcribeAsset(selectedAssetId);
      trackJob(job);
      info('Transcription queued. Timestamped segments will appear when the job completes.');
    } catch (err: any) {
      toastError(err.message || 'Could not start transcription');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Automated Repurposing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('clips.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t('clips.subtitle')}
          </p>
        </div>

        <NavLink to="/editor">
          <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            {t('clips.editInEditor')}
          </Button>
        </NavLink>
      </div>

      {/* Input Configuration Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Film className="w-4 h-4 text-blue-600" /> Source Media & Context
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Video */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              {t('clips.selectFootage')}
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({(asset.sizeBytes / (1024 * 1024)).toFixed(0)} MB)
                </option>
              ))}
            </select>
          </div>

          {/* Optional Script Guidance */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              {t('clips.guidanceLabel')}
            </label>
            <input
              type="text"
              value={scriptContext}
              onChange={(e) => setScriptContext(e.target.value)}
              placeholder={t('clips.guidancePlaceholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Trigger Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Output: <span className="text-blue-700 font-semibold">9:16 Vertical with Dynamic Subtitles</span>
          </div>
          <Button
            variant="accent"
            size="md"
            onClick={handleStartGeneration}
            isLoading={isGenerating}
            leftIcon={<Scissors className="w-4 h-4" />}
          >
            {t('clips.findClips')}
          </Button>
          {!transcript && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleTranscribe}
              isLoading={isTranscribing}
              disabled={!selectedAssetId}
            >
              Transcribe source before clipping
            </Button>
          )}
        </div>
      </div>

      {/* Generated Clips Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> {t('clips.extractedClips')}
          </h2>
          <span className="text-xs font-medium text-slate-500">{clips.length} Clips Available</span>
        </div>

        {isClipsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clips.map((clip) => {
              const isAccepted = clip.status === 'accepted';
              const isRejected = clip.status === 'rejected';

              return (
                <div
                  key={clip.id}
                  className={`bg-white border rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                    isAccepted
                      ? 'border-emerald-400 ring-2 ring-emerald-500/20'
                      : isRejected
                      ? 'border-rose-200 opacity-70'
                      : 'border-slate-200/90'
                  }`}
                >
                  {/* Top Preview Banner (9:16 Ratio Box) */}
                  <div
                    className="relative aspect-video sm:aspect-[16/10] bg-slate-900 overflow-hidden cursor-pointer group"
                    onClick={() => setPreviewClip(clip)}
                  >
                    <img
                      src={
                        clip.previewUrl ||
                        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={clip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                    {/* Play Button Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>

                    {/* Timecode Range */}
                    <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1 rounded text-[11px] font-medium text-white backdrop-blur-xs">
                      {formatTimecode(clip.startTime)} – {formatTimecode(clip.endTime)} ({clip.duration}s)
                    </div>

                    {/* Transcript-fit score, not a prediction of future views. */}
                    {clip.selectionScore !== undefined && (
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant={clip.selectionScore >= 75 ? 'success' : 'primary'}
                          size="sm"
                          dot
                        >
                          Fit {clip.selectionScore}
                        </Badge>
                      </div>
                    )}

                    {/* Aspect Ratio Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-600/90 text-white shadow-xs">
                        {clip.aspectRatio} Vertical
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{clip.title}</h3>

                      {/* Hook Display */}
                      <div className="mt-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-950 font-sans leading-relaxed">
                        <span className="font-bold text-amber-800 uppercase text-[10px] block mb-0.5">
                          {t('clips.retentionHook')}
                        </span>
                        "{clip.hook}"
                      </div>

                      {clip.reasoning && (
                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {clip.reasoning}
                        </p>
                      )}
                    </div>

                    {/* Recommended Platforms */}
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 block mb-1">
                        Recommended Distribution:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {clip.recommendedPlatforms.map((plat) => (
                          <span
                            key={plat}
                            className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {plat.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant={isAccepted ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({ clipId: clip.id, status: 'accepted' })
                          }
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          {isAccepted ? 'Accepted' : t('clips.accept')}
                        </Button>
                        <Button
                          variant={isRejected ? 'danger' : 'ghost'}
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({ clipId: clip.id, status: 'rejected' })
                          }
                          leftIcon={<X className="w-3.5 h-3.5" />}
                        >
                          {t('clips.reject')}
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => regenerateHookMutation.mutate(clip.id)}
                          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                          title={t('clips.regenerateHook')}
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <NavLink to="/editor">
                          <Button variant="outline" size="sm">
                            {t('common.edit')}
                          </Button>
                        </NavLink>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 9:16 Vertical Video Preview Modal */}
      {previewClip && (
        <Modal
          isOpen={!!previewClip}
          onClose={() => setPreviewClip(null)}
          title={`Review Short: ${previewClip.title}`}
          description={`Timecode: ${formatTimecode(previewClip.startTime)} – ${formatTimecode(
            previewClip.endTime
          )}`}
          maxWidth="md"
        >
          <div className="space-y-4 flex flex-col items-center">
            {/* 9:16 Container */}
            <div className="w-[260px] h-[460px] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex items-center justify-center">
              <video
                src="/media/demo_main.mp4"
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1 rounded text-[10px] font-medium text-white backdrop-blur-xs">
                9:16 Vertical Cut
              </div>
            </div>

            <div className="text-xs text-center text-slate-700 max-w-sm">
              <strong className="text-amber-700">{t('clips.retentionHook')}</strong> "{previewClip.hook}"
            </div>

            <div className="flex items-center justify-between w-full pt-3 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setPreviewClip(null)}>
                {t('common.close')}
              </Button>
              <NavLink to="/editor">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  {t('clips.editInEditor')}
                </Button>
              </NavLink>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default ClipGeneratorPage;
