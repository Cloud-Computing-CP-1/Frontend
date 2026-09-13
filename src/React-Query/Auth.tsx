import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";
export const UsergetUser = () => {
   const {axiosInstance} = UseStateContext()!
   const result  = useQuery({
      queryKey: ["Get-user-profile"],
      queryFn: async () => {
        const response = await axiosInstance.get("/auth/getMyprofile")
        return response.data.responseData
      }
   })
 return {...result,data:result.data}
}

