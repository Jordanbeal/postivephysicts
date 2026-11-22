
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ status: "Positive Physics AI is running" });
});

app.post("/solve", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server API key is missing." });
    }

    const question = String(req.body.question || "").trim();
    if (!question) {
      return res.status(400).json({ error: "No question provided." });
    }

    const prompt = `
You are a patient tutor who can help with all school subjects.
Solve the student's question accurately.
Show concise, understandable steps.
Pay attention to units, rounding, and answer format.

Return only JSON in this format:
{
  "answer": "final answer",
  "steps": ["step 1", "step 2"],
  "confidence": 0.95
}

Question:
${question}
`;

    const model = "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: result.error?.message || "AI request failed."
      });
    }

    const output = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) {
      return res.status(502).json({ error: "AI returned no answer." });
    }

    res.json(JSON.parse(output));
  } catch (error) {
    res.status(500).json({ error: error.message || "Server error." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
