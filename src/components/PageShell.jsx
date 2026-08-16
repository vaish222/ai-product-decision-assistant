import { Brand } from "./Brand";
import { ProgressIndicator } from "./ProgressIndicator";

export function PageShell({ currentStep, saveState, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <div className={`save-state save-state--${saveState}`} role="status">
          <span aria-hidden="true">{saveState === "saving" ? "•••" : "✓"}</span>
          {saveState === "saving" ? "Updating progress" : saveState === "saved" ? "Session progress saved" : "Starts fresh on reload"}
        </div>
      </header>
      <main>
        <aside className="sidebar">
          <ProgressIndicator currentStep={currentStep} />
          <div className="principle-card">
            <span className="principle-card__icon" aria-hidden="true">◇</span>
            <div>
              <strong>You’re in control</strong>
              <p>Capture the context. Review every recommendation later.</p>
            </div>
          </div>
        </aside>
        <section className="content-panel">{children}</section>
      </main>
      <footer>AI advises. Humans decide.</footer>
    </div>
  );
}
