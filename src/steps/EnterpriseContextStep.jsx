import { useState } from "react";
import { ChipGroup } from "../components/ChoiceGroup";
import { ConstraintEditor } from "../components/ConstraintEditor";
import { TagInput } from "../components/TagInput";
import {
  CLOUD_PLATFORM_OPTIONS,
  STACK_CATEGORIES,
  validateEnterpriseContext,
} from "../domain/decisionDraft";

export function EnterpriseContextStep({ values, onChange, onBack, onSave }) {
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    onChange(field, value);
    setSaved(false);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateStackCategory(category, technologies) {
    update("currentTechStack", { ...values.currentTechStack, [category]: technologies });
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = validateEnterpriseContext(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSave();
      setSaved(true);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="eyebrow"><span /> Map your environment</div>
      <h1>What does your technology environment look like?</h1>
      <p className="lede">Separate what your organization uses today from what this project plans to introduce.</p>

      <section className="form-section" aria-labelledby="current-environment-heading">
        <div className="section-heading">
          <div>
            <h2 id="current-environment-heading">Current enterprise environment</h2>
            <p>Capture platforms and tools already supported by your organization.</p>
          </div>
          <span className="section-number">01</span>
        </div>
        <ChipGroup
          id="cloud-platforms"
          legend="Cloud platforms"
          hint="Select every environment currently in use."
          options={CLOUD_PLATFORM_OPTIONS}
          value={values.cloudPlatforms}
          onChange={(value) => update("cloudPlatforms", value)}
        />
        <div className="stack-grid">
          {STACK_CATEGORIES.map((category) => (
            <TagInput
              id={`stack-${category.key}`}
              key={category.key}
              label={category.label}
              placeholder={category.placeholder}
              value={values.currentTechStack[category.key]}
              onChange={(value) => updateStackCategory(category.key, value)}
            />
          ))}
        </div>
        {errors.technologies && <p className="field__error" role="alert">{errors.technologies}</p>}
      </section>

      <section className="form-section form-section--accent" aria-labelledby="planned-technologies-heading">
        <div className="section-heading">
          <div>
            <h2 id="planned-technologies-heading">Planned for this project</h2>
            <p>List technologies this initiative expects to introduce or standardize.</p>
          </div>
          <span className="section-number">02</span>
        </div>
        <div className="planned-context-note">
          <span aria-hidden="true">↗</span>
          <p>Keep planned technologies separate from the current stack so future analysis can identify adoption and integration effort.</p>
        </div>
        <TagInput
          id="planned-technologies"
          label="Project-specific planned technologies"
          hint="Press Enter or comma after each technology."
          placeholder="e.g. Kubernetes"
          value={values.plannedTechnologies}
          onChange={(value) => update("plannedTechnologies", value)}
          maxItems={30}
        />
      </section>

      <section className="form-section" aria-labelledby="enterprise-constraints-heading">
        <div className="section-heading">
          <div>
            <h2 id="enterprise-constraints-heading">Enterprise constraints</h2>
            <p>Classify each constraint by how strongly it should shape the decision.</p>
          </div>
          <span className="section-number">03</span>
        </div>
        <div className="classification-guide" aria-label="Constraint classification guide">
          <p><span className="classification-dot classification-dot--must" /> <strong>Must Have</strong> Mandatory; an option that fails should be flagged.</p>
          <p><span className="classification-dot classification-dot--preferred" /> <strong>Preferred</strong> Important, but trade-offs are acceptable.</p>
          <p><span className="classification-dot classification-dot--nice" /> <strong>Nice to Have</strong> Adds value without driving eligibility.</p>
        </div>
        <ConstraintEditor value={values.constraints} onChange={(value) => update("constraints", value)} error={errors.constraints} />
      </section>

      {saved && (
        <div className="success-banner" role="status">
          <span aria-hidden="true">✓</span>
          <div><strong>Enterprise context saved</strong><p>Your complete three-step draft is stored on this device.</p></div>
        </div>
      )}

      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onBack}><span aria-hidden="true">←</span> Back</button>
        <button className="button button--primary" type="submit">Save draft <span aria-hidden="true">✓</span></button>
      </div>
    </form>
  );
}
