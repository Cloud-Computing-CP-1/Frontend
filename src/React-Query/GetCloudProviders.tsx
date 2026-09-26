import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";

interface CloudProvider {
  id: string;
  provider_name: string;
  is_enabled: boolean;
  updated_at?: string;
}

export function useCloudProviders() {
  const { axiosInstance } = UseStateContext()!;
  const base = (axiosInstance.defaults.baseURL || "").replace(/\/+$/, "");
  const adminPath = `${base.endsWith("/api") ? "" : "/api"}/admin`;
  return useQuery<CloudProvider[]>({
    queryKey: ["admin-cloud-providers"],
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get(`${adminPath}/get_all_provider`, { signal, timeout: 15000 });
      if (!data.Status || !Array.isArray(data.responseData) || !data.responseData.every((provider: CloudProvider) =>
        provider && provider.id != null && typeof provider.provider_name === "string" && typeof provider.is_enabled === "boolean"
      )) throw new Error("Cloud provider status is unavailable.");
      return data.responseData;
    },
    refetchInterval: 15000,
    retry: 1,
  });
}
