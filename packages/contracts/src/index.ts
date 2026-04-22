export { ajv, createAjv } from "./ajv.js";
export { makeValidator, type ValidationResult } from "./validate.js";
export * from "./types/index.js";
export {
  caseConfigurationSchema,
  sourceRegistrationSchema,
  promptRegistrationSchema,
  sessionCreationSchema,
} from "./schemas/index.js";

import { makeValidator } from "./validate.js";
import {
  caseConfigurationSchema,
  sourceRegistrationSchema,
  promptRegistrationSchema,
  sessionCreationSchema,
} from "./schemas/index.js";
import type { CaseConfiguration } from "./types/case-configuration.js";
import type { SourceRegistration } from "./types/source-registration.js";
import type { PromptRegistration } from "./types/prompt-registration.js";
import type { SessionCreation } from "./types/session-creation.js";
import {
  SessionState,
  PackageState,
  ReviewState,
  ReleaseState,
} from "./types/states.js";

export const validateCaseConfiguration =
  makeValidator<CaseConfiguration>(caseConfigurationSchema);

export const validateSourceRegistration =
  makeValidator<SourceRegistration>(sourceRegistrationSchema);

export const validatePromptRegistration =
  makeValidator<PromptRegistration>(promptRegistrationSchema);

export const validateSessionCreation =
  makeValidator<SessionCreation>(sessionCreationSchema);

export const validateSessionState = makeValidator<SessionState>({
  type: "string",
  enum: Object.values(SessionState),
});

export const validatePackageState = makeValidator<PackageState>({
  type: "string",
  enum: Object.values(PackageState),
});

export const validateReviewState = makeValidator<ReviewState>({
  type: "string",
  enum: Object.values(ReviewState),
});

export const validateReleaseState = makeValidator<ReleaseState>({
  type: "string",
  enum: Object.values(ReleaseState),
});
