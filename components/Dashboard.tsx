import React, { useState, useEffect } from 'react';
import { Group, Member, ScanLog, DesignTemplate, AuthenticatedUser } from '../types';
import QRCodeModal from './QRCodeModal';
import EditMemberModal from './EditMemberModal';
import MemberList from './MemberList';
import InvitationPreviewModal from './InvitationPreviewModal';
import { UsersIcon, TrashIcon, EditIcon, CalendarIcon, CheckCircleIcon, ChevronLeftIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { groupsAPI, membersAPI, scanLogsAPI } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  scanLogs: ScanLog[];
  designs: DesignTemplate[];
  currentUser: AuthenticatedUser;
  rsvpMessage: string;
}

const getStatusUI = (status: ScanLog['status']) => {
    switch (status) {
      case 'success':
        return { bg: 'bg-green-500', text: 'text-white', message: 'تم الدخول بنجاح' };
      case 'limit_reached':
        return { bg: 'bg-yellow-500', text: 'text-black', message: 'تم استهلاك الحد الأقصى' };
      case 'invalid':
        return { bg: 'bg-red-500', text: 'text-white', message: 'باركود غير صالح' };
    }
};

const DashboardOverview: React.FC<{
    groups: Group[];
    members: Member[];
    scanLogs: ScanLog[];
    onSelectGroup: (group: Group) => void;
    getEventNameById: (groupId: string) => string;
}> = ({ groups, members, scanLogs, onSelectGroup, getEventNameById }) => {
    const { theme } = useTheme();
    const totalEvents = groups.length;
    const totalMembers = members.length;
    const totalAttendees = members.filter(m => m.scanCount > 0).length;
    const overallAttendance = totalMembers > 0 ? ((totalAttendees / totalMembers) * 100).toFixed(1) : 0;

    return (
        <div className="p-4 md:p-8 animate-fadeIn">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-10">نظرة عامة على الفعاليات</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-12">
                <div className={`group p-6 rounded-2xl flex items-center justify-center flex-col border shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${
                    theme === 'dark' 
                        ? 'glass border-teal-500/20 hover:shadow-teal-500/20' 
                        : 'bg-white border-teal-300 hover:shadow-teal-300/30'
                }`}>
                    <div className="absolute inset-0 gradient-teal opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10">
                        <CalendarIcon className={`w-12 h-12 mb-3 group-hover:scale-110 transition-transform ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`} />
                        <p className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>إجمالي الفعاليات</p>
                        <p className="text-5xl font-bold bg-gradient-to-br from-teal-600 to-cyan-600 bg-clip-text text-transparent">{totalEvents}</p>
                    </div>
                </div>
                <div className={`group p-6 rounded-2xl flex items-center justify-center flex-col border shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${
                    theme === 'dark' 
                        ? 'glass border-purple-500/20 hover:shadow-purple-500/20' 
                        : 'bg-white border-purple-300 hover:shadow-purple-300/30'
                }`}>
                    <div className="absolute inset-0 gradient-purple opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10">
                        <UsersIcon className={`w-12 h-12 mb-3 group-hover:scale-110 transition-transform ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                        <p className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>إجمالي الضيوف</p>
                        <p className="text-5xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">{totalMembers}</p>
                    </div>
                </div>
                <div className={`group p-6 rounded-2xl flex items-center justify-center flex-col border shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${
                    theme === 'dark' 
                        ? 'glass border-blue-500/20 hover:shadow-blue-500/20' 
                        : 'bg-white border-blue-300 hover:shadow-blue-300/30'
                }`}>
                    <div className="absolute inset-0 gradient-blue opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10">
                        <CheckCircleIcon className={`w-12 h-12 mb-3 group-hover:scale-110 transition-transform ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                        <p className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>نسبة الحضور الإجمالية</p>
                        <p className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">{overallAttendance}%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>ملخص الفعاليات</h2>
                    <div className={`rounded-2xl p-4 max-h-[50vh] overflow-y-auto space-y-3 ${theme === 'dark' ? 'glass' : 'bg-white border border-gray-200'}`}>
                        {groups.length > 0 ? groups.map(group => {
                            const groupMembers = members.filter(m => m.groupId === group.id);
                            const groupAttendees = groupMembers.filter(m => m.scanCount > 0);
                            const attendanceRate = groupMembers.length > 0 ? ((groupAttendees.length / groupMembers.length) * 100).toFixed(0) : 0;
                            return (
                                <div key={group.id} className={`p-4 rounded-xl flex justify-between items-center transition-all duration-300 hover:scale-[1.02] ${
                                    theme === 'dark' 
                                        ? 'glass-light bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50' 
                                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                }`}>
                                    <div>
                                        <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-teal-300' : 'text-teal-700'}`}>{group.name}</h3>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>{groupMembers.length} ضيف • {attendanceRate}% حضور</p>
                                    </div>
                                    <button onClick={() => onSelectGroup(group)} className="gradient-teal hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-sm">
                                        إدارة
                                    </button>
                                </div>
                            )
                        }) : <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>لم يتم إنشاء فعاليات بعد.</p>}
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>النشاط الأخير</h2>
                     <div className={`rounded-2xl p-4 max-h-[50vh] overflow-y-auto space-y-2 ${theme === 'dark' ? 'glass' : 'bg-white border border-gray-200'}`}>
                        {scanLogs.slice(0, 10).map(log => {
                             const member = members.find(m => m.id === log.memberId);
                             const eventName = member ? getEventNameById(member.groupId) : 'غير معروف';
                             return (
                                <div key={log.id} className={`p-3 rounded-xl flex justify-between items-center text-sm ${getStatusUI(log.status).bg} bg-opacity-20 border-r-4 ${getStatusUI(log.status).bg.replace('bg-','border-')} hover:bg-opacity-30 transition-all duration-200`}>
                                <div>
                                    <p className={`font-semibold ${getStatusUI(log.status).bg.replace('bg-','text-').replace('-500', theme === 'dark' ? '-300' : '-600')}`}>{log.memberName}</p>
                                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                                        {getStatusUI(log.status).message} في "{eventName}"
                                    </p>
                                </div>
                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{log.scannedAt}</p>
                                </div>
                            )
                        })}
                         {scanLogs.length === 0 && <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>لا يوجد نشاط مسجل.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({
  groups,
  setGroups,
  members,
  setMembers,
  scanLogs,
  designs,
  currentUser,
  rsvpMessage
}) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMember, setNewMember] = useState({ name: '', phone: '+966', scanLimit: 1 });
  const [formErrors, setFormErrors] = useState({ name: '', phone: '', scanLimit: '' });
  
  const [modalMember, setModalMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [memberAddError, setMemberAddError] = useState('');
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });


  useEffect(() => {
    setNewMember(prev => ({
      ...prev,
      scanLimit: selectedGroup?.defaultScanLimit || 1,
    }));
    setMemberAddError('');
  }, [selectedGroup]);


  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      try {
        const newGroup = await groupsAPI.create({
          name: newGroupName.trim()
        });
        setGroups(prev => [...prev, newGroup].sort((a,b) => a.name.localeCompare(b.name)));
        setNewGroupName('');
        setSelectedGroup(newGroup);
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الفعالية. الرجاء المحاولة مرة أخرى.');
        console.error('Error adding group:', error);
      }
    }
  };
  
  const handleStartEditingGroup = (group: Group) => {
    setEditingGroup(group);
    setEditingGroupName(group.name);
  };
  
  const handleSaveGroup = async (groupId: string) => {
    if (editingGroupName.trim()) {
      try {
        const updatedGroup = await groupsAPI.update(groupId, { name: editingGroupName.trim() });
        setGroups(groups.map(g => g.id === groupId ? updatedGroup : g));
      } catch (error) {
        alert('حدث خطأ أثناء تحديث اسم الفعالية. الرجاء المحاولة مرة أخرى.');
        console.error('Error updating group:', error);
      }
    }
    setEditingGroup(null);
  }

  const validateForm = () => {
    const errors = { name: '', phone: '', scanLimit: '' };
    let isValid = true;

    if (!newMember.name.trim()) {
      errors.name = 'اسم العضو مطلوب.';
      isValid = false;
    }

    if (!newMember.phone.trim()) {
      errors.phone = 'رقم الواتساب مطلوب.';
      isValid = false;
    } else if (!/^\+?[0-9\s]+$/.test(newMember.phone.replace(/\s/g, ''))) {
      errors.phone = 'يجب أن يحتوي الرقم على أرقام وعلامة + فقط.';
      isValid = false;
    }

    if (!newMember.scanLimit || newMember.scanLimit < 1) {
      errors.scanLimit = 'الحد الأدنى لمرات الدخول هو 1.';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberAddError(''); 
    if (selectedGroup && validateForm()) {
      const groupMembers = members.filter(m => m.groupId === selectedGroup.id);
      if (selectedGroup.maxMembers && groupMembers.length >= selectedGroup.maxMembers) {
          setMemberAddError(`لا يمكن إضافة المزيد من الأعضاء. لقد وصلت الفعالية إلى الحد الأقصى (${selectedGroup.maxMembers} أعضاء).`);
          return;
      }

      try {
        const newMemberData = await membersAPI.create({
          name: newMember.name.trim(),
          phone: newMember.phone.trim().replace(/\s/g, ''),
          scanLimit: newMember.scanLimit,
          scanCount: 0,
          groupId: selectedGroup.id
        });
        setMembers(prev => [...prev, newMemberData]);
        setNewMember({ name: '', phone: '+966', scanLimit: selectedGroup.defaultScanLimit || 1 });
        setFormErrors({ name: '', phone: '', scanLimit: '' });
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الضيف. الرجاء المحاولة مرة أخرى.');
        console.error('Error adding member:', error);
      }
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let finalValue = value;
    
    if (name === 'phone') {
      if (value.startsWith('+966') || value === '+' || value === '+9' || value === '+96') {
        finalValue = value;
      } else if (!value.startsWith('+')) {
        finalValue = '+966' + value;
      }
    } else if (name === 'scanLimit') {
      finalValue = (parseInt(value, 10) || 1).toString();
    }
    
    setNewMember(prev => ({
        ...prev,
        [name]: name === 'scanLimit' ? (parseInt(finalValue, 10) || 1) : finalValue,
    }));

    if (formErrors[name as keyof typeof formErrors]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    setMemberAddError('');
  };

  const deleteGroup = (group: Group) => {
    setConfirmModalState({
        isOpen: true,
        title: 'تأكيد حذف الفعالية',
        message: `هل أنت متأكد من حذف فعالية "${group.name}" وكل الضيوف المرتبطين بها؟ لا يمكن التراجع عن هذا الإجراء.`,
        onConfirm: async () => {
            try {
                const groupMembers = members.filter(m => m.groupId === group.id);
                
                for (const member of groupMembers) {
                    await membersAPI.delete(member.id);
                }
                
                await groupsAPI.delete(group.id);
                
                setMembers(prev => prev.filter(m => m.groupId !== group.id));
                setGroups(prev => prev.filter(g => g.id !== group.id));
                if (selectedGroup?.id === group.id) {
                    setSelectedGroup(null);
                }
            } catch (error) {
                alert('حدث خطأ أثناء حذف الفعالية. الرجاء المحاولة مرة أخرى.');
                console.error('Error deleting group:', error);
            }
        }
    });
  };
  
  const deleteMember = (member: Member) => {
    setConfirmModalState({
        isOpen: true,
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من حذف الضيف "${member.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
        onConfirm: async () => {
            try {
                await membersAPI.delete(member.id);
                setMembers(prevMembers => prevMembers.filter(m => m.id !== member.id));
            } catch (error) {
                alert('حدث خطأ أثناء حذف الضيف. الرجاء المحاولة مرة أخرى.');
                console.error('Error deleting member:', error);
            }
        }
    });
  };

  const handleSaveMember = async (updatedMember: Member) => {
    try {
      const savedMember = await membersAPI.update(updatedMember.id, updatedMember);
      setMembers(members.map(m => m.id === updatedMember.id ? savedMember : m));
      setEditingMember(null);
    } catch (error) {
      alert('حدث خطأ أثناء تحديث بيانات الضيف. الرجاء المحاولة مرة أخرى.');
      console.error('Error updating member:', error);
    }
  };
  
  const handleManualCheckIn = async (member: Member) => {
    if (member.scanCount >= member.scanLimit) {
      alert("وصل هذا العضو إلى الحد الأقصى للمسح الضوئي.");
      return;
    }
    if (window.confirm(`هل أنت متأكد من تسجيل دخول "${member.name}" يدوياً؟`)) {
        try {
            const updatedMember = await membersAPI.update(member.id, {
                scanCount: member.scanCount + 1
            });

            await scanLogsAPI.create({
                memberId: member.id,
                memberName: member.name,
                status: 'success',
                scannedAt: new Date().toLocaleString('ar-SA')
            });

            setMembers(members.map(m => m.id === member.id ? updatedMember : m));
        } catch (error) {
            alert('حدث خطأ أثناء تسجيل الدخول يدوياً. الرجاء المحاولة مرة أخرى.');
            console.error('Error manual check-in:', error);
        }
    }
  };

  const handleSendRSVP = (member: Member) => {
    const eventName = selectedGroup?.name || 'الفعالية';
    const message = rsvpMessage
      .replace(/{memberName}/g, member.name)
      .replace(/{eventName}/g, eventName);
    
    const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendBarcode = (member: Member) => {
    const eventName = selectedGroup?.name || 'الفعالية';
    const message = `مرحباً ${member.name}،\n\nإليك رمز دعوتك لحضور "${eventName}":\n\nرمز الدعوة: ${member.id}\n\nاحتفظ بهذا الرمز للدخول.`;
    
    const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleGenerateAndSendInvitation = async (member: Member) => {
    if (!selectedDesign || !selectedGroup) return;
    
    try {
      const { generateAndDownloadInvitation, getWhatsAppMessage } = await import('../lib/generateInvitation');
      
      await generateAndDownloadInvitation(member, selectedDesign, selectedGroup);
      
      const message = getWhatsAppMessage(member, selectedGroup);
      
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }, 500);
      
    } catch (error) {
      console.error('Error generating invitation:', error);
      alert('حدث خطأ أثناء توليد الدعوة. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleGroupConfigChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!selectedGroup) return;
    const { name, value } = e.target;

    let finalValue: any = value;
    if (name === 'defaultScanLimit') {
        finalValue = parseInt(value, 10) || 1;
    } else if (name === 'maxMembers') {
        const numValue = parseInt(value, 10);
        finalValue = numValue > 0 ? numValue : undefined;
    }

    try {
      const savedGroup = await groupsAPI.update(selectedGroup.id, { [name]: finalValue });
      setSelectedGroup(savedGroup);
      setGroups(groups.map(g => g.id === savedGroup.id ? savedGroup : g));

      if (name === 'defaultScanLimit') {
          setNewMember(prev => ({...prev, scanLimit: parseInt(value, 10) || 1}));
      }
    } catch (error) {
      alert('حدث خطأ أثناء تحديث إعدادات الفعالية. الرجاء المحاولة مرة أخرى.');
      console.error('Error updating group config:', error);
    }
  };

  const getEventNameById = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.name || 'فعالية محذوفة';
  };
  
  const groupMembers = members.filter(m => m.groupId === selectedGroup?.id);
  const filteredMembers = groupMembers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  );
  const selectedDesign = designs.find(d => d.id === selectedGroup?.designTemplateId);

  return (
    <div className="lg:flex h-full text-slate-300">
      <aside className={`w-full lg:w-80 flex-shrink-0 bg-slate-900 p-4 md:p-6 flex flex-col border-l border-slate-800 ${selectedGroup ? 'hidden lg:flex' : 'flex'}`}>
        <h2 className="text-2xl font-bold mb-6 text-teal-400">الفعاليات</h2>
        <form onSubmit={handleAddGroup} className="mb-6">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="اسم فعالية جديدة"
            className="w-full bg-slate-800 p-2 rounded-md mb-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
          />
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-transform duration-200 hover:-translate-y-0.5">
            إضافة فعالية
          </button>
        </form>
        <div className="flex-grow overflow-y-auto -mr-2 pr-2">
            <ul className="space-y-2">
            {groups.map(group => (
                <li key={group.id} className={`relative flex items-center justify-between p-3 rounded-md transition-colors ${selectedGroup?.id === group.id ? 'bg-slate-800' : ''}`}>
                {selectedGroup?.id === group.id && <span className="absolute right-0 top-0 bottom-0 w-1 bg-teal-400 rounded-r-lg"></span>}
                {editingGroup?.id === group.id ? (
                    <input
                    type="text"
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    onBlur={() => handleSaveGroup(group.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGroup(group.id)}
                    className="w-full bg-slate-700 text-white p-1 rounded-md"
                    autoFocus
                    />
                ) : (
                    <button 
                    onClick={() => setSelectedGroup(group)} 
                    className={`w-full text-right p-1 rounded-md ${selectedGroup?.id === group.id ? 'text-teal-300' : 'hover:bg-slate-800/50'}`}
                    >
                    {group.name}
                    </button>
                )}
                <button onClick={() => handleStartEditingGroup(group)} className="p-1 text-slate-500 hover:text-white mr-2"><EditIcon className="w-4 h-4" /></button>
                </li>
            ))}
            </ul>
        </div>
      </aside>

      <main className={`flex-1 overflow-y-auto ${selectedGroup ? 'block' : 'hidden lg:block'}`}>
        {selectedGroup ? (
          <div className="p-4 md:p-8">
            <button
                onClick={() => setSelectedGroup(null)}
                className="lg:hidden flex items-center gap-1 text-teal-400 font-bold mb-4 py-2 px-3 rounded-md hover:bg-slate-800 transition-colors"
            >
                <ChevronLeftIcon className="w-5 h-5" />
                <span>كل الفعاليات</span>
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="w-full">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{selectedGroup.name}</h1>
                <p className="text-slate-400">
                    إجمالي الضيوف: {groupMembers.length}
                    {selectedGroup.maxMembers ? ` / ${selectedGroup.maxMembers}` : ''}
                </p>
              </div>
              <button
                onClick={() => deleteGroup(selectedGroup)}
                className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-transform duration-200 hover:-translate-y-0.5 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-500"
                disabled={currentUser.role !== 'admin'}
                title={currentUser.role !== 'admin' ? "الحذف متاح للمسؤولين فقط" : "حذف الفعالية"}
              >
                <TrashIcon className="w-4 h-4"/>
                حذف الفعالية
              </button>
            </div>
            
             <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-lg mb-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">تصميم الدعوة</label>
                      <select
                          name="designTemplateId"
                          value={selectedGroup.designTemplateId || ''}
                          onChange={handleGroupConfigChange}
                          className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                      >
                          <option value="">-- اختر تصميم --</option>
                          {designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      {selectedGroup?.designTemplateId && !selectedDesign && (
                        <p className="text-red-400 text-xs mt-1">التصميم المحدد لم يعد موجوداً. الرجاء اختيار تصميم آخر.</p>
                      )}
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">الحد الأقصى للدخول</label>
                      <input
                          type="number"
                          name="defaultScanLimit"
                          min="1"
                          value={selectedGroup.defaultScanLimit || 1}
                          onChange={handleGroupConfigChange}
                          className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">العدد الأقصى للضيوف</label>
                      <input
                          type="number"
                          name="maxMembers"
                          min="1"
                          placeholder="غير محدود"
                          value={selectedGroup.maxMembers || ''}
                          onChange={handleGroupConfigChange}
                          className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                      />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">تاريخ ووقت بدء الفعالية</label>
                        <input
                            type="datetime-local"
                            name="eventStartDate"
                            value={selectedGroup.eventStartDate || ''}
                            onChange={handleGroupConfigChange}
                            className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-slate-300"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">تاريخ ووقت انتهاء الفعالية</label>
                        <input
                            type="datetime-local"
                            name="eventEndDate"
                            value={selectedGroup.eventEndDate || ''}
                            onChange={handleGroupConfigChange}
                            className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-slate-300"
                        />
                    </div>
                </div>
                 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">عنوان الفعالية</label>
                        <input
                            type="text"
                            name="locationAddress"
                            placeholder="مثال: قاعة المملكة، الرياض"
                            value={selectedGroup.locationAddress || ''}
                            onChange={handleGroupConfigChange}
                            className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">رابط خرائط جوجل</label>
                        <input
                            type="url"
                            name="locationLink"
                            placeholder="https://maps.app.goo.gl/..."
                            value={selectedGroup.locationLink || ''}
                            onChange={handleGroupConfigChange}
                            className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">قالب رسالة الواتساب</label>
                    <textarea
                        name="whatsappMessageTemplate"
                        rows={3}
                        placeholder="مرحباً {memberName}, أنت مدعو/ة لحضور '{eventName}'. الرجاء استخدام هذه الصورة للدخول."
                        value={selectedGroup.whatsappMessageTemplate || ''}
                        onChange={handleGroupConfigChange}
                        className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">استخدم {"{memberName}"}, {"{eventName}"}, {"{eventStartDate}"}, {"{eventEndDate}"}, {"{eventLocationAddress}"}, {"{eventLocationLink}"}.</p>
                </div>

                <div>
                    <button 
                        onClick={() => setIsInvitationModalOpen(true)}
                        disabled={!selectedDesign || groupMembers.length === 0}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 hover:-translate-y-0.5 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        إنشاء وإرسال الدعوات
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold mb-4">إضافة ضيف جديد</h3>
              <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="w-full">
                  <input 
                    type="text" name="name" placeholder="اسم الضيف" value={newMember.name} onChange={handleInputChange} 
                    className={`w-full bg-slate-800 p-2 rounded-md border ${formErrors.name ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors`}
                    aria-invalid={!!formErrors.name} aria-describedby={formErrors.name ? "name-error" : undefined}
                  />
                  {formErrors.name && <p id="name-error" className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div className="w-full">
                  <input 
                    type="tel" name="phone" placeholder="+966xxxxxxxxx" value={newMember.phone} onChange={handleInputChange} 
                    className={`w-full bg-slate-800 p-2 rounded-md border ${formErrors.phone ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors`}
                    aria-invalid={!!formErrors.phone} aria-describedby={formErrors.phone ? "phone-error" : undefined}
                  />
                  {formErrors.phone && <p id="phone-error" className="text-red-400 text-xs mt-1">{formErrors.phone}</p>}
                </div>
                <div className="w-full">
                  <input 
                    type="number" name="scanLimit" min="1" placeholder="عدد مرات الدخول" value={newMember.scanLimit} onChange={handleInputChange} 
                    className={`w-full bg-slate-800 p-2 rounded-md border ${formErrors.scanLimit ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors`}
                    aria-invalid={!!formErrors.scanLimit} aria-describedby={formErrors.scanLimit ? "scanLimit-error" : undefined}
                  />
                  {formErrors.scanLimit && <p id="scanLimit-error" className="text-red-400 text-xs mt-1">{formErrors.scanLimit}</p>}
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-transform duration-200 hover:-translate-y-0.5 h-10 w-full">إضافة</button>
              </form>
              {memberAddError && <p className="text-red-400 text-sm mt-4 text-center">{memberAddError}</p>}
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="ابحث عن ضيف بالاسم أو رقم الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-md border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                />
            </div>

            <MemberList
              members={filteredMembers}
              onDeleteMember={deleteMember}
              onEditMember={setEditingMember}
              onShowQrCode={setModalMember}
              onManualCheckIn={handleManualCheckIn}
              onSendRSVP={handleSendRSVP}
              onSendBarcode={handleSendBarcode}
              onGenerateAndSendInvitation={handleGenerateAndSendInvitation}
              hasDesign={!!selectedDesign}
              userRole={currentUser.role}
            />

          </div>
        ) : (
            <DashboardOverview 
                groups={groups}
                members={members}
                scanLogs={scanLogs}
                onSelectGroup={setSelectedGroup}
                getEventNameById={getEventNameById}
            />
        )}
      </main>
      {modalMember && <QRCodeModal 
        member={modalMember} 
        onClose={() => setModalMember(null)} 
        eventName={groups.find(g => g.id === modalMember.groupId)?.name || ''} 
        design={designs.find(d => d.id === groups.find(g => g.id === modalMember.groupId)?.designTemplateId)}
      />}
      {editingMember && <EditMemberModal member={editingMember} onSave={handleSaveMember} onClose={() => setEditingMember(null)} />}
      {isInvitationModalOpen && selectedDesign && selectedGroup && (
        <InvitationPreviewModal 
            members={groupMembers.filter(m => m.rsvpStatus === 'confirmed')} 
            design={selectedDesign}
            group={selectedGroup}
            onClose={() => setIsInvitationModalOpen(false)} 
        />
      )}
       <ConfirmationModal 
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        message={confirmModalState.message}
      />
    </div>
  );
};

export default Dashboard;