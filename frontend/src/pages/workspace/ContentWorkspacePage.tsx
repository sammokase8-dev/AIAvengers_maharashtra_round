import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  FileText,
  Film,
  FolderOpen,
  Scissors,
  Share2,
  Send,
  BarChart3,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  Play,
  Calendar,
  CheckCircle,
  Clock,
  Settings2,
} from 'lucide-react';
import { contentApi } from '../../services/contentApi';
import { Project, ProjectStatus, PlatformType } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { SkeletonCard } from '../../components/common/SkeletonLoader';

type ProjectTab =
  | 'overview'
  | 'script'
  | 'assets'
  | 'timeline'
  | 'clips'
  | 'platforms'
  | 'publishing'
  | 'analytics';

export const ContentWorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // New project state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newNiche, setNewNiche] = useState('AI & Tech');

  // Load all projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => contentApi.getProjects(),
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>('prj_01');
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) =>
      contentApi.updateProject(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      success('Project status updated', t('common.success'));
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: Partial<Project>) => contentApi.createProject(data),
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProjectId(newProj.id);
      setIsNewProjectModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      success('Project created successfully', t('common.success'));
    },
  });

  if (isLoading || !currentProject) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <SkeletonCard />
      </div>
    );
  }

  const tabs: Array<{ id: ProjectTab; label: string; icon: any }> = [
    { id: 'overview', label: t('workspace.tabs.overview'), icon: Layers },
    { id: 'script', label: t('workspace.tabs.script'), icon: FileText },
    { id: 'assets', label: t('workspace.tabs.assets'), icon: FolderOpen },
    { id: 'timeline', label: t('workspace.tabs.timeline'), icon: Film },
    { id: 'clips', label: t('workspace.tabs.clips'), icon: Scissors },
    { id: 'platforms', label: t('workspace.tabs.platforms'), icon: Share2 },
    { id: 'publishing', label: t('workspace.tabs.publishing'), icon: Send },
    { id: 'analytics', label: t('workspace.tabs.analytics'), icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Project Selector & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Switcher Select */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-600"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={currentProject.status}
              onChange={(e) =>
                updateStatusMutation.mutate({
                  id: currentProject.id,
                  status: e.target.value as ProjectStatus,
                })
              }
              className="bg-blue-50 border border-blue-200 text-xs font-mono uppercase text-blue-700 font-semibold rounded-lg px-2.5 py-1"
            >
              {['idea', 'draft', 'editing', 'review', 'scheduled', 'published'].map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {currentProject.description || 'No description provided for this content project.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNewProjectModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Project
          </Button>
          <NavLink to="/editor">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Timeline Editor
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Relationship Graph Banner (Script + Footage + AI + Clips) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Operational Relationship Flow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center">
            <FileText className="w-5 h-5 text-blue-600 mb-1" />
            <span className="text-xs font-bold text-slate-900">1. {t('workspace.masterScript')}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">3 Timestamped Beats</span>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center">
            <Film className="w-5 h-5 text-cyan-600 mb-1" />
            <span className="text-xs font-bold text-slate-900">2. {t('workspace.rawFootage')}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">8 Ingested Takes</span>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center">
            <Sparkles className="w-5 h-5 text-purple-600 mb-1" />
            <span className="text-xs font-bold text-slate-900">3. {t('workspace.aiAnalysis')}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">94% Confidence Match</span>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center">
            <Scissors className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-xs font-bold text-slate-900">4. {t('workspace.generatedClips')}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">4 Vertical 9:16 Shorts</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900">Project Information</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500 font-medium">Niche:</span> {currentProject.niche}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Created:</span>{' '}
                    {new Date(currentProject.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Target Platforms:</span>{' '}
                    {currentProject.targetPlatforms.join(', ')}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Estimated Length:</span>{' '}
                    {Math.floor((currentProject.stats?.durationEstimate || 600) / 60)} minutes
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900">{t('workspace.checklistTitle')}</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Hook and core script written in AI Studio
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> 4K Raw A-Roll and Studio B-Roll synced
                  </div>
                  <div className="flex items-center gap-2 text-amber-700">
                    <Clock className="w-4 h-4 text-amber-600" /> Review matched AI edit points before final render
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400" /> Multi-platform captions & aspect ratio export
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Navigation</h3>
                <div className="space-y-2 text-xs">
                  <NavLink
                    to="/script-to-video"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    <span>Script-to-Video Match</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  </NavLink>
                  <NavLink
                    to="/editor"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    <span>Timeline Video Editor</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  </NavLink>
                  <NavLink
                    to="/clips"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    <span>Viral Clip Generator</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  </NavLink>
                  <NavLink
                    to="/adaptation"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    <span>Platform Adaptation</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'script' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Attached Production Script</h3>
              <NavLink to="/script-to-video">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Open Script Matcher
                </Button>
              </NavLink>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 space-y-3 leading-relaxed">
              <p>
                <strong className="text-amber-700">[Scene 1 - 00:03]:</strong> Artificial intelligence is
                fundamentally changing how creators produce video.
              </p>
              <p>
                <strong className="text-blue-700">[Scene 2 - 00:14]:</strong> Instead of manually cutting clips
                for 12 hours, you can link your script directly to the corresponding footage.
              </p>
              <p>
                <strong className="text-cyan-700">[Scene 3 - 00:45]:</strong> Let's see how this works in
                real-time.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Project Assets (Raw & B-Roll)</h3>
              <NavLink to="/assets">
                <Button variant="secondary" size="sm">
                  Manage in Asset Library
                </Button>
              </NavLink>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Film className="w-5 h-5 text-blue-600" />
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-slate-900 truncate">A-Roll_Interview_4K.mp4</p>
                  <p className="text-[10px] text-slate-500 font-mono">680 MB • 3m 4s • 4K UHD</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Film className="w-5 h-5 text-cyan-600" />
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-slate-900 truncate">B-Roll_Studio_Setup.mp4</p>
                  <p className="text-[10px] text-slate-500 font-mono">320 MB • 1m 32s • 1080p</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Film className="w-5 h-5 text-emerald-600" />
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-slate-900 truncate">Voiceover_Episode42.wav</p>
                  <p className="text-[10px] text-slate-500 font-mono">45 MB • 24-bit 48kHz</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
            <Film className="w-10 h-10 text-blue-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Browser-Based Non-Destructive Video Editor</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Trim, split, reposition text overlays, and style auto-synced captions. All edits remain structured
              data before sending to the backend renderer.
            </p>
            <NavLink to="/editor">
              <Button variant="primary" size="md">
                Launch Full Video Editor
              </Button>
            </NavLink>
          </div>
        )}

        {activeTab === 'clips' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
            <Scissors className="w-10 h-10 text-purple-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Automated Clip Generator</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Find transcript-based short-form candidates from complete spoken segments. Fit scores are heuristic, not predicted views.
            </p>
            <NavLink to="/clips">
              <Button variant="primary" size="md">
                Open Automated Clip Generator
              </Button>
            </NavLink>
          </div>
        )}

        {activeTab === 'platforms' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
            <Share2 className="w-10 h-10 text-cyan-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Multi-Platform Adaptation Suite</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Generate 16:9, 9:16, and 1:1 presets with custom titles, hashtags, and caption styles.
            </p>
            <NavLink to="/adaptation">
              <Button variant="primary" size="md">
                Configure Platform Adaptations
              </Button>
            </NavLink>
          </div>
        )}

        {activeTab === 'publishing' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
            <Send className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Publishing Schedule</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Schedule this content project to publish across your connected accounts.
            </p>
            <NavLink to="/publishing">
              <Button variant="primary" size="md">
                View Publishing Queue
              </Button>
            </NavLink>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
            <BarChart3 className="w-10 h-10 text-amber-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Content Performance Telemetry</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              View real-time views, viewer retention curves, and engagement breakdown.
            </p>
            <NavLink to="/analytics">
              <Button variant="primary" size="md">
                View Deep Analytics
              </Button>
            </NavLink>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title={t('common.createProject')}
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label={t('common.projectTitle')}
            placeholder={t('common.projectTitlePlaceholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            label={t('common.projectDesc')}
            placeholder={t('common.projectDescPlaceholder')}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={3}
          />
          <Input
            label={t('common.contentNiche')}
            placeholder={t('common.contentNichePlaceholder')}
            value={newNiche}
            onChange={(e) => setNewNiche(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsNewProjectModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newTitle.trim()}
              onClick={() =>
                createProjectMutation.mutate({
                  title: newTitle,
                  description: newDescription,
                  niche: newNiche,
                  targetPlatforms: ['youtube', 'youtube_shorts'],
                  status: 'idea',
                })
              }
            >
              {t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ContentWorkspacePage;
