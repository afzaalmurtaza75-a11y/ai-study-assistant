require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const port = process.env.PORT || 5000;

// ==========================
// GEMINI AI
// ==========================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==========================
// MIDDLEWARE
// ==========================

app.use(cors());
app.use(express.json());

// ==========================
// HOME
// ==========================

app.get("/", (req, res) => {
  res.send("AI Study Assistant Server is Live 🚀");
});

// ==========================
// TEST AI
// ==========================

app.get("/test-ai", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Say hello in one short sentence.",
    });

    res.json({
      success: true,
      answer: response.text,
    });
  } catch (error) {
    console.log("TEST AI ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================
// ASK AI
// ==========================

app.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      error: "Please enter a question.",
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: question,
    });

    res.json({
      answer: response.text,
    });
  } catch (error) {
    console.log("Gemini ASK error:", error);

    res.status(500).json({
      error: "Could not get AI answer.",
      details: error.message,
    });
  }
});

// ==========================
// GENERATE NOTES
// ==========================

app.post("/notes", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({
      error: "Please enter a topic.",
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `
Create simple study notes about:

${topic}

Use:
- Easy English
- Short points
- Important concepts
- Simple examples
`,
    });

    res.json({
      notes: response.text,
    });
  } catch (error) {
    console.log("Gemini NOTES error:", error);

    res.status(500).json({
      error: "Could not generate notes.",
      details: error.message,
    });
  }
});

// ==========================
// GENERATE QUIZ
// ==========================

app.post("/quiz", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({
      error: "Please enter a topic.",
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `
Create a quiz about:

${topic}

Create exactly 5 multiple-choice questions.

Return ONLY valid JSON.
Do not use markdown.
Do not use code blocks.

Use this exact format:

[
  {
    "question": "What is JavaScript?",
    "options": [
      "A programming language",
      "A database",
      "An operating system",
      "A web browser"
    ],
    "answer": "A programming language"
  }
]

Rules:
- Exactly 5 questions
- Exactly 4 options per question
- One correct answer
- Use simple English
- Suitable for beginners
`,
    });

    const quizText = response.text;

    const cleanQuiz = quizText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const quiz = JSON.parse(cleanQuiz);

    res.json({
      quiz: quiz,
    });
  } catch (error) {
    console.log("Gemini QUIZ error:", error);

    res.status(500).json({
      error: "Could not generate quiz.",
      details: error.message,
    });
  }
});

// ==========================
// SEARCH WEB + GEMINI
// ==========================

app.post("/search", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({
      error: "Please enter a question.",
    });
  }

  try {
    // ==========================
    // SEARCH WITH TAVILY
    // ==========================

    const searchResponse = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: query,
          search_depth: "basic",
          max_results: 5,
        }),
      }
    );

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.log("Tavily error:", searchData);

      return res.status(500).json({
        error: "Web search failed.",
      });
    }

    // ==========================
    // PREPARE SEARCH RESULTS
    // ==========================

    const webResults = searchData.results
      .map(
        (item, index) => `
Result ${index + 1}

Title:
${item.title}

Website:
${item.url}

Information:
${item.content}
`
      )
      .join("\n");

    // ==========================
    // SEND RESULTS TO GEMINI
    // ==========================

    const prompt = `
You are an AI Study Assistant.

The user asked:

"${query}"

I searched the internet and found these results:

${webResults}

Answer the user's question using these web results.

Rules:
- Use very simple English.
- Give the important answer first.
- Explain clearly.
- Use short paragraphs.
- Do not make up information.
- If the results do not contain enough information, say so.
`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    // ==========================
    // CREATE SOURCES
    // ==========================

    const sources = searchData.results.map((item) => ({
      title: item.title,
      url: item.url,
    }));

    // ==========================
    // SEND RESPONSE
    // ==========================

    res.json({
      answer: aiResponse.text,
      sources: sources,
    });
  } catch (error) {
    console.log("Search + Gemini error:", error);

    res.status(500).json({
      error: "Could not generate AI answer.",
      details: error.message,
    });
  }
});

// ==========================
// 404 ROUTE
// ==========================

app.use((req, res) => {
  res.status(404).json({
    error: "404 - Route not found.",
  });
});

// ==========================
// START SERVER
// ==========================

// ==========================
// START SERVER
// ==========================

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});