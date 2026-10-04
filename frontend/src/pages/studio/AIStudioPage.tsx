import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Save,
  Wand2,
  Clock,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Share2,
  Minimize2,
  MessageSquare,
} from 'lucide-react';
import { aiApi } from '../../services/aiApi';
import { AIOperationType, ToneType, PlatformType, AIGeneratedContent } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AIProcessingModal from '../../components/common/AIProcessingModal';

const OPERATIONS: Array<{ type: AIOperationType; label: string; desc: string }> = [
  { type: 'idea', label: 'Generate Idea', desc: 'High-concept angles & audience hooks' },
  { type: 'hook', label: 'Generate Hook', desc: 'First 3-5s retention formulations' },
  { type: 'script', label: 'Generate Script', desc: 'Full conversational audio/visual screenplay' },
  { type: 'caption', label: 'Generate Caption', desc: 'Optimized social copy with hashtags' },
  { type: 'cta', label: 'Generate CTA', desc: 'Conversion calls & comment magnets' },
  { type: 'plan', label: 'Content Plan', desc: 'Multi-day content sprint roadmap' },
  { type: 'repurpose', label: 'Repurpose', desc: 'Adapt existing long-form into bite-sized clips' },
];

const TONES: Array<{ type: ToneType; label: string }> = [
  { type: 'viral', label: 'Viral & Punchy' },
  { type: 'authoritative', label: 'Authoritative' },
  { type: 'storyteller', label: 'Narrative Storyteller' },
  { type: 'educational', label: 'Educational / Technical' },
  { type: 'conversational', label: 'Casual / Friendly' },
  { type: 'humorous', label: 'Witty / Humorous' },
];

const PLATFORMS: Array<{ type: PlatformType; label: string }> = [
  { type: 'youtube', label: 'YouTube Long' },
  { type: 'youtube_shorts', label: 'Shorts (9:16)' },
  { type: 'instagram_reels', label: 'Reels (9:16)' },
  { type: 'tiktok', label: 'TikTok (9:16)' },
  { type: 'linkedin', label: 'LinkedIn Post' },
  { type: 'x', label: 'X / Twitter' },
];

