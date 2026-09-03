import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseLength, setResponseLength] = useState("balanced");

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    const newHeight = Math.min(textarea.scrollHeight, 180);

    textarea.style.height = `${Math.max(newHeight, 58)}px`;
  }, [input]);

  const sendMessage = async (customMessage = null) => {
    const messageText = customMessage ?? input.trim();

    if (!messageText || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: messageText,
          response_length: responseLength,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Server error");
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data.response ||
          "Sorry, I could not generate a response.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "⚠️ **Connection error**\n\nI could not connect to the FastAPI backend. Make sure your backend is running on `http://127.0.0.1:8000`.",
        },
      ]);
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    sendMessage();
  };

  const handleKeyDown = (event) => {
    // Enter = send
    // Shift + Enter = new line
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendMessage();
    }
  };

  const newChat = () => {
    if (loading) return;

    setMessages([]);
    setInput("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const useSuggestion = (text) => {
    setInput(text);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  return (
    <div className="app">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">AI</div>

          <span>AI Assistant</span>
        </div>

        <button
          className="new-chat-btn"
          onClick={newChat}
        >
          <span className="plus-icon">+</span>

          <span>New Chat</span>
        </button>

        <div className="sidebar-section">

          <div className="sidebar-heading">
            Chat
          </div>

          <div className="sidebar-chat active">
            <span className="chat-icon">💬</span>

            <span>AI Assistant</span>
          </div>

        </div>

        <div className="sidebar-bottom">

          <div className="sidebar-item">
            <span>⚙️</span>
            <span>Settings</span>
          </div>

        </div>
      </aside>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="main">

        {/* HEADER */}

        <header className="header">

          <div className="header-left">

            <h1>AI Assistant</h1>

            <p>Powered by Chirag</p>

          </div>

          <div className="online-status">

            <span className="online-dot"></span>

            <span>Online</span>

          </div>

        </header>


        {/* CHAT */}

        <section className="chat-area">

          {messages.length === 0 ? (

            <div className="welcome">

              <div className="welcome-icon">
                ✨
              </div>

              <h2>
                How can I help you?
              </h2>

              <p>
                Ask me anything about programming,
                mathematics, technology, or general topics.
              </p>


              <div className="suggestions">

                <button
                  onClick={() =>
                    useSuggestion("What is Python?")
                  }
                >
                  What is Python?
                </button>

                <button
                  onClick={() =>
                    useSuggestion("Explain FastAPI")
                  }
                >
                  Explain FastAPI
                </button>

                <button
                  onClick={() =>
                    useSuggestion("Write a Java program")
                  }
                >
                  Write a Java program
                </button>

              </div>

            </div>

          ) : (

            <div className="messages">

              {messages.map((message) => (

                <div
                  key={message.id}
                  className={`message-row ${message.role}`}
                >

                  <div className="avatar">

                    {message.role === "user"
                      ? "YOU"
                      : "AI"}

                  </div>


                  <div className="message-wrapper">

                    <div className="message-name">

                      {message.role === "user"
                        ? "You"
                        : "AI Assistant"}

                    </div>


                    {message.role === "user" ? (

                      <div className="user-message">
                        {message.content}
                      </div>

                    ) : (

                      <div className="markdown-content">

                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            pre({ children }) {
                              return (
                                <CodeBlock>
                                  {children}
                                </CodeBlock>
                              );
                            },

                            code({
                              children,
                              className,
                              ...props
                            }) {
                              return (
                                <code
                                  className={
                                    className || "inline-code"
                                  }
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>

                      </div>

                    )}

                  </div>

                </div>

              ))}


              {/* TYPING */}

              {loading && (

                <div className="message-row assistant">

                  <div className="avatar">
                    AI
                  </div>

                  <div className="message-wrapper">

                    <div className="message-name">
                      AI Assistant
                    </div>

                    <div className="typing">

                      <span></span>
                      <span></span>
                      <span></span>

                    </div>

                  </div>

                </div>

              )}

              <div ref={messagesEndRef}></div>

            </div>

          )}

        </section>


        {/* =================================================
            COMPOSER
        ================================================== */}

        <div className="composer">

          {/* RESPONSE LENGTH */}

          <div className="length-wrapper">

            <span className="length-title">
              Response Length
            </span>


            <label
              className={`length-option ${
                responseLength === "short"
                  ? "selected"
                  : ""
              }`}
            >

              <input
                type="radio"
                name="responseLength"
                value="short"
                checked={responseLength === "short"}
                onChange={(e) =>
                  setResponseLength(e.target.value)
                }
              />

              <span>Short</span>

            </label>


            <label
              className={`length-option ${
                responseLength === "balanced"
                  ? "selected"
                  : ""
              }`}
            >

              <input
                type="radio"
                name="responseLength"
                value="balanced"
                checked={responseLength === "balanced"}
                onChange={(e) =>
                  setResponseLength(e.target.value)
                }
              />

              <span>Balanced</span>

            </label>


            <label
              className={`length-option ${
                responseLength === "detailed"
                  ? "selected"
                  : ""
              }`}
            >

              <input
                type="radio"
                name="responseLength"
                value="detailed"
                checked={responseLength === "detailed"}
                onChange={(e) =>
                  setResponseLength(e.target.value)
                }
              />

              <span>Detailed</span>

            </label>

          </div>


          {/* INPUT */}

          <form
            className="input-wrapper"
            onSubmit={handleSubmit}
          >

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Message AI Assistant..."
              disabled={loading}
              rows="1"
            />


            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              ➤
            </button>

          </form>


          {/* FOOTER */}

          <div className="footer">
            AI can make mistakes. Check important information.
          </div>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   CODE BLOCK COMPONENT
========================================================= */

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);

  const code =
    children?.props?.children
      ? String(children.props.children).replace(/\n$/, "")
      : "";

  const className =
    children?.props?.className || "";

  const language = className
    .replace("language-", "")
    .trim() || "code";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="code-container">

      <div className="code-header">

        <span>
          {language}
        </span>

        <button
          type="button"
          onClick={copyCode}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>

      </div>

      <pre>
        {children}
      </pre>

    </div>
  );
}

export default App;