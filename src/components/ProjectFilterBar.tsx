import type { SelectOption } from '../lib/projectFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

export interface ProjectFilterBarProps {
  brandColors?: { primary: string; gradient: string };
  projectGroupOptions: SelectOption[];
  selectedProjectGroup: string;
  onProjectGroupChange: (value: string) => void;
  states: string[];
  selectedState: string;
  onStateChange: (value: string) => void;
  subcompanyOptions?: SelectOption[];
  selectedSubcompany?: string;
  onSubcompanyChange?: (value: string) => void;
  resetFilters?: () => void;
}

export default function ProjectFilterBar({
  brandColors,
  projectGroupOptions,
  selectedProjectGroup,
  onProjectGroupChange,
  states,
  selectedState,
  onStateChange,
  subcompanyOptions = [],
  selectedSubcompany = 'all',
  onSubcompanyChange,
  resetFilters,
}: ProjectFilterBarProps) {
  const accent = brandColors?.primary || 'var(--color-emerald-500, #10b981)';
  const selectedProjectOption = projectGroupOptions.find((option) => option.value === selectedProjectGroup);
  const selectedProjectLabel = selectedProjectGroup === 'all' ? 'All Projects' : selectedProjectOption?.label ?? 'Selected Project';

  return (
    <div className="bg-card/80 border border-border rounded-2xl p-4 md:p-5 shadow-sm backdrop-blur mb-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">State</p>
          <Select value={selectedState} onValueChange={onStateChange}>
            <SelectTrigger className="w-[180px] border-2 rounded-xl" style={{ borderColor: accent }}>
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state || 'all'}>
                  {state?.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {onSubcompanyChange && subcompanyOptions.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subcompany</p>
            <Select value={selectedSubcompany} onValueChange={onSubcompanyChange}>
              <SelectTrigger className="w-[180px] border-2 rounded-xl" style={{ borderColor: accent }}>
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
        )}

        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project</p>
          <Select value={selectedProjectGroup} onValueChange={onProjectGroupChange}>
            <SelectTrigger className="w-[220px] border-2 rounded-xl" style={{ borderColor: accent }}>
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectGroupOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="group">
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="mt-1 hidden text-xs text-muted-foreground group-hover:block">
                        {option.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto text-xs text-muted-foreground">
          <Badge variant="outline" className="bg-muted/60 border-dashed">
            {selectedProjectLabel}
          </Badge>
          <Badge variant="outline" className="bg-muted/60 border-dashed">
            {selectedState === 'all' ? 'All States' : selectedState.toUpperCase()}
          </Badge>
          {onSubcompanyChange && (
            <Badge variant="outline" className="bg-muted/60 border-dashed">
              {selectedSubcompany === 'all' ? 'All Subcompanies' : 'Subcompany Selected'}
            </Badge>
          )}
          {resetFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-xl bg-red-500 text-white font-semibold text-xs uppercase tracking-wide shadow hover:bg-red-600 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
