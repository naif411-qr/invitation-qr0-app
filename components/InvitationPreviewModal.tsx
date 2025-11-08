import React from 'react';
import { Member, DesignTemplate, Group } from '../types';
import GeneratedInvitation from './GeneratedInvitation';
import { WhatsAppIcon } from './Icons';

const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('ar-SA-u-nu-latn', { 
            year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true,
        }).format(date);
    } catch (e) { return ''; }
};

interface InvitationPreviewModalProps {
  members: Member[];
  design: DesignTemplate;
  onClose: () => void;
  group: Group;
}

const InvitationPreviewModal: React.FC<InvitationPreviewModalProps> = ({ members, design, onClose, group }) => {

  const handleSendAllWhatsApp = () => {
    if (members.length === 0) {
      alert('لا يوجد ضيوف مؤكدين للإرسال.');
      return;
    }

    if (members.length > 10) {
      if (!window.confirm(`أنت على وشك فتح ${members.length} محادثة واتساب. هل تريد المتابعة؟`)) {
        return;
      }
    }

    const { name: groupName, whatsappMessageTemplate, eventStartDate, eventEndDate, locationAddress, locationLink } = group;
    
    let defaultMessage = `مرحباً {memberName},\n\nأنت مدعو/ة لحضور "{eventName}".`;
    if (locationAddress) {
        defaultMessage += `\n\n📍 العنوان: ${locationAddress}`;
    }
    if (locationLink) {
        defaultMessage += `\n\n🗺️ رابط الموقع: ${locationLink}`;
    }
    defaultMessage += `\n\nالرجاء استخدام هذه الصورة للدخول. نتطلع لرؤيتك!`;

    const messageTemplate = whatsappMessageTemplate || defaultMessage;
    const formattedStartDate = formatDateTime(eventStartDate);
    const formattedEndDate = formatDateTime(eventEndDate);

    members.forEach(member => {
        let invitationMessage = messageTemplate
          .replace(/{memberName}/g, member.name)
          .replace(/{eventName}/g, groupName)
          .replace(/{eventStartDate}/g, formattedStartDate)
          .replace(/{eventEndDate}/g, formattedEndDate)
          .replace(/{eventLocationAddress}/g, locationAddress || '')
          .replace(/{eventLocationLink}/g, locationLink || '');
        
        const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(invitationMessage)}`;
        window.open(whatsappUrl, '_blank');
    });
  };


  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-60 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 p-8 w-full max-w-5xl mx-auto h-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 flex-shrink-0 gap-4">
          <div className="w-full">
            <h2 className="text-2xl font-bold text-teal-400">معاينة وتحميل الدعوات</h2>
            <p className="text-sm text-slate-400">{members.length} دعوة</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <button
                onClick={handleSendAllWhatsApp}
                disabled={members.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-slate-600 disabled:cursor-not-allowed"
             >
                <WhatsAppIcon className="w-5 h-5" />
                <span>إرسال للكل (رسالة نصية)</span>
             </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl transition-colors leading-none hidden sm:block">&times;</button>
          </div>
        </div>
        <div className="overflow-y-auto pr-2 -mr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => (
                <GeneratedInvitation 
                    key={member.id} 
                    member={member} 
                    design={design}
                    group={group}
                />
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationPreviewModal;