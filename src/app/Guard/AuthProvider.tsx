"use client"

import { ReactNode, useEffect } from "react"
import { useAuth } from "../store/auth/useAuth"
import { supabase } from "../lib/supabase"
import { useUiStore } from "../store/useUiStore"


interface AuthProviderProps{
    children : ReactNode
}

export default function AuthProvider({children} : AuthProviderProps){
    const { setUser , setSession } = useAuth()
    const { setLoading } = useUiStore()

    useEffect(() => {
        let mounted = true 
        const initializeAuth = async () => {
            setLoading('loadingSession',true)
            try{
                const { data : { session } , error } = await supabase.auth.getSession()
                if(error){
                    console.error('Error fetching session:', error)
                }

                if(mounted){
                    setSession(session)
                    setUser(session?.user ?? null)
                }

            }catch(error){
                console.error(error)
                if(mounted){
                    setSession(null)
                    setUser(null)
                }
            }
        }
        initializeAuth()

        const { data : { subscription } } = supabase.auth.onAuthStateChange(
            async (event , session) => {
                console.log('Auth state changed:', event, session)

                if(mounted) {
                    setSession(session)
                    setUser(session?.user ?? null)
                }

                if(event !== 'INITIAL_SESSION') setLoading('loadingSession', false)
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    },[setUser, setSession , setLoading])
    return <>{children}</>
}