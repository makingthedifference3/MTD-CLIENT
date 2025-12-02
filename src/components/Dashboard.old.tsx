import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Project, Toll } from '../types/csr';
import { calculateDashboardMetrics } from '../lib/metrics';
import { getBrandColors } from '../lib/logodev';
import { X, Edit2, Save } from 'lucide-react';
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

  const selectedGroupProjects =
    selectedProjectGroup === 'all'
      ? tollFilteredProjects
      : projectGroups.get(selectedProjectGroup) ?? [];

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
    } catch (error) {
      console.error("Failed to save metric", error);
      alert("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic background based on brand color
  const bgStyle = brandColors ? {
    background: `linear-gradient(135deg, ${brandColors.lighter}15, ${brandColors.primary}08, ${brandColors.darker}15)`
  } : {};

  const isEmpty = !loading && projects.length === 0;

  return (
    <div className="flex-1 overflow-auto rounded-b-3xl" style={bgStyle}>
      {/* Edit Metric Modal */}
      {canEditMetrics && editingMetric && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Edit {getMetricTitle(editingMetric)}</h3>
              <button onClick={() => setEditingMetric(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Current Value (Achieved)</label>
                <input
                  type="number"
                  value={editValues.current}
                  onChange={(e) => setEditValues(prev => ({ ...prev, current: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Target Value (Out of)</label>
                <input
                  type="number"
                  value={editValues.target}
                  onChange={(e) => setEditValues(prev => ({ ...prev, target: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingMetric(null)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetric}
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

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
              Real-time CSR impact metrics for {partnerDisplayName}{tollSuffix}
            </p>
          </div>
        </div>

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
      {/* Edit Button */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(e);
          }}
          className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white/80 rounded-full backdrop-blur-sm transition-all z-20 opacity-0 group-hover:opacity-100"
          title="Edit Metric"
        >
          <Edit2 className="w-4 h-4 text-slate-600" />
        </button>
      )}

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
          {displayTarget && (
            <>
              <span className="text-2xl text-slate-400/80 font-bold mx-1">/</span>
              <span className="text-3xl font-bold text-slate-500/70">{formatNumber(target)}</span>
            </>
          )}
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
