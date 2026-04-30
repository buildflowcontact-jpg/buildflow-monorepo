import React from 'react';
import { render, screen } from '@testing-library/react';
import EventList from './EventList';

describe('EventList', () => {
  it('affiche la liste des événements', () => {
    const events = [
      { id: 1, title: 'Réunion' },
      { id: 2, title: 'Livraison' }
    ];
    render(<EventList events={events} />);
    expect(screen.getByText(/Réunion/)).toBeInTheDocument();
    expect(screen.getByText(/Livraison/)).toBeInTheDocument();
  });

  it('affiche un message si aucun événement', () => {
    render(<EventList events={[]} />);
    expect(screen.getByText(/aucun événement/i)).toBeInTheDocument();
  });
});