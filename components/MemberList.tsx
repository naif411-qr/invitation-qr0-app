import React from 'react';
import { Member, UserRole } from '../types';
import { QrCodeIcon, PlusCircleIcon, EditIcon, TrashIcon, WhatsAppIcon } from './Icons';

interface MemberListProps {
  members: Member[];
  onDeleteMember: (member: Member) => void;
  onEditMember: (member: Member) => void;
  onShowQrCode: (member: Member) => void;
  onManualCheckIn: (member: Member) => void;
  onSendRSVP: (member: Member) => void;
  onSendBarcode: (member: Member) => void;
  onGenerateAndSendInvitation: (member: Member) => void;
  hasDesign: boolean;
  userRole: UserRole;
}

const MemberList: React.FC<MemberListProps> = ({
  members,
  onDeleteMember,
  onEditMember,
  onShowQrCode,
  onManualCheckIn,
  onSendRSVP,
  onSendBarcode,
  onGenerateAndSendInvitation,
  hasDesign,
  userRole,
}) => {
  const getRSVPBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">قيد الانتظار</span>;
    } else if (status === 'confirmed') {
      return <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">مُؤكد</span>;
    } else if (status === 'declined') {
      return <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">مُعتذر</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map(member => (
        <div key={member.id} className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-lg flex flex-col justify-between transition-all duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-black/25">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-lg font-bold text-slate-100">{member.name}</h4>
                <p className="text-sm text-slate-400" dir="ltr">{member.phone}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-300">الدخول</p>
                <p className={`font-bold text-lg ${member.scanCount >= member.scanLimit ? 'text-yellow-400' : 'text-teal-400'}`}>{member.scanCount}/{member.scanLimit}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getRSVPBadge(member.rsvpStatus)}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => onShowQrCode(member)} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm min-w-fit">
                <QrCodeIcon className="w-4 h-4" /><span>عرض باركود</span>
              </button>
              <div className="flex gap-2">
                <button title="تسجيل دخول يدوي" onClick={() => onManualCheckIn(member)} disabled={member.scanCount >= member.scanLimit} className="p-2 bg-green-600 hover:bg-green-700 hover:brightness-110 text-white rounded-md disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
                   <PlusCircleIcon className="w-5 h-5"/>
                </button>
                 <button title="تعديل العضو" onClick={() => onEditMember(member)} className="p-2 bg-blue-600 hover:bg-blue-700 hover:brightness-110 text-white rounded-md transition-colors">
                   <EditIcon className="w-5 h-5"/>
                </button>
                 <button
                   title={userRole !== 'admin' ? "الحذف متاح للمسؤولين فقط" : "حذف العضو"}
                   onClick={() => onDeleteMember(member)}
                   className="p-2 bg-red-800 hover:bg-red-700 hover:brightness-110 text-white rounded-md transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                   disabled={userRole !== 'admin'}
                 >
                   <TrashIcon className="w-5 h-5"/>
                </button>
              </div>
            </div>
            <button 
              onClick={() => onSendRSVP(member)} 
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>إرسال دعوة للتأكيد</span>
            </button>
            {member.rsvpStatus === 'confirmed' && hasDesign && (
              <button 
                onClick={() => onGenerateAndSendInvitation(member)} 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-3 rounded-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>إنشاء وإرسال الدعوة</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MemberList;