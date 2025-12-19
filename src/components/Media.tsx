import { useMemo, useState } from 'react';
import { Download, ChevronDown, ExternalLink } from 'lucide-react';
import type { Media as MediaAsset, Project } from '../types/csr';

import { formatProjectIdentity } from '../lib/projectFilters';
import type { SelectOption, UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface MediaProps {
  projects: Array<Partial<Project>>;
  photos: MediaAsset[];
  videos: MediaAsset[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
  subcompanyOptions?: SelectOption[];
  selectedSubcompany?: string;
  onSubcompanyChange?: (value: string) => void;
}

export default function Media({
  projects,
  photos,
  videos,
  projectFilters,
  brandColors,
  loading,
  subcompanyOptions,
  selectedSubcompany,
  onSubcompanyChange,
}: MediaProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);

  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  const filteredPhotos = photos.filter((m) => projectFilters.visibleProjectIds.includes(m.project_id));
  const filteredVideos = videos.filter((m) => projectFilters.visibleProjectIds.includes(m.project_id));
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

  const groupedPhotos = useMemo(
    () =>
      orderedProjects
        .map((project) => ({
          projectId: project.id,
          projectName: project.name || 'Unnamed Project',
          items: filteredPhotos.filter((item) => item.project_id === project.id),
        }))
        .filter((group) => group.items.length > 0),
    [orderedProjects, filteredPhotos]
  );

  const groupedVideos = useMemo(
    () =>
      orderedProjects
        .map((project) => ({
          projectId: project.id,
          projectName: project.name || 'Unnamed Project',
          items: filteredVideos.filter((item) => item.project_id === project.id),
        }))
        .filter((group) => group.items.length > 0),
    [orderedProjects, filteredVideos]
  );

  function handleDownload(url?: string) {
    if (!url) return;
    window.open(url, '_blank');
  }

  function handlePreview(item: MediaAsset) {
    setSelectedMedia(item);
    setPreviewOpen(true);
  }

  return (
    <div className="flex-1 bg-background overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            {currentProjectName ? `📸 ${currentProjectName}` : '📸 Media Gallery'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {currentProjectName ? 'Project-specific photos and videos' : 'Combined media from all projects'}
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
              📸 PHOTOS
            </h2>

            <div className="space-y-6">
              {groupedPhotos.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {group.projectName}
                    </span>
                    <span className="text-xs font-medium text-slate-500 text-muted-foreground">
                      {group.items.length} photo{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((photo) => {
                      const project = projectsById.get(photo.project_id);
                      const projectIdentity = formatProjectIdentity(project);
                      const formattedDate = new Date(photo.date).toLocaleDateString('en-GB');
                      return (
                        <div
                          key={photo.id}
                          onClick={() => handlePreview(photo)}
                          role="button"
                          tabIndex={0}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 group border border-transparent hover:border-border dark:hover:border-slate-600 cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground line-clamp-1">
                              {projectIdentity}
                            </p>
                            <p className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {photo.is_geo_tagged && '📍 '}
                              {photo.title} - {formattedDate}
                            </p>
                          </div>
                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownload(photo.drive_link);
                            }}
                            disabled={!photo.drive_link}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black shadow-lg hover:shadow-xl"
                          >
                            <Download className="w-4 h-4" />
                            Downloads
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredPhotos.length > 5 && (
                <div className="flex justify-center pt-4">
                  <button className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all hover:scale-110 duration-300 bg-slate-50 dark:bg-slate-800">
                    <ChevronDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
            <h2 className="text-2xl font-bold text-foreground mb-6 pb-4 border-b border-border">
              🎥 VIDEOS
            </h2>

            <div className="space-y-6">
              {groupedVideos.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {group.projectName}
                    </span>
                    <span className="text-xs font-medium text-slate-500 text-muted-foreground">
                      {group.items.length} video{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((video) => {
                      const project = projectsById.get(video.project_id);
                      const projectIdentity = formatProjectIdentity(project);
                      const formattedDate = new Date(video.date).toLocaleDateString('en-GB');
                      const displayTitle = video.update_title || video.title;
                      return (
                        <div
                          key={video.id}
                          onClick={() => handlePreview(video)}
                          role="button"
                          tabIndex={0}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 group border border-transparent hover:border-border dark:hover:border-slate-600 cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground line-clamp-1">
                              {projectIdentity}
                            </p>
                            <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {video.is_geo_tagged && '📍 '}
                              {displayTitle} - {formattedDate}
                            </p>
                          </div>
                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownload(video.drive_link);
                            }}
                            disabled={!video.drive_link}
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl"
                          >
                            <Download className="w-4 h-4" />
                            Downloads
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 p-6 bg-card border border-border rounded-lg text-center font-semibold text-muted-foreground">
            Loading media assets...
          </div>
        )}

        {!loading && filteredPhotos.length === 0 && filteredVideos.length === 0 && (
          <div className="mt-6 p-6 bg-card border border-border rounded-lg text-center font-semibold text-muted-foreground">
            No media items found for the selected criteria.
          </div>
        )}

        <Dialog
          open={previewOpen}
          onOpenChange={(open) => {
            setPreviewOpen(open);
            if (!open) setSelectedMedia(null);
          }}
        >
          <DialogContent className="max-w-4xl">
            {selectedMedia && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    {selectedMedia.is_geo_tagged ? '📍' : selectedMedia.type === 'video' ? '🎬' : '📷'}
                    {selectedMedia.update_title || selectedMedia.title}
                  </DialogTitle>
                  <DialogDescription>
                    {(projectLookup[selectedMedia.project_id]?.name || 'Project media')} •{' '}
                    {new Date(selectedMedia.date).toLocaleDateString('en-GB')}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-2 overflow-hidden rounded-lg border border-border bg-muted/40">
                  {selectedMedia.drive_link ? (
                    <div className="aspect-video bg-black/5 dark:bg-black/40">
                      <iframe
                        src={selectedMedia.drive_link}
                        title={selectedMedia.update_title || selectedMedia.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-muted-foreground">No preview available for this media.</div>
                  )}
                </div>

                <DialogFooter className="sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Preview uses the shared link. If it does not render, try opening in a new tab.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => selectedMedia?.drive_link && window.open(selectedMedia.drive_link, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in new tab
                    </Button>
                    <Button onClick={() => handleDownload(selectedMedia?.drive_link)} className="gap-2">
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
