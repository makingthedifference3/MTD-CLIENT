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
}

const compareProjectsByUtilizedBudgetDesc = (a: Project, b: Project) => {
  const utilizedA = a.utilized_budget ?? 0;
  const utilizedB = b.utilized_budget ?? 0;
  if (utilizedB !== utilizedA) return utilizedB - utilizedA;
  return (a.name ?? '').localeCompare(b.name ?? '');
};

const sortProjectsByUtilizedBudgetDesc = (projects: Project[]) => [...projects].sort(compareProjectsByUtilizedBudgetDesc);

export const matchesGroupProject = (project: Project, projectName: string | null, allProjects: Project[]) => {
  if (!projectName) return true;
  
  // Get all parent projects with this name
  const parentIds = allProjects
    .filter(p => !p.parent_project_id && p.name === projectName)
    .map(p => p.id);
  
  // Check if project is one of the parents or a child of any parent
  return parentIds.includes(project.id) || (project.parent_project_id && parentIds.includes(project.parent_project_id));
};

export default function GroupedProjectSelector({ projects, onSelectGroup }: GroupedProjectSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groupedProjects = useMemo(() => {
    const groups = new Map<string, GroupedProject>();
    
    // First pass: create groups for parent projects and collect their children
    projects.forEach((project) => {
      if (project.parent_project_id) return; // Skip children for now

      const name = project.name || 'Unnamed Project';
      const existing = groups.get(name);

      const childProjects = projects.filter((p) => p.parent_project_id === project.id);
      const totalBudget = (project.total_budget || 0) + childProjects.reduce((sum, child) => sum + (child.total_budget || 0), 0);
      const utilizedBudget = (project.utilized_budget || 0) + childProjects.reduce((sum, child) => sum + (child.utilized_budget || 0), 0);

      if (existing) {
        existing.childProjects.push(...childProjects);
        existing.totalBudget += totalBudget;
        existing.utilizedBudget += utilizedBudget;
      } else {
        groups.set(name, {
          name,
          mainProject: project,
          childProjects,
          totalBudget,
          utilizedBudget,
        });
      }
    });
    
    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        childProjects: sortProjectsByUtilizedBudgetDesc(group.childProjects),
      }))
      .sort((a, b) => {
        if (b.utilizedBudget !== a.utilizedBudget) return b.utilizedBudget - a.utilizedBudget;
        return a.name.localeCompare(b.name);
      });
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
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-slate-50 to-white shadow-sm hover:shadow-lg hover:border-primary/40 cursor-pointer transition-all"
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
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary/5 to-emerald-50 pointer-events-none"></div>
                <div className="relative p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={(event) => toggleGroup(group.name, event)}
                            className="p-1.5 rounded-full bg-muted/80 hover:bg-muted border border-border"
                            aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                        <h3 className="text-lg font-bold text-foreground leading-snug">{group.name}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-semibold">
                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{formatCurrency(group.totalBudget)} total</span>
                        <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{formatCurrency(group.utilizedBudget)} used</span>
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{percentage.toFixed(0)}% utilized</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>

                  <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/60">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>

              {isExpanded && hasChildren && (
                <div className="ml-8 space-y-2">
                  {group.childProjects.map((child) => {
                    const childTotal = child.total_budget || 0;
                    const childUtilized = child.utilized_budget || 0;
                    const childPercent = childTotal > 0 ? (childUtilized / childTotal) * 100 : 0;
                    return (
                      <div key={child.id} className="p-3 rounded-xl border border-border bg-muted/40">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground leading-snug">{child.name || 'Unnamed'}</p>
                          {child.toll_id && (
                            <Badge variant="outline" className="text-[10px]">
                              {child.toll_id}
                            </Badge>
                          )}
                        </div>
                        {child.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-tight">{child.description}</p>
                        )}
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground font-semibold">
                          <div>
                            <p className="uppercase tracking-wider text-[10px]">Budget</p>
                            <p className="font-semibold text-foreground">{formatCurrency(childTotal)}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wider text-[10px]">Utilized</p>
                            <p className="font-semibold text-foreground">{formatCurrency(childUtilized)}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wider text-[10px]">Utilization</p>
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
