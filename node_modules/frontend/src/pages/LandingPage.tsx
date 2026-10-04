import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  ArrowRight,
  Lightbulb,
  FileText,
  Video,
  Film,
  Scissors,
  Share2,
  BarChart3,
  Sliders,
  CheckCircle,
  Play,
  Monitor,
  Smartphone,
  Layers,
  Database,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  FolderOpen,
  Wand2,
  Clock,
  TrendingUp,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import VideoPlayer from '../components/common/VideoPlayer';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(3); // default on EDIT

  const workflowSteps = [
    { id: 0, key: 'idea', icon: Lightbulb, title: t('common.idea'), desc: t('landing.section3Subtitle') },
    { id: 1, key: 'script', icon: FileText, title: t('workspace.tabs.script'), desc: t('landing.section4Subtitle') },
    { id: 2, key: 'record', icon: Video, title: t('common.upload'), desc: t('landing.section2Subtitle') },
    { id: 3, key: 'edit', icon: Film, title: t('common.editing'), desc: t('landing.section6Subtitle') },
    { id: 4, key: 'repurpose', icon: Scissors, title: t('clips.title'), desc: t('landing.section5Subtitle') },
    { id: 5, key: 'publish', icon: Share2, title: t('common.published'), desc: t('landing.section7Subtitle') },
    { id: 6, key: 'analyze', icon: BarChart3, title: t('nav.analytics'), desc: t('landing.section8Subtitle') },
  ];

  return (
    <div className="bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* ------------------------------------------------------------ */}
      {/* HERO SECTION (Light & Professional with Real Media Overlay) */}
      {/* ------------------------------------------------------------ */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('landing.heroBadge')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
            {t('landing.heroTitle')}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            {t('landing.heroSubtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <NavLink to="/register">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                {t('landing.startCreating')}
              </Button>
            </NavLink>
            <a href="#workflow">
              <Button variant="secondary" size="lg" leftIcon={<Play className="w-4 h-4 text-blue-600" />}>
                {t('landing.explorePlatform')}
              </Button>
            </a>
          </div>

          {/* Trust Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 pt-8 border-t border-slate-200 text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-2xl font-bold text-slate-900 font-mono">{t('landing.statsStudio')}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t('landing.statsStudioDesc')}</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-2xl font-bold text-blue-600 font-mono">{t('landing.statsEditable')}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t('landing.statsEditableDesc')}</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-2xl font-bold text-slate-900 font-mono">{t('landing.statsPlatforms')}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t('landing.statsPlatformsDesc')}</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-2xl font-bold text-emerald-600 font-mono">{t('landing.statsRealtime')}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t('landing.statsRealtimeDesc')}</div>
            </div>
          </div>
        </div>

        {/* Real Product Dashboard & Video Editor Preview */}
        <div className="mt-14 rounded-2xl border border-slate-300 bg-white shadow-2xl p-2 sm:p-4 overflow-hidden relative">
          <div className="h-10 bg-slate-100 rounded-t-xl flex items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-slate-500 ml-2">creatorai.studio/workspace/production-pipeline</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('landing.demoBadge')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-50">
            {/* Left 4 Cols: Script & Footage Semantic Alignment */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">{t('nav.scriptToVideo')}</span>
                  <Badge variant="success" size="sm">94% {t('common.confidence')}</Badge>
                </div>
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-slate-800">
                    <p className="font-semibold text-slate-900 leading-snug">
                      "Artificial intelligence is fundamentally changing how creators produce video..."
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-blue-700">
                      <span>00:00 - 00:04</span>
                      <span className="text-emerald-700 font-bold">{t('common.matched')} ✓</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                    <p className="leading-snug">
                      "Instead of manual scrubbing, timeline operations stay non-destructive."
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>B-Roll: Studio Setup</span>
                      <span>00:04 - 00:08</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex items-center gap-2 font-mono">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('common.nonDestructiveModel')}</span>
              </div>
            </div>

            {/* Center 5 Cols: Real HTML5 Video Player */}
            <div className="lg:col-span-5 flex flex-col">
              <VideoPlayer
                src="/media/demo_main.mp4"
                poster="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80"
                title="Episode 42: Master Take (UHD)"
                aspectRatio="16:9"
                showCustomControls={true}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
                <span>{t('common.formatUHD')}</span>
                <span className="text-emerald-600 font-semibold">{t('common.nativeFFmpeg')}</span>
              </div>
            </div>

            {/* Right 3 Cols: Automated Viral Clips */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">{t('nav.clipGenerator')}</span>
                  <Badge variant="purple" size="sm">9:16 Vertical</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-900">Clip #1: The Uncomfortable Truth</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500 font-mono">00:00 - 00:08</span>
                      <Badge variant="success" size="sm">Score 95</Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-900">Clip #2: Non-Destructive Wins</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500 font-mono">00:08 - 00:12</span>
                      <Badge variant="primary" size="sm">Score 89</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <NavLink to="/clips" className="text-xs text-blue-600 hover:text-blue-700 font-semibold pt-3 border-t border-slate-100 flex items-center justify-between">
                <span>{t('clips.title')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 1: THE 7-STAGE CREATOR WORKFLOW (Interactive) */}
      {/* ------------------------------------------------------------ */}
      <section id="workflow" className="py-20 bg-white border-y border-slate-200 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
              {t('landing.workflowTitle')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              {t('landing.section1Title')}
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {t('landing.workflowSubtitle')}
            </p>
          </div>

          {/* Interactive Steps Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-8">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              const isActive = activeWorkflowStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveWorkflowStep(step.id)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold font-mono tracking-wider">{step.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Step Details */}
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 max-w-4xl mx-auto shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono text-blue-600 font-semibold">{t('common.step')} 0{activeWorkflowStep + 1} {t('common.of')} 07</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {workflowSteps[activeWorkflowStep].title}: {workflowSteps[activeWorkflowStep].desc}
                </h3>
              </div>
              <NavLink to="/dashboard">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  {t('landing.exploreStudio')}
                </Button>
              </NavLink>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-xs text-slate-600">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> {t('landing.operationalEfficiency')}
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  {t('landing.operationalEfficiencyDesc')}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> {t('landing.bidirectionalMemory')}
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  {t('landing.bidirectionalMemoryDesc')}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> {t('landing.nonDestructiveArchitecture')}
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  {t('landing.nonDestructiveArchitectureDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 2: ASSET MANAGEMENT (Real Media Grid) */}
      {/* ------------------------------------------------------------ */}
      <section id="assets" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
              {t('nav.assets')}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              {t('landing.section2Title')}
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-xl">
              {t('landing.section2Subtitle')}
            </p>
          </div>
          <NavLink to="/assets">
            <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t('common.viewAll')}
            </Button>
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: 4K Master Video */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80"
                alt="A-Roll Take"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-white">
                00:12.3
              </span>
              <Badge variant="primary" size="sm" className="absolute top-2 left-2">
                4K VIDEO
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-900 truncate">Episode 42: Master Studio Take</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-1">1920x1080 • 30fps • MP4</p>
            </div>
          </div>

          {/* Card 2: Studio B-Roll */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80"
                alt="B-Roll Setup"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-white">
                00:15.0
              </span>
              <Badge variant="success" size="sm" className="absolute top-2 left-2">
                B-ROLL
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-900 truncate">Studio Hardware & Workspace</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-1">1920x1080 • 60fps • MP4</p>
            </div>
          </div>

          {/* Card 3: High-Retention Thumbnail */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                alt="Thumbnail Asset"
                className="w-full h-full object-cover"
              />
              <Badge variant="purple" size="sm" className="absolute top-2 left-2">
                THUMBNAIL
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-900 truncate">YouTube High-CTR Master Cover</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-1">1280x720 • JPEG</p>
            </div>
          </div>

          {/* Card 4: Audio Voiceover Stem */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <Badge variant="info" size="sm">AUDIO STEM</Badge>
              </div>
              <h3 className="text-xs font-semibold text-slate-900">Studio Voiceover Track (Master)</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-1">48 kHz • 24-bit Stereo WAV</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Duration: 03:24</span>
              <span className="text-emerald-600 font-semibold">Normalized -14 LUFS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 3: AI STUDIO (Interactive Workspace Preview) */}
      {/* ------------------------------------------------------------ */}
      <section id="studio" className="py-20 bg-slate-100/70 border-y border-slate-200 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
              {t('nav.aiStudio')}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              {t('landing.section3Title')}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {t('landing.section3Subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-800">{t('studio.promptLabel')}</span>
                <span className="text-[11px] font-mono text-blue-600">Gemini 1.5 Flash</span>
              </div>
              <div className="mt-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">Thesis / Concept:</p>
                  "Why creators should stop manual scrubbing and switch to non-destructive timeline architectures in 2026."
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">{t('studio.outputMode')}</span>
                    <div className="mt-1 p-2 rounded-lg bg-slate-50 border border-slate-200 font-medium">
                      Script & Hook Breakdown
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">{t('studio.toneOfVoice')}</span>
                    <div className="mt-1 p-2 rounded-lg bg-slate-50 border border-slate-200 font-medium text-blue-600">
                      Conversational & Punchy
                    </div>
                  </div>
                </div>
                <NavLink to="/ai-studio">
                  <Button variant="primary" size="md" className="w-full mt-2" leftIcon={<Wand2 className="w-4 h-4" />}>
                    {t('studio.generateButton')}
                  </Button>
                </NavLink>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-800">{t('studio.hookLabel')}</span>
                <Badge variant="success" size="sm">Score 95</Badge>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                "If you are still cutting podcasts and b-roll by hand, you are wasting 80% of your production time."
              </p>
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-800">{t('studio.scriptLabel')}</span>
                <div className="mt-2 space-y-2 text-xs text-slate-600">
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-mono text-blue-600 font-semibold">[00:00 - 00:04 Hook]:</span> Artificial intelligence is fundamentally changing how creators produce video.
                  </p>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-mono text-blue-600 font-semibold">[00:04 - 00:08 Problem]:</span> Every day, teams scrub through hours of footage looking for that one single soundbite.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm">{t('studio.shorten')}</Button>
                <Button variant="outline" size="sm">{t('studio.improve')}</Button>
                <Button variant="outline" size="sm">{t('studio.changeTone')}</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 4: SCRIPT-TO-VIDEO UNDERSTANDING */}
      {/* ------------------------------------------------------------ */}
      <section id="script-to-video" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
            {t('nav.scriptToVideo')}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
            {t('landing.section4Title')}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {t('landing.section4Subtitle')}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-mono text-slate-500 uppercase">Input Script</span>
              <p className="mt-2 text-xs font-medium text-slate-900 leading-relaxed">
                "Artificial intelligence is fundamentally changing how creators produce video..."
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
              <span className="text-xs font-mono text-blue-600 uppercase">Matched Footage Segment</span>
              <p className="mt-2 text-xs font-bold text-slate-900">
                Episode 42: Master Studio Take
              </p>
              <div className="mt-2 flex items-center justify-between text-xs font-mono text-blue-700">
                <span>00:00 — 00:04</span>
                <span className="font-bold text-emerald-700">98% {t('common.confidence')}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-mono text-slate-500 uppercase">Creator Review Actions</span>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="primary" size="sm">{t('scriptToVideo.accept')}</Button>
                <Button variant="outline" size="sm">{t('scriptToVideo.adjust')}</Button>
                <Button variant="secondary" size="sm">{t('scriptToVideo.reject')}</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 5 & 6: DARK STUDIO SECTION (Editor & Non-Destructive Timeline) */}
      {/* ------------------------------------------------------------ */}
      <section id="editor-timeline" className="py-24 bg-slate-950 text-white px-6 lg:px-12 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-bold">
              {t('landing.section6Title')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              {t('landing.nonDestructiveTitle')}
            </h2>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              {t('landing.nonDestructiveSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 5 Cols: Video Player & Aspect Ratio Controls */}
            <div className="lg:col-span-5 space-y-4">
              <VideoPlayer
                src="/media/demo_main.mp4"
                poster="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80"
                title="Episode 42: Master Timeline Cut"
                aspectRatio="16:9"
                showCustomControls={true}
              />
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                <span>{t('editor.aspectRatio')}: 16:9 UHD</span>
                <span className="text-blue-400 font-semibold">{t('common.nativeFFmpeg')}</span>
              </div>
            </div>

            {/* Right 7 Cols: Structured Timeline Track Visualization */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-mono text-slate-300 font-semibold">{t('editor.title')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 border border-blue-700 text-blue-300">
                    Track 0: Primary Video
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700 text-emerald-300">
                    Track 1: Captions
                  </span>
                </div>
              </div>

              {/* Timeline Track 0: Video Clips */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400">{t('editor.videoTrack')}</span>
                <div className="h-12 bg-slate-950 rounded-lg p-1.5 flex items-center gap-2 border border-slate-800">
                  <div className="h-full flex-1 bg-blue-600/30 border border-blue-500 rounded px-2 flex items-center justify-between text-[11px] font-mono text-blue-200">
                    <span>Take 1 (00:00 - 00:08)</span>
                    <span className="text-[10px] text-blue-400">Vol: 100%</span>
                  </div>
                  <div className="h-full w-1/3 bg-blue-600/30 border border-blue-500 rounded px-2 flex items-center justify-between text-[11px] font-mono text-blue-200">
                    <span>Take 2 (00:08 - 00:12)</span>
                    <span className="text-[10px] text-blue-400">Vol: 100%</span>
                  </div>
                </div>
              </div>

              {/* Timeline Track 1: Captions */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400">{t('editor.captionsTrack')}</span>
                <div className="h-10 bg-slate-950 rounded-lg p-1.5 flex items-center gap-2 border border-slate-800">
                  <div className="h-full flex-1 bg-emerald-600/30 border border-emerald-500 rounded px-2 flex items-center text-[10px] font-mono text-emerald-200 truncate">
                    "Artificial intelligence is fundamentally changing how creators produce video."
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">{t('editor.split')}</Button>
                  <Button variant="outline" size="sm">{t('editor.nudge')}</Button>
                </div>
                <NavLink to="/editor">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    {t('landing.openEditor')}
                  </Button>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 7: MULTI-PLATFORM ADAPTATION */}
      {/* ------------------------------------------------------------ */}
      <section id="adaptation" className="py-20 bg-white border-b border-slate-200 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
              {t('landing.multiPlatformTitle')}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              {t('landing.section7Title')}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {t('landing.section7Subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">YouTube Long-Form</span>
                <Badge variant="primary" size="sm">{t('landing.aspectRatio169')}</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Chapters, rich description tags, and 4K UHD encoding.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">Reels & TikTok</span>
                <Badge variant="success" size="sm">{t('landing.aspectRatio916')}</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">High-contrast punchy subtitles with 1.2s opening momentum.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">LinkedIn Video</span>
                <Badge variant="purple" size="sm">{t('landing.aspectRatio11')}</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Professional thesis framing with written takeaways in description.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">X / Twitter</span>
                <Badge variant="info" size="sm">Thread & Video</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Bite-sized teaser video accompanied by high-value multi-tweet thread.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 8: CREATOR INTELLIGENCE & ANALYTICS */}
      {/* ------------------------------------------------------------ */}
      <section id="analytics" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
            {t('nav.intelligence')}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
            {t('landing.section8Title')}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {t('landing.section8Subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="success" size="sm">RETENTION</Badge>
              <span className="text-xs font-mono text-emerald-700 font-bold">+26% Lift</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Hook Retention On 9:16 Vertical Cuts</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Verbal curiosity hooks within the first 1.5 seconds drove 74% audience retention past the 15-second benchmark.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="warning" size="sm">TIMING</Badge>
              <span className="text-xs font-mono text-blue-600 font-bold">2.4x Velocity</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Optimal Publishing Cadence</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Simultaneous distribution across YouTube and LinkedIn at 14:00 UTC produced double the average discussion volume.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="info" size="sm">EFFICIENCY</Badge>
              <span className="text-xs font-mono text-cyan-700 font-bold">3 Potential Clips</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Untapped B-Roll Reuse</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              12 minutes of studio setup footage remains unused. Extracting 3 short clips can double weekly publishing output.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 9: FINAL CTA */}
      {/* ------------------------------------------------------------ */}
      <section className="py-20 px-6 lg:px-12 text-center max-w-5xl mx-auto">
        <div className="p-10 sm:p-14 rounded-3xl bg-white border border-slate-300 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('landing.section9Title')}
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto mt-4 leading-relaxed">
              {t('landing.section9Subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <NavLink to="/register">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {t('landing.startCreating')}
                </Button>
              </NavLink>
              <NavLink to="/dashboard">
                <Button variant="secondary" size="lg">
                  {t('landing.explorePlatform')}
                </Button>
              </NavLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
