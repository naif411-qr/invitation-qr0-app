import React, { useRef, useCallback, useEffect } from 'react';
import { Member, DesignTemplate } from '../types';
import { WhatsAppIcon } from './Icons';

interface QRCodeModalProps {
  member: Member | null;
  onClose: () => void;
  eventName: string;
  design?: DesignTemplate;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ member, onClose, eventName, design }) => {
  const barcodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barcodeRef.current || !member) return;
    
    barcodeRef.current.innerHTML = ''; // Clear previous barcode

    if (design?.barcodeType === 'code128' || design?.barcodeType === 'codabar') {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        barcodeRef.current.appendChild(canvas);

        try {
            window.bwipjs.toCanvas(canvas, {
                bcid: design.barcodeType,
                text: member.id,
                scale: 3,
                height: 10,
                includetext: true,
                textxalign: 'center',
                textsize: 12,
                backgroundcolor: (design?.qrCodeBackgroundColor || '#ffffff').replace('#', ''),
                barcolor: (design?.qrCodeColor || '#000000').replace('#', ''),
            });
        } catch (e) {
            console.warn(`Failed to generate ${design.barcodeType} for ID "${member.id}". Falling back to Code128. Error:`, e);
            try {
                window.bwipjs.toCanvas(canvas, {
                    bcid: 'code128',
                    text: member.id,
                    scale: 3,
                    height: 10,
                    includetext: true,
                    textxalign: 'center',
                    textsize: 12,
                    backgroundcolor: (design?.qrCodeBackgroundColor || '#ffffff').replace('#', ''),
                    barcolor: (design?.qrCodeColor || '#000000').replace('#', ''),
                });
            } catch (fallbackError) {
                console.error(`Failed to generate fallback Code128 barcode for ID "${member.id}":`, fallbackError);
                barcodeRef.current!.innerHTML = '<p class="text-red-500 text-xs text-center">خطأ في إنشاء الباركود. البيانات غير صالحة للنوع المحدد.</p>';
            }
        }
    } else { // Default to qrcode
        const qrCodeStyling = new window.QRCodeStyling({
            width: 256,
            height: 256,
            data: member.id,
            margin: 10,
            qrOptions: { errorCorrectionLevel: 'H' },
            dotsOptions: {
                type: design?.qrCodeStyle || 'squares',
                color: design?.qrCodeColor || '#000000'
            },
            backgroundOptions: { color: design?.qrCodeBackgroundColor || '#ffffff' },
            cornersSquareOptions: {
                type: design?.qrCodeCornerSquareType || 'square',
            },
            cornersDotOptions: {
                type: design?.qrCodeCornerDotType || 'square',
            },
            image: design?.qrCodeCenterImage,
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.4,
                margin: 4,
            }
        });
        qrCodeStyling.append(barcodeRef.current);
    }
  }, [member, design]);


  const downloadBarcode = useCallback(() => {
    if (barcodeRef.current) {
      const canvas = barcodeRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');
        let downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `Barcode_${member?.name.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  }, [member]);

  if (!member) return null;

  const invitationMessage = `
    مرحباً ${member.name},

    أنت مدعو/ة لحضور "${eventName}".
    الرجاء إظهار الباركود المرفق عند الدخول.
    
    هذه الدعوة صالحة لـ ${member.scanLimit} مرة/مرات.
    
    ننتظر حضورك!
  `;
  const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(invitationMessage)}`;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-60 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 p-8 w-full max-w-md mx-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-400">دعوة ${member.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>
        
        <div
          className="p-4 rounded-lg flex justify-center items-center mb-6 min-h-[150px]"
          style={{ backgroundColor: design?.qrCodeBackgroundColor || '#ffffff' }}
        >
           <div ref={barcodeRef} className="w-full max-w-[280px]">
             {/* Barcode will be appended here by useEffect */}
           </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button onClick={downloadBarcode} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 hover:-translate-y-0.5">
            تحميل صورة الباركود
          </button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 hover:-translate-y-0.5">
            <WhatsAppIcon className="w-5 h-5 ms-2" />
            <span>إرسال عبر واتساب</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;