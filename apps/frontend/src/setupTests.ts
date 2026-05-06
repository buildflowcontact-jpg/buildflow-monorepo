
import '@testing-library/jest-dom';

// Mock import.meta.env pour Jest (compatible CommonJS)
if (!(globalThis as any).import) {
	(globalThis as any).import = { meta: { env: {} } };
}

// Mock import.meta.env pour Jest
Object.defineProperty(globalThis as any, 'import', {
	value: { meta: { env: {} } },
	writable: true,
});