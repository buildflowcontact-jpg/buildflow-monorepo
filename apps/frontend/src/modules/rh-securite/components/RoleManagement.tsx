import React, { useState } from 'react';
import { useUserRoles, useCreateUserRole, useRolePermissions, useGrantPermission, useRevokePermission, useLogSecurityEvent } from '../hooks/useRHSecurity';
import { useToast } from '@/ui/ToastProvider';

interface RoleManagementProps {
  projectId: string;
}

const AVAILABLE_PERMISSIONS = [
  'view_documents',
  'edit_documents',
  'delete_documents',
  'validate_bpe',
  'manage_workers',
  'manage_budgets',
  'approve_expenses',
  'manage_suppliers',
  'view_reports',
  'export_reports',
  'manage_security',
];

export const RoleManagement: React.FC<RoleManagementProps> = ({ projectId }) => {
  const { data: roles, isLoading, error } = useUserRoles(projectId);
  const createRole = useCreateUserRole();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [formData, setFormData] = useState({ name: '', description: '' });

  const selectedRole = roles?.find((r) => r.id === selectedRoleId);
  const { data: permissions } = useRolePermissions(selectedRoleId);
  const grantPermission = useGrantPermission();
  const revokePermission = useRevokePermission();
  const logSecurityEvent = useLogSecurityEvent();
  const { showToast } = useToast() || {};

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      const role = await createRole.mutateAsync({
        projectId,
        name: formData.name,
        description: formData.description || undefined,
      });
      await logSecurityEvent.mutateAsync({
        projectId,
        action: 'create',
        resourceType: 'role',
        resourceId: role.id,
        details: { name: formData.name, description: formData.description || null },
      });
      setFormData({ name: '', description: '' });
      showToast?.('Rôle créé', 'success');
    } catch {
      showToast?.('Impossible de créer le rôle', 'error');
    }
  };

  const handleGrantPermission = async (permission: string) => {
    if (!selectedRoleId) return;
    try {
      await grantPermission.mutateAsync({ roleId: selectedRoleId, permission });
      await logSecurityEvent.mutateAsync({
        projectId,
        action: 'update',
        resourceType: 'role_permission',
        resourceId: selectedRoleId,
        details: { permission, role_id: selectedRoleId, operation: 'grant' },
      });
      showToast?.('Permission accordée', 'success');
    } catch {
      showToast?.('Impossible d’accorder la permission', 'error');
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!selectedRoleId) return;
    try {
      await revokePermission.mutateAsync({ permissionId, roleId: selectedRoleId });
      await logSecurityEvent.mutateAsync({
        projectId,
        action: 'delete',
        resourceType: 'role_permission',
        resourceId: permissionId,
        details: { role_id: selectedRoleId, operation: 'revoke' },
      });
      showToast?.('Permission révoquée', 'success');
    } catch {
      showToast?.('Impossible de révoquer la permission', 'error');
    }
  };

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur lors du chargement</div>;

  const grantedPermissions = new Set(permissions?.map((p) => p.permission) || []);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Create Role */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un rôle</h3>
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du rôle</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={createRole.isPending}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Créer
          </button>
        </form>

        <div className="mt-6 border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Rôles existants</h4>
          <div className="space-y-2">
            {roles?.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`w-full p-3 text-left rounded-lg border ${
                  selectedRoleId === role.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">{role.name}</p>
                {role.description && <p className="text-sm text-gray-600">{role.description}</p>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
        {!selectedRoleId ? (
          <p className="text-gray-500">Sélectionnez un rôle pour gérer les permissions</p>
        ) : (
          <div className="space-y-3">
            {AVAILABLE_PERMISSIONS.map((perm) => {
              const isGranted = grantedPermissions.has(perm);
              const permissionRecord = permissions?.find((p) => p.permission === perm);
              return (
                <div key={perm} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-700 flex-1">{perm}</label>
                  {isGranted ? (
                    <button
                      onClick={() => permissionRecord && handleRevokePermission(permissionRecord.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      Révoquer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGrantPermission(perm)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-600 rounded hover:bg-green-200"
                    >
                      Ajouter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
