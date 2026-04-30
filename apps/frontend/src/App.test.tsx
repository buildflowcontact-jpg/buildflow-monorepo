
import React from 'react';

// Par défaut, mock useAuth pour non connecté
jest.mock('./features/auth/useAuth', () => ({
  useAuth: jest.fn(() => ({ user: null, loading: false })),
  signOut: jest.fn(),
  signInWithMagicLink: jest.fn()
}));
// Mock des composants enfants critiques pour éviter les hooks dynamiques et appels réseau
jest.mock('./features/documents/DocumentList', () => ({ DocumentList: () => <div>DocumentListMock</div> }));
jest.mock('./features/planviewer/PlanViewer', () => ({ PlanViewer: () => <div>PlanViewerMock</div> }));
jest.mock('./features/events/EventList', () => ({ EventList: () => <div>EventListMock</div> }));
jest.mock('./features/documents/BEInbox', () => ({ BEInbox: () => <div>BEInboxMock</div> }));
jest.mock('./features/documents/DocumentVersionList', () => ({ DocumentVersionList: () => <div>DocumentVersionListMock</div> }));
jest.mock('./features/planifier/Planifier', () => ({ Planifier: () => <div>PlanifierMock</div> }));
jest.mock('./features/piloter/Piloter', () => ({ Piloter: () => <div>PiloterMock</div> }));
jest.mock('./features/equipe/Equipe', () => ({ Equipe: () => <div>EquipeMock</div> }));
jest.mock('./QuickActionPro', () => () => <div>QuickActionProMock</div>);
jest.mock('./ui/ToastProvider', () => ({
  ToastProvider: ({ children }: any) => <div>{children}</div>,
  useToast: () => ({ showToast: jest.fn() })
}));
// Mock react-pdf-highlighter pour éviter l'import ESM
jest.mock('react-pdf-highlighter', () => ({
  PdfLoader: () => null,
  PdfHighlighter: () => null,
  Tip: () => null,
  Highlight: () => null,
  Popup: () => null
}));


// Mock apolloClient pour éviter l'erreur import.meta.env
jest.mock('./apolloClient', () => ({
  __esModule: true,
  default: {} // mock ApolloClient
}));

// Mock supabaseClient pour simuler un utilisateur connecté et éviter les hooks dynamiques
jest.mock('./utils/supabaseClient', () => ({
  __esModule: true,
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      signUp: jest.fn(),
      // Simule une session utilisateur valide
      getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user', email: 'test@user.com' } } } })),
      onAuthStateChange: jest.fn((cb) => {
        cb('SIGNED_IN', { user: { id: 'test-user', email: 'test@user.com' } });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
      signOut: jest.fn()
    },
    // Mock channel pour éviter les hooks dynamiques
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn()
    }))
  }
}));


import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuth as useAuthMock } from './features/auth/useAuth';

describe('App', () => {
  it('affiche le titre de la page d\'accueil pour un utilisateur non connecté', () => {
    // Mock non connecté
    useAuthMock.mockReturnValue({ user: null, loading: false });
    render(<App />);
    expect(screen.getByText(/Bienvenue sur BuildFlow/i)).toBeInTheDocument();
  });

  it('affiche le cockpit pour un utilisateur connecté', () => {
    // Mock connecté
    useAuthMock.mockReturnValue({ user: { id: 'test-user', email: 'test@user.com' }, loading: false });
    render(<App />);
    expect(screen.getByText(/cockpit chantier/i)).toBeInTheDocument();
    expect(screen.getByText(/DocumentListMock/)).toBeInTheDocument();
  });
});