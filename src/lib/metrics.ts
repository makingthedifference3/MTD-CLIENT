import type { Project } from '../types/csr';

export type DashboardMetricMap = Record<string, { current: number; target: number }>;

interface MetricOptions {
  projectId?: string | null;
  state?: string | null;
  expenseTotals?: Record<string, number>;
}

const getProjectActualUtilized = (project: Project, expenseTotals?: Record<string, number>) => {
  const actual = expenseTotals?.[project.id] ?? 0;
  return actual > 0 ? actual : project.utilized_budget ?? 0;
};

export function calculateDashboardMetrics(
  projects: Project[],
  options?: MetricOptions
): DashboardMetricMap {
  const { projectId, state, expenseTotals } = options ?? {};

  let filtered = projects;

  if (projectId && projectId !== 'all') {
    filtered = filtered.filter((project) => project.id === projectId);
  }

  if (state && state !== 'all') {
    filtered = filtered.filter((project) => project.state === state);
  }

  // Calculate beneficiaries from dedicated columns
  const beneficiaryComponents = ['direct_beneficiaries', 'indirect_beneficiaries', 'male_beneficiaries', 'female_beneficiaries', 'children_beneficiaries'] as const;
  type BeneficiaryComponentKey = (typeof beneficiaryComponents)[number];
  const totalBeneficiaries = filtered.reduce((sum, project) => {
    return sum + beneficiaryComponents.reduce((partial, key: BeneficiaryComponentKey) => partial + (project[key] ?? 0), 0);
  }, 0);
  const targetBeneficiaries = filtered.reduce((sum, project) => sum + (project.beneficiaries_target ?? 0), 0);
  
  // Calculate budget
  const totalBudget = filtered.reduce((sum, project) => sum + (project.total_budget ?? 0), 0);
  const utilizedBudget = filtered.reduce((sum, project) => sum + getProjectActualUtilized(project, expenseTotals), 0);

  // Initialize base metrics
  const aggregated: DashboardMetricMap = {
    beneficiaries: { current: totalBeneficiaries, target: targetBeneficiaries || totalBeneficiaries },
    budget: { current: utilizedBudget, target: totalBudget || 1 },
    projects_active: {
      current: filtered.filter((project) => project.status === 'active').length,
      target: filtered.length || 1,
    },
  };

  const allMetricKeys = [
    'pads_distributed',
    'trees_planted',
    'meals_served',
    'students_enrolled',
    'schools_renovated',
    'sessions_conducted',
    'libraries_setup',
    'scholarships_given',
    'ration_kits_distributed',
    'families_fed',
    'waste_collected_kg',
    'plastic_recycled_kg',
    'communities_covered',
  ] as const;

  // Initialize all metric keys
  allMetricKeys.forEach((key) => {
    aggregated[key] = { current: 0, target: 0 };
  });

  // Aggregate metrics from project_metrics JSONB
  filtered.forEach((project) => {
    if (!project.project_metrics) {
      return;
    }

    Object.entries(project.project_metrics).forEach(([key, value]) => {
      if (key === 'projects_active') {
        if (value.target > 0) {
          aggregated[key].target = value.target;
        }
        return;
      }

      if (!aggregated[key]) {
        aggregated[key] = { current: 0, target: 0 };
      }

      if (value.target > 0) {
        aggregated[key].target += value.target;
      }
      aggregated[key].current += value.current ?? 0;
    });
  });

  // For each metric, if target is 0 but current > 0, set target = current
  Object.keys(aggregated).forEach((key) => {
    if (aggregated[key].target === 0 && aggregated[key].current > 0) {
      aggregated[key].target = aggregated[key].current;
    }
  });

  return aggregated;
}
