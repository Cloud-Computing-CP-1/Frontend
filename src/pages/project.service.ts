import type { RepoItem } from "./Components/AllRepo";

export interface Project {
  id: string;
  projects_name: string;
  user_id: string;
  repo_id: string;
  repo_name: string;
  repo_owner: string;
  branch: string;
  current_image_id: string | null;
  statuss: string;
  created_at: string;
  updated_at?: string;
  deployment_url?: string | null;
  cloud_provider?: string | null;
}

export function projectRepository(project: Project): RepoItem {
  const url = project.repo_name.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/)?.[1] || project.repo_name;
  const repoName = url.split("/").pop()?.replace(/\.git$/, "") || project.projects_name;
  return {
    id: project.repo_id,
    name: repoName,
    full_name: `${project.repo_owner}/${repoName}`,
    clone_url: url,
    html_url: url.replace(/\.git$/, ""),
    owner: { login: project.repo_owner },
    default_branch: project.branch,
    private: false,
    fork: false,
  };
}
