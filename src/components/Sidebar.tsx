import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, FolderKanban, Clock, FileText, FileBarChart, Image, Newspaper, ChevronRight, LogOut } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

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
      className={`relative flex flex-col border-r bg-card transition-all duration-300 ${
        isExpanded ? 'w-72' : 'w-20'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div 
        className="p-4 h-[88px] flex items-center border-b"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border">
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
              <h1 className="text-lg font-bold text-foreground tracking-tight whitespace-nowrap">
                {partner ? `${getShortCompanyName(partner.company_name)}` : 'CSR Portal'}
              </h1>
              <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                CSR Partner Portal
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
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
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon size={24} className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                
                {isExpanded && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden animate-fadeIn">
                    <span className="font-medium tracking-wide text-sm">{item.label}</span>
                    {item.hasDropdown && (
                      <ChevronRight 
                        size={16} 
                        className={`transition-transform duration-200 ${showProjectList ? 'rotate-90' : ''}`}
                      />
                    )}
                  </div>
                )}
              </button>

              {/* Project Dropdown */}
              {item.hasDropdown && showProjectList && isExpanded && (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-border space-y-1 animate-slideDown">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => onProjectSelect(project.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                        selectedProject === project.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-muted/30">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground group`}
        >
          <LogOut size={24} className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {isExpanded && (
            <span className="font-medium tracking-wide text-sm animate-fadeIn">LOGOUT</span>
          )}
        </button>
      </div>
    </div>
  );
}
