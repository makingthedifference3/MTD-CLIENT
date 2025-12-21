import type { SelectOption } from '../lib/projectFilters';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

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

  const [stateOpen, setStateOpen] = useState(false);
  const [subcompanyOpen, setSubcompanyOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  const stateOptions = useMemo(() => {
    const normalized = states
      .map((state) => (state || '').trim())
      .filter(Boolean);
    return ['all', ...Array.from(new Set(normalized))];
  }, [states]);

  const projectOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Projects' },
      ...projectGroupOptions,
    ];
  }, [projectGroupOptions]);

  const subcompanySelectOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Subcompanies' },
      ...subcompanyOptions,
    ];
  }, [subcompanyOptions]);

  const selectedStateLabel = selectedState === 'all' ? 'All States' : selectedState.toUpperCase();
  const selectedSubcompanyLabel =
    selectedSubcompany === 'all'
      ? 'All Subcompanies'
      : subcompanySelectOptions.find((o) => o.value === selectedSubcompany)?.label ?? 'Subcompany Selected';

  return (
    <div className="bg-card/80 border border-border rounded-2xl p-4 md:p-5 shadow-sm backdrop-blur mb-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">State</p>
          <Popover open={stateOpen} onOpenChange={setStateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={stateOpen}
                className="w-[180px] justify-between border-2 rounded-xl"
                style={{ borderColor: accent }}
              >
                {selectedStateLabel}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search state..." />
                <CommandList>
                  <CommandEmpty>No state found.</CommandEmpty>
                  <CommandGroup>
                    {stateOptions.map((state) => (
                      <CommandItem
                        key={state}
                        value={state}
                        onSelect={(value) => {
                          onStateChange(value || 'all');
                          setStateOpen(false);
                        }}
                      >
                        {state === 'all' ? 'All States' : state.toUpperCase()}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {onSubcompanyChange && subcompanyOptions.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subcompany</p>
            <Popover open={subcompanyOpen} onOpenChange={setSubcompanyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={subcompanyOpen}
                  className="w-[180px] justify-between border-2 rounded-xl"
                  style={{ borderColor: accent }}
                >
                  {selectedSubcompanyLabel}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search subcompany..." />
                  <CommandList>
                    <CommandEmpty>No subcompany found.</CommandEmpty>
                    <CommandGroup>
                      {subcompanySelectOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            onSubcompanyChange(option.value);
                            setSubcompanyOpen(false);
                          }}
                        >
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project</p>
          <Popover open={projectOpen} onOpenChange={setProjectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={projectOpen}
                className="w-[220px] justify-between border-2 rounded-xl"
                style={{ borderColor: accent }}
              >
                {selectedProjectLabel}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search project..." />
                <CommandList>
                  <CommandEmpty>No project found.</CommandEmpty>
                  <CommandGroup>
                    {projectOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          onProjectGroupChange(option.value);
                          setProjectOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {option.description && (
                            <span className="mt-1 text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto text-xs text-muted-foreground">
          <Badge variant="outline" className="bg-muted/60 border-dashed">
            {selectedProjectLabel}
          </Badge>
          <Badge variant="outline" className="bg-muted/60 border-dashed">
            {selectedStateLabel}
          </Badge>
          {onSubcompanyChange && (
            <Badge variant="outline" className="bg-muted/60 border-dashed">
              {selectedSubcompanyLabel}
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
