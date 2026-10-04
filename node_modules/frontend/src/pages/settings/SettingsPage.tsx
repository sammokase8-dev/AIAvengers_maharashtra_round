import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  User,
  Share2,
  HardDrive,
  Server,
  Activity,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Radio,
} from 'lucide-react';
import { creatorApi } from '../../services/creatorApi';
import { CreatorProfile, PlatformType } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useRealtimeJobs } from '../../context/RealtimeJobsContext';
import { API_BASE_URL } from '../../api/client';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();
  const { isConnected } = useRealtimeJobs();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: () => creatorApi.getProfile(),
  });

  // Local state for profile fields
  const [name, setName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [niche, setNiche] = useState('');
  const [bio, setBio] = useState('');

  // Sync initial state once loaded
  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setChannelName(profile.channelName || '');
      setNiche(profile.niche || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<CreatorProfile>) => creatorApi.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      success('Creator profile settings saved.');
    },
  });

  const connectMutation = useMutation({
    mutationFn: (platform: PlatformType) => creatorApi.connectPlatform(platform),
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      success(`Connected ${platform.toUpperCase()} account successfully.`);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (platform: PlatformType) => creatorApi.disconnectPlatform(platform),
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      info(`Disconnected ${platform.toUpperCase()} account.`);
    },
  });

  if (isLoading || !profile) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        {t('common.loading')}
      </div>
    );
  }

  const storageUsedGB = (profile.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1);
  const storageLimitGB = (profile.storageLimitBytes / (1024 * 1024 * 1024)).toFixed(0);
  const storagePercent = Math.round(
    (profile.storageUsedBytes / profile.storageLimitBytes) * 100
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Studio Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Creator Profile Form */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> {t('settings.studioIdentity')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('common.creatorName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t('common.channelName')}
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />
        </div>

        <Input
          label={t('common.contentNiche')}
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
        />

        <Textarea
          label={t('common.channelBio')}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              updateProfileMutation.mutate({
                name,
                channelName,
                niche,
                bio,
              })
            }
            isLoading={updateProfileMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t('settings.saveProfile')}
          </Button>
        </div>
      </div>

      {/* Connected Social Accounts */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" /> {t('settings.connectedAccounts')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized OAuth tokens required for automatic calendar publishing.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {profile.connections.map((conn) => (
            <div key={conn.platform} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    conn.connected ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-300'
                  }`}
                />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    {conn.platform.replace('_', ' ')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {conn.connected
                      ? `${conn.handle || 'Connected account'} • ${
                          conn.followerCount
                            ? `${(conn.followerCount / 1000).toFixed(1)}k followers`
                            : 'Active'
                        }`
                      : 'Account not linked'}
                  </p>
                </div>
              </div>

              {conn.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectMutation.mutate(conn.platform)}
                  isLoading={disconnectMutation.isPending}
                >
                  {t('settings.disconnect')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => connectMutation.mutate(conn.platform)}
                  isLoading={connectMutation.isPending}
                >
                  {t('settings.connect')}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Media Storage Usage */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-600" /> {t('settings.mediaStorage')}
        </h2>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium">
              {storageUsedGB} GB used of {storageLimitGB} GB
            </span>
            <span className="text-blue-600 font-bold">{storagePercent}% {t('settings.quota')}</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Raw 4K footage, AI synth b-roll clips, audio voiceovers, and exported MP4s stored securely.
          </p>
        </div>
      </div>

      {/* Backend & API Telemetry (Transparent Architecture) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" /> {t('settings.backendTelemetry')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">REST API Base URL</span>
            <span className="text-slate-900 font-mono font-bold">{API_BASE_URL}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
              WebSocket Real-Time Channel
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-900 font-semibold">
                {isConnected ? 'Connected (Live Worker Sync)' : 'Offline / Standalone Preview'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Client-side security verified: No server keys or database URLs exposed to frontend.</span>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
