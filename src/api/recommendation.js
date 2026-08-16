export async function generateRecommendation(context, { signal } = {}) {
  const response = await fetch("/api/recommendation/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
    signal,
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The recommendation service returned an unreadable response.");
  }
  if (!response.ok) throw new Error(payload.error || "Unable to generate the recommendation.");
  if (!Array.isArray(payload.scores)) throw new Error("The recommendation service returned an invalid response.");
  return payload;
}
