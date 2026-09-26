import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { UseStateContext } from "../context/AuthContext";

export interface DeploymentResult {
  status?: string;
  deploymentUrl?: string;
  hostname?: string;
  providerResourceId?: string;
  providerMetadata?: { serviceName?: string };
}

export function useDeployProject(projectId: string) {
  const { axiosInstance } = UseStateContext()!;
  const queryClient = useQueryClient();
  return useMutation<DeploymentResult, Error>({
    mutationKey: ["deploy-project", projectId],
    retry: false,
    mutationFn: async () => {
      if (!projectId) throw new Error("Select a project to deploy.");
      try {
        const response = await axiosInstance.get(`/deploy/depoyed-web-server/${encodeURIComponent(projectId)}`);
        if (!response.data.Status) throw new Error(response.data.Sendmessage || "Deployment request failed.");
        if (["FAILED", "ERROR", "CRASHED"].includes(String(response.data.responseData?.status).toUpperCase())) {
          throw new Error("The cloud provider reported a failed deployment. Check deployment history before trying again.");
        }
        return response.data.responseData || {};
      } catch (error) {
        if (isAxiosError(error)) {
          throw new Error(error.response
            ? "Deployment request failed. Check deployment history before trying again."
            : "Could not confirm the deployment result. Check deployment history before trying again.", { cause: error });
        }
        throw error;
      }
    },
    onSettled: async () => {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ["get-projects"] }),
        queryClient.invalidateQueries({ queryKey: ["project-deployments", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["current-project-image", projectId] }),
      ]);
    },
  });
}
