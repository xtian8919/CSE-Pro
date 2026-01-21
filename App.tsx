
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Category, Question, QuizResults, AppView, ReviewerNote } from './types';
import { fetchQuestions, fetchReviewerNotes } from './geminiService';
import QuestionCard from './components/QuestionCard';
import ResultsView from './components/ResultsView';
import ReviewerView from './components/ReviewerView';
import StrategiesView from './components/StrategiesView';

const FULL_MOCK_TIME = (3 * 3600) + (10 * 60); // 3h 10m
const SUBTEST_TIME = 60 * 60; // 1 hour for 50 items

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [reviewUnansweredOnly, setReviewUnansweredOnly] = useState(false);
  const [currentTestConfig, setCurrentTestConfig] = useState<{ count: number, category?: Category } | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState<ReviewerNote[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  const calculateResults = useCallback(() => {
    setIsFinished(true);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }
  }, []);

  const startTest = async (count: number, category?: Category) => {
    setView('test');
    setIsLoading(true);
    setError(null);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsFinished(false);
    setShowFeedback(false);
    setIsNavOpen(false);
    setReviewUnansweredOnly(false);
    setCurrentTestConfig({ count, category });
    
    setLoadingMessage(category ? `Preparing ${category} Test...` : "Preparing Professional Mock Exam...");
    
    try {
      const data = await fetchQuestions(count, category);
      setQuestions(data);
      
      const duration = category ? SUBTEST_TIME : FULL_MOCK_TIME;
      setTimeLeft(duration);
      
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current !== null) window.clearInterval(timerRef.current);
            calculateResults();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError("Failed to load items. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewer = async () => {
    setView('reviewer');
    if (reviewerNotes.length > 0) return;
    
    setIsLoading(true);
    setLoadingMessage("Generating Reviewer Notes for 2026...");
    try {
      const notes = await fetchReviewerNotes();
      setReviewerNotes(notes);
    } catch (err) {
      setError("Failed to generate notes.");
    } finally {
      setIsLoading(false);
    }
  };

  const findNextAvailable = (direction: 'forward' | 'backward', startIdx: number): number | null => {
    let i = startIdx + (direction === 'forward' ? 1 : -1);
    while (i >= 0 && i < questions.length) {
      if (!reviewUnansweredOnly || userAnswers[questions[i].id] === undefined) {
        return i;
      }
      i += (direction === 'forward' ? 1 : -1);
    }
    return null;
  };

  const handleNext = () => {
    const nextIdx = findNextAvailable('forward', currentIndex);
    if (nextIdx !== null) {
      setCurrentIndex(nextIdx);
      setShowFeedback(false);
    } else if (!reviewUnansweredOnly && currentIndex === questions.length - 1) {
      calculateResults();
    }
  };

  const handlePrev = () => {
    const prevIdx = findNextAvailable('backward', currentIndex);
    if (prevIdx !== null) {
      setCurrentIndex(prevIdx);
      setShowFeedback(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (showFeedback) return;
    setUserAnswers(prev => ({ ...prev, [questions[currentIndex].id]: optionIndex }));
  };

  const getResults = (): QuizResults => {
    let totalCorrect = 0;
    const categoryBreakdown: Record<Category, { score: number; total: number; percentage: number }> = {
      [Category.VERBAL]: { score: 0, total: 0, percentage: 0 },
      [Category.ANALYTICAL]: { score: 0, total: 0, percentage: 0 },
      [Category.NUMERICAL]: { score: 0, total: 0, percentage: 0 },
      [Category.GENERAL_INFO]: { score: 0, total: 0, percentage: 0 },
    };

    questions.forEach(q => {
      categoryBreakdown[q.category].total += 1;
      if (userAnswers[q.id] === q.correctAnswer) {
        totalCorrect += 1;
        categoryBreakdown[q.category].score += 1;
      }
    });

    Object.values(Category).forEach(cat => {
      const stats = categoryBreakdown[cat];
      stats.percentage = stats.total > 0 ? (stats.score / stats.total) * 100 : 0;
    });

    let weightedRating = 0;
    const isSubtest = !!currentTestConfig?.category;

    if (isSubtest) {
      weightedRating = (totalCorrect / questions.length) * 100;
    } else {
      weightedRating = 
        (categoryBreakdown[Category.VERBAL].percentage * 0.30) +
        (categoryBreakdown[Category.ANALYTICAL].percentage * 0.35) +
        (categoryBreakdown[Category.NUMERICAL].percentage * 0.30) +
        (categoryBreakdown[Category.GENERAL_INFO].percentage * 0.05);
    }

    return {
      score: totalCorrect,
      total: questions.length,
      weightedRating: Number(weightedRating.toFixed(2)),
      categoryBreakdown,
      isSubtest,
      subtestCategory: currentTestConfig?.category
    };
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{loadingMessage}</h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">This may take a moment while our AI prepares challenging 2026-standard items.</p>
      </div>
    );
  }

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200 py-6 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">CSE</div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Advance CSE: Professional <span className="text-blue-600">2026</span></h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ultimate Civil Service Reviewer</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Select Your Study Mode</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Comprehensive practice tools designed for the 2026 Professional Level Examination. Aim for 80% to pass!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Full Mock Test */}
            <button 
              onClick={() => startTest(170)}
              className="group relative bg-slate-900 p-8 rounded-[2rem] text-left transition-all hover:scale-[1.02] hover:shadow-2xl overflow-hidden md:col-span-2 lg:col-span-1"
            >
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase mb-4">Elite Mode</span>
                <h3 className="text-3xl font-black text-white mb-2">Practice Test</h3>
                <p className="text-slate-400 text-sm mb-6">Full 170-item professional mock exam with weighted scoring (3h 10m).</p>
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                  Start Mock Exam <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7" /></svg>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10 text-white text-8xl font-black select-none group-hover:rotate-12 transition-transform">170</div>
            </button>

            {/* Category Tests */}
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <button onClick={() => startTest(50, Category.NUMERICAL)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">🔢</div>
                <h4 className="font-black text-slate-800">Numerical</h4>
                <p className="text-xs text-slate-400">50 items • Math & Logic</p>
              </button>
              
              <button onClick={() => startTest(50, Category.ANALYTICAL)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">🧠</div>
                <h4 className="font-black text-slate-800">Analytical</h4>
                <p className="text-xs text-slate-400">50 items • Reasoning</p>
              </button>

              <button onClick={() => startTest(50, Category.VERBAL)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">✍️</div>
                <h4 className="font-black text-slate-800">Verbal</h4>
                <p className="text-xs text-slate-400">50 items • Language</p>
              </button>

              <button onClick={() => startTest(50, Category.GENERAL_INFO)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors">⚖️</div>
                <h4 className="font-black text-slate-800">General Info</h4>
                <p className="text-xs text-slate-400">50 items • Constitution/RA 6713</p>
              </button>
            </div>

            {/* Reviewer Notes */}
            <button 
              onClick={openReviewer}
              className="bg-blue-600 p-8 rounded-[2rem] text-left transition-all hover:scale-[1.02] hover:shadow-2xl overflow-hidden group"
            >
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-2">Reviewer Notes</h3>
                <p className="text-blue-100 text-sm mb-6">Key concepts, strategies, and formulas for the 2026 Exam.</p>
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                  Open Study Guide <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7" /></svg>
                </div>
              </div>
            </button>

            {/* Strategies Guide */}
            <button 
              onClick={() => setView('strategies')}
              className="bg-slate-800 p-8 rounded-[2rem] text-left transition-all hover:scale-[1.02] hover:shadow-2xl overflow-hidden group lg:col-span-2"
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">📘 Strategies to Pass the CSE</h3>
                  <p className="text-slate-400 text-sm">Master the art of answering each category under time pressure. Expert-level tips for 2026.</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                  Read Strategies <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7" /></svg>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-10 text-white text-[8rem] font-black select-none leading-none group-hover:rotate-6 transition-transform">🎯</div>
            </button>
          </div>
          
          <div className="mt-12 p-8 bg-blue-50 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border border-blue-100">
             <div className="max-w-md">
                <h5 className="text-blue-600 font-black uppercase tracking-widest text-xs mb-2">Pro Tip</h5>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Passing is 80%</h4>
                <p className="text-slate-600 text-sm">Focus your efforts on Analytical, Numerical and Verbal sections, which collectively account for 95% of your final weighted rating.</p>
             </div>
             <div className="flex gap-4">
                <div className="text-center bg-white p-4 rounded-3xl w-24 border border-blue-100">
                   <p className="text-2xl font-black text-blue-600">30%</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Verbal</p>
                </div>
                <div className="text-center bg-white p-4 rounded-3xl w-24 border border-blue-100">
                   <p className="text-2xl font-black text-purple-600">35%</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Analytical</p>
                </div>
                <div className="text-center bg-white p-4 rounded-3xl w-24 border border-blue-100">
                   <p className="text-2xl font-black text-emerald-600">30%</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Numerical</p>
                </div>
                 <div className="text-center bg-white p-4 rounded-3xl w-24 border border-blue-100">
                   <p className="text-2xl font-black text-orange-600">5%</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Gen Info</p>
                </div>
             </div>
          </div>
        </main>
        
        <footer className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
           &copy; 2026 Civil Service Eligibility • Practice Mock App
        </footer>
      </div>
    );
  }

  if (view === 'reviewer') {
    return <ReviewerView notes={reviewerNotes} onBack={() => setView('menu')} />;
  }

  if (view === 'strategies') {
    return <StrategiesView onBack={() => setView('menu')} />;
  }

  if (isFinished) {
    return (
      <ResultsView 
        results={getResults()} 
        onRestart={() => startTest(currentTestConfig?.count || 170, currentTestConfig?.category)} 
        onHome={() => setView('menu')}
        questions={questions} 
        userAnswers={userAnswers} 
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isTimeLow = timeLeft < (15 * 60);
  const unansweredCount = questions.length - Object.keys(userAnswers).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 py-3 md:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { if(confirm("End test and return to menu?")) setView('menu'); }} className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black hover:bg-slate-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="hidden sm:block">
              <h1 className="font-bold text-slate-800 leading-none">
                {currentTestConfig?.category ? `${currentTestConfig.category} Set` : "Professional Mock Exam"}
              </h1>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Items: {questions.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isTimeLow ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs md:text-sm font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>

            <div className="text-right hidden md:block w-32">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Progress: {currentIndex + 1}/{questions.length}</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <button onClick={calculateResults} className="px-5 py-2 bg-slate-900 text-white text-xs font-black rounded-lg hover:bg-black transition-colors uppercase tracking-widest">Submit</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 md:pt-10">
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative">
          <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
             <button 
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase flex items-center gap-1"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
               Jump to Item
             </button>
             <label className="flex items-center gap-2 cursor-pointer group">
                <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-blue-600 transition-colors">Skip Answered</span>
                <input 
                  type="checkbox" 
                  checked={reviewUnansweredOnly}
                  onChange={(e) => setReviewUnansweredOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-all"
                />
             </label>
          </div>

          {isNavOpen && (
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentIndex(idx); setIsNavOpen(false); }}
                    className={`aspect-square text-[10px] font-bold rounded-lg flex items-center justify-center border transition-all ${
                      currentIndex === idx ? 'bg-blue-600 text-white border-blue-600 scale-110 z-10 shadow-lg shadow-blue-200' : 
                      userAnswers[questions[idx].id] !== undefined ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <QuestionCard
            question={currentQuestion}
            itemNumber={currentIndex + 1}
            totalItems={questions.length}
            selectedOption={userAnswers[currentQuestion.id] ?? null}
            onSelect={handleSelectOption}
            showFeedback={showFeedback}
          />

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button 
                disabled={currentIndex === 0 && (!reviewUnansweredOnly || findNextAvailable('backward', currentIndex) === null)} 
                onClick={handlePrev} 
                className="flex-1 sm:flex-none px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-colors text-sm uppercase flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              
              <button 
                disabled={currentIndex === questions.length - 1 && (!reviewUnansweredOnly || findNextAvailable('forward', currentIndex) === null)}
                onClick={handleNext}
                className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm uppercase flex items-center justify-center gap-2"
              >
                Skip
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>

              <button 
                onClick={() => setShowFeedback(!showFeedback)} 
                className={`flex-1 sm:flex-none px-6 py-3 font-bold rounded-xl text-sm uppercase transition-all ${showFeedback ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-400 border border-slate-200'}`}
              >
                {showFeedback ? 'Hide Hint' : 'Hint'}
              </button>
            </div>

            <button 
              disabled={userAnswers[currentQuestion.id] === undefined} 
              onClick={handleNext} 
              className="w-full sm:w-auto px-12 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg uppercase text-sm tracking-widest flex items-center justify-center gap-2"
            >
              {currentIndex === questions.length - 1 && !reviewUnansweredOnly ? 'Submit Set' : 'Next Item'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Answered</p>
             <p className="text-xl font-black text-slate-800">{Object.keys(userAnswers).length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Remaining</p>
             <p className="text-xl font-black text-blue-600">{unansweredCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center col-span-2 shadow-sm">
             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Goal Score</p>
             <p className="text-xl font-black text-green-600">80.00%</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
