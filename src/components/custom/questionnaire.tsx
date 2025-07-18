import React, { useState } from 'react';

export type Question =
  | { type: 'radio'; label: string; name: string; options: string[] }
  | { type: 'checkbox'; label: string; name: string; options: string[] }
  | { type: 'text'; label: string; name: string };

export interface QuestionnaireProps {
  questions: Question[];
  onSubmit: (result: Record<string, any>) => void;
  submitText?: string;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ questions, onSubmit, submitText = 'Submit' }) => {
  const [form, setForm] = useState<Record<string, any>>({});

  const handleChange = (name: string, value: any, type: string) => {
    if (type === 'checkbox') {
      setForm(prev => {
        const arr = prev[name] || [];
        if (arr.includes(value)) {
          return { ...prev, [name]: arr.filter((v: string) => v !== value) };
        } else {
          return { ...prev, [name]: [...arr, value] };
        }
      });
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      {questions.map((q, idx) => (
        <div key={q.name} className="bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col gap-2">
          <div className="font-semibold text-base md:text-lg text-gray-800 mb-1 flex items-start gap-2">
            <span className="inline-block font-bold text-blue-600">{idx + 1}.</span> {q.label}
          </div>
          {q.type === 'radio' && (
            <div className="flex flex-col gap-2 mt-1">
              {q.options.map(opt => (
                <label
                  key={opt}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border border-transparent hover:bg-blue-50 ${form[q.name] === opt ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : ''}`}
                >
                  <input
                    type="radio"
                    name={q.name}
                    value={opt}
                    checked={form[q.name] === opt}
                    onChange={() => handleChange(q.name, opt, 'radio')}
                    className="accent-blue-500 w-4 h-4"
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === 'checkbox' && (
            <div className="flex flex-col gap-2 mt-1">
              {q.options.map(opt => (
                <label
                  key={opt}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border border-transparent hover:bg-blue-50 ${Array.isArray(form[q.name]) && form[q.name].includes(opt) ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : ''}`}
                >
                  <input
                    type="checkbox"
                    name={q.name}
                    value={opt}
                    checked={Array.isArray(form[q.name]) && form[q.name].includes(opt)}
                    onChange={() => handleChange(q.name, opt, 'checkbox')}
                    className="accent-blue-500 w-4 h-4"
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === 'text' && (
            <textarea
              className="border rounded w-full p-2 mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[60px]"
              value={form[q.name] || ''}
              onChange={e => handleChange(q.name, e.target.value, 'text')}
              rows={3}
              placeholder="Your answer..."
            />
          )}
        </div>
      ))}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition focus-visible:ring-2 focus-visible:ring-blue-400 focus:outline-none"
        >
          {submitText}
        </button>
      </div>
    </form>
  );
};

export default Questionnaire; 