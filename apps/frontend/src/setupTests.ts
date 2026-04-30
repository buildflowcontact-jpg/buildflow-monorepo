
import '@testing-library/jest-dom';

// Mock import.meta.env pour Jest (compatible CommonJS)
if (!globalThis.import) {
	// @ts-ignore
	globalThis.import = { meta: { env: { VITE_GRAPHQL_URL: 'http://localhost:4000/graphql' } } };
}

// Mock import.meta.env pour Jest
Object.defineProperty(global, 'import', {
	value: { meta: { env: { VITE_GRAPHQL_URL: 'http://localhost:4000/graphql' } } },
	writable: true,
});