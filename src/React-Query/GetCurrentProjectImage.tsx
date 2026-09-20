import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";
import type { ProjectImage } from "./GetProjectImages";

export function UsegetCurrentProjectImage(projectId: string) {
  const { axiosInstance } = UseStateContext()!;
  return useQuery<ProjectImage | null>({
    queryKey: ["current-project-image", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/project/get-current-ruining-image/${encodeURIComponent(projectId)}`);
      if (!response.data.Status) throw new Error(response.data.Sendmessage || "Could not load the current image.");
      const image = response.data.responseData;
      if (image == null) return null;
      if (String(image.project_id) !== projectId) throw new Error("The current image does not belong to this project.");
      return image as ProjectImage;
    },
  });
}
