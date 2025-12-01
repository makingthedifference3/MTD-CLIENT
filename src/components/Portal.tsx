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
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [tolls, setTolls] = useState<Toll[]>([]);
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
          const [timelineRes, activitiesRes, reportsRes, updatesRes, mediaRes] = await Promise.all([
            supabase.from('timelines').select('*').in('project_id', projectIds),
            supabase.from('project_activities').select(`
              *,
              projects:project_id (name)
            `).in('project_id', projectIds).eq('is_active', true),
            supabase.from('reports').select('*').in('project_id', projectIds),
            supabase.from('real_time_updates').select('*').in('project_id', projectIds),
            supabase.from('media_articles').select('*').in('project_id', projectIds),
          ]);

          if (timelineRes.error) throw timelineRes.error;
          if (activitiesRes.error) console.error('Activities error:', activitiesRes.error);
          if (reportsRes.error) throw reportsRes.error;
          if (updatesRes.error) throw updatesRes.error;
          if (mediaRes.error) throw mediaRes.error;

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

          mappedReports = mapReports(reportsRes.data ?? []);
          mappedUpdates = mapUpdates(updatesRes.data ?? []);
          const mediaSplit = splitMediaArticles(mediaRes.data ?? []);
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

  function handleViewChange(view: string) {
    setCurrentView(view);
    if (view !== 'projects') {
      setShowProjectList(false);
    }
  }

  function handleProjectSelect(projectId: string) {
    setSelectedProject(selectedProject === projectId ? null : projectId);
    setCurrentView('dashboard');
  }

  function handleToggleProjectList() {
    setShowProjectList((prev) => !prev);
  }

  const activeProjectIds = useMemo(
    () => collections.projects.map((project) => project.id),
    [collections.projects]
  );

  useEffect(() => {
    if (selectedProject && !activeProjectIds.includes(selectedProject)) {
      setSelectedProject(null);
    }
  }, [activeProjectIds, selectedProject]);

  const visibleProjects = collections.projects.filter((project) => activeProjectIds.includes(project.id));

  // Shared project/date/state filter logic for all main views
  const projectFilters = useProjectFilters({
    projects: collections.projects,
    selectedProjectId: selectedProject,
  });

  const currentProject = collections.projects.find((p) => p.id === selectedProject);
  const brandColors = partner ? getBrandColors(partner.primary_color || '#059669') : null;

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
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        selectedProject={selectedProject}
        projects={visibleProjects}
        onProjectSelect={handleProjectSelect}
        showProjectList={showProjectList}
        onToggleProjectList={handleToggleProjectList}
      />

      <div
        className="flex-1 flex flex-col overflow-hidden rounded-3xl shadow-2xl m-3"
        style={{
          background: brandColors?.primary || '#667eea',
        }}
      >
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-3xl">
          <header
            className="px-8 py-4 h-[88px] flex items-center justify-between shadow-lg rounded-t-3xl"
            style={{
              background: brandColors?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderBottom: `3px solid ${brandColors?.primary || '#667eea'}`,
            }}
          >
            <div className="flex items-center gap-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white/30 backdrop-blur-sm overflow-hidden"
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
                <h2 className="text-2xl font-bold text-white drop-shadow-md">
                  {currentProject?.name || 'ALL PROJECTS OVERVIEW'}
                </h2>
                <p className="text-sm font-semibold text-white/90 mt-1 drop-shadow">
                  {currentProject?.state || 'All Locations'} •
                  {currentView === 'dashboard'
                    ? 'Dashboard'
                    : currentView === 'timelines'
                      ? 'Timelines'
                      : currentView === 'accounts'
                        ? 'Accounts'
                        : currentView === 'reports'
                          ? 'Reports'
                          : currentView === 'media'
                            ? 'Media Gallery'
                            : currentView === 'article'
                              ? 'News Articles'
                              : 'Projects'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider drop-shadow">Logged in as</p>
                <p className="text-sm font-bold text-white drop-shadow-md">{user?.full_name}</p>
                <p className="text-xs font-semibold text-white/80 drop-shadow">{partner?.company_name}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-white rounded-b-3xl">
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
            tolls={tolls}
          />
        )}            {currentView === 'timelines' && (
              <Timelines
                projects={visibleProjects}
                // timelines={collections.timelines}
                activities={collections.activities}
                projectFilters={projectFilters}
                brandColors={brandColors}
                loading={dataLoading}
              />
            )}

            {currentView === 'accounts' && (
              <Accounts
                projects={visibleProjects}
                projectData={collections.projects}
                projectFilters={projectFilters}
                brandColors={brandColors}
                loading={dataLoading}
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
