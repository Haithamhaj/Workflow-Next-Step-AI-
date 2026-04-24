declare const process: {
  cwd(): string;
  pid: number;
  env: Record<string, string | undefined>;
};

declare module "node:fs" {
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
}

declare module "node:os" {
  export function tmpdir(): string;
}

declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...args: unknown[]): void;
      get(...args: unknown[]): unknown;
      all(...args: unknown[]): unknown[];
    };
  }
}
