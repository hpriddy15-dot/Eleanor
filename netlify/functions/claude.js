// Eleanor's secure AI function.
// The browser calls this; this calls Anthropic using the secret key,
// which is stored in Netlify's environment (never in the webpage).

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "Server is missing ANTHROPIC_API_KEY" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Invalid request body" };
  }

  const { messages, system, max_tokens } = payload;
  if (!messages) {
    return { statusCode: 400, body: "Missing messages" };
  }

  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: max_tokens || 1200,
    messages,
  };
  if (system) body.system = system;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (!r.ok) {
      return {
        statusCode: r.status,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: "AI request failed: " + err.message };
  }
};
