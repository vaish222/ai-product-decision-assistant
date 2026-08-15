import http from "http";
import https from "https";

export function requestOllamaChat(payload, { baseUrl = "http://127.0.0.1:11434", timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL("/api/chat", baseUrl);
    const body = JSON.stringify(payload);
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request({
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (response) => {
      let responseBody = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { responseBody += chunk; });
      response.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(responseBody);
        } catch {
          reject(new Error("The local model returned an unreadable response."));
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(parsed.error || "The local model rejected the request.");
          error.statusCode = response.statusCode;
          reject(error);
          return;
        }
        resolve(parsed);
      });
    });

    request.setTimeout(timeoutMs, () => request.destroy(new Error("The local model request timed out.")));
    request.on("error", (error) => {
      if (error.code === "ECONNREFUSED") {
        const connectionError = new Error("Ollama is not running. Start Ollama and try again.");
        connectionError.statusCode = 503;
        reject(connectionError);
        return;
      }
      reject(error);
    });
    request.write(body);
    request.end();
  });
}
