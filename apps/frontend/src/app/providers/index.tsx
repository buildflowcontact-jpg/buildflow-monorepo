// app/providers/index.tsx
// Centralise tous les providers de l'application.
// Ordre des providers :
//   QueryClient → Router → ProjectProvider → PermissionProvider → AppContextProvider → App
//
// PermissionProvider et AppContextProvider nécessitent userId (passé depuis App
// après authCheck). Pour l'initialisation avant auth, ils utilisent des valeurs
// par défaut sûres ("viewer" + can() = false).

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ProjectProvider } from './ProjectProvider';
import { queryClient } from './queryClient';

export { queryClient };

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
