import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FolderOpen,
  UploadCloud,
  Search,
  Filter,
  Star,
  Film,
  Image as ImageIcon,
  Music,
  FileText,
  Sparkles,
  Trash2,
  FolderInput,
  Edit2,
  MoreVertical,
  CheckSquare,
  Square,
  Play,
  Info,
  Clock,
  HardDrive,
  Maximize2,
  X,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
} from 'lucide-react';
import { assetsApi } from '../../services/assetsApi';
import { Asset, AssetType, VideoMetadata, ImageMetadata, AudioMetadata } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

type SortOption = 'newest' | 'oldest' | 'name' | 'size' | 'duration';

export const AssetLibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();

  // Filter & search states
  const [selectedType, setSelectedType] = useState<AssetType | 'all'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Preview & Modal states
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [renamingAsset, setRenamingAsset] = useState<Asset | null>(null);
  const [newName, setNewName] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string>('');

  // Queries
  const { data: rawAssets = [], isLoading: isAssetsLoading } = useQuery({
    queryKey: ['assets', selectedType, selectedFolderId, searchQuery, favoritesOnly],
    queryFn: () =>
      assetsApi.getAssets({
        type: selectedType === 'all' ? undefined : selectedType,
        folderId: selectedFolderId === 'all' ? undefined : selectedFolderId,
        search: searchQuery || undefined,
        favoriteOnly: favoritesOnly || undefined,
      }),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['asset-folders'],
    queryFn: () => assetsApi.getFolders(),
  });

  // Client-side sorting
  const assets = useMemo(() => {
    const list = [...rawAssets];
    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'size':
        return list.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
      case 'duration':
        return list.sort((a, b) => {
          const durA = (a.metadata as any)?.duration || 0;
          const durB = (b.metadata as any)?.duration || 0;
          return durB - durA;
        });
      default:
        return list;
    }
  }, [rawAssets, sortBy]);

  // Mutations
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => assetsApi.renameAsset(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      success('Asset renamed successfully', t('common.success'));
      setRenamingAsset(null);
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => assetsApi.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => assetsApi.deleteAssets(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      success(`Deleted ${selectedAssetIds.length} asset(s)`, t('common.success'));
      setSelectedAssetIds([]);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId?: string }) =>
      assetsApi.moveAssets(ids, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      success('Assets moved successfully', t('common.success'));
      setIsMoveModalOpen(false);
      setSelectedAssetIds([]);
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => assetsApi.createFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-folders'] });
      success('Folder created', t('common.success'));
      setIsNewFolderModalOpen(false);
      setNewFolderName('');
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    info(`Uploading ${file.name}...`);

    try {
      await assetsApi.uploadFile(file);
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      success(`Successfully uploaded ${file.name}`, 'Upload Complete');
      setIsUploadModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('assets.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('assets.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsNewFolderModalOpen(true)}
            leftIcon={<FolderOpen className="w-4 h-4 text-blue-600" />}
          >
            {t('assets.newFolder')}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsUploadModalOpen(true)}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            {t('assets.uploadMedia')}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
        {/* Search */}
        <div className="w-full md:w-72">
          <Input
            placeholder={t('assets.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All', icon: FolderOpen },
            { id: 'video', label: 'Videos', icon: Film },
            { id: 'image', label: 'Images', icon: ImageIcon },
            { id: 'audio', label: 'Audio', icon: Music },
            { id: 'document', label: 'Docs', icon: FileText },
            { id: 'generated', label: 'AI Synth', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`p-2 rounded-lg border text-xs transition-colors shrink-0 cursor-pointer ${
              favoritesOnly
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
            }`}
            title={t('common.favoritesOnly')}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>
        </div>

        {/* View Toggle & Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t('common.gridView')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t('common.listView')}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="name">Sort: Name</option>
            <option value="size">Sort: Size</option>
            <option value="duration">Sort: Duration</option>
          </select>
        </div>
      </div>

      {/* Folders Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedFolderId('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
            selectedFolderId === 'all'
              ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
          }`}
        >
          {t('assets.allFolders')} ({assets.length})
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFolderId(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              selectedFolderId === f.id
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color || '#2563eb' }} />
            <span>{f.name}</span>
          </button>
        ))}
      </div>

      {/* Multi-Select Action Bar */}
      {selectedAssetIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{selectedAssetIds.length} item(s) selected</span>
            <button
              onClick={() => setSelectedAssetIds([])}
              className="text-xs text-blue-700 hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMoveModalOpen(true)}
              leftIcon={<FolderInput className="w-3.5 h-3.5" />}
            >
              Move
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteMutation.mutate(selectedAssetIds)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      )}

      {/* Asset Content: Grid or List */}
      {isAssetsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t('assets.emptyTitle')}
          description={t('assets.emptyDesc')}
          actionLabel={t('assets.uploadMedia')}
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const isSelected = selectedAssetIds.includes(asset.id);
            return (
              <div
                key={asset.id}
                className={`group relative bg-white border rounded-xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                  isSelected ? 'border-blue-500 shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Media Thumbnail Container */}
                <div
                  className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                  onClick={() => setPreviewAsset(asset)}
                >
                  {asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : asset.type === 'audio' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-emerald-600">
                      <Music className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-mono">Audio Track</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}

                  {/* Play overlay on hover */}
                  {(asset.type === 'video' || asset.type === 'audio' || asset.type === 'generated') && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Badges on preview */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <Badge variant={asset.type === 'generated' ? 'purple' : 'default'} size="sm">
                      {asset.type}
                    </Badge>
                  </div>

                  {/* Duration badge */}
                  {asset.metadata && 'duration' in asset.metadata && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {formatDuration((asset.metadata as VideoMetadata).duration)}
                    </span>
                  )}
                </div>

                {/* Card Content & Details */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setPreviewAsset(asset)}
                      className="text-left font-semibold text-xs text-slate-900 truncate hover:text-blue-600 transition-colors cursor-pointer"
                      title={asset.name}
                    >
                      {asset.name}
                    </button>
                    <button
                      onClick={() => favoriteMutation.mutate(asset.id)}
                      className="text-slate-400 hover:text-amber-500 shrink-0 p-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${asset.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Metadata line */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{formatBytes(asset.sizeBytes)}</span>
                    <span>
                      {asset.metadata && 'resolution' in asset.metadata
                        ? (asset.metadata as VideoMetadata).resolution?.split(' ')[0]
                        : asset.metadata && 'format' in asset.metadata
                        ? (asset.metadata as any).format.split(' ')[0]
                        : 'File'}
                    </span>
                  </div>

                  {/* Tags */}
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {asset.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => toggleSelectAsset(asset.id)}
                      className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">{t('common.select')}</span>
                    </button>

                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        onClick={() => {
                          setRenamingAsset(asset);
                          setNewName(asset.name);
                        }}
                        className="p-1 hover:text-slate-800 cursor-pointer"
                        title={t('common.rename')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate([asset.id])}
                        className="p-1 hover:text-rose-600 cursor-pointer"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100">
          <div className="px-4 py-2.5 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between font-mono">
            <div className="flex items-center gap-3">
              <span className="w-6">{t('common.select')}</span>
              <span>{t('common.name')}</span>
            </div>
            <div className="flex items-center gap-8 pr-4">
              <span>{t('common.type')}</span>
              <span>{t('common.size')}</span>
              <span>{t('common.duration')}</span>
              <span>{t('common.actions')}</span>
            </div>
          </div>
          {assets.map((asset) => {
            const isSelected = selectedAssetIds.includes(asset.id);
            return (
              <div
                key={asset.id}
                className={`px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                  isSelected ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleSelectAsset(asset.id)}
                    className="text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div
                    className="w-10 h-8 rounded bg-slate-100 overflow-hidden shrink-0 cursor-pointer border border-slate-200"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    {asset.thumbnailUrl ? (
                      <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <span
                    onClick={() => setPreviewAsset(asset)}
                    className="font-semibold text-slate-900 hover:text-blue-600 truncate cursor-pointer"
                  >
                    {asset.name}
                  </span>
                </div>

                <div className="flex items-center gap-8 font-mono text-[11px] text-slate-500">
                  <Badge variant={asset.type === 'generated' ? 'purple' : 'default'} size="sm">
                    {asset.type}
                  </Badge>
                  <span className="w-16 text-right">{formatBytes(asset.sizeBytes)}</span>
                  <span className="w-14 text-right">
                    {asset.metadata && 'duration' in asset.metadata
                      ? formatDuration((asset.metadata as any).duration)
                      : '—'}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <button
                      onClick={() => favoriteMutation.mutate(asset.id)}
                      className="p-1 hover:text-amber-500 cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${asset.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        setRenamingAsset(asset);
                        setNewName(asset.name);
                      }}
                      className="p-1 hover:text-slate-800 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate([asset.id])}
                      className="p-1 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewAsset && (
        <Modal
          isOpen={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
          title={previewAsset.name}
          description={`Asset ID: ${previewAsset.id}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Media Player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
              {previewAsset.type === 'video' || previewAsset.type === 'generated' ? (
                <video
                  src={previewAsset.url}
                  controls
                  className="w-full h-full object-contain"
                  poster={previewAsset.thumbnailUrl}
                />
              ) : previewAsset.type === 'audio' ? (
                <div className="w-full p-8 flex flex-col items-center bg-slate-900">
                  <Music className="w-12 h-12 text-emerald-400 mb-4 animate-pulse" />
                  <audio src={previewAsset.url} controls className="w-full" />
                </div>
              ) : previewAsset.type === 'image' ? (
                <img src={previewAsset.url} alt={previewAsset.name} className="max-h-full object-contain" />
              ) : (
                <div className="text-slate-400 flex items-center gap-2">
                  <FileText className="w-8 h-8" />
                  <span>Document preview unavailable</span>
                </div>
              )}
            </div>

            {/* Metadata Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono">
              <h4 className="font-sans font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" /> {t('assets.preview')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500">{t('assets.fileSize')}:</span> {formatBytes(previewAsset.sizeBytes)}
                </div>
                <div>
                  <span className="text-slate-500">{t('assets.created')}:</span>{' '}
                  {new Date(previewAsset.createdAt).toLocaleDateString()}
                </div>
                {previewAsset.metadata && (
                  <>
                    {'resolution' in previewAsset.metadata && (
                      <div>
                        <span className="text-slate-500">{t('assets.resolution')}:</span>{' '}
                        {(previewAsset.metadata as VideoMetadata).resolution}
                      </div>
                    )}
                    {'duration' in previewAsset.metadata && (
                      <div>
                        <span className="text-slate-500">{t('assets.duration')}:</span>{' '}
                        {formatDuration((previewAsset.metadata as any).duration)}
                      </div>
                    )}
                    {'format' in previewAsset.metadata && (
                      <div>
                        <span className="text-slate-500">{t('assets.format')}:</span>{' '}
                        {(previewAsset.metadata as any).format}
                      </div>
                    )}
                    {'fps' in previewAsset.metadata && (
                      <div>
                        <span className="text-slate-500">{t('assets.framerate')}:</span>{' '}
                        {(previewAsset.metadata as VideoMetadata).fps} fps
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setPreviewAsset(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Media Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={t('assets.uploadMedia')}
        description="Upload raw footage, audio tracks, or graphics. Backend signed URLs protect API credentials."
        maxWidth="md"
      >
        <div className="space-y-4">
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors block">
            <UploadCloud className="w-10 h-10 text-blue-600 mb-3" />
            <span className="text-sm font-semibold text-slate-900">Click or drag files to upload</span>
            <span className="text-xs text-slate-500 mt-1 max-w-xs">
              Supports MP4, MOV, WAV, MP3, PNG, JPG, PDF up to 4GB per asset.
            </span>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept="video/*,audio/*,image/*,.pdf"
            />
          </label>
        </div>
      </Modal>

      {/* Rename Modal */}
      {renamingAsset && (
        <Modal
          isOpen={!!renamingAsset}
          onClose={() => setRenamingAsset(null)}
          title={t('assets.rename')}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <Input
              label={t('common.assetName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRenamingAsset(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  renameMutation.mutate({ id: renamingAsset.id, name: newName })
                }
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Folder Modal */}
      <Modal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        title={t('assets.newFolder')}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label={t('common.folderName')}
            placeholder={t('common.folderPlaceholder')}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsNewFolderModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newFolderName.trim()}
              onClick={() => createFolderMutation.mutate(newFolderName)}
            >
              {t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move Assets Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title={t('assets.move')}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <label className="text-xs font-semibold text-slate-700">{t('common.folderName')}</label>
          <select
            value={targetFolderId}
            onChange={(e) => setTargetFolderId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
          >
            <option value="">{t('common.all')} / Root</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsMoveModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                moveMutation.mutate({ ids: selectedAssetIds, folderId: targetFolderId || undefined })
              }
            >
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default AssetLibraryPage;
