import { useEffect, useRef, useState } from "react";
import { askAI } from "../api/ai";

const SUGGESTIONS = [
  "Sınavlarım ne zaman?",
  "Notlarım nasıl?",
  "Devamsızlığım nasıl?",
  "Derslerim neler?",
];

function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Merhaba! Ben Smart Campus asistanınım. Derslerin, notların, sınavların ve devamsızlığın hakkında soru sorabilirsin.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const answer = await askAI(trimmed);
      setMessages((prev) => [...prev, { role: "bot", content: answer }]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Yapay zeka servisine bağlanırken bir hata oluştu. Lütfen tekrar deneyin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Sohbet paneli */}
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[460px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Başlık */}
          <div className="bg-gradient-to-r from-violet-700 via-violet-600 to-fuchsia-600 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-base">
                🤖
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">Kampüs Asistanı</h3>
                <p className="text-violet-100 text-[11px] leading-tight">Dersler · Notlar · Sınavlar</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition"
              aria-label="Kapat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mesajlar */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] whitespace-pre-line leading-relaxed ${
                    m.role === "user"
                      ? "bg-violet-600 text-white rounded-br-sm"
                      : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] bg-red-50 text-red-600 border border-red-200">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Hızlı öneriler */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="text-[11px] font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-full px-2.5 py-1 transition disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Giriş kutusu */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-2.5 flex items-center gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Bir soru yaz..."
              disabled={loading}
              className="flex-1 text-[13px] bg-slate-100 rounded-full px-3.5 py-2 outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:hover:bg-violet-600 text-white flex items-center justify-center transition"
              aria-label="Gönder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 -mr-0.5">
                <path d="M3.4 20.6 21 12 3.4 3.4 3 10l12 2-12 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Yüzen robot butonu */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 shadow-xl flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition"
        aria-label="Kampüs Asistanını Aç"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <span>🤖</span>
        )}
      </button>
    </div>
  );
}

export default ChatBot;