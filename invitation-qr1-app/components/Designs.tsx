import React, { useState } from 'react';
import { DesignTemplate } from '../types';
import DesignEditorModal from './DesignEditorModal';
import ConfirmationModal from './ConfirmationModal';
import { PlusCircleIcon, TrashIcon } from './Icons';
import { designsAPI } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';

interface DesignsProps {
    designs: DesignTemplate[];
    setDesigns: React.Dispatch<React.SetStateAction<DesignTemplate[]>>;
}

const Designs: React.FC<DesignsProps> = ({ designs, setDesigns }) => {
    const { theme } = useTheme();
    const [editingDesign, setEditingDesign] = useState<DesignTemplate | null>(null);
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

    const handleSaveDesign = async (designToSave: DesignTemplate) => {
        try {
            const existingIndex = designs.findIndex(d => d.id === designToSave.id);
            if (existingIndex > -1) {
                await designsAPI.update(designToSave.id, designToSave);
                const updatedDesigns = [...designs];
                updatedDesigns[existingIndex] = designToSave;
                setDesigns(updatedDesigns);
            } else {
                await designsAPI.create(designToSave);
                setDesigns(prev => [...prev, designToSave]);
            }
            setEditingDesign(null);
        } catch (error) {
            alert('حدث خطأ أثناء حفظ التصميم');
            console.error('Error saving design:', error);
        }
    };

    const handleCreateNew = () => {
        setEditingDesign({
            id: crypto.randomUUID(),
            name: 'تصميم جديد',
            backgroundImage: '',
            titleText: 'أنت مدعو!',
            bodyText: 'تفاصيل الحدث هنا.',
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            qrCodeSize: 45,
            qrCodePosX: 27.5,
            qrCodePosY: 70,
            titleFont: 'Tajawal',
            titleFontSize: 36,
            bodyFont: 'Tajawal',
            bodyFontSize: 20,
            nameFont: 'Tajawal',
            nameFontSize: 28,
            showEventDates: true,
            showGuestName: true,
            guestNamePosX: 50,
            guestNamePosY: 65,
            qrCodeStyle: 'squares',
            qrCodeColor: '#000000',
            qrCodeBackgroundColor: '#ffffff',
            qrCodeCornerSquareType: 'square',
            qrCodeCornerDotType: 'square',
            qrCodeCenterImage: undefined,
            barcodeType: 'qrcode',
        });
    };
    
    const handleDeleteDesign = (design: DesignTemplate) => {
        setConfirmModalState({
            isOpen: true,
            title: 'تأكيد الحذف',
            message: `هل أنت متأكد من حذف تصميم "${design.name}"؟`,
            onConfirm: async () => {
                try {
                    await designsAPI.delete(design.id);
                    setDesigns(prevDesigns => prevDesigns.filter(d => d.id !== design.id));
                } catch (error) {
                    alert('حدث خطأ أثناء حذف التصميم');
                    console.error('Error deleting design:', error);
                }
            }
        });
    }

    const handleDeleteFromEditor = (design: DesignTemplate) => {
        setConfirmModalState({
            isOpen: true,
            title: 'تأكيد الحذف',
            message: `هل أنت متأكد من حذف تصميم "${design.name}"؟`,
            onConfirm: async () => {
                try {
                    await designsAPI.delete(design.id);
                    setDesigns(prevDesigns => prevDesigns.filter(d => d.id !== design.id));
                    setEditingDesign(null);
                } catch (error) {
                    alert('حدث خطأ أثناء حذف التصميم');
                    console.error('Error deleting design:', error);
                }
            }
        });
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">تصاميم الدعوات</h1>
                <button
                    onClick={handleCreateNew}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 gradient-purple hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>إنشاء تصميم جديد</span>
                </button>
            </div>

            {designs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {designs.map(design => (
                        <div 
                            key={design.id} 
                            className={`rounded-2xl shadow-lg overflow-hidden group relative cursor-pointer border transition-all duration-300 hover:-translate-y-1 ${
                              theme === 'dark'
                                ? 'glass border-slate-700/50 hover:shadow-teal-400/20 hover:border-teal-400/30'
                                : 'bg-white border-gray-200 hover:shadow-teal-300/30 hover:border-teal-300'
                            }`} 
                            onClick={() => setEditingDesign(design)}
                        >
                            <div 
                                className="w-full h-40 bg-cover bg-center flex flex-col justify-center items-center p-4 text-center transition-transform duration-300 group-hover:scale-105"
                                style={{
                                    backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : 'none',
                                    backgroundColor: design.backgroundImage ? '#00000080' : '#1e293b',
                                    backgroundBlendMode: 'overlay'
                                }}
                            >
                                <h3 className="font-bold text-xl" style={{ color: design.titleColor, fontFamily: design.titleFont || 'Tajawal' }}>{design.titleText}</h3>
                                <p className="text-xs" style={{ color: design.bodyColor, fontFamily: design.bodyFont || 'Tajawal' }}>{design.bodyText}</p>
                            </div>
                            <div className={`p-4 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                                <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{design.name}</p>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent opening the editor
                                    handleDeleteDesign(design);
                                }} 
                                className="absolute top-3 right-3 p-2 bg-red-600/50 hover:bg-red-600 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                                aria-label={`Delete ${design.name}`}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`text-center py-16 border-2 border-dashed rounded-2xl ${
                  theme === 'dark'
                    ? 'border-slate-800 bg-slate-900/30'
                    : 'border-gray-300 bg-gray-50'
                }`}>
                    <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>لم تقم بإنشاء أي تصاميم بعد.</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>ابدأ بإنشاء تصميمك الأول لدعواتك!</p>
                </div>
            )}

            {editingDesign && (
                <DesignEditorModal
                    design={editingDesign}
                    onSave={handleSaveDesign}
                    onClose={() => setEditingDesign(null)}
                    onDelete={handleDeleteFromEditor}
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

export default Designs;