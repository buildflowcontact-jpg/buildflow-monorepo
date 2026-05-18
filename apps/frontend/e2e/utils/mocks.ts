// e2e/utils/mocks.ts
import { Page } from '@playwright/test';

const STORAGE_KEY = 'sb-czfcmeizfaudrimrmpgc-auth-token';
const TEST_USER_ID = '626020ae-6102-450f-b83d-c6025cf90bdc';

export async function mockAuth(page: Page, email = 'test@user.com') {
  // Injecte une session Supabase simulée dans le localStorage AVANT le chargement de la page.
  // Le JWT est construit dans le contexte browser pour garantir un base64url valide.
  await page.addInitScript(({ key, userEmail }) => {
    function b64url(str) {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    function buildJWT(payload) {
      const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = b64url(JSON.stringify(payload));
      return `${header}.${body}.fakesig`;
    }
    const now = Math.floor(Date.now() / 1000);
    const accessToken = buildJWT({
      sub: '626020ae-6102-450f-b83d-c6025cf90bdc',
      email: userEmail,
      role: 'authenticated',
      aud: 'authenticated',
      exp: now + 3600,
      iat: now,
    });
    const session = {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: now + 3600,
      refresh_token: 'fake-refresh-token',
      user: {
        id: '626020ae-6102-450f-b83d-c6025cf90bdc',
        email: userEmail,
        role: 'authenticated',
        aud: 'authenticated',
        app_metadata: { provider: 'email' },
        user_metadata: {},
      },
    };
    window.localStorage.setItem(key, JSON.stringify(session));
    window.localStorage.setItem('onboardingDone', '1');
  }, { key: STORAGE_KEY, userEmail: email });

  // Mock les endpoints Supabase Auth pour éviter les erreurs réseau
  // Ces mocks doivent retourner une réponse valide sinon supabase-js peut crasher
  await page.route('**/auth/v1/user', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '626020ae-6102-450f-b83d-c6025cf90bdc',
        email,
        role: 'authenticated',
        aud: 'authenticated',
        app_metadata: { provider: 'email' },
        user_metadata: {},
      }),
    })
  );
  await page.route('**/auth/v1/token*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: '626020ae-6102-450f-b83d-c6025cf90bdc',
          email,
          role: 'authenticated',
          aud: 'authenticated',
        },
      }),
    })
  );
  // Bloque les WebSockets Supabase Realtime pour éviter les connexions réseau inutiles
  await page.route('**/realtime/v1/**', route => route.abort());
}

export async function mockProjects(page: Page, projects = [{ id: 'p1', name: 'Projet Test' }]) {
  await page.route('**/rest/v1/projects*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(projects),
    })
  );
}

export async function mockProjectMembers(page: Page, role = 'admin', projectId = 'p1') {
  await page.route('**/rest/v1/project_members*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          project_id: projectId,
          user_id: TEST_USER_ID,
          role,
        },
      ]),
    })
  );
}

export async function mockDocuments(page: Page, documents = []) {
  await page.route('**/rest/v1/documents*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(documents),
    })
  );
}

export async function mockAll(page: Page) {
  await mockAuth(page);
  await mockProjects(page);
  await mockProjectMembers(page);
  await mockDocuments(page);
}

// Version sans injection de session : l'app affiche le formulaire d'auth
export async function mockAllNoAuth(page: Page) {
  await mockProjects(page);
  await mockProjectMembers(page);
  await mockDocuments(page);
}

/**
 * Mock générique qui renvoie un tableau vide pour toutes les tables Supabase REST.
 * Utile pour tester l'état "vide" d'un module sans données.
 */
export async function mockSupabaseEmpty(page: Page) {
  await page.route('**/rest/v1/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  );
  await mockProjects(page, [{ id: 'p1', name: 'Projet Test', code: 'PRJ-001', status: 'active' }]);
  await mockProjectMembers(page);
}
