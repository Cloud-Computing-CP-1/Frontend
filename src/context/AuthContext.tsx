import { createContext, useContext, type ReactNode } from "react";
import { useMemo } from "react";
import axios, { type AxiosInstance } from "axios"
const baseUrl = import.meta.env.VITE_BACKEND_URI

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
        return instance
    }, [])
    return <Authcontex.Provider value={{ axiosInstance }}>
        {children}
    </Authcontex.Provider>
}

export const UseStateContext = () => {
    return useContext(Authcontex)
}