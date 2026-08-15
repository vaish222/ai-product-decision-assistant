export const DRAFT_STORAGE_KEY = "ai-product-decision-assistant:draft:v1";

export const PROJECT_TYPES = [
  "New application",
  "Existing application modernization",
  "Platform migration",
  "AI/ML application",
  "Internal enterprise application",
  "Customer-facing product",
  "Other",
];

export const SCALE_OPTIONS = ["Prototype", "Small", "Medium", "Large enterprise", "Unsure"];
export const TIMELINE_OPTIONS = ["< 1 month", "1–3 months", "3–6 months", "6+ months"];
export const BUDGET_OPTIONS = ["Low", "Medium", "High"];
export const COMPLIANCE_OPTIONS = [
  "SOC 2",
  "HIPAA",
  "GDPR",
  "PCI",
  "Enterprise security policies",
  "None / Unknown",
  "Other",
];

export function createEmptyDraft() {
  return {
    schemaVersion: 1,
    currentStep: 1,
    updatedAt: null,
    defineDecision: {
      title: "",
      optionA: "",
      optionB: "",
      optionC: "",
      comparisonReason: "",
      desiredOutcome: "",
    },
    projectContext: {
      projectType: "",
      expectedScale: "",
      timeline: "",
      teamSize: "",
      budgetSensitivity: "",
      complianceRequirements: [],
      additionalConstraints: "",
    },
  };
}

function required(value, label) {
  return value.trim() ? "" : `${label} is required.`;
}

function maxLength(value, label, maximum) {
  return value.length <= maximum ? "" : `${label} must be ${maximum} characters or fewer.`;
}

export function validateDefineDecision(values) {
  const errors = {
    title: required(values.title, "Decision title") || maxLength(values.title, "Decision title", 120),
    optionA: required(values.optionA, "Option A") || maxLength(values.optionA, "Option A", 80),
    optionB: required(values.optionB, "Option B") || maxLength(values.optionB, "Option B", 80),
    optionC: maxLength(values.optionC, "Option C", 80),
    comparisonReason:
      required(values.comparisonReason, "Comparison reason") ||
      maxLength(values.comparisonReason, "Comparison reason", 1000),
    desiredOutcome:
      required(values.desiredOutcome, "Desired outcome") ||
      maxLength(values.desiredOutcome, "Desired outcome", 1000),
  };

  const optionA = values.optionA.trim().toLocaleLowerCase();
  const optionB = values.optionB.trim().toLocaleLowerCase();
  const optionC = values.optionC.trim().toLocaleLowerCase();
  if (optionA && optionB && optionA === optionB) {
    errors.optionB = "Technology options must be different.";
  }
  if (optionC && (optionC === optionA || optionC === optionB)) {
    errors.optionC = "Technology options must be different.";
  }

  return removeEmptyErrors(errors);
}

export function validateProjectContext(values) {
  const errors = {
    projectType: required(values.projectType, "Project type"),
    expectedScale: required(values.expectedScale, "Expected scale"),
    timeline: required(values.timeline, "Timeline"),
    teamSize: validateTeamSize(values.teamSize),
    budgetSensitivity: required(values.budgetSensitivity, "Budget sensitivity"),
    additionalConstraints: maxLength(values.additionalConstraints, "Additional constraints", 1500),
  };
  return removeEmptyErrors(errors);
}

function validateTeamSize(value) {
  if (!String(value).trim()) return "Team size is required.";
  const teamSize = Number(value);
  if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 5000) {
    return "Team size must be a whole number between 1 and 5,000.";
  }
  return "";
}

function removeEmptyErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

export function loadDraft(storage = window.localStorage) {
  const emptyDraft = createEmptyDraft();
  try {
    const stored = JSON.parse(storage.getItem(DRAFT_STORAGE_KEY));
    if (!stored || stored.schemaVersion !== 1) return emptyDraft;
    return {
      ...emptyDraft,
      ...stored,
      currentStep: stored.currentStep === 2 ? 2 : 1,
      defineDecision: { ...emptyDraft.defineDecision, ...stored.defineDecision },
      projectContext: { ...emptyDraft.projectContext, ...stored.projectContext },
    };
  } catch {
    return emptyDraft;
  }
}

export function saveDraft(draft, storage = window.localStorage) {
  const savedDraft = { ...draft, updatedAt: new Date().toISOString() };
  storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(savedDraft));
  return savedDraft;
}
