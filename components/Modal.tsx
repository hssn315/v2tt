import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, children, onClose, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-cyan-500/20 rounded-3xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] transform transition-all scale-100 ring-1 ring-white/10">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-6 text-center">
          {title}
        </h3>
        <div className="text-gray-300 text-lg mb-8 text-center leading-relaxed font-light">
          {children}
        </div>
        <div className="flex justify-center gap-4">
          {actions}
        </div>
      </div>
    </div>
  );
};

export default Modal;