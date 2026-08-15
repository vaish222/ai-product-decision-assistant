# AI Product Decision Assistant

The implemented product slice includes **Define Decision**, **Project Context**,
**Enterprise Context**, and AI-assisted **Evaluation Criteria**. It captures
current and planned technologies, classifies enterprise constraints, and uses a
server-side OpenAI Responses API call to propose structured evaluation criteria.

The model returns qualitative criteria through a strict JSON schema. Numeric
criterion weights are derived deterministically by application code. The model
is explicitly prohibited from evaluating options or calculating option scores,
weighted scores, rankings, or recommendations.

## Development

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
```

The web application runs at `http://127.0.0.1:3000`; the local API runs at
`http://127.0.0.1:3001` and is proxied by Vite. `OPENAI_API_KEY` and the optional
`OPENAI_MODEL` setting are read only by the server. Do not prefix them with
`VITE_`, which would expose them to the browser bundle.

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
