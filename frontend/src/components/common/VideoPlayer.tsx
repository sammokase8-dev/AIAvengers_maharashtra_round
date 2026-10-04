import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showCustomControls?: boolean;
  className?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  aspectRatio = '16:9',
  autoPlay = false,
  loop = false,
  muted = false,
  showCustomControls = true,
  className = '',
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Fallback video source if remote video is unavailable
  const effectiveSrc = videoError ? '/media/demo_main.mp4' : src || '/media/demo_main.mp4';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration || 0);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      console.warn(`[VideoPlayer] Failed to load ${src}, falling back to local demo media.`);
      setVideoError(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [src, onTimeUpdate]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Auto-play policy blocked, mute and retry
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const aspectClass =
    aspectRatio === '9:16'
      ? 'aspect-[9/16] max-w-[320px] mx-auto'
      : aspectRatio === '1:1'
      ? 'aspect-square max-w-[480px] mx-auto'
      : aspectRatio === '4:5'
      ? 'aspect-[4/5] max-w-[380px] mx-auto'
      : 'aspect-video w-full';

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className={`relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md group ${aspectClass} ${className}`}
    >
      <video
        ref={videoRef}
        src={effectiveSrc}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        className="w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
      />

      {/* Center Play Overlay when paused */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] transition-opacity cursor-pointer z-10"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
            <Play className="w-6 h-6 ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Title bar on top */}
      {title && (
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-slate-950/80 to-transparent flex items-center justify-between text-xs text-white z-20 pointer-events-none">
          <span className="font-semibold truncate max-w-[80%]">{title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
            {aspectRatio}
          </span>
        </div>
      )}

      {/* Floating Video Controls Bar */}
      {showCustomControls && (
        <div
          className={`absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent transition-opacity duration-200 z-20 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress scrubber */}
          <div className="relative mb-2 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500 hidden sm:block"
                />
              </div>

              <span className="text-[11px] font-mono text-slate-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
