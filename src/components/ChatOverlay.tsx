import React, { useState } from 'react';
import { ChatMessage } from '../types/game';
import { sound } from '../utils/sound';
import { MessageSquare, Send, X, Smile } from 'lucide-react';

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

const QUICK_GREETINGS = [
  '👋 Semangat teman-teman!',
  '🏃 Ayo kumpul di Museum Pancasila!',
  '📐 Siapa mau tantangan Matematika?',
  '🔬 Aku lagi di Lab IPAS!',
  '⭐ Keren banget!',
  '🙌 Gotong royong kumpulkan poin!',
];

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  onSendMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sound.playClick();
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  const handleQuickSend = (text: string) => {
    sound.playClick();
    onSendMessage(text);
  };

  return (
    <div className="absolute bottom-6 left-6 z-20 select-none">
      {/* Collapsed Chat Toggle Button (when closed) */}
      {!isOpen ? (
        <button
          onClick={() => {
            sound.playClick();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white shadow-xl backdrop-blur-md cursor-pointer transition active:scale-95"
        >
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">Obrolan Kelas</span>
          {messages.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      ) : (
        /* Expanded Chat Box */
        <div className="w-80 md:w-96 bg-slate-900/95 border-2 border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Obrolan Kelas (Dimoderasi)</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Greetings Carousel */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex gap-1.5 overflow-x-auto text-[11px]">
            {QUICK_GREETINGS.map((msg, i) => (
              <button
                key={i}
                onClick={() => handleQuickSend(msg)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition cursor-pointer"
              >
                {msg}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="p-3 h-48 overflow-y-auto space-y-2 text-xs flex flex-col-reverse">
            {[...messages].reverse().map((m) => (
              <div key={m.id} className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${m.isTeacher ? 'text-amber-400' : 'text-blue-400'}`}>
                    {m.senderName}
                  </span>
                  {m.isTeacher && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                      Guru
                    </span>
                  )}
                  <span className="text-[9px] text-slate-500 font-mono">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-slate-200 mt-0.5 break-words bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-2 border-t border-slate-800 bg-slate-900 flex gap-1.5">
            <input
              type="text"
              maxLength={80}
              placeholder="Kirim pesan ramah..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
