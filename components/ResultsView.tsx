
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

  const downloadPDF = async () => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(51, 65, 85);
    doc.text('CSE Hero: Key to Corrections', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(results.isSubtest ? `${results.subtestCategory} Specialized Test` : '2026 Civil Service Professional Mock Examination', 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`Overall Rating: ${results.weightedRating.toFixed(2)} (${isPassed ? 'PASSED' : 'FAILED'})`, 14, 40);
    doc.text(`Raw Score: ${results.score} / ${results.total}`, 14, 48);

    const tableData = questions.map((q, idx) => {
      const userIdx = userAnswers[q.id];
      const userChoice = userIdx !== undefined ? String.fromCharCode(65 + userIdx) : 'N/A';
      const correctChoice = String.fromCharCode(65 + q.correctAnswer);
      
      return [
        idx + 1,
        q.category,
        q.text,
        userChoice,
        correctChoice,
        q.explanation
      ];
    });

    doc.autoTable({
      startY: 55,
      head: [['#', 'Category', 'Question', 'User', 'Correct', 'Explanation']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: 'fill', fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 'auto' },
      },
      styles: { fontSize: 8, overflow: 'linebreak' },
    });

    doc.save(`CSE_Hero_2026_Results_${results.weightedRating.toFixed(2)}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in zoom-in-95 duration-500">
      <div className="text-center mb-12 no-print">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Exam Results</h1>
        <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">
          {results.isSubtest ? `${results.subtestCategory} Practice Set` : '2026 Civil Service Professional Mock'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 no-print">
        <div className={`bg-white p-10 rounded-3xl shadow-xl border-4 ${isPassed ? 'border-green-500' : 'border-red-500'} flex flex-col items-center justify-center text-center`}>
          <div className="mb-6">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">
              {results.isSubtest ? 'Score Percentage' : 'Weighted Rating'}
            </span>
            <h2 className={`text-7xl font-black ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {results.weightedRating.toFixed(2)}%
            </h2>
          </div>
          
          <div className={`px-6 py-2 rounded-full text-white font-black uppercase tracking-tighter text-lg ${isPassed ? 'bg-green-600' : 'bg-red-600'}`}>
            {isPassed ? 'PASSED' : 'FAILED'}
          </div>

          <p className="mt-6 text-slate-600 font-medium leading-relaxed italic">
            {isPassed 
              ? `Excellent work! You reached the 80% passing threshold for this ${results.isSubtest ? 'subtest' : 'mock exam'}.` 
              : "A rating of 80% is required for eligibility. Focus on sections where you scored below average to improve your overall weighted rating."}
          </p>
          
          <div className="mt-8 pt-8 border-t border-slate-100 w-full flex justify-center gap-8">
            <p className="text-sm text-slate-500">Correct: <span className="font-bold text-slate-800">{results.score} / {results.total}</span></p>
            <p className="text-sm text-slate-500">Items: <span className="font-bold text-slate-800">{results.total}</span></p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Performance Breakdown</h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Subtest Distribution</p>
          </div>
          
          <div className="space-y-6">
            {Object.keys(results.categoryBreakdown).map((categoryKey) => {
              const category = categoryKey as Category;
              const data = results.categoryBreakdown[category];
              if (data.total === 0) return null;
              
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{category}</span>
                      {!results.isSubtest && (
                        <span className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">
                          Weight: {CATEGORY_WEIGHTS[category]}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">{data.percentage.toFixed(1)}%</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{data.score}/{data.total} items</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${data.percentage}%`,
                        backgroundColor: COLORS[category]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {!results.isSubtest && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Rating Calculation</h4>
              <div className="space-y-1 text-[10px] font-mono text-slate-500 leading-tight">
                <p>(Verbal % × 0.30) + (Analytical % × 0.35) +</p>
                <p>(Numerical % × 0.30) + (Gen. Info % × 0.05)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 no-print">
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={onHome}
            className="flex-1 max-w-xs py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            Main Menu
          </button>
          <button
            onClick={onRestart}
            className="flex-1 max-w-xs py-4 border-2 border-slate-900 text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            Retake Set
          </button>
          <button
            onClick={() => setShowCorrections(!showCorrections)}
            className="flex-1 max-w-xs py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            {showCorrections ? 'Hide Corrections' : 'Key to Corrections'}
          </button>
        </div>
      </div>

      {showCorrections && (
        <div className="mt-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
          <div className="p-8 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Key to Corrections</h2>
              <p className="text-slate-500 text-sm">Detailed explanation for all {results.total} items</p>
            </div>
            <button
              onClick={downloadPDF}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-widest shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Download PDF
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
            {questions.map((q, idx) => {
              const userIdx = userAnswers[q.id];
              const isCorrect = userIdx === q.correctAnswer;
              return (
                <div key={q.id} className={`p-6 md:p-8 hover:bg-slate-50 transition-colors ${!isCorrect && userIdx !== undefined ? 'bg-red-50/30' : ''}`}>
                  <div className="flex items-start gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${isCorrect ? 'bg-green-100 text-green-700' : userIdx === undefined ? 'bg-slate-100 text-slate-400' : 'bg-red-100 text-red-700'}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">{q.category}</span>
                        {!isCorrect && userIdx !== undefined && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">Incorrect</span>
                        )}
                        {isCorrect && (
                          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full">Correct</span>
                        )}
                      </div>
                      <p className="text-slate-800 font-semibold mb-4 leading-relaxed">{q.text}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className={`p-3 rounded-xl border-2 flex items-center gap-3 ${isCorrect ? 'border-green-100 bg-green-50' : 'border-slate-100 bg-white'}`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isCorrect ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                            {String.fromCharCode(65 + q.correctAnswer)}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{q.options[q.correctAnswer]}</span>
                        </div>
                        {userIdx !== undefined && !isCorrect && (
                          <div className="p-3 rounded-xl border-2 border-red-100 bg-red-50 flex items-center gap-3 opacity-80">
                            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {String.fromCharCode(65 + userIdx)}
                            </span>
                            <span className="text-sm font-medium text-red-800 line-through">{q.options[userIdx]}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Explanation</p>
                        <p className="text-sm text-slate-700 italic leading-relaxed">{q.explanation}</p>
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
