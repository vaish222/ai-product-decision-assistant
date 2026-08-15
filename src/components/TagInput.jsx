import { useState } from "react";

export function TagInput({ id, label, hint, placeholder, value, onChange, maxItems = 20 }) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  function addTag(rawValue = inputValue) {
    const technology = rawValue.trim().replace(/,$/, "").trim();
    if (!technology) return;
    if (technology.length > 60) {
      setError("Technology names must be 60 characters or fewer.");
      return;
    }
    if (value.length >= maxItems) {
      setError(`Add no more than ${maxItems} technologies here.`);
      return;
    }
    if (value.some((item) => item.toLocaleLowerCase() === technology.toLocaleLowerCase())) {
      setError(`${technology} is already listed.`);
      return;
    }
    onChange([...value, technology]);
    setInputValue("");
    setError("");
  }

  function onKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
    if (event.key === "Backspace" && !inputValue && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(technology) {
    onChange(value.filter((item) => item !== technology));
    setError("");
  }

  return (
    <div className={`tag-field ${error ? "tag-field--error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      <div className="tag-input" onClick={() => document.getElementById(id)?.focus()}>
        {value.map((technology) => (
          <span className="technology-tag" key={technology}>
            {technology}
            <button type="button" onClick={() => removeTag(technology)} aria-label={`Remove ${technology}`}>×</button>
          </span>
        ))}
        <input
          id={id}
          value={inputValue}
          onChange={(event) => { setInputValue(event.target.value); setError(""); }}
          onKeyDown={onKeyDown}
          onBlur={() => addTag()}
          placeholder={value.length ? "Add another" : placeholder}
          aria-describedby={[hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
          aria-invalid={Boolean(error)}
        />
        <button className="tag-input__add" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => addTag()} aria-label={`Add ${label.toLowerCase()}`}>+</button>
      </div>
      {error && <p className="field__error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
