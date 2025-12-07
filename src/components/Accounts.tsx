import { useCallback, useMemo, useState } from 'react';
import type { Project } from '../types/csr';

import type { SelectOption, UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';

// Color palette for projects
const PROJECT_COLORS = [
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', border: 'border-blue-200' },
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', border: 'border-violet-200' },
  { bg: 'from-orange-500 to-amber-600', light: 'bg-orange-50', border: 'border-orange-200' },
  { bg: 'from-pink-500 to-rose-600', light: 'bg-pink-50', border: 'border-pink-200' },
  { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50', border: 'border-cyan-200' },
];

const sanitizeBudgetValue = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const normalizeGroupKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b(phase|part|section|batch)\s*\d+/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const deriveGroupLabel = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Miscellaneous Projects';
  }
  const segments = trimmed.split(/[-–—_:|]/).map((segment) => segment.trim()).filter(Boolean);
  return segments[0] || trimmed;
};

interface ProjectBudgetEntry {
  id: string;
  name: string;
  location: string;
  state: string;
  totalBudget: number;
  utilizedBudget: number;
  pendingBudget: number;
  utilizationPercent: number;
  colorIndex: number;
  groupKey: string;
  sourceName: string;
}

interface ProjectGroupSummary {
  key: string;
  label: string;
  totalBudget: number;
  utilizedBudget: number;
  pendingBudget: number;
  utilizationPercent: number;
  projects: ProjectBudgetEntry[];
  colorIndex: number;
}

interface AccountsProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  projectData: Project[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
  subcompanyOptions?: SelectOption[];
  selectedSubcompany?: string;
  onSubcompanyChange?: (value: string) => void;
}

