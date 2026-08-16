function InsightList({ items, emptyMessage }) {
  if (!items?.length) return <p className="recommendation-empty-copy">{emptyMessage}</p>;
  return <ul className="recommendation-list">{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>;
}

function AnalysisCard({ title, label = "AI inference", children, className = "" }) {
  return (
    <section className={`analysis-card ${className}`}>
      <div className="analysis-card__heading"><h2>{title}</h2><span className="source-label source-label--inference">{label}</span></div>
      {children}
    </section>
  );
}

function ScoreCard({ score, isRecommended }) {
  return (
    <article className={`score-card ${isRecommended ? "score-card--recommended" : ""}`}>
      <div className="score-card__heading">
        <div><span>Rank #{score.rank}</span><h3>{score.option}</h3></div>
        <strong>{score.weightedScore}<small>/100</small></strong>
      </div>
      <div className="score-bar" aria-label={`${score.option} weighted score ${score.weightedScore} out of 100`}>
        <span style={{ width: `${score.weightedScore}%` }} />
      </div>
      <details>
        <summary>View score calculation</summary>
        <div className="score-breakdown">
          {score.criterionScores.map((criterion) => (
            <div key={criterion.criterionId}>
              <div><strong>{criterion.criterionName}</strong><span>{criterion.weight}% × {criterion.rating}/5 = {criterion.weightedContribution}</span></div>
              <p>{criterion.reason}</p>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}

export function RecommendationStep({ recommendationState, values, onBack, onRetry }) {
  const hasRecommendation = values.scores?.length > 0;
  const confidenceLabel = values.confidence ? `${values.confidence[0].toUpperCase()}${values.confidence.slice(1)}` : "Unknown";

  return (
    <div>
      <div className="eyebrow"><span /> Decision analysis</div>
      <h1>Recommendation</h1>
      <p className="lede">A transparent view of the calculated outcome, the model’s reasoning, and the information that could alter the decision.</p>

      {recommendationState.status === "loading" && (
        <div className="criteria-loading" role="status">
          <span className="criteria-loading__spinner" aria-hidden="true" />
          <div><strong>Analyzing your options</strong><p>The local model is rating each option against every criterion. The application will calculate final scores afterward.</p></div>
        </div>
      )}

      {recommendationState.status === "error" && (
        <div className="criteria-error" role="alert">
          <span aria-hidden="true">!</span>
          <div><strong>Recommendation could not be generated</strong><p>{recommendationState.error}</p><button className="button button--secondary" type="button" onClick={onRetry}>Try again</button></div>
        </div>
      )}

      {recommendationState.status === "idle" && !hasRecommendation && (
        <div className="criteria-empty">
          <p>No recommendation is saved for this draft.</p>
          <button className="button button--primary" type="button" onClick={onRetry}>Generate recommendation</button>
        </div>
      )}

      {hasRecommendation && (
        <>
          <section className="recommendation-hero">
            <div className="recommendation-hero__label"><span className="source-label source-label--recommendation">Recommendation</span><span>Calculated from reviewed weights and AI ratings</span></div>
            <div className="recommendation-hero__content">
              <div>
                <p>{values.status === "tie" ? "No clear leader" : "Recommended option"}</p>
                <h2>{values.recommendedOption || "Further evidence required"}</h2>
                <p className="recommendation-hero__summary">{values.summary}</p>
              </div>
              <div className={`confidence-badge confidence-badge--${values.confidence}`}>
                <span>AI confidence</span><strong>{confidenceLabel}</strong>
              </div>
            </div>
            <div className="confidence-rationale"><span className="source-label source-label--inference">AI inference</span><p>{values.confidenceRationale}</p></div>
          </section>

          <section className="score-section">
            <div className="analysis-card__heading"><div><h2>Weighted scores</h2><p>Calculated by application code from criterion weight × raw rating ÷ 5.</p></div><span className="source-label source-label--calculated">Calculated</span></div>
            <div className="score-grid">
              {values.scores.map((score) => <ScoreCard key={score.option} score={score} isRecommended={score.option === values.recommendedOption} />)}
            </div>
          </section>

          <div className="analysis-grid">
            <AnalysisCard title="Top reasons"><InsightList items={values.topReasons} emptyMessage="No single option leads the calculated scores." /></AnalysisCard>
            <AnalysisCard title="Key trade-offs"><InsightList items={values.keyTradeoffs} emptyMessage="No trade-offs were returned." /></AnalysisCard>
            <AnalysisCard title="Risks">
              {values.risks?.length ? <ul className="risk-list">{values.risks.map((risk, index) => <li key={`${index}-${risk.statement}`}><span className={`risk-severity risk-severity--${risk.severity}`}>{risk.severity}</span><p>{risk.statement}</p></li>)}</ul> : <p className="recommendation-empty-copy">No option-specific risks were returned.</p>}
            </AnalysisCard>
            <AnalysisCard title="Missing information"><InsightList items={values.missingInformation} emptyMessage="The model did not identify missing information." /></AnalysisCard>
            <AnalysisCard title="What could change the recommendation" className="analysis-card--wide"><InsightList items={values.changeFactors} emptyMessage="No change factors were returned." /></AnalysisCard>
          </div>

          <section className="evidence-section">
            <div className="evidence-column evidence-column--facts">
              <div className="analysis-card__heading"><h2>Facts from your inputs</h2><span className="source-label source-label--fact">Fact</span></div>
              <p className="evidence-intro">Directly restated from the decision and enterprise context you supplied.</p>
              <InsightList items={values.facts} emptyMessage="No context facts are available." />
            </div>
            <div className="evidence-column evidence-column--inferences">
              <div className="analysis-card__heading"><h2>AI inferences</h2><span className="source-label source-label--inference">AI inference</span></div>
              <p className="evidence-intro">Interpretations produced by the model; validate these before acting.</p>
              <InsightList items={values.inferences} emptyMessage="No inferences were returned." />
            </div>
          </section>

          <div className="criteria-provenance">
            <span>Generated {values.generatedAt ? new Date(values.generatedAt).toLocaleString() : "for this draft"}</span>
            <span>Model: {values.model || "configured server model"} · Scores: deterministic</span>
          </div>
        </>
      )}

      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onBack}><span aria-hidden="true">←</span> Back</button>
        {hasRecommendation && <button className="button button--secondary" type="button" onClick={onRetry}>Regenerate analysis</button>}
      </div>
    </div>
  );
}
