import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";
import type { Project } from "../pages/project.service";

export function UsegetProjects(enabled = true) {
  const { axiosInstance } = UseStateContext()!;
  return useQuery<Project[]>({
    queryKey: ["get-projects"],
    enabled,
    queryFn: async () => {
      const response = await axiosInstance.get("/project/get-projects");
      if (!response.data.Status || !Array.isArray(response.data.responseData)) {
        throw new Error(response.data.Sendmessage || "Could not load projects.");
      }
      return response.data.responseData;
    },
  });
}
