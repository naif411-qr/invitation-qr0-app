import React, { useState, useRef } from 'react';
import { Member, Group } from '../types';
import { WhatsAppIcon, UsersIcon, DownloadIcon } from './Icons';
import { messagesAPI } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import html2pdf from 'html2pdf.js';

interface ReportingProps {
    members: Member[];
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
    groups: Group[];
    thankYouMessage: string;
    setThankYouMessage: React.Dispatch<React.SetStateAction<string>>;
    followUpMessage: string;
    setFollowUpMessage: React.Dispatch<React.SetStateAction<string>>;
    rsvpMessage: string;
    setRsvpMessage: React.Dispatch<React.SetStateAction<string>>;
    messagesId: string | null;
}

const Reporting: React.FC<ReportingProps> = ({ 
    members,
    setMembers,
    groups,
    thankYouMessage,
    setThankYouMessage,
    followUpMessage,
    setFollowUpMessage,
    rsvpMessage,
    setRsvpMessage,
    messagesId
}) => {
  const { theme } = useTheme();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const updateMessages = async (newThankYou?: string, newFollowUp?: string, newRsvp?: string) => {
    if (!messagesId) return;
    
    try {
      const updates: any = {};
      if (newThankYou !== undefined) updates.thankYouMessage = newThankYou;
      if (newFollowUp !== undefined) updates.followUpMessage = newFollowUp;
      if (newRsvp !== undefined) updates.rsvpMessage = newRsvp;
      
      await messagesAPI.update(messagesId, updates);
    } catch (error) {
      console.error('Failed to update messages:', error);
    }
  };
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [rsvpFilter, setRsvpFilter] = useState<'all' | 'confirmed' | 'declined' | 'pending'>('all');

  let filteredMembers = selectedGroupId === 'all'
    ? members
    : members.filter(m => m.groupId === selectedGroupId);

  // Apply RSVP filter
  if (rsvpFilter !== 'all') {
    if (rsvpFilter === 'pending') {
      filteredMembers = filteredMembers.filter(m => m.rsvpStatus === 'pending' || !m.rsvpStatus);
    } else {
      filteredMembers = filteredMembers.filter(m => m.rsvpStatus === rsvpFilter);
    }
  }

  const attendees = filteredMembers.filter(m => m.scanCount > 0);
  const absentees = filteredMembers.filter(m => m.scanCount === 0);

  const getEventName = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.name || 'الفعالية';
  };

  const sendBulkWhatsApp = (memberList: Member[], messageTemplate: string) => {
    if (memberList.length > 10) {
      if (!window.confirm(`أنت على وشك فتح ${memberList.length} محادثة واتساب. هل تريد المتابعة؟`)) {
        return;
      }
    }
    memberList.forEach(member => {
      const eventName = getEventName(member.groupId);
      const message = messageTemplate
        .replace(/{memberName}/g, member.name)
        .replace(/{groupName}/g, eventName) // Keep for backward compatibility
        .replace(/{eventName}/g, eventName); 

      const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    });
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Event', 'Status', 'ScanCount', 'ScanLimit'];
    const csvRows = [headers.join(',')];

    for (const member of filteredMembers) {
      const eventName = getEventName(member.groupId);
      const status = member.scanCount > 0 ? 'Attended' : 'Absent';
      const row = [
        `"${member.name}"`,
        `"${member.phone}"`,
        `"${eventName}"`,
        status,
        member.scanCount,
        member.scanLimit
      ];
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const eventNameForFile = selectedGroupId === 'all' 
        ? 'all_events' 
        : groups.find(g => g.id === selectedGroupId)?.name.replace(/\s+/g, '_') || 'event_report';
    a.download = `event_report_${eventNameForFile}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    const eventNameForFile = selectedGroupId === 'all' 
      ? 'كل_الفعاليات' 
      : groups.find(g => g.id === selectedGroupId)?.name.replace(/\s+/g, '_') || 'تقرير_الحضور';
    
    const rsvpFilterName = 
      rsvpFilter === 'confirmed' ? 'مؤكدون' :
      rsvpFilter === 'declined' ? 'معتذرون' :
      rsvpFilter === 'pending' ? 'قيد_الانتظار' : 'الكل';

    const options = {
      margin: 10,
      filename: `تقرير_${eventNameForFile}_${rsvpFilterName}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const,
        compress: true
      }
    };

    try {
      await html2pdf().set(options).from(reportRef.current).save();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">تقرير الحضور</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={exportToPDF}
            className={`flex items-center gap-2 font-bold py-2.5 px-5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg flex-1 sm:flex-initial ${
              theme === 'dark' 
                ? 'gradient-teal text-white' 
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
            disabled={members.length === 0}
          >
            <DownloadIcon className="w-5 h-5" />
            <span>تحميل PDF</span>
          </button>
          <button
            onClick={exportToCSV}
            className={`flex items-center gap-2 font-bold py-2.5 px-5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg flex-1 sm:flex-initial ${
              theme === 'dark' 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            disabled={members.length === 0}
          >
            <DownloadIcon className="w-5 h-5" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

       <div className={`mb-8 p-5 rounded-2xl border ${
         theme === 'dark' 
           ? 'glass border-teal-500/20' 
           : 'bg-white border-teal-200'
       }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="group-filter" className={`block text-lg font-bold mb-3 ${
                theme === 'dark' ? 'text-teal-300' : 'text-teal-700'
              }`}>
                  📋 تصفية حسب الفعالية
              </label>
              <select
                  id="group-filter"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className={`w-full p-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-lg font-medium ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white hover:border-teal-500/50'
                      : 'bg-gray-50 border-gray-300 text-gray-800 hover:border-teal-400'
                  }`}
              >
                  <option value="all">📊 كل الفعاليات</option>
                  {groups.map(group => (
                      <option key={group.id} value={group.id}>🎯 {group.name}</option>
                  ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="rsvp-filter" className={`block text-lg font-bold mb-3 ${
                theme === 'dark' ? 'text-teal-300' : 'text-teal-700'
              }`}>
                  ✅ تصفية حسب حالة الرد
              </label>
              <select
                  id="rsvp-filter"
                  value={rsvpFilter}
                  onChange={(e) => setRsvpFilter(e.target.value as 'all' | 'confirmed' | 'declined' | 'pending')}
                  className={`w-full p-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-lg font-medium ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white hover:border-teal-500/50'
                      : 'bg-gray-50 border-gray-300 text-gray-800 hover:border-teal-400'
                  }`}
              >
                  <option value="all">📊 الكل</option>
                  <option value="confirmed">✅ مؤكدون الحضور</option>
                  <option value="declined">❌ معتذرون</option>
                  <option value="pending">⏳ قيد الانتظار</option>
              </select>
            </div>
          </div>
          <p className={`text-sm mt-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
            استخدم الفلاتر لعرض تقرير مفصل حسب الفعالية وحالة تأكيد الحضور
          </p>
      </div>
      
      <div ref={reportRef}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-10">
        <div className={`p-6 rounded-2xl border shadow-xl transition-all duration-300 hover:-translate-y-1 ${
          theme === 'dark'
            ? 'glass border-slate-700/50'
            : 'bg-white border-gray-200'
        }`}>
          <p className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>إجمالي المدعوين</p>
          <p className={`text-5xl font-bold bg-gradient-to-br from-teal-600 to-cyan-600 bg-clip-text text-transparent`}>{filteredMembers.length}</p>
        </div>
        <div className={`p-6 rounded-2xl border shadow-xl transition-all duration-300 hover:-translate-y-1 ${
          theme === 'dark'
            ? 'glass border-green-500/20'
            : 'bg-white border-green-200'
        }`}>
          <p className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>الحاضرون</p>
          <p className={`text-5xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{attendees.length}</p>
        </div>
        <div className={`p-6 rounded-2xl border shadow-xl transition-all duration-300 hover:-translate-y-1 ${
          theme === 'dark'
            ? 'glass border-red-500/20'
            : 'bg-white border-red-200'
        }`}>
          <p className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>الغائبون</p>
          <p className={`text-5xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{absentees.length}</p>
        </div>
      </div>
      
      <div className={`p-6 rounded-2xl border mb-8 ${theme === 'dark' ? 'glass border-slate-700/50' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>تخصيص رسائل الواتساب</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>رسالة تأكيد الحضور (RSVP)</label>
            <textarea
              value={rsvpMessage}
              onChange={(e) => {
                setRsvpMessage(e.target.value);
                updateMessages(undefined, undefined, e.target.value);
              }}
              rows={4}
              className={`w-full p-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
              placeholder="اكتب رسالة تأكيد الحضور هنا..."
            />
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>استخدم {"{memberName}"} لاسم العضو و {"{eventName}"} لاسم الفعالية.</p>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>رسالة الشكر (للحاضرين)</label>
            <textarea
              value={thankYouMessage}
              onChange={(e) => {
                setThankYouMessage(e.target.value);
                updateMessages(e.target.value, undefined, undefined);
              }}
              rows={4}
              className={`w-full p-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
              placeholder="اكتب رسالة الشكر هنا..."
            />
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>استخدم {"{memberName}"} لاسم العضو و {"{eventName}"} لاسم الفعالية.</p>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>رسالة المتابعة (للغائبين)</label>
            <textarea
              value={followUpMessage}
              onChange={(e) => {
                setFollowUpMessage(e.target.value);
                updateMessages(undefined, e.target.value, undefined);
              }}
              rows={4}
              className={`w-full p-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
              placeholder="اكتب رسالة المتابعة هنا..."
            />
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>استخدم {"{memberName}"} لاسم العضو و {"{eventName}"} لاسم الفعالية.</p>
          </div>
        </div>
      </div>
      
      <div className={`p-6 rounded-2xl border mb-8 ${theme === 'dark' ? 'glass border-slate-700/50' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className={`text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent`}>إرسال دعوات التأكيد (RSVP)</h2>
          <button
            onClick={() => sendBulkWhatsApp(filteredMembers.filter(m => m.rsvpStatus === 'pending' || !m.rsvpStatus), rsvpMessage)}
            className="flex items-center gap-2 gradient-teal hover:opacity-90 text-white font-bold py-2.5 px-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm w-full sm:w-auto"
            disabled={filteredMembers.filter(m => m.rsvpStatus === 'pending' || !m.rsvpStatus).length === 0}
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>إرسال طلب التأكيد ({filteredMembers.filter(m => m.rsvpStatus === 'pending' || !m.rsvpStatus).length})</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>مؤكدون</p>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{filteredMembers.filter(m => m.rsvpStatus === 'confirmed').length}</p>
          </div>
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>معتذرون</p>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{filteredMembers.filter(m => m.rsvpStatus === 'declined').length}</p>
          </div>
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>لم يردوا</p>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>{filteredMembers.filter(m => m.rsvpStatus === 'pending' || !m.rsvpStatus).length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>قائمة الحضور ({attendees.length})</h2>
            <button
              onClick={() => sendBulkWhatsApp(attendees, thankYouMessage)}
              className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm w-full sm:w-auto ${
                theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-100 hover:bg-green-200 text-green-800'
              }`}
              disabled={attendees.length === 0}
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>رسالة شكر</span>
            </button>
          </div>
          <div className={`rounded-2xl p-4 max-h-[50vh] overflow-y-auto ${theme === 'dark' ? 'glass' : 'bg-white border border-gray-200'}`}>
            {attendees.length > 0 ? (
              <ul className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-200'}`}>
                {attendees.map(member => (
                  <li key={member.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UsersIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{member.name}</p>
                          {member.rsvpStatus === 'confirmed' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>✅ مؤكد</span>
                          )}
                          {member.rsvpStatus === 'declined' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>❌ معتذر</span>
                          )}
                          {(!member.rsvpStatus || member.rsvpStatus === 'pending') && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>⏳ انتظار</span>
                          )}
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>{getEventName(member.groupId)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-mono ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{member.scanCount}/{member.scanLimit}</span>
                  </li>
                ))}
              </ul>
            ) : <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>لا يوجد حضور مسجل بعد.</p>}
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>قائمة الغياب ({absentees.length})</h2>
            <button
              onClick={() => sendBulkWhatsApp(absentees, followUpMessage)}
              className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm w-full sm:w-auto ${
                theme === 'dark'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                  : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
              }`}
              disabled={absentees.length === 0}
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>رسالة متابعة</span>
            </button>
          </div>
          <div className={`rounded-2xl p-4 max-h-[50vh] overflow-y-auto ${theme === 'dark' ? 'glass' : 'bg-white border border-gray-200'}`}>
            {absentees.length > 0 ? (
              <ul className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-200'}`}>
                {absentees.map(member => (
                  <li key={member.id} className="py-3 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                      <UsersIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{member.name}</p>
                          {member.rsvpStatus === 'confirmed' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>✅ مؤكد</span>
                          )}
                          {member.rsvpStatus === 'declined' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>❌ معتذر</span>
                          )}
                          {(!member.rsvpStatus || member.rsvpStatus === 'pending') && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>⏳ انتظار</span>
                          )}
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>{getEventName(member.groupId)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>جميع المدعوين قد حضروا.</p>}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Reporting;