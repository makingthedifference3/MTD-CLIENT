import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type {
  Project,
  Timeline,
  Report,
  RealTimeUpdate,
  Media as MediaAsset,
  Article as ArticleAsset,
  Toll,
  ProjectActivity,
  ProjectActivityItem,
} from '../types/csr';
import { supabase } from '../lib/supabase';
import {
  mapProjects,
  mapTimelines,
  mapReports,
  mapUpdates,
  splitMediaArticles,
} from '../lib/dataTransforms';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Timelines from './Timelines';
import Accounts from './Accounts';
import Reports from './Reports';
import MediaGallery from './Media';
import ArticleHighlights from './Article';
import { useProjectFilters } from '../lib/projectFilters';
import { getBrandColors, getCompanyLogo } from '../lib/logodev';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface PartnerCollections {
  projects: Project[];
  timelines: Timeline[];
  activities: ProjectActivity[];
  reports: Report[];
  updates: RealTimeUpdate[];
  mediaPhotos: MediaAsset[];
  mediaVideos: MediaAsset[];
  articles: ArticleAsset[];
}

export default function Portal() {
  const { user, partner, logout } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('portal-current-view');
    return savedView || 'dashboard';
  });
  const [selectedProject, setSelectedProject] = useState<string | null>(() => {
    const savedProject = localStorage.getItem('portal-selected-project');
    return savedProject || null;
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [tolls, setTolls] = useState<Toll[]>([]);
  const [selectedSubcompany, setSelectedSubcompany] = useState('all');
  const [collections, setCollections] = useState<PartnerCollections>({
    projects: [],
    timelines: [],
    activities: [],
    reports: [],
    updates: [],
    mediaPhotos: [],
    mediaVideos: [],
    articles: [],
  });

  useEffect(() => {
    if (!partner?.id) return;
    const partnerId = partner.id;

    let cancelled = false;

    const loadData = async () => {
      setDataLoading(true);
      setDataError(null);

      try {
        let query = supabase
          .from('projects')
          .select(
            'id, csr_partner_id, name, project_code, description, status, location, state, city, start_date, expected_end_date, actual_end_date, total_budget, approved_budget, utilized_budget, beneficiaries_reached, total_beneficiaries, direct_beneficiaries, indirect_beneficiaries, male_beneficiaries, female_beneficiaries, children_beneficiaries, pads_distributed, trees_planted, meals_served, students_enrolled, schools_renovated, targets, achievements, created_at, toll_id, parent_project_id, is_beneficiary_project, beneficiary_name, impact_metrics'
          )
          .eq('csr_partner_id', partnerId);

        // Filter by Toll ID if the user is a Toll User
        if (user?.toll_id) {
          query = query.eq('toll_id', user.toll_id);
        }

        const { data: projectRows, error: projectError } = await query.order('start_date', { ascending: false });

        if (projectError) throw projectError;

        // Fetch Tolls
        const { data: tollRows, error: tollError } = await supabase
          .from('csr_partner_tolls')
          .select('id, toll_name, csr_partner_id')
          .eq('csr_partner_id', partnerId);
        
        if (tollError) console.error('Error fetching tolls:', tollError);
        else setTolls(tollRows || []);

        const mappedProjects = mapProjects(projectRows ?? []);
        const projectIds = mappedProjects.map((project) => project.id);

        let mappedTimelines: Timeline[] = [];
        let mappedActivities: ProjectActivity[] = [];
        let mappedReports: Report[] = [];
        let mappedUpdates: RealTimeUpdate[] = [];
        let mediaPhotos: MediaAsset[] = [];
        let mediaVideos: MediaAsset[] = [];
        let mappedArticles: ArticleAsset[] = [];

        if (projectIds.length) {
          const [timelineRes, activitiesRes, reportsRes, updatesRes, mediaRes, tempReportsRes, mergedReportsRes] = await Promise.all([
            supabase.from('timelines').select('*').in('project_id', projectIds),
            supabase.from('project_activities').select(`
              *,
              projects:project_id (name)
            `).in('project_id', projectIds).eq('is_active', true),
            supabase.from('reports').select('*').in('project_id', projectIds),
            supabase.from('real_time_updates').select('*').in('project_id', projectIds),
            supabase.from('media_articles').select('*').in('project_id', projectIds),
            supabase.from('real_time_temp').select('*').in('project_id', projectIds),
            supabase.from('real_time_merged_reports').select('*').in('project_id', projectIds),
          ]);

          if (timelineRes.error) throw timelineRes.error;
          if (activitiesRes.error) console.error('Activities error:', activitiesRes.error);
          if (reportsRes.error) throw reportsRes.error;
          if (updatesRes.error) throw updatesRes.error;
          if (mediaRes.error) throw mediaRes.error;
          if (tempReportsRes.error) throw tempReportsRes.error;
          if (mergedReportsRes.error) throw mergedReportsRes.error;

          mappedTimelines = mapTimelines(timelineRes.data ?? []);
          
          // Map activities and attach project name
          const rawActivities = activitiesRes.data ?? [];
          mappedActivities = rawActivities.map((a: any) => ({
            ...a,
            project_name: a.projects?.name,
          }));

          // Fetch activity items for all activities
          if (mappedActivities.length > 0) {
            const activityIds = mappedActivities.map((a) => a.id);
            const { data: itemsData } = await supabase
              .from('project_activity_items')
              .select('*')
              .in('activity_id', activityIds)
              .order('item_order', { ascending: true });
            
            const itemsByActivity = new Map<string, ProjectActivityItem[]>();
            (itemsData ?? []).forEach((item: any) => {
              const list = itemsByActivity.get(item.activity_id) || [];
              list.push(item);
              itemsByActivity.set(item.activity_id, list);
            });
            
            mappedActivities = mappedActivities.map((a) => ({
              ...a,
              items: itemsByActivity.get(a.id) || [],
            }));
          }

          const normalizeDate = (value?: string | null) => {
            if (!value) return new Date().toISOString().slice(0, 10);
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
          };

          const tempReports = (tempReportsRes.data ?? [])
            .filter((row: any) => row.id && row.project_id)
            .map((row: any) => ({
              id: row.id,
              project_id: row.project_id as string,
              title: row.update_number ? `Monthly Update ${row.update_number}` : 'Monthly Update',
              date: normalizeDate(row.date_of_report),
              drive_link: row.pdf_link ?? undefined,
              source: 'monthly' as const,
            }));

          const mergedReports = (mergedReportsRes.data ?? [])
            .filter((row: any) => row.id && row.project_id)
            .map((row: any) => ({
              id: row.id,
              project_id: row.project_id as string,
              title: row.title || 'Merged Monthly Report',
              date: normalizeDate(row.end_date ?? row.start_date),
              drive_link: row.pdf_url ?? undefined,
              source: 'merged' as const,
            }));

          mappedReports = [
            ...mergedReports,
            ...tempReports,
            ...mapReports(reportsRes.data ?? []),
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const tempUpdates = (tempReportsRes.data ?? [])
            .filter((row: any) => row.id && row.project_id)
            .map((row: any) => ({
              id: row.id,
              project_id: row.project_id as string,
              title: row.update_number ? `Update ${row.update_number}` : 'Update PDF',
              date: normalizeDate(row.date_of_report),
              description: row.description ?? '',
              drive_link: row.pdf_link ?? undefined,
              is_downloadable: Boolean(row.pdf_link),
              source: 'temp' as const,
            }));

          mappedUpdates = [
            ...mapUpdates(updatesRes.data ?? []),
            ...tempUpdates,
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          const updateTitleById = new Map<string, string>(
            mappedUpdates.map((update) => [update.id, update.title])
          );

          const mediaWithUpdateTitles = (mediaRes.data ?? []).map((m: any) => ({
            ...m,
            update_title: m.update_id ? updateTitleById.get(m.update_id) ?? null : null,
          }));
          const mediaSplit = splitMediaArticles(mediaWithUpdateTitles);
          mediaPhotos = mediaSplit.media.filter((asset) => asset.type === 'photo');
          mediaVideos = mediaSplit.media.filter((asset) => asset.type === 'video');
          mappedArticles = mediaSplit.articles;
        }

        if (cancelled) return;

        setCollections({
          projects: mappedProjects,
          timelines: mappedTimelines,
          activities: mappedActivities,
          reports: mappedReports,
          updates: mappedUpdates,
          mediaPhotos,
          mediaVideos,
          articles: mappedArticles,
        });
        setSelectedProject(null);
      } catch (error: any) {
        if (cancelled) return;
        console.error('Data loading error:', error);
        const message = error?.message || (error instanceof Error ? error.message : 'Failed to load partner data');
        setDataError(message);
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [partner?.id, user?.toll_id]);

  const ownedSubcompanyId = user?.toll_id ?? null;
  const subcompanyOptions = useMemo(
    () =>
      ownedSubcompanyId
        ? []
        : tolls.map((toll) => ({ value: toll.id, label: toll.toll_name })),
    [tolls, ownedSubcompanyId]
  );
  const subcompanyFilterEnabled = !ownedSubcompanyId && subcompanyOptions.length > 0;

  useEffect(() => {
    setSelectedSubcompany((prev) => {
      if (ownedSubcompanyId) return ownedSubcompanyId;
      if (!subcompanyFilterEnabled) return 'all';
      if (prev !== 'all' && !subcompanyOptions.some((option) => option.value === prev)) {
        return 'all';
      }
      return prev;
    });
  }, [ownedSubcompanyId, subcompanyFilterEnabled, subcompanyOptions]);

  function handleViewChange(view: string) {
    setCurrentView(view);
    localStorage.setItem('portal-current-view', view);
  }

  const filteredBySubcompany = useMemo(() => {
    if (ownedSubcompanyId) {
      return collections.projects.filter((project) => project.toll_id === ownedSubcompanyId);
    }
    if (selectedSubcompany === 'all') {
      return collections.projects;
    }
    return collections.projects.filter((project) => project.toll_id === selectedSubcompany);
  }, [collections.projects, ownedSubcompanyId, selectedSubcompany]);

  const activeProjectIds = useMemo(
    () => filteredBySubcompany.map((project) => project.id),
    [filteredBySubcompany]
  );

  useEffect(() => {
    if (selectedProject && !activeProjectIds.includes(selectedProject)) {
      setSelectedProject(null);
    }
  }, [activeProjectIds, selectedProject]);

  const visibleProjects = filteredBySubcompany;

  // Shared project/date/state filter logic for all main views
  const projectFilters = useProjectFilters({
    projects: filteredBySubcompany,
    selectedProjectId: selectedProject,
    selectedSubcompany,
    onSubcompanyChange: setSelectedSubcompany,
  });

  const subcompanyChangeHandler = subcompanyFilterEnabled ? setSelectedSubcompany : undefined;

  const currentProject = collections.projects.find((p) => p.id === selectedProject);
  const brandColors = partner ? getBrandColors(partner.primary_color || '#059669') : null;

  const viewLabel = (() => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'timelines':
        return 'Timelines';
      case 'accounts':
        return 'Accounts';
      case 'reports':
        return 'Reports';
      case 'media':
        return 'Media Gallery';
      case 'article':
        return 'News Articles';
      default:
        return 'Projects';
    }
  })();

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      // 1. Update Database
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      // 2. Update Local State
      setCollections((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, ...updates } : p
        ),
      }));
    } catch (error) {
      console.error('Error updating project:', error);
      throw error; // Re-throw so Dashboard can handle/show error state if needed
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        subcompanyOptions={subcompanyOptions}
        selectedSubcompany={selectedSubcompany}
        onSubcompanyChange={subcompanyChangeHandler}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <header
            className="px-8 py-4 h-[88px] flex items-center justify-between bg-card/90 border-b border-border/70 shadow-sm backdrop-blur"
          >
            <div className="flex items-center gap-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-muted/30 backdrop-blur-sm overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                  border: `2px solid ${brandColors?.primary || '#667eea'}`,
                }}
              >
                <img
                  src={getCompanyLogo('mtdngo.com', { size: 56 })}
                  alt="MTD Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentProject?.name || 'ALL PROJECTS OVERVIEW'}
                  </h2>
                  <Badge variant="outline" className="uppercase tracking-wide bg-muted/60 border-dashed">
                    {viewLabel}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-muted-foreground mt-1">
                  {currentProject?.state || 'All Locations'} • {viewLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ">Logged in as</p>
                <p className="text-sm font-bold text-foreground ">{user?.full_name}</p>
                <p className="text-xs font-semibold text-foreground/80 ">{partner?.company_name}</p>
              </div>
              <Button variant="destructive" onClick={logout} className="gap-2 shadow-md">
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-background rounded-b-3xl min-h-0">
            {dataError && (
              <div className="mx-8 mt-6 mb-2 p-4 border-2 border-red-200 bg-red-50 rounded-2xl text-red-700 font-semibold">
                {dataError}
              </div>
            )}

            {currentView === 'dashboard' && (
              <Dashboard
                selectedProject={selectedProject}
                projects={visibleProjects}
                loading={dataLoading}
                onUpdateProject={handleUpdateProject}
                photos={collections.mediaPhotos}
                videos={collections.mediaVideos}
                reports={collections.reports}
                updates={collections.updates}
                activities={collections.activities}
                onNavigate={handleViewChange}
                subcompanyOptions={subcompanyOptions}
                selectedSubcompany={selectedSubcompany}
                onSubcompanyChange={subcompanyChangeHandler}
                onSelectProject={setSelectedProject}
              />
            )}
            {currentView === 'timelines' && (
              <Timelines
                projects={visibleProjects}
                // timelines={collections.timelines}
                activities={collections.activities}
                projectFilters={projectFilters}
                brandColors={brandColors}
                loading={dataLoading}
                subcompanyOptions={subcompanyOptions}
                selectedSubcompany={selectedSubcompany}
                onSubcompanyChange={subcompanyChangeHandler}
              />
            )}

            {currentView === 'accounts' && (
              <Accounts
                projects={visibleProjects}
                projectData={collections.projects}
                projectFilters={projectFilters}
                brandColors={brandColors}
                loading={dataLoading}
                subcompanyOptions={subcompanyOptions}
                selectedSubcompany={selectedSubcompany}
                onSubcompanyChange={subcompanyChangeHandler}
              />
            )}

            {currentView === 'reports' && (
              <Reports
                projects={visibleProjects}
                updates={collections.updates}
                reports={collections.reports}
                projectFilters={projectFilters}
                brandColors={brandColors}
                loading={dataLoading}
                subcompanyOptions={subcompanyOptions}
                selectedSubcompany={selectedSubcompany}
                onSubcompanyChange={subcompanyChangeHandler}
              />
            )}

            {currentView === 'media' && (
              <MediaGallery
                projects={visibleProjects}
                photos={collections.mediaPhotos}
                videos={collections.mediaVideos}
                projectFilters={projectFilters}
                brandColors={brandColors}
                loading={dataLoading}
                subcompanyOptions={subcompanyOptions}
                selectedSubcompany={selectedSubcompany}
                onSubcompanyChange={subcompanyChangeHandler}
              />
            )}
            {currentView === 'article' && (
              <ArticleHighlights
                projects={visibleProjects}
                articles={collections.articles}
                videos={collections.mediaVideos}
                projectFilters={projectFilters}
                brandColors={brandColors}
                loading={dataLoading}
                subcompanyOptions={subcompanyOptions}
                selectedSubcompany={selectedSubcompany}
                onSubcompanyChange={subcompanyChangeHandler}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
