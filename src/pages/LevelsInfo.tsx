import React from 'react';
import { ListChecks, GraduationCap, Info } from 'lucide-react';
import { SUBJECTS_BY_GRADE, SUBJECT_NAMES, GRADE_NAMES } from '../constants';

export default function LevelsInfo() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-12 text-center pt-8">
        <h2 className="text-4xl font-black text-white tracking-tight sm:text-5xl">دليل المواد الدراسية</h2>
        <p className="mt-4 text-slate-500 font-medium tracking-wide">نظرة شاملة على المواد لكل مرحلة دراسية في نظام نتائجنا.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {Object.entries(SUBJECTS_BY_GRADE).map(([grade, subjects]) => (
          <div key={grade} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md transition-all hover:bg-white/10 group">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 transition-transform group-hover:scale-110">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black text-white">{GRADE_NAMES[grade as keyof typeof GRADE_NAMES]}</h3>
              </div>
              {grade.includes('6th') && (
                <span className="rounded-xl bg-amber-500/10 px-4 py-1.5 text-xs font-black text-amber-500 border border-amber-500/20 tracking-widest uppercase">وزاري</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {subjects.map((sub) => (
                <div key={sub} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300 border border-white/5 transition-colors hover:bg-blue-500/10 hover:text-blue-200">
                  <div className="h-2 w-2 rounded-full bg-blue-500/40"></div>
                  <span className="font-bold">{SUBJECT_NAMES[sub] || sub}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-2.5 text-[10px] font-black text-slate-600 tracking-widest uppercase">
              <Info className="h-4 w-4" />
              <span>يتم تحديث هذه القائمة دورياً من وزارة التربية.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
