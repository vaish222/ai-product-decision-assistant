import http from "http";
import { createRequestHandler } from "./app.js";
import { loadLocalEnv } from "./env.js";

loadLocalEnv();

const apiOnly = process.argv.includes("--api-only");
const port = Number(apiOnly ? process.env.API_PORT || 3001 : process.env.PORT || 3000);
const server = http.createServer(createRequestHandler({ apiOnly }));

server.listen(port, "127.0.0.1", () => {
  console.log(`${apiOnly ? "API" : "Application"} server running at http://127.0.0.1:${port}`);
  const provider = process.env.LLM_PROVIDER || "openai";
  console.log(`Criteria generation provider: ${provider}`);
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    console.log("Criteria generation is disabled until OPENAI_API_KEY is configured.");
  }
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
