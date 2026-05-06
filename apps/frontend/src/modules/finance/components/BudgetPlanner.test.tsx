import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BudgetPlanner } from './BudgetPlanner';
import { ToastProvider } from '@/ui/ToastProvider';
import { useBudgets, useCreateBudget, useUpdateBudget } from '../hooks/useFinance';

jest.mock('../hooks/useFinance', () => ({
  useBudgets: jest.fn(),
  useCreateBudget: jest.fn(),
  useUpdateBudget: jest.fn(),
}));

const mockedUseBudgets = useBudgets as jest.Mock;
const mockedUseCreateBudget = useCreateBudget as jest.Mock;
const mockedUseUpdateBudget = useUpdateBudget as jest.Mock;

describe('BudgetPlanner', () => {
  const createMutateAsync = jest.fn();
  const updateMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseBudgets.mockReturnValue({
      data: [
        {
          id: 'budget-1',
          category: 'Matériaux',
          amount_ht: 1000,
          spent_amount: 250,
        },
      ],
      isLoading: false,
    });
    mockedUseCreateBudget.mockReturnValue({ isPending: false, mutateAsync: createMutateAsync });
    mockedUseUpdateBudget.mockReturnValue({ isPending: false, mutateAsync: updateMutateAsync });
    createMutateAsync.mockResolvedValue({});
    updateMutateAsync.mockResolvedValue({});
  });

  it('ajoute une ligne budget et affiche un toast de succes', async () => {
    render(
      <ToastProvider>
        <BudgetPlanner projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('+ Ajouter ligne'));
    const form = screen.getByRole('button', { name: 'Ajouter' }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.change(within(form as HTMLElement).getByRole('combobox'), {
      target: { value: 'Matériaux' },
    });
    fireEvent.change(within(form as HTMLElement).getByRole('spinbutton'), {
      target: { value: '3200' },
    });
    fireEvent.click(within(form as HTMLElement).getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        category: 'Matériaux',
        amount_ht: 3200,
      });
    });
    expect(await screen.findByText('Ligne budget ajoutée')).toBeInTheDocument();
  });

  it('met a jour un budget et affiche un toast de succes', async () => {
    render(
      <ToastProvider>
        <BudgetPlanner projectId="project-1" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Éditer' }));
    fireEvent.change(screen.getByDisplayValue('1000'), { target: { value: '1250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: 'budget-1',
        amount_ht: 1250,
      });
    });
    expect(await screen.findByText('Budget mis à jour')).toBeInTheDocument();
  });
});