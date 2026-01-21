
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    setLoadingMessage(category ? `Curating ${category} drills...` : "Simulating Professional Mock Exam...");
    
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
      setError("Failed to generate items. Please check your API configuration.");
      setView('menu');
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewer = async () => {
    setView('reviewer');
    if (reviewerNotes.length > 0) return;
    
    setIsLoading(true);
    setLoadingMessage("Synthesizing 2026 Core Syllabus...");
    try {
      const notes = await fetchReviewerNotes();
      setReviewerNotes(notes);
    } catch (err) {
      setError("Failed to generate study notes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
    } else {
      calculateResults();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <div className="relative w-32 h-32 mb-12">
          <div className="absolute inset-0 border-8 border-slate-100 rounded-[2rem]"></div>
          <div className="absolute inset-0 border-8 border-blue-600 rounded-[2rem] border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-xs font-black text-blue-600 animate-pulse">CSE</span>
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3">{loadingMessage}</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">Our AI is drafting 2026-standard items based on the latest Civil Service Commission syllabus.</p>
      </div>
    );
  }

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
        <header className="bg-white border-b border-slate-200 py-6 px-6 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-slate-200">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  CSC Professional <span className="text-blue-600 px-2 py-0.5 bg-blue-50 rounded-lg text-lg">2026</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ultimate AI-Powered Preparatory Platform</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Current Session</p>
                  <p className="text-sm font-bold text-slate-800">Guest Candidate</p>
               </div>
               <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200"></div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl shadow-slate-200 relative overflow-hidden group">
                 <div className="relative z-10">
                    <span className="inline-block px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest mb-6">Simulation Engine</span>
                    <h2 className="text-5xl font-black text-slate-900 mb-6 leading-[1.1]">Full Mock <span className="text-blue-600">Professional</span> Examination</h2>
                    <p className="text-slate-500 text-lg mb-10 max-w-xl leading-relaxed">Experience the full 170-item test under realistic time pressure. Featuring weighted scoring across all 4 syllabus categories.</p>
                    <button 
                      onClick={() => startTest(170)}
                      className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all hover:scale-105 shadow-xl flex items-center gap-4 uppercase tracking-[0.2em] text-sm"
                    >
                      Initialize Mock Exam
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" /></svg>
                    </button>
                 </div>
                 <div className="absolute -right-16 -top-16 opacity-[0.03] text-slate-900 text-[20rem] font-black select-none pointer-events-none group-hover:rotate-6 transition-transform">170</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <button onClick={openReviewer} className="bg-blue-600 p-8 rounded-[3rem] text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-200 group relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black text-white mb-2">Smart Syllabus</h3>
                      <p className="text-blue-100 text-sm mb-8 leading-relaxed">Access key concepts, RA 6713 summaries, and math shortcuts tailored for the 2026 exam.</p>
                      <span className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Launch Reviewer <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></span>
                    </div>
                    <div className="absolute right-0 bottom-0 p-4 opacity-10 text-white text-9xl font-black">📖</div>
                 </button>

                 <button onClick={() => setView('strategies')} className="bg-white p-8 rounded-[3rem] border border-slate-200 text-left transition-all hover:scale-[1.02] hover:shadow-xl group relative overflow-hidden shadow-sm">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Tactical Guide</h3>
                      <p className="text-slate-400 text-sm mb-8 leading-relaxed">Master the "Elimination Rule" and time management techniques used by top-tier candidates.</p>
                      <span className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Read Strategies <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></span>
                    </div>
                    <div className="absolute right-0 bottom-0 p-4 opacity-5 text-slate-900 text-9xl font-black">🎯</div>
                 </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
                  <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6">Targeted Drills</h4>
                  <div className="space-y-4">
                     {[
                       { cat: Category.NUMERICAL, emoji: "🔢", color: "text-emerald-400" },
                       { cat: Category.ANALYTICAL, emoji: "🧠", color: "text-purple-400" },
                       { cat: Category.VERBAL, emoji: "✍️", color: "text-blue-400" },
                       { cat: Category.GENERAL_INFO, emoji: "⚖️", color: "text-amber-400" }
                     ].map((item) => (
                       <button 
                        key={item.cat}
                        onClick={() => startTest(50, item.cat)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
                       >
                          <div className="flex items-center gap-4">
                             <span className="text-2xl">{item.emoji}</span>
                             <div className="text-left">
                                <p className="font-bold text-slate-100 group-hover:text-white transition-colors">{item.cat}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">50 Focused Items</p>
                             </div>
                          </div>
                          <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                       </button>
                     ))}
                  </div>
               </div>

               <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100">
                  <h5 className="text-emerald-700 font-black uppercase tracking-widest text-[10px] mb-4">Passing Probability</h5>
                  <div className="flex items-end gap-3 mb-6">
                     <span className="text-5xl font-black text-emerald-600">80.0</span>
                     <span className="text-xl font-bold text-emerald-400 mb-2">%</span>
                  </div>
                  <p className="text-emerald-900/70 text-sm leading-relaxed font-medium">This is the minimum required rating. Statistics show that aiming for 85% in mock tests ensures success on the actual exam day.</p>
               </div>
            </div>
          </div>
        </main>
        
        <footer className="py-12 px-6 border-t border-slate-200 bg-white">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">&copy; 2026 Civil Service Eligibility AI Preparatory App</p>
              <div className="flex gap-8">
                 <a href="#" className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors">Privacy Policy</a>
                 <a href="#" className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors">Exam Guidelines</a>
                 <a href="#" className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors">Support</a>
              </div>
           </div>
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

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans selection:bg-blue-100">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { if(confirm("Discard current progress and exit?")) setView('menu'); }} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="hidden sm:block">
              <h1 className="font-black text-slate-900 tracking-tight">
                {currentTestConfig?.category ? `${currentTestConfig.category} Drills` : "Professional Mock Series"}
              </h1>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Active Session • Item {currentIndex + 1} of {questions.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all ${isTimeLow ? 'bg-red-50 border-red-200 text-red-600 animate-pulse scale-105' : 'bg-slate-900 border-slate-800 text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-lg font-black font-mono tracking-tighter">{formatTime(timeLeft)}</span>
            </div>
            <button onClick={calculateResults} className="px-8 py-3 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-[0.2em] shadow-lg shadow-blue-100">End & Score</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        <div className="mb-10 w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
           <div className="h-full bg-blue-600 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl shadow-slate-200 border border-slate-100 relative">
          <div className="absolute top-10 right-10">
             <button 
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest flex items-center gap-2 rounded-xl border border-slate-100"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
               Jump To
             </button>
          </div>

          {isNavOpen && (
            <div className="mb-12 p-10 bg-slate-50 rounded-[3rem] border border-slate-200 max-h-72 overflow-y-auto animate-in slide-in-from-top-4 duration-500">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Answer Navigator</h4>
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-3">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentIndex(idx); setIsNavOpen(false); }}
                    className={`aspect-square text-[10px] font-black rounded-xl flex items-center justify-center border-2 transition-all ${
                      currentIndex === idx ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow-xl shadow-blue-200' : 
                      userAnswers[questions[idx].id] !== undefined ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
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

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                disabled={currentIndex === 0} 
                onClick={handlePrev} 
                className="flex-1 sm:flex-none px-10 py-5 bg-white border-2 border-slate-900 text-slate-900 font-black rounded-2xl hover:bg-slate-50 disabled:opacity-30 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                Prev
              </button>
              
              <button 
                onClick={() => setShowFeedback(!showFeedback)} 
                className={`flex-1 sm:flex-none px-10 py-5 font-black rounded-2xl text-xs uppercase tracking-widest transition-all ${showFeedback ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                {showFeedback ? 'Hide Clue' : 'Hint'}
              </button>
            </div>

            <button 
              disabled={userAnswers[currentQuestion.id] === undefined} 
              onClick={handleNext} 
              className="w-full sm:w-auto px-16 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-100 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4"
            >
              {currentIndex === questions.length - 1 ? 'Finish Exam' : 'Next Item'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center shadow-lg shadow-slate-200/50">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Completion</p>
             <p className="text-2xl font-black text-slate-900">{Math.round((Object.keys(userAnswers).length / questions.length) * 100)}%</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center shadow-lg shadow-slate-200/50">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remaining</p>
             <p className="text-2xl font-black text-blue-600">{questions.length - Object.keys(userAnswers).length}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-center md:col-span-2 shadow-lg shadow-slate-200/50 flex flex-col items-center justify-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Session Efficiency</p>
             <div className="w-full h-2 bg-slate-100 rounded-full mt-1 overflow-hidden max-w-[200px]">
                <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
