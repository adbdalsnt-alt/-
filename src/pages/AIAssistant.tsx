import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Zap, BookOpen, BrainCircuit, Mic, MicOff, Paperclip, Image as ImageIcon, X, FileText, Copy, Check, Volume2, VolumeX, Square, Play, Eye, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { chatWithSumer, textToSpeech, playAudio, stopAudio } from '../services/geminiService';
import { ChatMessage, Attachment } from '../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

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
    // Basic wrapper for Tailwind/JS
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
              <span>{showPreview ? 'عرض الكود' : 'عرض مباشر'}</span>
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
              <span className="text-emerald-400">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>نسخ الكود</span>
            </>
          )}
        </button>
      </div>
      <div className="relative">
        {showPreview ? (
          <div className="h-[400px] w-full bg-white">
            <iframe
              title="Code Preview"
              srcDoc={getPreviewContent()}
              className="h-full w-full border-none"
              sandbox="allow-scripts"
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

export default function AIAssistant() {
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
  }, [messages, isLoading]);

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

      // Log interaction
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

      // Speak back if in voice mode
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
    <div 
      className="flex h-full w-full flex-col overflow-hidden bg-slate-950 transition-all font-sans relative"
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
            <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-purple-400 bg-slate-900/80 p-12 text-white">
              <Paperclip className="h-12 w-12 animate-bounce text-purple-400" />
              <p className="text-xl font-bold">ألقِ ملفاتك هنا للإلهام...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with animated background */}
      <div className="relative flex items-center justify-between border-b border-white/10 bg-purple-900/40 px-6 py-6 text-white backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 animate-gradient-x"></div>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <motion.div 
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            <Bot className="h-8 w-8 text-purple-300" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">سومر AI</h2>
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 mt-1 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              المعالج المعرفي متصل
            </div>
          </div>
        </div>
        
        <div className="relative z-10 hidden sm:flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-purple-300 uppercase letter tracking-tighter">سحابة البيانات</span>
            <span className="text-xs font-mono font-bold">13B GB SECURED</span>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 border border-white/5">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-bold">v3.0 Ultra</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] p-6 space-y-8 scroll-smooth" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 rounded-[3rem] bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-12 backdrop-blur-sm border border-white/10"
            >
              <BrainCircuit className="h-16 w-16 text-purple-400 animate-pulse" />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-white mb-4"
            >
              أهلاً بك في آفاق المعرفة
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-md text-lg text-slate-400 leading-relaxed"
            >
              أنا سومر، ذكاؤك الاصطناعي الخاص. اسألني عن أي مادة دراسية أو استفسار عن المنصة، وسأبحر معك في عالم الإجابات.
            </motion.p>
            
            <div className="mt-12 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
              {[
                { icon: <Zap className="h-4 w-4" />, text: 'كيف أبحث عن نتيجتي؟', color: 'blue' },
                { icon: <BookOpen className="h-4 w-4" />, text: 'شرح مادة الرياضيات', color: 'purple' },
                { icon: <Sparkles className="h-4 w-4" />, text: 'نصائح للامتحانات', color: 'emerald' }
              ].map((item, i) => (
                <motion.button 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  onClick={() => setInput(item.text)}
                  className="flex flex-col items-center gap-3 rounded-3xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-white/20 group"
                >
                  <div className={`rounded-xl p-3 bg-${item.color}-500/10 text-${item.color}-400 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-slate-300">{item.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row text-right'}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                </div>
                <div className={`relative rounded-[1.8rem] px-6 py-4 text-sm leading-relaxed shadow-xl border border-white/5 ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-tr-none' 
                    : 'bg-white/10 text-slate-100 backdrop-blur-md rounded-tl-none border-purple-500/30'
                }`}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="relative group">
                          {att.mimeType.startsWith('image/') ? (
                            <img 
                              src={`data:${att.mimeType};base64,${att.data}`} 
                              alt="attachment" 
                              className="h-32 w-32 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 border border-white/10">
                              <FileText className="h-5 w-5 text-purple-400" />
                              <span className="text-[10px] max-w-[100px] truncate">{att.name || 'File'}</span>
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
                  <div className={`absolute bottom-[-20px] text-[9px] font-bold uppercase tracking-widest text-slate-500 ${msg.role === 'user' ? 'right-2' : 'left-2'}`}>
                    {msg.role === 'user' ? 'Student Request' : 'Sumer Intel'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-start"
          >
             <div className="flex max-w-[85%] gap-4 flex-row items-center cursor-wait">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/20">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="rounded-[1.8rem] rounded-tl-none px-6 py-4 bg-white/5 border border-white/10 text-slate-400 text-xs flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="font-bold tracking-widest uppercase">العقل يفكر...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Section */}
      <div className="bg-slate-900 border-t border-white/5 p-6 backdrop-blur-2xl">
        <form onSubmit={handleSend} className="relative mx-auto max-w-4xl">
          {/* Pending Attachments Preview */}
          <AnimatePresence>
            {pendingAttachments.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 flex flex-wrap gap-3 p-4 rounded-3xl bg-white/5 border border-white/10"
              >
                {pendingAttachments.map((att, i) => (
                  <div key={i} className="relative group">
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-2 -right-2 z-10 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {att.mimeType.startsWith('image/') ? (
                      <img 
                        src={`data:${att.mimeType};base64,${att.data}`} 
                        alt="preview" 
                        className="h-16 w-16 rounded-xl object-cover border border-white/20"
                      />
                    ) : (
                      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-white/5 border border-white/20">
                        <FileText className="h-6 w-6 text-purple-400" />
                        <span className="text-[8px] mt-1 px-1 truncate w-full text-center">{att.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                id="chat-input"
                type="text"
                className="w-full rounded-[2rem] border border-white/10 bg-white/5 py-5 pl-32 pr-8 text-white outline-none transition-all focus:border-purple-500/50 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/10 placeholder:text-slate-500"
                placeholder={isRecording ? "جاري الاستماع..." : "اطلب المعرفة من سومر..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
              
              <div className="absolute left-3 top-2 flex items-center gap-2">
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
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceMode(!voiceMode)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                    voiceMode 
                      ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                  title={voiceMode ? "إيقاف الرد الصوتي" : "تفعيل الرد الصوتي"}
                >
                  {voiceMode ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
                {voiceMode && (
                  <button
                    type="button"
                    onClick={stopAudio}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                    title="توقف الصوت"
                  >
                    <Square className="h-5 w-5 fill-current" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && pendingAttachments.length === 0)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale group-focus-within:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  <Send className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]"></div>
              <span>End-to-End Encryption</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <BrainCircuit className="h-3 w-3" />
              <span>Open Memory Active</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <Zap className="h-3 w-3" />
              <span>Eternal Memory (5,000 GB) & Storage (500,000 TB)</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

