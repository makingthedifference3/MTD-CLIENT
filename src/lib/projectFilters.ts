import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { Project } from '../types/csr';

export type SelectOption = { value: string; label: string };

export interface UseProjectFiltersOptions {
  projects: Project[];
  selectedProjectId: string | null;
}

export interface UseProjectFiltersResult {
  filteredProjects: Project[];
  visibleProjectIds: string[];
  states: string[];
  projectGroupOptions: SelectOption[];
  selectedProjectGroup: string;
  setSelectedProjectGroup: Dispatch<SetStateAction<string>>;
  selectedState: string;
  setSelectedState: Dispatch<SetStateAction<string>>;
}

export function useProjectFilters({ projects, selectedProjectId }: UseProjectFiltersOptions): UseProjectFiltersResult {
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('all');
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
      return;
    }
    const project = projects.find((item) => item.id === selectedProjectId);
    if (project) {
      setSelectedProjectGroup(project.name || 'Unnamed Project');
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

  const filteredProjects = useMemo(() => {
    const stateConstraint = selectedState === 'ALL STATES' ? undefined : selectedState;
    let workingSet = selectedGroupProjects;
    if (stateConstraint) {
      workingSet = workingSet.filter((project) => project.state === stateConstraint);
    }
    return workingSet;
  }, [selectedGroupProjects, selectedState]);

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

  return {
    filteredProjects,
    visibleProjectIds,
    states,
    projectGroupOptions,
    selectedProjectGroup,
    setSelectedProjectGroup,
    selectedState,
    setSelectedState,
  };
}
