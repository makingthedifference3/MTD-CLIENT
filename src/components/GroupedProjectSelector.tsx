import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Project } from '@/types/csr';

export interface GroupedProject {
  name: string;
  mainProject: Project;
  childProjects: Project[];
  totalBudget: number;
  utilizedBudget: number;
}

interface GroupedProjectSelectorProps {
  projects: Project[];
  onSelectGroup: (group: GroupedProject) => void;
  type?: 'overview' | 'budget';
}

export const matchesGroupProject = (project: Project, projectName: string | null, allProjects: Project[]) => {
  if (!projectName) return true;
  
  // Get all parent projects with this name
  const parentIds = allProjects
    .filter(p => !p.parent_project_id && p.name === projectName)
    .map(p => p.id);
  
  // Check if project is one of the parents or a child of any parent
  return parentIds.includes(project.id) || (project.parent_project_id && parentIds.includes(project.parent_project_id));
};

export default function GroupedProjectSelector({ projects, onSelectGroup, type = 'overview' }: GroupedProjectSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groupedProjects = useMemo(() => {
    const groups = new Map<string, GroupedProject>();
    
    // First pass: create groups for parent projects and collect their children
    projects.forEach((project) => {
      if (project.parent_project_id) return; // Skip children for now
      
      const name = project.name || 'Unnamed Project';
      const existing = groups.get(name);
      
      // Find all children of this project
      const childProjects = projects.filter(p => p.parent_project_id === project.id);
      const totalBudget = (project.total_budget || 0) + childProjects.reduce((sum, child) => sum + (child.total_budget || 0), 0);
      const utilizedBudget = (project.utilized_budget || 0) + childProjects.reduce((sum, child) => sum + (child.utilized_budget || 0), 0);
      
      if (existing) {
        // Merge into existing group
        existing.childProjects.push(...childProjects);
        existing.totalBudget += totalBudget;
        existing.utilizedBudget += utilizedBudget;
      } else {
        // Create new group
        groups.set(name, {
          name,
          mainProject: project,
          childProjects,
          totalBudget,
          utilizedBudget,
        });
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const toggleGroup = (name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <ScrollArea className="max-h-[60vh] pr-4">
      <div className="space-y-3">
        {groupedProjects.map((group) => {
          const utilization = group.totalBudget > 0 ? (group.utilizedBudget / group.totalBudget) * 100 : 0;
          const percentage = Math.min(utilization, 100);
          const isExpanded = expandedGroups.has(group.name);
          const hasChildren = group.childProjects.length > 0;

          return (
            <div key={group.name} className="space-y-2">
              <div
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/60 hover:shadow-md cursor-pointer transition-all"
                onClick={() => onSelectGroup(group)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectGroup(group);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {hasChildren && (
                        <button
                          type="button"
                          onClick={(event) => toggleGroup(group.name, event)}
                          className="p-1 rounded-full bg-muted/70 hover:bg-muted"
                          aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>💰 {formatCurrency(group.totalBudget)}</span>
                      <span>•</span>
                      <span>{percentage.toFixed(0)}% utilized</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${percentage}%` }} />
                </div>
              </div>

              {isExpanded && hasChildren && (
                <div className="ml-8 space-y-2">
                  {group.childProjects.map((child) => {
                    const childTotal = child.total_budget || 0;
                    const childUtilized = child.utilized_budget || 0;
                    const childPercent = childTotal > 0 ? (childUtilized / childTotal) * 100 : 0;
                    return (
                      <div key={child.id} className="p-3 rounded-xl border border-border bg-muted/30">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{child.name || 'Unnamed'}</p>
                          {child.toll_id && (
                            <Badge variant="outline" className="text-[10px]">
                              {child.toll_id}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                          <div>
                            <p className="uppercase tracking-wider">Budget</p>
                            <p className="font-semibold text-foreground">{formatCurrency(childTotal)}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wider">Utilized</p>
                            <p className="font-semibold text-foreground">{formatCurrency(childUtilized)}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wider">Utilization</p>
                            <p className="font-semibold text-foreground">{childTotal ? `${childPercent.toFixed(0)}%` : '—'}</p>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
                            style={{ width: `${Math.min(childPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
