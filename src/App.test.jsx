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

describe("decision setup flow", () => {
  it("shows accessible validation and stays on the first step", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("Decision title is required.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What are you trying to decide?" })).toBeInTheDocument();
  });

  it("moves through both steps, preserves selections, and saves the draft", async () => {
    render(<App />);
    completeDefineDecision();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("heading", { name: "Tell us about your project" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("New application"));
    fireEvent.click(within(screen.getByRole("group", { name: "Expected scale" })).getByLabelText("Medium"));
    fireEvent.click(screen.getByLabelText("3–6 months"));
    fireEvent.change(screen.getByLabelText("Team size"), { target: { value: "12" } });
    fireEvent.click(screen.getByLabelText("High"));
    fireEvent.click(screen.getByText("SOC 2"));
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    expect(screen.getByText("Draft ready")).toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY));
    expect(stored.defineDecision.optionA).toBe("PostgreSQL");
    expect(stored.projectContext.teamSize).toBe("12");
    expect(stored.projectContext.complianceRequirements).toEqual(["SOC 2"]);

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
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
      schemaVersion: 1,
      currentStep: 2,
      updatedAt: "2026-08-14T12:00:00.000Z",
      defineDecision: { title: "Choose a database", optionA: "PostgreSQL", optionB: "MongoDB" },
      projectContext: { projectType: "New application", complianceRequirements: [] },
    }));

    render(<App />);
    expect(screen.getByRole("heading", { name: "Tell us about your project" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByLabelText("Decision title")).toHaveValue("Choose a database");
  });
});
