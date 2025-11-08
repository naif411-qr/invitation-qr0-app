import { Member, DesignTemplate, Group } from '../types';

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

export async function generateAndDownloadInvitation(
    member: Member, 
    design: DesignTemplate, 
    group: Group
): Promise<void> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Unable to get canvas context');
    }
    
    const canvasWidth = 1080;
    const canvasHeight = 1920;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    await new Promise<void>((resolve, reject) => {
        const drawContent = async () => {
            try {
                ctx.fillStyle = design.titleColor;
                const titleFont = design.titleFont || 'Tajawal';
                const titleFontSize = (design.titleFontSize || 36) * 2.4;
                ctx.font = `bold ${titleFontSize}px "${titleFont}", sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(design.titleText, canvasWidth / 2, 192);

                ctx.fillStyle = design.bodyColor;
                const bodyFont = design.bodyFont || 'Tajawal';
                const bodyFontSize = (design.bodyFontSize || 20) * 2.4;
                ctx.font = `${bodyFontSize}px "${bodyFont}", sans-serif`;
                const lines = design.bodyText.split('\n');
                let y = 336;
                for (const line of lines) {
                    ctx.fillText(line, canvasWidth / 2, y);
                    y += (bodyFontSize * 1.5);
                }

                if (design.showEventDates ?? true) {
                    y += 48;
                    ctx.fillStyle = '#dddddd';
                    ctx.font = `38px "Tajawal", sans-serif`;
                    const formattedStartDate = formatDateTime(group.eventStartDate);
                    const formattedEndDate = formatDateTime(group.eventEndDate);

                    if (formattedStartDate) {
                        ctx.fillText(`يبدأ: ${formattedStartDate}`, canvasWidth / 2, y);
                        y += 60;
                    }
                    if (formattedEndDate) {
                        ctx.fillText(`ينتهي: ${formattedEndDate}`, canvasWidth / 2, y);
                        y += 60;
                    }
                }
                
                if (group.locationAddress) {
                    y += 24;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = `43px "Tajawal", sans-serif`;
                    ctx.fillText(`📍 ${group.locationAddress}`, canvasWidth / 2, y);
                    y += 60;
                }
                
                if (group.locationLink) {
                    ctx.fillStyle = '#7dd3fc';
                    ctx.font = `italic 38px "Tajawal", sans-serif`;
                    ctx.fillText(group.locationLink, canvasWidth / 2, y);
                    y += 72;
                }

                const barcodeSizePercent = design.qrCodeSize ?? 45;
                const barcodeYPercent = design.qrCodePosY ?? 70;
                const barcodeXPercent = design.qrCodePosX ?? ((100 - barcodeSizePercent) / 2);

                const barcodeWidth = canvasWidth * (barcodeSizePercent / 100);
                const barcodeX = canvasWidth * (barcodeXPercent / 100);
                const barcodeY = canvasHeight * (barcodeYPercent / 100);
                
                const isQrCode = design.barcodeType === 'qrcode' || !design.barcodeType;
                
                if (design.showGuestName ?? true) {
                    ctx.fillStyle = design.nameColor || '#FFFFFF';
                    const nameFont = design.nameFont || 'Tajawal';
                    const nameFontSize = (design.nameFontSize || 28) * 2.4;
                    ctx.font = `bold ${nameFontSize}px "${nameFont}", sans-serif`;
                    const nameX = canvasWidth * ((design.guestNamePosX ?? 50) / 100);
                    const nameY = canvasHeight * ((design.guestNamePosY ?? 65) / 100);
                    ctx.fillText(member.name, nameX, nameY);
                }

                if (!isQrCode) {
                    const barcodeDisplayWidth = barcodeWidth * 1.4;
                    const barcodeHeight = barcodeWidth / 1.5;
                    const barcodeCanvas = document.createElement('canvas');
                    
                    try {
                        const barcodeColor = (design.qrCodeColor || '#000000').replace('#', '');
                        const backgroundColor = (design.qrCodeBackgroundColor || '#FFFFFF').replace('#', '');
                        
                        (window as any).bwipjs.toCanvas(barcodeCanvas, {
                            bcid: 'code128',
                            text: member.ticketNumber || member.id,
                            scale: 5,
                            height: 15,
                            includetext: false,
                            barcolor: barcodeColor,
                            backgroundcolor: backgroundColor,
                            paddingwidth: 5,
                            paddingheight: 5,
                        });
                        
                        const actualWidth = barcodeCanvas.width;
                        const actualHeight = barcodeCanvas.height;
                        
                        ctx.imageSmoothingEnabled = false;
                        
                        const scale = Math.min(barcodeDisplayWidth / actualWidth, barcodeHeight / actualHeight);
                        const drawWidth = actualWidth * scale;
                        const drawHeight = actualHeight * scale;
                        const drawX = barcodeX - (barcodeDisplayWidth - barcodeWidth) / 2;
                        const drawY = barcodeY + (barcodeHeight - drawHeight) / 2;
                        
                        ctx.drawImage(barcodeCanvas, drawX, drawY, drawWidth, drawHeight);
                        ctx.imageSmoothingEnabled = true;
                        
                    } catch (e) {
                        console.error(`Failed to generate barcode:`, e);
                        ctx.fillStyle = '#111827';
                        ctx.fillRect(barcodeX, barcodeY, barcodeWidth, barcodeHeight);
                        ctx.fillStyle = 'red';
                        ctx.font = '48px "Tajawal"';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('خطأ في الباركود', barcodeX + barcodeWidth / 2, barcodeY + barcodeHeight / 2);
                    }
                } else {
                    const QRCodeStyling = (window as any).QRCodeStyling;
                    const qrCodeStyling = new QRCodeStyling({
                        width: 512,
                        height: 512,
                        data: member.ticketNumber || member.id,
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

                resolve();
            } catch (error) {
                reject(error);
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
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                drawContent();
            };
        } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            drawContent();
        }
    });

    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    const fileName = `دعوة_${group.name.replace(/\s+/g, '_')}_${member.name.replace(/\s+/g, '_')}.png`;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

export function getWhatsAppMessage(member: Member, group: Group): string {
    let defaultMessage = `مرحباً {memberName},\n\nأنت مدعو/ة لحضور "{eventName}".`;
    if (group.locationAddress) {
        defaultMessage += `\n\n📍 العنوان: ${group.locationAddress}`;
    }
    if (group.locationLink) {
        defaultMessage += `\n\n🗺️ رابط الموقع: ${group.locationLink}`;
    }
    defaultMessage += `\n\nالرجاء استخدام هذه الصورة للدخول. نتطلع لرؤيتك!`;
    
    const messageTemplate = group.whatsappMessageTemplate || defaultMessage;
    
    const formattedStartDate = formatDateTime(group.eventStartDate);
    const formattedEndDate = formatDateTime(group.eventEndDate);

    return messageTemplate
        .replace(/{memberName}/g, member.name)
        .replace(/{eventName}/g, group.name)
        .replace(/{eventStartDate}/g, formattedStartDate)
        .replace(/{eventEndDate}/g, formattedEndDate)
        .replace(/{eventLocationAddress}/g, group.locationAddress || '')
        .replace(/{eventLocationLink}/g, group.locationLink || '');
}