export default function Accounts({
  projectData,
  projectFilters,
  brandColors,
  loading,
  subcompanyOptions,
  selectedSubcompany,
  onSubcompanyChange,
}: AccountsProps) {
  const relevantProjects = projectData.filter(project => projectFilters.visibleProjectIds.includes(project.id));
  const parentProjectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projectData.forEach((project) => {
      map.set(project.id, project);
    });
    return map;
  }, [projectData]);

  const resolveGroupingSource = useCallback((project: Project) => {
    if (project.parent_project_id) {
      const parentProject = parentProjectMap.get(project.parent_project_id);
      return parentProject?.name ?? project.name;
    }
    return project.name;
  }, [parentProjectMap]);

  const colorIndexMap = useMemo(() => {
    const keys = new Set<string>();
    relevantProjects.forEach((project) => {
      const sourceName = resolveGroupingSource(project);
      const normalized = normalizeGroupKey(sourceName) || sourceName.toLowerCase();
      keys.add(normalized);
    });
    const sortedKeys = Array.from(keys).sort();
    const map = new Map<string, number>();
    sortedKeys.forEach((key, index) => map.set(key, index % PROJECT_COLORS.length));
    return map;
  }, [relevantProjects, resolveGroupingSource]);

  const subProjectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projectData.forEach((project) => {
      if (project.parent_project_id) {
        counts.set(project.parent_project_id, (counts.get(project.parent_project_id) || 0) + 1);
      }
    });
    return counts;
  }, [projectData]);

  const getNormalizedBudget = useCallback((project: Project) => {
    const parentProject = project.parent_project_id ? parentProjectMap.get(project.parent_project_id) : undefined;
    const source = parentProject ?? project;
    const divisor = project.parent_project_id ? Math.max(subProjectCounts.get(project.parent_project_id) || 1, 1) : 1;
    const totalBudget = sanitizeBudgetValue(source?.total_budget) / divisor;
    const utilizedBudget = sanitizeBudgetValue(source?.utilized_budget) / divisor;
    return { totalBudget, utilizedBudget };
  }, [parentProjectMap, subProjectCounts]);

  const budgetSummary = useMemo(() => {
    let total = 0;
    let utilized = 0;
    relevantProjects.forEach((project) => {
      const normalized = getNormalizedBudget(project);
      total += normalized.totalBudget;
      utilized += normalized.utilizedBudget;
    });
    const remaining = total - utilized;
    const percentage = total > 0 ? (utilized / total) * 100 : 0;
    return { total, utilized, remaining, percentage };
  }, [relevantProjects, getNormalizedBudget]);

  const utilizedPercentage = budgetSummary.percentage;
  const pendingPercentage = 100 - utilizedPercentage;
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

  // Individual project budget data for breakdown
  const projectBudgetData = useMemo<ProjectBudgetEntry[]>(() => {
    return relevantProjects.map((project) => {
      const normalized = getNormalizedBudget(project);
      const utilization = normalized.totalBudget > 0
        ? (normalized.utilizedBudget / normalized.totalBudget) * 100
        : 0;
      const sourceName = resolveGroupingSource(project);
      const groupKey = normalizeGroupKey(sourceName) || sourceName.toLowerCase();
      const groupColor = colorIndexMap.get(groupKey) ?? 0;
      return {
        id: project.id,
        name: project.name,
        location: project.location || 'N/A',
        state: project.state || 'N/A',
        totalBudget: normalized.totalBudget,
        utilizedBudget: normalized.utilizedBudget,
        pendingBudget: normalized.totalBudget - normalized.utilizedBudget,
        utilizationPercent: utilization,
        colorIndex: groupColor,
        groupKey,
        sourceName,
      };
    }).sort((a, b) => b.totalBudget - a.totalBudget);
  }, [relevantProjects, getNormalizedBudget, resolveGroupingSource, colorIndexMap]);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const groupedProjectBudgetData = useMemo<ProjectGroupSummary[]>(() => {
    const groups = new Map<string, ProjectGroupSummary>();

    projectBudgetData.forEach((project) => {
      const sourceName = project.sourceName;
      const groupKey = project.groupKey;
      const existing = groups.get(groupKey);
      if (existing) {
        existing.projects.push(project);
        existing.totalBudget += project.totalBudget;
        existing.utilizedBudget += project.utilizedBudget;
        existing.pendingBudget = existing.totalBudget - existing.utilizedBudget;
        existing.utilizationPercent = existing.totalBudget > 0 ? (existing.utilizedBudget / existing.totalBudget) * 100 : 0;
        return;
      }

      groups.set(groupKey, {
        key: groupKey,
        label: deriveGroupLabel(sourceName),
        totalBudget: project.totalBudget,
        utilizedBudget: project.utilizedBudget,
        pendingBudget: project.totalBudget - project.utilizedBudget,
        utilizationPercent: project.utilizationPercent,
        projects: [project],
        colorIndex: project.colorIndex,
      });
    });

    return Array.from(groups.values()).sort((a, b) => b.totalBudget - a.totalBudget);
  }, [projectBudgetData]);

  const circumference = 2 * Math.PI * 90;
  const utilizedOffset = circumference - (utilizedPercentage / 100) * circumference;
  const pendingOffset = circumference - (pendingPercentage / 100) * circumference;

  const isEmpty = !loading && relevantProjects.length === 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)} K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const renderProjectCard = (project: ProjectBudgetEntry) => {
    const colors = PROJECT_COLORS[project.colorIndex];
    return (
      <div
        key={project.id}
        className={`p-5 rounded-2xl ${colors.light} ${colors.border} border-2 hover:shadow-lg transition-all`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="text-lg font-black text-slate-800">{project.name}</h4>
            <p className="text-xs font-semibold text-slate-500">
              📍 {project.location}, {project.state}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-800">{formatCurrency(project.totalBudget)}</p>
            <p className="text-xs font-semibold text-slate-500">Total Budget</p>
          </div>
        </div>

        <div className="h-6 bg-card rounded-full overflow-hidden shadow-inner mb-3">
          {project.utilizationPercent > 0 ? (
            <div
              className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
              style={{ width: `${Math.max(project.utilizationPercent, 3)}%` }}
            >
              {project.utilizationPercent > 15 && (
                <span className="text-xs font-bold text-white drop-shadow">
                  {project.utilizationPercent.toFixed(0)}%
                </span>
              )}
            </div>
          ) : (
            <div className="h-full w-full" aria-hidden="true" />
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <span className="font-semibold text-muted-foreground">
                Utilized: <span className="text-emerald-600 font-bold">{formatCurrency(project.utilizedBudget)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500"></div>
              <span className="font-semibold text-muted-foreground">
                Pending: <span className="text-orange-600 font-bold">{formatCurrency(project.pendingBudget)}</span>
              </span>
            </div>
          </div>
          <span className="font-black text-lg" style={{ color: project.utilizationPercent >= 80 ? '#10b981' : project.utilizationPercent >= 50 ? '#f59e0b' : '#ef4444' }}>
            {project.utilizationPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-background min-h-0">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-2">
            {currentProjectName ? `💰 ${currentProjectName}` : '💰 Budget Utilization'}
          </h1>
          <p className="text-muted-foreground dark:text-slate-400 text-lg">
            {currentProjectName ? 'Project-specific budget data' : 'Combined budget from all projects'}
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

        {loading && (
          <div className="bg-card rounded-xl border border-border p-8 shadow-md text-center font-semibold text-muted-foreground">
            Loading budget utilization...
          </div>
        )}

        {isEmpty && (
          <div className="bg-card rounded-xl border border-border p-8 shadow-md text-center font-semibold text-muted-foreground">
            No budget data available for the selected filters.
          </div>
        )}

        {!loading && !isEmpty && (
          <>
            {/* Summary Card with Donut Chart */}
            <div className="bg-card rounded-xl border border-border p-8 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all mb-8">
              <h3 className="text-xl font-black text-card-foreground mb-6">📊 Overall Budget Summary</h3>
              
              <div className="flex items-center justify-center gap-16 flex-wrap">
                <div className="relative w-72 h-72 group">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  
                  <svg className="relative w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="20" />
                    <circle
                      cx="100" cy="100" r="90" fill="none"
                      stroke="url(#gradient-utilized)" strokeWidth="20"
                      strokeDasharray={circumference} strokeDashoffset={utilizedOffset}
                      strokeLinecap="round" className="transition-all duration-1000"
                    />
                    <circle
                      cx="100" cy="100" r="90" fill="none"
                      stroke="url(#gradient-pending)" strokeWidth="20"
                      strokeDasharray={circumference} strokeDashoffset={pendingOffset}
                      strokeLinecap="round"
                      transform={`rotate(${(utilizedPercentage / 100) * 360} 100 100)`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient-utilized" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="gradient-pending" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                        {utilizedPercentage.toFixed(0)}%
                      </p>
                      <p className="text-xs font-bold text-slate-500 mt-1">UTILIZED</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 shadow-md"></div>
                      <span className="text-lg font-black text-card-foreground">UTILIZED</span>
                    </div>
                    <p className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent ml-9">
                      {formatCurrency(budgetSummary.utilized)}
                    </p>
                  </div>
                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md"></div>
                      <span className="text-lg font-black text-card-foreground">PENDING</span>
                    </div>
                    <p className="text-3xl font-black bg-gradient-to-r from-orange-600 to-orange-600 bg-clip-text text-transparent ml-9">
                      {formatCurrency(budgetSummary.total - budgetSummary.utilized)}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-semibold text-slate-500">Total Budget</p>
                    <p className="text-2xl font-black text-slate-800">{formatCurrency(budgetSummary.total)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project-wise Breakdown */}
            <div className="bg-card rounded-xl border border-border p-8 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all">
              <h3 className="text-xl font-black text-card-foreground mb-6">📁 Project-wise Budget Breakdown</h3>
              
              <div className="space-y-6">
                {groupedProjectBudgetData.map((group) => {
                  const colors = PROJECT_COLORS[group.colorIndex];
                  const isCollapsed = collapsedGroups[group.key] ?? true;

                  if (group.projects.length === 1) {
                    return renderProjectCard(group.projects[0]);
                  }

                  return (
                    <div key={group.key} className="space-y-4">
                      <div
                        className={`p-5 rounded-2xl ${colors.light} ${colors.border} border-2 shadow-sm cursor-pointer hover:shadow-md transition-all`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleGroup(group.key);
                          }
                        }}
                        onClick={() => toggleGroup(group.key)}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className="text-lg font-black text-slate-800">{group.label}</h4>
                            <p className="text-xs text-muted-foreground">{group.projects.length} projects grouped</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-slate-800">{formatCurrency(group.totalBudget)}</p>
                            <p className="text-xs font-semibold text-slate-500">Group Total Budget</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs uppercase tracking-wide">
                          <div>
                            <p className="text-muted-foreground">Utilized</p>
                            <p className="font-black text-emerald-600">{formatCurrency(group.utilizedBudget)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pending</p>
                            <p className="font-black text-orange-600">{formatCurrency(group.pendingBudget)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Utilization</p>
                            <p className="font-black text-slate-800">{group.utilizationPercent.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="mt-4 h-2 bg-card rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${colors.bg}`}
                            style={{ width: `${Math.max(group.utilizationPercent, 3)}%` }}
                          ></div>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div className="space-y-4 pl-3 border-l border-dashed border-border">
                          {group.projects.map((project) => renderProjectCard(project))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
