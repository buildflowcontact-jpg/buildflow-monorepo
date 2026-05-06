declare module 'jest-axe' {
  export interface AxeResults {
    violations: unknown[];
  }

  export function axe(container: Element | DocumentFragment): Promise<AxeResults>;
  export function toHaveNoViolations(results: AxeResults): { pass: boolean; message(): string };
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

export {};
