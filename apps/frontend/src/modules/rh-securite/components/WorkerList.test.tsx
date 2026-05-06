import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { WorkerList } from './WorkerList';
import { ToastProvider } from '@/ui/ToastProvider';
import {
  useWorkers,
  useCreateWorker,
  useUpdateWorker,
  useDeleteWorker,
  useLogSecurityEvent,
} from '../hooks/useRHSecurity';

jest.mock('../hooks/useRHSecurity', () => ({
  useWorkers: jest.fn(),
  useCreateWorker: jest.fn(),
  useUpdateWorker: jest.fn(),
  useDeleteWorker: jest.fn(),
  useLogSecurityEvent: jest.fn(),
}));

const mockedUseWorkers = useWorkers as jest.Mock;
const mockedUseCreateWorker = useCreateWorker as jest.Mock;
const mockedUseUpdateWorker = useUpdateWorker as jest.Mock;
const mockedUseDeleteWorker = useDeleteWorker as jest.Mock;
const mockedUseLogSecurityEvent = useLogSecurityEvent as jest.Mock;

describe('WorkerList', () => {
  const createMutateAsync = jest.fn();
  const updateMutateAsync = jest.fn();
  const deleteMutateAsync = jest.fn();
  const logMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseWorkers.mockReturnValue({
      data: [
        {
          id: 'worker-1',
          full_name: 'Alice Martin',
          role: 'Chef de projet',
          company: 'BuildFlow',
        },
      ],
      isLoading: false,
      error: null,
    });
    mockedUseCreateWorker.mockReturnValue({ isPending: false, mutateAsync: createMutateAsync });
    mockedUseUpdateWorker.mockReturnValue({ isPending: false, mutateAsync: updateMutateAsync });
    mockedUseDeleteWorker.mockReturnValue({ mutateAsync: deleteMutateAsync });
    mockedUseLogSecurityEvent.mockReturnValue({ mutateAsync: logMutateAsync });
    createMutateAsync.mockResolvedValue({ id: 'worker-2' });
    updateMutateAsync.mockResolvedValue({});
    deleteMutateAsync.mockResolvedValue({});
    logMutateAsync.mockResolvedValue({});
    window.confirm = jest.fn(() => true);
  });

  it('met a jour un collaborateur avec son nom complet et journalise l action', async () => {
    render(
      <ToastProvider>
        <WorkerList projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Modifier'));
    const editForm = screen.getByRole('button', { name: 'Annuler' }).closest('form');
    expect(editForm).not.toBeNull();

    fireEvent.change(within(editForm as HTMLElement).getByDisplayValue('Alice Martin'), {
      target: { value: 'Alice Dupont' },
    });
    fireEvent.click(within(editForm as HTMLElement).getByRole('button', { name: 'Modifier' }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        workerId: 'worker-1',
        projectId: 'project-1',
        fullName: 'Alice Dupont',
        role: 'Chef de projet',
        company: 'BuildFlow',
      });
    });
    await waitFor(() => {
      expect(logMutateAsync).toHaveBeenCalledWith({
        projectId: 'project-1',
        action: 'update',
        resourceType: 'worker',
        resourceId: 'worker-1',
        details: {
          full_name: 'Alice Dupont',
          role: 'Chef de projet',
          company: 'BuildFlow',
        },
      });
    });
    expect(await screen.findByText('Collaborateur modifié')).toBeInTheDocument();
  });

  it('supprime un collaborateur et journalise la suppression', async () => {
    render(
      <ToastProvider>
        <WorkerList projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Supprimer'));

    await waitFor(() => {
      expect(deleteMutateAsync).toHaveBeenCalledWith({ workerId: 'worker-1', projectId: 'project-1' });
    });
    await waitFor(() => {
      expect(logMutateAsync).toHaveBeenCalledWith({
        projectId: 'project-1',
        action: 'delete',
        resourceType: 'worker',
        resourceId: 'worker-1',
      });
    });
    expect(await screen.findByText('Collaborateur supprimé')).toBeInTheDocument();
  });
});