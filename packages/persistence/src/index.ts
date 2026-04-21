import type {
  CaseConfiguration,
  CaseState,
  SourceRegistration,
  PromptRegistration,
} from "@workflow/contracts";

export const PERSISTENCE_PACKAGE = "@workflow/persistence" as const;

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export interface Case {
  caseId: string;
  domain: string;
  mainDepartment: string;
  subDepartment?: string;
  useCaseLabel: string;
  companyProfileRef: string;
  operatorNotes?: string;
  createdAt: string;
  state: CaseState;
}

export interface Source extends SourceRegistration {
  registeredAt: string;
}

export interface PromptRecord extends PromptRegistration {
  registeredAt: string;
}

// ---------------------------------------------------------------------------
// Repository interfaces — backend-agnostic
// ---------------------------------------------------------------------------

export interface CaseRepository {
  save(c: Case): void;
  findById(caseId: string): Case | null;
  findAll(): Case[];
}

export interface SourceRepository {
  save(s: Source): void;
  findById(sourceId: string): Source | null;
  findByCaseId(caseId: string): Source[];
  findAll(): Source[];
}

export interface PromptRepository {
  save(p: PromptRecord): void;
  findById(promptId: string): PromptRecord | null;
  findByRole(role: string): PromptRecord[];
  findAll(): PromptRecord[];
}

// ---------------------------------------------------------------------------
// In-memory implementations
// ---------------------------------------------------------------------------

class InMemoryCaseRepository implements CaseRepository {
  private readonly store = new Map<string, Case>();

  save(c: Case): void {
    this.store.set(c.caseId, { ...c });
  }

  findById(caseId: string): Case | null {
    return this.store.get(caseId) ?? null;
  }

  findAll(): Case[] {
    return Array.from(this.store.values());
  }
}

class InMemoryPromptRepository implements PromptRepository {
  private readonly store = new Map<string, PromptRecord>();

  save(p: PromptRecord): void {
    this.store.set(p.promptId, { ...p });
  }

  findById(promptId: string): PromptRecord | null {
    return this.store.get(promptId) ?? null;
  }

  findByRole(role: string): PromptRecord[] {
    return Array.from(this.store.values()).filter((p) => p.role === role);
  }

  findAll(): PromptRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemorySourceRepository implements SourceRepository {
  private readonly store = new Map<string, Source>();

  save(s: Source): void {
    this.store.set(s.sourceId, { ...s });
  }

  findById(sourceId: string): Source | null {
    return this.store.get(sourceId) ?? null;
  }

  findByCaseId(caseId: string): Source[] {
    return Array.from(this.store.values()).filter((s) => s.caseId === caseId);
  }

  findAll(): Source[] {
    return Array.from(this.store.values());
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface InMemoryStore {
  cases: CaseRepository;
  sources: SourceRepository;
  prompts: PromptRepository;
}

export function createInMemoryStore(): InMemoryStore {
  return {
    cases: new InMemoryCaseRepository(),
    sources: new InMemorySourceRepository(),
    prompts: new InMemoryPromptRepository(),
  };
}

// Re-export CaseConfiguration for use by core-case without double-importing contracts
export type { CaseConfiguration };
