import { describe, expect, it, vi } from "vitest";
import {
  RECOMMENDATION_OUTPUT_SCHEMA,
  calculateWeightedScores,
  generateRecommendation,
  validateRecommendationAnalysis,
} from "./recommendationService";

const CRITERIA = [
  { id: "security", name: "Security", description: "Security fit", importance: "critical", rationale: "Required", weight: 60 },
  { id: "delivery", name: "Delivery", description: "Delivery fit", importance: "high", rationale: "Timeline", weight: 40 },
];

const MODEL_ANALYSIS = {
  optionAssessments: [
    {
      option: "PostgreSQL",
      summary: "PostgreSQL appears to fit the supplied requirements more closely.",
      ratings: [
        { criterionId: "security", rating: 5, reason: "It aligns strongly with the supplied security context." },
        { criterionId: "delivery", rating: 4, reason: "It appears compatible with the supplied delivery needs." },
      ],
      strengths: ["Strong alignment with the supplied security requirement.", "Good fit with the stated delivery context."],
      risks: [{ statement: "Operational experience was not supplied in the context.", severity: "medium" }],
    },
    {
      option: "MongoDB",
      summary: "MongoDB has potential but carries more uncertainty in the supplied context.",
      ratings: [
        { criterionId: "security", rating: 3, reason: "The supplied context does not establish security alignment." },
        { criterionId: "delivery", rating: 4, reason: "It appears compatible with the supplied delivery needs." },
      ],
      strengths: ["Potential alignment with the stated delivery timeline.", "Could meet the desired application outcome."],
      risks: [{ statement: "Security alignment is not established by supplied facts.", severity: "high" }],
    },
  ],
  confidence: "medium",
  confidenceRationale: "Important operational and cost details are missing.",
  keyTradeoffs: ["Security alignment differs between the options.", "Delivery fit appears similar based on supplied context."],
  missingInformation: ["Expected workload characteristics", "Team experience with each option"],
  changeFactors: ["New evidence of stronger security alignment could change the result."],
  inferences: ["PostgreSQL appears to carry lower security uncertainty.", "Both options may support the stated timeline."],
};

const CONTEXT = {
  decision: { title: "Choose a database", optionA: "PostgreSQL", optionB: "MongoDB", optionC: "" },
  projectContext: { projectType: "New application", expectedScale: "Medium", timeline: "3–6 months", teamSize: "8", budgetSensitivity: "Medium", complianceRequirements: ["SOC 2"] },
  enterpriseContext: { cloudPlatforms: ["AWS"], constraints: [{ statement: "Use SSO", classification: "Must Have" }] },
  evaluationCriteria: { items: CRITERIA },
};

describe("recommendation service", () => {
  it("calculates weighted scores in application code", () => {
    const analysis = validateRecommendationAnalysis(MODEL_ANALYSIS, ["PostgreSQL", "MongoDB"], CRITERIA);
    const scores = calculateWeightedScores(analysis.assessments, CRITERIA);
    expect(scores[0]).toMatchObject({ option: "PostgreSQL", weightedScore: 92, rank: 1 });
    expect(scores[1]).toMatchObject({ option: "MongoDB", weightedScore: 68, rank: 2 });
  });

  it("rejects incomplete criterion coverage", () => {
    const invalid = JSON.parse(JSON.stringify(MODEL_ANALYSIS));
    invalid.optionAssessments[0].ratings.pop();
    expect(() => validateRecommendationAnalysis(invalid, ["PostgreSQL", "MongoDB"], CRITERIA)).toThrow(/every criterion/i);
  });

  it("withholds weights and final-score fields from the local model", async () => {
    const callProvider = vi.fn().mockResolvedValue({ message: { content: JSON.stringify(MODEL_ANALYSIS) } });
    const result = await generateRecommendation(CONTEXT, {
      provider: "ollama",
      model: "local-test",
      callProvider,
    });

    const request = callProvider.mock.calls[0][0];
    const suppliedContext = JSON.parse(request.messages[1].content);
    expect(suppliedContext.evaluationCriteria[0]).not.toHaveProperty("weight");
    expect(JSON.stringify(request.format)).not.toMatch(/weightedScore|recommendedOption|rank/);
    expect(request.format).toEqual(RECOMMENDATION_OUTPUT_SCHEMA);
    expect(request.messages[0].content).toMatch(/Do not calculate weights, weighted scores, totals/i);
    expect(result).toMatchObject({ recommendedOption: "PostgreSQL", confidence: "medium", provider: "ollama" });
    expect(result.scores[0].weightedScore).toBe(92);
    expect(result.facts).toContain("Compliance requirements supplied: SOC 2.");
  });

  it("requires weights to total exactly 100", () => {
    const analysis = validateRecommendationAnalysis(MODEL_ANALYSIS, ["PostgreSQL", "MongoDB"], CRITERIA);
    expect(() => calculateWeightedScores(analysis.assessments, [{ ...CRITERIA[0], weight: 50 }, CRITERIA[1]])).toThrow(/total 100/i);
  });
});
