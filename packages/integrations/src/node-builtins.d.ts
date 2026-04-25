declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: string): string;
}

declare module "node:path" {
  export function basename(path: string): string;
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
}
