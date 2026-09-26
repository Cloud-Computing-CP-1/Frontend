import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";

export interface ProjectDeployment {
  id: string;
  project_id: string;
  image_id: string | null;
  cloud_provider: string | null;
  region: string | null;
  provider_service: string | null;
  status: string;
  hostname: string | null;
  deployment_url: string | null;
  provider_resource_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export function UsegetProjectDeployments(projectId: string) {
  const { axiosInstance } = UseStateContext()!;
  return useQuery<ProjectDeployment[]>({
    queryKey: ["project-deployments", projectId],
    enabled: Boolean(projectId),
    queryFn: async ({ signal }) => {
      const response = await axiosInstance.get(`/deploy/get-all-deploy-instance/${encodeURIComponent(projectId)}`, { signal });
      if (!response.data.Status || !Array.isArray(response.data.responseData)) throw new Error("Could not load deployments.");
      return (response.data.responseData as ProjectDeployment[])
        .filter(item => String(item.project_id) === projectId)
        .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) || String(b.id).localeCompare(String(a.id), undefined, { numeric: true }));
    },
    refetchInterval: 30_000,
  });
}
