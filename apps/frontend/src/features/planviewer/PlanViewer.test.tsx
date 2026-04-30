
jest.mock('../../utils/supabaseClient', () => ({
  supabase: { auth: { onAuthStateChange: jest.fn(), getUser: jest.fn() } }
}));
import React from 'react';
import { render, screen } from '@testing-library/react';
import PlanViewer from './PlanViewer';

describe('PlanViewer', () => {
  it('affiche le composant PlanViewer', () => {
    render(<PlanViewer />);
    expect(screen.getByText(/PlanViewer/i)).toBeInTheDocument();
  });

  it('affiche un message si aucun plan', () => {
    render(<PlanViewer plans={[]} />);
    expect(screen.getByText(/aucun plan/i)).toBeInTheDocument();
  });
});
