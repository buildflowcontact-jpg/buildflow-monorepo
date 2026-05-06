import React from 'react';

interface ProjectBannerProps {
  label: string;
  projectName: string;
  projects?: Array<{ id: string; name: string; code?: string }>;
  selectedProjectId?: string | null;
  onProjectChange?: (projectId: string) => void;
}

export function ProjectBanner({ label, projectName, projects = [], selectedProjectId, onProjectChange }: ProjectBannerProps) {
  return (
    <div className="surface-panel px-4 py-3 mb-4 md:mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="bf-project-banner-label text-xs uppercase tracking-wide font-bold">{label}</div>
        <div className="bf-text-primary text-base md:text-lg font-black">{projectName}</div>
      </div>

      {projects.length > 0 && onProjectChange ? (
        <label className="bf-project-banner-label flex flex-col gap-1 text-xs font-bold uppercase tracking-wide">
          Projet actif
          <select
            value={selectedProjectId ?? projects[0]?.id ?? ''}
            onChange={(event) => onProjectChange(event.target.value)}
            className="bf-select min-w-[220px] rounded-xl px-3 py-2 text-sm font-semibold normal-case tracking-normal outline-none transition-colors"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}{project.code ? ` (${project.code})` : ''}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );

}