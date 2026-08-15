import { useState } from "react";
import { FormField } from "../components/FormField";
import { validateDefineDecision } from "../domain/decisionDraft";

export function DefineDecisionStep({ values, onChange, onContinue }) {
  const [errors, setErrors] = useState({});

  function update(field, value) {
    onChange(field, value);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = validateDefineDecision(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="eyebrow"><span /> Start with the decision</div>
      <h1>What are you trying to decide?</h1>
      <p className="lede">Tell us which technology options you’re considering and why this decision matters.</p>

      <div className="form-section">
        <FormField id="decision-title" label="Decision title" value={values.title} onChange={(value) => update("title", value)} error={errors.title} maxLength={120} placeholder="Choose a database platform for our new AI application" autoFocus />
      </div>

      <section className="form-section" aria-labelledby="options-heading">
        <div className="section-heading">
          <div>
            <h2 id="options-heading">Options to compare</h2>
            <p>Add two required options and an optional third.</p>
          </div>
          <span className="section-number">01</span>
        </div>
        <div className="option-grid">
          <FormField id="option-a" label="Option A" value={values.optionA} onChange={(value) => update("optionA", value)} error={errors.optionA} maxLength={80} placeholder="e.g. PostgreSQL" />
          <FormField id="option-b" label="Option B" value={values.optionB} onChange={(value) => update("optionB", value)} error={errors.optionB} maxLength={80} placeholder="e.g. MongoDB" />
          <FormField id="option-c" label="Option C" optional value={values.optionC} onChange={(value) => update("optionC", value)} error={errors.optionC} maxLength={80} placeholder="e.g. Azure Cosmos DB" />
        </div>
      </section>

      <section className="form-section" aria-labelledby="intent-heading">
        <div className="section-heading">
          <div>
            <h2 id="intent-heading">Decision intent</h2>
            <p>This becomes the foundation for evaluating the options.</p>
          </div>
          <span className="section-number">02</span>
        </div>
        <FormField id="comparison-reason" label="Why are you comparing these options?" value={values.comparisonReason} onChange={(value) => update("comparisonReason", value)} error={errors.comparisonReason} maxLength={1000} multiline placeholder="Describe the decision, the problem it solves, and why it matters now." />
        <FormField id="desired-outcome" label="What are you trying to achieve?" value={values.desiredOutcome} onChange={(value) => update("desiredOutcome", value)} error={errors.desiredOutcome} maxLength={1000} multiline placeholder="Describe what a successful outcome looks like for your team and organization." />
      </section>

      <div className="form-actions form-actions--end">
        <p><span aria-hidden="true">●</span> Your inputs remain editable.</p>
        <button className="button button--primary" type="submit">Continue <span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
