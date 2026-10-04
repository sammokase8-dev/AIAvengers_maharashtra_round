import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Target,
  Tv,
  MessageSquare,
  Users,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../context/ToastContext';

export const OnboardingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { success } = useToast();
  const [step, setStep] = useState(1);

  // Form states
  const [creatorName, setCreatorName] = useState('Alex Rivera');
  const [channelNiche, setChannelNiche] = useState('AI & Creative Tech');
  const [targetAudience, setTargetAudience] = useState('Developers, Founders, and Creators');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['YouTube', 'Instagram Reels']);
  const [primaryGoal, setPrimaryGoal] = useState('Scale short-form repurposing 5x');
  const [brandVoice, setBrandVoice] = useState('Authoritative, conversational, and direct');

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleFinish = () => {
    try {
      localStorage.setItem(
        'creatorai_onboarding_profile',
        JSON.stringify({
          creatorName,
          channelNiche,
          targetAudience,
          selectedPlatforms,
          primaryGoal,
          brandVoice,
        })
      );
    } catch {
      // ignore
    }
    success('Workspace calibrated with your studio preferences!', 'Setup Complete');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('onboarding.title')}
      description={t('onboarding.subtitle')}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
          <span>
            {t('common.step')} {step} {t('common.of')} 7
          </span>
          <span className="text-blue-600 font-semibold">{Math.round((step / 7) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* Step 1: Creator Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">1. Creator Profile Information</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tell us your display name and brand identity so your assets and scripts match your persona.
            </p>
            <Input
              label="Creator or Brand Name"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. Alex Rivera or Studio 42"
            />
          </div>
        )}

        {/* Step 2: Content Niche */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">2. Primary Content Niche</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              What domain or industry does your media operation focus on?
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['AI & Engineering', 'Software & Dev', 'Business & Startups', 'Design & Creative', 'Finance & Markets', 'Health & Productivity'].map(
                (n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setChannelNiche(n)}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      channelNiche === n
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Step 3: Target Audience */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">3. Target Audience</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Who is watching, reading, or listening to your published content?
            </p>
            <Input
              label="Audience Demographic / Persona"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Senior engineers, tech enthusiasts, creative founders"
            />
          </div>
        )}

        {/* Step 4: Content Platforms */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">4. Core Distribution Platforms</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select the primary platforms you publish to.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['YouTube', 'YouTube Shorts', 'Instagram Reels', 'TikTok', 'LinkedIn', 'X (Twitter)'].map((p) => {
                const isSelected = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{p}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Growth Goals */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">5. Primary Growth Goal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              What is your primary focus for content operations this quarter?
            </p>
            <div className="space-y-2 text-xs">
              {[
                'Repurpose long-form video into 10+ vertical clips per episode',
                'Accelerate scriptwriting cadence without sacrificing technical depth',
                'Standardize multi-platform publishing into a single schedule',
                'Improve viewer retention through hook optimization',
              ].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPrimaryGoal(g)}
                  className={`w-full p-3 rounded-xl border text-left font-medium transition-all ${
                    primaryGoal === g
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Brand Voice */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">6. Brand Voice & Cadence</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              How should the AI script assistant tone be calibrated?
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { title: 'Authoritative', desc: 'Direct, clear, backed by data' },
                { title: 'Conversational', desc: 'Friendly, relatable, candid' },
                { title: 'Viral / Punchy', desc: 'Fast-paced, high curiosity hooks' },
                { title: 'Technical', desc: 'Precise, architectural, deep-dive' },
              ].map((v) => (
                <button
                  key={v.title}
                  type="button"
                  onClick={() => setBrandVoice(v.title)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    brandVoice.includes(v.title)
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">{v.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Complete */}
        {step === 7 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Your Studio Workspace is Ready</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              We have configured your project presets, platform formats, and AI assistance criteria for{' '}
              <strong className="text-slate-800">{creatorName}</strong> ({channelNiche}).
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono text-left max-w-sm mx-auto">
              <div>• Niche: {channelNiche}</div>
              <div>• Voice: {brandVoice}</div>
              <div>• Platforms: {selectedPlatforms.join(', ')}</div>
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 && step < 7 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              {t('onboarding.back')}
            </Button>
          ) : (
            <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">
              {t('onboarding.skip')}
            </button>
          )}

          {step < 7 ? (
            <Button variant="primary" size="sm" onClick={() => setStep(step + 1)} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              {t('onboarding.next')}
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={handleFinish} rightIcon={<Sparkles className="w-3.5 h-3.5" />}>
              {t('onboarding.finish')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
export default OnboardingModal;
