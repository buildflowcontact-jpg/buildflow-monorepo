import React from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
const mockCreateMutateAsync = jest.fn().mockResolvedValue({ id: 'doc-created' });
const mockUpdateMutateAsync = jest.fn().mockResolvedValue({ id: 'doc-updated' });
const mockDeleteMutateAsync = jest.fn().mockResolvedValue({});

jest.mock('../hooks/useProjectDocuments', () => ({
  useProjectDocuments: jest.fn(() => ({
    data: [{ id: 'd1', title: 'Doc existant', category: 'Plan' }],
    isLoading: false,
  })),
  useCreateDocument: jest.fn(() => ({
    mutateAsync: mockCreateMutateAsync,
    isLoading: false,
  })),
  useUpdateDocument: jest.fn(() => ({
    mutateAsync: mockUpdateMutateAsync,
    isLoading: false,
  })),
  useDeleteDocument: jest.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
    isLoading: false,
  })),
}));

// Mock du client supabase pour Jest (évite l’erreur import.meta.env)
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(function() {
        // Simule un retour de query vide
        return { eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), insert: jest.fn().mockReturnThis(), single: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis(), delete: jest.fn().mockReturnThis(), then: (cb: any) => cb({ data: [], error: null }) };
      }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    }) ),
  }
}));

import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import { DocumentList } from "../components/DocumentList"

describe("DocumentList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche la liste des documents et permet d’en ajouter", async () => {
    const onSelect = jest.fn()
    await act(async () => {
      render(<DocumentList projectId="demo" onSelect={onSelect} />);
    });
    expect(await screen.findByText(/Documents/)).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ajouter un nouveau document/i }))
    });
    const titreInput = await screen.findByLabelText(/Titre/)
    await act(async () => {
      fireEvent.change(titreInput, { target: { value: "Doc test" } })
      fireEvent.click(screen.getByText(/Valider/))
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(mockCreateMutateAsync).toHaveBeenCalledWith({ title: 'Doc test', category: '' });
    // Le nouveau document devrait apparaître (mocké)
    // ...
  });

  it("est accessible (axe)", async () => {
    const onSelect = jest.fn();
    let container: HTMLElement | null = null;
    await act(async () => {
      ({ container } = render(<DocumentList projectId="demo" onSelect={onSelect} />));
    });
    expect(container).not.toBeNull();
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });
});
