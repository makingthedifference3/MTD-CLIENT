import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import type { Project, Toll, Media as MediaAsset, ProjectActivity } from '../types/csr';
import { calculateDashboardMetrics } from '../lib/metrics';
import { getBrandColors } from '../lib/logodev';
import { 
  X, Edit2, Save, Users, TrendingUp, IndianRupee, Heart, BookOpen, GraduationCap, 
  School, Library, Award, UtensilsCrossed, Package, Home, Trash2, TreePine, Recycle, 
  Building2, Target, ArrowRight, Image, Clock, Wallet, ChevronLeft,
  ChevronRight, PieChart
} from 'lucide-react';
import { SkeletonGrid } from './Skeleton';
import ProjectFilterBar from './ProjectFilterBar';

interface DashboardProps {
  selectedProject: string | null;
  projects: Project[];
  loading?: boolean;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => Promise<void>;
  tolls?: Toll[];
  photos?: MediaAsset[];
  videos?: MediaAsset[];
  activities?: ProjectActivity[];
  onNavigate?: (view: string) => void;
}

type SelectOption = { value: string; label: string };

interface DashboardMetrics {
  beneficiaries: { current: number; target: number };
  budget: { current: number; target: number };
  projects_active: { current: number; target: number };
  [key: string]: { current: number; target: number };
}

