import type { ErrorObject, Schema, ValidateFunction } from "ajv";
import { ajv } from "./ajv.js";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ErrorObject[] };

export function makeValidator<T>(schema: Schema): (input: unknown) => ValidationResult<T> {
  const fn = ajv.compile<T>(schema) as ValidateFunction<T>;
  return (input: unknown): ValidationResult<T> => {
    if (fn(input)) return { ok: true, value: input as T };
    return { ok: false, errors: fn.errors ?? [] };
  };
}
