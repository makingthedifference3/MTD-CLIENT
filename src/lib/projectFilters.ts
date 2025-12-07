import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { Project } from '../types/csr';

export type SelectOption = { value: string; label: string };

export const formatProjectLabel = (project: Partial<Project>): string => {
  const name = project.name?.trim() || 'Unnamed Project';
  const location = project.location ? ` • ${project.location}` : '';
  return `${name}${location}`;
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
  selectedProjectGroup: string;
  setSelectedProjectGroup: Dispatch<SetStateAction<string>>;
  selectedState: string;
  setSelectedState: Dispatch<SetStateAction<string>>;
}

export function useProjectFilters({ projects, selectedProjectId }: UseProjectFiltersOptions): UseProjectFiltersResult {
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('all');
  const [selectedState, setSelectedState] = useState('all');

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProjectGroup('all');
      return;
    }
    setSelectedProjectGroup(selectedProjectId);
  }, [selectedProjectId]);

  const projectGroupOptions = useMemo<SelectOption[]>(
    () =>
      projects
        .map((project) => ({ value: project.id, label: formatProjectLabel(project) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [projects]
  );

  const selectedGroupProjects =
    selectedProjectGroup === 'all'
      ? projects
      : projects.filter((project) => project.id === selectedProjectGroup);

  const filteredProjects = useMemo(() => {
    const stateConstraint = selectedState === 'all' ? undefined : selectedState;
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
