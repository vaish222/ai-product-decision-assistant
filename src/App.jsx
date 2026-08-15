import { PageShell } from "./components/PageShell";
import { useDecisionDraft } from "./hooks/useDecisionDraft";
import { DefineDecisionStep } from "./steps/DefineDecisionStep";
import { ProjectContextStep } from "./steps/ProjectContextStep";

export function App() {
  const { draft, updateSection, goToStep, saveImmediately, saveState } = useDecisionDraft();

  return (
    <PageShell currentStep={draft.currentStep} saveState={saveState}>
      {draft.currentStep === 1 ? (
        <DefineDecisionStep
          values={draft.defineDecision}
          onChange={(field, value) => updateSection("defineDecision", field, value)}
          onContinue={() => goToStep(2)}
        />
      ) : (
        <ProjectContextStep
          values={draft.projectContext}
          onChange={(field, value) => updateSection("projectContext", field, value)}
          onBack={() => goToStep(1)}
          onSave={saveImmediately}
        />
      )}
    </PageShell>
  );
}
