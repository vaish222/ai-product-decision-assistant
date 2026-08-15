import { useState } from "react";
import { generateEvaluationCriteria } from "./api/criteria";
import { PageShell } from "./components/PageShell";
import { useDecisionDraft } from "./hooks/useDecisionDraft";
import { DefineDecisionStep } from "./steps/DefineDecisionStep";
import { ProjectContextStep } from "./steps/ProjectContextStep";
import { EnterpriseContextStep } from "./steps/EnterpriseContextStep";
import { EvaluationCriteriaStep } from "./steps/EvaluationCriteriaStep";

export function App() {
  const { draft, updateSection, goToStep, saveImmediately, saveState } = useDecisionDraft();
  const [criteriaState, setCriteriaState] = useState(() => ({
    status: draft.evaluationCriteria.items.length ? "success" : "idle",
    error: "",
  }));

  async function generateCriteria() {
    saveImmediately();
    goToStep(4);
    setCriteriaState({ status: "loading", error: "" });
    try {
      const result = await generateEvaluationCriteria({
        decision: draft.defineDecision,
        projectContext: draft.projectContext,
        enterpriseContext: draft.enterpriseContext,
      });
      updateSection("evaluationCriteria", "items", result.criteria);
      updateSection("evaluationCriteria", "generatedAt", result.generatedAt);
      updateSection("evaluationCriteria", "model", result.model);
      updateSection("evaluationCriteria", "weightingMethod", result.weightingMethod);
      setCriteriaState({ status: "success", error: "" });
    } catch (error) {
      setCriteriaState({ status: "error", error: error.message || "Unable to generate evaluation criteria." });
    }
  }

  return (
    <PageShell currentStep={draft.currentStep} saveState={saveState}>
      {draft.currentStep === 1 ? (
        <DefineDecisionStep
          values={draft.defineDecision}
          onChange={(field, value) => updateSection("defineDecision", field, value)}
          onContinue={() => goToStep(2)}
        />
      ) : draft.currentStep === 2 ? (
        <ProjectContextStep
          values={draft.projectContext}
          onChange={(field, value) => updateSection("projectContext", field, value)}
          onBack={() => goToStep(1)}
          onContinue={() => goToStep(3)}
        />
      ) : draft.currentStep === 3 ? (
        <EnterpriseContextStep
          values={draft.enterpriseContext}
          onChange={(field, value) => updateSection("enterpriseContext", field, value)}
          onBack={() => goToStep(2)}
          onGenerate={generateCriteria}
        />
      ) : (
        <EvaluationCriteriaStep
          criteriaState={criteriaState}
          values={draft.evaluationCriteria}
          onChange={(field, value) => updateSection("evaluationCriteria", field, value)}
          onBack={() => goToStep(3)}
          onRetry={generateCriteria}
        />
      )}
    </PageShell>
  );
}
