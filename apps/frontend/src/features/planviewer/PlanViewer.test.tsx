import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlanViewer } from './PlanViewer';

const mockOrder = jest.fn();

jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: mockOrder,
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/plan.pdf' } })),
      })),
    },
  },
}));

jest.mock('../../lib/events', () => ({
  emit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./PDFAnnotator', () => ({ PDFAnnotator: () => <div>PDFAnnotatorMock</div> }));
jest.mock('./PDFViewer', () => ({ PDFViewer: () => <div>PDFViewerMock</div> }));
jest.mock('./IFCViewer', () => ({ IFCViewer: () => <div>IFCViewerMock</div> }));
jest.mock('./IFCAnnotator', () => ({ IFCAnnotator: () => <div>IFCAnnotatorMock</div> }));
jest.mock('react-quick-pinch-zoom', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('PlanViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche un message si aucune version de plan', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <PlanViewer projectId="demo" documentId="doc1" />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Aucune version de plan disponible pour ce document.')).toBeInTheDocument();
  });

  it('affiche le viewer PDF quand une version PDF existe', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'version-1', file_url: 'plan.pdf', is_bpe: true, created_at: '2026-05-06T08:00:00Z' }],
      error: null,
    });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <PlanViewer projectId="demo" documentId="doc1" />
      </QueryClientProvider>
    );

    expect(await screen.findByText('PDFAnnotatorMock')).toBeInTheDocument();
  });
});
