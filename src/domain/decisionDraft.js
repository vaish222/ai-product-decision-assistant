export const DRAFT_STORAGE_KEY = "ai-product-decision-assistant:draft:v4";
export const LEGACY_DRAFT_STORAGE_KEYS = [
  "ai-product-decision-assistant:draft:v3",
  "ai-product-decision-assistant:draft:v2",
  "ai-product-decision-assistant:draft:v1",
];

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

export const CLOUD_PLATFORM_OPTIONS = ["Azure", "AWS", "Google Cloud", "Hybrid", "On-premise", "Other"];
export const STACK_CATEGORIES = [
  { key: "databases", label: "Databases", placeholder: "PostgreSQL" },
  { key: "backend", label: "Backend frameworks", placeholder: "Spring Boot" },
  { key: "frontend", label: "Frontend frameworks", placeholder: "React" },
  { key: "identity", label: "Authentication / IAM", placeholder: "Microsoft Entra ID" },
  { key: "delivery", label: "CI/CD", placeholder: "GitHub Actions" },
  { key: "monitoring", label: "Monitoring", placeholder: "Datadog" },
  { key: "dataPlatforms", label: "Data platforms", placeholder: "Snowflake" },
  { key: "aiPlatforms", label: "AI/ML platforms", placeholder: "Azure AI Foundry" },
];
export const CONSTRAINT_CLASSIFICATIONS = ["Must Have", "Preferred", "Nice to Have"];

export function createEmptyDraft() {
  return {
    schemaVersion: 4,
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
    enterpriseContext: {
      cloudPlatforms: [],
      currentTechStack: Object.fromEntries(STACK_CATEGORIES.map(({ key }) => [key, []])),
      plannedTechnologies: [],
      constraints: [],
    },
    evaluationCriteria: {
      items: [],
      generatedAt: null,
      model: null,
      weightingMethod: null,
    },
    recommendation: {
      status: null,
      recommendedOption: null,
      summary: "",
      scores: [],
      confidence: null,
      confidenceRationale: "",
      topReasons: [],
      keyTradeoffs: [],
      risks: [],
      missingInformation: [],
      changeFactors: [],
      facts: [],
      inferences: [],
      generatedAt: null,
      model: null,
      provider: null,
      scoringMethod: null,
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

export function validateEnterpriseContext(values) {
  const errors = {};
  const seenConstraints = new Set();

  for (const constraint of values.constraints) {
    const statement = constraint.statement.trim();
    if (!statement) errors.constraints = "Every enterprise constraint needs a description.";
    if (statement.length > 240) errors.constraints = "Enterprise constraints must be 240 characters or fewer.";
    const normalized = statement.toLocaleLowerCase();
    if (seenConstraints.has(normalized)) errors.constraints = "Duplicate enterprise constraints are not allowed.";
    seenConstraints.add(normalized);
    if (!CONSTRAINT_CLASSIFICATIONS.includes(constraint.classification)) {
      errors.constraints = "Every enterprise constraint needs a valid classification.";
    }
  }

  const technologyGroups = [
    ...Object.values(values.currentTechStack),
    values.plannedTechnologies,
  ];
  if (technologyGroups.some((group) => group.some((technology) => technology.length > 60))) {
    errors.technologies = "Technology names must be 60 characters or fewer.";
  }

  return errors;
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

function migrateDraft(stored) {
  const emptyDraft = createEmptyDraft();
  if (!stored || ![1, 2, 3, 4].includes(stored.schemaVersion)) return emptyDraft;
  const currentStack = stored.enterpriseContext?.currentTechStack || {};
  return {
    ...emptyDraft,
    ...stored,
    schemaVersion: 4,
    currentStep: [2, 3, 4, 5].includes(stored.currentStep) ? stored.currentStep : 1,
    defineDecision: { ...emptyDraft.defineDecision, ...stored.defineDecision },
    projectContext: { ...emptyDraft.projectContext, ...stored.projectContext },
    enterpriseContext: {
      ...emptyDraft.enterpriseContext,
      ...stored.enterpriseContext,
      currentTechStack: { ...emptyDraft.enterpriseContext.currentTechStack, ...currentStack },
    },
    evaluationCriteria: { ...emptyDraft.evaluationCriteria, ...stored.evaluationCriteria },
    recommendation: { ...emptyDraft.recommendation, ...stored.recommendation },
  };
}

export function loadDraft(storage = window.localStorage) {
  for (const key of [DRAFT_STORAGE_KEY, ...LEGACY_DRAFT_STORAGE_KEYS]) {
    try {
      const stored = JSON.parse(storage.getItem(key));
      if (stored) return migrateDraft(stored);
    } catch {
      // Ignore a malformed entry and try the next compatible storage key.
    }
  }
  return createEmptyDraft();
}

export function saveDraft(draft, storage = window.localStorage) {
  const savedDraft = { ...draft, updatedAt: new Date().toISOString() };
  storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(savedDraft));
  return savedDraft;
}
