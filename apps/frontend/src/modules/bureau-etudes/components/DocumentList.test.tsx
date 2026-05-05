import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
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

import { render, screen, fireEvent, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentList } from "../components/DocumentList"

describe("DocumentList", () => {
  it("affiche la liste des documents et permet d’en ajouter", async () => {
    const onSelect = jest.fn()
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DocumentList projectId="demo" onSelect={onSelect} />
      </QueryClientProvider>
    );
    expect(await screen.findByText(/Documents/)).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByText(/Nouveau/))
    })
    const titreInput = await screen.findByLabelText(/Titre/)
    fireEvent.change(titreInput, { target: { value: "Doc test" } })
    fireEvent.click(screen.getByText(/Valider/))
    // Le nouveau document devrait apparaître (mocké)
    // ...
  });

  it("est accessible (axe)", async () => {
    const onSelect = jest.fn();
    const queryClient = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <DocumentList projectId="demo" onSelect={onSelect} />
      </QueryClientProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
