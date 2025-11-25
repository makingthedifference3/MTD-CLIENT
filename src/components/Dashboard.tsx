import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../types/csr';
import { calculateDashboardMetrics } from '../lib/metrics';
import { getBrandColors } from '../lib/logodev';
import { X } from 'lucide-react';

interface DashboardProps {
  selectedProject: string | null;
  projects: Project[];
  loading?: boolean;
}

type SelectOption = { value: string; label: string };

interface DashboardMetrics {
  beneficiaries: { current: number; target: number };
  budget: { current: number; target: number };
  projects_active: { current: number; target: number };
  [key: string]: { current: number; target: number };
}

interface MetricBreakdown {
  project: string;
  location: string;
  value: number;
}

export default function Dashboard({ selectedProject, projects, loading }: DashboardProps) {
  const { partner } = useAuth();
  const [selectedState, setSelectedState] = useState('ALL STATES');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    beneficiaries: { current: 0, target: 0 },
    budget: { current: 0, target: 0 },
    projects_active: { current: 0, target: 0 },
  });
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('all');
  const [projectDateFilter, setProjectDateFilter] = useState('together');

  // Get brand colors based on partner's primary color
  const brandColors = partner ? getBrandColors(partner.primary_color || '#2563eb') : null;

  const states = useMemo(() => {
    if (!partner) return [] as string[];
    return Array.from(new Set(projects.map((project) => project.state).filter(Boolean))) as string[];
  }, [partner, projects]);

  const normalizeDateValue = (value?: string) => {
    if (!value) return 'unknown';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'unknown' : parsed.toISOString().slice(0, 10);
  };

  const projectGroups = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach((project) => {
      const name = project.name || 'Unnamed Project';
      if (!map.has(name)) {
        map.set(name, []);
      }
      map.get(name)!.push(project);
    });
    return map;
  }, [projects]);

  const projectGroupOptions = useMemo<SelectOption[]>(
    () =>
      Array.from(projectGroups.keys())
        .sort()
        .map((name) => ({ value: name, label: name })),
    [projectGroups]
  );

  useEffect(() => {
    if (!selectedProject) {
      setSelectedProjectGroup('all');
      setProjectDateFilter('together');
      return;
    }
    const project = projects.find((item) => item.id === selectedProject);
    if (project) {
      setSelectedProjectGroup(project.name || 'Unnamed Project');
      setProjectDateFilter('together');
    }
  }, [selectedProject, projects]);

  const selectedGroupProjects =
    selectedProjectGroup === 'all'
      ? projects
      : projectGroups.get(selectedProjectGroup) ?? [];

  const projectDateOptions = useMemo<SelectOption[]>(() => {
    if (selectedProjectGroup === 'all') return [];
    const activeGroup = projectGroups.get(selectedProjectGroup) ?? [];
    if (activeGroup.length <= 1) return [];
    const unique = new Map<string, string>();
    activeGroup.forEach((project) => {
      const value = normalizeDateValue(project.start_date);
      if (!unique.has(value)) {
        unique.set(
          value,
          value === 'unknown'
            ? 'Date unavailable'
            : new Date(value).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        );
      }
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [projectGroups, selectedProjectGroup]);

  const filteredProjects = useMemo(() => {
    const stateConstraint = selectedState === 'ALL STATES' ? undefined : selectedState;
    let workingSet = selectedGroupProjects;
    if (stateConstraint) {
      workingSet = workingSet.filter((project) => project.state === stateConstraint);
    }
    if (selectedProjectGroup !== 'all' && projectDateFilter !== 'together') {
      workingSet = workingSet.filter((project) => normalizeDateValue(project.start_date) === projectDateFilter);
    }
    return workingSet;
  }, [selectedGroupProjects, selectedState, selectedProjectGroup, projectDateFilter]);

  useEffect(() => {
    if (!partner) return;

    const partnerProjects = filteredProjects.filter((project) => project.csr_partner_id === partner.id);
    const newMetrics = calculateDashboardMetrics(partnerProjects);
    setMetrics(newMetrics as DashboardMetrics);
  }, [filteredProjects, partner]);

  // Get breakdown data for a metric
  const getMetricBreakdown = (metricKey: string): MetricBreakdown[] => {
    if (!partner) return [];

    const relevantProjects = filteredProjects.filter((project) => project.csr_partner_id === partner.id);

    const breakdown: MetricBreakdown[] = [];

    relevantProjects.forEach(project => {
      if (metricKey === 'beneficiaries') {
        breakdown.push({
          project: project.name,
          location: `${project.location}, ${project.state}`,
          value: project.beneficiaries_current
        });
      } else if (metricKey === 'budget') {
        breakdown.push({
          project: project.name,
          location: `${project.location}, ${project.state}`,
          value: project.utilized_budget
        });
      } else if (project.project_metrics) {
        const metricValue = project.project_metrics[metricKey as keyof typeof project.project_metrics];
        if (metricValue) {
          breakdown.push({
            project: project.name,
            location: `${project.location}, ${project.state}`,
            value: metricValue.current
          });
        }
      }
    });

    return breakdown.filter(b => b.value > 0);
  };

  // Get metric title for modal
  const getMetricTitle = (key: string): string => {
    const titles: Record<string, string> = {
      beneficiaries: 'Total Beneficiaries',
      budget: 'Budget Utilized',
      pads_donated: 'Pads Donated',
      sessions_conducted: 'Sessions Conducted',
      students_enrolled: 'Students Enrolled',
      schools_renovated: 'Schools Renovated',
      libraries_setup: 'Libraries Setup',
      scholarships_given: 'Scholarships Given',
      meals_distributed: 'Meals Distributed',
      ration_kits_distributed: 'Ration Kits Distributed',
      families_fed: 'Families Fed',
      waste_collected_kg: 'Waste Collected (KG)',
      trees_planted: 'Trees Planted',
      plastic_recycled_kg: 'Plastic Recycled (KG)',
      communities_covered: 'Communities Covered'
    };
    return titles[key] || key;
  };

  // Dynamic background based on brand color
  const bgStyle = brandColors ? {
    background: `linear-gradient(135deg, ${brandColors.lighter}15, ${brandColors.primary}08, ${brandColors.darker}15)`
  } : {};

  const isEmpty = !loading && projects.length === 0;

  return (
    <div className="flex-1 overflow-auto rounded-b-3xl" style={bgStyle}>
      <div className="p-8">
        {/* Header with Company Badge */}
        <div className="mb-8 flex items-center gap-6">
          {/* Animated Badge Icon */}
          <div 
            className="relative group"
          >
            <div 
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-offset-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
              style={{ 
                background: brandColors?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '--tw-ring-color': brandColors?.lighter || '#faf5ff'
              } as CSSProperties}
            >
              <span className="text-5xl filter drop-shadow-lg">📊</span>
            </div>
            {/* Pulse effect */}
            <div 
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
              style={{ 
                background: brandColors?.primary || '#667eea',
                filter: 'blur(20px)',
                animation: 'pulse 2s infinite'
              }}
            ></div>
          </div>
          <div className="flex-1">
            <h2 
              className="text-3xl font-black"
              style={{ color: brandColors?.primary || '#6366f1' }}
            >
              Dashboard
            </h2>
            <p className="text-slate-600 font-semibold mt-1">
              Real-time CSR impact metrics for {partner?.company_name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project</p>
              <select
                value={selectedProjectGroup}
                onChange={(e) => {
                  setSelectedProjectGroup(e.target.value);
                  setProjectDateFilter('together');
                }}
                className="mt-1 px-5 py-3 bg-white/80 border-2 rounded-2xl font-semibold text-xs uppercase tracking-wide focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                style={{
                  borderColor: brandColors?.primary || '#a78bfa',
                  '--tw-ring-color': brandColors?.primary || '#a78bfa',
                } as CSSProperties}
              >
                <option value="all">All Projects</option>
                {projectGroupOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {(selectedProjectGroup !== 'all' && (projectGroups.get(selectedProjectGroup)?.length ?? 0) > 1) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date</p>
                <select
                  value={projectDateFilter}
                  onChange={(e) => setProjectDateFilter(e.target.value)}
                  className="mt-1 px-5 py-3 bg-white/80 border-2 rounded-2xl font-semibold text-xs uppercase tracking-wide focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  style={{
                    borderColor: brandColors?.primary || '#a78bfa',
                    '--tw-ring-color': brandColors?.primary || '#a78bfa',
                  } as CSSProperties}
                >
                  <option value="together">Together</option>
                  {projectDateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">State</p>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="mt-1 px-6 py-3 bg-white/80 border-2 rounded-2xl font-semibold text-sm uppercase tracking-wide focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              style={{ 
                borderColor: brandColors?.primary || '#a78bfa',
                '--tw-ring-color': brandColors?.primary || '#a78bfa'
              } as CSSProperties}
            >
              <option value="ALL STATES">ALL STATES</option>
              {states.map((state) => (
                <option key={state} value={state || ''}>
                  {state?.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="p-6 bg-white/80 border-2 border-slate-200 rounded-2xl text-center font-semibold text-slate-600">
            Loading latest project metrics...
          </div>
        )}

        {isEmpty && (
          <div className="p-6 bg-white/80 border-2 border-slate-200 rounded-2xl text-center font-semibold text-slate-600">
            No projects available for the selected filters yet.
          </div>
        )}

        {!loading && !isEmpty && (
          <div className="grid grid-cols-3 gap-6">
          {/* Always show these core metrics */}
          <MetricCard
            title="👥 TOTAL BENEFICIARIES"
            current={metrics.beneficiaries.current}
            target={metrics.beneficiaries.target}
            gradient="from-emerald-100 via-teal-100 to-cyan-100"
            onClick={() => setSelectedMetric('beneficiaries')}
          />
          <MetricCard
            title="📊 PROJECTS ACTIVE"
            current={metrics.projects_active.current}
            target={metrics.projects_active.target}
            gradient="from-violet-100 via-purple-100 to-fuchsia-100"
          />
          <MetricCard
            title="💰 BUDGET UTILIZED"
            current={metrics.budget.current}
            target={metrics.budget.target}
            gradient="from-amber-100 via-yellow-100 to-orange-100"
            isCurrency
            onClick={() => setSelectedMetric('budget')}
          />

          {/* Project-specific metrics */}
          {metrics.pads_donated && (
            <MetricCard
              title="🩺 PADS DONATED"
              current={metrics.pads_donated.current}
              target={metrics.pads_donated.target}
              gradient="from-pink-100 via-rose-100 to-red-100"
              onClick={() => setSelectedMetric('pads_donated')}
            />
          )}
          {metrics.sessions_conducted && (
            <MetricCard
              title="📚 SESSIONS CONDUCTED"
              current={metrics.sessions_conducted.current}
              target={metrics.sessions_conducted.target}
              gradient="from-purple-100 via-violet-100 to-indigo-100"
              onClick={() => setSelectedMetric('sessions_conducted')}
            />
          )}
          {metrics.students_enrolled && (
            <MetricCard
              title="🎓 STUDENTS ENROLLED"
              current={metrics.students_enrolled.current}
              target={metrics.students_enrolled.target}
              gradient="from-blue-100 via-indigo-100 to-violet-100"
              onClick={() => setSelectedMetric('students_enrolled')}
            />
          )}
          {metrics.schools_renovated && (
            <MetricCard
              title="🏫 SCHOOLS RENOVATED"
              current={metrics.schools_renovated.current}
              target={metrics.schools_renovated.target}
              gradient="from-cyan-100 via-sky-100 to-blue-100"
              onClick={() => setSelectedMetric('schools_renovated')}
            />
          )}
          {metrics.libraries_setup && (
            <MetricCard
              title="📖 LIBRARIES SETUP"
              current={metrics.libraries_setup.current}
              target={metrics.libraries_setup.target}
              gradient="from-teal-100 via-emerald-100 to-green-100"
              onClick={() => setSelectedMetric('libraries_setup')}
            />
          )}
          {metrics.scholarships_given && (
            <MetricCard
              title="🎯 SCHOLARSHIPS GIVEN"
              current={metrics.scholarships_given.current}
              target={metrics.scholarships_given.target}
              gradient="from-orange-100 via-amber-100 to-yellow-100"
              onClick={() => setSelectedMetric('scholarships_given')}
            />
          )}
          {metrics.meals_distributed && (
            <MetricCard
              title="�️ MEALS DISTRIBUTED"
              current={metrics.meals_distributed.current}
              target={metrics.meals_distributed.target}
              gradient="from-lime-100 via-green-100 to-emerald-100"
              onClick={() => setSelectedMetric('meals_distributed')}
            />
          )}
          {metrics.ration_kits_distributed && (
            <MetricCard
              title="📦 RATION KITS"
              current={metrics.ration_kits_distributed.current}
              target={metrics.ration_kits_distributed.target}
              gradient="from-yellow-100 via-lime-100 to-green-100"
              onClick={() => setSelectedMetric('ration_kits_distributed')}
            />
          )}
          {metrics.families_fed && (
            <MetricCard
              title="👨‍👩‍👧‍👦 FAMILIES FED"
              current={metrics.families_fed.current}
              target={metrics.families_fed.target}
              gradient="from-green-100 via-teal-100 to-cyan-100"
              onClick={() => setSelectedMetric('families_fed')}
            />
          )}
          {metrics.waste_collected_kg && (
            <MetricCard
              title="♻️ WASTE COLLECTED (KG)"
              current={metrics.waste_collected_kg.current}
              target={metrics.waste_collected_kg.target}
              gradient="from-emerald-100 via-green-100 to-lime-100"
              onClick={() => setSelectedMetric('waste_collected_kg')}
            />
          )}
          {metrics.trees_planted && (
            <MetricCard
              title="🌳 TREES PLANTED"
              current={metrics.trees_planted.current}
              target={metrics.trees_planted.target}
              gradient="from-green-100 via-emerald-100 to-teal-100"
              onClick={() => setSelectedMetric('trees_planted')}
            />
          )}
          {metrics.plastic_recycled_kg && (
            <MetricCard
              title="♻️ PLASTIC RECYCLED (KG)"
              current={metrics.plastic_recycled_kg.current}
              target={metrics.plastic_recycled_kg.target}
              gradient="from-sky-100 via-cyan-100 to-teal-100"
              onClick={() => setSelectedMetric('plastic_recycled_kg')}
            />
          )}
          {metrics.communities_covered && (
            <MetricCard
              title="🏘️ COMMUNITIES COVERED"
              current={metrics.communities_covered.current}
              target={metrics.communities_covered.target}
              gradient="from-indigo-100 via-purple-100 to-pink-100"
              onClick={() => setSelectedMetric('communities_covered')}
            />
          )}
          </div>
        )}

        {/* Modal for Metric Breakdown */}
        {selectedMetric && metrics[selectedMetric] && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8"
            onClick={() => setSelectedMetric(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div 
                className="p-6 border-b-2 flex items-center justify-between"
                style={{ 
                  background: brandColors?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderColor: brandColors?.primary || '#667eea'
                }}
              >
                <h3 className="text-2xl font-black text-white drop-shadow-lg">
                  📊 {getMetricTitle(selectedMetric)} - Distribution
                </h3>
                <button
                  onClick={() => setSelectedMetric(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                      {getMetricBreakdown(selectedMetric).map((item, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-2xl border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-lg">{item.project}</p>
                          <p className="text-sm text-slate-600 font-semibold mt-1">📍 {item.location}</p>
                        </div>
                        <div className="text-right">
                          <p 
                            className="text-3xl font-black"
                            style={{ color: brandColors?.primary || '#667eea' }}
                          >
                            {selectedMetric === 'budget' 
                              ? `₹${(item.value / 100000).toFixed(1)}L`
                              : item.value.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div 
                  className="mt-6 p-6 rounded-2xl border-2"
                  style={{ 
                    borderColor: brandColors?.primary || '#667eea',
                    background: `${brandColors?.primary || '#667eea'}10`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-black text-lg text-slate-700">Total</p>
                    <p 
                      className="text-4xl font-black"
                      style={{ color: brandColors?.primary || '#667eea' }}
                    >
                      {selectedMetric === 'budget' 
                        ? `₹${(metrics[selectedMetric].current / 100000).toFixed(1)}L`
                        : metrics[selectedMetric].current.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  current,
  target,
  gradient = 'from-blue-50 to-indigo-100',
  isCurrency = false,
  onClick
}: {
  title: string;
  current: number;
  target: number;
  gradient?: string;
  isCurrency?: boolean;
  onClick?: () => void;
}) {
  const percentage = Math.min((current / target) * 100, 100);
  
  // Format number for display
  const formatNumber = (num: number) => {
    if (isCurrency) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    return num.toLocaleString();
  };
  
  // Extract border color from gradient class
  const getBorderColor = () => {
    if (gradient.includes('emerald')) return '#10b981';
    if (gradient.includes('violet') || gradient.includes('purple') || gradient.includes('fuchsia')) return '#a855f7';
    if (gradient.includes('rose') || gradient.includes('pink') || gradient.includes('red')) return '#f43f5e';
    if (gradient.includes('amber') || gradient.includes('yellow') || gradient.includes('orange')) return '#f59e0b';
    if (gradient.includes('sky') || gradient.includes('blue') || gradient.includes('indigo')) return '#3b82f6';
    if (gradient.includes('lime') || gradient.includes('green')) return '#22c55e';
    return '#3b82f6'; // default blue
  };
  
  return (
    <div 
      className="relative overflow-hidden rounded-3xl p-6 transition-all duration-500 group backdrop-blur-xl shadow-2xl cursor-pointer"
      style={{
        border: `2px solid ${getBorderColor()}40`
      }}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Premium Glass Morphism Background */}
      <div 
        className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))`,
        }}
      ></div>
      
      {/* Subtle Gradient Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500`}
      ></div>
      
      {/* Animated Light Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/30 rounded-full blur-3xl group-hover:scale-150 group-hover:bg-white/40 transition-all duration-700"></div>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </div>
      
      <h3 className="relative text-xs font-extrabold text-slate-800/90 mb-5 uppercase tracking-widest drop-shadow-sm">
        {title}
      </h3>
      
      <div className="relative text-center">
        <p className="text-5xl font-black mb-4" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}>
          {formatNumber(current)}
          <span className="text-2xl text-slate-400/80 font-bold mx-1">/</span>
          <span className="text-3xl font-bold text-slate-500/70">{formatNumber(target)}</span>
        </p>
        
        {/* Premium Progress Bar */}
        <div className="relative mt-4 h-3 bg-gradient-to-r from-slate-200/50 to-slate-300/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/40 shadow-inner">
          <div 
            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out relative overflow-hidden shadow-lg`}
            style={{ width: `${percentage}%` }}
          >
            {/* Glossy Shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent"></div>
            {/* Animated Pulse */}
            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
          </div>
        </div>
        
        {/* Percentage Badge */}
        <div className="mt-3 inline-block px-3 py-1 rounded-full bg-white/60 backdrop-blur-md border border-white/50 shadow-lg">
          <span className="text-xs font-bold text-slate-700">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
