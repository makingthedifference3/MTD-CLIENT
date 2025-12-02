import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import type { Project, Toll } from '../types/csr';
import { calculateDashboardMetrics } from '../lib/metrics';
import { getBrandColors } from '../lib/logodev';
import { X, Edit2, Save, Users, TrendingUp, IndianRupee, Heart, BookOpen, GraduationCap, School, Library, Award, UtensilsCrossed, Package, Home, Trash2, TreePine, Recycle, Building2, Target } from 'lucide-react';
import { SkeletonGrid } from './Skeleton';
import ProjectFilterBar from './ProjectFilterBar';

interface DashboardProps {
  selectedProject: string | null;
  projects: Project[];
  loading?: boolean;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => Promise<void>;
  tolls?: Toll[];
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

export default function Dashboard({ selectedProject, projects, loading, onUpdateProject, tolls = [] }: DashboardProps) {
  const { partner, user } = useAuth();
  const { addToast } = useToast();
  const [selectedState, setSelectedState] = useState('ALL STATES');
  const [selectedToll, setSelectedToll] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ current: 0, target: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    beneficiaries: { current: 0, target: 0 },
    budget: { current: 0, target: 0 },
    projects_active: { current: 0, target: 0 },
  });
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('all');
  const isTollUser = Boolean(user?.toll_id);
  const canEditMetrics = Boolean(onUpdateProject && user?.role !== 'client');

  // Get brand colors based on partner's primary color
  const brandColors = partner ? getBrandColors(partner.primary_color || '#059669') : null;
  const partnerDisplayName = partner?.company_name || partner?.name || 'Client';
  const tollSuffix = user?.toll_id && partner?.toll_name ? ` (${partner.toll_name})` : '';

  const states = useMemo(() => {
    if (!partner) return [] as string[];
    return Array.from(new Set(projects.map((project) => project.state).filter(Boolean))) as string[];
  }, [partner, projects]);

  const tollOptions = useMemo<SelectOption[]>(() => {
    return tolls.map(t => ({ value: t.id, label: t.toll_name }));
  }, [tolls]);
  const tollFilterEnabled = !isTollUser && tollOptions.length > 0;

  const tollFilteredProjects = useMemo(() => {
    if (selectedToll === 'all') return projects;
    return projects.filter(p => p.toll_id === selectedToll);
  }, [projects, selectedToll]);

  const projectGroups = useMemo(() => {
    const map = new Map<string, Project[]>();
    tollFilteredProjects.forEach((project) => {
      const name = project.name || 'Unnamed Project';
      if (!map.has(name)) {
        map.set(name, []);
      }
      map.get(name)!.push(project);
    });
    return map;
  }, [tollFilteredProjects]);

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
      return;
    }
    const project = projects.find((item) => item.id === selectedProject);
    if (project) {
      setSelectedProjectGroup(project.name || 'Unnamed Project');
      if (project.toll_id) setSelectedToll(project.toll_id);
    }
  }, [selectedProject, projects]);

  const selectedGroupProjects = useMemo(() => {
    return selectedProjectGroup === 'all'
      ? tollFilteredProjects
      : projectGroups.get(selectedProjectGroup) ?? [];
  }, [selectedProjectGroup, tollFilteredProjects, projectGroups]);

  const filteredProjects = useMemo(() => {
    const stateConstraint = selectedState === 'ALL STATES' ? undefined : selectedState;
    let workingSet = selectedGroupProjects;
    if (stateConstraint) {
      workingSet = workingSet.filter((project) => project.state === stateConstraint);
    }
    return workingSet;
  }, [selectedGroupProjects, selectedState]);

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
      pads_distributed: 'Pads Distributed',
      sessions_conducted: 'Sessions Conducted',
      students_enrolled: 'Students Enrolled',
      schools_renovated: 'Schools Renovated',
      libraries_setup: 'Libraries Setup',
      scholarships_given: 'Scholarships Given',
      meals_served: 'Meals Served',
      ration_kits_distributed: 'Ration Kits Distributed',
      families_fed: 'Families Fed',
      waste_collected_kg: 'Waste Collected (KG)',
      trees_planted: 'Trees Planted',
      plastic_recycled_kg: 'Plastic Recycled (KG)',
      communities_covered: 'Communities Covered'
    };
    return titles[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleEditClick = (key: string, current: number, target: number, e: React.MouseEvent) => {
    if (!canEditMetrics) return;
    e.stopPropagation(); // Prevent opening breakdown modal
    if (!selectedProject) {
      alert("Please select a specific project from the dropdown to edit metrics.");
      return;
    }
    setEditingMetric(key);
    setEditValues({ current, target });
  };

  const handleSaveMetric = async () => {
    if (!canEditMetrics || !selectedProject || !editingMetric || !onUpdateProject) return;
    
    setIsSaving(true);
    try {
      const updates: Partial<Project> = {};
      
      if (editingMetric === 'beneficiaries') {
        updates.beneficiaries_current = editValues.current;
        updates.beneficiaries_target = editValues.target;
        updates.direct_beneficiaries = editValues.current;
      } else if (editingMetric === 'budget') {
        updates.utilized_budget = editValues.current;
        updates.total_budget = editValues.target;
      } else {
        // Custom metrics
        const project = projects.find(p => p.id === selectedProject);
        
        // Update targets and achievements JSONB columns
        const currentTargets = project?.targets || {};
        const currentAchievements = project?.achievements || {};
        
        updates.targets = {
          ...currentTargets,
          [editingMetric]: editValues.target
        };
        
        updates.achievements = {
          ...currentAchievements,
          [editingMetric]: editValues.current
        };

        // Update project_metrics for immediate UI reflection
        const currentMetrics = project?.project_metrics || {};
        updates.project_metrics = {
          ...currentMetrics,
          [editingMetric]: {
            current: editValues.current,
            target: editValues.target
          }
        };
        
        // Also update top-level fields if they exist
        if (editingMetric === 'pads_distributed') updates.pads_distributed = editValues.current;
        if (editingMetric === 'trees_planted') updates.trees_planted = editValues.current;
        if (editingMetric === 'meals_served') updates.meals_served = editValues.current;
        if (editingMetric === 'students_enrolled') updates.students_enrolled = editValues.current;
        if (editingMetric === 'schools_renovated') updates.schools_renovated = editValues.current;
      }

      await onUpdateProject(selectedProject, updates);
      setEditingMetric(null);
      addToast(`${getMetricTitle(editingMetric)} updated successfully`, 'success');
    } catch (error) {
      console.error("Failed to save metric", error);
      addToast('Failed to save changes. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isEmpty = !loading && projects.length === 0;

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Edit Metric Modal */}
      {canEditMetrics && editingMetric && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit {getMetricTitle(editingMetric)}</h3>
              <button onClick={() => setEditingMetric(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Current Value</label>
                <input
                  type="number"
                  value={editValues.current}
                  onChange={(e) => setEditValues(prev => ({ ...prev, current: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Target Value</label>
                <input
                  type="number"
                  value={editValues.target}
                  onChange={(e) => setEditValues(prev => ({ ...prev, target: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setEditingMetric(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetric}
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Header Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
          {/* Main Title Card - Large */}
          <div className="lg:col-span-8 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-emerald-300/10 rounded-full blur-2xl"></div>
            </div>
            
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
            
            <div className="relative z-10">
              {/* Top row with date */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-white/90 text-sm font-semibold block">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                    <span className="text-emerald-200 text-xs">
                      {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
                  <div className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <span className="text-white text-xs font-semibold tracking-wide">Live Data</span>
                </div>
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
                Dashboard
              </h1>
              <p className="text-emerald-100/90 text-lg font-medium">
                Real-time CSR impact metrics for <span className="text-white font-bold">{partnerDisplayName}</span>{tollSuffix}
              </p>
            </div>
            
            {/* Bottom glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full blur-sm"></div>
          </div>

          {/* Quick Stats Cards - Right Side */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            {/* Total Projects */}
            <div className="group bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 rounded-3xl p-5 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <p className="text-4xl font-black text-white drop-shadow-lg">{filteredProjects.length}</p>
                <p className="text-violet-200 text-xs font-bold uppercase tracking-widest">Projects</p>
              </div>
            </div>

            {/* Active States */}
            <div className="group bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 rounded-3xl p-5 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-white/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <p className="text-4xl font-black text-white drop-shadow-lg">{states.length}</p>
                <p className="text-amber-200 text-xs font-bold uppercase tracking-widest">States</p>
              </div>
            </div>

            {/* Total Beneficiaries Mini */}
            <div className="group col-span-2 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-3xl p-5 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-500 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-4xl font-black text-white drop-shadow-lg">{metrics.beneficiaries.current.toLocaleString()}</p>
                  <p className="text-cyan-200 text-xs font-bold uppercase tracking-widest">Total Beneficiaries</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Wrapper - Glassy */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 ring-1 ring-black/5">
          <div className="space-y-6">
            <ProjectFilterBar
              brandColors={brandColors ?? undefined}
              projectGroupOptions={projectGroupOptions}
              selectedProjectGroup={selectedProjectGroup}
              onProjectGroupChange={setSelectedProjectGroup}
              states={states}
              selectedState={selectedState}
              onStateChange={setSelectedState}
              tollOptions={tollFilterEnabled ? tollOptions : []}
              selectedToll={tollFilterEnabled ? selectedToll : undefined}
              onTollChange={tollFilterEnabled ? setSelectedToll : undefined}
            />

            {loading && (
              <div className="space-y-4">
                <SkeletonGrid />
              </div>
            )}

            {isEmpty && (
              <div className="p-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                <div className="text-slate-400 dark:text-slate-500 mb-3">
                  <div className="text-5xl mb-2">📊</div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No Projects Available</h3>
                <p className="text-slate-600 dark:text-slate-400">No projects found for the selected filters. Try adjusting your filters or check back later.</p>
              </div>
            )}

            {!loading && !isEmpty && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Core metrics - always show beneficiaries and projects active */}
                {metrics.beneficiaries.current > 0 && (
                  <MetricCard
                    title="👥 TOTAL BENEFICIARIES"
                    current={metrics.beneficiaries.current}
                    target={metrics.beneficiaries.target}
                    gradient="from-emerald-100 via-teal-100 to-cyan-100"
                    onClick={() => setSelectedMetric('beneficiaries')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('beneficiaries', metrics.beneficiaries.current, metrics.beneficiaries.target, e) : undefined}
                  />
                )}
                {metrics.projects_active.current > 0 && (
                  <MetricCard
                    title="📊 PROJECTS ACTIVE"
                    current={metrics.projects_active.current}
                    target={metrics.projects_active.target}
                    gradient="from-violet-100 via-purple-100 to-fuchsia-100"
                  />
                )}
                {metrics.budget.current > 0 && (
                  <MetricCard
                    title="💰 BUDGET UTILIZED"
                    current={metrics.budget.current}
                    target={metrics.budget.target}
                    gradient="from-amber-100 via-yellow-100 to-orange-100"
                    isCurrency
                    onClick={() => setSelectedMetric('budget')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('budget', metrics.budget.current, metrics.budget.target, e) : undefined}
                  />
                )}

                {/* Project-specific metrics - only show if value > 0 */}
                {(metrics.pads_distributed?.current || 0) > 0 && (
                  <MetricCard
                    title="🩺 PADS DISTRIBUTED"
                    current={metrics.pads_distributed?.current || 0}
                    target={metrics.pads_distributed?.target || 0}
                    hideTarget={false}
                    gradient="from-pink-100 via-rose-100 to-red-100"
                    onClick={() => setSelectedMetric('pads_distributed')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('pads_distributed', metrics.pads_distributed?.current || 0, metrics.pads_distributed?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.sessions_conducted?.current || 0) > 0 && (
                  <MetricCard
                    title="📚 SESSIONS CONDUCTED"
                    current={metrics.sessions_conducted?.current || 0}
                    target={metrics.sessions_conducted?.target || 0}
                    gradient="from-purple-100 via-violet-100 to-indigo-100"
                    onClick={() => setSelectedMetric('sessions_conducted')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('sessions_conducted', metrics.sessions_conducted?.current || 0, metrics.sessions_conducted?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.students_enrolled?.current || 0) > 0 && (
                  <MetricCard
                    title="🎓 STUDENTS ENROLLED"
                    current={metrics.students_enrolled?.current || 0}
                    target={metrics.students_enrolled?.target || 0}
                    hideTarget={false}
                    gradient="from-blue-100 via-indigo-100 to-violet-100"
                    onClick={() => setSelectedMetric('students_enrolled')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('students_enrolled', metrics.students_enrolled?.current || 0, metrics.students_enrolled?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.schools_renovated?.current || 0) > 0 && (
                  <MetricCard
                    title="🏫 SCHOOLS RENOVATED"
                    current={metrics.schools_renovated?.current || 0}
                    target={metrics.schools_renovated?.target || 0}
                    hideTarget={false}
                    gradient="from-cyan-100 via-sky-100 to-blue-100"
                    onClick={() => setSelectedMetric('schools_renovated')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('schools_renovated', metrics.schools_renovated?.current || 0, metrics.schools_renovated?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.libraries_setup?.current || 0) > 0 && (
                  <MetricCard
                    title="📖 LIBRARIES SETUP"
                    current={metrics.libraries_setup?.current || 0}
                    target={metrics.libraries_setup?.target || 0}
                    gradient="from-teal-100 via-emerald-100 to-green-100"
                    onClick={() => setSelectedMetric('libraries_setup')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('libraries_setup', metrics.libraries_setup?.current || 0, metrics.libraries_setup?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.scholarships_given?.current || 0) > 0 && (
                  <MetricCard
                    title="🎯 SCHOLARSHIPS GIVEN"
                    current={metrics.scholarships_given?.current || 0}
                    target={metrics.scholarships_given?.target || 0}
                    gradient="from-orange-100 via-amber-100 to-yellow-100"
                    onClick={() => setSelectedMetric('scholarships_given')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('scholarships_given', metrics.scholarships_given?.current || 0, metrics.scholarships_given?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.meals_served?.current || 0) > 0 && (
                  <MetricCard
                    title="🍽️ MEALS SERVED"
                    current={metrics.meals_served?.current || 0}
                    target={metrics.meals_served?.target || 0}
                    hideTarget={false}
                    gradient="from-lime-100 via-green-100 to-emerald-100"
                    onClick={() => setSelectedMetric('meals_served')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('meals_served', metrics.meals_served?.current || 0, metrics.meals_served?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.ration_kits_distributed?.current || 0) > 0 && (
                  <MetricCard
                    title="📦 RATION KITS"
                    current={metrics.ration_kits_distributed?.current || 0}
                    target={metrics.ration_kits_distributed?.target || 0}
                    gradient="from-yellow-100 via-lime-100 to-green-100"
                    onClick={() => setSelectedMetric('ration_kits_distributed')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('ration_kits_distributed', metrics.ration_kits_distributed?.current || 0, metrics.ration_kits_distributed?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.families_fed?.current || 0) > 0 && (
                  <MetricCard
                    title="👨‍👩‍👧‍👦 FAMILIES FED"
                    current={metrics.families_fed?.current || 0}
                    target={metrics.families_fed?.target || 0}
                    gradient="from-green-100 via-teal-100 to-cyan-100"
                    onClick={() => setSelectedMetric('families_fed')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('families_fed', metrics.families_fed?.current || 0, metrics.families_fed?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.waste_collected_kg?.current || 0) > 0 && (
                  <MetricCard
                    title="♻️ WASTE COLLECTED (KG)"
                    current={metrics.waste_collected_kg?.current || 0}
                    target={metrics.waste_collected_kg?.target || 0}
                    gradient="from-emerald-100 via-green-100 to-lime-100"
                    onClick={() => setSelectedMetric('waste_collected_kg')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('waste_collected_kg', metrics.waste_collected_kg?.current || 0, metrics.waste_collected_kg?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.trees_planted?.current || 0) > 0 && (
                  <MetricCard
                    title="🌳 TREES PLANTED"
                    current={metrics.trees_planted?.current || 0}
                    target={metrics.trees_planted?.target || 0}
                    hideTarget={false}
                    gradient="from-green-100 via-emerald-100 to-teal-100"
                    onClick={() => setSelectedMetric('trees_planted')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('trees_planted', metrics.trees_planted?.current || 0, metrics.trees_planted?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.plastic_recycled_kg?.current || 0) > 0 && (
                  <MetricCard
                    title="♻️ PLASTIC RECYCLED (KG)"
                    current={metrics.plastic_recycled_kg?.current || 0}
                    target={metrics.plastic_recycled_kg?.target || 0}
                    gradient="from-sky-100 via-cyan-100 to-teal-100"
                    onClick={() => setSelectedMetric('plastic_recycled_kg')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('plastic_recycled_kg', metrics.plastic_recycled_kg?.current || 0, metrics.plastic_recycled_kg?.target || 0, e) : undefined}
                  />
                )}
                {(metrics.communities_covered?.current || 0) > 0 && (
                  <MetricCard
                    title="🏘️ COMMUNITIES COVERED"
                    current={metrics.communities_covered?.current || 0}
                    target={metrics.communities_covered?.target || 0}
                    gradient="from-indigo-100 via-purple-100 to-pink-100"
                    onClick={() => setSelectedMetric('communities_covered')}
                    onEdit={canEditMetrics ? (e) => handleEditClick('communities_covered', metrics.communities_covered?.current || 0, metrics.communities_covered?.target || 0, e) : undefined}
                  />
                )}

                {/* Custom metrics from project_metrics - render any with key not in predefined list */}
                {Object.entries(metrics)
                  .filter(([key, value]) => {
                    const predefinedKeys = [
                      'beneficiaries', 'budget', 'projects_active',
                      'pads_distributed', 'sessions_conducted', 'students_enrolled',
                      'schools_renovated', 'libraries_setup', 'scholarships_given',
                      'meals_served', 'ration_kits_distributed', 'families_fed',
                      'waste_collected_kg', 'trees_planted', 'plastic_recycled_kg', 'communities_covered'
                    ];
                    return !predefinedKeys.includes(key) && value.current > 0;
                  })
                  .map(([key, value]) => (
                    <MetricCard
                      key={key}
                      title={`🎯 ${key.replace(/_/g, ' ').toUpperCase()}`}
                      current={value.current}
                      target={value.target}
                      gradient="from-cyan-100 via-sky-100 to-blue-100"
                      onClick={() => setSelectedMetric(key)}
                      onEdit={canEditMetrics ? (e) => handleEditClick(key, value.current, value.target, e) : undefined}
                    />
                  ))
                }
              </div>
            )}
            </div>
          </div>

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
  hideTarget = false,
  onClick,
  onEdit
}: {
  title: string;
  current: number;
  target: number;
  gradient?: string;
  isCurrency?: boolean;
  hideTarget?: boolean;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
}) {
  const displayTarget = !hideTarget && target > 0;
  const effectiveTarget = displayTarget ? target : Math.max(current, 1);
  const percentage = Math.min((current / effectiveTarget) * 100, 100);

  // Clean the title - remove emoji prefix and clean up
  const cleanTitle = title
    .replace(/^[^\p{L}\p{N}\s]+/u, '') // Remove leading non-letter/non-number characters (includes emojis)
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // Remove emoji range
    .replace(/[\u2600-\u27BF]/g, '') // Remove misc symbols
    .trim()
    .toUpperCase();
  
  // Better fallback - use the original title if cleaning results in empty/short string
  const displayTitle = cleanTitle.length > 2 ? cleanTitle : title.replace(/[^\p{L}\p{N}\s]/gu, '').trim().toUpperCase() || 'CUSTOM METRIC';
  
  // Icon mapping based on title keywords
  const getIcon = () => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('beneficiar')) return <Users className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('project')) return <TrendingUp className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('budget')) return <IndianRupee className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('pad')) return <Heart className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('session')) return <BookOpen className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('student') || lowerTitle.includes('enroll')) return <GraduationCap className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('school')) return <School className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('librar')) return <Library className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('scholarship')) return <Award className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('meal') || lowerTitle.includes('food')) return <UtensilsCrossed className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('ration') || lowerTitle.includes('kit')) return <Package className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('famil')) return <Home className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('waste')) return <Trash2 className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('tree') || lowerTitle.includes('plant')) return <TreePine className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('plastic') || lowerTitle.includes('recycl')) return <Recycle className="w-6 h-6 text-white" />;
    if (lowerTitle.includes('communit')) return <Building2 className="w-6 h-6 text-white" />;
    return <Target className="w-6 h-6 text-white" />;
  };

  // Color schemes with glass effect
  const colorSchemes: Record<string, { 
    cardBg: string; 
    iconBg: string; 
    progressBg: string;
    progressBar: string;
    borderColor: string;
    textAccent: string;
  }> = {
    'from-emerald-100 via-teal-100 to-cyan-100': { 
      cardBg: 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/60 to-teal-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      progressBg: 'bg-emerald-200/60',
      progressBar: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
      borderColor: 'border-emerald-200/50 hover:border-emerald-400/50 ring-1 ring-emerald-500/10',
      textAccent: 'text-emerald-700'
    },
    'from-violet-100 via-purple-100 to-fuchsia-100': { 
      cardBg: 'bg-gradient-to-br from-violet-50/80 via-purple-100/60 to-fuchsia-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      progressBg: 'bg-violet-200/60',
      progressBar: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500',
      borderColor: 'border-violet-200/50 hover:border-violet-400/50 ring-1 ring-violet-500/10',
      textAccent: 'text-violet-700'
    },
    'from-amber-100 via-yellow-100 to-orange-100': { 
      cardBg: 'bg-gradient-to-br from-amber-50/80 via-yellow-100/60 to-orange-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      progressBg: 'bg-amber-200/60',
      progressBar: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500',
      borderColor: 'border-amber-200/50 hover:border-amber-400/50 ring-1 ring-amber-500/10',
      textAccent: 'text-amber-700'
    },
    'from-pink-100 via-rose-100 to-red-100': { 
      cardBg: 'bg-gradient-to-br from-pink-50/80 via-rose-100/60 to-red-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
      progressBg: 'bg-pink-200/60',
      progressBar: 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500',
      borderColor: 'border-pink-200/50 hover:border-pink-400/50 ring-1 ring-pink-500/10',
      textAccent: 'text-pink-700'
    },
    'from-purple-100 via-violet-100 to-indigo-100': { 
      cardBg: 'bg-gradient-to-br from-purple-50/80 via-violet-100/60 to-indigo-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      progressBg: 'bg-purple-200/60',
      progressBar: 'bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500',
      borderColor: 'border-purple-200/50 hover:border-purple-400/50 ring-1 ring-purple-500/10',
      textAccent: 'text-purple-700'
    },
    'from-blue-100 via-indigo-100 to-violet-100': { 
      cardBg: 'bg-gradient-to-br from-blue-50/80 via-indigo-100/60 to-violet-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      progressBg: 'bg-blue-200/60',
      progressBar: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500',
      borderColor: 'border-blue-200/50 hover:border-blue-400/50 ring-1 ring-blue-500/10',
      textAccent: 'text-blue-700'
    },
    'from-cyan-100 via-sky-100 to-blue-100': { 
      cardBg: 'bg-gradient-to-br from-cyan-50/80 via-sky-100/60 to-blue-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      progressBg: 'bg-cyan-200/60',
      progressBar: 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500',
      borderColor: 'border-cyan-200/50 hover:border-cyan-400/50 ring-1 ring-cyan-500/10',
      textAccent: 'text-cyan-700'
    },
    'from-teal-100 via-emerald-100 to-green-100': { 
      cardBg: 'bg-gradient-to-br from-teal-50/80 via-emerald-100/60 to-green-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-teal-500 to-green-600',
      progressBg: 'bg-teal-200/60',
      progressBar: 'bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500',
      borderColor: 'border-teal-200/50 hover:border-teal-400/50 ring-1 ring-teal-500/10',
      textAccent: 'text-teal-700'
    },
    'from-orange-100 via-amber-100 to-yellow-100': { 
      cardBg: 'bg-gradient-to-br from-orange-50/80 via-amber-100/60 to-yellow-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      progressBg: 'bg-orange-200/60',
      progressBar: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
      borderColor: 'border-orange-200/50 hover:border-orange-400/50 ring-1 ring-orange-500/10',
      textAccent: 'text-orange-700'
    },
    'from-lime-100 via-green-100 to-emerald-100': { 
      cardBg: 'bg-gradient-to-br from-lime-50/80 via-green-100/60 to-emerald-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-lime-500 to-green-600',
      progressBg: 'bg-lime-200/60',
      progressBar: 'bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500',
      borderColor: 'border-lime-200/50 hover:border-lime-400/50 ring-1 ring-lime-500/10',
      textAccent: 'text-lime-700'
    },
    'from-green-100 via-teal-100 to-cyan-100': { 
      cardBg: 'bg-gradient-to-br from-green-50/80 via-teal-100/60 to-cyan-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-green-500 to-teal-600',
      progressBg: 'bg-green-200/60',
      progressBar: 'bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500',
      borderColor: 'border-green-200/50 hover:border-green-400/50 ring-1 ring-green-500/10',
      textAccent: 'text-green-700'
    },
    'from-green-100 via-emerald-100 to-teal-100': { 
      cardBg: 'bg-gradient-to-br from-green-50/80 via-emerald-100/60 to-teal-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      progressBg: 'bg-green-200/60',
      progressBar: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500',
      borderColor: 'border-green-200/50 hover:border-green-400/50 ring-1 ring-green-500/10',
      textAccent: 'text-green-700'
    },
    'from-yellow-100 via-lime-100 to-green-100': { 
      cardBg: 'bg-gradient-to-br from-yellow-50/80 via-lime-100/60 to-green-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-yellow-500 to-lime-600',
      progressBg: 'bg-yellow-200/60',
      progressBar: 'bg-gradient-to-r from-yellow-500 via-lime-500 to-green-500',
      borderColor: 'border-yellow-200/50 hover:border-yellow-400/50 ring-1 ring-yellow-500/10',
      textAccent: 'text-yellow-700'
    },
    'from-indigo-100 via-purple-100 to-pink-100': { 
      cardBg: 'bg-gradient-to-br from-indigo-50/80 via-purple-100/60 to-pink-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      progressBg: 'bg-indigo-200/60',
      progressBar: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
      borderColor: 'border-indigo-200/50 hover:border-indigo-400/50 ring-1 ring-indigo-500/10',
      textAccent: 'text-indigo-700'
    },
    'from-sky-100 via-cyan-100 to-teal-100': { 
      cardBg: 'bg-gradient-to-br from-sky-50/80 via-cyan-100/60 to-teal-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-sky-500 to-cyan-600',
      progressBg: 'bg-sky-200/60',
      progressBar: 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500',
      borderColor: 'border-sky-200/50 hover:border-sky-400/50 ring-1 ring-sky-500/10',
      textAccent: 'text-sky-700'
    },
    'from-emerald-100 via-green-100 to-lime-100': { 
      cardBg: 'bg-gradient-to-br from-emerald-50/80 via-green-100/60 to-lime-100/80 backdrop-blur-sm',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      progressBg: 'bg-emerald-200/60',
      progressBar: 'bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500',
      borderColor: 'border-emerald-200/50 hover:border-emerald-400/50 ring-1 ring-emerald-500/10',
      textAccent: 'text-emerald-700'
    },
  };

  // Default fallback scheme with glass effect
  const defaultScheme = {
    cardBg: 'bg-gradient-to-br from-blue-50/80 via-indigo-100/60 to-violet-100/80 backdrop-blur-sm',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    progressBg: 'bg-blue-200/60',
    progressBar: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    borderColor: 'border-blue-200/50 hover:border-blue-400/50 ring-1 ring-blue-500/10',
    textAccent: 'text-blue-700'
  };

  const scheme = colorSchemes[gradient] || defaultScheme;
  
  return (
    <div 
      className={`group relative ${scheme.cardBg} rounded-3xl p-6 border ${scheme.borderColor} hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 cursor-pointer shadow-lg overflow-hidden`}
      onClick={onClick}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-transparent pointer-events-none"></div>
      
      {/* Decorative blob */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 ${scheme.iconBg} rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
      <div className={`absolute -bottom-8 -left-8 w-24 h-24 ${scheme.iconBg} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
      
      <div className="relative z-10">
        {/* Icon with gradient background */}
        <div className="flex items-start justify-between mb-5">
          <div className={`w-14 h-14 ${scheme.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl group-hover:rotate-3 transition-all duration-500`}>
            {getIcon()}
          </div>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }}
              className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg border border-white/50"
              title="Edit Metric"
            >
              <Edit2 className="w-4 h-4 text-slate-600" />
            </button>
          )}
        </div>

        {/* Title */}
        <p className={`${scheme.textAccent} text-xs font-bold mb-2 uppercase tracking-widest`}>
          {displayTitle}
        </p>
        
        {/* Numbers */}
        <div className="mb-5">
          <p className="text-4xl font-black text-slate-800 mb-1 tracking-tight">
            {isCurrency ? `₹${(current / 100000).toFixed(1)}L` : current.toLocaleString()}
          </p>
          {displayTarget && (
            <p className="text-sm text-slate-500/80 font-medium">
              of <span className="font-semibold text-slate-600">{isCurrency ? `₹${(target / 100000).toFixed(1)}L` : target.toLocaleString()}</span> target
            </p>
          )}
        </div>

        {/* Progress bar - thicker and more prominent */}
        <div className="mb-4">
          <div className={`w-full h-3 ${scheme.progressBg} rounded-full overflow-hidden shadow-inner`}>
            <div 
              className={`h-full ${scheme.progressBar} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
              style={{ width: `${percentage}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            {percentage.toFixed(0)}% achieved
          </span>
          {percentage >= 100 && (
            <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-md">
              ✓ Complete
            </span>
          )}
          {percentage >= 75 && percentage < 100 && (
            <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-md">
              Almost!
            </span>
          )}
          {percentage < 75 && percentage >= 50 && (
            <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-md">
              On Track
            </span>
          )}
          {percentage < 50 && (
            <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-full shadow-md">
              In Progress
            </span>
          )}
        </div>
      </div>
      
      {/* Bottom glow on hover */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 ${scheme.progressBar} rounded-full blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-500`}></div>
    </div>
  );
}
