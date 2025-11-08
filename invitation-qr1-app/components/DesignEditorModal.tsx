import React, { useState, useEffect, useRef } from 'react';
import { DesignTemplate } from '../types';
import { TrashIcon } from './Icons';

interface DesignEditorModalProps {
  design: DesignTemplate;
  onClose: () => void;
  onSave: (design: DesignTemplate) => void;
  onDelete: (design: DesignTemplate) => void;
}

const FONT_OPTIONS = [
    { value: 'Tajawal', label: 'Tajawal' },
    { value: 'Cairo', label: 'Cairo' },
    { value: 'Amiri', label: 'Amiri' },
    { value: 'Lalezar', label: 'Lalezar' },
    { value: 'Markazi Text', label: 'Markazi Text' },
];


const FontDropdown: React.FC<{
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
}> = ({ name, value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: string) => {
        // Synthesize an event object that looks like it came from a select element
        const syntheticEvent = {
            target: {
                name,
                value: optionValue,
                type: 'select-one',
            },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                style={{ fontFamily: selectedOption.value, fontSize: '1.1rem' }}
            >
                <span>{selectedOption.label}</span>
                <svg className={`w-5 h-5 transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <ul className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <li
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className="p-3 cursor-pointer hover:bg-teal-600 text-lg"
                            style={{ fontFamily: option.value }}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


const FontSelector: React.FC<{
    label: string, 
    namePrefix: string, 
    design: DesignTemplate,
    onDesignChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
    showColor?: boolean
}> = ({ label, namePrefix, design, onDesignChange, showColor = false }) => {
    const fontName = `${namePrefix}Font`;
    const fontSizeName = `${namePrefix}FontSize`;
    const colorName = `${namePrefix}Color`;
    const currentFont = design[fontName as keyof DesignTemplate] as string || 'Tajawal';
    const currentSize = design[fontSizeName as keyof DesignTemplate] as number || 20;
    const currentColor = design[colorName as keyof DesignTemplate] as string || '#FFFFFF';

    return (
        <div className="space-y-4 pt-4">
            <h3 className="text-lg text-slate-400 font-semibold">{label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">نوع الخط</label>
                    <FontDropdown
                        name={fontName}
                        value={currentFont}
                        onChange={onDesignChange}
                        options={FONT_OPTIONS}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">حجم الخط</label>
                     <div className="flex items-center gap-2">
                         <input type="range" name={fontSizeName} min="12" max="72" value={currentSize} onChange={onDesignChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
                         <input 
                            type="number"
                            name={fontSizeName}
                            min="12"
                            max="72"
                            value={currentSize}
                            onChange={onDesignChange}
                            className="w-20 bg-slate-800 p-2 rounded-md text-center border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                         />
                    </div>
                </div>
            </div>
            {showColor && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">لون الخط</label>
                    <input 
                        type="color" 
                        name={colorName} 
                        value={currentColor} 
                        onChange={onDesignChange} 
                        className="w-full h-10 p-1 bg-slate-800 border border-slate-700 rounded-md cursor-pointer"
                    />
                </div>
            )}
        </div>
    );
};

const LiveBarcodePreview: React.FC<{ design: DesignTemplate }> = ({ design }) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const barcodeRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const isLinear = design.barcodeType === 'code128' || design.barcodeType === 'codabar';

        if (isLinear && barcodeRef.current) {
            const previewValue = "1234567890";
            try {
                window.bwipjs.toCanvas(barcodeRef.current, {
                    bcid: design.barcodeType,
                    text: previewValue,
                    scale: 2,
                    height: 8,
                    includetext: false,
                    textxalign: 'center',
                    backgroundcolor: '00000000',
                    barcolor: design.qrCodeColor || '000000',
                });
            } catch (e) {
                console.error(`bwip-js failed to generate preview for format ${design.barcodeType}:`, e);
                if (barcodeRef.current) {
                    const ctx = barcodeRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, barcodeRef.current.width, barcodeRef.current.height);
                    }
                }
            }
        } else if (!isLinear && qrRef.current) {
            qrRef.current.innerHTML = '';
            const qrCodeStyling = new window.QRCodeStyling({
                width: 256,
                height: 256,
                data: "معاينة QR",
                margin: 5,
                qrOptions: { errorCorrectionLevel: 'H' },
                dotsOptions: {
                    type: design.qrCodeStyle || 'squares',
                    color: design.qrCodeColor || '#000000',
                },
                cornersSquareOptions: {
                    type: design.qrCodeCornerSquareType || 'square',
                },
                cornersDotOptions: {
                    type: design.qrCodeCornerDotType || 'square',
                },
                backgroundOptions: { color: 'transparent' },
                image: design.qrCodeCenterImage,
                imageOptions: {
                    hideBackgroundDots: true,
                    imageSize: 0.4,
                    margin: 4
                }
            });
            qrCodeStyling.append(qrRef.current);
        }
    }, [design]);
    
    if (design.barcodeType === 'code128' || design.barcodeType === 'codabar') {
        return <canvas ref={barcodeRef} className="w-full h-auto" />;
    }

    return <div ref={qrRef} className="w-full h-full [&_canvas]:w-full [&_canvas]:h-full object-contain" />;
};


const DesignEditorModal: React.FC<DesignEditorModalProps> = ({ design, onClose, onSave, onDelete }) => {
  const [currentDesign, setCurrentDesign] = useState<DesignTemplate>(design);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const BASE_CANVAS_WIDTH = 450;

  useEffect(() => {
    setCurrentDesign(design);
  }, [design]);

  useEffect(() => {
    const calculateScale = () => {
        if (previewRef.current) {
            const previewWidth = previewRef.current.offsetWidth;
            setScaleFactor(previewWidth / BASE_CANVAS_WIDTH);
        }
    };
    
    const timeoutId = setTimeout(calculateScale, 50);

    window.addEventListener('resize', calculateScale);
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', calculateScale);
    };
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | boolean;

    if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'range' || name.toLowerCase().includes('fontsize') || type === 'number') {
        processedValue = parseFloat(value);
    } else {
        processedValue = value;
    }

    setCurrentDesign(prev => ({ 
        ...prev, 
        [name]: processedValue
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentDesign(prev => ({ ...prev, [name]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeCenterImage = () => {
      setCurrentDesign(prev => ({...prev, qrCodeCenterImage: undefined}));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentDesign);
  };
  
  const handleDelete = () => {
    onDelete(currentDesign);
  };
  
  const isQrCode = currentDesign.barcodeType === 'qrcode' || !currentDesign.barcodeType;


  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-60 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-5xl h-full max-h-[90vh] flex flex-col lg:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Form */}
        <div className="w-full lg:w-1/2 p-6 md:p-8 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-teal-400">محرر التصميم</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                أبعاد الصورة: 1080 × 1920 بكسل
              </span>
              <span className="text-slate-400 text-xs">(Full HD Portrait)</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 divide-y divide-slate-800">
            <div className="space-y-4 pt-2">
                <h3 className="text-lg text-slate-400 font-semibold">المحتوى الأساسي</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">اسم التصميم</label>
                  <input type="text" name="name" value={currentDesign.name} onChange={handleInputChange} className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">صورة الخلفية</label>
                  <input type="file" name="backgroundImage" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 cursor-pointer"/>
                </div>
                <div className="flex items-center gap-3 pt-2">
                    <input
                        type="checkbox"
                        id="showEventDates-checkbox"
                        name="showEventDates"
                        checked={currentDesign.showEventDates ?? true}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-600"
                    />
                    <label htmlFor="showEventDates-checkbox" className="text-sm font-medium text-slate-300 select-none">
                        إظهار تاريخ ووقت الفعالية
                    </label>
                </div>
                <div className="flex items-center gap-3 pt-2">
                    <input
                        type="checkbox"
                        id="showGuestName-checkbox"
                        name="showGuestName"
                        checked={currentDesign.showGuestName ?? true}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-600"
                    />
                    <label htmlFor="showGuestName-checkbox" className="text-sm font-medium text-slate-300 select-none">
                        إظهار اسم الضيف
                    </label>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">نص العنوان</label>
                  <input type="text" name="titleText" value={currentDesign.titleText} onChange={handleInputChange} className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">النص الأساسي</label>
                  <textarea name="bodyText" value={currentDesign.bodyText} onChange={handleInputChange} rows={3} className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"/>
                </div>
            </div>
            
            <FontSelector label="خطوط العنوان" namePrefix="title" design={currentDesign} onDesignChange={handleInputChange} showColor={true} />
            <FontSelector label="خطوط النص الأساسي" namePrefix="body" design={currentDesign} onDesignChange={handleInputChange} showColor={true} />
            <FontSelector label="خطوط اسم الضيف" namePrefix="name" design={currentDesign} onDesignChange={handleInputChange} showColor={true} />

            <div className="space-y-4 pt-4">
                <h3 className="text-lg text-slate-400 font-semibold">إعدادات الباركود</h3>
                 <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">نوع الباركود</label>
                  <select
                    name="barcodeType"
                    value={currentDesign.barcodeType || 'qrcode'}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                  >
                    <option value="qrcode">QR Code (رمز مربع)</option>
                    <option value="code128">Code 128 (شريطي)</option>
                    <option value="codabar">Codabar (شريطي)</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">لون الباركود</label>
                  <input type="color" name="qrCodeColor" value={currentDesign.qrCodeColor || '#000000'} onChange={handleInputChange} className="w-full h-10 p-1 bg-slate-800 border border-slate-700 rounded-md cursor-pointer"/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">لون خلفية الباركود</label>
                  <input type="color" name="qrCodeBackgroundColor" value={currentDesign.qrCodeBackgroundColor || '#ffffff'} onChange={handleInputChange} className="w-full h-10 p-1 bg-slate-800 border border-slate-700 rounded-md cursor-pointer"/>
                </div>
                
                <div className={`space-y-4 transition-opacity ${isQrCode ? 'opacity-100' : 'opacity-50'}`}>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">شكل نقاط QR</label>
                      <select
                        name="qrCodeStyle"
                        value={currentDesign.qrCodeStyle || 'squares'}
                        onChange={handleInputChange}
                        disabled={!isQrCode}
                        className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 disabled:cursor-not-allowed"
                      >
                        <option value="squares">مربعات</option>
                        <option value="dots">نقاط</option>
                        <option value="rounded">زوايا دائرية</option>
                        <option value="extra-rounded">دائرية جداً</option>
                        <option value="classy">أنيق</option>
                        <option value="classy-rounded">أنيق دائري</option>
                      </select>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">شكل زوايا QR</label>
                      <select
                        name="qrCodeCornerSquareType"
                        value={currentDesign.qrCodeCornerSquareType || 'square'}
                        onChange={handleInputChange}
                        disabled={!isQrCode}
                        className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 disabled:cursor-not-allowed"
                      >
                        <option value="square">مربع</option>
                        <option value="extra-rounded">دائري</option>
                        <option value="dot">نقطة</option>
                      </select>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">شكل نقاط المحاذاة</label>
                      <select
                        name="qrCodeCornerDotType"
                        value={currentDesign.qrCodeCornerDotType || 'square'}
                        onChange={handleInputChange}
                        disabled={!isQrCode}
                        className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 disabled:cursor-not-allowed"
                      >
                        <option value="square">مربع</option>
                        <option value="dot">نقطة</option>
                      </select>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">شعار وسط QR</label>
                      <div className="flex items-center gap-4">
                        <input type="file" name="qrCodeCenterImage" accept="image/*" onChange={handleFileChange} disabled={!isQrCode} className="flex-grow text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 cursor-pointer disabled:file:bg-slate-600 disabled:cursor-not-allowed"/>
                        {currentDesign.qrCodeCenterImage && (
                            <button type="button" onClick={removeCenterImage} disabled={!isQrCode} className="p-2 bg-red-800 hover:bg-red-700 text-white rounded-full transition-colors disabled:bg-slate-700" title="إزالة الشعار">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                      {currentDesign.qrCodeCenterImage && isQrCode && <img src={currentDesign.qrCodeCenterImage} alt="Preview" className="w-16 h-16 mt-2 rounded object-cover border-2 border-slate-700" />}
                    </div>
                </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">حجم الباركود ({currentDesign.qrCodeSize || 45}%)</label>
                    <input type="range" name="qrCodeSize" min="10" max="80" value={currentDesign.qrCodeSize || 45} onChange={handleInputChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">الموضع الأفقي ({currentDesign.qrCodePosX || 0}%)</label>
                    <input type="range" name="qrCodePosX" min="0" max="90" value={currentDesign.qrCodePosX || 0} onChange={handleInputChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">الموضع العامودي ({currentDesign.qrCodePosY || 0}%)</label>
                    <input type="range" name="qrCodePosY" min="0" max="90" value={currentDesign.qrCodePosY || 0} onChange={handleInputChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-lg text-slate-400 font-semibold">موضع اسم الضيف</h3>
                <div className={`space-y-4 transition-opacity ${(currentDesign.showGuestName ?? true) ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">الموضع الأفقي ({currentDesign.guestNamePosX ?? 50}%)</label>
                        <input 
                            type="range" 
                            name="guestNamePosX" 
                            min="0" 
                            max="100" 
                            value={currentDesign.guestNamePosX ?? 50} 
                            onChange={handleInputChange} 
                            disabled={!(currentDesign.showGuestName ?? true)}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">الموضع العامودي ({currentDesign.guestNamePosY ?? 65}%)</label>
                        <input 
                            type="range" 
                            name="guestNamePosY" 
                            min="0" 
                            max="100" 
                            value={currentDesign.guestNamePosY ?? 65} 
                            onChange={handleInputChange} 
                            disabled={!(currentDesign.showGuestName ?? true)}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full sm:w-auto bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <TrashIcon className="w-4 h-4" />
                    حذف
                </button>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg">إلغاء</button>
                    <button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-transform duration-200 hover:-translate-y-0.5">حفظ التصميم</button>
                </div>
            </div>
          </form>
        </div>
        
        {/* Preview */}
        <div className="w-full lg:w-1/2 bg-slate-950/50 p-4 md:p-8 flex flex-col justify-start items-center overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-slate-400 flex-shrink-0">معاينة مباشرة</h3>
            <div 
                ref={previewRef}
                className="w-full max-w-xs mx-auto aspect-[9/16] rounded-lg shadow-2xl overflow-hidden bg-cover bg-center relative flex-shrink-0"
                style={{ backgroundImage: `url(${currentDesign.backgroundImage})`}}
            >
                <div className="relative w-full h-full flex flex-col justify-start items-center p-4 text-center pt-8">
                    {/* Text Content */}
                    <div>
                        <h4 
                            className="font-bold" 
                            style={{ 
                                color: currentDesign.titleColor, 
                                fontFamily: currentDesign.titleFont || 'Tajawal',
                                fontSize: `${(currentDesign.titleFontSize || 36) * scaleFactor}px`,
                                lineHeight: 1.2
                            }}
                        >{currentDesign.titleText}</h4>
                        <p 
                            className="mt-2 whitespace-pre-wrap" 
                            style={{ 
                                color: currentDesign.bodyColor,
                                fontFamily: currentDesign.bodyFont || 'Tajawal',
                                fontSize: `${(currentDesign.bodyFontSize || 20) * scaleFactor}px`,
                            }}
                        >{currentDesign.bodyText}</p>
                        
                        {(currentDesign.showEventDates ?? true) && (
                            <p 
                                className="mt-4 whitespace-pre-wrap" 
                                style={{ 
                                    color: '#cccccc',
                                    fontFamily: 'Tajawal',
                                    fontSize: `${16 * scaleFactor}px`,
                                }}
                            >
                                🗓️ تاريخ الفعالية هنا
                            </p>
                        )}
                        
                         <p 
                            className="mt-2 whitespace-pre-wrap" 
                            style={{ 
                                color: '#cccccc',
                                fontFamily: 'Tajawal',
                                fontSize: `${16 * scaleFactor}px`,
                            }}
                        >
                            📍 موقع الفعالية هنا
                        </p>
                    </div>
                </div>
                {/* Name Placeholder */}
                {(currentDesign.showGuestName ?? true) && (
                <div
                    className="absolute w-full"
                     style={{
                        top: `${currentDesign.guestNamePosY ?? 65}%`,
                        left: 0,
                        padding: '0 10px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    <p
                        className="font-bold truncate"
                        style={{
                            color: currentDesign.nameColor || '#FFFFFF',
                            fontFamily: currentDesign.nameFont || 'Tajawal',
                            fontSize: `${(currentDesign.nameFontSize || 28) * scaleFactor}px`,
                            position: 'relative',
                            left: `${(currentDesign.guestNamePosX ?? 50) - 50}%`,
                            maxWidth: '90%'
                        }}
                    >
                        اسم الضيف
                    </p>
                </div>
                )}
                {/* Barcode Live Preview */}
                <div
                    className="absolute"
                    style={{
                        width: `${currentDesign.qrCodeSize || 45}%`,
                        height: isQrCode ? `${currentDesign.qrCodeSize || 45}%` : `${(currentDesign.qrCodeSize || 45) / 3}%`,
                        aspectRatio: 'auto',
                        top: `${currentDesign.qrCodePosY || 70}%`,
                        left: `${currentDesign.qrCodePosX || 0}%`,
                    }}
                >
                    <div
                      className="w-full h-full p-1 rounded-md shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: currentDesign.qrCodeBackgroundColor || '#ffffff' }}
                    >
                        <LiveBarcodePreview design={currentDesign} />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DesignEditorModal;