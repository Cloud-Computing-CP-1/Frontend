import { useQuery } from "@tanstack/react-query";
import { FiExternalLink, FiRefreshCw, FiTerminal } from "react-icons/fi";
import { UseStateContext } from "../../context/AuthContext";

interface BuildLogResult { status?: string; logsUrl?: string; errorMessage?: string }

export default function BuildLogViewer({ buildId }: { buildId: string }) {
  const { axiosInstance } = UseStateContext()!;
  const { data, isLoading, isError, isFetching, refetch } = useQuery<BuildLogResult>({
    queryKey: ["build-log-details", buildId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/build/image/${encodeURIComponent(buildId)}`);
      if (!response.data.Status || !response.data.responseData) throw new Error("Build details unavailable");
      return response.data.responseData;
    },
    retry: 1,
  });
  const safeLogsUrl = data?.logsUrl?.startsWith("https://") ? data.logsUrl : null;
  return <div className="dfw-log-view" aria-label="Build logs"><div className="dfw-inline-between"><strong><FiTerminal /> Build logs</strong><button type="button" className="dfw-button" disabled={isFetching} onClick={() => void refetch()} aria-label="Refresh build logs"><FiRefreshCw /></button></div>
    {isLoading ? <p role="status">Checking provider logs...</p> : isError ? <p role="alert">Build logs could not be loaded. Use refresh to try again.</p> : <><p>Build <code>{buildId}</code>{data?.status ? ` · ${data.status}` : ""}</p>{data?.errorMessage && <p role="alert">{data.errorMessage}</p>}{safeLogsUrl ? <a className="dfw-button" href={safeLogsUrl} target="_blank" rel="noreferrer">Open provider logs <FiExternalLink /></a> : <p>No provider log link is available for this build.</p>}</>}
  </div>;
}
