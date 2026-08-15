import { CriterionCard } from "../components/CriterionCard";

export function EvaluationCriteriaStep({ criteriaState, values, onChange, onBack, onRetry }) {
  const totalWeight = values.items.reduce((total, criterion) => total + criterion.weight, 0);

  function updateCriterion(id, updates) {
    onChange("items", values.items.map((criterion) => criterion.id === id ? { ...criterion, ...updates } : criterion));
  }

  function removeCriterion(id) {
    onChange("items", values.items.filter((criterion) => criterion.id !== id));
  }

  return (
    <div>
      <div className="eyebrow"><span /> Review before analysis</div>
      <h1>Here’s what matters for this decision</h1>
      <p className="lede">The model suggests qualitative criteria from your context. Application code assigns the initial weights; no option scoring happens here.</p>

      {criteriaState.status === "loading" && (
        <div className="criteria-loading" role="status">
          <span className="criteria-loading__spinner" aria-hidden="true" />
          <div><strong>Generating evaluation criteria</strong><p>Reviewing project context, technologies, and enterprise constraints…</p></div>
        </div>
      )}

      {criteriaState.status === "error" && (
        <div className="criteria-error" role="alert">
          <span aria-hidden="true">!</span>
          <div><strong>Criteria could not be generated</strong><p>{criteriaState.error}</p><button className="button button--secondary" type="button" onClick={onRetry}>Try again</button></div>
        </div>
      )}

      {criteriaState.status === "idle" && values.items.length === 0 && (
        <div className="criteria-empty">
          <p>No generated criteria are saved for this draft.</p>
          <button className="button button--primary" type="button" onClick={onRetry}>Generate criteria</button>
        </div>
      )}

      {values.items.length > 0 && (
        <>
          <div className="criteria-control-note">
            <span aria-hidden="true">◇</span>
            <div><strong>You remain in control</strong><p>Adjust or remove criteria before any future option analysis. These weights are not option scores.</p></div>
          </div>
          <div className="criteria-summary">
            <div><span>Generated criteria</span><strong>{values.items.length}</strong></div>
            <div className={totalWeight === 100 ? "criteria-summary__valid" : "criteria-summary__warning"}><span>Total weight</span><strong>{totalWeight}%</strong></div>
            <div><span>Weight source</span><strong>Deterministic</strong></div>
          </div>
          {totalWeight !== 100 && <p className="weight-warning" role="status">Adjust weights to total 100% before a future analysis can run.</p>}
          <div className="criteria-grid">
            {values.items.map((criterion) => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                onWeightChange={(weight) => updateCriterion(criterion.id, { weight })}
                onRemove={() => removeCriterion(criterion.id)}
              />
            ))}
          </div>
          <div className="criteria-provenance">
            <span>Generated {values.generatedAt ? new Date(values.generatedAt).toLocaleString() : "for this draft"}</span>
            <span>Model: {values.model || "configured server model"}</span>
          </div>
        </>
      )}

      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onBack}><span aria-hidden="true">←</span> Back</button>
        {values.items.length > 0 && <button className="button button--secondary" type="button" onClick={onRetry}>Regenerate criteria</button>}
      </div>
    </div>
  );
}
