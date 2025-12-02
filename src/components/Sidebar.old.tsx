import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, FolderKanban, Clock, FileText, FileBarChart, Image, Newspaper, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { getBrandColors } from '../lib/logodev';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  selectedProject: string | null;
  projects: Array<{ id: string; name: string; start_date?: string }>;
  onProjectSelect: (projectId: string) => void;
  showProjectList: boolean;
  onToggleProjectList: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  selectedProject,
  projects,
  onProjectSelect,
  showProjectList,
  onToggleProjectList,
}: SidebarProps) {
  const { partner, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get brand colors
  const brandColors = partner ? getBrandColors(partner.primary_color || '#059669') : null;
  
  // Get shortened company name if too long
  const getShortCompanyName = (fullName: string) => {
    if (fullName.length <= 15) return fullName;
    
    // Common abbreviations
    const abbreviations: { [key: string]: string } = {
      'Tata Consultancy Services': 'TCS',
      'Hindustan Unilever Limited': 'HUL',
      'State Bank of India': 'SBI',
      'Housing Development Finance Corporation': 'HDFC',
      'Bharat Petroleum Corporation Limited': 'BPCL',
      'Indian Oil Corporation': 'IOC',
      'Steel Authority of India Limited': 'SAIL',
      'Oil and Natural Gas Corporation': 'ONGC',
      'National Thermal Power Corporation': 'NTPC',
      'Larsen & Toubro': 'L&T',
      'Mahindra & Mahindra': 'M&M',
    };
    
    if (abbreviations[fullName]) return abbreviations[fullName];
    
    // If not in list, create abbreviation from capital letters
    const capitals = fullName.match(/[A-Z]/g);
    if (capitals && capitals.length >= 2) return capitals.join('');
    
    // Otherwise return first 12 chars
    return fullName.substring(0, 12) + '...';
  };

  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: Home },
    { id: 'projects', label: 'PROJECTS', icon: FolderKanban, hasDropdown: true },
    { id: 'timelines', label: 'TIMELINES', icon: Clock },
    { id: 'accounts', label: 'ACCOUNTS', icon: FileBarChart },
    { id: 'reports', label: 'REPORTS', icon: FileText },
    { id: 'media', label: 'MEDIA', icon: Image },
    { id: 'article', label: 'ARTICLE', icon: Newspaper },
  ];

  return (
    <div 
      className={`relative flex flex-col shadow-xl transition-all duration-300 rounded-3xl m-3 overflow-hidden ${
        isExpanded ? 'w-80' : 'w-20'
      }`}
      style={{
        background: `linear-gradient(180deg, ${brandColors?.lighter || '#faf5ff'}, white)`,
        borderRight: `3px solid ${brandColors?.primary || '#a78bfa'}`
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div 
        className="p-4 shadow-md h-[88px] flex items-center rounded-t-3xl"
        style={{
          background: brandColors?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: `3px solid ${brandColors?.darker || '#7c3aed'}`
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-lg flex-shrink-0 ring-4 ring-white/30">
            {partner && (
              <CompanyLogo 
                website={partner.website || ''} 
                companyName={partner.company_name}
                size={48}
              />
            )}
          </div>
          {isExpanded && (
            <div className="overflow-hidden animate-fadeIn">
              <h1 className="text-lg font-bold text-white drop-shadow-md tracking-tight whitespace-nowrap">
                {partner ? `${getShortCompanyName(partner.company_name)} X MTD` : 'CSR Portal'}
              </h1>
              <p className="text-xs font-semibold text-white/90 drop-shadow tracking-wide whitespace-nowrap">
                CSR Partner Portal
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto bg-white">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.hasDropdown) {
                    onToggleProjectList();
                  } else {
                    onViewChange(item.id);
                  }
                }}
                className={`w-full flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 group ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-slate-700 hover:bg-white/50'
                }`}
                style={isActive ? {
                  background: brandColors?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                } : {}}
                title={!isExpanded ? item.label : ''}
              >
                <div className={`flex items-center ${isExpanded ? 'gap-3' : ''}`}>
                  <Icon className={`w-5 h-5 transition-transform flex-shrink-0`} />
                  {isExpanded && <span className="tracking-wide whitespace-nowrap">{item.label}</span>}
                </div>
                {item.hasDropdown && isExpanded && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${
                      showProjectList ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {item.hasDropdown && showProjectList && isExpanded && (
                <div className="mt-2 ml-4 space-y-2 animate-fadeIn">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => onProjectSelect(project.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${
                        selectedProject === project.id
                          ? 'text-white shadow-lg'
                          : 'text-slate-600 hover:bg-white/50'
                      }`}
                      style={selectedProject === project.id ? {
                        background: brandColors?.gradientReverse || 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                      } : {}}
                    >
                      <div className="flex flex-col text-left">
                        <span>{project.name}</span>
                        {project.start_date && (
                          <span className="text-[10px] uppercase tracking-widest text-white/70">
                            {new Date(project.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      {/* Logout Button at Bottom */}
      <div 
        className="p-4 shadow-inner rounded-b-3xl"
        style={{
          borderTop: `2px solid ${brandColors?.primary || '#a78bfa'}`,
          background: `linear-gradient(180deg, white, ${brandColors?.lighter || '#faf5ff'})`
        }}
      >
        <button
          onClick={logout}
          className={`w-full flex items-center ${isExpanded ? 'justify-start gap-3' : 'justify-center'} px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-lg`}
          title={!isExpanded ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 transition-transform flex-shrink-0" />
          {isExpanded && <span className="tracking-wide whitespace-nowrap">LOGOUT</span>}
        </button>
      </div>
      
      {/* Expand/Collapse Indicator */}
      {!isExpanded && (
        <div 
          className="absolute top-1/2 -right-3 text-white p-1 rounded-full shadow-md"
          style={{ background: brandColors?.primary || '#a78bfa' }}
        >
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
