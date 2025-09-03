import React, { useState } from 'react';

export interface ImageQuestionnaireProps {
  onSubmit: (result: { circle: string; figure: string }) => void;
  submitText?: string;
}

const ImageQuestionnaire: React.FC<ImageQuestionnaireProps> = ({ onSubmit, submitText = 'Submit' }) => {
  const [circleAnswer, setCircleAnswer] = useState<string>('');
  const [figureAnswer, setFigureAnswer] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ circle: circleAnswer, figure: figureAnswer });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      {/* Circle Question */}
      <div className="bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col gap-2">
        <div className="font-semibold text-base md:text-lg text-gray-800 mb-1 flex items-start gap-2">
          <span className="inline-block font-bold text-blue-600">1.</span> Is the circle still or rotating?
        </div>
        <div className="flex justify-center my-4">
          <img src="static/img1.png" alt="Circle rotation perception test" className="max-w-full h-auto rounded-lg shadow" />
        </div>
        <div className="flex flex-col gap-2 mt-1">
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border border-transparent hover:bg-blue-50 ${circleAnswer === 'quickly' ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : ''}`}
          >
            <input
              type="radio"
              name="circle"
              value="quickly"
              checked={circleAnswer === 'quickly'}
              onChange={() => setCircleAnswer('quickly')}
              className="accent-blue-500 w-4 h-4"
            />
            <span className="text-gray-700">The circle rotates quickly.</span>
          </label>
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border border-transparent hover:bg-blue-50 ${circleAnswer === 'slowly' ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : ''}`}
          >
            <input
              type="radio"
              name="circle"
              value="slowly"
              checked={circleAnswer === 'slowly'}
              onChange={() => setCircleAnswer('slowly')}
              className="accent-blue-500 w-4 h-4"
            />
            <span className="text-gray-700">There is a certain speed, but not very fast.</span>
          </label>
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border border-transparent hover:bg-blue-50 ${circleAnswer === 'still' ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : ''}`}
          >
            <input
              type="radio"
              name="circle"
              value="still"
              checked={circleAnswer === 'still'}
              onChange={() => setCircleAnswer('still')}
              className="accent-blue-500 w-4 h-4"
            />
            <span className="text-gray-700">The circle is still and not rotating.</span>
          </label>
        </div>
      </div>

      {/* Figure Question */}
      <div className="bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col gap-2">
        <div className="font-semibold text-base md:text-lg text-gray-800 mb-1 flex items-start gap-2">
          <span className="inline-block font-bold text-blue-600">2.</span> Is there a girl or witch?
        </div>
        <div className="flex justify-center my-4">
          <img src="static/img2.png" alt="Girl or witch perception test" className="max-w-full h-auto rounded-lg shadow" />
        </div>
        <div className="flex flex-col gap-2 mt-1">
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border border-transparent hover:bg-blue-50 ${figureAnswer === 'girl' ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : ''}`}
          >
            <input
              type="radio"
              name="figure"
              value="girl"
              checked={figureAnswer === 'girl'}
              onChange={() => setFigureAnswer('girl')}
              className="accent-blue-500 w-4 h-4"
            />
            <span className="text-gray-700">I can only see a girl, where is the witch?</span>
          </label>
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border border-transparent hover:bg-blue-50 ${figureAnswer === 'both' ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : ''}`}
          >
            <input
              type="radio"
              name="figure"
              value="both"
              checked={figureAnswer === 'both'}
              onChange={() => setFigureAnswer('both')}
              className="accent-blue-500 w-4 h-4"
            />
            <span className="text-gray-700">I can see both of them.</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button
          type="submit"
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition focus-visible:ring-2 focus-visible:ring-blue-400 focus:outline-none"
          disabled={!circleAnswer || !figureAnswer}
        >
          {submitText}
        </button>
      </div>
    </form>
  );
};

export default ImageQuestionnaire;