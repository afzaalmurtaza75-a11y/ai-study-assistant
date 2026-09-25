require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const port = process.env.PORT || 5000;

// Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());


// ==========================
// HOME
// ==========================

app.get("/", (req, res) => {
  res.send("AI Study Assistant Server is Live 🚀");
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
      model: "gemini-2.5-flash",
      contents: question,
    });

    res.json({
      answer: response.text,
    });

  } catch (error) {
    console.log("Gemini error:", error);

    res.status(500).json({
      error: "Could not get AI answer.",
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
      model: "gemini-2.5-flash",
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
    console.log("Gemini error:", error);

    res.status(500).json({
      error: "Could not generate notes.",
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
      model: "gemini-2.5-flash",

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

    // Remove possible markdown code blocks
    const cleanQuiz = quizText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const quiz = JSON.parse(cleanQuiz);

    res.json({
      quiz: quiz,
    });

  } catch (error) {
    console.log("Gemini quiz error:", error);

    res.status(500).json({
      error: "Could not generate quiz.",
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

    // Search internet with Tavily
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


    // Prepare web results
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


    // Send results to Gemini
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
      model: "gemini-2.5-flash",
      contents: prompt,
    });


    // Create sources
    const sources = searchData.results.map((item) => ({
      title: item.title,
      url: item.url,
    }));


    res.json({
      answer: aiResponse.text,
      sources: sources,
    });

  } catch (error) {

    console.log("Search + Gemini error:", error);

    res.status(500).json({
      error: "Could not generate AI answer.",
    });
  }
});


// ==========================
// START SERVER
// ==========================

app.listen(port, () => {
  console.log(
    `Server is running on http://localhost:${port}`
  );
});
