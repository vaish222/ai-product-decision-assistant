import { useState } from "react";
import { generateEvaluationCriteria } from "./api/criteria";
import { generateRecommendation } from "./api/recommendation";
import { PageShell } from "./components/PageShell";
import { useDecisionDraft } from "./hooks/useDecisionDraft";
import { DefineDecisionStep } from "./steps/DefineDecisionStep";
import { ProjectContextStep } from "./steps/ProjectContextStep";
import { EnterpriseContextStep } from "./steps/EnterpriseContextStep";
import { EvaluationCriteriaStep } from "./steps/EvaluationCriteriaStep";
import { RecommendationStep } from "./steps/RecommendationStep";

export function App() {
  const { draft, updateSection, replaceSection, goToStep, saveImmediately, saveState } = useDecisionDraft();
  const [criteriaState, setCriteriaState] = useState(() => ({
    status: draft.evaluationCriteria.items.length ? "success" : "idle",
    error: "",
  }));
  const [recommendationState, setRecommendationState] = useState(() => ({
    status: draft.recommendation.scores.length ? "success" : "idle",
    error: "",
  }));

  function clearRecommendation() {
    replaceSection("recommendation", {
      status: null, recommendedOption: null, summary: "", scores: [], confidence: null,
      confidenceRationale: "", topReasons: [], keyTradeoffs: [], risks: [],
      missingInformation: [], changeFactors: [], facts: [], inferences: [],
      generatedAt: null, model: null, provider: null, scoringMethod: null,
    });
    setRecommendationState({ status: "idle", error: "" });
  }

  function updateAndInvalidate(section, field, value) {
    updateSection(section, field, value);
    if (draft.recommendation.scores.length) clearRecommendation();
  }

  async function generateCriteria() {
    clearRecommendation();
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

  async function analyzeOptions() {
    saveImmediately();
    goToStep(5);
    setRecommendationState({ status: "loading", error: "" });
    try {
      const result = await generateRecommendation({
        decision: draft.defineDecision,
        projectContext: draft.projectContext,
        enterpriseContext: draft.enterpriseContext,
        evaluationCriteria: draft.evaluationCriteria,
      });
      replaceSection("recommendation", result);
      setRecommendationState({ status: "success", error: "" });
    } catch (error) {
      setRecommendationState({ status: "error", error: error.message || "Unable to generate the recommendation." });
    }
  }

  return (
    <PageShell currentStep={draft.currentStep} saveState={saveState}>
      {draft.currentStep === 1 ? (
        <DefineDecisionStep
          values={draft.defineDecision}
          onChange={(field, value) => updateAndInvalidate("defineDecision", field, value)}
          onContinue={() => goToStep(2)}
        />
      ) : draft.currentStep === 2 ? (
        <ProjectContextStep
          values={draft.projectContext}
          onChange={(field, value) => updateAndInvalidate("projectContext", field, value)}
          onBack={() => goToStep(1)}
          onContinue={() => goToStep(3)}
        />
      ) : draft.currentStep === 3 ? (
        <EnterpriseContextStep
          values={draft.enterpriseContext}
          onChange={(field, value) => updateAndInvalidate("enterpriseContext", field, value)}
          onBack={() => goToStep(2)}
          onGenerate={generateCriteria}
        />
      ) : draft.currentStep === 4 ? (
        <EvaluationCriteriaStep
          criteriaState={criteriaState}
          values={draft.evaluationCriteria}
          onChange={(field, value) => updateAndInvalidate("evaluationCriteria", field, value)}
          onBack={() => goToStep(3)}
          onRetry={generateCriteria}
          onAnalyze={analyzeOptions}
        />
      ) : (
        <RecommendationStep
          recommendationState={recommendationState}
          values={draft.recommendation}
          onBack={() => goToStep(4)}
          onRetry={analyzeOptions}
        />
      )}
    </PageShell>
  );
}
