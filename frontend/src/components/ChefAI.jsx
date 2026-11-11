import { useEffect, useRef, useState } from "react";
import * as api from "../api.js";
import RecipeModal from "./RecipeModal.jsx";

const IDEAS = ["I have chicken and rice", "Quick vegetarian dinner", "Something sweet with chocolate", "Spicy seafood dish"];

// Chef AI tab: ask a question, get an answer built from recipes stored in PostgreSQL (RAG)
export default function ChefAI() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Tell me what ingredients you have or what you feel like eating, and I will suggest recipes." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(text) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await api.askAssistant(question);
      if (res.indexed === false) {
        setMessages((m) => [...m, { role: "bot", text: "My recipe knowledge base is empty. Ask an admin to open the Admin tab and click 'Index recipes'." }]);
      } else {
        setMessages((m) => [...m, { role: "bot", text: res.answer, sources: res.sources, mode: res.mode }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="chat">
      <div className="chat-log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <p>{m.text}</p>
            {m.sources?.length > 0 && (
              <div className="sources">
                {m.sources.map((s) => (
                  <button key={s.id} className="source" onClick={() => setOpenId(s.id)}>
                    <img src={s.image} alt="" width="36" height="36" />
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            {m.mode && <small className="mode">{m.mode === "ai" ? "AI answer from retrieved recipes" : "Basic answer (no AI key set)"}</small>}
          </div>
        ))}
        {busy && <div className="bubble bot"><p>Thinking…</p></div>}
        <div ref={endRef} />
      </div>

      <div className="ideas">
        {IDEAS.map((idea) => (
          <button key={idea} className="chip" onClick={() => ask(idea)} disabled={busy}>{idea}</button>
        ))}
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Chef AI, e.g. what can I cook with eggs and cheese?"
          maxLength={300}
          aria-label="Ask Chef AI"
        />
        <button disabled={busy || !input.trim()}>Ask</button>
      </form>

      {openId && <RecipeModal id={openId} onClose={() => setOpenId(null)} />}
    </section>
  );
}
