import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SalesLeadPipeline } from './SalesLeadPipeline';
import { ToastProvider } from '@/ui/ToastProvider';
import {
  useClients,
  useCreateSalesLead,
  useDeleteSalesLead,
  useSalesLeads,
  useUpdateSalesLead,
} from '../hooks/useCommercial';

jest.mock('../hooks/useCommercial', () => ({
  useClients: jest.fn(),
  useCreateSalesLead: jest.fn(),
  useDeleteSalesLead: jest.fn(),
  useSalesLeads: jest.fn(),
  useUpdateSalesLead: jest.fn(),
}));

// Bloque useCreateProject -> supabase -> import.meta.env (non supporté par Jest CJS)
jest.mock('@/hooks/useCreateProject', () => ({
  useCreateProject: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));

const mockedUseClients = useClients as jest.Mock;
const mockedUseCreateSalesLead = useCreateSalesLead as jest.Mock;
const mockedUseDeleteSalesLead = useDeleteSalesLead as jest.Mock;
const mockedUseSalesLeads = useSalesLeads as jest.Mock;
const mockedUseUpdateSalesLead = useUpdateSalesLead as jest.Mock;

describe('SalesLeadPipeline', () => {
  const createMutateAsync = jest.fn();
  const updateMutateAsync = jest.fn();
  const deleteMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseClients.mockReturnValue({
      data: [{ id: 'client-1', name: 'ACME' }],
    });
    mockedUseSalesLeads.mockReturnValue({
      data: [
        {
          id: 'lead-1',
          client_id: 'client-1',
          description: 'Lot facade',
          status: 'qualified',
          value_ht: 45000,
        },
      ],
      isLoading: false,
      error: null,
    });
    mockedUseCreateSalesLead.mockReturnValue({ isPending: false, mutateAsync: createMutateAsync });
    mockedUseUpdateSalesLead.mockReturnValue({ isPending: false, mutateAsync: updateMutateAsync });
    mockedUseDeleteSalesLead.mockReturnValue({ mutateAsync: deleteMutateAsync });
    createMutateAsync.mockResolvedValue({});
    updateMutateAsync.mockResolvedValue({});
    deleteMutateAsync.mockResolvedValue({});
  });

  it('edite une opportunite et affiche un toast de succes', async () => {
    render(
      <ToastProvider>
        <SalesLeadPipeline projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Modifier'));
    const editForm = screen.getByRole('button', { name: 'Enregistrer' }).closest('form');
    expect(editForm).not.toBeNull();

    fireEvent.change(within(editForm as HTMLElement).getByDisplayValue('Lot facade'), {
      target: { value: 'Lot facade nord' },
    });
    fireEvent.change(within(editForm as HTMLElement).getByDisplayValue('45000'), {
      target: { value: '47000' },
    });
    fireEvent.change(within(editForm as HTMLElement).getByDisplayValue('qualified'), {
      target: { value: 'proposal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(updateMutateAsync).toHaveBeenCalledWith({
      leadId: 'lead-1',
      projectId: 'project-1',
      status: 'proposal',
      description: 'Lot facade nord',
      valueHt: 47000,
    });
    expect(await screen.findByText('Opportunité modifiée')).toBeInTheDocument();
  });

  it('change le statut depuis la carte pipeline et affiche un toast', async () => {
    render(
      <ToastProvider>
        <SalesLeadPipeline projectId="project-1" />
      </ToastProvider>
    );

    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects[statusSelects.length - 1];

    fireEvent.change(statusSelect, { target: { value: 'won' } });

    expect(updateMutateAsync).toHaveBeenCalledWith({
      leadId: 'lead-1',
      projectId: 'project-1',
      status: 'won',
    });
    expect(await screen.findByText('Statut de l’opportunité mis à jour')).toBeInTheDocument();
  });
});