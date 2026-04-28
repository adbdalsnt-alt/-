import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student } from '../types';
import { SUBJECTS_BY_GRADE, SUBJECT_NAMES, GRADE_NAMES } from '../constants';
import { User, ClipboardList, TrendingUp, Award, Clock, History } from 'lucide-react';

export default function ResultView() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      if (!id) return;
      try {
        const docRef = doc(db, 'students', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudent(docSnap.data() as Student);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [id]);

  if (loading) return <div className="py-20 text-center text-slate-400 font-medium">جاري تحميل النتيجة من السحابة...</div>;
  if (!student) return <div className="py-20 text-center text-red-400 font-medium font-sans">حدث خطأ: لم يتم العثور على الطالب.</div>;

  const results = student.results || {};
  const currentSubjects = SUBJECTS_BY_GRADE[student.grade] || [];
  
  const total = currentSubjects.reduce((acc, sub) => acc + (results[sub] || 0), 0);
  const average = total / currentSubjects.length;
  const isPassed = currentSubjects.every(sub => (results[sub] || 0) >= 50);

  return (
    <div className="flex flex-col gap-8">
      {/* Student Profile Header */}
      <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl sm:p-10 backdrop-blur-md">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-slate-800 border-4 border-white/10 shadow-2xl ring-4 ring-blue-500/10">
            <User className="h-16 w-16 text-slate-500" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <h2 className="text-3xl font-black text-white">{student.name}</h2>
              <div className={`rounded-xl px-5 py-2 font-bold shadow-lg ${isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {isPassed ? 'ناجح' : 'مكمل'}
              </div>
            </div>
            
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ProfileItem icon={<ClipboardList className="h-4 w-4" />} label="المرحلة" value={GRADE_NAMES[student.grade]} />
              <ProfileItem icon={<Award className="h-4 w-4" />} label="الرقم الامتحاني" value={student.examNumber} />
              <ProfileItem icon={<TrendingUp className="h-4 w-4" />} label="الشعبة" value={student.section} />
              <ProfileItem icon={<History className="h-4 w-4" />} label="المدرسة" value={student.schoolName || 'غير محدد'} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats and Grades */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Statistics */}
        <section className="space-y-6">
          <StatCard title="المجموع الكلي" value={total.toString()} subValue={`من أصل ${currentSubjects.length * 100}`} color="blue" />
          <StatCard title="المعدل" value={average.toFixed(2)} subValue="%" color="purple" />
          <div className="rounded-3xl bg-white/5 p-6 border border-white/5 font-mono text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>آخر تحديث في السحابة: {new Date(student.updatedAt?.seconds * 1000).toLocaleString('ar-IQ')}</span>
            </div>
            <div className="mt-1">STORAGE ID: {id?.slice(0, 8)}... (13B GB POOL)</div>
          </div>
        </section>

        {/* Grades Table */}
        <section className="lg:col-span-2">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
            <table className="w-full text-right">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-8 py-5 text-sm font-bold text-slate-300">المادة</th>
                  <th className="px-8 py-5 text-center text-sm font-bold text-slate-300">الدرجة</th>
                  <th className="px-8 py-5 text-center text-sm font-bold text-slate-300">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentSubjects.map((sub) => {
                  const score = results[sub] || 0;
                  return (
                    <tr key={sub} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 text-sm font-medium text-white">{SUBJECT_NAMES[sub] || sub}</td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">{score}</span>
                        <span className="text-xs text-slate-500"> / 100</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black shadow-inner ${score >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {score >= 50 ? 'ناجح' : 'راسب'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/5 group hover:border-blue-500/30 transition-colors">
      <div className="text-slate-500 group-hover:text-blue-400 transition-colors">{icon}</div>
      <div className="text-right">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</div>
        <div className="text-sm font-bold text-slate-200">{value}</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, color }: { title: string, value: string, subValue: string, color: 'blue' | 'purple' }) {
  const colors = {
    blue: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-900/20 border border-blue-500/20',
    purple: 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-purple-900/20 border border-purple-500/20',
  };

  return (
    <div className={`rounded-[2.5rem] p-8 shadow-2xl ${colors[color]} hover:scale-[1.02] transition-transform`}>
      <div className="text-sm font-bold opacity-80 uppercase tracking-widest">{title}</div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-6xl font-black tracking-tighter">{value}</span>
        <span className="text-sm font-bold opacity-60">{subValue}</span>
      </div>
    </div>
  );
}
