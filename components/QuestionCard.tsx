
import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  itemNumber: number;
  totalItems: number;
  selectedOption: number | null;
  onSelect: (index: number) => void;
  showFeedback?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  itemNumber,
  totalItems,
  selectedOption, 
  onSelect,
  showFeedback = false
}) => {
  const getOptionClasses = (index: number) => {
    const base = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ";
    
    if (showFeedback) {
      if (index === question.correctAnswer) {
        return base + "border-green-500 bg-green-50 text-green-800";
      }
      if (selectedOption === index && index !== question.correctAnswer) {
        return base + "border-red-500 bg-red-50 text-red-800";
      }
      return base + "border-slate-100 bg-slate-50 text-slate-400 opacity-60";
    }

    if (selectedOption === index) {
      return base + "border-blue-600 bg-blue-50 text-blue-700 shadow-sm";
    }

    return base + "border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-700";
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
            {question.category}
          </span>
          <span className="text-sm font-bold text-slate-400">
            ITEM {itemNumber} OF {totalItems}
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed">
          <span className="text-blue-600 mr-2">{itemNumber}.</span> {question.text}
        </h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            disabled={showFeedback}
            onClick={() => onSelect(index)}
            className={getOptionClasses(index)}
          >
            <span className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold flex-shrink-0 ${
              selectedOption === index ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'
            }`}>
              {String.fromCharCode(65 + index)}
            </span>
            <span className="text-md font-medium">{option}</span>
          </button>
        ))}
      </div>

      {showFeedback && (
        <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Explanation</h4>
          <p className="text-slate-700 leading-relaxed italic">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

export default QuestionCard;
