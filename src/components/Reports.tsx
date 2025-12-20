import { useMemo, useState, useRef, type MouseEvent } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import type { Project, RealTimeUpdate, Report as ReportType } from '../types/csr';

import { formatProjectIdentity } from '../lib/projectFilters';
import type { SelectOption, UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ReportsProps {
  projects: Array<Partial<Project>>;
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

interface MonthlyReportGroup {
  key: string;
  projectId: string;
  monthLabel: string;
  latestTimestamp: number;
  reports: ReportType[];
}

const parseReportDate = (value?: string) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const groupReportsByMonth = (project: Project, reports: ReportType[]): MonthlyReportGroup[] => {
  const groups = new Map<string, MonthlyReportGroup>();

  reports.forEach((report) => {
    const parsed = parseReportDate(report.date);
    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const monthKey = `${project.id}-${year}-${month}`;

    const existing = groups.get(monthKey);
    if (existing) {
      existing.reports.push(report);
      existing.latestTimestamp = Math.max(existing.latestTimestamp, parsed.getTime());
      return;
    }

    groups.set(monthKey, {
      key: monthKey,
      projectId: project.id,
      monthLabel: formatMonthLabel(parsed),
      latestTimestamp: parsed.getTime(),
      reports: [report],
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      reports: group.reports
        .slice()
        .sort((a, b) => parseReportDate(b.date).getTime() - parseReportDate(a.date).getTime()),
    }))
    .sort((a, b) => b.latestTimestamp - a.latestTimestamp);
};

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
  const [mergingGroupKey, setMergingGroupKey] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [expandedMonthGroups, setExpandedMonthGroups] = useState<string[]>([]);
  const mergedPreviewRef = useRef<string | null>(null);

  const filteredUpdates = updates.filter((u) => projectFilters.visibleProjectIds.includes(u.project_id));
  const filteredReports = reports.filter((r) => projectFilters.visibleProjectIds.includes(r.project_id));
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  const orderedProjects = useMemo(() => {
    const base = projectFilters.filteredProjects.length ? projectFilters.filteredProjects : projects;
    return base.filter((project) => typeof project.id === 'string' && projectFilters.visibleProjectIds.includes(project.id));
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

  const projectMonthlyReportGroups = useMemo(
    () =>
      orderedProjects
        .map((project) => {
          const projectId = project.id ?? 'unknown-project';
          const normalizedProject = { ...project, id: projectId } as Project;
          const projectCode = project.code || projectId.slice(0, 8);

          return {
            projectId,
            projectName: normalizedProject.name || 'Unnamed Project',
            projectCode,
            monthGroups: groupReportsByMonth(
              normalizedProject,
              filteredReports.filter((report) => report.project_id === projectId)
            ),
          };
        })
        .filter((group) => group.monthGroups.length > 0),
    [orderedProjects, filteredReports]
  );

  function handleDownload(url?: string) {
    if (!url) return;
    window.open(url, '_blank');
  }

  function cleanupMergedPreview() {
    if (mergedPreviewRef.current) {
      URL.revokeObjectURL(mergedPreviewRef.current);
      mergedPreviewRef.current = null;
    }
  }

  function handlePreview(item: ReportPreviewItem) {
    setPreviewItem(item);
    setPreviewOpen(true);
  }

  const toggleMonthGroup = (key: string) => {
    setExpandedMonthGroups((prev) =>
      prev.includes(key) ? prev.filter((existing) => existing !== key) : [...prev, key]
    );
  };

  async function handleMergeGroup(group: MonthlyReportGroup, projectName: string) {
    const downloadableReports = group.reports.filter((report) => Boolean(report.drive_link));
    if (!downloadableReports.length) {
      setMergeError(`No downloadable PDFs for ${group.monthLabel}.`);
      return;
    }

    setMergeError(null);
    if (mergingGroupKey) return;
    setMergingGroupKey(group.key);
    cleanupMergedPreview();

    try {
      const mergedPdf = await PDFDocument.create();
      for (const report of downloadableReports) {
        const response = await fetch(report.drive_link!, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Unable to fetch ${report.title}`);
        }
        const buffer = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      mergedPreviewRef.current = url;
      const previewItem: ReportPreviewItem = {
        id: `${projectName || 'merged'}-${group.key}`,
        project_id: group.projectId,
        title: `${projectName || 'Merged Report'} • ${group.monthLabel}`,
        date: new Date().toISOString(),
        drive_link: url,
        kind: 'report',
        source: 'merged',
      };
      handlePreview(previewItem);
    } catch (error) {
      console.error('Merge failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMergeError(`Failed to merge PDFs for ${group.monthLabel}: ${message}`);
      const fallback = downloadableReports[0]?.drive_link;
      if (fallback) {
        window.open(fallback, '_blank');
      }
    } finally {
      setMergingGroupKey(null);
    }
  }

  const handleGroupClick = (
    event: MouseEvent<HTMLDivElement>,
    monthGroup: MonthlyReportGroup,
    projectName: string,
    primaryReport?: ReportType
  ) => {
    if ((event.target as Element).closest('button')) {
      return;
    }
    if (monthGroup.reports.length > 1) {
      handleMergeGroup(monthGroup, projectName);
      return;
    }
    if (primaryReport) {
      handlePreview({ ...primaryReport, kind: 'report' });
    }
  };

  const formatSourceLabel = (source?: ReportType['source']) => {
    if (source === 'monthly') return 'Monthly PDF';
    if (source === 'merged') return 'Merged PDF';
    return null;
  };

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
          resetFilters={projectFilters.resetFilters}
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
                    {group.items.map((update) => {
                      const project = projectsById.get(update.project_id);
                      const projectIdentity = formatProjectIdentity(project);
                      const formattedDate = new Date(update.date).toLocaleDateString('en-GB');
                      return (
                        <div
                          key={update.id}
                          onClick={() => handlePreview({ ...update, kind: 'update' })}
                          role="button"
                          tabIndex={0}
                          className="flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-all duration-300 group border border-border hover:border-emerald-300 dark:hover:border-emerald-600 cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <div className="flex-1 space-y-1">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                              {projectIdentity}
                            </p>
                            <p className="text-sm font-bold text-foreground dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {update.title} - {formattedDate}
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
                      );
                    })}
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

            {mergeError && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {mergeError}
              </div>
            )}

            <div className="space-y-6">
              {projectMonthlyReportGroups.map((projectGroup) => {
                const totalReports = projectGroup.monthGroups.reduce((sum, group) => sum + group.reports.length, 0);
                return (
                  <div key={projectGroup.projectId} className="space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
                            {projectGroup.projectName}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {totalReports} report{totalReports !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                          Code: {projectGroup.projectCode}
                        </p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                        Grouped by Month
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      {projectGroup.monthGroups.map((monthGroup) => {
                        const hasMultiple = monthGroup.reports.length > 1;
                        const groupExpanded = expandedMonthGroups.includes(monthGroup.key);
                        const primaryReport = monthGroup.reports[0];
                        return (
                          <div
                            key={monthGroup.key}
                            onClick={(event) =>
                              handleGroupClick(event, monthGroup, projectGroup.projectName, primaryReport)
                            }
                            className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                  {projectGroup.projectCode}
                                </p>
                                <p className="text-lg font-bold text-foreground">
                                  {monthGroup.monthLabel}
                                </p>
                                <p className="text-xs text-muted-foreground font-semibold">
                                  {monthGroup.reports.length} pdf{monthGroup.reports.length !== 1 ? 's' : ''} • {projectGroup.projectName}
                                </p>
                                {primaryReport && (
                                  <p className="text-xs text-muted-foreground">
                                    Latest: {primaryReport.title} • {new Date(primaryReport.date).toLocaleDateString('en-GB')}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  {hasMultiple && (
                                    <Button
                                      size="sm"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleMergeGroup(monthGroup, projectGroup.projectName);
                                      }}
                                      disabled={mergingGroupKey === monthGroup.key}
                                      className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-emerald-600 text-white font-black"
                                    >
                                      {mergingGroupKey === monthGroup.key ? 'Merging...' : 'Merge PDFs'}
                                    </Button>
                                  )}
                                  {!hasMultiple && primaryReport?.drive_link && (
                                    <Button
                                      size="sm"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleDownload(primaryReport.drive_link);
                                      }}
                                      className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black"
                                    >
                                      Download
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleMonthGroup(monthGroup.key);
                                    }}
                                    className="px-3 py-1 text-xs font-semibold"
                                  >
                                    {groupExpanded ? 'Hide PDFs' : 'Show PDFs'}
                                  </Button>
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {hasMultiple ? 'Merged bundle' : 'Single PDF'}
                                </span>
                              </div>
                            </div>

                            {groupExpanded && (
                              <div className="space-y-3 mt-4">
                                {monthGroup.reports.map((report) => {
                                  const project = projectsById.get(report.project_id);
                                  const projectIdentity = formatProjectIdentity(project);
                                  const sourceLabel = formatSourceLabel(report.source);
                                  const formattedDate = new Date(report.date).toLocaleDateString('en-GB');
                                  return (
                                    <div
                                      key={report.id}
                                      onClick={() => handlePreview({ ...report, kind: 'report' })}
                                      role="button"
                                      tabIndex={0}
                                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-accent transition-all duration-300 group border border-border hover:border-emerald-300 dark:hover:border-emerald-600 cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500"
                                    >
                                      <div className="flex-1 space-y-2">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                          {projectIdentity}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-bold text-foreground dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {report.title}
                                          </p>
                                          {sourceLabel && (
                                            <Badge className="bg-purple-50 text-purple-700 border border-purple-100 text-[11px]">
                                              {sourceLabel}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-semibold">
                                          📅 {formattedDate}
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
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

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
            if (!open) {
              setPreviewItem(null);
              cleanupMergedPreview();
            }
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
                    {formatProjectIdentity(projectsById.get(previewItem.project_id))} •{' '}
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
