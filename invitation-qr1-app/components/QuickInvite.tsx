import React, { useState } from 'react';
import { Group, Member, Message } from '../types';
import { membersAPI } from '../lib/api';
import { PlusCircleIcon } from './Icons';
import { useTheme } from '../contexts/ThemeContext';

interface QuickInviteProps {
  groups: Group[];
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  messagesTemplate: Message | null;
}

const QuickInvite: React.FC<QuickInviteProps> = ({ groups, members, setMembers, messagesTemplate }) => {
  const { theme } = useTheme();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [newGuest, setNewGuest] = useState({ name: '', phone: '+966' });
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const groupMembers = members.filter(m => m.groupId === selectedGroupId);

  const handleAddGuest = async () => {
    if (!selectedGroupId || !newGuest.name.trim() || !newGuest.phone.trim() || newGuest.phone.trim() === '+966') {
      alert('الرجاء اختيار المجموعة وإدخال الاسم ورقم الهاتف');
      return;
    }

    setIsAdding(true);
    try {
      const newMember: Member = {
        id: crypto.randomUUID(),
        name: newGuest.name.trim(),
        phone: newGuest.phone.trim(),
        scanLimit: selectedGroup?.defaultScanLimit || 1,
        scanCount: 0,
        groupId: selectedGroupId,
        rsvpStatus: 'pending'
      };

      const createdMember = await membersAPI.create(newMember);
      setMembers(prev => [...prev, createdMember]);
      setNewGuest({ name: '', phone: '+966' });
    } catch (error) {
      alert('حدث خطأ أثناء إضافة الضيف');
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSendRSVP = (member: Member) => {
    if (!messagesTemplate?.rsvpMessage) {
      alert('لم يتم تعيين رسالة RSVP');
      return;
    }

    const groupName = groups.find(g => g.id === member.groupId)?.name || 'الفعالية';
    let message = messagesTemplate.rsvpMessage
      .replace('{memberName}', member.name)
      .replace('{eventName}', groupName);

    const whatsappUrl = `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBulkSendRSVP = () => {
    if (!selectedGroupId || groupMembers.length === 0) {
      alert('لا يوجد ضيوف في هذه المجموعة');
      return;
    }

    if (!messagesTemplate?.rsvpMessage) {
      alert('لم يتم تعيين رسالة RSVP');
      return;
    }

    const groupName = selectedGroup?.name || 'الفعالية';
    let sentCount = 0;

    groupMembers.forEach((member, index) => {
      setTimeout(() => {
        let message = messagesTemplate.rsvpMessage!
          .replace('{memberName}', member.name)
          .replace('{eventName}', groupName);

        const whatsappUrl = `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        sentCount++;
      }, index * 1500);
    });

    alert(`سيتم إرسال ${groupMembers.length} دعوة RSVP عبر واتساب`);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedGroupId) {
      alert('الرجاء اختيار مجموعة أولاً');
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      const successfulImports: Member[] = [];
      const errors: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(p => p.trim());
        
        if (parts.length < 2) {
          errors.push(`السطر ${i + 1}: تنسيق غير صحيح (يجب أن يكون: الاسم، رقم الهاتف)`);
          continue;
        }

        const [name, phone] = parts;

        if (!name || !phone) {
          errors.push(`السطر ${i + 1}: الاسم أو رقم الهاتف فارغ`);
          continue;
        }

        let cleanPhone = phone.trim();
        if (!cleanPhone.startsWith('+')) {
          cleanPhone = '+966' + cleanPhone.replace(/^0+/, '');
        }

        try {
          const newMember: Member = {
            id: crypto.randomUUID(),
            name: name.trim(),
            phone: cleanPhone,
            scanLimit: selectedGroup?.defaultScanLimit || 1,
            scanCount: 0,
            groupId: selectedGroupId,
            rsvpStatus: 'pending'
          };

          const createdMember = await membersAPI.create(newMember);
          successfulImports.push(createdMember);
        } catch (error) {
          errors.push(`السطر ${i + 1}: فشل في إضافة ${name} - ${error}`);
        }
      }

      if (successfulImports.length > 0) {
        setMembers(prev => [...prev, ...successfulImports]);
      }

      setImportResult({
        success: successfulImports.length,
        failed: errors.length,
        errors: errors.slice(0, 10)
      });

    } catch (error) {
      alert('حدث خطأ أثناء قراءة الملف');
      console.error(error);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-600 text-white">مؤكد ✓</span>;
      case 'declined':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-600 text-white">معتذر ✗</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-600 text-white">قيد الانتظار ⏳</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">دعوة سريعة</h1>

      <div className={`rounded-2xl p-6 mb-6 border ${theme === 'dark' ? 'glass border-slate-700/50' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-teal-300' : 'text-teal-700'}`}>اختر المجموعة</h2>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className={`w-full p-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-white'
              : 'bg-gray-50 border-gray-300 text-gray-800'
          }`}
        >
          <option value="">-- اختر مجموعة --</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name} ({members.filter(m => m.groupId === group.id).length} ضيف)
            </option>
          ))}
        </select>
      </div>

      {selectedGroupId && (
        <>
          <div className={`rounded-2xl p-6 mb-6 border ${theme === 'dark' ? 'glass border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-teal-300' : 'text-teal-700'}`}>إضافة ضيف جديد</h2>
              <div className="flex gap-2">
                <label className="cursor-pointer gradient-purple hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{isImporting ? 'جاري الاستيراد...' : 'استيراد CSV'}</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleImportCSV}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            {importResult && (
              <div className={`mb-4 p-4 rounded-xl border ${
                importResult.success > 0 
                  ? theme === 'dark' ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-300'
                  : theme === 'dark' ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'
              }`}>
                <p className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  ✅ تم استيراد {importResult.success} ضيف بنجاح
                  {importResult.failed > 0 && ` | ❌ فشل ${importResult.failed} ضيف`}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>الأخطاء:</p>
                    <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-red-200' : 'text-red-600'}`}>
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                      {importResult.failed > 10 && (
                        <li className="text-red-400 font-semibold">... و {importResult.failed - 10} أخطاء أخرى</li>
                      )}
                    </ul>
                  </div>
                )}
                <p className={`text-xs mt-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                  💡 تنسيق الملف: كل سطر يحتوي على: الاسم، رقم الهاتف
                  <br />
                  مثال: أحمد محمد، 0501234567
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>الاسم</label>
                <input
                  type="text"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  placeholder="أدخل اسم الضيف"
                  className={`w-full p-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGuest()}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>رقم الهاتف</label>
                <input
                  type="text"
                  value={newGuest.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.startsWith('+966') || value === '+' || value === '+9' || value === '+96') {
                      setNewGuest({ ...newGuest, phone: value });
                    } else if (!value.startsWith('+')) {
                      setNewGuest({ ...newGuest, phone: '+966' + value });
                    }
                  }}
                  placeholder="+966xxxxxxxxx"
                  className={`w-full p-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGuest()}
                />
              </div>
            </div>
            <button
              onClick={handleAddGuest}
              disabled={isAdding || !newGuest.name.trim() || !newGuest.phone.trim() || newGuest.phone.trim() === '+966'}
              className="w-full md:w-auto flex items-center justify-center gap-2 gradient-teal hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>{isAdding ? 'جاري الإضافة...' : 'إضافة ضيف'}</span>
            </button>
          </div>

          <div className={`rounded-2xl p-6 border ${theme === 'dark' ? 'glass border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-teal-300' : 'text-teal-700'}`}>
                قائمة الضيوف ({groupMembers.length})
              </h2>
              {groupMembers.length > 0 && (
                <button
                  onClick={handleBulkSendRSVP}
                  className="w-full md:w-auto gradient-purple hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  إرسال دعوة لجميع الضيوف 📨
                </button>
              )}
            </div>

            {groupMembers.length === 0 ? (
              <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                <p>لا يوجد ضيوف في هذه المجموعة بعد</p>
                <p className="text-sm mt-2">أضف ضيوفك باستخدام النموذج أعلاه</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupMembers.map(member => (
                  <div
                    key={member.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all duration-300 hover:scale-[1.02] ${
                      theme === 'dark'
                        ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800/80'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{member.name}</h3>
                        {getStatusBadge(member.rsvpStatus || 'pending')}
                      </div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>📱 {member.phone}</p>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                        عدد الدخول: {member.scanCount}/{member.scanLimit}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendRSVP(member)}
                      className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm"
                    >
                      إرسال دعوة RSVP 💬
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!selectedGroupId && (
        <div className={`rounded-2xl p-12 border text-center ${
          theme === 'dark'
            ? 'glass border-slate-700/50'
            : 'bg-white border-gray-200'
        }`}>
          <div className="text-6xl mb-4">📋</div>
          <h3 className={`text-xl mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>ابدأ بإضافة الضيوف</h3>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>اختر مجموعة أولاً لإضافة الضيوف وإرسال الدعوات</p>
        </div>
      )}
    </div>
  );
};

export default QuickInvite;
