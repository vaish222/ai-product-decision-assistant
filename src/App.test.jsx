import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { DRAFT_STORAGE_KEY } from "./domain/decisionDraft";

const GENERATED_CRITERIA = [
  { id: "criterion-1", name: "Security & Compliance", description: "Assess required security controls and compliance obligations.", importance: "critical", rationale: "SOC 2 is part of the project context.", weight: 24 },
  { id: "criterion-2", name: "Enterprise Architecture Fit", description: "Assess compatibility with current platforms and standards.", importance: "high", rationale: "The current stack should be reused where practical.", weight: 19 },
  { id: "criterion-3", name: "Integration Complexity", description: "Assess effort to integrate identity, data, and delivery systems.", importance: "high", rationale: "Enterprise integrations affect delivery risk.", weight: 19 },
  { id: "criterion-4", name: "Time to Market", description: "Assess the effect on the stated delivery timeline.", importance: "medium", rationale: "The project has a defined delivery window.", weight: 13 },
  { id: "criterion-5", name: "Operational Fit", description: "Assess monitoring, support, and operational skill requirements.", importance: "medium", rationale: "Operational adoption affects long-term viability.", weight: 13 },
  { id: "criterion-6", name: "Cost", description: "Assess implementation and ongoing platform cost sensitivity.", importance: "medium", rationale: "Budget sensitivity must be represented.", weight: 12 },
];

const GENERATED_RECOMMENDATION = {
  status: "recommended",
  recommendedOption: "PostgreSQL",
  summary: "PostgreSQL is the strongest fit for the supplied enterprise context.",
  scores: [
    { option: "PostgreSQL", weightedScore: 86.2, rank: 1, criterionScores: GENERATED_CRITERIA.map((criterion) => ({ criterionId: criterion.id, criterionName: criterion.name, weight: criterion.weight, rating: 4, weightedContribution: criterion.weight * .8, reason: "Strong fit based on the supplied context." })) },
    { option: "MongoDB", weightedScore: 72.4, rank: 2, criterionScores: GENERATED_CRITERIA.map((criterion) => ({ criterionId: criterion.id, criterionName: criterion.name, weight: criterion.weight, rating: 3, weightedContribution: criterion.weight * .6, reason: "Some uncertainty remains in the supplied context." })) },
  ],
  confidence: "medium",
  confidenceRationale: "Some operational and cost information is missing.",
  topReasons: ["Strong alignment with the supplied enterprise architecture.", "Good fit with the stated compliance needs."],
  keyTradeoffs: ["PostgreSQL favors architecture fit while MongoDB may offer flexibility.", "Operational familiarity may differ between the options."],
  risks: [{ statement: "Team operating experience has not been confirmed.", severity: "medium" }],
  missingInformation: ["Measured workload characteristics"],
  changeFactors: ["A validated workload benchmark favoring MongoDB could change the result."],
  facts: ["Options supplied: PostgreSQL, MongoDB.", "Compliance requirements supplied: SOC 2."],
  inferences: ["PostgreSQL appears to have lower integration uncertainty.", "MongoDB may require additional operational validation."],
  generatedAt: "2026-08-15T13:00:00.000Z",
  model: "test-model",
  provider: "ollama",
  scoringMethod: "deterministic_weighted_rating_v1",
};

beforeEach(() => {
  globalThis.fetch = vi.fn().mockImplementation((url) => Promise.resolve({
    ok: true,
    json: async () => url === "/api/recommendation/generate" ? GENERATED_RECOMMENDATION : ({
      criteria: GENERATED_CRITERIA,
      generatedAt: "2026-08-15T12:00:00.000Z",
      model: "test-model",
      weightingMethod: "deterministic_importance_normalization_v1",
    }),
  }));
});

function completeDefineDecision() {
  fireEvent.change(screen.getByLabelText("Decision title"), { target: { value: "Choose our application database" } });
  fireEvent.change(screen.getByLabelText("Option A"), { target: { value: "PostgreSQL" } });
  fireEvent.change(screen.getByLabelText("Option B"), { target: { value: "MongoDB" } });
  fireEvent.change(screen.getByLabelText("Why are you comparing these options?"), { target: { value: "We need a durable platform standard." } });
  fireEvent.change(screen.getByLabelText("What are you trying to achieve?"), { target: { value: "Choose the best fit for our delivery team." } });
}

function completeProjectContext() {
  fireEvent.click(screen.getByLabelText("New application"));
  fireEvent.click(within(screen.getByRole("group", { name: "Expected scale" })).getByLabelText("Medium"));
  fireEvent.click(screen.getByLabelText("3–6 months"));
  fireEvent.change(screen.getByLabelText("Team size"), { target: { value: "12" } });
  fireEvent.click(screen.getByLabelText("High"));
  fireEvent.click(screen.getByText("SOC 2"));
}

