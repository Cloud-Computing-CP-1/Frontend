import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";

export interface ProjectEnvVar {
  key: string;
  value: string;
}

export function UsegetProjectEnv(projectId?: string, enabled = true) {
  const { axiosInstance } = UseStateContext()!;
  return useQuery<ProjectEnvVar[]>({
    queryKey: ["project-env", projectId],
    enabled: Boolean(projectId) && enabled,
    queryFn: async () => {
      const response = await axiosInstance.get(`/project/getenv/${encodeURIComponent(projectId!)}`);
      if (!response.data.Status || !Array.isArray(response.data.responseData)) {
        throw new Error(response.data.Sendmessage || "Could not load project environment variables.");
      }
      return response.data.responseData;
    },
  });
}
