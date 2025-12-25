import { useMemo } from 'react';
import { Download } from 'lucide-react';
import type { RealTimeUpdate, Report as ReportType } from '../types/csr';

import type { UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';

interface ReportsProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  updates: RealTimeUpdate[];
  reports: ReportType[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
}

export default function Reports({ projects, updates, reports, projectFilters, brandColors, loading }: ReportsProps) {
  const filteredUpdates = updates.filter((u) => projectFilters.visibleProjectIds.includes(u.project_id));
  const filteredReports = reports.filter((r) => projectFilters.visibleProjectIds.includes(r.project_id));
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

  const orderedProjects = useMemo(() => {
    const base = projectFilters.filteredProjects.length ? projectFilters.filteredProjects : projects;
    return base.filter((project) => projectFilters.visibleProjectIds.includes(project.id));
  }, [projectFilters.filteredProjects, projectFilters.visibleProjectIds, projects]);

  const groupedUpdates = useMemo(
    () =>
      orderedProjects
        .map((project) => ({
          projectId: project.id,
          projectName: project.name || 'Unnamed Project',
          items: filteredUpdates.filter((update) => update.project_id === project.id),
        }))
        .filter((group) => group.items.length > 0),
    [orderedProjects, filteredUpdates]
  );

  const groupedReports = useMemo(
    () =>
      orderedProjects
        .map((project) => ({
          projectId: project.id,
          projectName: project.name || 'Unnamed Project',
          items: filteredReports.filter((report) => report.project_id === project.id),
        }))
        .filter((group) => group.items.length > 0),
    [orderedProjects, filteredReports]
  );

  function handleDownload(url?: string) {
    if (!url) return;
    window.open(url, '_blank');
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 overflow-auto rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {currentProjectName ? `📄 ${currentProjectName} - Reports` : '📄 ALL PROJECTS - REPORTS'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            {currentProjectName ? 'Project-specific reports and updates' : 'Combined reports from all projects'}
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

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-purple-200 p-6 shadow-2xl hover:shadow-purple-200 transition-all">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6 pb-4 border-b-2 border-purple-200">
              📢 REAL TIME UPDATE
            </h2>

            <div className="space-y-6">
              {groupedUpdates.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                      {group.projectName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {group.items.length} update{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((update) => (
                      <div
                        key={update.id}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-purple-50 transition-all duration-300 group border border-transparent hover:border-purple-200"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                            {update.title} - {new Date(update.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        {update.is_downloadable && update.drive_link && (
                          <button
                            onClick={() => handleDownload(update.drive_link)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                            style={{ borderRadius: '9999px' }}
                          >
                            <Download className="w-4 h-4" />
                            DOWNLOADS
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {(!loading && filteredUpdates.length === 0) && (
                <div className="text-center text-slate-500 font-semibold py-6">
                  No updates found for the selected criteria.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-indigo-200 p-6 shadow-2xl hover:shadow-indigo-200 transition-all">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 mb-6 pb-4 border-b-2 border-indigo-200">
              📄 REPORTS
            </h2>

            <div className="space-y-6">
              {groupedReports.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
                      {group.projectName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {group.items.length} report{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-indigo-50 transition-all duration-300 group border border-transparent hover:border-indigo-200"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                            {report.title}
                          </p>
                          {report.date && (
                            <p className="text-xs text-slate-600 font-semibold">
                              📅 {new Date(report.date).toLocaleDateString('en-GB')}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDownload(report.drive_link)}
                          disabled={!report.drive_link}
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

              {(!loading && filteredReports.length === 0) && (
                <div className="text-center text-slate-500 font-semibold py-6">
                  No reports found for the selected criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 p-6 bg-white/80 border-2 border-purple-200 rounded-2xl text-center font-semibold text-slate-600">
            Loading latest reports and updates...
          </div>
        )}
      </div>
    </div>
  );
}
