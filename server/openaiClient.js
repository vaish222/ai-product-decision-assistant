import https from "https";

export function requestOpenAIResponses(payload, { apiKey, timeoutMs = 45000 } = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request({
      hostname: "api.openai.com",
      path: "/v1/responses",
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
          reject(new Error("The model provider returned an unreadable response."));
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(parsed.error?.message || "The model provider rejected the request.");
          error.statusCode = response.statusCode;
          reject(error);
          return;
        }
        resolve(parsed);
      });
    });

    request.setTimeout(timeoutMs, () => request.destroy(new Error("The model request timed out.")));
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}
