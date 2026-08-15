import { describe, expect, it } from "vitest";
import {
  DRAFT_STORAGE_KEY,
  createEmptyDraft,
  loadDraft,
  saveDraft,
  validateDefineDecision,
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
});
