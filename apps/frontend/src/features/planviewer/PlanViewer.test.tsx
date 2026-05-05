
jest.mock('../../utils/supabaseClient', () => ({
  supabase: { auth: { onAuthStateChange: jest.fn(), getUser: jest.fn() } }
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as PlanViewerModule from './PlanViewer';
import { PlanViewer } from './PlanViewer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Mock les composants qui importent pdfjs-dist ou ESM
jest.mock('./PDFAnnotator', () => ({ PDFAnnotator: () => <div>PDFAnnotatorMock</div> }));
jest.mock('./PDFViewer', () => ({ PDFViewer: () => <div>PDFViewerMock</div> }));
jest.mock('./IFCViewer', () => ({ IFCViewer: () => <div>IFCViewerMock</div> }));
jest.mock('./IFCAnnotator', () => ({ IFCAnnotator: () => <div>IFCAnnotatorMock</div> }));
jest.mock('react-quick-pinch-zoom', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

describe('PlanViewer', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('affiche le composant PlanViewer', () => {
    jest.spyOn(PlanViewerModule, 'useBPEPlan').mockReturnValue({ data: undefined, isLoading: true });
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PlanViewerModule.PlanViewer projectId="demo" documentId="doc1" />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Chargement du plan/i)).toBeInTheDocument();
  });

  it('affiche un message si aucun plan', async () => {
    jest.spyOn(PlanViewerModule, 'useBPEPlan').mockReturnValue({ data: null, isLoading: false });
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PlanViewerModule.PlanViewer projectId="demo" documentId="doc1" />
      </QueryClientProvider>
    );
    expect(await screen.findByText('Aucun plan BPE disponible.')).toBeInTheDocument();
  });
});
