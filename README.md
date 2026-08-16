# AI Product Decision Assistant

The implemented product slice includes **Define Decision**, **Project Context**,
**Enterprise Context**, AI-assisted **Evaluation Criteria**, and a transparent
**Recommendation**. It captures current and planned technologies, classifies
enterprise constraints, and uses a server-side local Ollama model or the OpenAI
Responses API to propose structured evaluation criteria and option analysis.

The criteria-generation call returns qualitative criteria through a strict JSON
schema. Numeric criterion weights are derived deterministically by application
code, and that call is explicitly prohibited from evaluating or ranking options.

For the recommendation, criterion weights are withheld from the model. The model
returns only validated 1–5 ratings and qualitative analysis for every option and
criterion. Application code then calculates weighted scores, ranks the options,
and selects the recommendation. The final screen separates user-supplied facts,
AI inferences, deterministic calculations, and the recommendation.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The web application runs at `http://127.0.0.1:3000`; the local API runs at
`http://127.0.0.1:3001` and is proxied by Vite. The default configuration uses
the locally installed `gemma4:latest` model through Ollama, with no API key or
per-request fee. Start the Ollama application before generating criteria.

Decision progress is retained while navigating the open application, but every
full browser reload starts a blank decision. The final Recommendation step also
provides a **Start new decision** action that clears the current workflow. Project
type is a multi-select checkbox field and accepts one or more classifications.

To use OpenAI instead, set `LLM_PROVIDER=openai`, `OPENAI_API_KEY`, and optionally
`OPENAI_MODEL` in `.env.local`. Provider settings are read only by the server. Do
not prefix secrets with `VITE_`, which would expose them to the browser bundle.

For a production-style local run:

```bash
npm run build
npm start
```

## Verification

```bash
npm test
npm run build
```
