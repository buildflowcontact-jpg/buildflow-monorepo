// components/layout/ProtectedRoute.tsx
// Bloque l'accès à une route si l'utilisateur n'a pas la permission requise.
// Redirige vers /executer (page par défaut) sans révéler l'existence de la ressource.

import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission, type Permission } from '@/app/providers/PermissionProvider';

interface ProtectedRouteProps {
  permission: Permission;
  children: React.ReactNode;
  /** Route de redirection en cas d'accès refusé (défaut: /executer) */
  redirectTo?: string;
}

export function ProtectedRoute({ permission, children, redirectTo = '/executer' }: ProtectedRouteProps) {
  const { can, isLoadingRole } = usePermission();

  // Pendant le chargement du rôle, ne rien afficher (évite un flash de redirection)
  if (isLoadingRole) return null;

  if (!can(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
