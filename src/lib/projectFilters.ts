import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { Project } from '../types/csr';

export type SelectOption = { value: string; label: string; description?: string };

export const formatProjectLabel = (project: Partial<Project>): string => {
  const rawCode = project.project_code || project.code;
  const code = rawCode?.trim();
  const name = project.name?.trim() || 'Unnamed Project';
  const location = project.location ? ` • ${project.location}` : '';
  const prefix = code ? `${code} • ` : '';
  return `${prefix}${name}${location}`;
};

export const formatProjectIdentity = (project?: Partial<Project>): string => {
  if (!project) {
    return 'Project info unavailable';
  }

  const code = (project.project_code || project.code || '').trim();
  const name = project.name?.trim() || 'Unnamed Project';
  const location = project.location?.trim();

  const parts = [code, name, location].filter(Boolean);
  if (!parts.length) {
    return 'Project info unavailable';
  }

  return parts.join(', ');
};

export interface UseProjectFiltersOptions {
  projects: Project[];
  selectedProjectId: string | null;
  selectedSubcompany?: string;
  subcompanyStateLookup?: Record<string, string | undefined>;
  onSubcompanyChange?: (value: string) => void;
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
  resetFilters: () => void;
}

export function useProjectFilters({
  projects,
  selectedProjectId,
  selectedSubcompany,
  subcompanyStateLookup,
  onSubcompanyChange,
}: UseProjectFiltersOptions): UseProjectFiltersResult {
  const [selectedProjectGroup, setSelectedProjectGroup] = useState('all');
  const [selectedState, setSelectedState] = useState('all');

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProjectGroup('all');
      return;
    }
    setSelectedProjectGroup(selectedProjectId);
  }, [selectedProjectId]);

  const projectsForFilterOptions = useMemo(() => {
    let working = projects;
    if (selectedSubcompany && selectedSubcompany !== 'all') {
      working = working.filter((project) => project.toll_id === selectedSubcompany);
    }
    if (selectedState && selectedState !== 'all') {
      working = working.filter((project) => project.state === selectedState);
    }
    return working;
  }, [projects, selectedState, selectedSubcompany]);

  const projectGroupOptions = useMemo<SelectOption[]>(
    () =>
      projectsForFilterOptions
        .map((project) => ({
          value: project.id,
          label: formatProjectLabel(project),
          description: project.description ?? undefined,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [projectsForFilterOptions]
  );

  const selectedGroupProjects =
    selectedProjectGroup === 'all'
      ? projects
      : projects.filter((project) => project.id === selectedProjectGroup);

  const projectsForStateOptions = useMemo(() => {
    if (selectedProjectGroup !== 'all') return selectedGroupProjects;
    if (selectedSubcompany && selectedSubcompany !== 'all') {
      return projects.filter((project) => project.toll_id === selectedSubcompany);
    }
    return projects;
  }, [projects, selectedGroupProjects, selectedProjectGroup, selectedSubcompany]);

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
    projectsForStateOptions.forEach((project) => {
      if (project.state) {
        stateSet.add(project.state);
      }
    });
    return Array.from(stateSet).sort((a, b) => a.localeCompare(b));
  }, [projectsForStateOptions]);

  useEffect(() => {
    if (selectedProjectGroup === 'all') return;
    const project = selectedGroupProjects[0];
    if (!project?.state) return;
    setSelectedState(project.state);
  }, [selectedGroupProjects, selectedProjectGroup]);

  useEffect(() => {
    if (selectedProjectGroup !== 'all') return;

    const applyState = (value: string) => {
      setSelectedState((current) => (current === value ? current : value));
    };

    if (selectedSubcompany && selectedSubcompany !== 'all') {
      const enforcedState = subcompanyStateLookup?.[selectedSubcompany];
      if (enforcedState) {
        applyState(enforcedState);
        return;
      }
    }

    if (states.length === 1) {
      applyState(states[0]);
    }
  }, [selectedProjectGroup, selectedSubcompany, subcompanyStateLookup, states]);

  const visibleProjectIds = useMemo(() => filteredProjects.map((project) => project.id), [filteredProjects]);

  const resetFilters = () => {
    setSelectedProjectGroup('all');
    setSelectedState('all');
    if (onSubcompanyChange) {
      onSubcompanyChange('all');
    }
  };

  return {
    filteredProjects,
    visibleProjectIds,
    states,
    projectGroupOptions,
    selectedProjectGroup,
    setSelectedProjectGroup,
    selectedState,
    setSelectedState,
    resetFilters,
  };
}
