
import React, { useState, useEffect, useRef } from 'react';
import { BrowserSpeechService, IoTypeSpeechService } from './services/geminiLive';
import AudioVisualizer from './components/AudioVisualizer';
import Modal from './components/Modal';
import { Note, RecognitionMode } from './types';

// Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
    <path d="M6 6h12v12H6z"/>
  </svg>
);

const ProcessingIcon = () => (
    <svg className="animate-spin w-12 h-12 md:w-16 md:h-16 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.59 3.32c1.1.13 1.91 1.08 1.91 2.18V21L12 17.25 4.5 21V5.51c0-1.11.81-2.06 1.91-2.19a48.51 48.51 0 0111.18 0z" />
  </svg>
);

const SnowfallBackground = () => {
  const snowflakes = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 3 + 4}s`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.3,
    size: Math.random() * 4 + 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute bg-white rounded-full animate-snow shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
          }}
        />
      ))}
    </div>
  );
};

const DEFAULT_API_KEY = "NPnVqVgbTsicW7pusam2STcqwao3E3v5";

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modes: 'browser' | 'server'
  const [mode, setMode] = useState<RecognitionMode>('browser');
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);

  // Modals state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [noteName, setNoteName] = useState('');
  
  // Saved notes
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);

  const browserServiceRef = useRef<BrowserSpeechService | null>(null);
  const ioTypeServiceRef = useRef<IoTypeSpeechService | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const storedNotes = localStorage.getItem('snowy_notes');
    if (storedNotes) {
      setSavedNotes(JSON.parse(storedNotes));
    }
    const storedKey = localStorage.getItem('iotype_api_key');
    if (storedKey) {
        setApiKey(storedKey);
    }
  }, []);

  const handleStart = async () => {
    setError(null);
    setIsProcessing(false);

    try {
        if (mode === 'browser') {
            if (!browserServiceRef.current) {
                browserServiceRef.current = new BrowserSpeechService();
            }
            
            browserServiceRef.current.connect({
                onConnect: () => setIsConnected(true),
                onDisconnect: () => setIsConnected(false),
                onError: (err) => {
                    setError(err);
                    setIsConnected(false);
                },
                onTranscription: (newText) => {
                    appendText(newText);
                },
            });
        } else {
            // Server Mode (IoType)
            if (!ioTypeServiceRef.current) {
                ioTypeServiceRef.current = new IoTypeSpeechService();
            }
            ioTypeServiceRef.current.setApiKey(apiKey);

            await ioTypeServiceRef.current.start({
                onConnect: () => setIsConnected(true),
                onError: (err) => {
                    setError(err);
                    setIsConnected(false);
                }
            });
        }
    } catch (e: any) {
        setError(e.message || "خطا در شروع سرویس");
        setIsConnected(false);
    }
  };

  const handleStop = async () => {
    if (mode === 'browser') {
        if (browserServiceRef.current) {
            await browserServiceRef.current.disconnect();
            setIsConnected(false);
        }
    } else {
        // Server Mode
        if (ioTypeServiceRef.current) {
            setIsConnected(false);
            setIsProcessing(true);
            try {
                const resultText = await ioTypeServiceRef.current.stop();
                appendText(resultText);
            } catch (e: any) {
                setError(e.toString());
            } finally {
                setIsProcessing(false);
            }
        }
    }
  };

  const appendText = (newText: string) => {
      if (!newText) return;
      setText((prev) => {
          const trimmedPrev = prev.trim();
          const trimmedNew = newText.trim();
          if (!trimmedPrev) return trimmedNew;
          return trimmedPrev + ' ' + trimmedNew;
      });
      // Auto scroll
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, 10);
  };

  const handleClear = () => {
    setText('');
    setShowClearConfirm(false);
  };

  const handleSave = () => {
    if (!noteName.trim()) return;
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: noteName,
      content: text,
      date: new Date().toLocaleDateString('fa-IR'),
    };
    
    const updated = [newNote, ...savedNotes];
    setSavedNotes(updated);
    localStorage.setItem('snowy_notes', JSON.stringify(updated));
    
    setShowSaveModal(false);
    setNoteName('');
  };

  const saveSettings = () => {
      localStorage.setItem('iotype_api_key', apiKey);
      setShowSettingsModal(false);
  };

  const loadNote = (note: Note) => {
    setText(note.content);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-2 pb-6 px-4 relative overflow-hidden font-[Vazirmatn]">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-[#050b14]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      
      <SnowfallBackground />

      <div className="z-10 w-full max-w-5xl flex flex-col h-[96vh] gap-3">
        
        {/* Header */}
        <header className="relative flex justify-between items-start w-full px-2">
            {/* Settings Button (Left) */}
            <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-cyan-300 hover:bg-white/10 transition-all backdrop-blur-md"
            >
                <SettingsIcon />
            </button>

            {/* Logo Center */}
            <div className="flex flex-col items-center gap-1 absolute left-1/2 transform -translate-x-1/2 top-0">
                <div className="p-2 bg-white/5 rounded-full border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-xl">
                    <LogoIcon />
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white text-center">
                   تایپ <span className="text-cyan-400">برفی</span>
                </h1>
            </div>

            {/* Mode Toggle (Right) */}
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 backdrop-blur-md">
                 <button 
                    onClick={() => setMode('browser')}
                    className={`px-3 py-1 text-xs md:text-sm rounded-lg transition-all font-bold ${mode === 'browser' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                 >
                    موبایل
                 </button>
                 <button 
                    onClick={() => setMode('server')}
                    className={`px-3 py-1 text-xs md:text-sm rounded-lg transition-all font-bold ${mode === 'server' ? 'bg-fuchsia-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                 >
                    سرور
                 </button>
            </div>
        </header>

        {/* Status Indicator */}
        <div className="flex justify-center mt-6">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ${isConnected ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/5 bg-white/5'}`}>
                 <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-ping' : isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
                 <span className={`text-xs font-bold ${isConnected ? 'text-cyan-300' : isProcessing ? 'text-yellow-300' : 'text-gray-400'}`}>
                    {isConnected ? (mode === 'browser' ? 'در حال تبدیل همزمان...' : 'در حال ضبط...') : isProcessing ? 'در حال ارسال به سرور...' : 'آماده'}
                 </span>
            </div>
        </div>

        {/* Main Mic Section */}
        <div className="flex flex-col items-center justify-center gap-4 py-1">
             <div className="relative group">
              {isConnected && (
                <div className={`absolute inset-0 bg-gradient-to-r rounded-full blur-xl opacity-60 animate-pulse ${mode === 'browser' ? 'from-cyan-500 to-blue-500' : 'from-fuchsia-500 to-rose-500'}`}></div>
              )}
              
              <button 
                  onClick={isConnected ? handleStop : handleStart}
                  disabled={isProcessing}
                  className={`relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-2 transition-all duration-300 z-10 shadow-2xl transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isConnected 
                      ? 'bg-gradient-to-br from-rose-600 to-red-600 border-white/20 scale-105' 
                      : isProcessing
                        ? 'bg-gray-700 border-gray-600'
                        : `bg-gradient-to-br ${mode === 'browser' ? 'from-cyan-600 to-blue-700' : 'from-fuchsia-600 to-purple-700'} border-white/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`
                    }`}
              >
                  {isProcessing ? <ProcessingIcon /> : isConnected ? <StopIcon /> : <MicIcon />}
              </button>
            </div>

             <div className="w-full max-w-xl px-4 h-12 md:h-16 opacity-80">
                <AudioVisualizer isActive={isConnected} />
             </div>
        </div>

        {/* Error */}
        {error && (
            <div onClick={() => setError(null)} className="mx-auto px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs font-bold backdrop-blur-md animate-fade-in cursor-pointer">
                {error}
            </div>
        )}

        {/* Text Area */}
        <div className="flex-1 relative group rounded-3xl overflow-hidden border border-white/10 shadow-xl bg-[#0f172a]/60 backdrop-blur-xl">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={mode === 'browser' ? "صحبت کنید، متن تایپ می‌شود..." : "ضبط کنید، پس از توقف متن ظاهر می‌شود..."}
                className="relative w-full h-full bg-transparent p-6 pb-20 text-lg md:text-2xl leading-relaxed resize-none focus:outline-none text-right placeholder-white/10 text-gray-100 font-medium scrollbar-thin scrollbar-thumb-cyan-900/50"
                dir="rtl"
            />
            
            {/* Action Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-[#050b14]/80 p-2 rounded-2xl backdrop-blur-lg border border-white/5">
                 <div className="flex gap-2">
                     <button onClick={copyToClipboard} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                        <CopyIcon />
                     </button>
                     <button onClick={() => setShowSaveModal(true)} className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <SaveIcon />
                     </button>
                 </div>
                 <button onClick={() => setShowClearConfirm(true)} className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors">
                    <TrashIcon />
                 </button>
            </div>
        </div>

        {/* Saved Notes Scroller */}
        {savedNotes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1 h-12 min-h-[3rem]">
                {savedNotes.map(note => (
                    <button 
                        key={note.id}
                        onClick={() => loadNote(note)}
                        className="flex-shrink-0 bg-white/5 border border-white/5 hover:border-cyan-500/30 rounded-xl px-3 flex flex-col justify-center w-32 text-right transition-all"
                    >
                        <div className="font-bold text-cyan-100 truncate text-xs">{note.title}</div>
                        <div className="text-[10px] text-gray-500 truncate">{note.date}</div>
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showClearConfirm} title="پاک کردن متن" onClose={() => setShowClearConfirm(false)}
        actions={
            <div className="flex gap-3 w-full">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm">خیر</button>
                <button onClick={handleClear} className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-sm">بله، پاک کن</button>
            </div>
        }
      >
        آیا مطمئن هستید؟
      </Modal>

      {/* Save Modal */}
      <Modal isOpen={showSaveModal} title="ذخیره متن" onClose={() => setShowSaveModal(false)}
        actions={
            <div className="flex gap-3 w-full mt-4">
                 <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm">انصراف</button>
                <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-cyan-600 text-white text-sm">ذخیره</button>
            </div>
        }
      >
            <input 
                type="text" value={noteName} onChange={(e) => setNoteName(e.target.value)}
                placeholder="عنوان یادداشت..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-right outline-none focus:border-cyan-500"
                dir="rtl" autoFocus
            />
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSettingsModal} title="تنظیمات سرور" onClose={() => setShowSettingsModal(false)}
        actions={
            <div className="flex gap-3 w-full mt-4">
                 <button onClick={() => setShowSettingsModal(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm">بستن</button>
                <button onClick={saveSettings} className="flex-1 py-2 rounded-lg bg-fuchsia-600 text-white text-sm">ثبت تغییرات</button>
            </div>
        }
      >
        <div className="text-right">
            <p className="text-sm text-gray-400 mb-2">کلید API سرویس IoType:</p>
            <input 
                type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-left text-xs font-mono outline-none focus:border-fuchsia-500"
            />
            <p className="text-[10px] text-gray-500 mt-2">
                این کلید فقط در مرورگر شما ذخیره می‌شود.
            </p>
        </div>
      </Modal>

    </div>
  );
};

export default App;
