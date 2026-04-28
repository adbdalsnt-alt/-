import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ListChecks, CheckCircle2, History, Clock, User } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SUBJECTS_BY_GRADE, SUBJECT_NAMES, GRADE_NAMES } from '../constants';
import { GradeLevel, Student, SubjectResult } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

interface ActivityLog {
  id: string;
  adminName: string;
  action: 'create' | 'update' | 'delete';
  studentName: string;
  timestamp: any;
}

export default function Management() {
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    grade: '1st_primary',
    section: '',
    examNumber: '',
    schoolName: '',
    results: {},
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      setActivities(logs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(list);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'students', studentToDelete.id));
      
      // Log the activity
      await addDoc(collection(db, 'activities'), {
        adminName: user?.displayName || user?.email || 'مدير النظام',
        action: 'delete',
        studentName: studentToDelete.name,
        timestamp: serverTimestamp(),
      });
      
      setStudentToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'students');
    }
  };

  const handleLevelChange = (level: GradeLevel) => {
    setFormData({ 
      ...formData, 
      grade: level,
      results: {} // Clear results when grade changes
    });
    setErrors({});
  };

  const validateScore = (value: number | undefined): string => {
    if (value === undefined) return '';
    if (isNaN(value)) return 'يجب إدخال رقم';
    if (value < 0 || value > 100) return 'الدرجة يجب أن تكون بين 0 و 100';
    return '';
  };

  const handleResultChange = (subject: string, value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    const error = validateScore(numValue);
    
    setErrors(prev => ({
      ...prev,
      [subject]: error
    }));

    setFormData({
      ...formData,
      results: {
        ...formData.results,
        [subject]: numValue
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation check
    const newErrors: Record<string, string> = {};
    let hasError = false;
    
    currentSubjects.forEach(sub => {
      const error = validateScore(formData.results?.[sub]);
      if (error) {
        newErrors[sub] = error;
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      alert('يرجى تصحيح الأخطاء في الدرجات قبل الحفظ');
      return;
    }

    if (!user) {
      if (loading) return;
      setLoading(true);
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err: any) {
        console.error("Login failed:", err);
        if (err.code === 'auth/popup-blocked') {
          alert('تم حظر النافذة المنبثقة. يرجى السماح بالبث المنبثق أو فتح الموقع في نافذة جديدة.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setSuccess(false);
    setLastAddedId(null);

    try {
      const studentName = (formData.name || '').trim();
      const examNumber = (formData.examNumber || '').trim();
      const section = (formData.section || '').trim();
      const schoolName = (formData.schoolName || '').trim();

      if (!studentName || !examNumber) {
        alert('يرجى التأكد من إدخال الاسم والرقم الامتحاني');
        setLoading(false);
        return;
      }

      let docRefId = '';
      try {
        const docRef = await addDoc(collection(db, 'students'), {
          ...formData,
          name: studentName,
          examNumber: examNumber,
          section: section,
          schoolName: schoolName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        docRefId = docRef.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'students');
      }

      // Log the activity
      try {
        await addDoc(collection(db, 'activities'), {
          adminName: user?.displayName || user?.email || 'مدير النظام', 
          action: 'create',
          studentName: studentName,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        // Fallback log instead of full crash
        console.warn("Activity logging failed", err);
      }

      setLastAddedId(docRefId);
      setSuccess(true);
      setFormData({
        name: '',
        grade: '1st_primary',
        section: '',
        examNumber: '',
        schoolName: '',
        results: {},
      });
      // Scroll to history or show success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error adding student: ", error);
      alert('حدث خطأ أثناء حفظ البيانات. تأكد من أنك سجلت الدخول بحساب صحيح وأن الحقول مطابقة للشروط.');
    } finally {
      setLoading(false);
    }
  };

  const currentSubjects = SUBJECTS_BY_GRADE[formData.grade as GradeLevel] || [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 flex items-center justify-between">
        <div className="text-right">
          <h2 className="text-4xl font-black text-white">إدارة نتائج الطلاب</h2>
          <p className="mt-2 text-slate-500 font-medium tracking-wide">أدخل معلومات الطالب ودرجاته بدقة لتخزينها في سحابة نتائجنا.</p>
        </div>
      </div>

      {success && (
        <div className="mb-10 flex flex-col gap-5 rounded-[2rem] bg-emerald-500/10 p-8 border border-emerald-500/20 text-emerald-100 shadow-2xl animate-in fade-in slide-in-from-top-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <span className="font-black text-xl">تم حفظ النتائج بنجاح وتخزينها في سحابة نتائجنا!</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setSuccess(false)}
              className="rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-black text-white transition-all hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              إضافة طالب آخر
            </button>
            {lastAddedId && (
              <a 
                href={`/result/${lastAddedId}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-8 py-3 text-sm font-black text-emerald-400 transition-all hover:bg-emerald-500/10 hover:scale-[1.02] active:scale-95"
              >
                عرض النتيجة الحقيقية
              </a>
            )}
          </div>
        </div>
      )}

      <form id="management-form" onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* Basic Info */}
        <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-8 flex items-center gap-3 border-b border-white/5 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Plus className="h-5 w-5" />
            </div>
            <h3 className="font-black text-xl text-white">المعلومات الأساسية</h3>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">اسم الطالب الرباعي</label>
              <input
                id="input-name"
                required
                className="rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">الرقم الامتحاني</label>
              <input
                id="input-exam-number"
                required
                className="rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                value={formData.examNumber}
                onChange={(e) => setFormData({...formData, examNumber: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">المرحلة الدراسية</label>
              <select
                id="select-grade"
                required
                className="rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-white outline-none transition-all focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 appearance-none"
                style={{ backgroundImage: 'none' }}
                value={formData.grade}
                onChange={(e) => handleLevelChange(e.target.value as GradeLevel)}
              >
                {Object.entries(GRADE_NAMES).map(([key, name]) => (
                  <option key={key} value={key} className="bg-slate-900">{name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">الشعبة</label>
              <input
                id="input-section"
                required
                className="rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                value={formData.section}
                onChange={(e) => setFormData({...formData, section: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-3 sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">اسم المدرسة</label>
              <input
                id="input-school"
                required
                className="rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                value={formData.schoolName}
                onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Subjects Grid */}
        <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-8 flex items-center gap-3 border-b border-white/5 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <ListChecks className="h-5 w-5" />
            </div>
            <h3 className="font-black text-xl text-white">الدرجات والمواد</h3>
          </div>
          <div className="grid gap-6 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {currentSubjects.map((subject) => (
              <div key={subject} className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{SUBJECT_NAMES[subject] || subject}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`w-full rounded-xl border bg-slate-900 px-4 py-3 text-center font-mono text-xl font-bold text-white transition-all focus:outline-none ${errors[subject] ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10'}`}
                    value={formData.results?.[subject] ?? ''}
                    placeholder="0"
                    onChange={(e) => handleResultChange(subject, e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700">/100</span>
                </div>
                {errors[subject] && (
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">{errors[subject]}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="flex h-20 items-center justify-center gap-4 rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-700 font-black text-xl text-white shadow-2xl shadow-blue-900/40 transition-all hover:from-blue-500 hover:to-blue-600 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        >
          <Save className="h-7 w-7" />
          {loading ? 'جاري الحفظ...' : 'حفظ النتائج وإرسالها للسحابة'}
        </button>
      </form>

      {/* Recent Activity Log (Students Added) */}
      <section className="mt-16 rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <h3 className="font-black text-xl text-white">الطلاب المضافون مؤخراً</h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 tracking-widest uppercase">LAST 10 ENTRIES</span>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {students.length === 0 ? (
            <p className="col-span-full text-center py-12 text-sm text-slate-600 font-medium italic">لا يوجد طلاب مسجلون حالياً في هذا النطاق.</p>
          ) : (
            students.map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-5 border border-white/5 transition-all hover:bg-white/10 group">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-transform group-hover:scale-110">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">{student.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{GRADE_NAMES[student.grade as GradeLevel]} - {student.examNumber}</div>
                  </div>
                </div>
                <button
                  onClick={() => setStudentToDelete(student)}
                  className="rounded-xl p-3 text-slate-600 transition-all hover:bg-red-500/20 hover:text-red-400"
                  title="حذف الطالب"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStudentToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/10 p-10 shadow-2xl"
            >
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20">
                  <Trash2 className="h-10 w-10" />
                </div>
                <h4 className="mb-3 text-2xl font-black text-white">تأكيد الحذف</h4>
                <p className="mb-10 text-sm leading-relaxed text-slate-500 font-medium">
                  هل أنت متأكد من رغبتك في حذف سجل الطالب <span className="font-bold text-white">"{studentToDelete.name}"</span>؟ لا يمكن التراجع عن هذا الإجراء من السحابة.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStudentToDelete(null)}
                    className="flex-1 rounded-2xl bg-white/5 py-4 text-xs font-black text-slate-400 tracking-widest uppercase transition-all hover:bg-white/10"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 rounded-2xl bg-red-600 py-4 text-xs font-black text-white tracking-widest uppercase shadow-xl shadow-red-900/40 transition-all hover:bg-red-500 hover:scale-[1.02] active:scale-95"
                  >
                    تأكيد الحذف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recent Activity Log (System Events) */}
      <section className="mt-16 rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <History className="h-5 w-5" />
            </div>
            <h3 className="font-black text-xl text-white">سجل النشاطات الأخير</h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 tracking-widest uppercase">LAST 5 OPERATIONS</span>
        </div>
        
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center py-12 text-sm text-slate-600 font-medium italic">لا توجد نشاطات مسجلة حالياً.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-5 border border-white/5 transition-all hover:bg-white/10 group">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all group-hover:scale-110 ${
                    activity.action === 'create' ? 'bg-emerald-500/10 text-emerald-400' : 
                    activity.action === 'update' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {activity.action === 'create' ? <Plus className="h-6 w-6" /> : <Save className="h-6 w-6" />}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">
                      تم {activity.action === 'create' ? 'إضافة' : activity.action === 'update' ? 'تحديث' : 'حذف'} الطالب: <span className="text-blue-400">{activity.studentName}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">بواسطة {activity.adminName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black font-mono text-slate-600 tracking-wider">
                  <Clock className="h-3 w-3" />
                  {activity.timestamp?.seconds ? new Date(activity.timestamp.seconds * 1000).toLocaleTimeString('ar-IQ') : 'جاري الحفظ...'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
