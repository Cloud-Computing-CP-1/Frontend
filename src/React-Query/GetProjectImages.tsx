import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";

export interface ProjectImage {
  id: string;
  project_id: string;
  repo_id: string;
  repo_url: string;
  branch: string;
  image_uri: string | null;
  image_digest: string | null;
  image_tags: string | null;
  status_: string;
  build_start_at: string | null;
  build_completed_at: string | null;
  created_at: string;
}

export function UsegetProjectImages(projectId: string, enabled = true) {
  const { axiosInstance } = UseStateContext()!;
  return useQuery<ProjectImage[]>({
    queryKey: ["project-images", projectId],
    enabled,
    queryFn: async () => {
      const response = await axiosInstance.get(`/build/image/project/${encodeURIComponent(projectId)}`);
      if (!response.data.Status || !Array.isArray(response.data.responseData)) {
        throw new Error(response.data.Sendmessage || "Could not load project images.");
      }
      return response.data.responseData;
    },
  });
}
