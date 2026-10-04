import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Trash2,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  Save,
  Film,
  Type,
  Subtitles,
  Smartphone,
  Monitor,
  Square,
  Sparkles,
  ArrowRight,
  Plus,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
} from 'lucide-react';
import { videoApi } from '../../services/videoApi';
import { EditModel, TimelineClip, CaptionItem, OverlayItem } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useRealtimeJobs } from '../../context/RealtimeJobsContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export const VideoEditorPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, info, error: toastError } = useToast();
  const { trackJob } = useRealtimeJobs();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load initial structured edit timeline from API
  const { data: initialTimeline, isLoading } = useQuery({
    queryKey: ['editor-timeline', 'prj_01'],
    queryFn: () => videoApi.getProjectEditTimeline('prj_01'),
  });

  // Editor State
  const [timeline, setTimeline] = useState<EditModel | null>(null);
  const [history, setHistory] = useState<EditModel[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);

  // Inspector / Overlay modal state
  const [isAddOverlayModalOpen, setIsAddOverlayModalOpen] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState('4K 60fps ProRes');

  // Initialize timeline once loaded
  useEffect(() => {
    if (initialTimeline && !timeline) {
      setTimeline(initialTimeline);
      setHistory([initialTimeline]);
      setHistoryIndex(0);
      if (initialTimeline.clips.length > 0) {
        setSelectedClipId(initialTimeline.clips[0].id);
      }
    }
  }, [initialTimeline, timeline]);

  // Save to History helper for Undo/Redo
  const pushState = (newTimeline: EditModel) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newTimeline);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setTimeline(newTimeline);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setTimeline(prev);
      info('Action undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setTimeline(next);
      info('Action redone');
    }
  };

  // Playhead Sync
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const totalDur = timeline?.totalDuration || 42.5;
          if (prev >= totalDur) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(totalDur, prev + 0.1);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeline]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Timeline Operations
  const handleSplitClip = () => {
    if (!timeline || !selectedClipId) return;

    const clipIndex = timeline.clips.findIndex((c) => c.id === selectedClipId);
    if (clipIndex === -1) return;

    const clip = timeline.clips[clipIndex];
    const clipOffset = currentTime - clip.timelineStart;

    if (clipOffset <= 1 || clipOffset >= clip.endTime - clip.startTime - 1) {
      toastError('Position playhead at least 1s inside the clip to split.');
      return;
    }

    const firstHalf: TimelineClip = {
      ...clip,
      endTime: clip.startTime + clipOffset,
    };

    const secondHalf: TimelineClip = {
      ...clip,
      id: `clip_${Date.now()}`,
      startTime: clip.startTime + clipOffset,
      timelineStart: clip.timelineStart + clipOffset,
    };

    const newClips = [...timeline.clips];
    newClips.splice(clipIndex, 1, firstHalf, secondHalf);

    const updatedTimeline: EditModel = {
      ...timeline,
      clips: newClips,
      lastSavedAt: new Date().toISOString(),
    };

    pushState(updatedTimeline);
    setSelectedClipId(secondHalf.id);
    success('Split clip at playhead position');
  };

  const handleDeleteClip = () => {
    if (!timeline || !selectedClipId) return;
    if (timeline.clips.length <= 1) {
      toastError('Cannot delete the only clip on the timeline.');
      return;
    }

    const filtered = timeline.clips.filter((c) => c.id !== selectedClipId);
    let runningTime = 0;
    const recalculated = filtered.map((c) => {
      const dur = c.endTime - c.startTime;
      const updated = { ...c, timelineStart: runningTime };
      runningTime += dur;
      return updated;
    });

    const updatedTimeline: EditModel = {
      ...timeline,
      clips: recalculated,
      totalDuration: runningTime,
      lastSavedAt: new Date().toISOString(),
    };

    pushState(updatedTimeline);
    setSelectedClipId(recalculated[0].id);
    success('Clip removed from timeline');
  };

  const handleReorderClip = (direction: 'left' | 'right') => {
    if (!timeline || !selectedClipId) return;
    const index = timeline.clips.findIndex((c) => c.id === selectedClipId);
    if (index === -1) return;

    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === timeline.clips.length - 1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const newClips = [...timeline.clips];
    const [moved] = newClips.splice(index, 1);
    newClips.splice(targetIndex, 0, moved);

    let runningTime = 0;
    const recalculated = newClips.map((c) => {
      const dur = c.endTime - c.startTime;
      const updated = { ...c, timelineStart: runningTime };
      runningTime += dur;
      return updated;
    });

    const updatedTimeline: EditModel = {
      ...timeline,
      clips: recalculated,
      lastSavedAt: new Date().toISOString(),
    };

    pushState(updatedTimeline);
    info(`Moved clip ${direction}`);
  };

  const handleTrim = (type: 'start' | 'end', delta: number) => {
    if (!timeline || !selectedClipId) return;
    const newClips = timeline.clips.map((c) => {
      if (c.id === selectedClipId) {
        if (type === 'start') {
          const newStart = Math.max(0, c.startTime + delta);
          if (c.endTime - newStart < 1) return c;
          return { ...c, startTime: newStart };
        } else {
          const newEnd = Math.max(c.startTime + 1, c.endTime + delta);
          return { ...c, endTime: newEnd };
        }
      }
      return c;
    });

    let running = 0;
    const recalculated = newClips.map((c) => {
      const dur = c.endTime - c.startTime;
      const updated = { ...c, timelineStart: running };
      running += dur;
      return updated;
    });

    const updatedTimeline: EditModel = {
      ...timeline,
      clips: recalculated,
      totalDuration: running,
      lastSavedAt: new Date().toISOString(),
    };

    pushState(updatedTimeline);
  };

  const handleAspectRatioChange = (aspectRatio: '16:9' | '9:16' | '1:1' | '4:5') => {
    if (!timeline) return;
    const updated: EditModel = {
      ...timeline,
      aspectRatio,
      lastSavedAt: new Date().toISOString(),
    };
    pushState(updated);
    info(`Aspect ratio set to ${aspectRatio}`);
  };

  const handleAddOverlay = () => {
    if (!timeline || !overlayText.trim()) return;

    const newOverlay: OverlayItem = {
      id: `ovl_${Date.now()}`,
      type: 'text',
      content: overlayText,
      startTime: currentTime,
      endTime: Math.min(timeline.totalDuration, currentTime + 4),
      x: 50,
      y: 80,
      style: {
        fontSize: 24,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        fontWeight: 'bold',
      },
    };

    const updated: EditModel = {
      ...timeline,
      overlays: [...timeline.overlays, newOverlay],
      lastSavedAt: new Date().toISOString(),
    };

    pushState(updated);
    setIsAddOverlayModalOpen(false);
    setOverlayText('');
    success('Text overlay added at current timestamp');
  };

  const handleSaveProject = async () => {
    if (!timeline) return;
    try {
      await videoApi.saveProjectEditTimeline('prj_01', timeline);
      success('Timeline project saved non-destructively.');
    } catch {
      toastError('Save failed');
    }
  };

  const handleRequestBackendRender = async () => {
    if (!timeline) return;
    try {
      const job = await videoApi.requestBackendRender('prj_01', timeline, {
        resolution: timeline.aspectRatio === '9:16' ? '1080x1920' : '3840x2160',
        fps: 60,
        preset: exportPreset,
      });
      trackJob(job);
      success('Timeline dispatched to FFmpeg render nodes.', 'Render Queued');
      setIsRenderModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'Render request failed');
    }
  };

  if (!timeline) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        {t('common.loading')}
      </div>
    );
  }

  const selectedClip = timeline.clips.find((c) => c.id === selectedClipId);
  const activeCaptions = timeline.captionTrack.filter(
    (c) => currentTime >= c.startTime && currentTime <= c.endTime
  );
  const activeOverlays = timeline.overlays.filter(
    (o) => currentTime >= o.startTime && currentTime <= o.endTime
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Header / Project Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tracking-tight">{t('editor.title')}</span>
              <Badge variant="primary" size="sm">Non-Destructive</Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {t('editor.subtitle')} • {timeline.totalDuration.toFixed(1)}s
            </p>
          </div>
        </div>

        {/* Aspect Ratio Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
          {[
            { id: '16:9', label: '16:9 Landscape', icon: Monitor },
            { id: '9:16', label: '9:16 Vertical', icon: Smartphone },
            { id: '1:1', label: '1:1 Square', icon: Square },
          ].map((ratio) => {
            const Icon = ratio.icon;
            const isSelected = timeline.aspectRatio === ratio.id;
            return (
              <button
                key={ratio.id}
                onClick={() => handleAspectRatioChange(ratio.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{ratio.id}</span>
              </button>
            );
          })}
        </div>

        {/* Undo / Redo & Save Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 hover:bg-slate-200/60 transition-colors"
            title={t('editor.undo')}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 hover:bg-slate-200/60 transition-colors"
            title={t('editor.redo')}
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveProject}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            {t('editor.saveProject')}
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsRenderModalOpen(true)}
            rightIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {t('editor.exportBackend')}
          </Button>
        </div>
      </div>

      {/* Center Viewport & Inspector (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Video Canvas Preview */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[400px] overflow-hidden shadow-sm">
          {/* Framed aspect ratio display */}
          <div
            className={`relative bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center ${
              timeline.aspectRatio === '9:16'
                ? 'w-[230px] h-[410px]'
                : timeline.aspectRatio === '1:1'
                ? 'w-[340px] h-[340px]'
                : 'w-full max-w-[620px] aspect-video'
            }`}
          >
            <video
              ref={videoRef}
              src={selectedClip?.sourceUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              className="w-full h-full object-cover pointer-events-none"
              muted={isMuted}
            />

            {/* In-Frame Overlays */}
            {activeOverlays.map((ovl) => (
              <div
                key={ovl.id}
                className="absolute z-20 px-3 py-1 rounded text-center text-xs tracking-wider"
                style={{
                  top: `${ovl.y}%`,
                  left: `${ovl.x}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: ovl.style?.backgroundColor || 'rgba(0,0,0,0.7)',
                  color: ovl.style?.color || '#ffffff',
                  fontWeight: ovl.style?.fontWeight || 'bold',
                }}
              >
                {ovl.content}
              </div>
            ))}

            {/* In-Frame Dynamic Caption Preview */}
            {activeCaptions.map((cap) => (
              <div
                key={cap.id}
                className="absolute bottom-6 left-4 right-4 z-20 text-center"
              >
                <span className="bg-black/85 text-yellow-300 font-extrabold text-xs sm:text-sm px-3 py-1.5 rounded-lg shadow-lg border border-yellow-400/20 leading-tight">
                  {cap.text}
                </span>
              </div>
            ))}

            {/* Center Play Overlay Button */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </div>
            </button>
          </div>

          <div className="absolute top-4 left-4 text-[11px] font-medium text-slate-300 bg-black/70 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs">
            Playhead: {currentTime.toFixed(2)}s / {timeline.totalDuration.toFixed(2)}s
          </div>
        </div>

        {/* Right Inspector Column */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" /> {t('editor.inspector')}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {selectedClip?.sourceAssetName.split('.')[0] || 'Clip'}
              </span>
            </div>

            {selectedClip && (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-2">
                  <div className="font-semibold text-slate-800">Source Offset & Speed</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                    <div>In: {selectedClip.startTime.toFixed(1)}s</div>
                    <div>Out: {selectedClip.endTime.toFixed(1)}s</div>
                    <div>Duration: {(selectedClip.endTime - selectedClip.startTime).toFixed(1)}s</div>
                    <div>Speed: {selectedClip.speed}x</div>
                  </div>
                </div>

                {/* Fine Trim In / Out Buttons */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-700">{t('editor.nudge')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleTrim('start', -0.5)}>
                        -0.5s
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleTrim('start', 0.5)}>
                        +0.5s
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleTrim('end', -0.5)}>
                        -0.5s
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleTrim('end', 0.5)}>
                        +0.5s
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Audio Gain */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-700">
                    <span className="font-medium">{t('editor.volumeGain')}</span>
                    <span className="text-slate-500">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Captions Inspector */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Subtitles className="w-3.5 h-3.5 text-blue-600" /> {t('editor.captionsTrack')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {timeline.captionTrack.length} beats
                </span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                {timeline.captionTrack.map((cap) => (
                  <div
                    key={cap.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700"
                  >
                    <span className="text-blue-600 font-medium text-[10px] block mb-0.5">
                      {cap.startTime.toFixed(1)}s - {cap.endTime.toFixed(1)}s
                    </span>
                    {cap.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setIsAddOverlayModalOpen(true)}
            leftIcon={<Type className="w-3.5 h-3.5 text-blue-600" />}
          >
            {t('editor.addOverlay')}
          </Button>
        </div>
      </div>

      {/* Bottom Multi-Track Timeline */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
        {/* Timeline Transport Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentTime(0)}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSplitClip}
              leftIcon={<Scissors className="w-3.5 h-3.5 text-blue-600" />}
            >
              {t('editor.split')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteClip}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {t('editor.deleteSegment')}
            </Button>
          </div>

          {/* Reordering & Zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReorderClip('left')}
              className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
              title={t('common.moveLeft')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleReorderClip('right')}
              className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
              title={t('common.moveRight')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button
              onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.2))}
              className="p-1.5 text-slate-500 hover:text-slate-900"
              title={t('common.zoomOut')}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTimelineZoom(Math.min(2.5, timelineZoom + 0.2))}
              className="p-1.5 text-slate-500 hover:text-slate-900"
              title={t('common.zoomIn')}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master Time Scrubber Ruler */}
        <div className="relative h-7 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 select-none">
          <input
            type="range"
            min={0}
            max={timeline.totalDuration}
            step={0.1}
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            className="w-full h-full opacity-0 cursor-ew-resize absolute inset-0 z-30"
          />
          {/* Visual Red Scrubber Needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
            style={{ left: `${(currentTime / timeline.totalDuration) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full -ml-1 -mt-0.5 shadow-xs" />
          </div>
          {/* Time markers */}
          <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-medium text-slate-500">
            <span>00:00</span>
            <span>{(timeline.totalDuration / 2).toFixed(1)}s</span>
            <span>{timeline.totalDuration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Multi-Track Containers */}
        <div className="space-y-2 pt-1">
          {/* Track 1: Text Overlays */}
          <div className="flex items-center gap-2">
            <span className="w-24 text-[11px] font-medium text-slate-600 shrink-0 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-purple-600" /> {t('editor.overlaysTrack')}
            </span>
            <div className="flex-1 h-8 bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden">
              {timeline.overlays.map((ovl) => {
                const left = (ovl.startTime / timeline.totalDuration) * 100;
                const width = ((ovl.endTime - ovl.startTime) / timeline.totalDuration) * 100;
                return (
                  <div
                    key={ovl.id}
                    className="absolute top-1 bottom-1 bg-purple-100 border border-purple-300 rounded px-2 text-[10px] font-semibold text-purple-800 truncate flex items-center"
                    style={{ left: `${left}%`, width: `${Math.max(5, width)}%` }}
                  >
                    {ovl.content}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Video Clips Track */}
          <div className="flex items-center gap-2">
            <span className="w-24 text-[11px] font-medium text-slate-600 shrink-0 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-blue-600" /> {t('editor.videoTrack')}
            </span>
            <div className="flex-1 h-14 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center gap-1.5 relative overflow-x-auto">
              {timeline.clips.map((clip) => {
                const isSelected = selectedClipId === clip.id;
                const dur = clip.endTime - clip.startTime;
                const widthPercent = (dur / timeline.totalDuration) * 100;

                return (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setSelectedClipId(clip.id);
                      setCurrentTime(clip.timelineStart);
                    }}
                    className={`h-full rounded-md border flex flex-col justify-between p-1.5 cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'
                    }`}
                    style={{ width: `${Math.max(12, widthPercent)}%` }}
                  >
                    <div className="text-[10px] font-bold truncate">
                      {clip.sourceAssetName}
                    </div>
                    <div className={`text-[9px] font-medium flex items-center justify-between ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      <span>{dur.toFixed(1)}s</span>
                      <span>{clip.speed}x</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 3: Subtitles / Captions */}
          <div className="flex items-center gap-2">
            <span className="w-24 text-[11px] font-medium text-slate-600 shrink-0 flex items-center gap-1.5">
              <Subtitles className="w-3.5 h-3.5 text-amber-600" /> {t('editor.captionsTrack')}
            </span>
            <div className="flex-1 h-8 bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden">
              {timeline.captionTrack.map((cap) => {
                const left = (cap.startTime / timeline.totalDuration) * 100;
                const width = ((cap.endTime - cap.startTime) / timeline.totalDuration) * 100;
                return (
                  <div
                    key={cap.id}
                    className="absolute top-1 bottom-1 bg-amber-100 border border-amber-300 rounded px-2 text-[10px] font-semibold text-amber-800 truncate flex items-center"
                    style={{ left: `${left}%`, width: `${Math.max(5, width)}%` }}
                  >
                    {cap.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Text Overlay Modal */}
      <Modal
        isOpen={isAddOverlayModalOpen}
        onClose={() => setIsAddOverlayModalOpen(false)}
        title={t('editor.addOverlay')}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label={t('common.overlayText')}
            placeholder={t('common.overlayPlaceholder')}
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            autoFocus
          />
          <div className="text-xs text-slate-500">
            Will be inserted at playhead ({currentTime.toFixed(1)}s) for 4 seconds duration.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddOverlayModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddOverlay} disabled={!overlayText.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Render via Backend Modal */}
      <Modal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        title={t('editor.exportBackend')}
        description="The structured timeline data model will be compiled on hardware-accelerated nodes."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
            <div>{t('editor.aspectRatio')}: <strong className="text-slate-900">{timeline.aspectRatio}</strong></div>
            <div>{t('editor.clipsOnTimeline')}: <strong className="text-slate-900">{timeline.clips.length} {t('common.items')}</strong></div>
            <div>{t('editor.captionBurnIn')}: <strong className="text-emerald-600">{t('editor.enabled')}</strong></div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              {t('editor.outputPreset')}
            </label>
            <select
              value={exportPreset}
              onChange={(e) => setExportPreset(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="4K 60fps ProRes">4K 60fps ProRes 422 HQ (Master)</option>
              <option value="1080p 60fps H.264">1080p 60fps H.264 (Web & Social Fast Export)</option>
              <option value="9:16 Vertical 4K">9:16 Vertical UHD (Reels & Shorts Optimized)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsRenderModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" size="sm" onClick={handleRequestBackendRender}>
              {t('editor.renderVideo')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default VideoEditorPage;
