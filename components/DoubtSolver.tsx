
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToTutor, getGeminiClient, encodeBase64, decodeAudioData } from '../services/gemini';
import { SUGGESTED_QUESTIONS } from '../constants';

interface DoubtSolverProps {
  onBack: () => void;
}

type SolverLanguage = {
  id: string;
  name: string;
  native: string;
  instruction: string;
};

const LANGUAGES: SolverLanguage[] = [
  { id: 'en', name: 'English', native: 'EN', instruction: 'You are a helpful AI tutor. Respond naturally in English.' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', instruction: 'You are a helpful AI tutor. Respond naturally and fluently in Hindi. Speak clearly using Devanagari context.' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்', instruction: 'You are a helpful AI tutor. Respond naturally and fluently in Tamil. Use clear Tamil pronunciation.' },
];

const DoubtSolver: React.FC<DoubtSolverProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm your AI tutor. I can help you solve doubts, explain complex concepts, or quiz you on any subject. What's on your mind today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SolverLanguage>(LANGUAGES[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // For text chat, we pass the language context to the tutor
      const promptPrefix = selectedLang.id === 'en' ? '' : `Please respond in ${selectedLang.name}: `;
      const response = await sendMessageToTutor([], promptPrefix + text);
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response || 'Sorry, I encountered an error.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLiveSession = async () => {
    if (isLiveActive) {
      setIsLiveActive(false);
      if (sessionRef.current) {
        sessionRef.current.close();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsLiveActive(true);
      
      const ai = getGeminiClient();
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      let nextStartTime = 0;
      const sources = new Set<AudioBufferSourceNode>();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmData = {
                data: encodeBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };

              sessionPromise.then(session => {
                sessionRef.current = session;
                session.sendRealtimeInput({ media: pcmData });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const bytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
              const buffer = await decodeAudioData(bytes, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
              source.start(nextStartTime);
              nextStartTime += buffer.duration;
              sources.add(source);
              source.onended = () => sources.delete(source);
            }
          },
          onclose: () => setIsLiveActive(false),
          onerror: (e) => {
            console.error("Live API Error:", e);
            setIsLiveActive(false);
          }
        },
        config: {
          responseModalities: ['AUDIO'],
          systemInstruction: selectedLang.instruction
        }
      });

    } catch (err) {
      console.error("Microphone access failed", err);
      setIsLiveActive(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-2xl mx-auto bg-white dark:bg-[#1a1926] shadow-2xl">
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-[#1a1926]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">AI Tutor</h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveActive ? 'animate-ping bg-red-400' : 'bg-green-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveActive ? 'bg-red-500' : 'bg-green-500'}`}></span>
              </span>
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                {isLiveActive ? `${selectedLang.name} Live` : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  setSelectedLang(lang);
                  if (isLiveActive) {
                    setIsLiveActive(false);
                    if (sessionRef.current) sessionRef.current.close();
                  }
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  selectedLang.id === lang.id 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {lang.native}
              </button>
            ))}
          </div>
          <button onClick={() => setMessages([messages[0]])} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8 hide-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="h-9 w-9 shrink-0 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
            )}
            <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div className={`rounded-2xl px-5 py-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none shadow-primary/20' 
                  : 'bg-gray-100 dark:bg-gray-800 rounded-tl-none'
              }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
              <span className="text-[11px] text-gray-400 font-medium ml-1 uppercase">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {msg.role === 'user' && (
              <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                <img className="w-full h-full object-cover" src="https://picsum.photos/seed/user/100/100" alt="Profile" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        <div className="space-y-3 pt-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Suggested Follow-ups</p>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar snap-x">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button 
                key={i}
                onClick={() => handleSend(q)}
                className="snap-start shrink-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-all shadow-sm whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="p-4 bg-white dark:bg-[#1a1926] border-t border-gray-100 dark:border-gray-800">
        <div className="relative flex items-end gap-3 max-w-full">
          <div className="flex-1 relative group">
            <textarea 
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl py-4 pl-4 pr-12 text-[15px] focus:ring-2 focus:ring-primary/20 resize-none transition-all placeholder:text-gray-400" 
              placeholder={`Type in ${selectedLang.name}...`} 
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            ></textarea>
            <button className="absolute right-3 bottom-3 text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">attachment</span>
            </button>
          </div>
          <button 
            onClick={handleLiveSession}
            className={`group relative h-14 w-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
              isLiveActive ? 'bg-red-500 shadow-red-500/30' : 'bg-primary shadow-primary/30'
            }`}
          >
            {isLiveActive && <div className="absolute inset-0 rounded-full bg-red-400/40 animate-ping"></div>}
            <span className="material-symbols-outlined text-[28px] relative z-10">{isLiveActive ? 'stop' : 'mic'}</span>
          </button>
          <button 
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[24px]">send</span>
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-3 font-medium tracking-tight">
          AI Tutor speaks {selectedLang.name}. VoiceLearn can make mistakes.
        </p>
      </footer>
    </div>
  );
};

export default DoubtSolver;
