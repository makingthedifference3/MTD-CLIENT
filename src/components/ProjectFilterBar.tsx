import type { CSSProperties } from 'react';
import type { SelectOption } from '../lib/projectFilters';

export interface ProjectFilterBarProps {
  brandColors?: { primary: string; gradient: string };
  projectGroupOptions: SelectOption[];
  selectedProjectGroup: string;
  onProjectGroupChange: (value: string) => void;
  states: string[];
  selectedState: string;
  onStateChange: (value: string) => void;
  tollOptions?: SelectOption[];
  selectedToll?: string;
  onTollChange?: (value: string) => void;
}

const selectBaseStyles = (brandColors?: ProjectFilterBarProps['brandColors']): CSSProperties => ({
  borderColor: brandColors?.primary || '#a78bfa',
});

export default function ProjectFilterBar({
  brandColors,
  projectGroupOptions,
  selectedProjectGroup,
  onProjectGroupChange,
  states,
  selectedState,
  onStateChange,
  tollOptions = [],
  selectedToll = 'all',
  onTollChange,
}: ProjectFilterBarProps) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
      <div className="flex flex-wrap items-end gap-4">
        {/* Toll Filter */}
        {onTollChange && tollOptions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Toll</p>
            <select
              value={selectedToll}
              onChange={(event) => onTollChange(event.target.value)}
              className="mt-1 px-5 py-3 bg-white/80 border-2 rounded-2xl font-semibold text-xs uppercase tracking-wide focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              style={selectBaseStyles(brandColors)}
            >
              <option value="all">All Tolls</option>
              {tollOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Project Filter */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project</p>
          <select
            value={selectedProjectGroup}
            onChange={(event) => {
              onProjectGroupChange(event.target.value);
            }}
            className="mt-1 px-5 py-3 bg-white/80 border-2 rounded-2xl font-semibold text-xs uppercase tracking-wide focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            style={selectBaseStyles(brandColors)}
          >
            <option value="all">All Projects</option>
            {projectGroupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">State</p>
        <select
          value={selectedState}
          onChange={(event) => onStateChange(event.target.value)}
          className="mt-1 px-6 py-3 bg-white/80 border-2 rounded-2xl font-semibold text-sm uppercase tracking-wide focus:outline-none focus:ring-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          style={selectBaseStyles(brandColors)}
        >
          <option value="ALL STATES">ALL STATES</option>
          {states.map((state) => (
            <option key={state} value={state || ''}>
              {state?.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
