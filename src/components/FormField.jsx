export function FormField({
  id,
  label,
  hint,
  error,
  optional = false,
  multiline = false,
  maxLength,
  value,
  onChange,
  ...inputProps
}) {
  const Input = multiline ? "textarea" : "input";
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field ${error ? "field--error" : ""}`}>
      <div className="field__heading">
        <label htmlFor={id}>{label}</label>
        {optional && <span>Optional</span>}
      </div>
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        rows={multiline ? 4 : undefined}
        {...inputProps}
      />
      <div className="field__support">
        {error ? <p className="field__error" id={`${id}-error`} role="alert">{error}</p> : <span />}
        {maxLength && multiline && <span className="field__count">{value.length}/{maxLength}</span>}
      </div>
    </div>
  );
}
