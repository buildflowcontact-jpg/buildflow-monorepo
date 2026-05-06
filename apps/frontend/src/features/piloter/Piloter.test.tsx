import React from 'react';
import { render, screen } from '@testing-library/react';
import { Piloter } from './Piloter';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/services/supabaseClient', () => ({ supabase: {} }));

jest.mock('./PiloterDashboard', () => ({
  PiloterDashboard: ({ projectName }: { projectName?: string }) => (
    <div data-testid="piloter-dashboard">{projectName ?? 'dashboard'}</div>
  ),
}));

jest.mock('@/components/layout/ModuleLayout', () => ({
  ModuleLayout: ({ title, description, left, children, right }: { title?: string; description?: string; left: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div data-testid="left">{left}</div>
      <div data-testid="center">{children}</div>
      <div data-testid="right">{right}</div>
    </div>
  ),
}));

describe('Piloter', () => {
  it('affiche le titre et le nom du projet', () => {
    render(<Piloter projectName="Chantier Alpha" />);
    expect(screen.getByText('Piloter')).toBeInTheDocument();
    expect(screen.getAllByText('Chantier Alpha').length).toBeGreaterThan(0);
  });

  it('utilise "Projet actif" si aucun projectName n\'est fourni', () => {
    render(<Piloter />);
    expect(screen.getByText('Projet actif')).toBeInTheDocument();
  });

  it('rend le PiloterDashboard', () => {
    render(<Piloter projectName="Test" />);
    expect(screen.getByTestId('piloter-dashboard')).toBeInTheDocument();
  });

  it('affiche les 3 boutons d\'action rapide', () => {
    render(<Piloter />);
    expect(screen.getByText('Exporter rapport')).toBeInTheDocument();
    expect(screen.getByText('Revue alertes')).toBeInTheDocument();
    expect(screen.getByText("Plan d'action")).toBeInTheDocument();
  });
});
