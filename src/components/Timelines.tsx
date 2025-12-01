import { useMemo } from 'react';
import type { Timeline } from '../types/csr';
import type { UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';

interface TimelinesProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  timelines: Timeline[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
}

// Color palette for projects
const PROJECT_COLORS = [
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'from-orange-500 to-amber-600', light: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'from-pink-500 to-rose-600', light: 'bg-pink-100', text: 'text-pink-700' },
  { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-100', text: 'text-cyan-700' },
];

const MIN_BAR_PERCENT = 6;

const toTimestamp = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const clampPercent = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

export default function Timelines({ projects, timelines, projectFilters, brandColors, loading }: TimelinesProps) {
  const filteredTimelines = timelines.filter((t) => projectFilters.visibleProjectIds.includes(t.project_id));
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

  const getTimelineStartValue = (timeline: Timeline) =>
    toTimestamp(timeline.start_date ?? timeline.actual_start_date ?? timeline.actual_end_date ?? timeline.end_date);

  const getTimelineEndValue = (timeline: Timeline) =>
    toTimestamp(timeline.end_date ?? timeline.actual_end_date ?? timeline.actual_start_date ?? timeline.start_date);

  const timelineWindow = useMemo(() => {
    let earliest = Number.POSITIVE_INFINITY;
    let latest = Number.NEGATIVE_INFINITY;

    filteredTimelines.forEach((timeline) => {
      const start = getTimelineStartValue(timeline);
      if (start !== null) {
        earliest = Math.min(earliest, start);
      }
      const end = getTimelineEndValue(timeline);
      if (end !== null) {
        latest = Math.max(latest, end);
      }
    });

    if (!Number.isFinite(earliest)) earliest = new Date('2025-01-01').getTime();
    if (!Number.isFinite(latest) || latest <= earliest) latest = earliest + 1000 * 60 * 60 * 24 * 180;
    return { start: earliest, end: latest };
  }, [filteredTimelines]);

  const windowRange = Math.max(timelineWindow.end - timelineWindow.start, 1);

  const timelineTimestamp = (timeline: Timeline) => getTimelineStartValue(timeline) ?? Number.POSITIVE_INFINITY;

  // Group timelines by project
  const groupedTimelines = useMemo(() => {
    const groups = new Map<string, { projectName: string; timelines: Timeline[]; colorIndex: number }>();

    filteredTimelines.forEach((timeline) => {
      const project = projects.find((p) => p.id === timeline.project_id);
      const projectName = project?.name || 'Unknown Project';

      if (!groups.has(timeline.project_id)) {
        groups.set(timeline.project_id, {
          projectName,
          timelines: [],
          colorIndex: groups.size % PROJECT_COLORS.length,
        });
      }
      groups.get(timeline.project_id)!.timelines.push(timeline);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      timelines: [...group.timelines].sort((a, b) => timelineTimestamp(a) - timelineTimestamp(b)),
    }));
  }, [filteredTimelines, projects]);

  // Calculate average completion per project for bar chart
  const projectCompletionData = useMemo(() => {
    return groupedTimelines.map((group, index) => {
      const avgCompletion = group.timelines.length > 0
        ? group.timelines.reduce((sum, t) => sum + t.completion_percentage, 0) / group.timelines.length
        : 0;
      return {
        projectName: group.projectName,
        completion: avgCompletion,
        colorIndex: index % PROJECT_COLORS.length,
        timelinesCount: group.timelines.length,
      };
    });
  }, [groupedTimelines]);

  const getTimelineBounds = (timeline: Timeline) => {
    const startTs = getTimelineStartValue(timeline) ?? timelineWindow.start;
    const endTs = getTimelineEndValue(timeline) ?? startTs;

    const startPercent = ((startTs - timelineWindow.start) / windowRange) * 100;
    const rawWidth = ((endTs - startTs) / windowRange) * 100;

    const left = clampPercent(startPercent, 0, 100 - MIN_BAR_PERCENT);
    const width = clampPercent(Math.max(rawWidth, MIN_BAR_PERCENT), MIN_BAR_PERCENT, 100 - left);

    return { left, width };
  };

  const months = useMemo(() => {
    const labels: string[] = [];
    const start = new Date(timelineWindow.start);
    const end = new Date(timelineWindow.end);
    start.setDate(1);
    end.setDate(1);
    const shortcut = new Date(start);
    while (shortcut <= end) {
      labels.push(shortcut.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      shortcut.setMonth(shortcut.getMonth() + 1);
    }
    return labels.length ? labels : ['Jan 25'];
  }, [timelineWindow]);

  const monthSegments = Math.max(months.length, 1);
  const minTimelineWidth = monthSegments * 70;
  const monthGridLineCount = Math.max(monthSegments - 1, 0);

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 overflow-y-auto overflow-x-hidden rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
            {currentProjectName ? `📅 ${currentProjectName} - Timelines` : '📅 ALL PROJECTS - TIMELINES'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            {currentProjectName ? 'Project-specific Gantt chart' : `Combined Gantt chart from all projects (${filteredTimelines.length} timelines)`}
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

        {/* Bar Chart - Project Completion Overview */}
        {!loading && projectCompletionData.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-purple-200 p-6 shadow-2xl mb-8">
            <h3 className="text-xl font-black text-slate-700 mb-6">📊 Project Completion Overview</h3>
            <div className="space-y-4">
              {projectCompletionData.map((project, index) => {
                const colors = PROJECT_COLORS[project.colorIndex];
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">
                        {project.projectName}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500">
                          {project.timelinesCount} phase{project.timelinesCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          {project.completion.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all duration-700 flex items-center justify-end pr-3`}
                        style={{ width: `${Math.max(project.completion, 5)}%` }}
                      >
                        {project.completion > 15 && (
                          <span className="text-xs font-bold text-white drop-shadow">{project.completion.toFixed(0)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gantt Chart - Grouped by Project */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-purple-200 p-8 shadow-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg"></div>
                <span className="text-sm font-black text-slate-700">✅ Completed (100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-violet-500 shadow-lg"></div>
                <span className="text-sm font-black text-slate-700">⏳ In Progress</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto w-full pb-2">
            {/* Month Headers - this sets the scroll width */}
            <div 
              className="flex mb-4 pb-3 border-b-2 border-purple-100 bg-violet-50/50 rounded-t-xl sticky top-0 z-10"
              style={{ minWidth: `${192 + minTimelineWidth}px` }}
            >
              <div className="w-48 text-center text-sm font-black text-purple-700 py-2 flex items-center justify-center shrink-0 border-r border-purple-100/50">
                PROJECT / PHASE
              </div>
              <div
                className="flex px-2"
                style={{ minWidth: `${minTimelineWidth}px`, flex: 1 }}
              >
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className="flex-1 text-center text-xs font-black text-violet-600 py-2 min-w-[70px]"
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>

            {/* Grouped Timelines */}
            <div className="space-y-2 mt-4">
              {groupedTimelines.map((group, groupIndex) => {
                const colors = PROJECT_COLORS[group.colorIndex];
                return (
                  <div key={groupIndex} className="mb-6">
                    {/* Project Header Row */}
                    <div 
                      className={`flex items-center ${colors.light} rounded-xl py-3 px-4 mb-2 shadow-sm`}
                      style={{ minWidth: `${200 + minTimelineWidth}px` }}
                    >
                      <div className="w-48 shrink-0 pr-4">
                        <span className={`text-sm font-black ${colors.text}`}>
                          📁 {group.projectName}
                        </span>
                        <p className="text-xs text-slate-500 font-semibold">
                          {group.timelines.length} phase{group.timelines.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div 
                        className="px-2 h-2 bg-white/50 rounded-full"
                        style={{ minWidth: `${minTimelineWidth}px`, flex: 1 }}
                      >
                        <div 
                          className={`h-full bg-gradient-to-r ${colors.bg} rounded-full`}
                          style={{ 
                            width: `${group.timelines.length > 0 
                              ? group.timelines.reduce((sum, t) => sum + t.completion_percentage, 0) / group.timelines.length 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Timeline Rows for this Project */}
                    {group.timelines.map((timeline) => {
                      const normalizedStatus = (timeline.status ?? (timeline.completion_percentage >= 100 ? 'completed' : 'in_progress')).toLowerCase();
                      const isComplete = normalizedStatus === 'completed';
                      const { left, width } = getTimelineBounds(timeline);
                      return (
                        <div 
                          key={timeline.id} 
                          className="relative h-12 group flex hover:bg-purple-50/50 rounded-lg transition-colors"
                          style={{ minWidth: `${192 + minTimelineWidth}px` }}
                        >
                          <div className="w-48 text-xs font-semibold text-slate-600 text-right pr-4 flex items-center justify-end shrink-0 border-r border-transparent group-hover:border-purple-200 transition-colors">
                            <span className="truncate max-w-[180px]" title={timeline.title}>
                              {timeline.title}
                            </span>
                          </div>

                          <div
                            className="relative h-full px-2"
                            style={{ minWidth: `${minTimelineWidth}px`, flex: 1 }}
                          >
                            {/* Month grid lines */}
                            {Array.from({ length: monthGridLineCount }).map((_, i) => {
                              const leftPercent = ((i + 1) / monthSegments) * 100;
                              return (
                                <div
                                  key={i}
                                  className="absolute top-0 bottom-0 border-l border-purple-100/50"
                                  style={{ left: `${leftPercent}%` }}
                                />
                              );
                            })}

                            {/* Timeline Bar */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center text-xs font-bold text-white group-hover:scale-[1.02] overflow-hidden"
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                background: isComplete
                                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                  : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                                minWidth: '50px',
                                height: '28px',
                                borderRadius: '14px',
                              }}
                              title={`${timeline.title}: ${timeline.completion_percentage}% complete`}
                            >
                              <span className="drop-shadow px-2 text-[11px]">{timeline.completion_percentage}%</span>
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

          {loading && (
            <div className="mt-6 p-6 bg-white/80 border-2 border-purple-200 rounded-2xl text-center font-semibold text-slate-600">
              Loading timelines...
            </div>
          )}

          {!loading && filteredTimelines.length === 0 && (
            <div className="mt-6 p-6 bg-white/80 border-2 border-purple-200 rounded-2xl text-center font-semibold text-slate-600">
              No timelines available for the selected criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
