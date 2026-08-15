import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { DRAFT_STORAGE_KEY } from "./domain/decisionDraft";

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

  it("moves through all three steps, preserves selections, and saves the draft", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    expect(screen.getByText("Enterprise context saved")).toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY));
    expect(stored.defineDecision.optionA).toBe("PostgreSQL");
    expect(stored.projectContext.teamSize).toBe("12");
    expect(stored.projectContext.complianceRequirements).toEqual(["SOC 2"]);
    expect(stored.enterpriseContext.currentTechStack.databases).toEqual(["PostgreSQL"]);
    expect(stored.enterpriseContext.plannedTechnologies).toEqual(["Kubernetes"]);
    expect(stored.enterpriseContext.constraints[0]).toMatchObject({
      statement: "Must integrate with Microsoft Entra ID",
      classification: "Must Have",
    });

    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByRole("heading", { name: "Tell us about your project" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByLabelText("Decision title")).toHaveValue("Choose our application database");

    await waitFor(() => expect(screen.getByText("Draft saved")).toBeInTheDocument());
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

  it("restores a saved draft at its last step", () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      schemaVersion: 2,
      currentStep: 3,
      updatedAt: "2026-08-14T12:00:00.000Z",
      defineDecision: { title: "Choose a database", optionA: "PostgreSQL", optionB: "MongoDB" },
      projectContext: { projectType: "New application", complianceRequirements: [] },
      enterpriseContext: { plannedTechnologies: ["Kubernetes"] },
    }));

    render(<App />);
    expect(screen.getByRole("heading", { name: "What does your technology environment look like?" })).toBeInTheDocument();
    expect(screen.getByText("Kubernetes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByRole("heading", { name: "Tell us about your project" })).toBeInTheDocument();
  });

  it("validates, reclassifies, and removes enterprise constraints", () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ schemaVersion: 2, currentStep: 3 }));
    render(<App />);

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
});
