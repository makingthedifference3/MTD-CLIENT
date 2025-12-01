import { useMemo } from 'react';
import type { ProjectActivity } from '../types/csr';
import type { UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';

interface TimelinesProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  activities: ProjectActivity[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
}

const MIN_BAR_PERCENT = 8;

const toTimestamp = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const clampPercent = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

export default function Timelines({ projects, activities, projectFilters, brandColors, loading }: TimelinesProps) {
  const filteredActivities = activities.filter((a) => projectFilters.visibleProjectIds.includes(a.project_id));
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

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
    const groups = new Map<string, { projectName: string; activities: ProjectActivity[] }>();
    filteredActivities.forEach((activity) => {
      const project = projects.find((p) => p.id === activity.project_id);
      const projectName = project?.name || 'Unnamed Project';
      if (!groups.has(activity.project_id)) {
        groups.set(activity.project_id, { projectName, activities: [] });
      }
      groups.get(activity.project_id)!.activities.push(activity);
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      activities: [...group.activities].sort((a, b) => activityTimestamp(a) - activityTimestamp(b))
    }));
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
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 overflow-y-auto overflow-x-hidden rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
            {currentProjectName ? `📅 ${currentProjectName} - Timelines` : '📅 ALL PROJECTS - TIMELINES'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            {currentProjectName ? 'Project-specific Gantt chart' : `Combined Gantt chart from all projects (${filteredActivities.length} activities)`}
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

        {/* Timeline Canvas */}
        <div
          className="rounded-[32px] p-8 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase" style={{ letterSpacing: '0.3em' }}>
                Timeline overview
              </p>
              <h3 className="text-2xl font-bold text-white">
                {currentProjectName ? `${currentProjectName} timeline` : 'All projects timeline'}
              </h3>
              <p className="text-sm text-white/70">Visual tracker generated from the latest client data.</p>
            </div>
            <div className="flex items-center gap-6 text-sm font-semibold text-white/80">
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400"></span>
                Completed
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-400"></span>
                In Progress
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/70">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
              <p className="mt-4 text-sm font-semibold">Loading timeline data…</p>
            </div>
          ) : filteredActivities.length ? (
            <div className="mt-8 overflow-x-auto">
              <div style={{ minWidth: `${phaseColumnWidth + minTimelineWidth}px` }}>
                <div className="flex border-b border-white/15 text-white/60 text-xs uppercase font-semibold">
                  <div style={{ width: `${phaseColumnWidth}px` }} className="px-4 py-3">Phase name</div>
                  <div className="flex flex-1">
                    {months.map((month) => (
                      <div key={month} className="flex-1 border-l border-white/10 py-3 text-center">
                        {month}
                      </div>
                    ))}
                  </div>
                </div>

                {groupedActivities.map((group) => {
                  const avgCompletion = group.activities.length
                    ? Math.round(group.activities.reduce((sum: number, t: ProjectActivity) => sum + t.completion_percentage, 0) / group.activities.length)
                    : 0;

                  return (
                    <div key={group.projectName} className="border-b border-white/10">
                      <div className="flex bg-white/5 text-white/80 text-sm font-semibold">
                        <div style={{ width: `${phaseColumnWidth}px` }} className="px-4 py-3">
                          {group.projectName}
                        </div>
                        <div className="flex-1 px-4 py-3 text-white/60">
                          {group.activities.length} phase{group.activities.length !== 1 ? 's' : ''} • Avg completion {avgCompletion}%
                        </div>
                      </div>

                      {group.activities.map((activity) => {
                        const { left, width } = getActivityBounds(activity);
                        const barGradient = activity.completion_percentage === 100
                          ? 'linear-gradient(90deg, #34d399, #10b981)'
                          : 'linear-gradient(90deg, #a855f7, #7c3aed)';

                        return (
                          <div key={activity.id} className="flex text-white/80 text-sm">
                            <div style={{ width: `${phaseColumnWidth}px` }} className="px-4 py-4">
                              <p className="font-semibold text-white">{activity.title}</p>
                              <p className="text-xs text-white/60">{activity.completion_percentage}% complete</p>
                            </div>
                            <div className="relative flex-1 h-14 px-4">
                              {Array.from({ length: monthGridLineCount }).map((_, index) => {
                                const leftPercent = ((index + 1) / monthSegments) * 100;
                                return (
                                  <span
                                    key={`${activity.id}-grid-${index}`}
                                    className="absolute top-3 bottom-3 border-l border-white/10"
                                    style={{ left: `${leftPercent}%` }}
                                  ></span>
                                );
                              })}

                              <div
                                className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-xl text-xs font-semibold text-white flex items-center justify-center"
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  minWidth: '56px',
                                  height: '32px',
                                  background: barGradient,
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
            <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 px-6 py-12 text-center text-white/70 text-sm font-semibold">
              No timelines available for the selected criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
