import { useState } from "react";
import { ChoiceGroup, ChipGroup } from "../components/ChoiceGroup";
import { FormField } from "../components/FormField";
import {
  BUDGET_OPTIONS,
  COMPLIANCE_OPTIONS,
  PROJECT_TYPES,
  SCALE_OPTIONS,
  TIMELINE_OPTIONS,
  validateProjectContext,
} from "../domain/decisionDraft";

export function ProjectContextStep({ values, onChange, onBack, onContinue }) {
  const [errors, setErrors] = useState({});

  function update(field, value) {
    onChange(field, value);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = validateProjectContext(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onContinue();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="eyebrow"><span /> Add operating context</div>
      <h1>Tell us about your project</h1>
      <p className="lede">Better context makes every future comparison more relevant to your reality.</p>

      <section className="form-section" aria-labelledby="project-shape-heading">
        <div className="section-heading">
          <div>
            <h2 id="project-shape-heading">Project shape</h2>
            <p>Choose the options that best describe this initiative.</p>
          </div>
          <span className="section-number">01</span>
        </div>
        <ChoiceGroup id="project-type" legend="Project type" hint="Select one or more project types." options={PROJECT_TYPES} value={values.projectType} onChange={(value) => update("projectType", value)} error={errors.projectType} multiple />
        <ChoiceGroup id="expected-scale" legend="Expected scale" options={SCALE_OPTIONS} value={values.expectedScale} onChange={(value) => update("expectedScale", value)} error={errors.expectedScale} compact />
      </section>

      <section className="form-section" aria-labelledby="delivery-heading">
        <div className="section-heading">
          <div>
            <h2 id="delivery-heading">Delivery profile</h2>
            <p>Help us understand the practical boundaries around the work.</p>
          </div>
          <span className="section-number">02</span>
        </div>
        <ChoiceGroup id="timeline" legend="Timeline" options={TIMELINE_OPTIONS} value={values.timeline} onChange={(value) => update("timeline", value)} error={errors.timeline} compact />
        <div className="two-column-fields">
          <FormField id="team-size" label="Team size" hint="People expected to build and operate the solution." value={values.teamSize} onChange={(value) => update("teamSize", value)} error={errors.teamSize} type="number" min="1" max="5000" inputMode="numeric" placeholder="e.g. 12" />
          <ChoiceGroup id="budget-sensitivity" legend="Budget sensitivity" options={BUDGET_OPTIONS} value={values.budgetSensitivity} onChange={(value) => update("budgetSensitivity", value)} error={errors.budgetSensitivity} compact />
        </div>
      </section>

      <section className="form-section" aria-labelledby="requirements-heading">
        <div className="section-heading">
          <div>
            <h2 id="requirements-heading">Requirements & constraints</h2>
            <p>Select every known requirement. You can refine these later.</p>
          </div>
          <span className="section-number">03</span>
        </div>
        <ChipGroup id="compliance" legend="Security and compliance requirements" hint="“None / Unknown” clears other selections." options={COMPLIANCE_OPTIONS} value={values.complianceRequirements} onChange={(value) => update("complianceRequirements", value)} />
        <FormField id="additional-constraints" label="Additional constraints" optional value={values.additionalConstraints} onChange={(value) => update("additionalConstraints", value)} error={errors.additionalConstraints} maxLength={1500} multiline placeholder="Add technical, organizational, procurement, or delivery constraints." />
      </section>

      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onBack}><span aria-hidden="true">←</span> Back</button>
        <button className="button button--primary" type="submit">Continue <span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
