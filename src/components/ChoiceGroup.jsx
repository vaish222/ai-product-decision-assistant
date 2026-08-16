export function ChoiceGroup({ id, legend, hint, options, value, onChange, error, compact = false, multiple = false }) {
  function isSelected(option) {
    return multiple ? value.includes(option) : value === option;
  }

  function select(option) {
    if (!multiple) {
      onChange(option);
      return;
    }
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <fieldset className={`choice-group ${compact ? "choice-group--compact" : ""}`} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}>
      <legend>{legend}</legend>
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      <div className="choice-group__grid">
        {options.map((option) => (
          <label className={`choice-card ${multiple ? "choice-card--multiple" : ""} ${isSelected(option) ? "choice-card--selected" : ""}`} key={option}>
            <input type={multiple ? "checkbox" : "radio"} name={id} value={option} checked={isSelected(option)} onChange={() => select(option)} />
            <span className="choice-card__control" aria-hidden="true" />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error && <p className="field__error" id={`${id}-error`} role="alert">{error}</p>}
    </fieldset>
  );
}

export function ChipGroup({ id, legend, hint, options, value, onChange }) {
  function toggle(option) {
    if (option === "None / Unknown") {
      onChange(value.includes(option) ? [] : [option]);
      return;
    }
    const withoutUnknown = value.filter((item) => item !== "None / Unknown");
    onChange(withoutUnknown.includes(option) ? withoutUnknown.filter((item) => item !== option) : [...withoutUnknown, option]);
  }

  return (
    <fieldset className="chip-group" aria-describedby={`${id}-hint`}>
      <legend>{legend}</legend>
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      <div className="chip-group__list">
        {options.map((option) => {
          const optionId = `${id}-${option.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
            <label className={`chip ${value.includes(option) ? "chip--selected" : ""}`} htmlFor={optionId} key={option}>
              <input id={optionId} type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} />
              <span aria-hidden="true">{value.includes(option) ? "✓" : "+"}</span>
              <span className="chip__label">{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
