
import React from 'react';
import { ReviewerNote, Category } from '../types';
import { jsPDF } from 'jspdf';

interface ReviewerViewProps {
  notes: ReviewerNote[];
  onBack: () => void;
}

const ReviewerView: React.FC<ReviewerViewProps> = ({ notes, onBack }) => {
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(22);
    doc.text('CSE Practice Test: Professional: 2026 Reviewer Notes', 14, y);
    y += 15;

    notes.forEach((note) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(16);
      doc.setTextColor(37, 99, 235);
      doc.text(note.category, 14, y);
      y += 8;

      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.text(note.title, 14, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      note.content.forEach((point) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const splitText = doc.splitTextToSize(`• ${point}`, 180);
        doc.text(splitText, 14, y);
        y += splitText.length * 6;
      });
      y += 10;
    });

    doc.save('CSE_2026_Reviewer_Notes.pdf');
  };

  const getIcon = (cat: Category) => {
    switch(cat) {
      case Category.NUMERICAL: return "🔢";
      case Category.ANALYTICAL: return "🧠";
      case Category.VERBAL: return "✍️";
      case Category.GENERAL_INFO: return "⚖️";
      default: return "📄";
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={onBack} className="text-blue-600 font-bold flex items-center gap-2 hover:underline mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to Menu
          </button>
          <h1 className="text-3xl font-black text-slate-900">Reviewer Notes 2026</h1>
        </div>
        <button
          onClick={downloadPDF}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-black rounded-2xl transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Download PDF
        </button>
      </div>

      <div className="space-y-8">
        {notes.map((note, idx) => (
          <div key={idx} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center gap-4">
              <span className="text-4xl">{getIcon(note.category)}</span>
              <div>
                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{note.category}</span>
                <h3 className="text-xl font-bold text-slate-800">{note.title}</h3>
              </div>
            </div>
            <div className="p-8">
              <ul className="space-y-4">
                {note.content.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-4">
                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                    <p className="text-slate-600 leading-relaxed">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewerView;
