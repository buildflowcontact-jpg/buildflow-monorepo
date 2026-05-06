import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { InvoiceManager } from './InvoiceManager';
import { ToastProvider } from '@/ui/ToastProvider';
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus } from '../hooks/useFinance';
import { useSuppliers } from '@/modules/approvisionnement/hooks/useSuppliers';

jest.mock('../hooks/useFinance', () => ({
  useInvoices: jest.fn(),
  useCreateInvoice: jest.fn(),
  useUpdateInvoiceStatus: jest.fn(),
}));

jest.mock('@/modules/approvisionnement/hooks/useSuppliers', () => ({
  useSuppliers: jest.fn(),
}));

const mockedUseInvoices = useInvoices as jest.Mock;
const mockedUseCreateInvoice = useCreateInvoice as jest.Mock;
const mockedUseUpdateInvoiceStatus = useUpdateInvoiceStatus as jest.Mock;
const mockedUseSuppliers = useSuppliers as jest.Mock;

describe('InvoiceManager', () => {
  const createMutateAsync = jest.fn();
  const updateMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInvoices.mockReturnValue({
      data: [
        {
          id: 'invoice-1',
          reference: 'FAC-001',
          supplier_id: 'supplier-1',
          amount_ht: 1000,
          status: 'pending',
          invoice_date: '2026-04-01',
          due_date: '2026-04-15',
          notes: 'Relance fournisseur',
        },
      ],
      isLoading: false,
    });
    mockedUseSuppliers.mockReturnValue({
      data: [{ id: 'supplier-1', name: 'Beton Pro' }],
    });
    mockedUseCreateInvoice.mockReturnValue({ isPending: false, mutateAsync: createMutateAsync });
    mockedUseUpdateInvoiceStatus.mockReturnValue({ mutateAsync: updateMutateAsync });
    createMutateAsync.mockResolvedValue({});
    updateMutateAsync.mockResolvedValue({});
  });

  it('affiche une facture echue et permet de la marquer payee', async () => {
    render(
      <ToastProvider>
        <InvoiceManager projectId="project-1" />
      </ToastProvider>
    );

    expect(screen.getByText('Échue')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Marquer payée' }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({ id: 'invoice-1', status: 'paid' });
    });
    expect(await screen.findByText('Facture marquée payée')).toBeInTheDocument();
  });

  it('cree une facture et affiche un toast de succes', async () => {
    render(
      <ToastProvider>
        <InvoiceManager projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('+ Nouvelle facture'));
    const form = screen.getByRole('button', { name: 'Créer' }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.change(within(form as HTMLElement).getByPlaceholderText('FAC-2026-001'), {
      target: { value: 'FAC-2026-002' },
    });
    fireEvent.change(within(form as HTMLElement).getAllByRole('combobox')[0], {
      target: { value: 'supplier-1' },
    });
    const numberInputs = within(form as HTMLElement).getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], { target: { value: '1200' } });
    fireEvent.change(numberInputs[1], { target: { value: '1440' } });
    const dateInputs = within(form as HTMLElement).getAllByDisplayValue('');
    fireEvent.change(dateInputs[0], { target: { value: '2026-05-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-05-31' } });
    fireEvent.change(within(form as HTMLElement).getAllByRole('textbox')[1], {
      target: { value: 'Facture lot beton' },
    });
    fireEvent.click(within(form as HTMLElement).getByRole('button', { name: 'Créer' }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        reference: 'FAC-2026-002',
        supplier_id: 'supplier-1',
        amount_ht: 1200,
        amount_ttc: 1440,
        invoice_date: '2026-05-01',
        due_date: '2026-05-31',
        notes: 'Facture lot beton',
      });
    });
    expect(await screen.findByText('Facture créée')).toBeInTheDocument();
  });
});