import { useMemo, useCallback } from 'react';
import type { Project } from '../types/csr';

import type { UseProjectFiltersResult } from '../lib/projectFilters';
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

interface AccountsProps {
  projects: Array<{ id: string; name: string; state?: string; start_date?: string }>;
  projectData: Project[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
}

export default function Accounts({ projectData, projectFilters, brandColors, loading }: AccountsProps) {
  const relevantProjects = projectData.filter(project => projectFilters.visibleProjectIds.includes(project.id));
  const parentProjectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projectData.forEach((project) => {
      map.set(project.id, project);
    });
    return map;
  }, [projectData]);

  const getNormalizedBudget = useCallback((project: Project) => {
    const parentProject = project.parent_project_id ? parentProjectMap.get(project.parent_project_id) : undefined;
    const divisor = parentProject ? 2 : 1;
    const source = parentProject ?? project;
    const totalBudget = sanitizeBudgetValue(source?.total_budget) / divisor;
    const utilizedBudget = sanitizeBudgetValue(source?.utilized_budget) / divisor;
    return { totalBudget, utilizedBudget };
  }, [parentProjectMap]);

  const { totalBudget, utilizedBudget } = useMemo(() => {
    return relevantProjects.reduce(
      (acc, project) => {
        const normalized = getNormalizedBudget(project);
        acc.totalBudget += normalized.totalBudget;
        acc.utilizedBudget += normalized.utilizedBudget;
        return acc;
      },
      { totalBudget: 0, utilizedBudget: 0 }
    );
  }, [relevantProjects, getNormalizedBudget]);

  const utilizedPercentage = totalBudget > 0 ? (utilizedBudget / totalBudget) * 100 : 0;
  const pendingPercentage = 100 - utilizedPercentage;
  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

  // Individual project budget data for breakdown
  const projectBudgetData = useMemo(() => {
    return relevantProjects.map((project, index) => {
      const normalized = getNormalizedBudget(project);
      const utilization = normalized.totalBudget > 0 
        ? (normalized.utilizedBudget / normalized.totalBudget) * 100 
        : 0;
      return {
        id: project.id,
        name: project.name,
        location: project.location || 'N/A',
        state: project.state || 'N/A',
        totalBudget: normalized.totalBudget,
        utilizedBudget: normalized.utilizedBudget,
        pendingBudget: normalized.totalBudget - normalized.utilizedBudget,
        utilizationPercent: utilization,
        colorIndex: index % PROJECT_COLORS.length,
      };
    }).sort((a, b) => b.totalBudget - a.totalBudget);
  }, [relevantProjects, getNormalizedBudget]);

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

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-auto rounded-b-3xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            {currentProjectName ? `💰 ${currentProjectName} - Funds Utilization` : '💰 ALL PROJECTS - FUNDS UTILIZATION'}
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
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
        />

        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-emerald-200 p-8 shadow-2xl text-center font-semibold text-slate-600">
            Loading budget utilization...
          </div>
        )}

        {isEmpty && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-emerald-200 p-8 shadow-2xl text-center font-semibold text-slate-600">
            No budget data available for the selected filters.
          </div>
        )}

        {!loading && !isEmpty && (
          <>
            {/* Summary Card with Donut Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-emerald-200 p-8 shadow-2xl mb-8">
              <h3 className="text-xl font-black text-slate-700 mb-6">📊 Overall Budget Summary</h3>
              
              <div className="flex items-center justify-center gap-16 flex-wrap">
                <div className="relative w-72 h-72 group">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  
                  <svg className="relative w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e8f0" strokeWidth="20" />
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
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
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
                      <span className="text-lg font-black text-slate-700">UTILIZED</span>
                    </div>
                    <p className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent ml-9">
                      {formatCurrency(utilizedBudget)}
                    </p>
                  </div>
                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-400 to-rose-600 shadow-md"></div>
                      <span className="text-lg font-black text-slate-700">PENDING</span>
                    </div>
                    <p className="text-3xl font-black bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent ml-9">
                      {formatCurrency(totalBudget - utilizedBudget)}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-500">Total Budget</p>
                    <p className="text-2xl font-black text-slate-800">{formatCurrency(totalBudget)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project-wise Breakdown */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-emerald-200 p-8 shadow-2xl">
              <h3 className="text-xl font-black text-slate-700 mb-6">📁 Project-wise Budget Breakdown</h3>
              
              <div className="space-y-4">
                {projectBudgetData.map((project) => {
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
                      
                      {/* Progress bar */}
                      <div className="h-6 bg-white rounded-full overflow-hidden shadow-inner mb-3">
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
                      </div>
                      
                      {/* Stats row */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                            <span className="font-semibold text-slate-600">
                              Utilized: <span className="text-emerald-600 font-bold">{formatCurrency(project.utilizedBudget)}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-rose-500"></div>
                            <span className="font-semibold text-slate-600">
                              Pending: <span className="text-rose-600 font-bold">{formatCurrency(project.pendingBudget)}</span>
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-lg" style={{ color: project.utilizationPercent >= 80 ? '#10b981' : project.utilizationPercent >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {project.utilizationPercent.toFixed(1)}%
                        </span>
                      </div>
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
