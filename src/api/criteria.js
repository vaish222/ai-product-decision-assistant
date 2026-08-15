export async function generateEvaluationCriteria(context, { signal } = {}) {
  const response = await fetch("/api/criteria/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
    signal,
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The criteria service returned an unreadable response.");
  }
  if (!response.ok) throw new Error(payload.error || "Unable to generate evaluation criteria.");
  if (!Array.isArray(payload.criteria)) throw new Error("The criteria service returned an invalid response.");
  return payload;
}
