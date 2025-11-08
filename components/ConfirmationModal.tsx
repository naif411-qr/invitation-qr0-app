import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-70 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 p-8 w-full max-w-md mx-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">{title}</h2>
        <p className="text-slate-300 mb-8">{message}</p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            إلغاء
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform duration-200 hover:-translate-y-0.5"
          >
            تأكيد الحذف
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;