export default function Dashboard({ 
  selectedProject, 
  projects, 
  loading, 
  onUpdateProject, 
  tolls = [],
  photos = [],
  videos = [],
  activities = [],
  onNavigate
}: DashboardProps) {
  const { partner, user } = useAuth();
  const { addToast } = useToast();
  const [selectedState, setSelectedState] = useState('ALL STATES');
  const [selectedToll, setSelectedToll] = useState('all');
  const [showImpactModal, setShowImpactModal] = useState(false);
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

  const brandColors = partner ? getBrandColors(partner.primary_color || '#059669') : null;

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

  const visibleProjectIds = useMemo(() => filteredProjects.map(p => p.id), [filteredProjects]);

  const overviewStats = useMemo(() => {
    const active = filteredProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const completed = filteredProjects.filter(p => p.status === 'completed').length;
    const stateCount = new Set(filteredProjects.map((p) => p.state).filter(Boolean)).size;
    const locationCount = new Set(filteredProjects.map((p) => p.location).filter(Boolean)).size;
    return {
      total: filteredProjects.length,
      active,
      completed,
      states: stateCount,
      locations: locationCount,
    };
  }, [filteredProjects]);

  useEffect(() => {
    if (!partner) return;
    const partnerProjects = filteredProjects.filter((project) => project.csr_partner_id === partner.id);
    const newMetrics = calculateDashboardMetrics(partnerProjects);
    setMetrics(newMetrics as DashboardMetrics);
  }, [filteredProjects, partner]);

  // Budget calculations
  const budgetData = useMemo(() => {
    const partnerProjects = filteredProjects.filter((project) => project.csr_partner_id === partner?.id);
    const total = partnerProjects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
    const utilized = partnerProjects.reduce((sum, p) => sum + (p.utilized_budget || 0), 0);
    const remaining = total - utilized;
    const percentage = total > 0 ? (utilized / total) * 100 : 0;
    return { total, utilized, remaining, percentage };
  }, [filteredProjects, partner]);

  // Filter activities by visible projects
  const filteredActivities = useMemo(() => activities.filter(a => visibleProjectIds.includes(a.project_id)).slice(0, 3), [activities, visibleProjectIds]);

  // Get all metrics with values > 0
  const activeMetrics = useMemo(() => {
    const result: Array<{ key: string; current: number; target: number }> = [];
    Object.entries(metrics).forEach(([key, value]) => {
      if (value.current > 0) {
        result.push({ key, current: value.current, target: value.target });
      }
    });
    return result;
  }, [metrics]);

  const getMetricTitle = (key: string): string => {
    const titles: Record<string, string> = {
      beneficiaries: 'Total Beneficiaries',
      budget: 'Budget Utilized',
      projects_active: 'Active Projects',
      pads_distributed: 'Pads Distributed',
      sessions_conducted: 'Sessions Conducted',
      students_enrolled: 'Students Enrolled',
      schools_renovated: 'Schools Renovated',
      libraries_setup: 'Libraries Setup',
      scholarships_given: 'Scholarships Given',
      meals_served: 'Meals Served',
      ration_kits_distributed: 'Ration Kits',
      families_fed: 'Families Fed',
      waste_collected_kg: 'Waste Collected (KG)',
      trees_planted: 'Trees Planted',
      plastic_recycled_kg: 'Plastic Recycled (KG)',
      communities_covered: 'Communities Covered'
    };
    return titles[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getMetricIcon = (key: string) => {
    const icons: Record<string, JSX.Element> = {
      beneficiaries: <Users className="w-5 h-5" />,
      budget: <IndianRupee className="w-5 h-5" />,
      projects_active: <Target className="w-5 h-5" />,
      pads_distributed: <Heart className="w-5 h-5" />,
      sessions_conducted: <BookOpen className="w-5 h-5" />,
      students_enrolled: <GraduationCap className="w-5 h-5" />,
      schools_renovated: <School className="w-5 h-5" />,
      libraries_setup: <Library className="w-5 h-5" />,
      scholarships_given: <Award className="w-5 h-5" />,
      meals_served: <UtensilsCrossed className="w-5 h-5" />,
      ration_kits_distributed: <Package className="w-5 h-5" />,
      families_fed: <Home className="w-5 h-5" />,
      waste_collected_kg: <Trash2 className="w-5 h-5" />,
      trees_planted: <TreePine className="w-5 h-5" />,
      plastic_recycled_kg: <Recycle className="w-5 h-5" />,
      communities_covered: <Building2 className="w-5 h-5" />
    };
    return icons[key] || <Target className="w-5 h-5" />;
  };

  const handleEditClick = (key: string, current: number, target: number) => {
    if (!canEditMetrics) return;
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
      const projectUpdates: Partial<Project> = {};
      
      if (editingMetric === 'beneficiaries') {
        projectUpdates.beneficiaries_current = editValues.current;
        projectUpdates.beneficiaries_target = editValues.target;
        projectUpdates.direct_beneficiaries = editValues.current;
      } else if (editingMetric === 'budget') {
        projectUpdates.utilized_budget = editValues.current;
        projectUpdates.total_budget = editValues.target;
      } else {
        const project = projects.find(p => p.id === selectedProject);
        const currentTargets = project?.targets || {};
        const currentAchievements = project?.achievements || {};
        
        projectUpdates.targets = { ...currentTargets, [editingMetric]: editValues.target };
        projectUpdates.achievements = { ...currentAchievements, [editingMetric]: editValues.current };

        const currentMetrics = project?.project_metrics || {};
        projectUpdates.project_metrics = {
          ...currentMetrics,
          [editingMetric]: { current: editValues.current, target: editValues.target }
        };
      }

      await onUpdateProject(selectedProject, projectUpdates);
      setEditingMetric(null);
      addToast(`${getMetricTitle(editingMetric)} updated successfully`, 'success');
    } catch (error) {
      console.error("Failed to save metric", error);
      addToast('Failed to save changes. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const isEmpty = !loading && projects.length === 0;

  // Media carousel state
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const allMedia = useMemo(() => {
    const media = [
      ...photos.filter(p => visibleProjectIds.includes(p.project_id)).map(p => ({ ...p, mediaType: 'photo' as const })),
      ...videos.filter(v => visibleProjectIds.includes(v.project_id)).map(v => ({ ...v, mediaType: 'video' as const }))
    ];
    return media;
  }, [photos, videos, visibleProjectIds]);

  // Auto-advance carousel
  useEffect(() => {
    if (allMedia.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [allMedia.length]);

  const nextMedia = () => setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
  const prevMedia = () => setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-auto min-h-screen">
      <div className="p-4 lg:p-6 max-w-[1800px] mx-auto">
        
        {/* Filters at Top */}
        <div className="mb-6">
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
        </div>

        {loading && <SkeletonGrid />}

        {isEmpty && (
          <div className="p-12 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-white mb-1">No Projects Available</h3>
            <p className="text-slate-400">No projects found for the selected filters.</p>
          </div>
        )}

        {!loading && !isEmpty && (
          <div className="space-y-6">
            
            {/* Row 1: Funds Overview + Projects Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Funds Overview - Glass Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                          <Wallet className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Funds Overview</h2>
                          <p className="text-sm text-slate-400">Budget allocation & usage</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate?.('accounts')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
                      >
                        View Details <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-8">
                      {/* Circular Progress */}
                      <div className="relative w-40 h-40 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                          <circle 
                            cx="50" cy="50" r="42" fill="none" 
                            stroke="url(#gradient-ring)" strokeWidth="8"
                            strokeDasharray={`${budgetData.percentage * 2.64} 264`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient id="gradient-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="50%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-black text-white">{budgetData.percentage.toFixed(0)}%</p>
                            <p className="text-xs font-medium text-slate-400">Utilized</p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex-1 space-y-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Total Budget</span>
                            <span className="text-lg font-bold text-white">{formatCurrency(budgetData.total)}</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Utilized</span>
                            <span className="text-lg font-bold text-emerald-400">{formatCurrency(budgetData.utilized)}</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Remaining</span>
                            <span className="text-lg font-bold text-amber-400">{formatCurrency(budgetData.remaining)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Overview - Glass Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                          <Target className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Projects Overview</h2>
                          <p className="text-sm text-slate-400">{overviewStats.total} total projects</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-center group/stat hover:scale-105 transition-transform">
                        <p className="text-4xl font-black text-emerald-400 mb-1">
                          {overviewStats.active}
                        </p>
                        <p className="text-sm font-medium text-slate-400">Active Projects</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 text-center group/stat hover:scale-105 transition-transform">
                        <p className="text-4xl font-black text-blue-400 mb-1">
                          {overviewStats.completed}
                        </p>
                        <p className="text-sm font-medium text-slate-400">Completed</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/30 text-center group/stat hover:scale-105 transition-transform">
                        <p className="text-4xl font-black text-purple-400 mb-1">{overviewStats.states || '-'}</p>
                        <p className="text-sm font-medium text-slate-400">States Covered</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-center group/stat hover:scale-105 transition-transform">
                        <p className="text-4xl font-black text-amber-400 mb-1">{overviewStats.locations || '-'}</p>
                        <p className="text-sm font-medium text-slate-400">Locations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Media Carousel + Timelines + Accounts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Media Carousel */}
              <div className="lg:col-span-2 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
                  <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <Image className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Media Gallery</h2>
                        <p className="text-sm text-slate-400">{allMedia.length} items</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate?.('media')}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
                    >
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {allMedia.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                        <Image className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-400">No media available</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Carousel */}
                      <div className="aspect-[16/9] relative overflow-hidden">
                        {allMedia.map((item, index) => (
                          <div
                            key={item.id}
                            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                              index === currentMediaIndex 
                                ? 'opacity-100 scale-100' 
                                : 'opacity-0 scale-105'
                            }`}
                          >
                            {item.drive_link ? (
                              <iframe
                                src={item.drive_link}
                                title={item.title}
                                loading="lazy"
                                allowFullScreen
                                className="w-full h-full border-0 object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                item.mediaType === 'video' 
                                  ? 'bg-gradient-to-br from-pink-900/50 to-purple-900/50' 
                                  : 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50'
                              }`}>
                                {item.mediaType === 'video' ? (
                                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1"></div>
                                  </div>
                                ) : (
                                  <Image className="w-16 h-16 text-white/40" />
                                )}
                              </div>
                            )}
                            
                            {/* Overlay with title */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                              <div className="absolute bottom-0 left-0 right-0 p-6">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                    item.mediaType === 'video' 
                                      ? 'bg-pink-500/20 text-pink-300' 
                                      : 'bg-purple-500/20 text-purple-300'
                                  }`}>
                                    {item.mediaType.toUpperCase()}
                                  </span>
                                  {item.is_geo_tagged && (
                                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                                      GEO-TAGGED
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-lg font-bold text-white truncate">{item.title}</h3>
                                <p className="text-sm text-slate-300">
                                  {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Navigation */}
                      {allMedia.length > 1 && (
                        <>
                          <button
                            onClick={prevMedia}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextMedia}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          
                          {/* Dots */}
                          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2">
                            {allMedia.slice(0, 5).map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentMediaIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentMediaIndex 
                                    ? 'w-6 bg-white' 
                                    : 'bg-white/40 hover:bg-white/60'
                                }`}
                              />
                            ))}
                            {allMedia.length > 5 && (
                              <span className="text-xs text-white/60">+{allMedia.length - 5}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Timelines Preview */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden h-full">
                  <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Timelines</h3>
                        <p className="text-xs text-slate-400">{filteredActivities.length} activities</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate?.('timelines')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {filteredActivities.length === 0 ? (
                      <div className="py-8 text-center">
                        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No activities scheduled</p>
                      </div>
                    ) : (
                      filteredActivities.map((activity) => (
                        <div 
                          key={activity.id} 
                          className="p-4 rounded-2xl bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-white truncate flex-1">{activity.title}</p>
                            <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-bold ${
                              activity.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                              activity.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-600/50 text-slate-400'
                            }`}>
                              {activity.completion_percentage}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                activity.status === 'completed' ? 'bg-emerald-500' :
                                activity.status === 'in_progress' ? 'bg-amber-500' :
                                'bg-slate-500'
                              }`}
                              style={{ width: `${activity.completion_percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-2">{activity.project_name}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Budget Utilization by Project */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
                <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Budget Utilization by Project</h2>
                      <p className="text-sm text-slate-400">{filteredProjects.length} projects</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate?.('accounts')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
                  >
                    View Accounts <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.slice(0, 6).map((project) => {
                      const utilization = project.total_budget > 0 
                        ? (project.utilized_budget / project.total_budget) * 100 
                        : 0;
                      return (
                        <div 
                          key={project.id} 
                          className="p-4 rounded-2xl bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-white truncate flex-1">{project.name}</p>
                            <span className={`ml-2 text-sm font-bold ${
                              utilization >= 80 ? 'text-emerald-400' :
                              utilization >= 50 ? 'text-amber-400' :
                              'text-slate-400'
                            }`}>
                              {utilization.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                utilization >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                utilization >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                'bg-gradient-to-r from-slate-500 to-slate-400'
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{formatCurrency(project.utilized_budget)}</span>
                            <span className="text-slate-400">{formatCurrency(project.total_budget)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Impact Metrics - At Bottom */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-emerald-900/30 to-teal-900/30">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Impact Metrics</h2>
                      <p className="text-sm text-emerald-300/70">{activeMetrics.length} active metrics tracked</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowImpactModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                  >
                    View All Metrics <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {activeMetrics.slice(0, 12).map((metric) => {
                      const percentage = metric.target > 0 ? Math.min((metric.current / metric.target) * 100, 100) : 100;
                      return (
                        <div 
                          key={metric.key}
                          className="group/metric p-4 rounded-2xl bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-emerald-500/50 transition-all cursor-pointer"
                          onClick={() => setShowImpactModal(true)}
                        >
                          <div className="flex items-center gap-2 mb-3 text-emerald-400">
                            {getMetricIcon(metric.key)}
                          </div>
                          <p className="text-2xl font-black text-white mb-1">
                            {metric.key === 'budget' 
                              ? formatCurrency(metric.current)
                              : metric.current.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            {getMetricTitle(metric.key)}
                          </p>
                          {metric.target > 0 && (
                            <div className="mt-3">
                              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 text-right">{percentage.toFixed(0)}%</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Impact Metrics Modal */}
        {showImpactModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowImpactModal(false)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Impact Metrics</h3>
                    <p className="text-emerald-100 text-sm">{activeMetrics.length} metrics tracked</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImpactModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMetrics.map((metric) => {
                    const percentage = metric.target > 0 ? Math.min((metric.current / metric.target) * 100, 100) : 100;
                    return (
                      <div 
                        key={metric.key}
                        className="group p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 hover:border-emerald-300 hover:from-emerald-50 hover:to-teal-50 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                            {getMetricIcon(metric.key)}
                          </div>
                          {canEditMetrics && (
                            <button
                              onClick={() => handleEditClick(metric.key, metric.current, metric.target)}
                              className="p-2 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 border border-slate-200"
                            >
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </button>
                          )}
                        </div>
                        
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          {getMetricTitle(metric.key)}
                        </p>
                        <p className="text-3xl font-black text-slate-800 mb-3">
                          {metric.key === 'budget' 
                            ? formatCurrency(metric.current)
                            : metric.current.toLocaleString()}
                        </p>
                        
                        {metric.target > 0 && (
                          <>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">
                                Target: {metric.key === 'budget' ? formatCurrency(metric.target) : metric.target.toLocaleString()}
                              </span>
                              <span className={`font-bold ${percentage >= 100 ? 'text-emerald-600' : percentage >= 75 ? 'text-amber-600' : 'text-slate-600'}`}>
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Metric Modal */}
        {canEditMetrics && editingMetric && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Edit {getMetricTitle(editingMetric)}</h3>
                <button onClick={() => setEditingMetric(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Current Value</label>
                  <input
                    type="number"
                    value={editValues.current}
                    onChange={(e) => setEditValues(prev => ({ ...prev, current: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Target Value</label>
                  <input
                    type="number"
                    value={editValues.target}
                    onChange={(e) => setEditValues(prev => ({ ...prev, target: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setEditingMetric(null)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
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
      </div>
    </div>
  );
}
