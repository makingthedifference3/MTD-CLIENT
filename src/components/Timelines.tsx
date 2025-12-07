import { useMemo } from 'react';
import { Badge } from './ui/badge';
import type { Project, ProjectActivity } from '../types/csr';
import type { SelectOption, UseProjectFiltersResult } from '../lib/projectFilters';
import { formatProjectLabel } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';

interface TimelinesProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  activities: ProjectActivity[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
  subcompanyOptions?: SelectOption[];
  selectedSubcompany?: string;
  onSubcompanyChange?: (value: string) => void;
}

const MIN_BAR_PERCENT = 8;

const toTimestamp = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const clampPercent = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

export default function Timelines({
  projects,
  activities,
  projectFilters,
  brandColors,
  loading,
  subcompanyOptions,
  selectedSubcompany,
  onSubcompanyChange,
}: TimelinesProps) {
  const filteredActivities = activities.filter((a) => projectFilters.visibleProjectIds.includes(a.project_id));
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;
  const projectCount = projectFilters.filteredProjects.length || projects.length;
  const activityCount = filteredActivities.length;

  const getActivityStartValue = (activity: ProjectActivity) =>
    toTimestamp(activity.start_date ?? activity.actual_start_date ?? activity.actual_end_date ?? activity.end_date);

  const getActivityEndValue = (activity: ProjectActivity) =>
    toTimestamp(activity.end_date ?? activity.actual_end_date ?? activity.actual_start_date ?? activity.start_date);

  const timelineWindow = useMemo(() => {
    let earliest = Number.POSITIVE_INFINITY;
    let latest = Number.NEGATIVE_INFINITY;

    filteredActivities.forEach((activity) => {
      const start = getActivityStartValue(activity);
      if (start !== null) earliest = Math.min(earliest, start);
      const end = getActivityEndValue(activity);
      if (end !== null) latest = Math.max(latest, end);
    });

    if (!Number.isFinite(earliest)) earliest = new Date('2025-01-01').getTime();
    if (!Number.isFinite(latest) || latest <= earliest) latest = earliest + 1000 * 60 * 60 * 24 * 180;
    return { start: earliest, end: latest };
  }, [filteredActivities]);

  const windowRange = Math.max(timelineWindow.end - timelineWindow.start, 1);

  const activityTimestamp = (activity: ProjectActivity) => getActivityStartValue(activity) ?? Number.POSITIVE_INFINITY;

  const groupedActivities = useMemo(() => {
    const groups = new Map<string, { projectId: string; projectLabel: string; activities: ProjectActivity[] }>();
    filteredActivities.forEach((activity) => {
      const project = projects.find((p) => p.id === activity.project_id);
      const projectLabel = project ? formatProjectLabel(project as Partial<Project>) : 'Unnamed Project';
      if (!groups.has(activity.project_id)) {
        groups.set(activity.project_id, { projectId: activity.project_id, projectLabel, activities: [] });
      }
      groups.get(activity.project_id)!.activities.push(activity);
    });
    return Array.from(groups.values()).map((group) => {
      const activities = [...group.activities].sort((a, b) => activityTimestamp(a) - activityTimestamp(b));
      const earliestStartTs = activities.reduce((earliest, activity) => {
        const start = getActivityStartValue(activity);
        if (start === null) return earliest;
        return earliest === null || start < earliest ? start : earliest;
      }, null as number | null);
      const formattedDate = earliestStartTs
        ? new Date(earliestStartTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Date unavailable';

      return {
        ...group,
        activities,
        projectDateLabel: formattedDate,
      };
    });
  }, [filteredActivities, projects]);

  const getActivityBounds = (activity: ProjectActivity) => {
    const startTs = getActivityStartValue(activity) ?? timelineWindow.start;
    const endTs = getActivityEndValue(activity) ?? startTs;
    const startPercent = ((startTs - timelineWindow.start) / windowRange) * 100;
    const rawWidth = ((endTs - startTs) / windowRange) * 100;
    const left = clampPercent(startPercent, 0, 100 - MIN_BAR_PERCENT);
    const width = clampPercent(Math.max(rawWidth, MIN_BAR_PERCENT), MIN_BAR_PERCENT, 100 - left);
    return { left, width };
  };

  const monthSequence = useMemo(() => {
    const sequence: { label: string; date: Date }[] = [];
    const start = new Date(timelineWindow.start);
    const end = new Date(timelineWindow.end);
    start.setDate(1);
    end.setDate(1);
    const cursor = new Date(start);
    let guard = 0;
    while (cursor <= end && guard < 18) {
      sequence.push({
        label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        date: new Date(cursor)
      });
      cursor.setMonth(cursor.getMonth() + 1);
      guard++;
    }
    if (!sequence.length) {
      const now = new Date();
      now.setDate(1);
      sequence.push({
        label: now.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        date: now
      });
    }
    return sequence;
  }, [timelineWindow]);

  const months = monthSequence.map((month) => month.label);

  const monthSegments = Math.max(months.length, 1);
  const minTimelineWidth = monthSegments * 110;
  const monthGridLineCount = Math.max(monthSegments - 1, 0);
  const phaseColumnWidth = 220;

  return (
    <div className="flex-1 bg-background overflow-y-auto overflow-x-hidden">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            {currentProjectName ? `📅 ${currentProjectName}` : '📅 Project Timelines'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {currentProjectName ? 'Project-specific Gantt chart' : `Combined Gantt chart from all projects (${activityCount} activities)`}
          </p>

          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <Badge variant="outline" className="border-dashed bg-muted/60">{projectCount} projects</Badge>
            <Badge variant="outline" className="border-dashed bg-muted/60">{activityCount} activities</Badge>
          </div>
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

        {/* Timeline Canvas */}
        <div className="rounded-2xl p-8 shadow-lg border border-border bg-card/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Timeline Overview
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {currentProjectName ? `${currentProjectName} timeline` : 'All projects timeline'}
              </h3>
              <p className="text-sm text-muted-foreground">Visual tracker generated from the latest client data.</p>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <Badge className="gap-2 bg-emerald-500 text-white shadow"> <span className="w-2.5 h-2.5 rounded-full bg-white/80"></span> Completed</Badge>
              <Badge className="gap-2 bg-purple-500 text-white shadow"> <span className="w-2.5 h-2.5 rounded-full bg-white/80"></span> In Progress</Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"></div>
              <p className="mt-4 text-sm font-semibold">Loading timeline data…</p>
            </div>
          ) : filteredActivities.length ? (
            <div className="mt-8 overflow-x-auto">
              <div style={{ minWidth: `${phaseColumnWidth + minTimelineWidth}px` }}>
                {groupedActivities.map((group, groupIndex) => {
                  const avgCompletion = group.activities.length
                    ? Math.round(group.activities.reduce((sum: number, t: ProjectActivity) => sum + t.completion_percentage, 0) / group.activities.length)
                    : 0;

                  const sectionBg = groupIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50';

                  return (
                    <div key={group.projectId} className={`border-b border-border ${sectionBg}`}>
                      <div className="flex border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                        <div style={{ width: `${phaseColumnWidth}px` }} className="px-4 py-3">Phase name</div>
                        <div className="flex flex-1">
                          {months.map((month) => (
                            <div key={`${group.projectId}-header-${month}`} className="flex-1 border-l border-border py-3 text-center">
                              {month}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`flex ${sectionBg} bg-blue-50`}>
                        <div style={{ width: `${phaseColumnWidth}px` }} className="px-4 py-3 space-y-1 bg-blue-50 rounded-l-2xl">
                          <p className="text-base font-semibold text-card-foreground truncate">{group.projectLabel}</p>
                          <p className="text-xs text-muted-foreground">{group.projectDateLabel}</p>
                        </div>
                        <div className="flex-1 px-4 py-3 text-xs text-muted-foreground bg-blue-50">
                          Avg completion {avgCompletion}%
                        </div>
                      </div>

                      {group.activities.map((activity) => {
                        const { left, width } = getActivityBounds(activity);
                        const completionWidth = clampPercent((width * activity.completion_percentage) / 100, 0, width);

                        return (
                          <div key={activity.id} className={`flex text-muted-foreground text-sm ${sectionBg}`}>
                            <div style={{ width: `${phaseColumnWidth}px` }} className="px-4 py-4">
                              <p className="font-semibold text-card-foreground">{activity.title}</p>
                              <p className="text-xs text-muted-foreground">{activity.completion_percentage}% complete</p>
                            </div>
                            <div className="relative flex-1 h-14 px-4">
                              {Array.from({ length: monthGridLineCount }).map((_, index) => {
                                const leftPercent = ((index + 1) / monthSegments) * 100;
                                return (
                                  <span
                                    key={`${activity.id}-grid-${index}`}
                                    className="absolute top-3 bottom-3 border-l border-border"
                                    style={{ left: `${leftPercent}%` }}
                                  ></span>
                                );
                              })}

                              <div
                                className="absolute top-1/2 -translate-y-1/2 rounded-full"
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  height: '32px',
                                  background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
                                  zIndex: 10,
                                }}
                              ></div>
                              {activity.completion_percentage > 0 && (
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 rounded-full"
                                  style={{
                                    left: `${left}%`,
                                    width: `${completionWidth}%`,
                                    height: '32px',
                                    background: 'linear-gradient(90deg, #34d399, #10b981)',
                                    zIndex: 20,
                                  }}
                                ></div>
                              )}
                              <div
                                className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-xl text-xs font-semibold text-white flex items-center justify-center"
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  minWidth: '56px',
                                  height: '32px',
                                  zIndex: 30,
                                  pointerEvents: 'none',
                                }}
                              >
                                {activity.completion_percentage}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-border bg-muted/50 px-6 py-12 text-center text-muted-foreground text-sm font-semibold">
              No timelines available for the selected criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
