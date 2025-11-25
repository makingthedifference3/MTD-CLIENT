import type { Project } from '../types/csr';

export type DashboardMetricMap = Record<string, { current: number; target: number }>;

interface MetricOptions {
  projectId?: string | null;
  state?: string | null;
}

export function calculateDashboardMetrics(
  projects: Project[],
  options?: MetricOptions
): DashboardMetricMap {
  const { projectId, state } = options ?? {};

  let filtered = projects;

  if (projectId && projectId !== 'all') {
    filtered = filtered.filter((project) => project.id === projectId);
  }

  if (state && state !== 'all') {
    filtered = filtered.filter((project) => project.state === state);
  }

  const beneficiaryComponents = ['direct_beneficiaries', 'indirect_beneficiaries', 'male_beneficiaries', 'female_beneficiaries', 'children_beneficiaries'] as const;
  type BeneficiaryComponentKey = (typeof beneficiaryComponents)[number];
  const totalBeneficiaries = filtered.reduce((sum, project) => {
    return sum + beneficiaryComponents.reduce((partial, key: BeneficiaryComponentKey) => partial + (project[key] ?? 0), 0);
  }, 0);
  const targetBeneficiaries = filtered.reduce((sum, project) => sum + (project.beneficiaries_target ?? 0), 0);
  const totalBudget = filtered.reduce((sum, project) => sum + (project.total_budget ?? 0), 0);
  const utilizedBudget = filtered.reduce((sum, project) => sum + (project.utilized_budget ?? 0), 0);

  const aggregated: DashboardMetricMap = {
    beneficiaries: { current: totalBeneficiaries, target: targetBeneficiaries },
    budget: { current: utilizedBudget, target: totalBudget || 1 },
    projects_active: {
      current: filtered.filter((project) => project.status === 'active').length,
      target: filtered.length || 1,
    },
  };

  filtered.forEach((project) => {
    if (!project.project_metrics) return;
    Object.entries(project.project_metrics).forEach(([key, value]) => {
      if (!aggregated[key]) {
        aggregated[key] = { current: 0, target: 0 };
      }
      aggregated[key].current += value.current ?? 0;
      aggregated[key].target += value.target ?? 0;
    });
  });

  const directMetricKeys = ['pads_distributed', 'trees_planted', 'meals_served', 'students_enrolled', 'schools_renovated'] as const;
  type DirectMetricKey = (typeof directMetricKeys)[number];
  directMetricKeys.forEach((key: DirectMetricKey) => {
    const metricTotal = filtered.reduce((sum, project) => sum + (project[key] ?? 0), 0);
    if (metricTotal > 0) {
      aggregated[key] = { current: metricTotal, target: metricTotal };
    }
  });

  return aggregated;
}
