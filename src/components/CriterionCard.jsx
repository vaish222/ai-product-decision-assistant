const IMPORTANCE_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function CriterionCard({ criterion, onWeightChange, onRemove }) {
  return (
    <article className="criterion-card">
      <div className="criterion-card__header">
        <div>
          <span className={`importance-badge importance-badge--${criterion.importance}`}>{IMPORTANCE_LABELS[criterion.importance]} importance</span>
          <h2>{criterion.name}</h2>
        </div>
        <button type="button" onClick={onRemove} aria-label={`Remove criterion: ${criterion.name}`}>×</button>
      </div>
      <p className="criterion-card__description">{criterion.description}</p>
      <div className="criterion-card__rationale"><strong>Why it matters here</strong><p>{criterion.rationale}</p></div>
      <div className="criterion-weight">
        <div><label htmlFor={`${criterion.id}-weight`}>Decision weight</label><output htmlFor={`${criterion.id}-weight`}>{criterion.weight}%</output></div>
        <input id={`${criterion.id}-weight`} type="range" min="0" max="50" step="1" value={criterion.weight} onChange={(event) => onWeightChange(Number(event.target.value))} />
      </div>
    </article>
  );
}
