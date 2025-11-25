import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { Project } from '../types/csr';

export type SelectOption = { value: string; label: string };

const normalizeDateValue = (value?: string) => {
  if (!value) return 'unknown';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'unknown' : parsed.toISOString().slice(0, 10);
};

export interface UseProjectFiltersOptions {
  projects: Project[];
  selectedProjectId: string | null;
}

export interface UseProjectFiltersResult {
  filteredProjects: Project[];
  visibleProjectIds: string[];
  states: string[];
  projectGroupOptions: SelectOption[];
  projectDateOptions: SelectOption[];
  selectedProjectGroup: string;
  setSelectedProjectGroup: Dispatch<SetStateAction<string>>;
  projectDateFilter: string;
  setProjectDateFilter: Dispatch<SetStateAction<string>>;
  selectedState: string;
  setSelectedState: Dispatch<SetStateAction<string>>;
  showDateFilter: boolean;
  normalizeDateValue: (value?: string) => string;
}

export function useProjectFilters({ projects, selectedProjectId }: UseProjectFiltersOptions): UseProjectFiltersResult {
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('all');
  const [projectDateFilter, setProjectDateFilter] = useState('together');
  const [selectedState, setSelectedState] = useState('ALL STATES');

  const projectGroups = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach((project) => {
      const name = project.name || 'Unnamed Project';
      if (!map.has(name)) {
        map.set(name, []);
      }
      map.get(name)!.push(project);
    });
    return map;
  }, [projects]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProjectGroup('all');
      setProjectDateFilter('together');
      return;
    }
    const project = projects.find((item) => item.id === selectedProjectId);
    if (project) {
      setSelectedProjectGroup(project.name || 'Unnamed Project');
      setProjectDateFilter('together');
    }
  }, [projects, selectedProjectId]);

  const projectGroupOptions = useMemo<SelectOption[]>(
    () =>
      Array.from(projectGroups.keys())
        .sort()
        .map((name) => ({ value: name, label: name })),
    [projectGroups]
  );

  const selectedGroupProjects =
    selectedProjectGroup === 'all'
      ? projects
      : projectGroups.get(selectedProjectGroup) ?? [];

  const projectDateOptions = useMemo<SelectOption[]>(() => {
    if (selectedProjectGroup === 'all') return [];
    if (selectedGroupProjects.length <= 1) return [];
    const unique = new Map<string, string>();
    selectedGroupProjects.forEach((project) => {
      const value = normalizeDateValue(project.start_date);
      if (!unique.has(value)) {
        unique.set(
          value,
          value === 'unknown'
            ? 'Date unavailable'
            : new Date(value).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        );
      }
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [selectedGroupProjects, selectedProjectGroup]);

  const filteredProjects = useMemo(() => {
    const stateConstraint = selectedState === 'ALL STATES' ? undefined : selectedState;
    let workingSet = selectedGroupProjects;
    if (stateConstraint) {
      workingSet = workingSet.filter((project) => project.state === stateConstraint);
    }
    if (selectedProjectGroup !== 'all' && projectDateFilter !== 'together') {
      workingSet = workingSet.filter((project) => normalizeDateValue(project.start_date) === projectDateFilter);
    }
    return workingSet;
  }, [selectedGroupProjects, selectedState, selectedProjectGroup, projectDateFilter]);

  const states = useMemo(() => {
    const stateSet = new Set<string>();
    projects.forEach((project) => {
      if (project.state) {
        stateSet.add(project.state);
      }
    });
    return Array.from(stateSet).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const visibleProjectIds = useMemo(() => filteredProjects.map((project) => project.id), [filteredProjects]);
  const showDateFilter = selectedProjectGroup !== 'all' && selectedGroupProjects.length > 1;

  return {
    filteredProjects,
    visibleProjectIds,
    states,
    projectGroupOptions,
    projectDateOptions,
    selectedProjectGroup,
    setSelectedProjectGroup,
    projectDateFilter,
    setProjectDateFilter,
    selectedState,
    setSelectedState,
    showDateFilter,
    normalizeDateValue,
  };
}
