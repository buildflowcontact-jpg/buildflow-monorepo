import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RoleManagement } from './RoleManagement';
import { ToastProvider } from '@/ui/ToastProvider';
import {
  useUserRoles,
  useCreateUserRole,
  useRolePermissions,
  useGrantPermission,
  useRevokePermission,
  useLogSecurityEvent,
} from '../hooks/useRHSecurity';

jest.mock('../hooks/useRHSecurity', () => ({
  useUserRoles: jest.fn(),
  useCreateUserRole: jest.fn(),
  useRolePermissions: jest.fn(),
  useGrantPermission: jest.fn(),
  useRevokePermission: jest.fn(),
  useLogSecurityEvent: jest.fn(),
}));

const mockedUseUserRoles = useUserRoles as jest.Mock;
const mockedUseCreateUserRole = useCreateUserRole as jest.Mock;
const mockedUseRolePermissions = useRolePermissions as jest.Mock;
const mockedUseGrantPermission = useGrantPermission as jest.Mock;
const mockedUseRevokePermission = useRevokePermission as jest.Mock;
const mockedUseLogSecurityEvent = useLogSecurityEvent as jest.Mock;

describe('RoleManagement', () => {
  const createRoleMutateAsync = jest.fn();
  const grantMutateAsync = jest.fn();
  const revokeMutateAsync = jest.fn();
  const logMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUserRoles.mockReturnValue({
      data: [{ id: 'role-1', name: 'Manager', description: 'Pilote le chantier' }],
      isLoading: false,
      error: null,
    });
    mockedUseRolePermissions.mockReturnValue({
      data: [{ id: 'perm-1', permission: 'view_documents' }],
    });
    mockedUseCreateUserRole.mockReturnValue({ isPending: false, mutateAsync: createRoleMutateAsync });
    mockedUseGrantPermission.mockReturnValue({ mutateAsync: grantMutateAsync });
    mockedUseRevokePermission.mockReturnValue({ mutateAsync: revokeMutateAsync });
    mockedUseLogSecurityEvent.mockReturnValue({ mutateAsync: logMutateAsync });
    createRoleMutateAsync.mockResolvedValue({ id: 'role-2' });
    grantMutateAsync.mockResolvedValue({});
    revokeMutateAsync.mockResolvedValue({});
    logMutateAsync.mockResolvedValue({});
  });

  it('cree un role et journalise l action', async () => {
    render(
      <ToastProvider>
        <RoleManagement projectId="project-1" />
      </ToastProvider>
    );

    const createForm = screen.getByRole('button', { name: 'Créer' }).closest('form');
    expect(createForm).not.toBeNull();

    fireEvent.change(within(createForm as HTMLElement).getAllByRole('textbox')[0], {
      target: { value: 'Coordinateur' },
    });
    fireEvent.change(within(createForm as HTMLElement).getAllByRole('textbox')[1], {
      target: { value: 'Coordonne les équipes' },
    });
    fireEvent.click(within(createForm as HTMLElement).getByRole('button', { name: 'Créer' }));

    await waitFor(() => {
      expect(createRoleMutateAsync).toHaveBeenCalledWith({
        projectId: 'project-1',
        name: 'Coordinateur',
        description: 'Coordonne les équipes',
      });
    });
    await waitFor(() => {
      expect(logMutateAsync).toHaveBeenCalledWith({
        projectId: 'project-1',
        action: 'create',
        resourceType: 'role',
        resourceId: 'role-2',
        details: { name: 'Coordinateur', description: 'Coordonne les équipes' },
      });
    });
    expect(await screen.findByText('Rôle créé')).toBeInTheDocument();
  });

  it('accorde puis revoque une permission en journalisant les actions', async () => {
    render(
      <ToastProvider>
        <RoleManagement projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Manager'));
    const permissionRows = screen.getAllByText(/view_documents|edit_documents/).map((node) => node.closest('div'));
    expect(permissionRows[0]).not.toBeNull();
    expect(permissionRows[1]).not.toBeNull();

    fireEvent.click(within(permissionRows[1] as HTMLElement).getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => {
      expect(grantMutateAsync).toHaveBeenCalledWith({ roleId: 'role-1', permission: 'edit_documents' });
    });
    await waitFor(() => {
      expect(logMutateAsync).toHaveBeenCalledWith({
        projectId: 'project-1',
        action: 'update',
        resourceType: 'role_permission',
        resourceId: 'role-1',
        details: { permission: 'edit_documents', role_id: 'role-1', operation: 'grant' },
      });
    });
    expect(await screen.findByText('Permission accordée')).toBeInTheDocument();

    fireEvent.click(within(permissionRows[0] as HTMLElement).getByRole('button', { name: 'Révoquer' }));

    await waitFor(() => {
      expect(revokeMutateAsync).toHaveBeenCalledWith({ permissionId: 'perm-1', roleId: 'role-1' });
    });
    await waitFor(() => {
      expect(logMutateAsync).toHaveBeenCalledWith({
        projectId: 'project-1',
        action: 'delete',
        resourceType: 'role_permission',
        resourceId: 'perm-1',
        details: { role_id: 'role-1', operation: 'revoke' },
      });
    });
    expect(await screen.findByText('Permission révoquée')).toBeInTheDocument();
  });
});