import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, Scan, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SumerScannerProps {
  onScan: (decodedText: string) => void;
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const SumerScanner: React.FC<SumerScannerProps> = ({ onScan, onCapture, onClose }) => {
  const [mode, setMode] = useState<'scan' | 'photo'>('scan');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (mode === 'scan') {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        onScan(decodedText);
        scanner.clear();
        onClose();
      }, (error) => {
        // console.error(error);
      });

      scannerRef.current = scanner;
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      startPhotoCamera();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      stopPhotoCamera();
    };
  }, [mode]);

  const startPhotoCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const stopPhotoCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
        onClose();
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
              {mode === 'scan' ? <Scan className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-black text-white">{mode === 'scan' ? 'ماسح الـ QR' : 'كاميرا سومر الاحترافية'}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {mode === 'scan' ? 'قم بتوجيه الكاميرا نحو الرمز' : 'التقط صوراً عالية الدقة لمداركك'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Area */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          {mode === 'scan' ? (
            <div id="qr-reader" className="w-full h-full border-none" />
          ) : (
            <div className="relative w-full h-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none" />
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
                <button
                  onClick={capturePhoto}
                  className="group relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 p-1 transition-all active:scale-95"
                >
                  <div className="h-full w-full rounded-full bg-white transition-opacity group-hover:opacity-90" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="flex items-center justify-between bg-white/5 p-6">
          <div className="flex items-center gap-2 rounded-2xl bg-black/20 p-1">
            <button
              onClick={() => setMode('scan')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                mode === 'scan' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scan className="h-4 w-4" />
              <span>ماسح QR</span>
            </button>
            <button
              onClick={() => setMode('photo')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                mode === 'photo' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>تصوير احترافي</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sumer Optical Unit Active</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
