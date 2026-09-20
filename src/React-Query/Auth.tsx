import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";
import { isAxiosError } from "axios";

export interface AuthUser {
  id: string | number;
  username: string | null;
  email: string | null;
}

export const UsergetUser = () => {
   const {axiosInstance} = UseStateContext()!
   const result  = useQuery<AuthUser>({
      queryKey: ["Get-user-profile"],
      retry: (attempt, error) => !(isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) && attempt < 1,
      queryFn: async () => {
        const response = await axiosInstance.get("/auth/getMyprofile")
        if (!response.data.Status || response.data.responseData?.id == null) throw new Error("Please sign in to continue.");
        return response.data.responseData
      }
   })
 return {...result,data:result.data}
}

