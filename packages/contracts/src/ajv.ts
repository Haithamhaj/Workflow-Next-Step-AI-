import Ajv, { type Options } from "ajv";
import addFormats from "ajv-formats";

export function createAjv(options: Options = {}): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    useDefaults: true,
    ...options,
  });
  addFormats(ajv);
  return ajv;
}

export const ajv = createAjv();
