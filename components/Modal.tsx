
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
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl max-w-sm w-full p-5 shadow-2xl transform transition-all scale-100">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          {title}
        </h3>
        <div className="text-gray-300 text-base mb-6 text-center leading-relaxed">
          {children}
        </div>
        <div className="flex justify-center">
          {actions}
        </div>
      </div>
    </div>
  );
};

export default Modal;