describe("decision setup flow", () => {
  it("shows accessible validation and stays on the first step", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("Decision title is required.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What are you trying to decide?" })).toBeInTheDocument();
  });

  it("moves through all five steps, preserves context, and saves the recommendation", async () => {
    render(<App />);
    completeDefineDecision();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("heading", { name: "Tell us about your project" })).toBeInTheDocument();
    completeProjectContext();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("heading", { name: "What does your technology environment look like?" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Azure", { selector: ".chip__label" }));
    fireEvent.change(screen.getByLabelText("Databases"), { target: { value: "PostgreSQL" } });
    fireEvent.keyDown(screen.getByLabelText("Databases"), { key: "Enter" });
    fireEvent.change(screen.getByLabelText("Project-specific planned technologies"), { target: { value: "Kubernetes" } });
    fireEvent.keyDown(screen.getByLabelText("Project-specific planned technologies"), { key: "Enter" });
    fireEvent.change(screen.getByLabelText("Constraint"), { target: { value: "Must integrate with Microsoft Entra ID" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: /generate evaluation criteria/i }));

    expect(screen.getByRole("heading", { name: "Here’s what matters for this decision" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Security & Compliance" })).toBeInTheDocument());
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY));
      expect(saved.evaluationCriteria.items).toHaveLength(6);
    });
    const stored = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY));
    expect(stored.defineDecision.optionA).toBe("PostgreSQL");
    expect(stored.projectContext.teamSize).toBe("12");
    expect(stored.projectContext.projectType).toEqual(["New application"]);
    expect(stored.projectContext.complianceRequirements).toEqual(["SOC 2"]);
    expect(stored.enterpriseContext.currentTechStack.databases).toEqual(["PostgreSQL"]);
    expect(stored.enterpriseContext.plannedTechnologies).toEqual(["Kubernetes"]);
    expect(stored.enterpriseContext.constraints[0]).toMatchObject({
      statement: "Must integrate with Microsoft Entra ID",
      classification: "Must Have",
    });
    expect(stored.evaluationCriteria.items).toHaveLength(6);
    expect(stored.evaluationCriteria.items.reduce((total, criterion) => total + criterion.weight, 0)).toBe(100);
    expect(fetch).toHaveBeenCalledWith("/api/criteria/generate", expect.objectContaining({ method: "POST" }));

    fireEvent.click(screen.getByRole("button", { name: /analyze options/i }));
    expect(screen.getByRole("heading", { name: "Recommendation" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("heading", { name: "PostgreSQL" })).toHaveLength(2));
    expect(screen.getByText("86.2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Facts from your inputs" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI inferences" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/recommendation/generate", expect.objectContaining({ method: "POST" }));
    await waitFor(() => {
      const savedRecommendation = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY));
      expect(savedRecommendation.recommendation.recommendedOption).toBe("PostgreSQL");
    });

    fireEvent.click(screen.getByRole("button", { name: /start new decision/i }));
    expect(screen.getByRole("heading", { name: "What are you trying to decide?" })).toBeInTheDocument();
    expect(screen.getByLabelText("Decision title")).toHaveValue("");
    expect(screen.getByLabelText("Option A")).toHaveValue("");
  });

  it("allows selecting multiple project types", () => {
    render(<App />);
    completeDefineDecision();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByLabelText("New application"));
    fireEvent.click(screen.getByLabelText("AI/ML application"));
    expect(screen.getByLabelText("New application")).toBeChecked();
    expect(screen.getByLabelText("AI/ML application")).toBeChecked();
  });

  it("treats None / Unknown as mutually exclusive", () => {
    render(<App />);
    completeDefineDecision();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByText("HIPAA"));
    fireEvent.click(screen.getByText("None / Unknown", { selector: ".chip__label" }));
    expect(document.getElementById("compliance-hipaa")).not.toBeChecked();
    expect(document.getElementById("compliance-none-unknown")).toBeChecked();
  });

  it("starts blank and clears a previous browser draft on reload", () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      schemaVersion: 3,
      currentStep: 4,
      updatedAt: "2026-08-14T12:00:00.000Z",
      defineDecision: { title: "Choose a database", optionA: "PostgreSQL", optionB: "MongoDB" },
      projectContext: { projectType: "New application", complianceRequirements: [] },
      enterpriseContext: { plannedTechnologies: ["Kubernetes"] },
      evaluationCriteria: { items: GENERATED_CRITERIA, generatedAt: "2026-08-15T12:00:00.000Z", model: "test-model" },
    }));

    render(<App />);
    expect(screen.getByRole("heading", { name: "What are you trying to decide?" })).toBeInTheDocument();
    expect(screen.getByLabelText("Decision title")).toHaveValue("");
    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("validates, reclassifies, and removes enterprise constraints", () => {
    render(<App />);
    completeDefineDecision();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    completeProjectContext();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Describe the enterprise constraint before adding it.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Constraint"), { target: { value: "Prefer managed services" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const classification = screen.getByLabelText("Classification for Prefer managed services");
    fireEvent.change(classification, { target: { value: "Nice to Have" } });
    expect(classification).toHaveValue("Nice to Have");
    fireEvent.click(screen.getByRole("button", { name: "Remove constraint: Prefer managed services" }));
    expect(screen.getByText("No enterprise constraints added yet.")).toBeInTheDocument();
  });

  it("shows a recoverable server configuration error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "OPENAI_API_KEY is not configured on the server." }),
    });
    render(<App />);
    completeDefineDecision();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    completeProjectContext();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /generate evaluation criteria/i }));
    await waitFor(() => expect(screen.getByText("OPENAI_API_KEY is not configured on the server.")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
