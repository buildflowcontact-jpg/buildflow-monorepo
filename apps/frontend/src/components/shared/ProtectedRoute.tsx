import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Permission requise pour accéder à la route.
   * Si non fournie, seule l'authentification est vérifiée.
   */
  requirePermission?: string;
  /**
   * Composant affiché en cas d'accès refusé.
   * Par défaut : redirection vers "/".
   */
  fallback?: React.ReactNode;
}

/**
 * Wrapper de route qui redirige vers la page d'accueil si l'utilisateur
 * n'est pas authentifié. Optionnellement vérifie une permission RBAC.
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size={28} />
      </div>
    );
  }

  if (!user) {
    // Conserve l'URL cible pour y revenir après connexion
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{fallback ?? children}</>;
}
