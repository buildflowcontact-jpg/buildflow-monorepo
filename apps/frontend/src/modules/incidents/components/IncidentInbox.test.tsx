import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidentInbox } from '../components/IncidentInbox';
import { useIncidentsPaginated } from '../hooks/useIncidentsPaginated';
import { useUpdateIncident } from '../hooks/useUpdateIncident';
import { useIncidentWorkflow } from '../hooks/useIncidentWorkflow';

// Bloque la chaîne d'imports qui atteint import.meta (supabase)
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/services/supabaseClient', () => ({ supabase: {} }));
jest.mock('../hooks/useIncidentsPaginated');
jest.mock('../hooks/useUpdateIncident');
jest.mock('../hooks/useIncidentWorkflow');
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, role: 'owner' }),
}));
jest.mock('@/lib/export', () => ({ downloadCsv: jest.fn() }));

const mockedUsePaginated = useIncidentsPaginated as jest.Mock;
const mockedUseUpdateIncident = useUpdateIncident as jest.Mock;
const mockedUseIncidentWorkflow = useIncidentWorkflow as jest.Mock;

describe('IncidentInbox', () => {
  const mutateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUpdateIncident.mockReturnValue({ mutate: mutateMock });
    mockedUseIncidentWorkflow.mockReturnValue({
      availableActions: (status: string) => status === 'submitted' ? ['review'] : [],
      transition: (_status: string, action: string) => action === 'review' ? 'under_review_site_manager' : undefined,
    });
  });

  it('affiche des skeletons pendant le chargement', () => {
    mockedUsePaginated.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = render(<IncidentInbox projectId="proj-1" />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('affiche le message "Aucun incident" si la liste est vide', () => {
    mockedUsePaginated.mockReturnValue({ data: { data: [], count: 0 }, isLoading: false, isError: false });
    render(<IncidentInbox projectId="proj-1" />);
    expect(screen.getByText(/aucun incident/i)).toBeInTheDocument();
  });

  it('affiche un incident et son bouton d\'action', () => {
    mockedUsePaginated.mockReturnValue({
      data: { data: [{
        id: 'inc-1',
        title: 'Fissure mur nord',
        status: 'submitted',
        severity: 'high',
        description: null,
        created_at: new Date().toISOString(),
      }], count: 1 },
      isLoading: false,
      isError: false,
    });
    render(<IncidentInbox projectId="proj-1" />);
    expect(screen.getByText('Fissure mur nord')).toBeInTheDocument();
    expect(screen.getByText('Mettre en révision')).toBeInTheDocument();
  });

  it('appelle updateIncident avec le bon statut lors d\'un clic sur action', () => {
    mockedUsePaginated.mockReturnValue({
      data: { data: [{
        id: 'inc-1',
        title: 'Fissure mur nord',
        status: 'submitted',
        severity: 'medium',
        description: null,
        created_at: new Date().toISOString(),
      }], count: 1 },
      isLoading: false,
      isError: false,
    });
    render(<IncidentInbox projectId="proj-1" />);
    fireEvent.click(screen.getByText('Mettre en révision'));
    expect(mutateMock).toHaveBeenCalledWith({ id: 'inc-1', status: 'under_review_site_manager' });
  });

  it('affiche l\'erreur de chargement si isError est vrai', () => {
    mockedUsePaginated.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<IncidentInbox projectId="proj-1" />);
    expect(screen.getByText(/erreur/i)).toBeInTheDocument();
  });
});
