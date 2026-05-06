// Mock du contexte ToastProvider pour éviter l’erreur de contexte
jest.mock('../../ui/ToastProvider', () => ({
  useToast: () => ({ showToast: jest.fn() })
}));

jest.mock('./useProjectEvents', () => ({
  useProjectEvents: jest.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useCreateEvent: jest.fn(() => ({
    mutate: jest.fn(),
  })),
  useUpdateEvent: jest.fn(() => ({
    mutate: jest.fn(),
  })),
  useDeleteEvent: jest.fn(() => ({
    mutate: jest.fn(),
  })),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EventList } from './EventList';

describe('EventList', () => {
  it('affiche le composant EventList', () => {
    render(<EventList projectId="demo-project" />);
    expect(screen.getByRole('button', { name: /nouvel événement/i })).toBeInTheDocument();
    expect(screen.getByText(/aucun événement pour ce projet/i)).toBeInTheDocument();
  });
});