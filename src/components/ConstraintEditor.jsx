import { useState } from "react";
import { CONSTRAINT_CLASSIFICATIONS } from "../domain/decisionDraft";

function createConstraint(statement, classification) {
  return {
    id: `constraint-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    statement,
    classification,
  };
}

export function ConstraintEditor({ value, onChange, error }) {
  const [statement, setStatement] = useState("");
  const [classification, setClassification] = useState("Must Have");
  const [inputError, setInputError] = useState("");

  function addConstraint() {
    const trimmedStatement = statement.trim();
    if (!trimmedStatement) {
      setInputError("Describe the enterprise constraint before adding it.");
      return;
    }
    if (trimmedStatement.length > 240) {
      setInputError("Enterprise constraints must be 240 characters or fewer.");
      return;
    }
    if (value.some((item) => item.statement.toLocaleLowerCase() === trimmedStatement.toLocaleLowerCase())) {
      setInputError("This enterprise constraint is already listed.");
      return;
    }
    onChange([...value, createConstraint(trimmedStatement, classification)]);
    setStatement("");
    setClassification("Must Have");
    setInputError("");
  }

  function updateConstraint(id, updates) {
    onChange(value.map((constraint) => constraint.id === id ? { ...constraint, ...updates } : constraint));
  }

  function removeConstraint(id) {
    onChange(value.filter((constraint) => constraint.id !== id));
  }

  return (
    <div className="constraint-editor">
      <div className="constraint-editor__composer">
        <div className="field constraint-editor__statement">
          <div className="field__heading"><label htmlFor="new-constraint">Constraint</label></div>
          <input
            id="new-constraint"
            value={statement}
            maxLength={240}
            onChange={(event) => { setStatement(event.target.value); setInputError(""); }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addConstraint();
              }
            }}
            placeholder="e.g. Must integrate with Microsoft Entra ID"
            aria-describedby={inputError ? "new-constraint-error" : undefined}
            aria-invalid={Boolean(inputError)}
          />
        </div>
        <div className="field constraint-editor__classification">
          <div className="field__heading"><label htmlFor="new-constraint-classification">Classification</label></div>
          <select id="new-constraint-classification" value={classification} onChange={(event) => setClassification(event.target.value)}>
            {CONSTRAINT_CLASSIFICATIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <button className="button button--secondary constraint-editor__add" type="button" onClick={addConstraint}>Add</button>
      </div>
      {inputError && <p className="field__error" id="new-constraint-error" role="alert">{inputError}</p>}
      {error && <p className="field__error" role="alert">{error}</p>}

      {value.length > 0 ? (
        <ul className="constraint-list" aria-label="Enterprise constraints">
          {value.map((constraint) => (
            <li key={constraint.id}>
              <span className={`constraint-list__marker constraint-list__marker--${constraint.classification.toLowerCase().replaceAll(" ", "-")}`} aria-hidden="true" />
              <p>{constraint.statement}</p>
              <label className="sr-only" htmlFor={`${constraint.id}-classification`}>Classification for {constraint.statement}</label>
              <select id={`${constraint.id}-classification`} value={constraint.classification} onChange={(event) => updateConstraint(constraint.id, { classification: event.target.value })}>
                {CONSTRAINT_CLASSIFICATIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
              <button type="button" onClick={() => removeConstraint(constraint.id)} aria-label={`Remove constraint: ${constraint.statement}`}>×</button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-constraints"><span aria-hidden="true">◎</span><p>No enterprise constraints added yet.</p></div>
      )}
    </div>
  );
}
