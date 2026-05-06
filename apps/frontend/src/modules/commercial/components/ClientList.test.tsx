import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ClientList } from './ClientList';
import { ToastProvider } from '@/ui/ToastProvider';
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '../hooks/useCommercial';

jest.mock('../hooks/useCommercial', () => ({
  useClients: jest.fn(),
  useCreateClient: jest.fn(),
  useUpdateClient: jest.fn(),
  useDeleteClient: jest.fn(),
}));

const mockedUseClients = useClients as jest.Mock;
const mockedUseCreateClient = useCreateClient as jest.Mock;
const mockedUseUpdateClient = useUpdateClient as jest.Mock;
const mockedUseDeleteClient = useDeleteClient as jest.Mock;

describe('ClientList', () => {
  const updateMutateAsync = jest.fn();
  const createMutateAsync = jest.fn();
  const deleteMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseClients.mockReturnValue({
      data: [
        {
          id: 'client-1',
          name: 'ACME',
          contact_email: 'contact@acme.test',
          contact_phone: '0102030405',
          company: 'ACME SAS',
          status: 'prospect',
        },
      ],
      isLoading: false,
      error: null,
    });
    mockedUseCreateClient.mockReturnValue({ isPending: false, mutateAsync: createMutateAsync });
    mockedUseUpdateClient.mockReturnValue({ isPending: false, mutateAsync: updateMutateAsync });
    mockedUseDeleteClient.mockReturnValue({ mutateAsync: deleteMutateAsync });
    updateMutateAsync.mockResolvedValue({});
    createMutateAsync.mockResolvedValue({});
    deleteMutateAsync.mockResolvedValue({});
    window.confirm = jest.fn(() => true);
  });

  it('met a jour un client et affiche un toast de succes', async () => {
    render(
      <ToastProvider>
        <ClientList projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Modifier'));
    const editForm = screen.getByRole('button', { name: 'Annuler' }).closest('form');
    expect(editForm).not.toBeNull();

    fireEvent.change(within(editForm as HTMLElement).getByDisplayValue('ACME'), {
      target: { value: 'ACME Groupe' },
    });
    fireEvent.click(within(editForm as HTMLElement).getByRole('button', { name: 'Modifier' }));

    expect(updateMutateAsync).toHaveBeenCalledWith({
      clientId: 'client-1',
      projectId: 'project-1',
      name: 'ACME Groupe',
      contactEmail: 'contact@acme.test',
      contactPhone: '0102030405',
      company: 'ACME SAS',
      status: 'prospect',
    });
    expect(await screen.findByText('Client modifié')).toBeInTheDocument();
  });

  it('supprime un client et affiche un toast de succes', async () => {
    render(
      <ToastProvider>
        <ClientList projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Supprimer'));

    expect(deleteMutateAsync).toHaveBeenCalledWith({ clientId: 'client-1', projectId: 'project-1' });
    expect(await screen.findByText('Client supprimé')).toBeInTheDocument();
  });
});