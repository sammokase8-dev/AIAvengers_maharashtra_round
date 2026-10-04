import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Play,
  Pause,
  Check,
  X,
  Sliders,
  Sparkles,
  ArrowRight,
  Clock,
  Film,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { contentApi } from '../../services/contentApi';
import { MatchedFootageSegment, ScriptSegment } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export const ScriptToVideoPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, info } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(184);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string>('seg_01');

  // Manual Adjustment Modal
  const [adjustingMatch, setAdjustingMatch] = useState<MatchedFootageSegment | null>(null);
  const [adjustStart, setAdjustStart] = useState<number>(0);
  const [adjustEnd, setAdjustEnd] = useState<number>(0);

  // Fetch match data
  const { data: matchData, isLoading } = useQuery({
    queryKey: ['script-match', 'prj_01'],
    queryFn: () => contentApi.getScriptFootageMatch('prj_01'),
  });

  const updateMatchMutation = useMutation({
    mutationFn: ({
      matchId,
      status,
      adjustments,
    }: {
      matchId: string;
      status: 'accepted' | 'rejected' | 'manual_adjusted';
      adjustments?: { startTime: number; endTime: number };
    }) => contentApi.updateMatchStatus('prj_01', matchId, status, adjustments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-match', 'prj_01'] });
      success('Match decision recorded.', t('common.success'));
      setAdjustingMatch(null);
    },
  });

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Automated Synchronization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('scriptToVideo.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('scriptToVideo.subtitle')}
          </p>
        </div>

        <NavLink to="/editor">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            {t('scriptToVideo.openInEditor')}
          </Button>
        </NavLink>
      </div>

      {/* 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        {/* LEFT COLUMN (4 Cols): Interactive Script */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" /> {t('scriptToVideo.scriptSegments')}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {matchData?.segments.length || 3} Segments
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {(matchData?.segments || []).map((seg: ScriptSegment) => {
                const isActive = activeSegmentId === seg.id;
                const matched = matchData?.matchedFootage.find(
                  (m) => m.scriptSegmentId === seg.id
                );

                return (
                  <div
                    key={seg.id}
                    onClick={() => {
                      setActiveSegmentId(seg.id);
                      if (matched) seekTo(matched.startTime);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                      <span className="font-semibold text-slate-700">Beat #{seg.sentenceIndex + 1}</span>
                      {seg.timestampEstimate && (
                        <span>
                          ~{seg.timestampEstimate.start}s - {seg.timestampEstimate.end}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">{seg.text}</p>
                    {seg.suggestedBroll && (
                      <div className="mt-2 text-[10px] font-mono text-blue-700 bg-blue-100/50 px-2 py-1 rounded border border-blue-200">
                        Suggested B-Roll: {seg.suggestedBroll}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Linked Project: The AI Roadmap</span>
            <span className="text-emerald-700 font-semibold">Synced ✓</span>
          </div>
        </div>

        {/* CENTER COLUMN (4 Cols): Video Preview Player */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Film className="w-4 h-4 text-cyan-600" /> Reference Footage
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Video Viewport */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center">
              <video
                ref={videoRef}
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration || 184);
                }}
                className="w-full h-full object-contain"
                muted={isMuted}
              />

              {/* Center Play Overlay */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35 transition-colors group cursor-pointer"
                aria-label="Play or Pause"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </div>
              </button>
            </div>

            {/* Scrubber Bar */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>00:00.0</span>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" size="sm" onClick={togglePlay}>
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
                  aria-label="Toggle mute"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => seekTo(0)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Restart
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
            Source: <span className="font-semibold text-slate-800">A-Roll_Interview_4K.mp4 (4K 60fps)</span>
          </div>
        </div>

        {/* RIGHT COLUMN (4 Cols): AI Analysis & Matched Sections */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" /> {t('scriptToVideo.matchedFootage')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Verified
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {(matchData?.matchedFootage || []).map((match) => {
                const isSelected = activeSegmentId === match.scriptSegmentId;

                return (
                  <div
                    key={match.id}
                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-400 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{match.assetName}</div>
                        <div className="text-[11px] font-mono text-blue-700 mt-0.5 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatTime(match.startTime)} – {formatTime(match.endTime)}
                          </span>
                        </div>
                      </div>

                      {/* Display confidence ONLY if backend provides it */}
                      {match.confidence !== undefined && (
                        <Badge variant="success" size="sm">
                          {Math.round(match.confidence * 100)}% {t('scriptToVideo.confidence')}
                        </Badge>
                      )}
                    </div>

                    {match.matchedKeywords && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {match.matchedKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Decision Actions */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant={match.status === 'accepted' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() =>
                            updateMatchMutation.mutate({ matchId: match.id, status: 'accepted' })
                          }
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          {t('scriptToVideo.acceptMatch')}
                        </Button>
                        <Button
                          variant={match.status === 'rejected' ? 'danger' : 'ghost'}
                          size="sm"
                          onClick={() =>
                            updateMatchMutation.mutate({ matchId: match.id, status: 'rejected' })
                          }
                          leftIcon={<X className="w-3.5 h-3.5" />}
                        >
                          {t('scriptToVideo.rejectMatch')}
                        </Button>
                      </div>

                      <button
                        onClick={() => {
                          setAdjustingMatch(match);
                          setAdjustStart(match.startTime);
                          setAdjustEnd(match.endTime);
                        }}
                        className="text-slate-500 hover:text-slate-900 p-1 text-xs flex items-center gap-1 cursor-pointer"
                        title={t('scriptToVideo.adjustTimestamps')}
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>Adjust</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Matches: {matchData?.totalMatches || 3}</span>
            <span className="text-emerald-700 font-mono font-medium">Ready to Render</span>
          </div>
        </div>
      </div>

      {/* Manual Adjust Match Modal */}
      {adjustingMatch && (
        <Modal
          isOpen={!!adjustingMatch}
          onClose={() => setAdjustingMatch(null)}
          title={t('scriptToVideo.adjustTimestamps')}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('common.startTimeSec')}
                type="number"
                step="0.1"
                value={adjustStart}
                onChange={(e) => setAdjustStart(parseFloat(e.target.value) || 0)}
              />
              <Input
                label={t('common.endTimeSec')}
                type="number"
                step="0.1"
                value={adjustEnd}
                onChange={(e) => setAdjustEnd(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Calculated segment duration: {(adjustEnd - adjustStart).toFixed(1)}s
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setAdjustingMatch(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  updateMatchMutation.mutate({
                    matchId: adjustingMatch.id,
                    status: 'manual_adjusted',
                    adjustments: { startTime: adjustStart, endTime: adjustEnd },
                  })
                }
              >
                {t('common.apply')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default ScriptToVideoPage;
