import { useState, useEffect, useContext, createContext } from "react"

export function useAuth() {
  // Mock simple pour tests : non connecté
  return { user: null, loading: false }
}

export function signOut() {}
export function signInWithMagicLink() {}

export const AuthContext = createContext({ user: null, loading: false })
export function useAuthContext() {
  return useContext(AuthContext)
}
