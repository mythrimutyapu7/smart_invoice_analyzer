import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import { sendChatMessage } from "../api";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI financial assistant. Ask me anything about your invoices (e.g. 'What did I spend last month?')." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userMsg);
      setMessages(prev => [...prev, { role: "assistant", content: response.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error processing your request." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div className="chat-widget card">
          <div className="chat-header">
            <div>
              <h3>AI Assistant</h3>
              <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>Ask about your invoices</p>
            </div>
            <button className="header-icon-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-wrapper ${msg.role}`}>
                <div className={`chat-bubble ${msg.role}`}>
                   {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-wrapper assistant">
                <div className="chat-bubble assistant pending">
                   <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                   <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="input-field"
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading} className="chat-send-btn">
               <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
