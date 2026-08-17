import { createContext, useContext, type ReactNode } from "react";
import { useMemo } from "react";
import axios, { type AxiosInstance } from "axios"
const baseUrl = import.meta.env.VITE_BACKEND_URI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface StateContextType {
    axiosInstance: AxiosInstance
}
const Authcontex = createContext<(StateContextType | null)>(null)
export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
    const axiosInstance = useMemo(() => {
        const instance = axios.create({
            baseURL: baseUrl,
            withCredentials: true,
        })
        instance.interceptors.request.use((config) => {
            const isAuthRequest = config.url?.startsWith("/api/auth")
            const token = isAuthRequest ? localStorage.getItem("Client_token") : null
            if (token) {
                config.headers.Authorization = `Bearer  ${token}`
            } else {
                delete config.headers.Authorization
            }
            return config;
        })
        return instance
    }, [baseUrl])
    return <Authcontex.Provider value={{ axiosInstance }}>
        {children}
    </Authcontex.Provider>
}

export const UseStateContext = () => {
    return useContext(Authcontex)
}