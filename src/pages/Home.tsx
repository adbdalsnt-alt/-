import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, ClipboardList, BrainCircuit, ArrowLeftCircle, User, Share2, Copy, Check, Facebook, Twitter, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student } from '../types';
import { GRADE_NAMES } from '../constants';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Fuse from 'fuse.js';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<{item: Student, id: string}[]>([]);
  const [suggestions, setSuggestions] = useState<{item: Student, id: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sharingStudent, setSharingStudent] = useState<{item: Student, id: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const form = document.getElementById('search-form');
      if (form && !form.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const qStr = searchQuery.trim();
      if (qStr.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        // We fetch a batch for local fuzzy matching in suggestions
        const q = query(collection(db, 'students'), limit(100));
        const snapshot = await getDocs(q);
        const students = snapshot.docs.map(doc => ({
          item: doc.data() as Student,
          id: doc.id
        }));

        const fuse = new Fuse(students, {
          keys: ['item.name', 'item.examNumber'],
          threshold: 0.3,
        });

        const results = fuse.search(qStr);
        setSuggestions(results.slice(0, 5).map(r => r.item)); // Extract the item from FuseResult
      } catch (err) {
        console.error("Suggestion error:", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = searchQuery.trim();
    if (!queryStr) return;
    
    setLoading(true);
    setError('');
    setSearchResults([]);
    setShowSuggestions(false);

    try {
      // 1. Try exact match for exam number
      const qExam = query(collection(db, 'students'), where('examNumber', '==', queryStr), limit(1));
      const examSnapshot = await getDocs(qExam);
      
      if (!examSnapshot.empty) {
        navigate(`/result/${examSnapshot.docs[0].id}`);
        return;
      }

      // 2. Exact match for name
      const qName = query(collection(db, 'students'), where('name', '==', queryStr), limit(1));
      const nameSnapshot = await getDocs(qName);
      if (!nameSnapshot.empty) {
        navigate(`/result/${nameSnapshot.docs[0].id}`);
        return;
      }

      // 3. Fuzzy search for everything else
      const allStudentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList = allStudentsSnapshot.docs.map(doc => ({
        item: doc.data() as Student,
        id: doc.id
      }));

      const fuse = new Fuse(studentsList, {
        keys: ['item.name', 'item.examNumber'],
        threshold: 0.4, // Sensitivity for fuzzy matching
      });

      const results = fuse.search(searchQuery);

      if (results.length === 0) {
        setError('عذراً، لم يتم العثور على طالب بهذا الاسم أو الرقم الامتحاني.');
      } else if (results.length === 1) {
        navigate(`/result/${results[0].item.id}`);
      } else {
        // Show list of multiple results
        setSearchResults(results.map(r => r.item));
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getShareLink = (id: string) => `${window.location.origin}/result/${id}`;

  return (
    <div className="flex flex-col gap-12">
      {/* Hero Section */}
      <section className="text-center pt-8">
        <h2 className="text-3xl font-black tracking-tight sm:text-6xl text-white">
          أهلاً بك في <span className="text-blue-500">نتائجنا</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-slate-400 sm:text-xl font-medium">
          البوابة الرسمية والآمنة للحصول على نتائج الطلاب في العراق. مدعومة بذكاء اصطناعي لخدمتك.
        </p>

        <div className="mt-12 mx-auto max-w-xl">
          <form id="search-form" onSubmit={handleSearch} className="relative flex items-center">
            <input
              id="search-input"
              type="text"
              placeholder="ابحث بالاسم أو الرقم الامتحاني..."
              className="w-full rounded-2xl border-2 border-white/5 bg-white/5 px-6 py-5 pr-14 text-lg text-white shadow-xl outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute left-2.5 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? 'جاري البحث...' : 'بحث'}
            </button>
            <Search className="absolute right-5 h-6 w-6 text-slate-500" />

            {/* Autocomplete Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 z-30 mt-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl backdrop-blur-xl"
                >
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => navigate(`/result/${suggestion.id}`)}
                      className="flex w-full items-center justify-between px-6 py-5 text-right transition-colors border-b border-white/5 last:border-0 hover:bg-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100">{suggestion.item.name}</span>
                          <span className="text-xs text-slate-500">{GRADE_NAMES[suggestion.item.grade]}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">{suggestion.item.examNumber}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}
          
          {/* Multiple Results List */}
          {searchResults.length > 0 && (
            <div className="mt-8 space-y-4">
              <p className="text-right text-sm font-bold text-slate-500 uppercase tracking-widest">نتائج مشابهة للبحث</p>
              {searchResults.map((studentResult) => (
                <div key={studentResult.id} className="group relative">
                  <button
                    onClick={() => navigate(`/result/${studentResult.id}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-5 shadow-sm transition-all hover:bg-white/10 hover:border-blue-500/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{studentResult.item.name}</div>
                        <div className="text-xs text-slate-500">{GRADE_NAMES[studentResult.item.grade]} - {studentResult.item.section}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-mono font-bold text-slate-400">{studentResult.item.examNumber}</div>
                        <div className="text-[10px] text-slate-500">{studentResult.item.schoolName || 'نتائجنا'}</div>
                      </div>
                      <div className="h-10 w-px bg-white/5"></div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingStudent(studentResult);
                        }}
                        className="rounded-xl p-2.5 text-slate-500 transition-all hover:bg-blue-500/20 hover:text-blue-400"
                        title="مشاركة النتيجة"
                      >
                        <Share2 className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Grid Actions */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          id="action-admin"
          icon={<ClipboardList className="h-8 w-8 text-blue-600" />}
          title="إدخال النتائج"
          description="للمدراء والمخخولين: إضافة وتعديل نتائج الطلاب للمراحل المنتهية وغير المنتهية."
          onClick={() => navigate('/manage')}
          color="blue"
        />
        <ActionCard
          id="action-sumer"
          icon={<BrainCircuit className="h-8 w-8 text-purple-600" />}
          title="اسأل سومر (AI)"
          description="الذكاء الاصطناعي سومر يجاوب على أسئلتك الدراسية ويساعدك في فهم دروسك."
          onClick={() => navigate('/sumer')}
          color="purple"
        />
        <ActionCard
          id="action-levels"
          icon={<GraduationCap className="h-8 w-8 text-emerald-600" />}
          title="المراحل الدراسية"
          description="تصفح قائمة المواد لكل مرحلة دراسية، من الابتدائي إلى السادس العلمي."
          onClick={() => navigate('/levels')}
          color="emerald"
        />
      </section>

      {/* Cloud Info */}
      <section className="rounded-3xl bg-blue-600/10 border border-blue-500/20 p-8 text-white shadow-2xl sm:p-12 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row relative z-10">
          <div className="max-w-xl text-center lg:text-right">
            <h3 className="text-2xl font-bold sm:text-3xl text-blue-400">سحابة تخزين نتائجنا الهائلة</h3>
            <p className="mt-4 text-slate-400 leading-relaxed font-medium">
              نفتخر بامتلاك أكبر سحابة تخزين تعليمية في المنطقة بسعة 13 مليار جيجابايت، مؤمنة بالكامل لحماية بيانات ملايين الطلاب وتدعم 100 مليار سحابة فرعية للنسخ الاحتياطي.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-6 rounded-2xl bg-white/5 p-8 backdrop-blur border border-white/5">
            <div className="text-center">
              <span className="block text-4xl font-black text-white">13B</span>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">Gigabytes</span>
            </div>
            <div className="h-14 w-px bg-white/10"></div>
            <div className="text-center">
              <span className="block text-4xl font-black text-emerald-400">100%</span>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">Secured</span>
            </div>
          </div>
        </div>
      </section>

      {/* Share Modal */}
      <AnimatePresence>
        {sharingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSharingStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/10 p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <button 
                  onClick={() => setSharingStudent(null)}
                  className="rounded-full p-2 text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-black text-white">مشاركة النتيجة</h3>
              </div>

              <div className="mb-8 rounded-3xl bg-white/5 p-6 text-right border border-white/5">
                <div className="flex items-center justify-end gap-3 mb-2">
                  <span className="text-lg font-bold text-white">{sharingStudent.item.name}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                    <User className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium">{GRADE_NAMES[sharingStudent.item.grade]} - {sharingStudent.item.examNumber}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <button
                    onClick={() => copyToClipboard(getShareLink(sharingStudent.id))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 shadow-sm transition-all hover:bg-blue-600 hover:text-white"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-left text-xs font-mono text-slate-500">{getShareLink(sharingStudent.id)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <ShareButton 
                    href={`https://wa.me/?text=${encodeURIComponent(`نتيجة الطالب: ${sharingStudent.item.name}\n${getShareLink(sharingStudent.id)}`)}`}
                    icon={<ExternalLink className="h-5 w-5" />}
                    label="WhatsApp"
                    color="bg-[#25D366]"
                  />
                  <ShareButton 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareLink(sharingStudent.id))}`}
                    icon={<Facebook className="h-5 w-5" />}
                    label="Facebook"
                    color="bg-[#1877F2]"
                  />
                  <ShareButton 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`نتيجة الطالب: ${sharingStudent.item.name}`)}&url=${encodeURIComponent(getShareLink(sharingStudent.id))}`}
                    icon={<Twitter className="h-5 w-5" />}
                    label="Twitter"
                    color="bg-[#1DA1F2]"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareButton({ href, icon, label, color }: { href: string, icon: React.ReactNode, label: string, color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl py-4 text-white shadow-lg transition-all hover:scale-105 active:scale-95",
        color
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </a>
  );
}

function ActionCard({ id, icon, title, description, onClick, color }: { id: string, icon: React.ReactNode, title: string, description: string, onClick: () => void, color: 'blue' | 'purple' | 'emerald' }) {
  const colorClasses = {
    blue: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    purple: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    emerald: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    emerald: 'bg-emerald-500/10',
  };

  return (
    <button
      id={id}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start p-8 text-right transition-all border border-white/5 bg-white/5 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/20",
        colorClasses[color]
      )}
    >
      <div className={cn(
        "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition-all group-hover:scale-110",
        iconBgClasses[color]
      )}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">{description}</p>
      <ArrowLeftCircle className="mt-8 h-7 w-7 text-slate-700 transition-all group-hover:-translate-x-2 group-hover:text-current" />
    </button>
  );
}
