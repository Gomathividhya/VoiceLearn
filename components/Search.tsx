
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiClient, encodeBase64, generateSpeech, decodeAudioData, translateText } from '../services/gemini';
import Waveform from './Waveform';
import { SAMPLE_LIBRARY } from '../constants';

interface SearchProps {
  onBack: () => void;
}

type SearchLanguage = {
  code: string;
  name: string;
  native: string;
  count: string;
  bg: string;
  instruction: string;
};

const LANGUAGES: SearchLanguage[] = [
  { 
    code: 'hi', 
    name: 'Hindi', 
    native: 'हिन्दी', 
    count: '1.2k+ Lessons',
    bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    instruction: 'accurately transcribe the user\'s query in Hindi using Devanagari script.' 
  },
  { 
    code: 'ta', 
    name: 'Tamil', 
    native: 'தமிழ்', 
    count: '850 Lessons',
    bg: 'url(https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80)',
    instruction: 'accurately transcribe the user\'s query in Tamil using Tamil script. Ensure proper character recognition.' 
  },
  { 
    code: 'en', 
    name: 'English', 
    native: 'English', 
    count: '3.5k+ Lessons',
    bg: 'url(https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=400&q=80)',
    instruction: 'accurately transcribe the user\'s query in English.' 
  },
  { 
    code: 'mr', 
    name: 'Marathi', 
    native: 'Marathi', 
    count: '600 Lessons',
    bg: 'url(https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&w=400&q=80)',
    instruction: 'accurately transcribe the user\'s query in Marathi using Devanagari script.' 
  },
];

const TRENDING_TOPICS = [
  { title: 'Daily Conversations', sub: '2.4k people learning now', icon: 'local_fire_department', color: 'bg-orange-100 text-orange-600' },
  { title: 'Business English', sub: 'Professional vocabulary', icon: 'business_center', color: 'bg-blue-100 text-blue-600' },
  { title: 'Pronunciation Mastery', sub: 'Speak like a native', icon: 'record_voice_over', color: 'bg-purple-100 text-purple-600' },
  { title: 'Common Phrases', sub: 'Essential idioms', icon: 'forum', color: 'bg-green-100 text-green-600' },
];

const RECENT_SEARCHES = ['Travel', 'Interview tips', 'Verbs'];

const Search: React.FC<SearchProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SearchLanguage>(LANGUAGES[2]); // Default to English
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      stopVoiceSearch();
      if (sourceRef.current) sourceRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startVoiceSearch = async () => {
    if (isListening) {
      stopVoiceSearch();
      return;
    }

    if (sourceRef.current) {
      sourceRef.current.stop();
      setPlayingId(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);
      
      const ai = getGeminiClient();
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;

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
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) {
                setSearchQuery(prev => prev + text);
              }
            }
            
            if (message.serverContent?.turnComplete) {
              stopVoiceSearch();
            }
          },
          onclose: () => setIsListening(false),
          onerror: (e) => {
            console.error("Voice Search Error:", e);
            stopVoiceSearch();
          }
        },
        config: {
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {},
          systemInstruction: `You are a highly accurate speech-to-text engine. Your ONLY objective is to ${selectedLang.instruction}. Listen intently and transcribe every word exactly as spoken. Do not provide help or chat.`
        }
      });

    } catch (err) {
      console.error("Microphone access failed", err);
      setIsListening(false);
    }
  };

  const stopVoiceSearch = () => {
    setIsListening(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 800);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-background-dark overflow-hidden font-display">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Discover</h1>
          <button onClick={startVoiceSearch} className="text-primary p-1">
            <span className="material-symbols-outlined text-2xl">mic</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
            placeholder="Search lessons or tap to speak"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(isListening) stopVoiceSearch(); }}
          />
          <button 
            onClick={startVoiceSearch}
            className={`absolute inset-y-0 right-0 pr-4 flex items-center ${isListening ? 'text-primary' : 'text-primary/60 hover:text-primary'}`}
          >
            <span className={`material-symbols-outlined bg-primary/5 p-1.5 rounded-full ${isListening ? 'animate-pulse' : ''}`}>mic</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-10 pb-32 hide-scrollbar">
        {isListening ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <span className="material-symbols-outlined text-4xl text-primary fill-1">mic</span>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold">Listening for {selectedLang.name}...</h3>
              <p className="text-sm text-slate-400">Speak now in {selectedLang.native}</p>
            </div>
            <div className="w-full max-w-[180px]">
              <Waveform isPlaying={true} />
            </div>
          </div>
        ) : (
          <>
            {/* Search by Language */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Search by Language</h2>
                <button className="text-primary text-sm font-bold">See All</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang);
                      setSearchQuery('');
                      startVoiceSearch();
                    }}
                    className="relative aspect-video rounded-3xl overflow-hidden group shadow-sm hover:shadow-md transition-all active:scale-95"
                    style={{ 
                      backgroundImage: lang.bg.startsWith('url') ? lang.bg : 'none',
                      backgroundColor: !lang.bg.startsWith('url') ? 'transparent' : '#eee',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!lang.bg.startsWith('url') && <div className={`absolute inset-0 ${lang.bg}`}></div>}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
                    <div className="absolute bottom-4 left-4 text-left">
                      <h3 className="text-lg font-bold text-white leading-none mb-1">{lang.name}</h3>
                      <p className="text-[10px] font-medium text-white/80">{lang.count}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Trending Topics */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trending Topics</h2>
              <div className="space-y-3">
                {TRENDING_TOPICS.map((topic, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all cursor-pointer">
                    <div className={`size-12 rounded-2xl flex items-center justify-center ${topic.color}`}>
                      <span className="material-symbols-outlined text-2xl">{topic.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">{topic.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">{topic.sub}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Recently Searched */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recently Searched</h2>
              <div className="flex flex-wrap gap-3">
                {RECENT_SEARCHES.map((tag, i) => (
                  <button key={i} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-lg">history</span>
                    {tag}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Search;
