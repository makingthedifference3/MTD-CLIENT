import { useMemo, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import type { RealTimeUpdate, Report as ReportType } from '../types/csr';

import type { SelectOption, UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface ReportsProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  updates: RealTimeUpdate[];
  reports: ReportType[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
  subcompanyOptions?: SelectOption[];
  selectedSubcompany?: string;
  onSubcompanyChange?: (value: string) => void;
}

type ReportPreviewItem =
  | (RealTimeUpdate & { kind: 'update' })
  | (ReportType & { kind: 'report' });

export default function Reports({
  projects,
  updates,
  reports,
  projectFilters,
  brandColors,
  loading,
  subcompanyOptions,
  selectedSubcompany,
  onSubcompanyChange,
}: ReportsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ReportPreviewItem | null>(null);

  const filteredUpdates = updates.filter((u) => projectFilters.visibleProjectIds.includes(u.project_id));
  const filteredReports = reports.filter((r) => projectFilters.visibleProjectIds.includes(r.project_id));
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

  function handlePreview(item: ReportPreviewItem) {
    setPreviewItem(item);
    setPreviewOpen(true);
  }

  return (
    <div className="flex-1 bg-background overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            {currentProjectName ? `📄 ${currentProjectName}` : '📄 Reports & Updates'}
          </h1>
          <p className="text-muted-foreground text-lg">
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
          subcompanyOptions={subcompanyOptions}
          selectedSubcompany={selectedSubcompany}
          onSubcompanyChange={onSubcompanyChange}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
            <h2 className="text-2xl font-bold text-foreground mb-6 pb-4 border-b border-border">
              📢 Real Time Updates
            </h2>

            <div className="space-y-6">
              {groupedUpdates.map((group) => (
                <div key={group.projectId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                      {group.projectName}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {group.items.length} update{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((update) => (
                      <div
                        key={update.id}
                        onClick={() => handlePreview({ ...update, kind: 'update' })}
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-all duration-300 group border border-border hover:border-emerald-300 dark:hover:border-emerald-600 cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {update.title} - {new Date(update.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        {update.is_downloadable && update.drive_link && (
                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownload(update.drive_link);
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black shadow-lg hover:shadow-xl"
                          >
                            <Download className="w-4 h-4" />
                            Downloads
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {(!loading && filteredUpdates.length === 0) && (
                <div className="text-center text-muted-foreground font-semibold py-6">
                  No updates found for the selected criteria.
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
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
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {group.items.length} report{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => handlePreview({ ...report, kind: 'report' })}
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-all duration-300 group border border-border hover:border-emerald-300 dark:hover:border-emerald-600 cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {report.title}
                          </p>
                          <p className="text-xs text-muted-foreground font-semibold">
                            📅 {new Date(report.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>

                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDownload(report.drive_link);
                          }}
                          disabled={!report.drive_link}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black shadow-lg hover:shadow-xl"
                        >
                          <Download className="w-4 h-4" />
                          Downloads
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {(!loading && filteredReports.length === 0) && (
                <div className="text-center text-muted-foreground font-semibold py-6">
                  No reports found for the selected criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 p-6 bg-card/80 border-2 border-purple-200 rounded-2xl text-center font-semibold text-muted-foreground">
            Loading latest reports and updates...
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
                    {previewItem.kind === 'report' ? '📄' : '📢'}
                    {previewItem.title}
                  </DialogTitle>
                  <DialogDescription>
                    {(projectLookup[previewItem.project_id]?.name || 'Project update')} •{' '}
                    {new Date(previewItem.date).toLocaleDateString('en-GB')}
                  </DialogDescription>
                </DialogHeader>

                {previewItem.kind === 'update' && previewItem.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {previewItem.description}
                  </p>
                )}

                <div className="mt-2 overflow-hidden rounded-lg border border-border bg-muted/40">
                  {previewItem.drive_link ? (
                    <div className="aspect-video bg-black/5 dark:bg-black/40">
                      <iframe
                        src={previewItem.drive_link}
                        title={previewItem.title}
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
                    Live previews depend on the shared link. Open in a new tab if the embed is blocked.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => previewItem?.drive_link && window.open(previewItem.drive_link, '_blank')}
                      className="gap-2"
                      disabled={!previewItem?.drive_link}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in new tab
                    </Button>
                    <Button
                      onClick={() => handleDownload(previewItem?.drive_link)}
                      className="gap-2"
                      disabled={!previewItem?.drive_link}
                    >
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
