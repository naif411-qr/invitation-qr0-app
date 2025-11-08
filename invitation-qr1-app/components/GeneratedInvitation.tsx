import React, { useRef, useEffect, useCallback } from 'react';
import { Member, DesignTemplate, Group } from '../types';
import { DownloadIcon, WhatsAppIcon } from './Icons';

interface GeneratedInvitationProps {
  member: Member;
  design: DesignTemplate;
  group: Group;
}

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

const GeneratedInvitation: React.FC<GeneratedInvitationProps> = ({ member, design, group }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { name: groupName, whatsappMessageTemplate, eventStartDate, eventEndDate, locationAddress, locationLink } = group;

  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const canvasWidth = 1080;
    const canvasHeight = 1920;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const drawContent = async () => {
      // Draw Title
      ctx.fillStyle = design.titleColor;
      const titleFont = design.titleFont || 'Tajawal';
      const titleFontSize = (design.titleFontSize || 36) * 2.4;
      ctx.font = `bold ${titleFontSize}px "${titleFont}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(design.titleText, canvasWidth / 2, 192);

      // Draw Body Text
      ctx.fillStyle = design.bodyColor;
      const bodyFont = design.bodyFont || 'Tajawal';
      const bodyFontSize = (design.bodyFontSize || 20) * 2.4;
      ctx.font = `${bodyFontSize}px "${bodyFont}", sans-serif`;
      const lines = design.bodyText.split('\n');
      let y = 336;
      for (const line of lines) {
        ctx.fillText(line, canvasWidth / 2, y);
        y += (bodyFontSize * 1.5); // line height
      }

      // Draw Event Dates
      if (design.showEventDates ?? true) {
        y += 48;
        ctx.fillStyle = '#dddddd';
        ctx.font = `38px "Tajawal", sans-serif`;
        const formattedStartDate = formatDateTime(eventStartDate);
        const formattedEndDate = formatDateTime(eventEndDate);

        if (formattedStartDate) {
            ctx.fillText(`يبدأ: ${formattedStartDate}`, canvasWidth / 2, y);
            y += 60;
        }
        if (formattedEndDate) {
            ctx.fillText(`ينتهي: ${formattedEndDate}`, canvasWidth / 2, y);
            y += 60;
        }
      }
      
      // Draw Location Address
      if (locationAddress) {
        y += 24;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `43px "Tajawal", sans-serif`;
        ctx.fillText(`📍 ${locationAddress}`, canvasWidth / 2, y);
        y += 60;
      }
      
      // Draw Location Link
      if (locationLink) {
          ctx.fillStyle = '#7dd3fc'; // A light blue color to suggest a link
          ctx.font = `italic 38px "Tajawal", sans-serif`;
          ctx.fillText(locationLink, canvasWidth / 2, y);
          y += 72; // Add some space after the link
      }

      const barcodeSizePercent = design.qrCodeSize ?? 45;
      const barcodeYPercent = design.qrCodePosY ?? 70;
      const barcodeXPercent = design.qrCodePosX ?? ((100 - barcodeSizePercent) / 2);

      const barcodeWidth = canvasWidth * (barcodeSizePercent / 100);
      const barcodeX = canvasWidth * (barcodeXPercent / 100);
      const barcodeY = canvasHeight * (barcodeYPercent / 100);
      
      const isQrCode = design.barcodeType === 'qrcode' || !design.barcodeType;
      
      // Draw Member Name
      if (design.showGuestName ?? true) {
        ctx.fillStyle = design.nameColor || '#FFFFFF';
        const nameFont = design.nameFont || 'Tajawal';
        const nameFontSize = (design.nameFontSize || 28) * 2.4;
        ctx.font = `bold ${nameFontSize}px "${nameFont}", sans-serif`;
        const nameX = canvasWidth * ((design.guestNamePosX ?? 50) / 100);
        const nameY = canvasHeight * ((design.guestNamePosY ?? 65) / 100);
        ctx.fillText(member.name, nameX, nameY);
      }

      // Draw Barcode
      if (!isQrCode) { // Code128 - using bwip-js for superior print quality
          // باركود شريطي يحتاج عرض أكبر وارتفاع أكبر
          const barcodeDisplayWidth = barcodeWidth * 1.4;  // زيادة العرض 40%
          const barcodeHeight = barcodeWidth / 1.5;  // ارتفاع أكبر بكثير (كان /3)
          const barcodeCanvas = document.createElement('canvas');
          
          try {
              // استخدام bwip-js - أفضل مكتبة للباركود الاحترافي
              const barcodeColor = (design.qrCodeColor || '#000000').replace('#', '');
              const backgroundColor = (design.qrCodeBackgroundColor || '#FFFFFF').replace('#', '');
              
              window.bwipjs.toCanvas(barcodeCanvas, {
                  bcid: 'code128',       // نوع الباركود
                  text: member.ticketNumber || member.id,       // البيانات (رقم التذكرة القصير)
                  scale: 5,              // دقة عالية جداً (5x = ~360 DPI)
                  height: 15,            // ارتفاع بالملليمتر
                  includetext: false,    // إخفاء النص
                  barcolor: barcodeColor,        // لون الباركود
                  backgroundcolor: backgroundColor,  // لون الخلفية
                  paddingwidth: 5,       // مسافة جانبية
                  paddingheight: 5,      // مسافة علوية/سفلية
              });
              
              // رسم الباركود بدون تنعيم للحصول على حواف حادة
              const actualWidth = barcodeCanvas.width;
              const actualHeight = barcodeCanvas.height;
              
              ctx.imageSmoothingEnabled = false;
              
              // حساب النسبة للحفاظ على الأبعاد - استخدام barcodeDisplayWidth
              const scale = Math.min(barcodeDisplayWidth / actualWidth, barcodeHeight / actualHeight);
              const drawWidth = actualWidth * scale;
              const drawHeight = actualHeight * scale;
              const drawX = barcodeX - (barcodeDisplayWidth - barcodeWidth) / 2;  // توسيط مع العرض الجديد
              const drawY = barcodeY + (barcodeHeight - drawHeight) / 2;
              
              ctx.drawImage(barcodeCanvas, drawX, drawY, drawWidth, drawHeight);
              ctx.imageSmoothingEnabled = true;
              
          } catch (e) {
              console.error(`Failed to generate barcode for ID "${member.id}":`, e);
              
              ctx.fillStyle = '#111827';
              ctx.fillRect(barcodeX, barcodeY, barcodeWidth, barcodeHeight);
              ctx.fillStyle = 'red';
              ctx.font = '48px "Tajawal"';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('خطأ في الباركود', barcodeX + barcodeWidth / 2, barcodeY + barcodeHeight / 2);
          }
      } else { // QR Code
          const qrCodeStyling = new window.QRCodeStyling({
            width: 512,
            height: 512,
            data: member.ticketNumber || member.id,  // Use ticketNumber for QR too
            margin: 10,
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
            backgroundOptions: { color: design.qrCodeBackgroundColor || '#ffffff' },
            image: design.qrCodeCenterImage,
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.4,
                margin: 4
            }
          });

          const qrBlob = await qrCodeStyling.getRawData('png');
          const qrImageBitmap = qrBlob ? await createImageBitmap(qrBlob) : null;
          if (qrImageBitmap) {
            ctx.drawImage(qrImageBitmap, barcodeX, barcodeY, barcodeWidth, barcodeWidth);
          }
      }
    };
    
    if (design.backgroundImage) {
        const bgImage = new Image();
        bgImage.crossOrigin = 'anonymous';
        bgImage.src = design.backgroundImage;
        bgImage.onload = () => {
            ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
            drawContent();
        };
        bgImage.onerror = () => {
            console.error("Could not load background image.");
            ctx.fillStyle = '#1e293b'; // Fallback background
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            drawContent();
        };
    } else {
        ctx.fillStyle = '#1e293b'; // Default background
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        drawContent();
    }
  }, [design, member, group]);

  useEffect(() => {
    // A short timeout to ensure the canvas element is ready.
    const timeoutId = setTimeout(drawCanvas, 50);
    return () => clearTimeout(timeoutId);
  }, [drawCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      const fileName = `دعوة_${groupName.replace(/\s+/g, '_')}_${member.name.replace(/\s+/g, '_')}.png`;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handleShare = async () => {
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

    const invitationMessage = messageTemplate
      .replace(/{memberName}/g, member.name)
      .replace(/{eventName}/g, groupName)
      .replace(/{eventStartDate}/g, formattedStartDate)
      .replace(/{eventEndDate}/g, formattedEndDate)
      .replace(/{eventLocationAddress}/g, locationAddress || '')
      .replace(/{eventLocationLink}/g, locationLink || '');

    const canvas = canvasRef.current;
    if (!canvas) return;

    // تحميل الصورة تلقائياً
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    const fileName = `دعوة_${groupName.replace(/\s+/g, '_')}_${member.name.replace(/\s+/g, '_')}.png`;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // فتح واتساب مباشرة
    setTimeout(() => {
      const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(invitationMessage)}`;
      window.open(whatsappUrl, '_blank');
    }, 300);
  };


  return (
    <div className="bg-slate-800 p-4 rounded-lg text-center flex flex-col">
      <h4 className="font-bold mb-2 truncate">{member.name}</h4>
      <canvas ref={canvasRef} className="w-full h-auto aspect-[9/16] rounded-md" />
      <div className="mt-4 flex gap-2">
        <button 
          onClick={handleDownload} 
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
        >
          <DownloadIcon className="w-5 h-5" />
          <span>تحميل</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
        >
          <WhatsAppIcon className="w-5 h-5" />
          <span>واتساب</span>
        </button>
      </div>
    </div>
  );
};

export default GeneratedInvitation;