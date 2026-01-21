
import React, { useState } from 'react';
import { QuizResults, Category, Question } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ResultsViewProps {
  results: QuizResults;
  onRestart: () => void;
  onHome: () => void;
  questions: Question[];
  userAnswers: Record<string, number>;
}

const ResultsView: React.FC<ResultsViewProps> = ({ results, onRestart, onHome, questions, userAnswers }) => {
  const [showCorrections, setShowCorrections] = useState(false);
  const isPassed = results.weightedRating >= 80.00;
  
  const COLORS = {
    [Category.VERBAL]: '#3b82f6',
    [Category.ANALYTICAL]: '#8b5cf6',
    [Category.NUMERICAL]: '#10b981',
    [Category.GENERAL_INFO]: '#f59e0b',
  };

  const CATEGORY_WEIGHTS = {
    [Category.VERBAL]: '30%',
    [Category.ANALYTICAL]: '35%',
    [Category.NUMERICAL]: '30%',
    [Category.GENERAL_INFO]: '5%',
  };

  const getMasteryLevel = (percentage: number) => {
    if (percentage >= 90) return { label: 'Expert', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (percentage >= 80) return { label: 'Proficient', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 60) return { label: 'Developing', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const downloadPDF = async () => {
    const doc = new jsPDF() as any;
    
    doc.setFontSize(22);
    doc.setTextColor(51, 65, 85);
    doc.text('CSE Hero: Official 2026 Mock Results', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`Rating: ${results.weightedRating.toFixed(2)}% - ${isPassed ? 'PASSED' : 'FAILED'}`, 14, 40);
    doc.text(`Raw Score: ${results.score} / ${results.total}`, 14, 48);

    const tableData = questions.map((q, idx) => {
      const userIdx = userAnswers[q.id];
      const userChoice = userIdx !== undefined ? String.fromCharCode(65 + userIdx) : 'SKIPPED';
      const correctChoice = String.fromCharCode(65 + q.correctAnswer);
      const status = userIdx === q.correctAnswer ? 'CORRECT' : 'INCORRECT';
      
      return [
        idx + 1,
        q.category,
        userChoice,
        correctChoice,
        status,
        q.explanation
      ];
    });

    doc.autoTable({
      startY: 55,
      head: [['#', 'Category', 'Your Answer', 'Correct', 'Status', 'Explanation']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25 },
        5: { cellWidth: 'auto' },
      },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`CSE_2026_Result_${results.weightedRating.toFixed(0)}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center mb-16 no-print">
        <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4">
          Examination Summary
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Performance Report</h1>
        <p className="text-slate-500 font-medium">Professional Level • Series 2026 • CSE-MOCK-PR</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Main Result Card */}
        <div className={`lg:col-span-1 bg-white p-12 rounded-[3rem] shadow-2xl border-b-[12px] flex flex-col items-center justify-center text-center transition-all ${isPassed ? 'border-emerald-500 shadow-emerald-100' : 'border-red-500 shadow-red-100'}`}>
          <div className="mb-8">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Final Weighted Rating</p>
            <div className="relative inline-block">
               <h2 className={`text-8xl font-black ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                {results.weightedRating.toFixed(1)}<span className="text-3xl font-bold">%</span>
              </h2>
              <div className={`absolute -right-4 -top-4 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {isPassed ? '✓' : '✕'}
              </div>
            </div>
          </div>
          
          <div className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-[0.3em] text-xl mb-8 ${isPassed ? 'bg-emerald-600 shadow-lg shadow-emerald-200' : 'bg-red-600 shadow-lg shadow-red-200'}`}>
            {isPassed ? 'PASSED' : 'FAILED'}
          </div>

          <p className="text-slate-500 font-medium leading-relaxed">
            {isPassed 
              ? "Congratulations! You have surpassed the 80% eligibility threshold. Your current trajectory suggests a high probability of passing the actual 2026 CSE." 
              : "A minimum rating of 80% is mandatory. Do not be discouraged; use the breakdown below to target your weakest categories."}
          </p>
          
          <div className="mt-10 grid grid-cols-2 gap-4 w-full pt-8 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Raw Score</p>
              <p className="text-xl font-black text-slate-800">{results.score} / {results.total}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Time Used</p>
              <p className="text-xl font-black text-slate-800">1:42:05</p>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">Category Proficiency</h3>
              <p className="text-sm text-slate-400">Detailed breakdown by sub-test category</p>
            </div>
            <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block mb-1 uppercase">Goal</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-black text-sm">80.0%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {Object.keys(results.categoryBreakdown).map((categoryKey) => {
              const category = categoryKey as Category;
              const data = results.categoryBreakdown[category];
              if (data.total === 0) return null;
              const mastery = getMasteryLevel(data.percentage);
              
              return (
                <div key={category} className="group">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="text-sm font-black text-slate-800 block">{category}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${mastery.bg} ${mastery.color}`}>
                        {mastery.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900">{data.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative shadow-inner">
                    <div 
                      className="h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                      style={{ 
                        width: `${data.percentage}%`,
                        backgroundColor: COLORS[category]
                      }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Weight: {CATEGORY_WEIGHTS[category]}</span>
                     <span className="text-[10px] font-bold text-slate-500">{data.score}/{data.total} items</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                AI Analysis & Recommendation
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed italic">
                {results.weightedRating >= 80 
                  ? "Your performance is balanced. Recommendation: Focus on speed drills for Numerical Ability to save more time for the Analytical section in the actual exam."
                  : "Critical intervention needed in Numerical and Analytical categories. These two alone account for 65% of your rating. Focus on formula mastery and logic puzzles."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 no-print">
        <div className="flex flex-wrap justify-center gap-4 w-full">
          <button
            onClick={onHome}
            className="flex-1 max-w-[240px] py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
          >
            Exit to Dashboard
          </button>
          <button
            onClick={onRestart}
            className="flex-1 max-w-[240px] py-5 border-2 border-slate-900 text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
          >
            Retake Mock Set
          </button>
          <button
            onClick={() => setShowCorrections(!showCorrections)}
            className="flex-1 max-w-[240px] py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
          >
            {showCorrections ? 'Close Review' : 'Review Correction'}
          </button>
        </div>
      </div>

      {showCorrections && (
        <div className="mt-16 bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-12 duration-700">
          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900">Key to Corrections</h2>
              <p className="text-slate-500 font-medium">Detailed pedagogical explanation for every item</p>
            </div>
            <button
              onClick={downloadPDF}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl transition-all flex items-center gap-3 uppercase tracking-[0.2em] shadow-lg shadow-emerald-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export to PDF
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[900px] overflow-y-auto">
            {questions.map((q, idx) => {
              const userIdx = userAnswers[q.id];
              const isCorrect = userIdx === q.correctAnswer;
              const isSkipped = userIdx === undefined;
              
              return (
                <div key={q.id} className={`p-8 md:p-12 transition-colors hover:bg-slate-50 ${!isCorrect && !isSkipped ? 'bg-red-50/20' : isSkipped ? 'bg-slate-50/30' : ''}`}>
                  <div className="flex items-start gap-6">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm ${isCorrect ? 'bg-emerald-100 text-emerald-700' : isSkipped ? 'bg-slate-100 text-slate-400' : 'bg-red-100 text-red-700'}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">{q.category}</span>
                        {!isCorrect && !isSkipped && (
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Incorrect</span>
                        )}
                        {isCorrect && (
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Correct</span>
                        )}
                        {isSkipped && (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Skipped</span>
                        )}
                      </div>
                      <p className="text-xl text-slate-800 font-bold mb-6 leading-relaxed">{q.text}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}>
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {String.fromCharCode(65 + q.correctAnswer)}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{q.options[q.correctAnswer]}</span>
                        </div>
                        {userIdx !== undefined && !isCorrect && (
                          <div className="p-4 rounded-2xl border-2 border-red-200 bg-red-50/50 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">
                              {String.fromCharCode(65 + userIdx)}
                            </span>
                            <span className="text-sm font-bold text-red-800">{q.options[userIdx]}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900 p-6 rounded-[2rem] text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] text-blue-400 uppercase font-black tracking-[0.2em] mb-2">Pedagogical Rationale</p>
                            <p className="text-sm text-slate-300 italic leading-relaxed font-medium">{q.explanation}</p>
                        </div>
                        <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;
