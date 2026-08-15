import { describe, expect, it } from "vitest";
import {
  DRAFT_STORAGE_KEY,
  LEGACY_DRAFT_STORAGE_KEYS,
  createEmptyDraft,
  loadDraft,
  saveDraft,
  validateDefineDecision,
  validateEnterpriseContext,
  validateProjectContext,
} from "./decisionDraft";

describe("decision draft validation", () => {
  it("requires the core decision fields and distinct options", () => {
    expect(Object.keys(validateDefineDecision(createEmptyDraft().defineDecision))).toEqual([
      "title",
      "optionA",
      "optionB",
      "comparisonReason",
      "desiredOutcome",
    ]);

    const values = {
      title: "Choose a database",
      optionA: "PostgreSQL",
      optionB: " postgresql ",
      optionC: "",
      comparisonReason: "We need a common data platform.",
      desiredOutcome: "Make a defensible selection.",
    };
    expect(validateDefineDecision(values).optionB).toBe("Technology options must be different.");
  });

  it("validates team size and required project context", () => {
    const context = { ...createEmptyDraft().projectContext, teamSize: "3.5" };
    const errors = validateProjectContext(context);
    expect(errors.teamSize).toMatch(/whole number/);
    expect(errors.projectType).toBeTruthy();
  });

  it("rejects duplicate or invalid enterprise constraints", () => {
    const enterpriseContext = createEmptyDraft().enterpriseContext;
    enterpriseContext.constraints = [
      { id: "one", statement: "Remain within Azure", classification: "Must Have" },
      { id: "two", statement: "remain within azure", classification: "Mandatory" },
    ];
    expect(validateEnterpriseContext(enterpriseContext).constraints).toBeTruthy();
  });
});

describe("draft persistence", () => {
  it("round-trips a versioned draft", () => {
    const draft = createEmptyDraft();
    draft.defineDecision.title = "Choose a database";
    saveDraft(draft);
    expect(loadDraft().defineDecision.title).toBe("Choose a database");
    expect(loadDraft().updatedAt).toBeTruthy();
  });

  it("falls back safely when stored JSON is invalid", () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, "not-json");
    expect(loadDraft()).toEqual(createEmptyDraft());
  });

  it("migrates an existing version-one draft without losing data", () => {
    window.localStorage.setItem(LEGACY_DRAFT_STORAGE_KEYS[1], JSON.stringify({
      schemaVersion: 1,
      currentStep: 2,
      defineDecision: { title: "Existing decision" },
      projectContext: { projectType: "Platform migration" },
    }));
    const migrated = loadDraft();
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.defineDecision.title).toBe("Existing decision");
    expect(migrated.enterpriseContext.currentTechStack.databases).toEqual([]);
    expect(migrated.evaluationCriteria.items).toEqual([]);
  });
});
