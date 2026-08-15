import { useEffect, useRef, useState } from "react";
import { loadDraft, saveDraft } from "../domain/decisionDraft";

export function useDecisionDraft() {
  const [draft, setDraft] = useState(loadDraft);
  const [saveState, setSaveState] = useState(draft.updatedAt ? "saved" : "idle");
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
  }, [draft.currentStep, draft.defineDecision, draft.projectContext]);

  function updateSection(section, field, value) {
    setDraft((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  }

  function goToStep(step) {
    setDraft((current) => ({ ...current, currentStep: step }));
  }

  function saveImmediately() {
    const savedDraft = saveDraft(draft);
    setDraft(savedDraft);
    setSaveState("saved");
  }

  return { draft, updateSection, goToStep, saveImmediately, saveState };
}
