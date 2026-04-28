import React from 'react';
import QRCode from 'react-qr-code';
import { X, Download, Share2, Printer } from 'lucide-react';
import { motion } from 'motion/react';

interface QRCodeGeneratorProps {
  value: string;
  title?: string;
  onClose: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, title, onClose }) => {
  const downloadQR = () => {
    const svg = document.getElementById("sumer-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `SumerQR_${title || 'Code'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-white">مولد الرموز الذكي</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                مشاركة الكود مع الطلاب
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

        {/* QR Code Area */}
        <div className="flex flex-col items-center justify-center p-8 bg-white m-6 rounded-3xl">
          <div className="p-4 bg-white">
            <QRCode 
              id="sumer-qr"
              value={value} 
              size={200}
              level="H"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
          {title && (
            <p className="mt-4 text-center font-bold text-slate-900 text-sm">
              {title}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 p-6 pt-0">
          <button
            onClick={downloadQR}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>تحميل الرمز</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-xs font-black text-white border border-white/10 transition-all hover:bg-white/10 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة الرمز</span>
          </button>
        </div>

        <div className="mb-6 flex justify-center px-6">
          <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            <span>Sumer Encryption Standard</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
