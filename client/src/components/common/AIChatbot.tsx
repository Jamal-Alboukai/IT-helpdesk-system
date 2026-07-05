import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, ChatMessage } from '../../services/aiService';

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your IT support assistant. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const reply = await sendChatMessage(
        userMessage.content,
        messages
      );
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: reply }
      ]);
    } catch {
      setError('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([{
      role: 'assistant',
      content: 'Hi! I\'m your IT support assistant. How can I help you today?'
    }]);
    setError('');
  }

  return (
    <>
      {/* ─── Chat panel ───────────────────────────────── */}
      {open && (
        <div className="fixed inset-x-3 bottom-20 z-50
          max-w-[calc(100vw-1.5rem)] sm:right-6 sm:left-auto
          w-full sm:w-80 md:w-96 h-[70vh] max-h-[500px]
          bg-gray-800 border border-gray-700 rounded-2xl
          shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between
            px-4 py-3 bg-gray-750 border-b border-gray-700
            bg-gray-900/80">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-white text-sm font-medium">
                  IT Assistant
                </p>
                <p className="text-gray-400 text-xs">
                  Powered by Gemini AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-300
                  text-xs transition"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white
                  transition text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 text-sm
                  leading-relaxed break-words
                  ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-2xl rounded-bl-sm
                  px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full
                      animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full
                      animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full
                      animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about IT support..."
                rows={1}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600
                  rounded-xl text-white placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  resize-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-full sm:w-auto px-3 py-2 bg-blue-600 hover:bg-blue-700
                  disabled:opacity-50 text-white rounded-xl
                  transition shrink-0"
              >
                ➤
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* ─── Floating toggle button ────────────────────── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50
          w-12 h-12 bg-blue-600 hover:bg-blue-700
          rounded-full shadow-lg transition
          flex items-center justify-center text-xl
          hover:scale-110 active:scale-95"
        title="AI Assistant"
      >
        {open ? '×' : '🤖'}
      </button>
    </>
  );
}