import { useMemo, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import type { Article as ArticleType, Media as MediaAsset } from '../types/csr';

import type { SelectOption, UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface ArticleProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  articles: ArticleType[];
  videos: MediaAsset[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
  subcompanyOptions?: SelectOption[];
  selectedSubcompany?: string;
  onSubcompanyChange?: (value: string) => void;
}

type ArticlePreviewItem =
  | (ArticleType & { kind: 'article' })
  | (MediaAsset & { kind: 'video' });

export default function Article({
  projects,
  articles,
  videos,
  projectFilters,
  brandColors,
  loading,
  subcompanyOptions,
  selectedSubcompany,
  onSubcompanyChange,
}: ArticleProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ArticlePreviewItem | null>(null);

  const filteredArticles = articles.filter((a) => projectFilters.visibleProjectIds.includes(a.project_id));
  const filteredVideos = videos.filter((v) => projectFilters.visibleProjectIds.includes(v.project_id));
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

  const projectLookup = useMemo(() => {
    const map: Record<string, { id: string; name: string; state?: string; start_date?: string }> = {};
    projects.forEach((project) => {
      map[project.id] = project;
    });
    return map;
  }, [projects]);

  const orderedProjects = useMemo(() => {
    const base = projectFilters.filteredProjects.length ? projectFilters.filteredProjects : projects;
    return base.filter((project) => projectFilters.visibleProjectIds.includes(project.id));
  }, [projectFilters.filteredProjects, projectFilters.visibleProjectIds, projects]);

  const groupedArticles = useMemo(
    () =>
      orderedProjects
        .map((project) => ({
          projectId: project.id,
          projectName: project.name || 'Unnamed Project',
          items: filteredArticles.filter((article) => article.project_id === project.id),
        }))
        .filter((group) => group.items.length > 0),
    [orderedProjects, filteredArticles]
  );

  const groupedVideos = useMemo(
    () =>
      orderedProjects
        .map((project) => ({
          projectId: project.id,
          projectName: project.name || 'Unnamed Project',
          items: filteredVideos.filter((video) => video.project_id === project.id),
        }))
        .filter((group) => group.items.length > 0),
    [orderedProjects, filteredVideos]
  );

  function handleDownload(url?: string) {
    if (!url) return;
    window.open(url, '_blank');
  }

  function handlePreview(item: ArticlePreviewItem) {
    setPreviewItem(item);
    setPreviewOpen(true);
  }

  return (
    <div className="flex-1 bg-background overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            {currentProjectName ? `📰 ${currentProjectName}` : '📰 Articles & News'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {currentProjectName ? 'Project-specific newspaper cuttings and videos' : 'Combined articles from all projects'}
          </p>
        </div>

        <ProjectFilterBar
          brandColors={brandColors ?? undefined}
          projectGroupOptions={projectFilters.projectGroupOptions}
          selectedProjectGroup={projectFilters.selectedProjectGroup}
          onProjectGroupChange={projectFilters.setSelectedProjectGroup}
          states={projectFilters.states}
          selectedState={projectFilters.selectedState}
          onStateChange={projectFilters.setSelectedState}
          subcompanyOptions={subcompanyOptions}
          selectedSubcompany={selectedSubcompany}
          onSubcompanyChange={onSubcompanyChange}
          resetFilters={projectFilters.resetFilters}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
            <h2 className="text-2xl font-bold text-foreground mb-6 pb-4 border-b border-border">
              📰 NEWSPAPER CUTTINGS
            </h2>

            <div className="space-y-6">
              {groupedArticles.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {group.projectName}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {group.items.length} article{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((article) => {
                      const displayTitle = article.update_title || article.title;
                      return (
                      <div
                        key={article.id}
                        onClick={() => handlePreview({ ...article, kind: 'article' })}
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 group border border-transparent hover:border-border dark:hover:border-slate-600 gap-3 cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {displayTitle} - {new Date(article.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {article.is_featured && (
                            <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-xs shadow-lg animate-pulse overflow-hidden rounded-full">
                              ⚡ FEATURED
                            </span>
                          )}

                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownload(article.drive_link);
                            }}
                            disabled={!article.drive_link}
                            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl"
                          >
                            <Download className="w-4 h-4" />
                            Downloads
                          </Button>
                        </div>
                      </div>
                    );})}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
            <h2 className="text-2xl font-bold text-foreground mb-6 pb-4 border-b border-border">
              🎬 VIDEOS
            </h2>

            <div className="space-y-6">
              {groupedVideos.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {group.projectName}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {group.items.length} video{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((video) => {
                      const displayTitle = video.update_title || video.title;
                      return (
                      <div
                        key={video.id}
                        onClick={() => handlePreview({ ...video, kind: 'video' })}
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 group border border-transparent hover:border-border dark:hover:border-slate-600 gap-3 cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-purple-500"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {displayTitle} - {new Date(video.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {video.news_channel && (
                            <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-xs shadow-lg overflow-hidden rounded-full">
                              {video.news_channel}
                            </span>
                          )}

                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownload(video.drive_link);
                            }}
                            disabled={!video.drive_link}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl"
                          >
                            <Download className="w-4 h-4" />
                            Downloads
                          </Button>
                        </div>
                      </div>
                    );})}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 p-6 bg-card border border-border rounded-lg text-center font-semibold text-muted-foreground">
            Loading articles and highlight videos...
          </div>
        )}

        {!loading && filteredArticles.length === 0 && (
          <div className="mt-6 p-6 bg-card border border-border rounded-lg text-center font-semibold text-muted-foreground">
            No articles available for the selected criteria.
          </div>
        )}

        <Dialog
          open={previewOpen}
          onOpenChange={(open) => {
            setPreviewOpen(open);
            if (!open) setPreviewItem(null);
          }}
        >
          <DialogContent className="max-w-4xl">
            {previewItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    {previewItem.kind === 'video' ? '🎬' : '📰'}
                    {previewItem.title}
                  </DialogTitle>
                  <DialogDescription>
                    {(projectLookup[previewItem.project_id]?.name || 'Project story')} •{' '}
                    {new Date(previewItem.date).toLocaleDateString('en-GB')}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-2 overflow-hidden rounded-lg border border-border bg-muted/40">
                  {previewItem.drive_link ? (
                    <div className="aspect-video bg-black/5 dark:bg-black/40">
                      <iframe
                        src={previewItem.drive_link}
                        title={previewItem.update_title || previewItem.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-muted-foreground">No preview available for this item.</div>
                  )}
                </div>

                <DialogFooter className="sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Previews rely on the shared link. If it fails to render, open in a new tab.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => previewItem?.drive_link && window.open(previewItem.drive_link, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in new tab
                    </Button>
                    <Button onClick={() => handleDownload(previewItem?.drive_link)} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
