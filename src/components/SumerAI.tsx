import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, MessageSquare, Maximize2, Minimize2, Mic, MicOff, Paperclip, FileText, Image as ImageIcon, Copy, Check, Volume2, VolumeX, Square, Play, Eye, Code2, Shield, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { chatWithSumer, textToSpeech, playAudio, stopAudio } from '../services/geminiService';
import { ChatMessage, Attachment } from '../types';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn } from '../lib/utils';

const CodeBlock = ({ children, className }: { children: any, className?: string }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const language = className?.replace('language-', '') || 'text';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPreviewable = ['html', 'tsx', 'jsx', 'javascript', 'typescript', 'css'].includes(language);

  const getPreviewContent = () => {
    if (language === 'html') return code;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>body { font-family: sans-serif; }</style>
        </head>
        <body>
          ${language === 'html' ? code : `<div id="root"></div>`}
          ${language !== 'html' ? `<script>${code}</script>` : ''}
        </body>
      </html>
    `;
  };

  const inline = !className;

  if (inline) {
    return <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-blue-300">{children}</code>;
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
      <div className="flex items-center justify-between bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <div className="flex items-center gap-3">
          <span>{language}</span>
          {isPreviewable && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1 transition-colors ${showPreview ? 'text-emerald-400' : 'hover:text-white'}`}
            >
              {showPreview ? <Code2 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showPreview ? 'معاينة' : 'عرض'}</span>
            </button>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 transition-colors hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">تم</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>
      <div className="relative">
        {showPreview ? (
          <div className="h-[300px] w-full bg-white overflow-hidden">
            <iframe
              title="Sumer Code Preview"
              srcDoc={getPreviewContent()}
              className="h-full w-full border-none"
              sandbox="allow-scripts allow-forms"
            />
          </div>
        ) : (
          <div className="overflow-x-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
            <code className={className}>{children}</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SumerAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chat history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'chatInteractions'),
          where('studentId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const history: ChatMessage[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          history.push({
            role: 'user',
            content: data.message || '',
            attachments: [] 
          });
          if (data.response) {
            history.push({
              role: 'model',
              content: data.response
            });
          }
        });
        
        if (history.length > 0) {
          setMessages(history);
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPendingAttachments(prev => [...prev, {
          data: base64String,
          mimeType: file.type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ar-IQ';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setInput(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
            alert('عذراً، يرجى السماح بالوصول للميكروفون أو فتح التطبيق في نافذة جديدة إذا كنت تستخدم المعاينة.');
          }
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setVoiceMode(true);
    }
    setIsRecording(!isRecording);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    handleFiles(files);
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const currentAttachments = [...pendingAttachments];
    const usedVoice = voiceMode;

    setInput('');
    setPendingAttachments([]);
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage || 'أرسل مرفقات', 
      attachments: currentAttachments 
    }]);
    setIsLoading(true);

    try {
      const response = await chatWithSumer(messages, userMessage || 'حلل هذه المرفقات', currentAttachments);
      setMessages(prev => [...prev, { role: 'model', content: response }]);

      try {
        await addDoc(collection(db, 'chatInteractions'), {
          studentId: auth.currentUser?.uid || 'anonymous',
          studentEmail: auth.currentUser?.email || null,
          message: userMessage,
          hasAttachments: currentAttachments.length > 0,
          response: response,
          timestamp: serverTimestamp()
        });
      } catch (logError) {
        console.error("Failed to log interaction:", logError);
      }

      if (usedVoice) {
        const audioData = await textToSpeech(response);
        if (audioData) {
          playAudio(audioData);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: 'عذراً، حدث خطأ في التواصل مع خوادم سومر. يرجى المحاولة لاحقاً.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        id="sumer-ai-trigger"
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-[0_10px_30px_rgba(124,58,237,0.4)] transition-all",
          isOpen && "hidden"
        )}
      >
        <Bot className="h-7 w-7" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">1</span>
      </motion.button>

      {/* AI Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isMaximized ? 'calc(100vw - 40px)' : '420px',
              height: isMaximized ? 'calc(100vh - 40px)' : '620px',
              bottom: isMaximized ? '20px' : '24px',
              left: isMaximized ? '20px' : '24px',
            }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="fixed z-50 flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/95 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-purple-600/20 backdrop-blur-sm pointer-events-none"
                >
                  <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-purple-400 bg-slate-900/80 p-8 text-white">
                    <Paperclip className="h-10 w-10 animate-bounce text-purple-400" />
                    <p className="text-lg font-bold">ألقِ ملفاتك هنا...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-white/5 bg-purple-600 px-6 py-5 text-white">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 opacity-50 animate-gradient-x"></div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold leading-tight flex items-center gap-1.5">
                    مركز سومر المعرفي
                    <Shield className="h-3 w-3 text-emerald-400 fill-emerald-400/20" />
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest text-emerald-400">Security: Active Guard</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="rounded-lg p-2 transition-colors hover:bg-white/10"
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-16 w-16 text-purple-400 mb-6" />
                  </motion.div>
                  <p className="text-lg font-black text-white">النظام ينتظر استعلامك</p>
                  <p className="text-xs text-slate-400 mt-2 max-w-[200px]">أنا هنا لتقديم الدعم الفني، بناء التطبيقات المفتوحة، وتوفير الحلول الذكية بلمرة من العبقرية.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn(
                    "max-w-[85%] rounded-[1.5rem] px-5 py-4 text-sm shadow-xl border border-white/5",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white/5 text-slate-100 backdrop-blur-md rounded-bl-none border-purple-500/20"
                  )}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="relative group">
                            {att.mimeType.startsWith('image/') ? (
                              <img 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                alt="attachment" 
                                className="h-20 w-20 rounded-lg object-cover border border-white/10"
                              />
                            ) : (
                              <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 border border-white/10">
                                <FileText className="h-4 w-4 text-purple-400" />
                                <span className="text-[10px] max-w-[80px] truncate">{att.name || 'File'}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="markdown-content">
                      <ReactMarkdown
                        components={{
                          code: ({ node, inline, className, children, ...props }: any) => {
                            return (
                              <CodeBlock className={className}>
                                {children}
                              </CodeBlock>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-slate-400 border border-white/5">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    <div className="flex gap-1">
                      <span className="h-1 w-1 rounded-full bg-purple-500 animate-bounce"></span>
                      <span className="h-1 w-1 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-slate-900 border-t border-white/5">
              {/* Pending Attachments Preview */}
              <AnimatePresence>
                {pendingAttachments.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-3 flex flex-wrap gap-2 p-3 rounded-2xl bg-white/5 border border-white/10"
                  >
                    {pendingAttachments.map((att, i) => (
                      <div key={i} className="relative group">
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="absolute -top-1 -right-1 z-10 rounded-full bg-red-500 p-0.5 text-white opacity-100"
                        >
                          <X className="h-2 w-2" />
                        </button>
                        {att.mimeType.startsWith('image/') ? (
                          <img 
                            src={`data:${att.mimeType};base64,${att.data}`} 
                            alt="preview" 
                            className="h-10 w-10 rounded-lg object-cover border border-white/20"
                          />
                        ) : (
                          <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-white/5 border border-white/20">
                            <FileText className="h-4 w-4 text-purple-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50">
                  <input
                    type="text"
                    placeholder={isRecording ? "جاري الاستماع..." : "ابحث في معرفة سومر..."}
                    className="flex-1 bg-transparent px-4 py-4 text-white text-sm outline-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="flex items-center px-2 border-r border-white/5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-500 hover:text-white transition-colors"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={cn(
                        "p-2 transition-colors",
                        isRecording ? "text-red-500 animate-pulse" : "text-slate-500 hover:text-white"
                      )}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceMode(!voiceMode)}
                      className={cn(
                        "p-2 transition-colors",
                        voiceMode ? "text-purple-400" : "text-slate-500 hover:text-white"
                      )}
                      title={voiceMode ? "إيقاف الرد الصوتي" : "تفعيل الرد الصوتي"}
                    >
                      {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                    {voiceMode && (
                      <button
                        type="button"
                        onClick={stopAudio}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="توقف الصوت"
                      >
                        <Square className="h-3 w-3 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && pendingAttachments.length === 0)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
