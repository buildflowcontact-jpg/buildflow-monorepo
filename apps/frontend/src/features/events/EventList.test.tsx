// Mock du contexte ToastProvider pour éviter l’erreur de contexte
jest.mock('../../ui/ToastProvider', () => ({
  useToast: () => ({ showToast: jest.fn() })
}));
// Mock du client supabase pour Jest (évite l’erreur import.meta.env)
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    }) ),
  }
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventList } from './EventList';

describe('EventList', () => {
  it('affiche le composant EventList', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EventList projectId="demo-project" />
      </QueryClientProvider>
    );
    expect(screen.getByText(/événement/i)).toBeInTheDocument();
  });
});