export const AIStudioPage: React.FC = () => {
  const { t } = useTranslation();
  const { success, info, error: toastError } = useToast();

  // Input states
  const [prompt, setPrompt] = useState('Why modern software engineers should treat content like system architecture');
  const [selectedOperation, setSelectedOperation] = useState<AIOperationType>('script');
  const [selectedTone, setSelectedTone] = useState<ToneType>('viral');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('youtube');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Editable output fields
  const [hook, setHook] = useState(
    '99% of creators build their audience completely backwards — here is the 3-step formula that changed everything.'
  );
  const [script, setScript] = useState(
    `[Scene 1: Talking Head - Direct to camera]\n99% of creators build their audience completely backwards — here is the 3-step formula that changed everything.\n\n[Scene 2: Screen share / Graphic demonstration]\nMost creators waste 70% of their energy manually scrubbing footage, writing subtitles from scratch, and exporting 7 different aspect ratios. But when you unify your assets with an intelligent timeline, the edit creates itself.\n\n[Scene 3: Studio B-Roll]\nNotice how the transition snaps precisely to the audio cadence. You keep 100% editorial control while the AI automates the tedious friction.\n\n[Scene 4: Call to action]\nIf you want to operate like an engineering team instead of an exhausted one-person studio, follow for the complete breakdown.`
  );
  const [caption, setCaption] = useState(
    `Stop editing like it's 2022. The unified creator stack is here. Breakdown of the new AI-assisted pipeline in the video. 🚀 Drop a comment if you want the checklist! #CreatorOps #AIEditing #ContentCreation #VideoProduction`
  );
  const [cta, setCta] = useState(
    "Comment 'WORKFLOW' below to get our private production checklist and timeline presets."
  );

  // Calculate speaking duration (~140 words per minute)
  const totalWords = (hook + ' ' + script).trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.max(5, Math.round((totalWords / 140) * 60));

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toastError('Please enter a creation topic or prompt.');
      return;
    }

    setIsGenerating(true);
    setShowProcessingModal(true);
    setProcessingStepIndex(0);
    // Progress through realistic stages
    const stepTimer1 = setTimeout(() => setProcessingStepIndex(1), 600);
    const stepTimer2 = setTimeout(() => setProcessingStepIndex(2), 1200);
    const stepTimer3 = setTimeout(() => setProcessingStepIndex(3), 1800);

    try {
      const result: AIGeneratedContent = await aiApi.generateContent({
        operation: selectedOperation,
        prompt,
        tone: selectedTone,
        targetPlatform: selectedPlatform,
      });

      if (result.hook) setHook(result.hook);
      if (result.script) setScript(result.script);
      if (result.caption) setCaption(result.caption);
      if (result.cta) setCta(result.cta);
      if (result.isDemoData) {
        info(result.demoNotice || 'DEMO OUTPUT — add GEMINI_API_KEY for live Gemini generation.');
      }

      setTimeout(() => {
        setShowProcessingModal(false);
        if (!result.isDemoData) {
          success('Content generated successfully using Gemini.', t('common.success'));
        }
      }, 2200);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setShowProcessingModal(false);
      toastError(err.message || 'Generation failed. Try another prompt.', t('common.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTransform = async (action: 'improve' | 'shorten' | 'change_tone' | 'adapt_platform') => {
    setIsGenerating(true);
    try {
      const transformed = await aiApi.transformContent({
        contentId: 'cur_studio',
        content: script,
        action,
        targetTone: selectedTone,
        targetPlatform: selectedPlatform,
      });

      if (transformed.hook) setHook(transformed.hook);
      if (transformed.script) setScript(transformed.script);
      if (transformed.caption) setCaption(transformed.caption);
      if (transformed.cta) setCta(transformed.cta);
      if (transformed.isDemoData) {
        info('DEMO TRANSFORMATION — add GEMINI_API_KEY for Gemini-powered editing.');
      }

      info(`Applied transformation: ${action.replace('_', ' ')}`);
    } catch (err: any) {
      toastError(err.message || 'Transform operation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    info(`Copied ${fieldName} to clipboard`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Creative Synthesis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{t('studio.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('studio.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink to="/script-to-video">
            <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t('studio.proceedToVideo')}
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Main Studio Workspace: 2-Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Prompt Controls & Options */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Prompt Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>{t('studio.promptLabel')}</span>
                <span className="text-blue-600 font-sans normal-case text-xs font-medium">Workspace</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder={t('studio.promptPlaceholder')}
                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Mode selection buttons */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block mb-2">
                {t('studio.outputMode')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OPERATIONS.map((op) => (
                  <button
                    key={op.type}
                    onClick={() => setSelectedOperation(op.type)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedOperation === op.type
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-semibold">{op.label}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{op.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone & Platform Selectors */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block mb-1.5">
                  {t('studio.toneOfVoice')}
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as ToneType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {TONES.map((tone) => (
                    <option key={tone.type} value={tone.type}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block mb-1.5">
                  {t('studio.targetPlatform')}
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as PlatformType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {PLATFORMS.map((platform) => (
                    <option key={platform.type} value={platform.type}>
                      {platform.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              onClick={handleGenerate}
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {isGenerating ? t('studio.generating') : t('studio.generateButton')}
            </Button>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs text-slate-600 font-mono shadow-2xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Est. Duration: ~{estimatedSeconds}s</span>
            </div>
            <div className="text-slate-500">Total Words: {totalWords}</div>
          </div>
        </div>

        {/* Right Column (7 Cols): Editable Output Editor */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Transform Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <span className="text-xs font-semibold text-slate-700 font-mono">Transform Actions</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTransform('improve')}
                disabled={isGenerating}
                leftIcon={<Wand2 className="w-3.5 h-3.5 text-blue-600" />}
              >
                {t('studio.improve')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTransform('shorten')}
                disabled={isGenerating}
                leftIcon={<Minimize2 className="w-3.5 h-3.5 text-cyan-600" />}
              >
                {t('studio.shorten')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTransform('change_tone')}
                disabled={isGenerating}
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />}
              >
                {t('studio.changeTone')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTransform('adapt_platform')}
                disabled={isGenerating}
                leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-600" />}
              >
                {t('studio.adaptPlatform')}
              </Button>
            </div>
          </div>

          {/* Editable Field 1: Hook */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> {t('studio.hookLabel')}
              </label>
              <button
                onClick={() => copyToClipboard(hook, 'Hook')}
                className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'Hook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'Hook' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-sans leading-relaxed resize-y"
            />
          </div>

          {/* Editable Field 2: Script Body */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> {t('studio.scriptLabel')}
              </label>
              <button
                onClick={() => copyToClipboard(script, 'Script')}
                className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'Script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'Script' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono leading-relaxed resize-y"
            />
          </div>

          {/* Editable Field 3: Caption & Hashtags */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-600" /> {t('studio.captionLabel')}
              </label>
              <button
                onClick={() => copyToClipboard(caption, 'Caption')}
                className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'Caption' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'Caption' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white leading-relaxed resize-y"
            />
          </div>

          {/* Editable Field 4: Call to Action (CTA) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> {t('studio.ctaLabel')}
              </label>
              <button
                onClick={() => copyToClipboard(cta, 'CTA')}
                className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'CTA' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'CTA' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Save to Project & Export */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                success('Saved content draft to project library', t('common.success'));
              }}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {t('studio.saveDraft')}
            </Button>
            <NavLink to="/script-to-video">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                {t('studio.proceedToVideo')}
              </Button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* AI Multistep Processing Modal */}
      <AIProcessingModal
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        currentStepIndex={processingStepIndex}
      />
    </div>
  );
};
export default AIStudioPage;
