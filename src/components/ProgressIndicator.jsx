const STEPS = ["Define decision", "Project context", "Enterprise context"];

export function ProgressIndicator({ currentStep }) {
  return (
    <nav className="progress" aria-label="Decision setup progress">
      <div className="progress__meta">
        <span>Decision setup</span>
        <span>Step {currentStep} of {STEPS.length}</span>
      </div>
      <ol className="progress__steps">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const state = step < currentStep ? "complete" : step === currentStep ? "active" : "upcoming";
          return (
            <li className={`progress__step progress__step--${state}`} key={label} aria-current={state === "active" ? "step" : undefined}>
              <span className="progress__dot">{state === "complete" ? "✓" : step}</span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
