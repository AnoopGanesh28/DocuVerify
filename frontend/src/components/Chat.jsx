import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, AlertCircle } from 'lucide-react';
import { query } from '../api';

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your DocuVerify assistant. Ask me any question about your uploaded documents.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await query(userMsg);
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: res.data.answer,
          sources: res.data.sources 
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error while processing your query.',
          error: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
        <h3 className="text-lg font-medium text-white flex items-center">
          <Bot className="mr-2 text-blue-400" size={24} />
          Document Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600 ml-3' : 'bg-slate-600 mr-3'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              <div className={`rounded-2xl px-5 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : msg.error 
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-none'
                    : 'bg-slate-700 text-slate-100 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {msg.content}
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-600/50">
                    <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Sources:</p>
                    <ul className="space-y-1">
                      {msg.sources.map((s, i) => (
                        <li key={i} className="text-xs text-blue-400 flex items-center bg-blue-500/10 w-fit px-2 py-1 rounded">
                          <AlertCircle size={12} className="mr-1 shrink-0" />
                          <span className="truncate max-w-[200px]">{s.filename}</span>
                          <span className="ml-1 opacity-60">(Chunk {s.chunk_index})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-600 mr-3">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-slate-700 rounded-2xl rounded-tl-none px-5 py-3 flex items-center shadow-sm">
                <Loader2 className="animate-spin text-blue-400 mr-2" size={16} />
                <span className="text-sm text-slate-300">Searching documents...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1 bg-slate-700 text-white rounded-full px-5 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800 disabled:opacity-50 transition-all shadow-sm"
          >
            <Send size={20} className={input.trim() && !loading ? 'translate-x-0.5' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
}
