import { useEffect, useRef, useState } from "react";
import { clearDraft, createEmptyDraft, saveDraft } from "../domain/decisionDraft";

export function useDecisionDraft() {
  const [draft, setDraft] = useState(() => {
    clearDraft();
    return createEmptyDraft();
  });
  const [saveState, setSaveState] = useState("idle");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }

    setSaveState("saving");
    const timer = window.setTimeout(() => {
      const savedDraft = saveDraft(draft);
      setDraft((current) => ({ ...current, updatedAt: savedDraft.updatedAt }));
      setSaveState("saved");
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    draft.currentStep,
    draft.defineDecision,
    draft.projectContext,
    draft.enterpriseContext,
    draft.evaluationCriteria,
    draft.recommendation,
  ]);

  function updateSection(section, field, value) {
    setDraft((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  }

  function goToStep(step) {
    setDraft((current) => ({ ...current, currentStep: step }));
  }

  function replaceSection(section, value) {
    setDraft((current) => ({ ...current, [section]: value }));
  }

  function saveImmediately() {
    const savedDraft = saveDraft(draft);
    setDraft(savedDraft);
    setSaveState("saved");
  }

  function resetDraft() {
    clearDraft();
    setDraft(createEmptyDraft());
    setSaveState("idle");
  }

  return { draft, updateSection, replaceSection, goToStep, saveImmediately, resetDraft, saveState };
}
