import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Member, ScanLog, AuthenticatedUser } from '../types';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from './Icons';
import { membersAPI, scanLogsAPI } from '../lib/api';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useTheme } from '../contexts/ThemeContext';

interface ScannerProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  scanLogs: ScanLog[];
  setScanLogs: React.Dispatch<React.SetStateAction<ScanLog[]>>;
  currentUser?: AuthenticatedUser;
}

type BarcodeType = 'all' | 'qr' | 'barcode';

const Scanner: React.FC<ScannerProps> = ({ members, setMembers, scanLogs, setScanLogs, currentUser }) => {
  const { theme } = useTheme();
  
  // Filter scan logs based on user role
  const filteredScanLogs = useMemo(() => {
    if (currentUser && currentUser.role === 'scanner') {
      return scanLogs.filter(log => log.scannedBy === currentUser.username);
    }
    return scanLogs;
  }, [scanLogs, currentUser]);
  const [inputValue, setInputValue] = useState('');
  const [lastScan, setLastScan] = useState<ScanLog | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('all');

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = "qr-reader";
  
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      setTimeout(() => audioContext.close(), 600);
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  };
  
  const playErrorSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      setTimeout(() => audioContext.close(), 400);
    } catch (error) {
      console.error('Error playing error sound:', error);
    }
  };


  const handleScan = useCallback(async (qrData: string) => {
    if (!qrData) return;
    
    const wasScanning = isScanning;
    setIsScanning(false);
    
    try {
      let newLog: ScanLog;
      // Search by ticketNumber first, then fallback to ID (for backward compatibility)
      const memberIndex = members.findIndex(m => m.ticketNumber === qrData || m.id === qrData);

      if (memberIndex !== -1) {
        const member = members[memberIndex];
        if (member.scanCount < member.scanLimit) {
          const updatedMember = await membersAPI.update(member.id, {
            scanCount: member.scanCount + 1
          });
          
          newLog = {
            id: new Date().toISOString(),
            memberId: member.id,
            memberName: member.name,
            scannedAt: new Date().toLocaleString('ar-SA'),
            status: 'success',
            scannedBy: currentUser?.username
          };
          const createdLog = await scanLogsAPI.create(newLog);
          
          playSuccessSound();
          
          const updatedMembers = [...members];
          updatedMembers[memberIndex] = updatedMember;
          setMembers(updatedMembers);
          setScanLogs([createdLog, ...scanLogs]);
          setLastScan(createdLog);
        } else {
          newLog = {
            id: new Date().toISOString(),
            memberId: member.id,
            memberName: member.name,
            scannedAt: new Date().toLocaleString('ar-SA'),
            status: 'limit_reached',
            scannedBy: currentUser?.username
          };
          const createdLog = await scanLogsAPI.create(newLog);
          
          playErrorSound();
          
          setScanLogs([createdLog, ...scanLogs]);
          setLastScan(createdLog);
        }
      } else {
        newLog = {
          id: new Date().toISOString(),
          memberId: qrData,
          memberName: 'غير معروف',
          scannedAt: new Date().toLocaleString('ar-SA'),
          status: 'invalid',
          scannedBy: currentUser?.username
        };
        const createdLog = await scanLogsAPI.create(newLog);
        
        playErrorSound();
        
        setScanLogs([createdLog, ...scanLogs]);
        setLastScan(createdLog);
      }

      setTimeout(() => {
        setLastScan(null);
        setIsScanning(wasScanning);
      }, 2000);
    } catch (error) {
      console.error('Error processing scan:', error);
      setIsScanning(wasScanning);
    }
  }, [members, setMembers, setScanLogs, isScanning]);

  useEffect(() => {
    if (!isScanning) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const getFormatsToSupport = () => {
      if (barcodeType === 'qr') {
        return [0]; // QR_CODE only
      } else if (barcodeType === 'barcode') {
        // Support all common barcode formats
        return [
          2,   // CODABAR
          3,   // CODE_39
          4,   // CODE_93
          5,   // CODE_128
          8,   // ITF
          9,   // EAN_13
          10,  // EAN_8
          14,  // UPC_A
          15,  // UPC_E
        ];
      } else {
        // Support both QR and all barcodes
        return [
          0,   // QR_CODE
          2,   // CODABAR
          3,   // CODE_39
          4,   // CODE_93
          5,   // CODE_128
          8,   // ITF
          9,   // EAN_13
          10,  // EAN_8
          14,  // UPC_A
          15,  // UPC_E
        ];
      }
    };

    const config = {
      fps: 30,
      qrbox: barcodeType === 'barcode' 
        ? { width: 350, height: 120 } 
        : barcodeType === 'qr'
        ? { width: 250, height: 250 }
        : { width: 300, height: 150 },
      aspectRatio: barcodeType === 'qr' ? 1.0 : 1.777778,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      formatsToSupport: getFormatsToSupport(),
    };

    const onScanSuccess = (decodedText: string) => {
      handleScan(decodedText);
      if (scannerRef.current) {
        scannerRef.current.pause(true);
        setTimeout(() => {
          if (scannerRef.current) {
            scannerRef.current.resume();
          }
        }, 2000);
      }
    };

    const onScanError = (_errorMessage: string) => {
      // Ignore scan errors
    };

    try {
      scannerRef.current = new Html5QrcodeScanner(scannerDivId, config, false);
      scannerRef.current.render(onScanSuccess, onScanError);
      setCameraError(null);
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setCameraError("فشل تشغيل الكاميرا. تأكد من إعطاء الإذن للوصول إلى الكاميرا.");
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isScanning, handleScan, barcodeType]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleScan(inputValue.trim());
      setInputValue('');
    }
  };

  const getStatusMessage = () => {
    if (!lastScan) return '';
    
    if (lastScan.status === 'success') {
      return `تم تسجيل دخول ${lastScan.memberName} بنجاح ✓`;
    } else if (lastScan.status === 'limit_reached') {
      return `تحذير: ${lastScan.memberName} تجاوز الحد المسموح`;
    } else {
      return 'خطأ: الباركود غير مسجل في النظام';
    }
  };

  const getStatusColor = () => {
    if (!lastScan) {
      if (theme === 'dark') {
        return 'bg-slate-800/50 backdrop-blur-md border-slate-700';
      }
      return 'bg-white border-slate-200';
    }
    
    if (lastScan.status === 'success') {
      if (theme === 'dark') {
        return 'bg-green-500/20 backdrop-blur-md border-green-500/50 shadow-lg shadow-green-500/20';
      }
      return 'bg-green-50 border-green-500 shadow-lg shadow-green-200';
    } else if (lastScan.status === 'limit_reached') {
      if (theme === 'dark') {
        return 'bg-yellow-500/20 backdrop-blur-md border-yellow-500/50 shadow-lg shadow-yellow-500/20';
      }
      return 'bg-yellow-50 border-yellow-500 shadow-lg shadow-yellow-200';
    } else {
      if (theme === 'dark') {
        return 'bg-red-500/20 backdrop-blur-md border-red-500/50 shadow-lg shadow-red-500/20';
      }
      return 'bg-red-50 border-red-500 shadow-lg shadow-red-200';
    }
  };

  const isDark = theme === 'dark';

  const getFullScreenOverlayBg = () => {
    if (!lastScan) return '';
    
    if (lastScan.status === 'success') {
      return isDark 
        ? 'bg-gradient-to-br from-green-900/95 via-green-800/95 to-emerald-900/95' 
        : 'bg-gradient-to-br from-green-100/95 via-green-50/95 to-emerald-100/95';
    } else if (lastScan.status === 'limit_reached') {
      return isDark 
        ? 'bg-gradient-to-br from-yellow-900/95 via-yellow-800/95 to-orange-900/95' 
        : 'bg-gradient-to-br from-yellow-100/95 via-yellow-50/95 to-orange-100/95';
    } else {
      return isDark 
        ? 'bg-gradient-to-br from-red-900/95 via-red-800/95 to-pink-900/95' 
        : 'bg-gradient-to-br from-red-100/95 via-red-50/95 to-pink-100/95';
    }
  };

  const getFullScreenIcon = () => {
    if (!lastScan) return null;
    
    const iconClasses = "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64";
    
    if (lastScan.status === 'success') {
      return <CheckCircleIcon className={`${iconClasses} text-green-500 drop-shadow-2xl animate-bounce`} />;
    } else if (lastScan.status === 'limit_reached') {
      return <ExclamationTriangleIcon className={`${iconClasses} text-yellow-500 drop-shadow-2xl animate-bounce`} />;
    } else {
      return <XCircleIcon className={`${iconClasses} text-red-500 drop-shadow-2xl animate-shake`} />;
    }
  };

  return (
    <>
      {/* Full Screen Overlay - عرض كامل الشاشة */}
      {lastScan && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl ${getFullScreenOverlayBg()} animate-fadeIn`}>
          <div className="text-center px-4 sm:px-6 md:px-8 animate-scaleIn">
            {/* الأيقونة الكبيرة */}
            <div className="mb-6 sm:mb-8 md:mb-10">
              {getFullScreenIcon()}
            </div>
            
            {/* الرسالة الرئيسية */}
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {getStatusMessage()}
            </h1>
            
            {/* الوقت */}
            <p className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>
              {lastScan.scannedAt}
            </p>

            {/* خط زخرفي */}
            <div className="mt-8 sm:mt-10 md:mt-12 flex items-center justify-center gap-4">
              <div className={`h-1 w-20 sm:w-32 rounded-full ${
                lastScan.status === 'success' 
                  ? 'bg-green-500' 
                  : lastScan.status === 'limit_reached' 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}></div>
              <div className={`w-3 h-3 rounded-full ${
                lastScan.status === 'success' 
                  ? 'bg-green-500' 
                  : lastScan.status === 'limit_reached' 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}></div>
              <div className={`h-1 w-20 sm:w-32 rounded-full ${
                lastScan.status === 'success' 
                  ? 'bg-green-500' 
                  : lastScan.status === 'limit_reached' 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}></div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header - Status Display */}
        <div className={`border-4 rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 transition-all duration-300 ${getStatusColor()}`}>
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 sm:mb-6">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-teal-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent text-center`}>
              ماسح الباركود
            </h2>
            <p className={`text-sm sm:text-base md:text-lg text-center ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              وجّه الكاميرا نحو رمز QR أو الباركود
            </p>
          </div>
        </div>

      {/* Error Alert */}
      {cameraError && (
        <div className={`rounded-xl px-4 py-3 mb-4 sm:mb-6 border-2 ${
          isDark 
            ? 'bg-red-500/20 border-red-500/50 text-red-300 backdrop-blur-sm' 
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          <p className="font-bold flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            {cameraError}
          </p>
          {!window.location.protocol.includes('https') && (
            <p className="text-sm mt-2 opacity-90">
              ملاحظة: قد تحتاج إلى استخدام HTTPS لتفعيل الكاميرا على الجوال.
            </p>
          )}
        </div>
      )}

      {/* Main Content Grid - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Barcode Type Selector */}
          <div className={`rounded-2xl shadow-lg p-4 sm:p-6 border transition-all ${
            isDark 
              ? 'bg-slate-800/50 backdrop-blur-md border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <label className={`block text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              نوع الباركود
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => { setIsScanning(false); setBarcodeType('all'); }}
                className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold transition-all text-sm sm:text-base ${
                  barcodeType === 'all' 
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/50 scale-105' 
                    : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="block">📷</span>
                <span className="text-xs sm:text-sm">الكل</span>
              </button>
              <button
                onClick={() => { setIsScanning(false); setBarcodeType('qr'); }}
                className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold transition-all text-sm sm:text-base ${
                  barcodeType === 'qr' 
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/50 scale-105' 
                    : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="block">⬛</span>
                <span className="text-xs sm:text-sm">QR</span>
              </button>
              <button
                onClick={() => { setIsScanning(false); setBarcodeType('barcode'); }}
                className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold transition-all text-sm sm:text-base ${
                  barcodeType === 'barcode' 
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/50 scale-105' 
                    : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="block">▬</span>
                <span className="text-xs sm:text-sm">شريطي</span>
              </button>
            </div>
          </div>

          {/* Start/Stop Button */}
          <div className={`rounded-2xl shadow-lg p-4 sm:p-6 border transition-all ${
            isDark 
              ? 'bg-slate-800/50 backdrop-blur-md border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-white text-base sm:text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 sm:gap-3 ${
                isScanning 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-500/50' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/50'
              }`}
            >
              {isScanning ? (
                <>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                  <span>إيقاف المسح</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>بدء المسح</span>
                </>
              )}
            </button>
          </div>

          {/* Manual Input */}
          <div className={`rounded-2xl shadow-lg p-4 sm:p-6 border transition-all ${
            isDark 
              ? 'bg-slate-800/50 backdrop-blur-md border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              إدخال يدوي
            </h3>
            <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="أدخل رقم الباركود"
                className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 transition-all text-sm sm:text-base ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-teal-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-teal-500'
                } focus:outline-none focus:ring-2 focus:ring-teal-500/50`}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/50 transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                قراءة
              </button>
            </form>
          </div>
        </div>

        {/* Middle/Right Column - Scanner and Logs */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Scanner Area */}
          {isScanning && (
            <div className={`rounded-2xl shadow-lg p-4 sm:p-6 border transition-all ${
              isDark 
                ? 'bg-slate-800/50 backdrop-blur-md border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              <div id={scannerDivId} className="rounded-xl overflow-hidden"></div>
            </div>
          )}

          {/* Scan Logs */}
          <div className={`rounded-2xl shadow-lg p-4 sm:p-6 border transition-all ${
            isDark 
              ? 'bg-slate-800/50 backdrop-blur-md border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-5 flex items-center gap-2 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              آخر عمليات المسح
            </h3>
            {filteredScanLogs.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-slate-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  لا توجد عمليات مسح بعد
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-96 lg:max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredScanLogs.slice(0, 20).map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 sm:p-4 rounded-xl border-r-4 transition-all hover:scale-[1.02] ${
                      log.status === 'success'
                        ? isDark
                          ? 'bg-green-500/10 border-green-500 hover:bg-green-500/20'
                          : 'bg-green-50 border-green-500 hover:bg-green-100'
                        : log.status === 'limit_reached'
                        ? isDark
                          ? 'bg-yellow-500/10 border-yellow-500 hover:bg-yellow-500/20'
                          : 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100'
                        : isDark
                        ? 'bg-red-500/10 border-red-500 hover:bg-red-500/20'
                        : 'bg-red-50 border-red-500 hover:bg-red-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm sm:text-base ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {log.memberName}
                        </span>
                        {log.status === 'success' && (
                          <span className="text-green-600 text-xs sm:text-sm font-semibold flex items-center gap-1">
                            <CheckCircleIcon className="w-4 h-4" />
                            نجح
                          </span>
                        )}
                        {log.status === 'limit_reached' && (
                          <span className="text-yellow-600 text-xs sm:text-sm font-semibold flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            تحذير
                          </span>
                        )}
                        {log.status === 'invalid' && (
                          <span className="text-red-600 text-xs sm:text-sm font-semibold flex items-center gap-1">
                            <XCircleIcon className="w-4 h-4" />
                            خطأ
                          </span>
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {log.scannedAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(100, 116, 139, 0.5)' : 'rgba(148, 163, 184, 0.5)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(100, 116, 139, 0.7)' : 'rgba(148, 163, 184, 0.7)'};
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
      </div>
    </>
  );
};

export default Scanner;
