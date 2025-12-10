import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { Project, Media as MediaAsset, ProjectActivity } from '@/types/csr';
import { calculateDashboardMetrics } from '@/lib/metrics';
import { getBrandColors } from '@/lib/logodev';
import { formatProjectLabel } from '@/lib/projectFilters';
import {
  Edit2, Save, Users, TrendingUp, IndianRupee, Heart, BookOpen, GraduationCap, 
  School, Library, Award, UtensilsCrossed, Package, Home, Trash2, TreePine, Recycle, 
  Building2, Target, ArrowRight, ArrowLeft, Image, Wallet, ChevronRight, Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import ProjectFilterBar from '@/components/ProjectFilterBar';
import StateLocationSelector from '@/components/StateLocationSelector';
import GroupedProjectSelector, { matchesGroupProject, type GroupedProject } from '@/components/GroupedProjectSelector';

interface DashboardProps {
  selectedProject: string | null;
  projects: Project[];
  loading?: boolean;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => Promise<void>;
  photos?: MediaAsset[];
  videos?: MediaAsset[];
  activities?: ProjectActivity[];
  onNavigate?: (view: string) => void;
  subcompanyOptions?: SelectOption[];
  selectedSubcompany?: string;
  onSubcompanyChange?: (value: string) => void;
  onSelectProject?: (projectId: string | null) => void;
  onSelectState?: (state: string) => void;
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
  photos = [],
  videos = [],
  activities = [],
  onNavigate,
  subcompanyOptions = [],
  selectedSubcompany = 'all',
  onSubcompanyChange,
  onSelectProject,
  onSelectState,
}: DashboardProps) {
  const { partner, user } = useAuth();
  const { addToast } = useToast();
  const [selectedState, setSelectedState] = useState('all');
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showProjectOverview, setShowProjectOverview] = useState(false);
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ current: 0, target: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const brandColors = partner ? getBrandColors(partner.primary_color || '#059669') : null;

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    beneficiaries: { current: 0, target: 0 },
    budget: { current: 0, target: 0 },
    projects_active: { current: 0, target: 0 },
  });
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('all');
  const [modalFilters, setModalFilters] = useState<{ status?: 'active' | 'completed'; state?: string; location?: string; subcompany?: string }>({});
  const [modalMode, setModalMode] = useState<'projects' | 'state-selector' | 'location-selector' | 'group-selector' | 'budget-group-selector' | 'budget-projects'>('projects');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [modalGroupProjectName, setModalGroupProjectName] = useState<string | null>(null);
  const [budgetModalGroupProjectName, setBudgetModalGroupProjectName] = useState<string | null>(null);
  const [modalReturnMode, setModalReturnMode] = useState<'state-selector' | 'location-selector' | null>(null);
  const canEditMetrics = Boolean(onUpdateProject && user?.role !== 'client');

  const handleProjectGroupChange = (projectId: string) => {
    setSelectedProjectGroup(projectId);
    if (projectId === 'all') {
      onSelectProject?.(null);
      return;
    }
    onSelectProject?.(projectId);
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    onSelectState?.(state);
  };

  const resetAllFilters = () => {
    setSelectedProjectGroup('all');
    setSelectedState('all');
    onSelectProject?.(null);
    onSelectState?.('all');
    if (onSubcompanyChange) {
      onSubcompanyChange('all');
    }
  };

  const handleModalSubcompanyChange = (value: string) => {
    setModalFilters((prev) => ({
      ...prev,
      subcompany: value === 'all' ? undefined : value,
    }));
    // Keep the group selection when changing subcompany filter
  };

  const states = useMemo(() => {
    if (!partner) return [] as string[];
    return Array.from(new Set(projects.map((project) => project.state).filter(Boolean))) as string[];
  }, [partner, projects]);

  const projectGroupOptions = useMemo<SelectOption[]>(
    () =>
      projects
        .map((project) => ({ value: project.id, label: formatProjectLabel(project) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [projects]
  );

  const subcompanyLabelMap = useMemo(
    () => new Map(subcompanyOptions.map((option) => [option.value, option.label])),
    [subcompanyOptions]
  );

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  useEffect(() => {
    setSelectedProjectGroup(selectedProject ?? 'all');
  }, [selectedProject]);

  const modalBaseProjects = useMemo(() => {
    return projects.filter((project) => {
      if (modalFilters.status && project.status !== modalFilters.status) return false;
      if (modalFilters.state && project.state !== modalFilters.state) return false;
      if (modalFilters.location && project.location !== modalFilters.location) return false;
      if (modalFilters.subcompany && project.toll_id !== modalFilters.subcompany) return false;
      return true;
    });
  }, [projects, modalFilters]);

  const modalProjects = useMemo(() => {
    if (!modalGroupProjectName) return modalBaseProjects;
    return modalBaseProjects.filter((project) => matchesGroupProject(project, modalGroupProjectName, projects));
  }, [modalBaseProjects, modalGroupProjectName, projects]);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (selectedSubcompany !== 'all') {
      result = result.filter((project) => project.toll_id === selectedSubcompany);
    }
    if (selectedProjectGroup !== 'all') {
      result = result.filter((project) => project.id === selectedProjectGroup);
    }
    if (selectedState !== 'all') {
      result = result.filter(p => p.state === selectedState);
    }
    return result;
  }, [projects, selectedProjectGroup, selectedState, selectedSubcompany]);

  const visibleProjectIds = useMemo(() => filteredProjects.map(p => p.id), [filteredProjects]);

  const overviewStats = useMemo(() => {
    const active = filteredProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const completed = filteredProjects.filter(p => p.status === 'completed').length;
    const uniqueStates = new Set(filteredProjects.map(p => p.state).filter(Boolean)).size;
    const uniqueLocations = new Set(filteredProjects.map(p => p.location).filter(Boolean)).size;
    return { total: filteredProjects.length, active, completed, states: uniqueStates, locations: uniqueLocations };
  }, [filteredProjects]);

  const budgetBaseProjects = useMemo(() => {
    if (!modalFilters.subcompany) return filteredProjects;
    return filteredProjects.filter((project) => project.toll_id === modalFilters.subcompany);
  }, [filteredProjects, modalFilters.subcompany]);

  const budgetModalProjects = useMemo(() => {
    if (!budgetModalGroupProjectName) return budgetBaseProjects;
    return budgetBaseProjects.filter((project) => matchesGroupProject(project, budgetModalGroupProjectName, projects));
  }, [budgetBaseProjects, budgetModalGroupProjectName, projects]);

  const budgetData = useMemo(() => {
    const partnerProjects = filteredProjects.filter((project) => project.csr_partner_id === partner?.id);
    const total = partnerProjects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
    const utilized = partnerProjects.reduce((sum, p) => sum + (p.utilized_budget || 0), 0);
    const remaining = total - utilized;
    const percentage = total > 0 ? (utilized / total) * 100 : 0;
    return { total, utilized, remaining, percentage };
  }, [filteredProjects, partner]);

  useEffect(() => {
    if (!partner) return;
    const newMetrics = calculateDashboardMetrics(filteredProjects);
    setMetrics(newMetrics as DashboardMetrics);
  }, [filteredProjects, partner]);

  useEffect(() => {
    if (modalMode !== 'group-selector') {
      setModalReturnMode(null);
    }
  }, [modalMode]);

  const activeMetrics = useMemo(() => {
    const result: Array<{ key: string; current: number; target: number }> = [];
    Object.entries(metrics).forEach(([key, value]) => {
      if (value.current > 0) {
        result.push({ key, current: value.current, target: value.target });
      }
    });
    return result;
  }, [metrics]);

  const recentMedia = useMemo(() => {
    const media = [
      ...photos.filter(p => visibleProjectIds.includes(p.project_id)).map(p => ({ ...p, mediaType: 'photo' as const })),
      ...videos.filter(v => visibleProjectIds.includes(v.project_id)).map(v => ({ ...v, mediaType: 'video' as const }))
    ];
    return media.sort((a, b) => {
      const aTime = Date.parse(a.date ?? '') || 0;
      const bTime = Date.parse(b.date ?? '') || 0;
      return bTime - aTime;
    });
  }, [photos, videos, visibleProjectIds]);

  const getActivityTimestamp = (activity: ProjectActivity) => {
    const rawDate = activity.updated_at ?? activity.created_at ?? activity.actual_end_date ?? activity.end_date ?? activity.start_date;
    return rawDate ? Date.parse(rawDate) : 0;
  };

  const recentProjectSummaries = useMemo(() => {
    const filtered = activities.filter((activity) => visibleProjectIds.includes(activity.project_id));
    const grouped = new Map<string, { activities: ProjectActivity[]; latestTimestamp: number }>();

    filtered.forEach((activity) => {
      const timestamp = getActivityTimestamp(activity);
      const entry = grouped.get(activity.project_id);
      if (entry) {
        entry.activities.push(activity);
        entry.latestTimestamp = Math.max(entry.latestTimestamp, timestamp);
      } else {
        grouped.set(activity.project_id, { activities: [activity], latestTimestamp: timestamp });
      }
    });

    return Array.from(grouped.entries())
      .sort(([, a], [, b]) => b.latestTimestamp - a.latestTimestamp)
      .slice(0, 6)
      .map(([projectId, entry]) => {
        const averageCompletion = entry.activities.length
          ? Math.round(entry.activities.reduce((sum, activity) => sum + activity.completion_percentage, 0) / entry.activities.length)
          : 0;
        return {
          projectId,
          completion: Math.min(Math.max(averageCompletion, 0), 100),
          activities: entry.activities,
        };
      });
  }, [activities, visibleProjectIds]);

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

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatMetricLabel = (label?: string) => {
    if (!label) return 'Metric';
    return label.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const openModalWithFilters = (
    filters: { status?: 'active' | 'completed'; state?: string; location?: string; subcompany?: string } = {},
    mode: 'projects' | 'state-selector' | 'location-selector' | 'group-selector' | 'budget-group-selector' = 'projects'
  ) => {
    setModalFilters(filters);
    setModalMode(mode);
    setModalGroupProjectName(null);
    setShowProjectOverview(true);
  };

  const openBudgetModal = (
    mode: 'budget-group-selector' | 'budget-projects' = 'budget-group-selector',
    filters: { subcompany?: string } = {}
  ) => {
    setModalFilters(filters);
    setModalMode(mode);
    setBudgetModalGroupProjectName(null);
    setShowBudgetModal(true);
  };

  const sanitizeBudgetValue = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

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

  const isEmpty = !loading && projects.length === 0;

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background overflow-auto">
        <div className="p-6 max-w-[1800px] mx-auto space-y-6">
        
        {/* Filters */}
        <ProjectFilterBar
          brandColors={brandColors ?? undefined}
          projectGroupOptions={projectGroupOptions}
          selectedProjectGroup={selectedProjectGroup}
          onProjectGroupChange={handleProjectGroupChange}
          states={states}
          selectedState={selectedState}
          onStateChange={handleStateChange}
          subcompanyOptions={subcompanyOptions}
          selectedSubcompany={selectedSubcompany}
          onSubcompanyChange={onSubcompanyChange}
          resetFilters={resetAllFilters}
        />

        <Dialog open={showProjectOverview} onOpenChange={(open) => {
          setShowProjectOverview(open);
          if (!open) {
            setModalFilters({});
            setModalMode('projects');
            setModalGroupProjectName(null);
            setModalReturnMode(null);
          }
        }}>
          <DialogContent className="max-w-5xl w-[1100px] max-h-[85vh] overflow-hidden">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                {modalMode === 'projects' && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setModalMode('group-selector');
                    setModalGroupProjectName(null);
                  }}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                {modalMode === 'group-selector' && modalReturnMode && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setModalFilters((prev) => ({
                      ...prev,
                      state: modalReturnMode === 'state-selector' ? undefined : prev.state,
                      location: modalReturnMode === 'location-selector' ? undefined : prev.location,
                    }));
                    setModalMode(modalReturnMode);
                    setModalReturnMode(null);
                    setModalGroupProjectName(null);
                  }}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to {modalReturnMode === 'state-selector' ? 'State Selection' : 'Location Selection'}
                  </Button>
                )}
                <DialogTitle>
                  {modalMode === 'state-selector' ? 'Select State' : 
                   modalMode === 'location-selector' ? 'Select Location' : 
                   modalMode === 'group-selector' ? 'Select Project Group' :
                   'Project Overview'}
                </DialogTitle>
              </div>
              <DialogDescription>
                {modalMode === 'state-selector' ? 'Choose a state to view its projects' :
                 modalMode === 'location-selector' ? 'Choose a location to view its projects' :
                 modalMode === 'group-selector' ? 'Choose a project to view its sub-projects' :
                 `Overview of ${modalProjects.length} project${modalProjects.length === 1 ? '' : 's'} matching the selected filters.`}
              </DialogDescription>
            </DialogHeader>

            {subcompanyOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subcompany</p>
                  <Select value={modalFilters.subcompany ?? 'all'} onValueChange={handleModalSubcompanyChange}>
                    <SelectTrigger className="w-[220px] border-2 rounded-xl">
                      <SelectValue placeholder="All Subcompanies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subcompanies</SelectItem>
                      {subcompanyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {modalFilters.subcompany && (
                  <Badge variant="outline" className="bg-muted/60 border-dashed">
                    {subcompanyLabelMap.get(modalFilters.subcompany) || 'Selected Subcompany'}
                  </Badge>
                )}
              </div>
            )}

            {modalMode === 'state-selector' ? (
              <StateLocationSelector
                projects={modalBaseProjects}
                type="state"
                onSelect={(state) => {
                  setModalFilters((prev) => ({ ...prev, state }));
                  setModalReturnMode('state-selector');
                  setModalMode('group-selector');
                  setModalGroupProjectName(null);
                }}
              />
            ) : modalMode === 'location-selector' ? (
              <StateLocationSelector
                projects={modalBaseProjects}
                type="location"
                onSelect={(location) => {
                  setModalFilters((prev) => ({ ...prev, location }));
                  setModalReturnMode('location-selector');
                  setModalMode('group-selector');
                  setModalGroupProjectName(null);
                }}
              />
            ) : modalMode === 'group-selector' ? (
              <GroupedProjectSelector
                projects={modalBaseProjects}
                onSelectGroup={(group: GroupedProject) => {
                  setModalGroupProjectName(group.name);
                  setModalMode('projects');
                }}
              />
            ) : (
              <ScrollArea className="max-h-[65vh] pr-4">
                <div className="space-y-4">
                  {modalProjects.map((project) => {
                  const totalBudget = sanitizeBudgetValue(project.total_budget);
                  const utilizedBudget = sanitizeBudgetValue(project.utilized_budget);
                  const remainingBudget = Math.max(totalBudget - utilizedBudget, 0);
                  const locationLabel = project.location || project.state || 'Location unknown';
                  const startDateLabel = project.start_date
                    ? new Date(project.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'TBD';
                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:shadow-md cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        handleProjectGroupChange(project.id);
                        setShowProjectOverview(false);
                        setModalFilters({});
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleProjectGroupChange(project.id);
                          setShowProjectOverview(false);
                          setModalFilters({});
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-foreground leading-tight">
                            {project.name || 'Unnamed Project'}
                          </p>
                          {project.description && (
                            <p className="text-sm text-muted-foreground leading-snug max-w-xl">
                              {project.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>📍</span>
                            <span>{locationLabel}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.toll_id && (
                            <Badge variant="outline" className="bg-muted/60 border-dashed text-[11px]">
                              {subcompanyLabelMap.get(project.toll_id) || 'Subcompany'}
                            </Badge>
                          )}
                          <Badge
                            variant={project.status === 'active' ? 'default' : 'secondary'}
                            className="uppercase tracking-wide text-[10px]"
                          >
                            {project.status?.toUpperCase() || 'STATUS UNKNOWN'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-muted-foreground mt-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider">Total Budget</p>
                          <p className="font-semibold text-foreground">{formatCurrency(totalBudget)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider">Utilized</p>
                          <p className="font-semibold text-foreground">{formatCurrency(utilizedBudget)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider">Remaining</p>
                          <p className="font-semibold text-foreground">{formatCurrency(remainingBudget)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider">Start Date</p>
                          <p className="font-semibold text-foreground">{startDateLabel}</p>
                        </div>
                      </div>
                      {project.impact_metrics && project.impact_metrics.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-foreground mb-2">Impact Metrics</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {project.impact_metrics.map((metric) => (
                              <div
                                key={`${project.id}-${metric.key}-${metric.customLabel ?? metric.value}`}
                                className="p-3 rounded-xl border border-border bg-muted/60"
                              >
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {formatMetricLabel(metric.customLabel ?? metric.key)}
                                </p>
                                <p className="text-lg font-bold text-foreground">
                                  {metric.value.toLocaleString('en-IN')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProjectOverview(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Budget Modal */}
        <Dialog open={showBudgetModal} onOpenChange={(open) => {
          setShowBudgetModal(open);
          if (!open) {
            setModalFilters({});
            setModalMode('budget-group-selector');
            setBudgetModalGroupProjectName(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                {modalMode === 'budget-projects' && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setModalMode('budget-group-selector');
                    setBudgetModalGroupProjectName(null);
                  }}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <DialogTitle>
                  {modalMode === 'budget-group-selector' ? 'Budget Overview by Project' : 'Project Budget Details'}
                </DialogTitle>
              </div>
              <DialogDescription>
                {modalMode === 'budget-group-selector' 
                  ? 'Select a project to view detailed budget breakdown' 
                  : `Budget details for ${budgetModalProjects.length} project${budgetModalProjects.length === 1 ? '' : 's'}`}
              </DialogDescription>
            </DialogHeader>

            {modalMode === 'budget-group-selector' ? (
              <GroupedProjectSelector
                projects={budgetBaseProjects}
                onSelectGroup={(group: GroupedProject) => {
                  setBudgetModalGroupProjectName(group.name);
                  setModalMode('budget-projects');
                }}
              />
            ) : (
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  {budgetModalProjects.map((project) => {
                    const totalBudget = sanitizeBudgetValue(project.total_budget);
                    const utilizedBudget = sanitizeBudgetValue(project.utilized_budget);
                    const remainingBudget = Math.max(totalBudget - utilizedBudget, 0);
                    const percentage = totalBudget > 0 ? (utilizedBudget / totalBudget) * 100 : 0;
                    const locationLabel = project.location || project.state || 'Location unknown';
                    
                    return (
                      <div
                        key={project.id}
                        className="bg-card rounded-2xl border border-border p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-lg font-bold text-foreground">{project.name || 'Unnamed Project'}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>📍</span>
                              <span>{locationLabel}</span>
                            </p>
                          </div>
                          {project.toll_id && (
                            <Badge variant="outline" className="bg-muted/60 border-dashed text-[11px]">
                              {subcompanyLabelMap.get(project.toll_id) || 'Subcompany'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Budget</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalBudget)}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Utilized</p>
                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(utilizedBudget)}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Remaining</p>
                            <p className="text-xl font-bold text-amber-600">{formatCurrency(remainingBudget)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>Budget Utilization</span>
                            <span className="font-semibold">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBudgetModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isEmpty ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No Projects Available</h3>
            <p className="text-muted-foreground">No projects found for the selected filters.</p>
          </Card>
        ) : (
          <>
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Funds Overview */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Funds Overview</CardTitle>
                      <CardDescription>Budget allocation & usage</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNavigate?.('accounts')}>
                    View Details <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" className="stroke-muted" strokeWidth="8" />
                        <circle 
                          cx="50" cy="50" r="42" fill="none" 
                          className="stroke-primary"
                          strokeWidth="8"
                          strokeDasharray={`${budgetData.percentage * 2.64} 264`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{budgetData.percentage.toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">Utilized</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div 
                        className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                        onClick={() => openBudgetModal('budget-group-selector')}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="text-sm text-muted-foreground">Total Budget</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(budgetData.total)}</span>
                      </div>
                      <div 
                        className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                        onClick={() => openBudgetModal('budget-group-selector')}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="text-sm text-muted-foreground">Utilized</span>
                        <span className="text-lg font-bold text-emerald-600">{formatCurrency(budgetData.utilized)}</span>
                      </div>
                      <div 
                        className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                        onClick={() => openBudgetModal('budget-group-selector')}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className="text-lg font-bold text-amber-600">{formatCurrency(budgetData.remaining)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Overview */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-950/30 flex items-center justify-center">
                        <Target className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Projects Overview</CardTitle>
                        <CardDescription>{overviewStats.total} total projects</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                      <div
                        className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-center cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalWithFilters({ status: 'active' }, 'group-selector');
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openModalWithFilters({ status: 'active' }, 'group-selector');
                          }
                        }}
                      >
                        <p className="text-3xl font-bold text-emerald-600">{overviewStats.active}</p>
                        <p className="text-sm text-muted-foreground">Active Projects</p>
                      </div>
                      <div
                        className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalWithFilters({ status: 'completed' }, 'group-selector');
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openModalWithFilters({ status: 'completed' }, 'group-selector');
                          }
                        }}
                      >
                        <p className="text-3xl font-bold text-blue-600">{overviewStats.completed}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div
                        className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-center cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalWithFilters({}, 'state-selector');
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openModalWithFilters({}, 'state-selector');
                          }
                        }}
                      >
                        <p className="text-3xl font-bold text-purple-600">{overviewStats.states || '-'}</p>
                        <p className="text-sm text-muted-foreground">States Covered</p>
                      </div>
                      <div
                        className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalWithFilters({}, 'location-selector');
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openModalWithFilters({}, 'location-selector');
                          }
                        }}
                      >
                        <p className="text-3xl font-bold text-amber-600">{overviewStats.locations || '-'}</p>
                        <p className="text-sm text-muted-foreground">Locations</p>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Media Gallery */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/30 flex items-center justify-center">
                      <Image className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Recent Items</CardTitle>
                      <CardDescription className="text-xs">{recentMedia.length} items</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNavigate?.('media')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentMedia.length === 0 ? (
                    <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No media available</p>
                      </div>
                    </div>
                  ) : (
                    <Carousel className="w-full overflow-hidden" opts={{ watchDrag: false }} onWheel={(event) => event.preventDefault()}>
                      <CarouselContent className="overflow-hidden">
                        {recentMedia.map((media, index) => {
                          const displayTitle = media.update_title || media.title;
                          return (
                          <CarouselItem key={index}>
                            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                              {media.drive_link ? (
                                <iframe
                                  src={media.drive_link}
                                  title={displayTitle}
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-950/30 dark:to-cyan-950/30">
                                  <Image className="w-16 h-16 text-muted-foreground mb-3" />
                                  <p className="text-sm font-medium text-muted-foreground">{displayTitle}</p>
                                </div>
                              )}
                            </div>
                          </CarouselItem>
                        );})}
                      </CarouselContent>
                      {recentMedia.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </>
                      )}
                    </Carousel>
                  )}
                </CardContent>
              </Card>

              {/* Activities */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-cyan-600" />
                    </div>
                    <CardTitle className="text-base">Recent Activities</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onNavigate?.('timelines')}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentProjectSummaries.map((summary) => {
                      const activityProject = projectsById.get(summary.projectId);
                      const activityProjectLabel = activityProject
                        ? formatProjectLabel(activityProject)
                        : 'Project info unavailable';
                      const projectState = activityProject?.state;
                      const completionPercentage = summary.completion;
                      return (
                        <div key={summary.projectId} className="p-3 rounded-xl bg-muted/50 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <button
                                onClick={() => {
                                  if (activityProject) {
                                    onSelectProject?.(activityProject.id);
                                    localStorage.setItem('portal-selected-project', activityProject.id);
                                    onNavigate?.('timelines');
                                    localStorage.setItem('portal-current-view', 'timelines');
                                  }
                                }}
                                className="font-medium text-sm text-foreground truncate hover:text-primary hover:underline transition-colors text-left"
                              >
                                {activityProjectLabel}
                              </button>
                              {/* <p className="text-xs text-muted-foreground">{activity.section || 'Activity'}</p> */}
                              {projectState && (
                                <p className="text-xs text-muted-foreground">{projectState}</p>
                              )}
                            </div>
                            <Badge 
                              variant={completionPercentage >= 100 ? 'default' : 'secondary'} 
                              className={`text-xs ${
                                completionPercentage >= 100 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-purple-500 text-white'
                              }`}
                            >
                              {completionPercentage}%
                            </Badge>
                          </div>
                          {/* <p className="text-xs text-muted-foreground">{activity.section || 'Construction'}</p> */}
                          <Progress
                            value={completionPercentage}
                            className="h-1.5"
                            indicatorClassName={
                              completionPercentage >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                            }
                          />
                        </div>
                      );
                    })}
                    {recentProjectSummaries.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-8">No activities found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Impact Metrics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Impact Metrics</CardTitle>
                    <CardDescription>{activeMetrics.length} active metrics tracked</CardDescription>
                  </div>
                </div>
                <Button onClick={() => setShowImpactModal(true)}>
                  View All Metrics <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {activeMetrics.slice(0, 6).map((metric) => {
                    const percentage = metric.target > 0 ? Math.min((metric.current / metric.target) * 100, 100) : 100;
                    return (
                      <div 
                        key={metric.key}
                        className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => setShowImpactModal(true)}
                      >
                        <div className="flex items-center gap-2 mb-2 text-primary">
                          {getMetricIcon(metric.key)}
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {metric.key === 'budget' 
                            ? formatCurrency(metric.current)
                            : metric.current.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getMetricTitle(metric.key)}
                        </p>
                        {metric.target > 0 && (
                          <Progress
                            value={percentage}
                            className="h-1 mt-2"
                            indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Impact Metrics Modal */}
        <Dialog open={showImpactModal} onOpenChange={setShowImpactModal}>
          <DialogContent className="max-w-4xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                Impact Metrics
              </DialogTitle>
              <DialogDescription>{activeMetrics.length} metrics tracked across all projects</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMetrics.map((metric) => {
                  const percentage = metric.target > 0 ? Math.min((metric.current / metric.target) * 100, 100) : 100;
                  return (
                    <Card key={metric.key} className="group">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {getMetricIcon(metric.key)}
                          </div>
                          {canEditMetrics && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleEditClick(metric.key, metric.current, metric.target)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          {getMetricTitle(metric.key)}
                        </p>
                        <p className="text-3xl font-bold text-foreground mb-3">
                          {metric.key === 'budget' 
                            ? formatCurrency(metric.current)
                            : metric.current.toLocaleString()}
                        </p>
                        
                        {metric.target > 0 && (
                          <>
                            <Progress
                              value={percentage}
                              className="h-2 mb-2"
                              indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600"
                            />
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Target: {metric.key === 'budget' ? formatCurrency(metric.target) : metric.target.toLocaleString()}
                              </span>
                              <Badge variant={percentage >= 100 ? 'default' : 'secondary'}>
                                {percentage.toFixed(0)}%
                              </Badge>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Edit Metric Modal */}
        <Dialog open={!!editingMetric} onOpenChange={() => setEditingMetric(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {editingMetric ? getMetricTitle(editingMetric) : ''}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Value</label>
                <input
                  type="number"
                  value={editValues.current}
                  onChange={(e) => setEditValues(prev => ({ ...prev, current: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Value</label>
                <input
                  type="number"
                  value={editValues.target}
                  onChange={(e) => setEditValues(prev => ({ ...prev, target: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring outline-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMetric(null)}>Cancel</Button>
              <Button onClick={handleSaveMetric} disabled={isSaving}>
                {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
