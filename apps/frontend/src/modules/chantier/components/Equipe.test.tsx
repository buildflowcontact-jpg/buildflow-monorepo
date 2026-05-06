import React from 'react';
import { render, screen } from "@testing-library/react"
import { Equipe } from "../components/Equipe"

jest.mock('@/modules/rh-securite/hooks/useRHSecurity', () => ({
  useWorkers: () => ({ data: [], isLoading: false }),
  useCreateWorker: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/ui/ToastProvider', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

describe("Equipe", () => {
  it("affiche le formulaire d'invitation et de création d'équipe", async () => {
    render(<Equipe projectId="project-1" projectName="Projet Démo" />)
    expect(screen.getByText(/Équipe/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prénom/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Nom/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Entreprise/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Domaine d'activité/)).toBeInTheDocument()
    expect(screen.getByText(/Ajouter \/ Inviter/)).toBeInTheDocument()
  })
})
