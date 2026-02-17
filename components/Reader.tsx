
import React, { useState, useEffect, useRef } from 'react';
import { LibraryItem, AppView } from '../types';
import Waveform from './Waveform';
import { generateSpeech, decodeAudioData, translateText } from '../services/gemini';

interface ReaderProps {
  item: LibraryItem;
  onBack: () => void;
  onNavigateSolver: () => void;
}

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'EN' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்' }
];

const Reader: React.FC<ReaderProps> = ({ item, onBack, onNavigateSolver }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [translatedSentence, setTranslatedSentence] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Reset translation when sentence changes
    setTranslatedSentence(null);
  }, [currentSentenceIndex]);

  useEffect(() => {
    return () => {
      if (sourceRef.current) sourceRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handlePlayPause = async () => {
    if (isPlaying) {
      if (sourceRef.current) sourceRef.current.stop();
      setIsPlaying(false);
      return;
    }

    setIsLoadingAudio(true);
    let sentenceToRead = item.content[currentSentenceIndex];
    
    try {
      // Translate if needed
      if (selectedLang.id !== 'en') {
        const translation = await translateText(sentenceToRead, selectedLang.name);
        setTranslatedSentence(translation);
        sentenceToRead = translation;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Use a slightly different voice prompt or voice for different languages
      const voicePrompt = selectedLang.id === 'en' ? sentenceToRead : `Read this clearly in ${selectedLang.name}: ${sentenceToRead}`;
      const audioBytes = await generateSpeech(voicePrompt);
      
      if (audioBytes) {
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = playbackSpeed;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
          setIsPlaying(false);
          // Auto-advance logic
          if (currentSentenceIndex < item.content.length - 1) {
            // setCurrentSentenceIndex(prev => prev + 1); // Disabled auto-advance for better UX in translation mode
          }
        };

        sourceRef.current = source;
        source.start();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Audio playback error:", err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const skipForward = () => {
    if (currentSentenceIndex < item.content.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    }
  };

  const skipBackward = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(prev => prev - 1);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-white dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate max-w-[150px]">{item.title}</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Chapter 2</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">translate</span>
            <span>{selectedLang.native}</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setSelectedLang(lang);
                    setShowLangMenu(false);
                    if (isPlaying) {
                      sourceRef.current?.stop();
                      setIsPlaying(false);
                    }
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between ${selectedLang.id === lang.id ? 'text-primary' : ''}`}
                >
                  {lang.name}
                  {selectedLang.id === lang.id && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <div className="space-y-4">
          {item.content.map((sentence, idx) => (
            <div 
              key={idx}
              className={`transition-all duration-300 p-3 rounded-xl cursor-pointer ${
                idx === currentSentenceIndex 
                  ? 'bg-primary/5 border-l-4 border-primary shadow-sm text-slate-900 dark:text-white scale-[1.02]' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
              onClick={() => setCurrentSentenceIndex(idx)}
            >
              <p className={`text-lg leading-relaxed ${idx === currentSentenceIndex ? 'font-medium' : ''}`}>
                {sentence}
              </p>
              
              {/* Show translation for active sentence if it exists and language is not English */}
              {idx === currentSentenceIndex && selectedLang.id !== 'en' && translatedSentence && (
                <div className="mt-3 pt-3 border-t border-primary/10 animate-in fade-in slide-in-from-top-1 duration-300">
                  <p className="text-primary font-semibold text-lg leading-relaxed">
                    {translatedSentence}
                  </p>
                </div>
              )}
            </div>
          ))}
          
          <div className="w-full aspect-video rounded-2xl overflow-hidden my-6 border border-slate-100 dark:border-slate-800 shadow-md">
            <img className="w-full h-full object-cover" src={`https://picsum.photos/seed/${item.id}/600/400`} alt="Visualization" />
          </div>
        </div>
      </main>

      {/* Waveform Visualization */}
      <div className="px-6 py-2 h-14 bg-white dark:bg-background-dark">
        <Waveform isPlaying={isPlaying} />
      </div>

      {/* Footer Controls */}
      <footer className="bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 p-6 pb-8 space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-400">
            <span>{currentSentenceIndex + 1} / {item.content.length}</span>
            <span>{selectedLang.name} Mode</span>
          </div>
          <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all shadow-[0_0_8px_rgba(80,72,229,0.5)]" 
              style={{ width: `${((currentSentenceIndex + 1) / item.content.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setPlaybackSpeed(s => s >= 2.0 ? 0.5 : s + 0.25)}
            className="flex items-center justify-center size-10 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold"
          >
            {playbackSpeed.toFixed(1)}x
          </button>

          <div className="flex items-center gap-6">
            <button onClick={skipBackward} className="material-symbols-outlined text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-3xl">replay_10</button>
            <button 
              disabled={isLoadingAudio}
              onClick={handlePlayPause}
              className={`flex items-center justify-center size-16 bg-primary text-white rounded-full shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all ${isLoadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoadingAudio ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <span className="material-symbols-outlined text-4xl fill-1">{isPlaying ? 'pause' : 'play_arrow'}</span>
              )}
            </button>
            <button onClick={skipForward} className="material-symbols-outlined text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-3xl">forward_10</button>
          </div>

          <button 
            onClick={onNavigateSolver}
            className="flex items-center justify-center size-12 bg-primary/10 dark:bg-primary/20 text-primary rounded-full hover:bg-primary/20 transition-all group relative"
          >
            <span className="material-symbols-outlined text-2xl group-active:scale-110">mic</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={skipBackward} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">skip_previous</span>
            Previous
          </button>
          <div className="flex gap-1">
            <div className="size-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="size-1.5 rounded-full bg-primary"></div>
            <div className="size-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="size-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          </div>
          <button onClick={skipForward} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-primary transition-colors">
            Next
            <span className="material-symbols-outlined text-sm">skip_next</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Reader;
