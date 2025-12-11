
import React, { useState, useEffect, useRef } from 'react';
import { BrowserSpeechService } from './services/geminiLive';
import AudioVisualizer from './components/AudioVisualizer';
import Modal from './components/Modal';
import { Note } from './types';

// Luxury Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.66 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
    <path d="M6 6h12v12H6z"/>
  </svg>
);

const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-14 h-14 text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
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

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [noteName, setNoteName] = useState('');
  
  // Saved notes
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);

  const speechServiceRef = useRef<BrowserSpeechService | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('snowy_notes');
    if (stored) {
      setSavedNotes(JSON.parse(stored));
    }
  }, []);

  const handleStart = async () => {
    setError(null);
    try {
        if (!speechServiceRef.current) {
          speechServiceRef.current = new BrowserSpeechService();
        }
        
        speechServiceRef.current.connect({
          onConnect: () => setIsConnected(true),
          onDisconnect: () => setIsConnected(false),
          onError: (err) => {
            setError(err);
            setIsConnected(false);
          },
          onTranscription: (newText) => {
            if (!newText) return;
            
            setText((prev) => {
                const trimmedNew = newText.trim();
                const trimmedPrev = prev.trim();
                
                if (!trimmedPrev) return trimmedNew;
                
                // Add space only if previous doesn't end with whitespace
                return trimmedPrev + ' ' + trimmedNew;
            });
            
            // Auto scroll
            setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
                }
            }, 10);
          },
        });
    } catch (e: any) {
        setError(e.message || "خطای ناشناخته در شروع سرویس");
        setIsConnected(false);
    }
  };

  const handleStop = async () => {
    if (speechServiceRef.current) {
      await speechServiceRef.current.disconnect();
      setIsConnected(false);
    }
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

  const loadNote = (note: Note) => {
    setText(note.content);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-4 pb-6 px-4 relative overflow-hidden font-[Vazirmatn]">
      
      {/* Background with Gradient and Snow */}
      <div className="fixed inset-0 z-0 bg-[#050b14]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      
      <SnowfallBackground />

      <div className="z-10 w-full max-w-5xl flex flex-col h-[94vh] gap-4">
        
        {/* Header - Centered & Luxury */}
        <header className="relative flex flex-col items-center justify-center py-2 w-full">
            <div className="flex flex-col items-center gap-3 z-10">
                <div className="p-4 bg-white/5 rounded-full border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-xl animate-float">
                    <LogoIcon />
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] text-center">
                  دستیار تایپ <span className="text-transparent bg-clip-text bg-gradient-to-t from-cyan-400 to-white">برفی</span>
                </h1>
                <p className="text-cyan-200/50 text-xs font-light">نسخه مرورگر (بدون سرور)</p>
            </div>

            {/* Live Badge */}
            <div className="absolute left-0 top-0 hidden md:flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-500 border-white/10 bg-white/5">
                 <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-cyan-400 animate-ping' : 'bg-gray-500'}`} />
                 <span className={`text-sm font-bold ${isConnected ? 'text-cyan-300' : 'text-gray-400'}`}>
                    {isConnected ? 'در حال شنیدن...' : 'آماده به کار'}
                 </span>
            </div>
             {/* Mobile Badge */}
             <div className="flex md:hidden mt-2 items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                 <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-ping' : 'bg-gray-500'}`} />
                 <span className={`text-xs font-bold ${isConnected ? 'text-cyan-300' : 'text-gray-400'}`}>
                    {isConnected ? 'فعال' : 'آماده'}
                 </span>
            </div>
        </header>

        {/* Top Section: Visualizer & Mic Button */}
        <div className="flex flex-col items-center justify-center gap-4 py-2">
             {/* Mic Button - Central Piece */}
            <div className="relative group">
              {isConnected && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
              )}
              <button 
                  onClick={isConnected ? handleStop : handleStart}
                  className={`relative flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full border-2 transition-all duration-500 z-10 shadow-2xl transform active:scale-90
                    ${isConnected 
                      ? 'bg-gradient-to-br from-fuchsia-600 to-rose-600 border-white/20 hover:scale-105' 
                      : 'bg-gradient-to-br from-cyan-600 to-blue-700 border-white/20 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]'
                    }`}
              >
                  {isConnected ? <StopIcon /> : <MicIcon />}
              </button>
            </div>

             {/* Visualizer */}
             <div className="w-full max-w-2xl px-4 h-16 md:h-20">
                <AudioVisualizer isActive={isConnected} />
             </div>
        </div>

        {/* Error Notification */}
        {error && (
            <div 
              onClick={() => setError(null)}
              className="mx-auto px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-center text-sm font-bold backdrop-blur-md animate-fade-in cursor-pointer hover:bg-red-500/20 transition-colors"
            >
                {error}
                <div className="text-[10px] mt-1 opacity-70">(برای بستن کلیک کنید)</div>
            </div>
        )}

        {/* Output Area - Glassmorphism */}
        <div className="flex-1 relative group rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 hover:border-cyan-500/30">
            <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-2xl" />
            
            {/* Decorative Gradients inside textarea container */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-[80px]" />

            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="روی میکروفون بزنید و صحبت کنید..."
                className="relative w-full h-full bg-transparent p-6 md:p-10 pb-24 text-xl md:text-3xl leading-relaxed resize-none focus:outline-none text-right placeholder-white/20 text-gray-100 font-bold tracking-wide scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-transparent"
                dir="rtl"
            />
            
            {/* Quick Actions Bar - Floating at bottom */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                 <div className="pointer-events-auto flex gap-2 md:gap-3">
                     <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 group/btn shadow-lg"
                     >
                        <CopyIcon />
                        <span className="font-bold text-gray-300 group-hover/btn:text-white text-sm">کپی</span>
                     </button>
                     <button 
                        onClick={() => setShowSaveModal(true)}
                        className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 group/btn shadow-lg shadow-cyan-900/20"
                     >
                        <SaveIcon />
                        <span className="font-bold text-cyan-300 group-hover/btn:text-cyan-100 text-sm">ذخیره</span>
                     </button>
                 </div>

                 <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 group/btn shadow-lg shadow-rose-900/20"
                 >
                    <TrashIcon />
                    <span className="font-bold text-rose-300 group-hover/btn:text-rose-100 text-sm">پاک کن</span>
                 </button>
            </div>
        </div>

        {/* Saved Notes (Mini) */}
        {savedNotes.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2">
                {savedNotes.map(note => (
                    <button 
                        key={note.id}
                        onClick={() => loadNote(note)}
                        className="flex-shrink-0 bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 rounded-2xl p-3 md:p-4 w-40 md:w-48 text-right transition-all group backdrop-blur-sm"
                    >
                        <div className="font-bold text-cyan-100 truncate mb-1 group-hover:text-cyan-300 text-sm md:text-lg">{note.title}</div>
                        <div className="text-xs text-gray-500 truncate font-light">{note.date}</div>
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={showClearConfirm} 
        title="حذف متن"
        onClose={() => setShowClearConfirm(false)}
        actions={
            <div className="flex gap-4 w-full">
                <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5"
                >
                    خیر
                </button>
                <button 
                    onClick={handleClear}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-rose-900/40 transition-all hover:scale-105"
                >
                    ذخیره
                </button>
            </div>
        }
      >
        آیا از پاک کردن تمام متن اطمینان دارید؟
      </Modal>

      {/* Save Modal */}
      <Modal
        isOpen={showSaveModal}
        title="ذخیره یادداشت"
        onClose={() => setShowSaveModal(false)}
        actions={
            <div className="flex gap-4 w-full mt-4">
                 <button 
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5"
                >
                    انصراف
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/40 transition-all hover:scale-105"
                >
                    ذخیره
                </button>
            </div>
        }
      >
        <div className="w-full">
            <p className="mb-4 text-cyan-100/70">نامی برای این یادداشت انتخاب کنید:</p>
            <input 
                type="text" 
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                placeholder="عنوان یادداشت..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-right placeholder-white/20 transition-all"
                dir="rtl"
                autoFocus
            />
        </div>
      </Modal>

    </div>
  );
};

export default App;
