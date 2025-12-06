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
  Building2, Target, ArrowRight, Image, Wallet, ChevronRight, Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import ProjectFilterBar from '@/components/ProjectFilterBar';

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
}: DashboardProps) {
  const { partner, user } = useAuth();
  const { addToast } = useToast();
  const [selectedState, setSelectedState] = useState('all');
  const [showImpactModal, setShowImpactModal] = useState(false);
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
  const canEditMetrics = Boolean(onUpdateProject && user?.role !== 'client');

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

  useEffect(() => {
    setSelectedProjectGroup(selectedProject ?? 'all');
  }, [selectedProject]);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (selectedProjectGroup !== 'all') {
      result = result.filter((project) => project.id === selectedProjectGroup);
    }
    if (selectedState !== 'all') {
      result = result.filter(p => p.state === selectedState);
    }
    return result;
  }, [projects, selectedProjectGroup, selectedState]);

  const visibleProjectIds = useMemo(() => filteredProjects.map(p => p.id), [filteredProjects]);

  const overviewStats = useMemo(() => {
    const active = filteredProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const completed = filteredProjects.filter(p => p.status === 'completed').length;
    const uniqueStates = new Set(filteredProjects.map(p => p.state).filter(Boolean)).size;
    const uniqueLocations = new Set(filteredProjects.map(p => p.location).filter(Boolean)).size;
    return { total: filteredProjects.length, active, completed, states: uniqueStates, locations: uniqueLocations };
  }, [filteredProjects]);

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

  const activeMetrics = useMemo(() => {
    const result: Array<{ key: string; current: number; target: number }> = [];
    Object.entries(metrics).forEach(([key, value]) => {
      if (value.current > 0) {
        result.push({ key, current: value.current, target: value.target });
      }
    });
    return result;
  }, [metrics]);

  const allMedia = useMemo(() => {
    const media = [
      ...photos.filter(p => visibleProjectIds.includes(p.project_id)).map(p => ({ ...p, mediaType: 'photo' as const })),
      ...videos.filter(v => visibleProjectIds.includes(v.project_id)).map(v => ({ ...v, mediaType: 'video' as const }))
    ];
    return media;
  }, [photos, videos, visibleProjectIds]);

  const filteredActivities = useMemo(() => activities.filter(a => visibleProjectIds.includes(a.project_id)).slice(0, 5), [activities, visibleProjectIds]);

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
          onProjectGroupChange={setSelectedProjectGroup}
          states={states}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          subcompanyOptions={subcompanyOptions}
          selectedSubcompany={selectedSubcompany}
          onSubcompanyChange={onSubcompanyChange}
        />

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
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                        <span className="text-sm text-muted-foreground">Total Budget</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(budgetData.total)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                        <span className="text-sm text-muted-foreground">Utilized</span>
                        <span className="text-lg font-bold text-emerald-600">{formatCurrency(budgetData.utilized)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
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
                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center">
                      <Target className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Projects Overview</CardTitle>
                      <CardDescription>{overviewStats.total} total projects</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-center">
                      <p className="text-3xl font-bold text-emerald-600">{overviewStats.active}</p>
                      <p className="text-sm text-muted-foreground">Active Projects</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-center">
                      <p className="text-3xl font-bold text-blue-600">{overviewStats.completed}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-center">
                      <p className="text-3xl font-bold text-purple-600">{overviewStats.states || '-'}</p>
                      <p className="text-sm text-muted-foreground">States Covered</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center">
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
                    <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/30 flex items-center justify-center">
                      <Image className="w-5 h-5 text-pink-600" />
                    </div>
                    <CardTitle className="text-base">{allMedia.length} items</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNavigate?.('media')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {allMedia.length === 0 ? (
                    <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No media available</p>
                      </div>
                    </div>
                  ) : (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {allMedia.map((media, index) => (
                          <CarouselItem key={index}>
                            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                              {media.drive_link ? (
                                <iframe
                                  src={media.drive_link}
                                  title={media.title}
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30">
                                  <Image className="w-16 h-16 text-muted-foreground mb-3" />
                                  <p className="text-sm font-medium text-muted-foreground">{media.title}</p>
                                </div>
                              )}
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {allMedia.length > 1 && (
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
                    <CardTitle className="text-base">{filteredActivities.length} activities</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onNavigate?.('timelines')}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredActivities.map((activity) => (
                      <div key={activity.id} className="p-3 rounded-xl bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-foreground truncate">{activity.title}</p>
                          <Badge 
                            variant={activity.completion_percentage >= 100 ? 'default' : 'secondary'} 
                            className={`text-xs ${
                              activity.completion_percentage >= 100 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-purple-500 text-white'
                            }`}
                          >
                            {activity.completion_percentage}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.section || 'Construction'}</p>
                        <Progress
                          value={activity.completion_percentage}
                          className="h-1.5"
                          indicatorClassName={
                            activity.completion_percentage >= 100
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                              : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                          }
                        />
                      </div>
                    ))}
                    {filteredActivities.length === 0 && (
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
