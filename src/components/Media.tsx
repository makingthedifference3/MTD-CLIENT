import { useMemo } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import type { Media as MediaAsset } from '../types/csr';

import type { UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';

interface MediaProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  photos: MediaAsset[];
  videos: MediaAsset[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
}

export default function Media({ projects, photos, videos, projectFilters, brandColors, loading }: MediaProps) {
  const filteredPhotos = photos.filter((m) => projectFilters.visibleProjectIds.includes(m.project_id));
  const filteredVideos = videos.filter((m) => projectFilters.visibleProjectIds.includes(m.project_id));
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

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

  return (
    <div className="flex-1 bg-white overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
            {currentProjectName ? `📸 ${currentProjectName}` : '📸 Media Gallery'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
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
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              📸 PHOTOS
            </h2>

            <div className="space-y-6">
              {groupedPhotos.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {group.projectName}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {group.items.length} photo{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((photo) => (
                      <div
                        key={photo.id}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 group border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {photo.is_geo_tagged && '📍 '}
                            {photo.title} - {new Date(photo.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDownload(photo.drive_link)}
                          disabled={!photo.drive_link}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ borderRadius: '9999px' }}
                        >
                          <Download className="w-4 h-4" />
                          DOWNLOADS
                        </button>
                      </div>
                    ))}
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

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              🎥 VIDEOS
            </h2>

            <div className="space-y-6">
              {groupedVideos.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {group.projectName}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {group.items.length} video{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 group border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {video.is_geo_tagged && '📍 '}
                            {video.title} - {new Date(video.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDownload(video.drive_link)}
                          disabled={!video.drive_link}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed rounded-lg"
                        >
                          <Download className="w-4 h-4" />
                          DOWNLOADS
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 p-6 bg-white border border-slate-200 rounded-lg text-center font-semibold text-slate-600">
            Loading media assets...
          </div>
        )}

        {!loading && filteredPhotos.length === 0 && filteredVideos.length === 0 && (
          <div className="mt-6 p-6 bg-white border border-slate-200 rounded-lg text-center font-semibold text-slate-600">
            No media items found for the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
}
