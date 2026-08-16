import fs from "fs";
import path from "path";
import { generateEvaluationCriteria } from "./criteriaService.js";
import { generateRecommendation } from "./recommendationService.js";

const MAX_BODY_BYTES = 100_000;

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        const error = new Error("Request body is too large.");
        error.statusCode = 413;
        reject(error);
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch {
        const error = new Error("Request body must be valid JSON.");
        error.statusCode = 400;
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function isContextPayload(payload) {
  return payload && typeof payload === "object" &&
    payload.decision && typeof payload.decision === "object" &&
    payload.projectContext && typeof payload.projectContext === "object" &&
    payload.enterpriseContext && typeof payload.enterpriseContext === "object";
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function serveStatic(request, response, rootDirectory) {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let filePath = path.resolve(rootDirectory, requestedPath);
  const relativePath = path.relative(path.resolve(rootDirectory), filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendJson(response, 403, { error: "Invalid path." });
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(rootDirectory, "index.html");
  if (!fs.existsSync(filePath)) {
    sendJson(response, 404, { error: "Build output not found. Run npm run build first." });
    return;
  }
  const content = fs.readFileSync(filePath);
  response.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
  response.end(content);
}

export function createRequestHandler(options = {}) {
  const apiOnly = Boolean(options.apiOnly);
  const generateCriteria = options.generateCriteria || generateEvaluationCriteria;
  const analyzeOptions = options.generateRecommendation || generateRecommendation;
  const staticRoot = options.staticRoot || path.resolve(process.cwd(), "dist");

  return async function requestHandler(request, response) {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/api/criteria/generate") {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed." });
        return;
      }
      try {
        const payload = await readJsonBody(request);
        if (!isContextPayload(payload)) {
          sendJson(response, 400, { error: "Decision, project context, and enterprise context are required." });
          return;
        }
        sendJson(response, 200, await generateCriteria(payload));
      } catch (error) {
        sendJson(response, error.statusCode || 502, { error: error.message || "Criteria generation failed." });
      }
      return;
    }
    if (pathname === "/api/health") {
      const provider = process.env.LLM_PROVIDER || "openai";
      sendJson(response, 200, {
        status: "ok",
        provider,
        modelConfigured: provider === "ollama" || Boolean(process.env.OPENAI_API_KEY),
      });
      return;
    }
    if (pathname === "/api/recommendation/generate") {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed." });
        return;
      }
      try {
        const payload = await readJsonBody(request);
        if (!isContextPayload(payload) || !payload.evaluationCriteria || typeof payload.evaluationCriteria !== "object") {
          sendJson(response, 400, { error: "Decision context and evaluation criteria are required." });
          return;
        }
        sendJson(response, 200, await analyzeOptions(payload));
      } catch (error) {
        sendJson(response, error.statusCode || 502, { error: error.message || "Recommendation generation failed." });
      }
      return;
    }
    if (apiOnly) {
      sendJson(response, 404, { error: "Not found." });
      return;
    }
    serveStatic(request, response, staticRoot);
  };
}
