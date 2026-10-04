import apiClient from '../api/client';
import { Asset, AssetFolder, AssetType } from '../types';

export interface AssetFilterParams {
  type?: AssetType;
  folderId?: string;
  search?: string;
  tag?: string;
  favoriteOnly?: boolean;
  sortBy?: 'createdAt' | 'name' | 'sizeBytes';
  sortOrder?: 'asc' | 'desc';
}

export const assetsApi = {
  getAssets(params?: AssetFilterParams): Promise<Asset[]> {
    return apiClient.get<Asset[]>('/assets', {
      type: params?.type,
      folderId: params?.folderId,
      search: params?.search,
      tag: params?.tag,
      favoriteOnly: params?.favoriteOnly,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });
  },

  getAssetById(id: string): Promise<Asset> {
    return apiClient.get<Asset>(`/assets/${id}`);
  },

  getFolders(): Promise<AssetFolder[]> {
    return apiClient.get<AssetFolder[]>('/assets/folders');
  },

  createFolder(name: string, color?: string): Promise<AssetFolder> {
    return apiClient.post<AssetFolder>('/assets/folders', { name, color });
  },

  async uploadFile(file: File, folderId?: string): Promise<Asset> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    return apiClient.uploadFormData<Asset>('/assets/upload', formData);
  },

  renameAsset(id: string, newName: string): Promise<Asset> {
    return apiClient.patch<Asset>(`/assets/${id}`, { name: newName });
  },

  async toggleFavorite(id: string): Promise<Asset> {
    const asset = await assetsApi.getAssetById(id);
    return apiClient.patch<Asset>(`/assets/${id}`, { isFavorite: !asset.isFavorite });
  },

  moveAssets(assetIds: string[], folderId?: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/assets/move', { assetIds, folderId });
  },

  deleteAssets(assetIds: string[]): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/assets/delete-batch', { assetIds });
  },
};
export default assetsApi;
