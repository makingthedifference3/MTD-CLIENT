import { useMemo } from 'react';
import { Download } from 'lucide-react';
import type { Article as ArticleType, Media as MediaAsset } from '../types/csr';

import type { UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';

interface ArticleProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  articles: ArticleType[];
  videos: MediaAsset[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
}

export default function Article({ projects, articles, videos, projectFilters, brandColors, loading }: ArticleProps) {
  const filteredArticles = articles.filter((a) => projectFilters.visibleProjectIds.includes(a.project_id));
  const filteredVideos = videos.filter((v) => projectFilters.visibleProjectIds.includes(v.project_id));
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

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

  return (
    <div className="flex-1 bg-white overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
            {currentProjectName ? `📰 ${currentProjectName}` : '📰 Articles & News'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {currentProjectName ? 'Project-specific newspaper cuttings and videos' : 'Combined articles from all projects'}
          </p>
        </div>

        <ProjectFilterBar
          brandColors={brandColors ?? undefined}
          projectGroupOptions={projectFilters.projectGroupOptions}
          selectedProjectGroup={projectFilters.selectedProjectGroup}
          onProjectGroupChange={projectFilters.setSelectedProjectGroup}
          showDateFilter={projectFilters.showDateFilter}
          projectDateOptions={projectFilters.projectDateOptions}
          projectDateFilter={projectFilters.projectDateFilter}
          onProjectDateChange={projectFilters.setProjectDateFilter}
          states={projectFilters.states}
          selectedState={projectFilters.selectedState}
          onStateChange={projectFilters.setSelectedState}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              📰 NEWSPAPER CUTTINGS
            </h2>

            <div className="space-y-6">
              {groupedArticles.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {group.projectName}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {group.items.length} article{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 group border border-transparent hover:border-slate-200 dark:hover:border-slate-600 gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {article.title} - {new Date(article.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {article.is_featured && (
                            <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-xs shadow-lg animate-pulse overflow-hidden rounded-full">
                              ⚡ FEATURED
                            </span>
                          )}

                          <button
                            onClick={() => handleDownload(article.drive_link)}
                            disabled={!article.drive_link}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed rounded-lg"
                          >
                            <Download className="w-4 h-4" />
                            DOWNLOADS
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              🎬 VIDEOS
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
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 group border border-transparent hover:border-slate-200 dark:hover:border-slate-600 gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {video.title} - {new Date(video.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {video.news_channel && (
                            <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-xs shadow-lg overflow-hidden rounded-full">
                              {video.news_channel}
                            </span>
                          )}

                          <button
                            onClick={() => handleDownload(video.drive_link)}
                            disabled={!video.drive_link}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed rounded-lg"
                          >
                            <Download className="w-4 h-4" />
                            DOWNLOADS
                          </button>
                        </div>
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
            Loading articles and highlight videos...
          </div>
        )}

        {!loading && filteredArticles.length === 0 && (
          <div className="mt-6 p-6 bg-white border border-slate-200 rounded-lg text-center font-semibold text-slate-600">
            No articles available for the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
}
