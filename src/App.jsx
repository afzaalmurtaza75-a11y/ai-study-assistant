import { useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  const [quiz, setQuiz] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // ==========================
  // ASK AI
  // ==========================

  async function askAI() {
    if (question.trim() === "") {
      setAnswer("Please enter a question first.");
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setSources([]);
      setQuiz([]);

      const response = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnswer(data.error || "AI request failed.");
        return;
      }

      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
      setAnswer("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================
  // GENERATE NOTES
  // ==========================

  async function generateNotes() {
    if (question.trim() === "") {
      setAnswer("Please enter a topic first.");
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setSources([]);
      setQuiz([]);

      const response = await fetch("http://localhost:5000/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnswer(data.error || "Could not generate notes.");
        return;
      }

      setAnswer(data.notes);
    } catch (error) {
      console.error(error);
      setAnswer("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================
  // GENERATE QUIZ
  // ==========================

  async function generateQuiz() {
    if (question.trim() === "") {
      setAnswer("Please enter a topic first.");
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setSources([]);
      setQuiz([]);
      setCurrentQuestion(0);
      setScore(0);
      setQuizFinished(false);

      const response = await fetch("http://localhost:5000/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnswer(data.error || "Could not generate quiz.");
        return;
      }

      setQuiz(data.quiz);
    } catch (error) {
      console.error(error);
      setAnswer("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================
  // ANSWER QUIZ
  // ==========================

  function answerQuiz(selectedAnswer) {
    const currentQuizQuestion = quiz[currentQuestion];

    if (selectedAnswer === currentQuizQuestion.answer) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < quiz.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizFinished(true);
    }
  }

  // ==========================
  // SEARCH WEB
  // ==========================

  async function searchWeb() {
    if (question.trim() === "") {
      setAnswer("Please enter a question first.");
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setSources([]);
      setQuiz([]);

      const response = await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnswer(data.error || "Search failed.");
        return;
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (error) {
      console.error(error);
      setAnswer("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">

      <h1>AI Study Assistant 📚</h1>

      <p>Learn smarter with AI.</p>

      <input
        type="text"
        placeholder="Ask a question or enter a topic..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="buttons">

        <button onClick={askAI}>
          Ask AI 🤖
        </button>

        <button onClick={generateNotes}>
          Generate Notes 📝
        </button>

        <button onClick={generateQuiz}>
          Generate Quiz 🧠
        </button>

        <button onClick={searchWeb}>
          Search Web 🌍
        </button>

      </div>

      {loading && (
        <h3>Working... ⏳</h3>
      )}

      {/* QUIZ */}

      {!loading && quiz.length > 0 && !quizFinished && (
        <div className="quiz">

          <h2>
            🧠 Question {currentQuestion + 1} / {quiz.length}
          </h2>

          <h3>
            {quiz[currentQuestion].question}
          </h3>

          {quiz[currentQuestion].options.map((option, index) => (

            <button
              key={index}
              onClick={() => answerQuiz(option)}
            >
              {option}
            </button>

          ))}

        </div>
      )}

      {/* QUIZ RESULT */}

      {!loading && quizFinished && (
        <div className="quiz-result">

          <h2>🎉 Quiz Finished!</h2>

          <h3>
            Your Score: {score} / {quiz.length}
          </h3>

          <button
            onClick={() => {
              setQuiz([]);
              setQuizFinished(false);
              setScore(0);
              setCurrentQuestion(0);
            }}
          >
            Try Again 🔄
          </button>

        </div>
      )}

      {/* NORMAL ANSWER */}

      {!loading && answer && quiz.length === 0 && (
        <div className="result">

          <h2>📖 Result</h2>

          <pre>{answer}</pre>

          {sources.length > 0 && (
            <div>

              <h2>🔗 Sources</h2>

              {sources.map((source, index) => (

                <p key={index}>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {index + 1}. {source.title}
                  </a>

                </p>

              ))}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default App;