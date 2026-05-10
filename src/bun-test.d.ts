declare module "bun:test" {
  export const describe: (name: string, fn: () => void) => void;
  export const test: (name: string, fn: () => void | Promise<void>) => void;
  export const beforeEach: (fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void | Promise<void>) => void;
  export const expect: (actual: unknown) => {
    toBe: (expected: unknown) => void;
    toEqual: (expected: unknown) => void;
    toContain: (expected: unknown) => void;
    toHaveLength: (expected: number) => void;
    toBeNull: () => void;
    rejects: {
      toThrow: (expected: unknown) => Promise<void>;
    };
  };
}
