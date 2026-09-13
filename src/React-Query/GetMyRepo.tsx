import { useQuery } from "@tanstack/react-query";
import { UseStateContext } from "../context/AuthContext";

export const UsegetMyrepo = () => {
    const { axiosInstance } = UseStateContext()!
    const result = useQuery(
        {
            queryKey: ["get-my-repo"],
            queryFn: async () => {
                const Response = await axiosInstance.get("/auth/getmyrepo")
                return Response.data.responseData
            }
        }
    )
    return { ...result, data: result.data }
}