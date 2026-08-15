import { describe, expect, it, vi } from "vitest";
import {
  CRITERIA_OUTPUT_SCHEMA,
  assignDeterministicWeights,
  generateEvaluationCriteria,
  validateGeneratedCriteria,
} from "./criteriaService";

const MODEL_CRITERIA = [
  { name: "Security", description: "Assess security and compliance requirements.", importance: "critical", rationale: "The project has compliance requirements." },
  { name: "Architecture Fit", description: "Assess fit with current enterprise architecture.", importance: "high", rationale: "The enterprise context lists current platforms." },
  { name: "Integration", description: "Assess integration effort and compatibility.", importance: "high", rationale: "Existing identity and delivery systems matter." },
  { name: "Delivery", description: "Assess impact on the project delivery timeline.", importance: "medium", rationale: "The project has a stated timeline." },
  { name: "Operations", description: "Assess monitoring and support requirements.", importance: "medium", rationale: "Operational fit affects adoption." },
];

describe("criteria generation service", () => {
  it("converts qualitative importance to deterministic weights totaling 100", () => {
    const weighted = assignDeterministicWeights(MODEL_CRITERIA);
    expect(weighted.reduce((total, criterion) => total + criterion.weight, 0)).toBe(100);
    expect(weighted[0].weight).toBeGreaterThan(weighted[3].weight);
  });

  it("rejects duplicate structured criteria after model output", () => {
    expect(() => validateGeneratedCriteria({
      criteria: [...MODEL_CRITERIA, { ...MODEL_CRITERIA[0] }],
    })).toThrow(/duplicate/i);
  });

  it("requests strict JSON and explicitly forbids option scoring", async () => {
    const callProvider = vi.fn().mockResolvedValue({
      output: [{ content: [{ type: "output_text", text: JSON.stringify({ criteria: MODEL_CRITERIA }) }] }],
    });
    const result = await generateEvaluationCriteria({
      decision: { title: "Choose a platform", optionA: "A", optionB: "B" },
      projectContext: { projectType: "New application" },
      enterpriseContext: { constraints: [] },
    }, { provider: "openai", apiKey: "test-key", model: "test-model", callProvider });

    const request = callProvider.mock.calls[0][0];
    expect(request.text.format).toMatchObject({ type: "json_schema", strict: true, schema: CRITERIA_OUTPUT_SCHEMA });
    expect(request.text.format.schema.properties.criteria.items.properties).not.toHaveProperty("weight");
    expect(request.text.format.schema.properties.criteria.items.properties).not.toHaveProperty("score");
    expect(request.input[0].content).toMatch(/Do not compare, score, rank, recommend/i);
    expect(request.input[0].content).toMatch(/Do not calculate option scores, weighted scores/i);
    expect(result.criteria.reduce((total, criterion) => total + criterion.weight, 0)).toBe(100);
    expect(result.weightingMethod).toBe("deterministic_importance_normalization_v1");
  });

  it("requires a server-side API key", async () => {
    await expect(generateEvaluationCriteria({}, { provider: "openai", apiKey: "" })).rejects.toThrow(/OPENAI_API_KEY/);
  });

  it("requests schema-constrained JSON from a local Ollama model", async () => {
    const callProvider = vi.fn().mockResolvedValue({
      message: { content: JSON.stringify({ criteria: MODEL_CRITERIA }) },
    });
    const result = await generateEvaluationCriteria({
      decision: { title: "Choose a platform", optionA: "A", optionB: "B" },
      projectContext: { projectType: "New application" },
      enterpriseContext: { constraints: [] },
    }, { provider: "ollama", model: "local-test", callProvider });

    const request = callProvider.mock.calls[0][0];
    expect(request.format).toEqual(CRITERIA_OUTPUT_SCHEMA);
    expect(request.format.properties.criteria.items.properties).not.toHaveProperty("weight");
    expect(request.messages[0].content).toMatch(/Do not calculate option scores, weighted scores/i);
    expect(result.provider).toBe("ollama");
    expect(result.model).toBe("local-test");
    expect(result.criteria.reduce((total, criterion) => total + criterion.weight, 0)).toBe(100);
  });
});
