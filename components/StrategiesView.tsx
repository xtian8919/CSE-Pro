
import React from 'react';

interface StrategiesViewProps {
  onBack: () => void;
}

const StrategiesView: React.FC<StrategiesViewProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="mb-8">
        <button onClick={onBack} className="text-blue-600 font-bold flex items-center gap-2 hover:underline mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Back to Menu
        </button>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Strategies to Pass the CSE Professional Exam</h1>
      </div>

      <div className="space-y-10 pb-20">
        {/* Master Guide Header */}
        <section className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">📘</span>
              <h2 className="text-3xl font-black italic">Strategic Master Plan</h2>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg max-w-2xl">
              Passing the Professional Level is not just about intelligence—it's about stamina and strategy. With a required 80% passing rate, every single point counts.
            </p>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>
        </section>

        {/* General Core Strategies */}
        <section className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-100 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl">🎯</span>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Core Success Strategies</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "The 80% Mindset", text: "You don't need a perfect score, but you need to be consistently strong across all areas. Don't let one section drag you down." },
              { title: "Simulate Real Pressure", text: "Take practice tests with a timer. The 3 hour and 10 minute limit is the biggest enemy of most examinees." },
              { title: "The 'Skip & Return' Rule", text: "Spend no more than 60 seconds per item. If it's hard, mark it and move on. Secure the easy points first." },
              { title: "Elimination Strategy", text: "Always look for 'distractors'—options that look correct but are slightly off. Narrow it down to 2 choices before guessing." },
              { title: "Master the Shading", text: "Don't shade one by one. Shade in blocks of 10 or 20 to maintain rhythm and avoid alignment errors." },
              { title: "Contextual Guessing", text: "If you must guess, use common sense. CSE answers usually lean towards professional and ethical standards." }
            ].map((strategy, i) => (
              <div key={i} className="flex gap-4 p-5 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center font-black text-sm">{i+1}</span>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{strategy.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{strategy.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Category-Specific Mastery */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-2 px-4">
             <span className="text-3xl">⚡</span>
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Category Mastery</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Numerical */}
            <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🔢</span>
                <h4 className="text-xl font-black text-emerald-900">Numerical Ability</h4>
              </div>
              <ul className="space-y-4">
                {[
                  "Memorize common fraction-to-decimal conversions.",
                  "Learn the 'shortcut' for ratio and proportion problems.",
                  "Translate word problems into equations immediately.",
                  "Focus on Basic Operations & Algebra (the foundation).",
                  "Use the choices: Plug the answers back into the problem."
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-emerald-800 font-medium">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Analytical */}
            <div className="bg-purple-50 p-8 rounded-[2rem] border border-purple-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🧠</span>
                <h4 className="text-xl font-black text-purple-900">Analytical Ability</h4>
              </div>
              <ul className="space-y-4">
                {[
                  "Draw diagrams for logic problems (Venn diagrams/tables).",
                  "Identify the 'operator' in number sequences early.",
                  "Focus on logical consistency in paragraph organization.",
                  "Don't bring outside knowledge into logic puzzles.",
                  "Practice 'Statement and Conclusion' drills daily."
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-purple-800 font-medium">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Verbal */}
            <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">✍️</span>
                <h4 className="text-xl font-black text-blue-900">Verbal Ability</h4>
              </div>
              <ul className="space-y-4">
                {[
                  "Read the question BEFORE the reading comprehension passage.",
                  "Focus on subject-verb agreement and pronoun-antecedent.",
                  "Expand vocabulary through context, not just memorization.",
                  "Watch out for 'absolute' words (Always, Never, Only).",
                  "Understand the structure of standard business English."
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-blue-800 font-medium">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* General Info */}
            <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">⚖️</span>
                <h4 className="text-xl font-black text-amber-900">General Information</h4>
              </div>
              <ul className="space-y-4">
                {[
                  "Focus heavily on the Code of Conduct (RA 6713).",
                  "Memorize the Three Branches of Government.",
                  "Review current events from the last 6 months.",
                  "Understand environmental protection laws briefly.",
                  "Know the basic rights in the 1987 Constitution."
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-amber-800 font-medium">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Warning Section */}
        <section className="bg-red-50 rounded-[2rem] p-8 md:p-10 border border-red-100">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl">⚠️</span>
            <h3 className="text-2xl font-black text-red-900 uppercase tracking-tighter">Common Mistakes</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Overthinking simple math problems",
              "Ignoring the 'Except' or 'Not' in questions",
              "Misaligning the shading paper",
              "Spending 5+ minutes on one difficult item",
              "Changing correct answers at the last minute",
              "Skipping breakfast on exam day"
            ].map((pitfall, i) => (
              <div key={i} className="flex items-center gap-3 text-red-700 font-bold text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                {pitfall}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StrategiesView;
