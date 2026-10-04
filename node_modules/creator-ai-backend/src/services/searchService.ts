import { memoryStore } from '../db/memoryStore.js';

export interface SearchResultItem {
  id: string;
  type: 'asset' | 'project' | 'script' | 'clip' | 'schedule';
  title: string;
  subtitle?: string;
  url: string;
  matchedField: 'name' | 'tag' | 'title' | 'content' | 'hook' | 'transcript';
  thumbnailUrl?: string;
}

export class SearchService {
  public static async searchAll(query: string, userId = 'usr_demo_01'): Promise<SearchResultItem[]> {
    if (!query || query.trim().length < 2) return [];

    const q = query.toLowerCase().trim();
    const results: SearchResultItem[] = [];
    const ownsProject = (projectId: string): boolean => memoryStore.projects.get(projectId)?.userId === userId;

    // Search Assets
    memoryStore.assets.forEach((a) => {
      if (a.userId === userId && (a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)))) {
        results.push({
          id: a.id,
          type: 'asset',
          title: a.name,
          subtitle: `${a.type.toUpperCase()} • ${(a.sizeBytes / (1024 * 1024)).toFixed(1)} MB`,
          url: '/assets',
          matchedField: a.name.toLowerCase().includes(q) ? 'name' : 'tag',
          thumbnailUrl: a.thumbnailUrl,
        });
      }
    });

    // Search Projects
    memoryStore.projects.forEach((p) => {
      if (p.userId === userId && (
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )) {
        results.push({
          id: p.id,
          type: 'project',
          title: p.title,
          subtitle: `Status: ${p.status} • Platforms: ${p.targetPlatforms.join(', ')}`,
          url: `/projects/${p.id}`,
          matchedField: 'title',
          thumbnailUrl: p.thumbnailUrl,
        });
      }
    });

    // Search Scripts
    memoryStore.scripts.forEach((s) => {
      if (ownsProject(s.projectId) && (s.title.toLowerCase().includes(q) || s.rawText.toLowerCase().includes(q))) {
        results.push({
          id: s.id,
          type: 'script',
          title: s.title,
          subtitle: `${s.wordCount} words • Tone: ${s.tone}`,
          url: '/ai-studio',
          matchedField: s.title.toLowerCase().includes(q) ? 'title' : 'content',
        });
      }
    });

    // Search Clips
    memoryStore.clips.forEach((c) => {
      if (memoryStore.assets.get(c.sourceAssetId)?.userId === userId && (c.title.toLowerCase().includes(q) || c.hook.toLowerCase().includes(q))) {
        results.push({
          id: c.id,
          type: 'clip',
          title: c.title,
          subtitle: `Hook: "${c.hook.substring(0, 50)}..." • Transcript-fit score: ${c.selectionScore}`,
          url: '/clips',
          matchedField: 'hook',
          thumbnailUrl: c.previewUrl,
        });

        memoryStore.transcripts.forEach((transcript) => {
          const asset = memoryStore.assets.get(transcript.assetId);
          if (!asset || asset.userId !== userId) return;
          for (const segment of transcript.segments) {
            if (segment.text.toLowerCase().includes(q)) {
              results.push({
                id: asset.id,
                type: 'asset',
                title: asset.name,
                subtitle: segment.text,
                url: '/assets',
                matchedField: 'transcript',
                thumbnailUrl: asset.thumbnailUrl,
              });
            }
          }
        });
      }
    });

    // Search Schedules
    memoryStore.schedules.forEach((sch) => {
      if (sch.userId === userId && (sch.title.toLowerCase().includes(q) || sch.description?.toLowerCase().includes(q))) {
        results.push({
          id: sch.id,
          type: 'schedule',
          title: sch.title,
          subtitle: `Scheduled for: ${new Date(sch.scheduledTime).toLocaleDateString()}`,
          url: '/calendar',
          matchedField: 'title',
          thumbnailUrl: sch.thumbnailUrl,
        });
      }
    });

    return results.slice(0, 50);
  }
}
export default SearchService;
