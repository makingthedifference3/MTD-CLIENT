import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projects as allProjects, type Project } from '../data/mockData';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Timelines from './Timelines';
import Accounts from './Accounts';
import Reports from './Reports';
import Media from './Media';
import Article from './Article';
import { getBrandColors, getCompanyLogo } from '../lib/logodev';
import { LogOut } from 'lucide-react';

export default function Portal() {
  const { user, partner, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(false);

  useEffect(() => {
    if (!partner) return;

    const partnerProjects = allProjects.filter(p => p.csr_partner_id === partner.id);
    setProjects(partnerProjects);
    
    // Don't auto-select a project - start with overall view
    setSelectedProject(null);
  }, [partner]);

  function handleViewChange(view: string) {
    setCurrentView(view);
    if (view !== 'projects') {
      setShowProjectList(false);
    }
  }

  function handleProjectSelect(projectId: string) {
    // Toggle project selection - if same project clicked, show overall
    setSelectedProject(selectedProject === projectId ? null : projectId);
    setCurrentView('dashboard');
  }

  function handleToggleProjectList() {
    setShowProjectList(!showProjectList);
  }

  const projectsSimple = projects.map(p => ({ id: p.id, name: p.name, state: p.state }));
  const currentProject = projects.find(p => p.id === selectedProject);
  
  // Get brand colors
  const brandColors = partner ? getBrandColors(partner.primary_color) : null;

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        selectedProject={selectedProject}
        projects={projectsSimple}
        onProjectSelect={handleProjectSelect}
        showProjectList={showProjectList}
        onToggleProjectList={handleToggleProjectList}
      />

      <div 
        className="flex-1 flex flex-col overflow-hidden rounded-3xl shadow-2xl m-3"
        style={{ 
          background: brandColors?.primary || '#667eea'
        }}
      >
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-3xl">
          <header 
            className="px-8 py-4 h-[88px] flex items-center justify-between shadow-lg rounded-t-3xl"
            style={{ 
              background: brandColors?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderBottom: `3px solid ${brandColors?.primary || '#667eea'}`
            }}
          >
          <div className="flex items-center gap-6">
            {/* Company Symbol Badge */}
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white/30 backdrop-blur-sm overflow-hidden"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                border: `2px solid ${brandColors?.primary || '#667eea'}`
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
                {currentView === 'dashboard' ? 'Dashboard' : 
                     currentView === 'timelines' ? 'Timelines' : 
                     currentView === 'accounts' ? 'Accounts' : 
                     currentView === 'reports' ? 'Reports' : 
                     currentView === 'media' ? 'Media Gallery' : 
                     currentView === 'article' ? 'News Articles' : 'Projects'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
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

        {/* Main Content Area */}
        <div 
          className="flex-1 overflow-auto bg-white rounded-b-3xl"
        >
          {currentView === 'dashboard' && (
            <Dashboard selectedProject={selectedProject} projects={projectsSimple} />
          )}

          {currentView === 'timelines' && (
            <Timelines projectId={selectedProject} projects={projectsSimple} />
          )}

          {currentView === 'accounts' && (
            <Accounts projectId={selectedProject} projects={projectsSimple} />
          )}

          {currentView === 'reports' && (
            <Reports projectId={selectedProject} projects={projectsSimple} />
          )}

          {currentView === 'media' && (
            <Media projectId={selectedProject} projects={projectsSimple} />
          )}

          {currentView === 'article' && (
            <Article projectId={selectedProject} projects={projectsSimple} />
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
