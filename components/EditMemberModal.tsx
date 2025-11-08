import React, { useState, useEffect } from 'react';
import { Member } from '../types';

interface EditMemberModalProps {
  member: Member | null;
  onClose: () => void;
  onSave: (member: Member) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose, onSave }) => {
  const [formData, setFormData] = useState<Member | null>(null);
  const [formErrors, setFormErrors] = useState({ name: '', phone: '', scanLimit: '' });

  useEffect(() => {
    setFormData(member);
  }, [member]);

  if (!formData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? {
      ...prev,
      [name]: name === 'scanLimit' ? (parseInt(value, 10) || 1) : value,
    } : null);
    if (formErrors[name as keyof typeof formErrors]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    if (!formData) return false;
    const errors = { name: '', phone: '', scanLimit: '' };
    let isValid = true;
    
    if (!formData.name.trim()) {
      errors.name = 'اسم العضو مطلوب.';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      errors.phone = 'رقم الواتساب مطلوب.';
      isValid = false;
    } else if (!/^\+?[0-9\s]+$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'يجب أن يحتوي الرقم على أرقام وعلامة + فقط.';
      isValid = false;
    }

    if (!formData.scanLimit || formData.scanLimit < 1) {
      errors.scanLimit = 'الحد الأدنى لمرات الدخول هو 1.';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        phone: formData.phone.replace(/\s/g, '')
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-60 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 p-8 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-400">تعديل بيانات {member?.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl transition-colors leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">اسم العضو</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full bg-slate-800 p-2 rounded-md border ${formErrors.name ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500`}
            />
            {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">رقم الواتساب</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full bg-slate-800 p-2 rounded-md border ${formErrors.phone ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500`}
            />
            {formErrors.phone && <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">الحد الأقصى للمسح</label>
            <input
              type="number"
              name="scanLimit"
              min="1"
              value={formData.scanLimit}
              onChange={handleInputChange}
              className={`w-full bg-slate-800 p-2 rounded-md border ${formErrors.scanLimit ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500`}
            />
             {formErrors.scanLimit && <p className="text-red-400 text-xs mt-1">{formErrors.scanLimit}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">حالة تأكيد الحضور (RSVP)</label>
            <select
              name="rsvpStatus"
              value={formData.rsvpStatus || 'pending'}
              onChange={handleInputChange}
              className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            >
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مُؤكد الحضور</option>
              <option value="declined">مُعتذر</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
              إلغاء
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-transform duration-200 hover:-translate-y-0.5">
              حفظ التغييرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;